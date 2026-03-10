/**
 * UI Smoke E2E — Playwright browser tests
 *
 * Verifies the real rendered UI in Chromium against the Vite dev server.
 * Uses the mock backend (auto-enabled in dev mode) to trigger full
 * streaming flows and checks DOM structure, styling, and layout.
 */
import { test, expect, type Page } from "@playwright/test";

// ─── Helpers ───────────────────────────────────────────────

/** Wait for the app to finish initial render */
async function waitForApp(page: Page) {
  await page.waitForSelector("[data-testid='prompt-box'], textarea, [role='textbox']", {
    timeout: 10_000,
  });
}

/** Type a message and send it */
async function sendMessage(page: Page, text: string) {
  const input = page.locator("textarea, [role='textbox'], [data-testid='prompt-box'] textarea").first();
  await input.fill(text);
  const sendBtn = page.locator("button[aria-label*='send' i], button[aria-label*='Send' i]").first();
  if (await sendBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await sendBtn.click();
  } else {
    await input.press("Enter");
  }
}

/** Wait for streaming to complete: no active spinners */
async function waitForStreamingDone(page: Page) {
  await expect.poll(
    () => page.locator(".codicon-loading.animate-spin").count(),
    { timeout: 15_000, message: "spinners to disappear" },
  ).toBe(0);
}

// ─── Tests ─────────────────────────────────────────────────

test.describe("App loads", () => {
  test("index page renders without crash", async ({ page }) => {
    // Register error listener BEFORE navigation to catch init errors
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await waitForApp(page);

    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Allow a beat for async errors
    await expect.poll(() => errors.filter(
      (e) => !e.includes("ResizeObserver") && !e.includes("Non-Error"),
    ), { timeout: 2_000 }).toEqual([]);
  });

  test("dark theme applied (Tokyo Night background)", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor,
    );
    const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    expect(match).not.toBeNull();
    if (match) {
      expect(Number(match[1])).toBeLessThan(50);
      expect(Number(match[2])).toBeLessThan(50);
      expect(Number(match[3])).toBeLessThan(60);
    }
  });
});

test.describe("Turn lifecycle — layout shift guard", () => {
  test("left bar width is constant before and after streaming", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    await sendMessage(page, "explain the project structure");

    const turn = page.locator("[data-testid^='turn-']").first();
    await expect(turn).toBeVisible({ timeout: 5_000 });

    const outerDisplay = await turn.evaluate((el) => getComputedStyle(el).display);
    expect(outerDisplay).toBe("flex");

    const bar = turn.locator("> :first-child");
    await expect(bar).toBeVisible();

    const barWidth = await bar.evaluate((el) => el.getBoundingClientRect().width);
    expect(barWidth).toBeGreaterThan(0);
    expect(barWidth).toBeLessThanOrEqual(4);

    // Wait for streaming done (no hardcoded sleep)
    await waitForStreamingDone(page);

    const barWidthAfter = await bar.evaluate((el) => el.getBoundingClientRect().width);
    expect(barWidthAfter).toBe(barWidth);
  });
});

test.describe("TurnPhaseSection icons", () => {
  test("completed turn: check icon visible, no active spinners", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    await sendMessage(page, "what does this project do?");

    const turn = page.locator("[data-testid^='turn-']").first();
    await expect(turn).toBeVisible({ timeout: 8_000 });

    await waitForStreamingDone(page);

    // Check icon should be visible within this turn
    const checkIcon = turn.locator(".codicon-check").first();
    await expect(checkIcon).toBeVisible({ timeout: 3_000 });

    // No spinners within this turn
    expect(await turn.locator(".codicon-loading.animate-spin").count()).toBe(0);
  });
});

test.describe("Phase label and summary", () => {
  test("completed thinking phase clears progress summary", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    await sendMessage(page, "explain the code");
    await waitForStreamingDone(page);

    // Stale summary should be gone
    await expect(page.getByText("Understanding the question...")).not.toBeVisible({ timeout: 2_000 });
  });
});

test.describe("Settings menu", () => {
  test("settings trigger exists and opens menu", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const trigger = page.locator(
      "button[aria-label*='settings' i], button[aria-label*='Settings' i], button[aria-label*='menu' i]",
    ).first();

    // Assert trigger exists (not a silent skip)
    await expect(trigger).toBeVisible({ timeout: 3_000 });
    await trigger.click();

    // Menu should render (at least one menu item visible)
    const menuItem = page.locator("[role='menuitem'], [role='menuitemcheckbox']").first();
    await expect(menuItem).toBeVisible({ timeout: 2_000 });
  });
});

test.describe("No console errors during interaction", () => {
  test("full message flow produces no JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await waitForApp(page);

    await sendMessage(page, "help me fix the bug");
    await waitForStreamingDone(page);

    const realErrors = errors.filter(
      (e) => !e.includes("ResizeObserver") && !e.includes("Non-Error"),
    );
    expect(realErrors).toEqual([]);
  });
});
