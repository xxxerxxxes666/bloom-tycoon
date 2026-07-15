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
    const meaningfulBars = Array.from(document.querySelectorAll(
      ".progress-meter, .restoration-dial-track, .vial-meter, .restored-greenhouse-meter, .greenhouse-payoff-fill, .greenhouse-upgrade-ladder"
    ))
      .filter(visible)
      .map((node) => ({
        className: node.className,
        label: node.closest("[aria-label]")?.getAttribute("aria-label") || node.textContent.trim()
      }));
    const greenhouseIntakeTarget = [
      document.querySelector("#heroRestorationDial"),
      document.querySelector("#mobileRestorationDial"),
      document.querySelector("#mobileGreenhousePlinth"),
      document.querySelector("#activeGreenhouseStage")
    ].find(visible);
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
      prototypeScaffoldNodes: document.querySelectorAll(
        "#sacrificeBtn, #pruningShearsBtn, #moonwaterFlaskBtn, #blackCandleBtn, #graveSoilBtn, #sacrificePanel, #boosterPanel, #chestTrigger, #chestModal"
      ).length,
      mobileGreenhousePlinthVisible: visible(document.querySelector("#mobileGreenhousePlinth")),
      ritualLogVisible: visible(document.querySelector("#ritualLog")),
      greenhouseIntakeTargetId: greenhouseIntakeTarget?.id || "",
      meaningfulBars,
      bouquetProgressText: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      greenhouseNextText: document.querySelector(".restoration-dial-phase")?.textContent.trim() || "",
      visibleProgressText: document.body.innerText,
      visibleButtons: Array.from(document.querySelectorAll("button"))
        .filter((node) => visible(node) && !node.closest(".board"))
        .map((node) => node.textContent.trim())
        .filter(Boolean),
      reviewHooksEnabled: window.__bloomReviewHooksEnabled === true,
      qaButtonCount: document.querySelectorAll("#demoCompleteBtn, #shapeBloomBtn").length,
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
    expect(report.prototypeScaffoldNodes, "legacy support scaffold is absent from normal runtime").toBe(0);
    expect(report.nodes, "focused runtime DOM budget").toBeLessThanOrEqual(700);
    expect(report.images, "focused runtime image budget").toBeLessThanOrEqual(90);
    expect(report.filteredElements, "focused filter budget").toBeLessThanOrEqual(60);
    expect(report.shadowedElements, "focused shadow budget").toBeLessThanOrEqual(95);
    expect(report.animatedElements, "focused idle animation budget").toBeLessThanOrEqual(4);
    expect(report.meaningfulBars, config.mobile
      ? "mobile active play keeps only the bouquet bar"
      : "desktop keeps one bouquet bar plus one greenhouse bar").toHaveLength(config.mobile ? 1 : 2);
    expect(report.mobileGreenhousePlinthVisible, "mobile greenhouse plinth stays out of active play").toBe(false);
    if (config.mobile) {
      expect(report.ritualLogVisible, "ritual log stays out of mobile active play").toBe(false);
    }
    expect(report.greenhouseIntakeTargetId, "intake feedback retains a visible destination").toBe(config.mobile
      ? "activeGreenhouseStage"
      : "heroRestorationDial");
    expect(report.bouquetProgressText).toMatch(/Bouquet .* -> \+\d+ coins/);
    expect(report.greenhouseNextText).toMatch(/Restore|Unlock|Raise|Replay/);
    expect(report.visibleProgressText).not.toMatch(/\b(?:SAP|MANA|BLOOD)\b|\d[\d,]*\s*\/\s*\d[\d,]*\s*XP|Greenhouse \+\d+ XP|Apothecary \+\d+ XP/);
    expect(report.visibleButtons.length, "Round 1 non-tile controls").toBeLessThanOrEqual(2);
    expect(report.reviewHooksEnabled, "QA review hooks stay off in normal runtime").toBe(false);
    expect(report.qaButtonCount, "visible prototype shortcut buttons are removed").toBe(0);
    expect(report.brokenImages).toEqual([]);
    expect(report.overflowX).toBe(false);
    expect(report.completeRows, `${config.label} visible board rows`).toBe(8);
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

test("focused runtime respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await openFresh(page, "reduced_motion");
  const report = await runtimeReport(page);
  console.log(`reduced motion runtime: ${JSON.stringify(report)}`);
  expect(report.tiles).toBe(64);
  expect(report.completeRows).toBe(8);
  expect(report.animatedElements, "reduced motion idle animations").toBeLessThanOrEqual(3);
  expect(report.brokenImages).toEqual([]);
  expect(report.overflowX).toBe(false);
});
