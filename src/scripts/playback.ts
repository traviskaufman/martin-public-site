import type { Scene } from "../scenes";
import type { SceneFollower } from "./scene-follower";
import type { TerminalStage } from "./terminal-stage";

const BASE_CHARACTERS_PER_SECOND = 40;
const SPEEDS = [1, 2, 4];
const DEFAULT_SPEED_INDEX = 1;
const FADE_MILLISECONDS = 150;

type Phase = "command" | "transcript" | "done";

export function startPlayback(
  stage: TerminalStage,
  follower: SceneFollower,
): Playback {
  return new Playback(stage, follower);
}

class Playback {
  private readonly stage: TerminalStage;
  private readonly reducedMotion = matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  private readonly speedButton: HTMLButtonElement;
  private readonly playbackButton: HTMLButtonElement;
  private scene: Scene;
  private speedIndex = DEFAULT_SPEED_INDEX;
  private phase: Phase = "command";
  private typed = 0;
  private carry = 0;
  private lastTime = 0;
  private frame = 0;

  constructor(stage: TerminalStage, follower: SceneFollower) {
    this.stage = stage;
    this.scene = follower.current;
    const controls = stage.element;
    this.speedButton = controls.querySelector(".speed")!;
    this.playbackButton = controls.querySelector(".playback")!;
    this.speedButton.addEventListener("click", () => this.cycleSpeed());
    this.playbackButton.addEventListener("click", () => this.togglePlayback());
    controls
      .querySelector(".replay")!
      .addEventListener("click", () => this.play(this.scene));
    follower.follow((scene) => this.change(scene));
    stage.state = "loading";
    this.play(this.scene);
  }

  private change(scene: Scene): void {
    this.stop();
    this.scene = scene;
    if (this.reducedMotion) {
      this.finish(scene);
      return;
    }
    this.stage.element.dataset.transition = "fading";
    setTimeout(() => {
      delete this.stage.element.dataset.transition;
      if (this.scene === scene) {
        this.play(scene);
      }
    }, FADE_MILLISECONDS);
  }

  private play(scene: Scene): void {
    this.stop();
    if (this.reducedMotion || scene.entry === "finished") {
      this.finish(scene);
      return;
    }
    this.stage.begin(scene);
    this.phase = "command";
    this.typed = 0;
    this.carry = 0;
    this.resume();
  }

  private finish(scene: Scene): void {
    this.stage.show(scene);
    this.stage.state = "finished";
  }

  private resume(): void {
    this.stage.state = "playing";
    this.playbackButton.setAttribute("aria-label", "Pause");
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame((now) => this.tick(now));
  }

  private pause(): void {
    this.stop();
    this.stage.state = "paused";
    this.playbackButton.setAttribute("aria-label", "Play");
  }

  private stop(): void {
    cancelAnimationFrame(this.frame);
  }

  private togglePlayback(): void {
    if (this.stage.state === "playing") {
      this.pause();
    } else if (this.stage.state === "paused") {
      this.resume();
    } else {
      this.play(this.scene);
    }
  }

  private cycleSpeed(): void {
    this.speedIndex = (this.speedIndex + 1) % SPEEDS.length;
    const label = `${SPEEDS[this.speedIndex]}×`;
    this.speedButton.textContent = label;
    this.speedButton.setAttribute("aria-label", `Playback speed, ${label}`);
  }

  private tick(now: number): void {
    const rate = BASE_CHARACTERS_PER_SECOND * SPEEDS[this.speedIndex];
    const budget = this.carry + ((now - this.lastTime) / 1000) * rate;
    const count = Math.floor(budget);
    this.carry = budget - count;
    this.lastTime = now;
    this.type(count);
    if (this.phase === "done") {
      this.stage.state = "finished";
      return;
    }
    this.frame = requestAnimationFrame((next) => this.tick(next));
  }

  private type(count: number): void {
    const text =
      this.phase === "command" ? this.scene.command : this.scene.transcript;
    this.typed = Math.min(text.length, this.typed + count);
    const visible = text.slice(0, this.typed);
    if (this.phase === "command") {
      this.stage.typeCommand(visible);
    } else {
      this.stage.typeTranscript(visible);
    }
    if (this.typed < text.length) {
      return;
    }
    this.phase = this.phase === "command" ? "transcript" : "done";
    this.typed = 0;
  }
}
