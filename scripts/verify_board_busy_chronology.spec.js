const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

test.use({
  launchOptions: process.env.BLOOM_CHROME_PATH
    ? { executablePath: process.env.BLOOM_CHROME_PATH }
    : {}
});

const CASES = [
  {
    label: "desktop-pointer-full",
    viewport: { width: 1280, height: 720 },
    input: "pointer"
  },
  {
    label: "desktop-keyboard-reduced",
    viewport: { width: 1280, height: 720 },
    input: "keyboard",
    reduced: true
  },
  {
    label: "mobile-touch-full",
    viewport: { width: 390, height: 844 },
    input: "touch",
    mobile: true
  },
  {
    label: "mobile-touch-reduced",
    viewport: { width: 390, height: 844 },
    input: "touch",
    mobile: true,
    reduced: true
  }
];

async function openFresh(page, label) {
  await page.addInitScript(({ key, seedToken }) => {
    if (!sessionStorage.getItem(seedToken)) {
      localStorage.removeItem(key);
      sessionStorage.setItem(seedToken, "1");
    }
  }, { key: SAVE_KEY, seedToken: `board-busy-${label}` });
  await page.goto(`${BASE_URL}?board-busy=${label}`, { waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
  await expect(page.locator("#board")).toHaveAttribute("aria-busy", "false");
}

async function openingPair(page) {
  const pair = await page.locator("#board .tile.idle-hint").evaluateAll((tiles) => (
    tiles.map((tile) => ({
      id: tile.id,
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y)
    }))
  ));
  expect(pair, "fresh R1 exposes one authored pair").toHaveLength(2);
  const source = pair.find(({ id }) => id === "tile-1-0") || pair[0];
  return { source, destination: pair.find(({ id }) => id !== source.id) };
}

async function activate(page, id, input, key = "Enter") {
  const tile = page.locator(`#${id}`);
  if (input === "touch") await tile.tap();
  else if (input === "pointer") await tile.click();
  else {
    await tile.focus();
    await tile.press(key);
  }
}

async function beginChronology(page) {
  await page.evaluate(() => {
    const board = document.querySelector("#board");
    const visible = (node) => Boolean(node)
      && !node.hidden
      && getComputedStyle(node).display !== "none"
      && node.getBoundingClientRect().width > 0
      && node.getBoundingClientRect().height > 0;
    const snapshot = (kind) => {
      const tiles = Array.from(document.querySelectorAll("#board .tile"));
      return {
        kind,
        busy: board?.getAttribute("aria-busy") || "",
        disabled: tiles.filter((tile) => tile.disabled).length,
        settledCue: document.body.classList.contains("settled-board-outcome-cue"),
        liveOwners: Array.from(document.querySelectorAll("[aria-live]"))
          .filter(visible)
          .filter((node) => ["polite", "assertive"].includes(node.getAttribute("aria-live")))
          .map((node) => node.id),
        activeId: document.activeElement?.id || document.activeElement?.tagName || ""
      };
    };
    window.__boardBusyChronology = [snapshot("initial")];
    window.__boardBusyObserver = new MutationObserver(() => {
      window.__boardBusyChronology.push(snapshot("mutation"));
    });
    window.__boardBusyObserver.observe(board, {
      attributes: true,
      attributeFilter: ["aria-busy"]
    });
    window.__boardBusyFrame = requestAnimationFrame(function sample() {
      window.__boardBusyChronology.push(snapshot("frame"));
      window.__boardBusyFrame = requestAnimationFrame(sample);
    });
  });
}

async function finishChronology(page) {
  return page.evaluate((key) => {
    window.__boardBusyObserver?.disconnect();
    cancelAnimationFrame(window.__boardBusyFrame);
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const visible = (node) => Boolean(node)
      && !node.hidden
      && getComputedStyle(node).display !== "none"
      && node.getBoundingClientRect().width > 0
      && node.getBoundingClientRect().height > 0;
    const chronology = window.__boardBusyChronology || [];
    const transitions = chronology
      .map(({ busy }) => busy)
      .filter((busy, index, values) => index === 0 || busy !== values[index - 1]);
    return {
      chronology,
      transitions,
      moves: state.moves,
      counts: state.counts,
      activeId: document.activeElement?.id || "",
      rovingIds: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      selectedIds: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      disabled: tiles.filter((tile) => tile.disabled).length,
      busy: document.querySelector("#board")?.getAttribute("aria-busy") || "",
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      boardWidth: board?.width || 0,
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

for (const testCase of CASES) {
  test(`accepted R1 resolution owns board busy state on ${testCase.label}`, async ({ browser }) => {
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
      const pair = await openingPair(page);
      await activate(page, pair.source.id, testCase.input, "Enter");
      await beginChronology(page);
      await activate(page, pair.destination.id, testCase.input, "Space");

      await page.waitForFunction((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === 5
          && document.querySelector("#board")?.getAttribute("aria-busy") === "false"
          && document.querySelectorAll("#board .tile:disabled").length === 0;
      }, SAVE_KEY, { timeout: 12000 });
      await page.waitForTimeout(40);

      const settled = await finishChronology(page);
      const busySamples = settled.chronology.filter(({ busy }) => busy === "true");
      const violations = settled.chronology.filter(({ busy, disabled }) => (
        (disabled === 64 && busy !== "true") || (busy === "false" && disabled > 0)
      ));

      expect(settled.transitions, `${testCase.label} exposes one continuous busy interval`)
        .toEqual(["false", "true", "false"]);
      expect(busySamples.length, `${testCase.label} exposes the resolving interval`).toBeGreaterThan(0);
      expect(
        busySamples.every(({ disabled }) => disabled === 64),
        `${testCase.label} busy authority matches the disabled altar`
      ).toBe(true);
      expect(
        busySamples.every(({ settledCue }) => !settledCue),
        `${testCase.label} no settled receipt competes during resolution`
      ).toBe(true);
      expect(violations, `${testCase.label} never advertises a disabled board as settled`).toEqual([]);
      expect(settled.moves, `${testCase.label} opening commits exactly once`).toBe(5);
      expect(settled.counts[5], `${testCase.label} Thorn Rose progress is real`).toBeGreaterThan(0);
      expect(settled.busy, `${testCase.label} busy retires with settled control`).toBe("false");
      expect(settled.disabled, `${testCase.label} all flowers return to control`).toBe(0);
      expect(settled.activeId, `${testCase.label} focus returns to a flower`).toMatch(/^tile-/);
      expect(settled.rovingIds, `${testCase.label} focus and sole roving owner agree`)
        .toEqual([settled.activeId]);
      expect(settled.selectedIds, `${testCase.label} selection retires`).toEqual([]);
      expect(settled.tiles, `${testCase.label} keeps 64 flowers`).toBe(64);
      expect(settled.rows, `${testCase.label} keeps eight semantic rows`).toBe(8);
      expect(settled.boardWidth, `${testCase.label} altar geometry`).toBeCloseTo(testCase.mobile ? 378 : 600, 0);
      expect(settled.scrollY, `${testCase.label} remains at the board-first top`).toBe(0);
      expect(settled.overflowX, `${testCase.label} has no horizontal overflow`).toBe(false);
      expect(settled.overflowY, `${testCase.label} has no vertical overflow`).toBe(false);
      expect(settled.brokenImages, `${testCase.label} has no broken visible images`).toEqual([]);
      expect(browserErrors, `${testCase.label} browser logs stay clean`).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
