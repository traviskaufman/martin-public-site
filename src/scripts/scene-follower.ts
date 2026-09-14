import type { Scene } from "../scenes";

type SceneListener = (scene: Scene) => void;

export class SceneFollower {
  current: Scene;
  private readonly scenes: Scene[];
  private readonly sections: (Element | null)[];
  private readonly inTopThird: boolean[];
  private listener: SceneListener;

  constructor(scenes: Scene[], listener: SceneListener) {
    this.scenes = scenes;
    this.current = scenes[0];
    this.listener = listener;
    this.sections = scenes.map(
      (scene) =>
        document.getElementById(scene.section)?.closest("section") ?? null,
    );
    this.inTopThird = scenes.map(() => false);
    const observer = new IntersectionObserver(
      (entries) => this.update(entries),
      { rootMargin: "0px 0px -66% 0px" },
    );
    for (const section of this.sections) {
      if (section) {
        observer.observe(section);
      }
    }
  }

  follow(listener: SceneListener): void {
    this.listener = listener;
  }

  private update(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      this.inTopThird[this.sections.indexOf(entry.target)] =
        entry.isIntersecting;
    }
    const index = this.inTopThird.lastIndexOf(true);
    if (index === -1 || this.scenes[index] === this.current) {
      return;
    }
    this.current = this.scenes[index];
    this.listener(this.current);
  }
}
