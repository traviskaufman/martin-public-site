import type { Scene } from "../scenes";

export type TerminalState =
  "static" | "loading" | "playing" | "paused" | "finished";

export class TerminalStage {
  readonly element: HTMLElement;
  private readonly title: HTMLElement;
  private readonly command: HTMLElement;
  private readonly transcript: HTMLElement;
  private readonly pane: HTMLElement;
  private readonly panels: HTMLElement[];

  constructor(element: HTMLElement) {
    this.element = element;
    this.title = element.querySelector(".terminal-title")!;
    this.command = element.querySelector(".command-text")!;
    this.transcript = element.querySelector(".transcript")!;
    this.pane = element.querySelector(".pane")!;
    this.panels = Array.from(
      document.querySelectorAll<HTMLElement>("[data-differentiator]"),
    );
  }

  get state(): TerminalState {
    return this.element.dataset.state as TerminalState;
  }

  set state(state: TerminalState) {
    this.element.dataset.state = state;
  }

  show(scene: Scene): void {
    this.begin(scene);
    this.command.textContent = scene.command;
    this.transcript.textContent = scene.transcript;
    this.pane.scrollTop = 0;
  }

  begin(scene: Scene): void {
    this.title.textContent = scene.title;
    this.command.textContent = "";
    this.transcript.textContent = "";
    for (const panel of this.panels) {
      panel.classList.toggle(
        "active",
        panel.dataset.differentiator === scene.differentiator,
      );
    }
  }

  typeCommand(text: string): void {
    this.command.textContent = text;
  }

  typeTranscript(text: string): void {
    this.transcript.textContent = text;
    this.pane.scrollTop = this.pane.scrollHeight;
  }
}
