const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

test.setTimeout(60000);

async function openFresh(page, label) {
  await page.goto(`${BASE_URL}?runtime-performance=${label}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function runtimeReport(page) {
  return page.evaluate(() => {
    const visible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const all = Array.from(document.querySelectorAll("*"));
    const tileRects = Array.from(document.querySelectorAll(".tile"))
      .map((tile) => tile.getBoundingClientRect());
    const completeRows = [...new Set(tileRects
      .filter((rect) => rect.top >= -1 && rect.bottom <= innerHeight + 1)
      .map((rect) => Math.round(rect.top)))].length;
    const filteredElements = all.filter((node) => getComputedStyle(node).filter !== "none").length;
    const shadowedElements = all.filter((node) => getComputedStyle(node).boxShadow !== "none").length;
    const animatedElements = all.filter((node) => {
      const style = getComputedStyle(node);
      return style.animationName !== "none" && style.animationDuration !== "0s";
    }).length;
    return {
      nodes: all.length,
      images: document.images.length,
      filteredElements,
      shadowedElements,
      animatedElements,
      tiles: tileRects.length,
      completeRows,
      dormantPreviewNodes: document.querySelectorAll(
        "#bouquetPath, #pathLedgerDrawer, #roundThreeFocus, [id^='round'][id$='Preview']"
      ).length,
      visibleButtons: Array.from(document.querySelectorAll("button"))
        .filter((node) => visible(node) && !node.closest(".board"))
        .map((node) => node.textContent.trim())
        .filter(Boolean),
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
      overflowX: document.documentElement.scrollWidth > innerWidth + 1
    };
  });
}

for (const config of [
  { label: "desktop", viewport: { width: 1280, height: 720 }, mobile: false },
  { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
]) {
  test(`focused runtime budget ${config.label}`, async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.setViewportSize(config.viewport);
    await openFresh(page, config.label);

    const report = await runtimeReport(page);
    console.log(`${config.label} runtime: ${JSON.stringify(report)}`);

    expect(report.tiles).toBe(64);
    expect(report.dormantPreviewNodes, "future preview DOM is absent").toBe(0);
    expect(report.nodes, "focused runtime DOM budget").toBeLessThanOrEqual(850);
    expect(report.images, "focused runtime image budget").toBeLessThanOrEqual(100);
    expect(report.visibleButtons.length, "Round 1 non-tile controls").toBeLessThanOrEqual(2);
    expect(report.brokenImages).toEqual([]);
    expect(report.overflowX).toBe(false);
    if (config.mobile) expect(report.completeRows).toBe(8);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);

    const hints = page.locator(".tile.idle-hint");
    await expect(hints).toHaveCount(2);
    await hints.nth(0).click({ force: true });
    await hints.nth(1).click({ force: true });
    await page.waitForFunction(() => document.querySelectorAll(".tile").length === 64);
    await expect(page.locator(".tile")).toHaveCount(64);
  });
}
