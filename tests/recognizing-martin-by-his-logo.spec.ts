import { test, expect, type Page, type Locator } from "@playwright/test";

const teal = "rgb(42, 161, 152)";
const mutedText = "rgb(131, 148, 150)";
const terminalPane = "rgb(7, 54, 66)";
const terminalChrome = "rgb(0, 43, 54)";
const transparent = "rgba(0, 0, 0, 0)";

type Point = { x: number; y: number };
type Size = { width: number; height: number };

function pixelOf(
  page: Page,
  image: string,
  drawnAt: Size,
  point: Point,
): Promise<string> {
  return page.evaluate(
    async ({ image, drawnAt, point }) => {
      const img = new Image();
      img.src = image;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = drawnAt.width;
      canvas.height = drawnAt.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(img, 0, 0, drawnAt.width, drawnAt.height);
      const [red, green, blue, alpha] = context.getImageData(
        point.x,
        point.y,
        1,
        1,
      ).data;
      return alpha === 0
        ? "rgba(0, 0, 0, 0)"
        : `rgb(${red}, ${green}, ${blue})`;
    },
    { image, drawnAt, point },
  );
}

function fillOf(mark: Locator): Promise<string> {
  return mark.evaluate(
    (svg) => getComputedStyle(svg.querySelector("path")!).fill,
  );
}

async function openWithTheBarShowing(page: Page): Promise<Locator> {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Get your license key for $5", exact: true })
    .first()
    .evaluate((el) => {
      const bottom = el.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo(0, bottom + 40);
    });
  const bar = page.getByRole("banner");
  await expect(bar).toBeVisible();
  return bar;
}

for (const icon of ["/favicon.svg", "/favicon.ico"]) {
  test(`the browser tab icon ${icon} is the teal mark`, async ({ page }) => {
    await page.goto("/");
    const tabIcon = { width: 32, height: 32 };

    expect(await pixelOf(page, icon, tabIcon, { x: 29, y: 16 })).toBe(teal);
    expect(await pixelOf(page, icon, tabIcon, { x: 2, y: 2 })).toBe(
      transparent,
    );
  });
}

const windows = [
  { name: "a 1440px wide window", viewport: { width: 1440, height: 900 } },
  { name: "a phone", viewport: { width: 390, height: 844 } },
];

for (const { name, viewport } of windows) {
  test.describe(`on load in ${name}`, () => {
    test.use({ viewport });

    test("the mark stands above the headline", async ({ page }) => {
      await page.goto("/");
      const mark = page
        .getByRole("main")
        .getByRole("img", { name: "Martin", exact: true })
        .first();
      const headline = page.getByRole("heading", { level: 1 });

      await expect(mark).toBeInViewport({ ratio: 1 });
      expect((await mark.boundingBox())!.height).toBe(64);
      expect(await fillOf(mark)).toBe(teal);
      expect((await mark.boundingBox())!.y).toBeLessThan(
        (await headline.boundingBox())!.y,
      );
    });
  });
}

test.describe("in a 1440px wide window", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the top bar shows the mark beside the name", async ({ page }) => {
    const bar = await openWithTheBarShowing(page);

    await expect(
      bar.getByRole("img", { name: "Martin", exact: true }),
    ).toBeVisible();
    await expect(bar.getByText("martin", { exact: true })).toBeVisible();
    await expect(bar.getByText("~")).toHaveCount(0);
  });

  for (const theme of ["dark", "light"]) {
    test(`the mark is teal in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript(
        (theme) => localStorage.setItem("theme", theme),
        theme,
      );
      const bar = await openWithTheBarShowing(page);

      expect(
        await fillOf(bar.getByRole("img", { name: "Martin", exact: true })),
      ).toBe(teal);
    });
  }

  test("the footer carries the mark in the muted text color", async ({
    page,
  }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await footer.scrollIntoViewIfNeeded();
    const mark = footer.getByRole("img", { name: "Martin", exact: true });

    await expect(mark).toBeVisible();
    expect((await mark.boundingBox())!.height).toBe(15);
    expect(await fillOf(mark)).toBe(mutedText);
    await expect(footer).toContainText(
      "Copyright (c) 2026 Singularity Studios, LLC",
    );
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the top bar keeps the mark alone", async ({ page }) => {
    const bar = await openWithTheBarShowing(page);

    await expect(
      bar.getByRole("img", { name: "Martin", exact: true }),
    ).toBeVisible();
    await expect(bar.getByText("martin", { exact: true })).toBeHidden();
  });
});

test("the link preview is the terminal with the mark in its corner", async ({
  page,
}) => {
  await page.goto("/");
  const preview = { width: 1200, height: 630 };

  expect(await pixelOf(page, "/og.png", preview, { x: 1120, y: 520 })).toBe(
    teal,
  );
  expect(await pixelOf(page, "/og.png", preview, { x: 10, y: 620 })).toBe(
    terminalPane,
  );
});

test("the link preview shows no playback speed", async ({ page }) => {
  await page.goto("/");
  const preview = { width: 1200, height: 630 };

  expect(await pixelOf(page, "/og.png", preview, { x: 1121, y: 43 })).toBe(
    terminalChrome,
  );
});
