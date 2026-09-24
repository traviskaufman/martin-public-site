import type { Page } from "@playwright/test";
import zlib from "node:zlib";

export const desktopChromeUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

export async function passBotDetection(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
      configurable: true,
    });
    Object.defineProperty(navigator, "userAgentData", {
      get: () => ({
        brands: [
          { brand: "Not_A Brand", version: "8" },
          { brand: "Chromium", version: "130" },
          { brand: "Google Chrome", version: "130" },
        ],
        mobile: false,
        platform: "macOS",
      }),
      configurable: true,
    });
  });
}

function decodePosthogEvents(
  contentType: string | undefined,
  buffer: Buffer,
): Record<string, unknown>[] {
  const gunzipIfCompressed = (bytes: Buffer): Buffer =>
    bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b
      ? zlib.gunzipSync(bytes)
      : bytes;

  let json: string;
  if (contentType?.includes("application/x-www-form-urlencoded")) {
    const data =
      new URLSearchParams(buffer.toString("utf-8")).get("data") ?? "";
    json = gunzipIfCompressed(Buffer.from(data, "base64")).toString("utf-8");
  } else {
    json = gunzipIfCompressed(buffer).toString("utf-8");
  }

  const parsed = JSON.parse(json);
  return Array.isArray(parsed.batch) ? parsed.batch : [parsed];
}

export async function interceptPosthog(
  page: Page,
): Promise<Record<string, unknown>[]> {
  const events: Record<string, unknown>[] = [];
  await page.route("https://us.i.posthog.com/**", async (route) => {
    const request = route.request();
    const buffer = request.postDataBuffer();
    if (buffer) {
      events.push(
        ...decodePosthogEvents(request.headers()["content-type"], buffer),
      );
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });
  return events;
}
