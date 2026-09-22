import type { Beat } from "../session";

type BeatListener = (index: number) => void;

export class BeatFollower {
  current: number;
  private readonly sections: (Element | null)[];
  private readonly inTopThird: boolean[];
  private readonly listener: BeatListener;

  constructor(beats: Beat[], current: number, listener: BeatListener) {
    this.current = current;
    this.listener = listener;
    this.sections = beats.map(
      (beat) =>
        document.getElementById(beat.section)?.closest("section") ?? null,
    );
    this.inTopThird = beats.map(() => false);
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

  private update(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      this.inTopThird[this.sections.indexOf(entry.target)] =
        entry.isIntersecting;
    }
    const index = this.inTopThird.lastIndexOf(true);
    if (index === -1 || index === this.current) {
      return;
    }
    this.current = index;
    this.listener(index);
  }
}
