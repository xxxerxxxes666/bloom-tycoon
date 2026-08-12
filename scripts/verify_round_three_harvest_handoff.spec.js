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
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board").getBoundingClientRect();
    const cueNode = document.querySelector("#firstSwapCue");
    const cueRect = cueNode?.getBoundingClientRect();
    const visibleCommands = [...document.querySelectorAll("button:not(.tile)")]
      .filter(visible)
      .map((node) => ({ id: node.id, text: node.textContent.trim() }));
    return {
      save: localStorage.getItem(key),
      moves: state.moves,
      counts: state.counts,
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      cueVisible: visible(cueNode),
      cueRect: cueRect ? { top: cueRect.top, bottom: cueRect.bottom } : null,
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id),
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      enabled: tiles.filter((tile) => !tile.disabled).length,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      board: { width: board.width, height: board.height, bottom: board.bottom },
      visibleCommands,
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function clickPair(page, ids) {
  await page.locator(`#${ids[0]}`).click();
  await page.locator(`#${ids[1]}`).click();
}

for (const profile of PROFILES) {
  test(`${profile.label}: each Bloodroot harvest hands directly to the next target`, async ({ browser }) => {
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
      const marker = `round-three-harvest-handoff:${profile.label}`;
      await page.addInitScript(({ key, marker, fixture }) => {
        if (sessionStorage.getItem(marker)) return;
        localStorage.setItem(key, JSON.stringify(fixture));
        sessionStorage.setItem(marker, "seeded");
      }, { key: SAVE_KEY, marker, fixture: roundThreeFixture() });
      await page.addInitScript((seedLabel) => {
        let seed = 0;
        for (let index = 0; index < seedLabel.length; index += 1) {
          seed = (seed * 31 + seedLabel.charCodeAt(index)) >>> 0;
        }
        Math.random = () => {
          seed = (1664525 * seed + 1013904223) >>> 0;
          return seed / 4294967296;
        };
      }, "handoff-a");
      await page.goto(`${BASE_URL}?round-three-harvest-handoff=${profile.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#board .tile")).toHaveCount(64);

      await clickPair(page, ["tile-1-0", "tile-1-1"]);
      await expect(page.locator("#firstSwapCue")).toContainText(/Bloodroot \+3/);
      const receipt = await report(page);
      expect(receipt.moves).toBe(7);
      expect(receipt.counts[3]).toBe(3);
      expect(receipt.hints).toEqual([]);

      await expect.poll(async () => (await report(page)).hints.length, { timeout: 7000 }).toBe(2);
      const handoff = await report(page);
      expect(handoff.cue).toMatch(/^(Bloodroot|Sol Rot) next (↔|↑↓)$/);
      expect(handoff.cueVisible).toBe(true);
      expect(handoff.cueRect.bottom).toBeLessThanOrEqual(handoff.board.bottom - handoff.board.height);
      expect(handoff.active).toBe(handoff.hints[0]);
      expect(handoff.roving).toEqual([handoff.hints[0]]);
      expect(handoff.selected).toEqual([]);
      expect(handoff.visibleCommands).toEqual([{ id: "tutorialHelpBtn", text: "Help" }]);
      expect(handoff.enabled).toBe(64);
      expect(handoff.tiles).toBe(64);
      expect(handoff.rows).toBe(8);
      expect(handoff.board.width).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      expect(handoff.board.height).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      expect(handoff.overflowX).toBe(false);
      expect(handoff.brokenImages).toEqual([]);
      if (profile.mobile) {
        expect(handoff.board.bottom).toBeLessThanOrEqual(844);
        expect(handoff.scrollY).toBe(0);
      }

      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#board .tile")).toHaveCount(64);
      const reloaded = await report(page);
      expect(reloaded.save).toBe(handoff.save);
      expect(reloaded.cue).toBe(handoff.cue);
      expect(reloaded.hints).toEqual(handoff.hints);
      expect(reloaded.active).toBe(reloaded.hints[0]);
      expect(reloaded.roving).toEqual([reloaded.hints[0]]);

      await page.screenshot({
        path: `work/round-three-harvest-handoff-${profile.label}.png`,
        fullPage: true
      });
      await clickPair(page, handoff.hints);
      await expect.poll(async () => (await report(page)).moves, { timeout: 12000 }).toBe(6);
      const continued = await report(page);
      expect(continued.counts[0] + continued.counts[3]).toBeGreaterThan(3);
      expect(continued.selected).toEqual([]);
      expect(continued.tiles).toBe(64);
      expect(continued.rows).toBe(8);
      expect(continued.overflowX).toBe(false);
      expect(continued.brokenImages).toEqual([]);

      await expect.poll(async () => (await report(page)).hints.length, { timeout: 7000 }).toBe(2);
      const chained = await report(page);
      expect(chained.cue).toMatch(/^(Bloodroot|Sol Rot) next (↔|↑↓)$/);
      expect(chained.cueVisible).toBe(true);
      expect(chained.active).toBe(chained.hints[0]);
      expect(chained.roving).toEqual([chained.hints[0]]);
      expect(chained.visibleCommands).toEqual([{ id: "tutorialHelpBtn", text: "Help" }]);
      expect(chained.moves).toBe(6);
      expect(chained.tiles).toBe(64);
      expect(chained.rows).toBe(8);
      expect(chained.overflowX).toBe(false);
      expect(chained.brokenImages).toEqual([]);
      await page.screenshot({
        path: `work/round-three-chained-harvest-handoff-${profile.label}.png`,
        fullPage: true
      });

      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
