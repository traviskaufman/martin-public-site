/// <reference path="../.astro/types.d.ts" />

interface Window {
  posthog?: {
    capture(
      event: string,
      properties?: Record<string, unknown>,
      options?: { send_instantly?: boolean },
    ): void;
  };
}
