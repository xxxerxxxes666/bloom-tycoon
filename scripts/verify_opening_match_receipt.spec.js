const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const CASES = [
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
  { label: "mobile-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "mobile-touch-reduced", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
];

async function openFresh(page, label) {
  await page.addInitScript(({ key, seedToken }) => {
    if (!sessionStorage.getItem(seedToken)) {
      localStorage.removeItem(key);
      sessionStorage.setItem(seedToken, "1");
    }
  }, { key: SAVE_KEY, seedToken: `opening-match-receipt-${label}` });
  await page.goto(`${BASE_URL}?opening-match-receipt=${label}`, { waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
  await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2, { timeout: 3000 });
}

async function report(page) {
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const visible = (node) => Boolean(node)
      && !node.hidden
      && getComputedStyle(node).display !== "none"
      && getComputedStyle(node).visibility !== "hidden"
      && node.getBoundingClientRect().width > 0
      && node.getBoundingClientRect().height > 0;
    return {
      state,
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      tutorial: document.querySelector("#tutorialPanel")?.textContent.replace(/\s+/g, " ").trim() || "",
      tutorialVisible: visible(document.querySelector("#tutorialPanel")),
      bodyClasses: document.body.className,
      boardBusy: document.querySelector("#board")?.getAttribute("aria-busy") || "",
      activeId: document.activeElement?.id || "",
      rovingIds: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      selectedIds: tiles.filter((tile) => tile.classList.contains("sel") || tile.classList.contains("selected"))
        .map((tile) => tile.id),
      liveOwners: Array.from(document.querySelectorAll("[aria-live]"))
        .filter(visible)
        .filter((node) => ["polite", "assertive"].includes(node.getAttribute("aria-live")))
        .map((node) => ({ id: node.id, live: node.getAttribute("aria-live") })),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      boardWidth: board?.width || 0,
      boardBottom: board?.bottom || 0,
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function activateOpeningPair(page, input) {
  const source = page.locator("#tile-1-0");
  const destination = page.locator("#tile-1-1");
  if (input === "touch") {
    await source.tap();
    await destination.tap();
  } else if (input === "pointer") {
    await source.click();
    await destination.click();
  } else {
    await expect(source).toBeFocused();
    await source.press("Enter");
    await expect(destination).toBeFocused();
    await destination.press("Space");
  }
}

for (const testCase of CASES) {
  test(`opening match confirms its earned bouquet progress on ${testCase.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile),
      reducedMotion: testCase.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const browserErrors = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));

    try {
      await openFresh(page, testCase.label);
      const initial = await report(page);
      expect(initial.state.moves, `${testCase.label} starts with six moves`).toBe(6);
      expect(initial.state.counts, `${testCase.label} starts with an empty bouquet`).toEqual([0, 0, 0, 0, 0, 0]);
      expect(initial.liveOwners, `${testCase.label} tutorial owns opening narration`)
        .toEqual([{ id: "tutorialPanel", live: "polite" }]);

      await page.evaluate(() => {
        window.__openingReceiptChronology = [];
        const cue = document.querySelector("#firstSwapCue");
        const observer = new MutationObserver(() => {
          const text = cue?.textContent.trim() || "";
          if (!text.includes("moves left.")) return;
          const visible = (node) => Boolean(node)
            && !node.hidden
            && getComputedStyle(node).display !== "none"
            && node.getBoundingClientRect().width > 0
            && node.getBoundingClientRect().height > 0;
          window.__openingReceiptChronology.push({
            text,
            busy: document.querySelector("#board")?.getAttribute("aria-busy"),
            owners: Array.from(document.querySelectorAll("[aria-live]"))
              .filter(visible)
              .filter((node) => ["polite", "assertive"].includes(node.getAttribute("aria-live")))
              .map((node) => node.id)
          });
        });
        observer.observe(cue, { childList: true, characterData: true, subtree: true });
        window.__openingReceiptObserver = observer;
      });

      await activateOpeningPair(page, testCase.input);
      await expect.poll(async () => (await report(page)).bodyClasses.includes("settled-board-outcome-cue"), {
        message: `${testCase.label} exposes the receipt only after settled feedback`,
        timeout: 12000
      }).toBe(true);

      const settled = await report(page);
      expect(settled.cue, `${testCase.label} names the earned flower, count, and move`).toBe(
        "Thorn Rose +3, 3 of 8. 5 moves left."
      );
      expect(settled.state.moves, `${testCase.label} spends exactly once`).toBe(5);
      expect(settled.state.counts, `${testCase.label} credits only the authored Thorn Rose match`)
        .toEqual([0, 0, 0, 0, 0, 3]);
      expect(settled.liveOwners, `${testCase.label} receipt is the sole narrator`)
        .toEqual([{ id: "firstSwapCue", live: "polite" }]);
      expect(settled.state.tutorialActive, `${testCase.label} retires stale tutorial authority`).toBe(false);
      expect(settled.tutorialVisible, `${testCase.label} keeps the stale panel absent`).toBe(false);
      expect(settled.tutorial, `${testCase.label} removes stale tutorial copy`).not.toContain("Find 3 Thorn Roses.");
      expect(settled.selectedIds, `${testCase.label} clears selection`).toEqual([]);
      expect(settled.activeId, `${testCase.label} focus agrees with the sole roving tile`)
        .toBe(settled.rovingIds[0]);
      expect(settled.rovingIds, `${testCase.label} keeps one board entry`).toHaveLength(1);

      const chronology = await page.evaluate(() => window.__openingReceiptChronology || []);
      expect(chronology, `${testCase.label} mutates to the result exactly once`).toHaveLength(1);
      expect(chronology[0], `${testCase.label} settles before the result mutation`).toEqual({
        text: "Thorn Rose +3, 3 of 8. 5 moves left.",
        busy: "false",
        owners: ["firstSwapCue"]
      });

      expect(settled.tiles, `${testCase.label} retains 64 tiles`).toBe(64);
      expect(settled.rows, `${testCase.label} retains eight rows`).toBe(8);
      expect(settled.boardWidth, `${testCase.label} exact altar width`).toBe(testCase.mobile ? 378 : 600);
      expect(settled.boardBottom, `${testCase.label} altar remains in the viewport`)
        .toBeLessThanOrEqual(testCase.viewport.height);
      expect(settled.scrollY, `${testCase.label} stays at the top`).toBe(0);
      expect(settled.overflowX, `${testCase.label} has no horizontal overflow`).toBe(false);
      expect(settled.overflowY, `${testCase.label} has no vertical overflow`).toBe(false);
      expect(settled.brokenImages, `${testCase.label} has no broken visible images`).toEqual([]);
      await page.screenshot({ path: `work/opening-match-receipt-${testCase.label}.png` });

      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      const restored = await report(page);
      expect(restored.state.moves, `${testCase.label} reload keeps the spent move`).toBe(5);
      expect(restored.state.counts, `${testCase.label} reload keeps earned flowers`)
        .toEqual([0, 0, 0, 0, 0, 3]);
      expect(restored.bodyClasses, `${testCase.label} reload cannot replay the receipt`)
        .not.toContain("settled-board-outcome-cue");
      expect(restored.cue, `${testCase.label} reload cannot replay result copy`).not.toContain("moves left.");
      expect(restored.state.tutorialActive, `${testCase.label} reload cannot revive stale tutorial authority`).toBe(false);
      expect(restored.tutorialVisible, `${testCase.label} reload keeps the stale panel absent`).toBe(false);
      expect(restored.tiles, `${testCase.label} reload retains 64 tiles`).toBe(64);
      expect(restored.rows, `${testCase.label} reload retains eight rows`).toBe(8);
      expect(browserErrors, `${testCase.label} browser warning/error ledger`).toEqual([]);
    } finally {
      await page.evaluate(() => window.__openingReceiptObserver?.disconnect()).catch(() => {});
      await context.close();
    }
  });
}
