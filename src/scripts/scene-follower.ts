import type { Scene } from "../scenes";

type SceneListener = (scene: Scene) => void;

export class SceneFollower {
  current: Scene;
  private readonly scenes: Scene[];
  private readonly headings: (HTMLElement | null)[];
  private readonly passed: boolean[];
  private listener: SceneListener;

  constructor(scenes: Scene[], listener: SceneListener) {
    this.scenes = scenes;
    this.current = scenes[0];
    this.listener = listener;
    this.headings = scenes.map((scene) =>
      document.getElementById(scene.section),
    );
    this.passed = scenes.map(() => false);
    const observer = new IntersectionObserver(
      (entries) => this.update(entries),
      { rootMargin: "0px 0px -66% 0px" },
    );
    for (const heading of this.headings) {
      if (heading) {
        observer.observe(heading);
      }
    }
  }

  follow(listener: SceneListener): void {
    this.listener = listener;
  }

  private update(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      const index = this.headings.indexOf(entry.target as HTMLElement);
      this.passed[index] =
        entry.isIntersecting || entry.boundingClientRect.top < 0;
    }
    const scene = this.scenes[Math.max(0, this.passed.lastIndexOf(true))];
    if (scene === this.current) {
      return;
    }
    this.current = scene;
    this.listener(scene);
  }
}
