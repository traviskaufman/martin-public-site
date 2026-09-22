import { sessionBeats, type Beat } from "../session";

export type TerminalState =
  "static" | "waiting" | "loading" | "playing" | "paused" | "finished";

export class TerminalStage {
  readonly element: HTMLElement;
  readonly beats: Beat[];
  private readonly title: HTMLElement;
  private readonly command: HTMLElement;
  private readonly transcript: HTMLElement;
  private readonly pane: HTMLElement;
  private readonly scrollBehavior: ScrollBehavior = matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches
    ? "instant"
    : "smooth";
  private current: HTMLElement | null = null;
  private scrollTarget = 0;

  constructor(element: HTMLElement, beats: Beat[]) {
    this.element = element;
    this.beats = beats;
    this.title = element.querySelector(".terminal-title")!;
    this.command = element.querySelector(".command-text")!;
    this.transcript = element.querySelector(".transcript")!;
    this.pane = element.querySelector(".pane")!;
  }

  get state(): TerminalState {
    return this.element.dataset.state as TerminalState;
  }

  set state(state: TerminalState) {
    this.element.dataset.state = state;
  }

  show(index: number): void {
    const beat = this.beats[index];
    this.title.textContent = beat.title;
    this.command.textContent = beat.command;
    this.transcript.replaceChildren();
    for (const played of sessionBeats(this.beats, index)) {
      this.addBeat().textContent = played.transcript;
    }
    this.scrollCurrentToTop("instant");
  }

  open(index: number): void {
    this.title.textContent = this.beats[index].title;
    this.command.textContent = "";
    this.transcript.replaceChildren();
    this.current = null;
  }

  append(index: number): void {
    const beat = this.beats[index];
    this.title.textContent = beat.title;
    this.command.textContent = beat.command;
    this.transcript.replaceChildren();
    if (index > beat.session) {
      for (const played of sessionBeats(this.beats, index - 1)) {
        this.addBeat().textContent = played.transcript;
      }
    }
    this.addBeat();
    this.scrollCurrentToTop(this.scrollBehavior);
  }

  typeCommand(text: string): void {
    this.command.textContent = text;
  }

  typeBeat(text: string): void {
    this.current!.textContent = text;
    this.followTyping();
  }

  private addBeat(): HTMLElement {
    if (this.transcript.childElementCount > 0) {
      this.transcript.append("\n\n");
    }
    this.current = document.createElement("span");
    this.current.className = "beat";
    this.transcript.append(this.current);
    return this.current;
  }

  private scrollCurrentToTop(behavior: ScrollBehavior): void {
    const top = this.current
      ? this.current.getBoundingClientRect().top -
        this.pane.getBoundingClientRect().top -
        this.panePadding("paddingTop") +
        this.pane.scrollTop
      : 0;
    this.scrollTarget = Math.min(
      top,
      this.pane.scrollHeight - this.pane.clientHeight,
    );
    this.pane.scrollTo({ top: this.scrollTarget, behavior });
  }

  private followTyping(): void {
    const overflow =
      this.current!.getBoundingClientRect().bottom -
      this.pane.getBoundingClientRect().bottom +
      this.panePadding("paddingBottom");
    const needed = this.pane.scrollTop + overflow;
    if (needed > this.scrollTarget) {
      this.scrollTarget = needed;
      this.pane.scrollTop = needed;
    }
  }

  private panePadding(side: "paddingTop" | "paddingBottom"): number {
    return parseFloat(getComputedStyle(this.pane)[side]);
  }
}
