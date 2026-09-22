type Tab = "martin" | "vanilla";

export class ComparisonTabs {
  private readonly element: HTMLElement;
  private readonly tabs: HTMLButtonElement[];
  private readonly martinPanel: HTMLElement;
  private readonly vanillaPanel: HTMLElement;
  private readonly sectionPanels: HTMLElement[];

  constructor(element: HTMLElement) {
    this.element = element;
    this.tabs = Array.from(element.querySelectorAll('[role="tab"]'));
    this.martinPanel = element.querySelector('[data-panel="martin"]')!;
    this.vanillaPanel = element.querySelector('[data-panel="vanilla"]')!;
    this.sectionPanels = Array.from(
      this.vanillaPanel.querySelectorAll("[data-section]"),
    );
    for (const [position, tab] of this.tabs.entries()) {
      tab.addEventListener("click", () =>
        this.select(tab.dataset.shows as Tab),
      );
      tab.addEventListener("keydown", (event) => {
        const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
        if (step === undefined) {
          return;
        }
        const next =
          this.tabs[(position + step + this.tabs.length) % this.tabs.length];
        this.select(next.dataset.shows as Tab);
        next.focus();
      });
    }
    new MutationObserver(() => this.render()).observe(element, {
      attributeFilter: ["data-section"],
    });
    this.render();
  }

  select(tab: Tab): void {
    this.element.dataset.tab = tab;
    this.render();
  }

  private get comparing(): boolean {
    if (this.sectionPanels.length === 0) {
      return true;
    }
    return this.sectionPanels.some(
      (panel) => panel.dataset.section === this.element.dataset.section,
    );
  }

  private render(): void {
    const comparing = this.comparing;
    const showingVanilla = comparing && this.element.dataset.tab === "vanilla";
    this.element.toggleAttribute("data-comparing", comparing);
    for (const tab of this.tabs) {
      const selected = tab.dataset.shows === this.element.dataset.tab;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    this.martinPanel.hidden = showingVanilla;
    this.vanillaPanel.hidden = !showingVanilla;
    for (const panel of this.sectionPanels) {
      panel.hidden = panel.dataset.section !== this.element.dataset.section;
    }
  }
}
