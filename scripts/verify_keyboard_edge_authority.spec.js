const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const PROFILES = [
  { label: "desktop-full", viewport: { width: 1280, height: 720 } },
  { label: "desktop-reduced", viewport: { width: 1280, height: 720 }, reduced: true },
  { label: "mobile390-full", viewport: { width: 390, height: 844 }, mobile: true },
  { label: "mobile390-reduced", viewport: { width: 390, height: 844 }, mobile: true, reduced: true }
];

const EDGE_PROBES = [
  { id: "tile-0-0", key: "ArrowLeft" },
  { id: "tile-7-0", key: "ArrowUp" },
  { id: "tile-7-7", key: "ArrowRight" },
  { id: "tile-0-7", key: "ArrowDown" }
];

test.setTimeout(60000);

function roundThreeFixture() {
  const board = Array.from({ length: 8 }, (_, y) => (
    Array.from({ length: 8 }, (_, x) => (x + y * 2) % 6)
  ));
  board[0][0] = 3;
  board[0][1] = 1;
  board[0][2] = 3;
  board[0][3] = 4;
  board[1][1] = 3;
  return {
    board,
    armedLineRelic: null,
    moves: 8,
    coins: 50,
    counts: [0, 0, 0, 0, 0, 0],
    cursedThorns: [],
    clearedCursedThorns: 0,
    currentRound: 3,
    roundComplete: false,
    roundOneRestored: true,
    roundTwoGreenhouseUpgraded: true,
    roundThreeConservatoryRaised: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: 2,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
}

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board").getBoundingClientRect();
    return {
      save: localStorage.getItem(key),
      moves: state.moves,
      counts: state.counts,
      boardState: tiles.map((tile) => tile.dataset.flowerId).join(","),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      enabled: tiles.filter((tile) => !tile.disabled).length,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      board: { width: board.width, height: board.height, bottom: board.bottom },
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

for (const profile of PROFILES) {
  test(`${profile.label}: boundary arrows preserve keyboard command authority`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile),
      reducedMotion: profile.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const problems = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText || "";
      if (failure !== "net::ERR_ABORTED") problems.push(`${request.url()} ${failure}`);
    });

    try {
      const marker = `keyboard-edge-authority:${profile.label}`;
      await page.addInitScript(({ key, marker, fixture }) => {
        if (sessionStorage.getItem(marker)) return;
        localStorage.setItem(key, JSON.stringify(fixture));
        sessionStorage.setItem(marker, "seeded");
      }, { key: SAVE_KEY, marker, fixture: roundThreeFixture() });
      await page.goto(`${BASE_URL}?keyboard-edge-authority=${profile.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#board .tile")).toHaveCount(64);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0);

      const opening = await report(page);
      expect(opening.moves).toBe(8);
      expect(opening.counts).toEqual([0, 0, 0, 0, 0, 0]);

      for (const probe of EDGE_PROBES) {
        const tile = page.locator(`#${probe.id}`);
        await tile.focus();
        const beforeNavigation = await report(page);
        await page.keyboard.press(probe.key);
        const afterNavigation = await report(page);
        expect(afterNavigation.save, `${probe.key} at ${probe.id} cannot mutate play`).toBe(beforeNavigation.save);
        expect(afterNavigation.boardState).toBe(beforeNavigation.boardState);
        expect(afterNavigation.selected).toEqual([]);
        expect(afterNavigation.active).toBe(probe.id);
        expect(afterNavigation.roving).toEqual([probe.id]);

        await page.keyboard.press("Enter");
        const selected = await report(page);
        expect(selected.save).toBe(beforeNavigation.save);
        expect(selected.selected).toEqual([probe.id]);
        expect(selected.active).toBe(probe.id);
        expect(selected.roving).toEqual([probe.id]);

        await page.keyboard.press(probe.key);
        const held = await report(page);
        expect(held.save, `${probe.key} cannot cancel selected ${probe.id}`).toBe(beforeNavigation.save);
        expect(held.moves).toBe(8);
        expect(held.counts).toEqual(opening.counts);
        expect(held.boardState).toBe(opening.boardState);
        expect(held.selected).toEqual([probe.id]);
        expect(held.active).toBe(probe.id);
        expect(held.roving).toEqual([probe.id]);

        if (profile.label === "mobile390-full" && probe.id === "tile-7-7") {
          await page.screenshot({ path: "work/keyboard-edge-mobile390-selection.png", fullPage: true });
        }

        await page.keyboard.press("Escape");
        const canceled = await report(page);
        expect(canceled.save).toBe(beforeNavigation.save);
        expect(canceled.selected).toEqual([]);
        expect(canceled.active).toBe(probe.id);
        expect(canceled.roving).toEqual([probe.id]);
      }

      const source = page.locator("#tile-1-0");
      await source.focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("ArrowDown");
      await expect.poll(async () => (await report(page)).moves, { timeout: 12000 }).toBe(7);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });

      const settled = await report(page);
      expect(settled.counts[3], "fresh inward arrow still earns Bloodroot progress").toBeGreaterThanOrEqual(3);
      expect(settled.boardState).not.toBe(opening.boardState);
      expect(settled.selected).toEqual([]);
      expect(settled.active).toBe(settled.roving[0]);
      expect(settled.roving).toHaveLength(1);
      expect(settled.enabled).toBe(64);
      expect(settled.tiles).toBe(64);
      expect(settled.rows).toBe(8);
      expect(settled.board.width).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      expect(settled.board.height).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      expect(settled.overflowX).toBe(false);
      expect(settled.brokenImages).toEqual([]);
      if (profile.mobile) {
        expect(settled.board.bottom).toBeLessThanOrEqual(844);
        expect(settled.scrollY).toBe(0);
      }
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
