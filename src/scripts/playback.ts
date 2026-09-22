import type { Beat } from "../session";
import type { TerminalStage } from "./terminal-stage";

const BASE_CHARACTERS_PER_SECOND = 40;
const SPEEDS = [1, 2, 4];
const DEFAULT_SPEED_INDEX = 1;
const FADE_MILLISECONDS = 150;

type Phase = "command" | "transcript" | "done";

export function startPlayback(stage: TerminalStage, beat: number): Playback {
  return new Playback(stage, beat);
}

export class Playback {
  private readonly stage: TerminalStage;
  private readonly beats: Beat[];
  private readonly reducedMotion = matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  private readonly speedButton: HTMLButtonElement;
  private readonly playbackButton: HTMLButtonElement;
  private beat: number;
  private speedIndex = DEFAULT_SPEED_INDEX;
  private phase: Phase = "command";
  private typed = 0;
  private carry = 0;
  private lastTime = 0;
  private frame = 0;

  constructor(stage: TerminalStage, beat: number) {
    this.stage = stage;
    this.beats = stage.beats;
    this.beat = beat;
    const controls = stage.element;
    this.speedButton = controls.querySelector(".speed")!;
    this.playbackButton = controls.querySelector(".playback")!;
    this.speedButton.addEventListener("click", () => this.cycleSpeed());
    this.playbackButton.addEventListener("click", () => this.togglePlayback());
    controls
      .querySelector(".replay")!
      .addEventListener("click", () => this.play(this.beat));
    const opening = this.beats[beat];
    if (opening.continues || opening.transcript) {
      this.play(beat);
    } else {
      this.finish(beat);
    }
  }

  change(index: number): void {
    this.stop();
    const previous = this.beat;
    this.beat = index;
    if (this.reducedMotion) {
      this.finish(index);
    } else if (this.beats[index].session !== this.beats[previous].session) {
      this.fadeThen(() => this.play(index));
    } else if (index < previous) {
      this.finish(index);
    } else {
      this.play(index);
    }
  }

  private fadeThen(then: () => void): void {
    const target = this.beat;
    this.stage.element.dataset.transition = "fading";
    setTimeout(() => {
      delete this.stage.element.dataset.transition;
      if (this.beat === target) {
        then();
      }
    }, FADE_MILLISECONDS);
  }

  private play(index: number): void {
    this.stop();
    if (this.reducedMotion) {
      this.finish(index);
      return;
    }
    if (this.beats[index].continues) {
      this.stage.append(index);
      this.phase = "transcript";
    } else {
      this.stage.open(index);
      this.phase = "command";
    }
    this.typed = 0;
    this.carry = 0;
    this.resume();
  }

  private finish(index: number): void {
    this.stage.show(index);
    this.settle();
  }

  private settle(): void {
    this.stage.state = this.beats[this.beat].transcript
      ? "finished"
      : "waiting";
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
      this.play(this.beat);
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
      this.settle();
      return;
    }
    this.frame = requestAnimationFrame((next) => this.tick(next));
  }

  private type(count: number): void {
    const beat = this.beats[this.beat];
    const text = this.phase === "command" ? beat.command : beat.transcript;
    this.typed = Math.min(text.length, this.typed + count);
    const visible = text.slice(0, this.typed);
    if (this.phase === "command") {
      this.stage.typeCommand(visible);
    } else {
      this.stage.typeBeat(visible);
    }
    if (this.typed < text.length) {
      return;
    }
    this.typed = 0;
    if (this.phase === "command" && beat.transcript) {
      this.stage.append(this.beat);
      this.phase = "transcript";
    } else {
      this.phase = "done";
    }
  }
}
