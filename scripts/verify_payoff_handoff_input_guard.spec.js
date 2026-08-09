const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

test.setTimeout(120000);

async function seedDeterministicMath(page, label) {
  await page.addInitScript((seedLabel) => {
    let seed = 0;
    for (let index = 0; index < seedLabel.length; index += 1) {
      seed = (seed * 31 + seedLabel.charCodeAt(index)) >>> 0;
    }
    Math.random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }, label);
}

async function openFreshRoundOne(page, label) {
  await seedDeterministicMath(page, `payoff-handoff-${label}`);
  await page.goto(`${BASE_URL}?payoff_handoff=${label}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function completeRoundOneNaturally(page, label) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const state = await page.evaluate((key) => {
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      return {
        complete: saved.roundComplete === true,
        moves: Number(saved.moves || 0)
      };
    }, SAVE_KEY);
    if (state.complete) return;
    expect(state.moves, `${label} retains a natural move`).toBeGreaterThan(0);
    await page.waitForFunction(() => (
      document.querySelector("#roundOneRestoration")?.offsetParent
      || (
        document.querySelector("#board")?.getAttribute("aria-busy") !== "true"
        && document.querySelectorAll(".tile.idle-hint").length === 2
      )
    ), null, { timeout: 9500 });
    if (await page.locator("#roundOneRestoration").isVisible()) return;
    const pair = await page.locator(".tile.idle-hint").evaluateAll((tiles) => (
      tiles.slice(0, 2).map((tile) => ({ x: tile.dataset.x, y: tile.dataset.y }))
    ));
    expect(pair, `${label} receives one natural guide`).toHaveLength(2);
    for (const cell of pair) {
      await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).click();
    }
    await page.waitForFunction(({ key, before }) => {
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      return saved.roundComplete === true
        || (
          Number(saved.moves) < before
          && document.querySelector("#board")?.getAttribute("aria-busy") !== "true"
          && Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled)
        );
    }, { key: SAVE_KEY, before: state.moves }, { timeout: 10000 });
  }
  throw new Error(`${label} did not naturally complete Round 1`);
}

async function activateAt(page, mode, point) {
  if (mode === "keyboard") {
    await page.keyboard.press("Enter");
  } else if (mode === "touch") {
    await page.touchscreen.tap(point.x, point.y);
  } else {
    await page.mouse.click(point.x, point.y);
  }
}

async function activateTile(page, mode, cell) {
  const tile = page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
  const box = await tile.boundingBox();
  expect(box).toBeTruthy();
  await activateAt(page, mode, {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2
  });
}

async function openSettledPayoffFixture(page, label, round) {
  const fixtureBoard = Array.from({ length: 8 }, (_, y) => (
    Array.from({ length: 8 }, (_, x) => [0, 2, 3, 4][(x + y * 2) % 4])
  ));
  const state = {
    focusedEconomyVersion: 2,
    board: fixtureBoard,
    armedLineRelic: null,
    moves: 0,
    coins: 50,
    counts: round === 2 ? [0, 0, 10, 0, 9, 7] : [13, 0, 0, 14, 0, 0],
    cursedThorns: [],
    clearedCursedThorns: round === 2 ? 3 : 0,
    currentRound: round,
    roundComplete: true,
    roundOneRestored: true,
    roundTwoGreenhouseUpgraded: true,
    roundThreeConservatoryRaised: true,
    freshConservatorySettlement: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
  await page.addInitScript(({ key, marker, fixture }) => {
    if (!sessionStorage.getItem(marker)) {
      localStorage.setItem(key, JSON.stringify(fixture));
      sessionStorage.setItem(marker, "seeded");
    }
  }, { key: SAVE_KEY, marker: `payoff-handoff-fixture:${label}`, fixture: state });
  await page.goto(`${BASE_URL}?payoff_handoff_fixture=${label}`, { waitUntil: "networkidle" });
  await expect(page.locator("#nextOrderBtn")).toBeVisible();
  await expect(page.locator("#nextOrderBtn")).toBeFocused();
}

async function boardAuthority(page) {
  return page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = Array.from(document.querySelectorAll(".tile"));
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const roving = tiles.filter((tile) => tile.tabIndex === 0);
    const visibleImageBroken = Array.from(document.images).filter((image) => {
      const style = getComputedStyle(image);
      const rect = image.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && rect.width > 0
        && rect.height > 0
        && (!image.complete || image.naturalWidth === 0);
    }).map((image) => image.id || image.src);
    return {
      round: saved.currentRound,
      moves: saved.moves,
      counts: saved.counts,
      boardSave: JSON.stringify(saved.board),
      selected: tiles.filter((tile) => tile.classList.contains("selected")).map((tile) => tile.id),
      activeId: document.activeElement?.id || "",
      rovingIds: roving.map((tile) => tile.id),
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => ({
        id: tile.id,
        x: Number(tile.dataset.x),
        y: Number(tile.dataset.y)
      })),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => Math.round(tile.getBoundingClientRect().top))).size,
      boardWidth: board?.width || 0,
      boardHeight: board?.height || 0,
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: visibleImageBroken
    };
  }, SAVE_KEY);
}

for (const config of [
  { label: "desktop-pointer-full", viewport: { width: 1280, height: 720 }, mobile: false, motion: "no-preference", mode: "pointer" },
  { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, mobile: false, motion: "reduce", mode: "keyboard" },
  { label: "mobile390-touch-full", viewport: { width: 390, height: 844 }, mobile: true, motion: "no-preference", mode: "touch" },
  { label: "mobile390-touch-reduced", viewport: { width: 390, height: 844 }, mobile: true, motion: "reduce", mode: "touch" }
]) {
  test(`payoff repeat activation cannot carry into the new board on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: config.mobile,
      isMobile: config.mobile,
      reducedMotion: config.motion
    });
    const page = await context.newPage();
    const browserMessages = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) {
        browserMessages.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    try {
      await openFreshRoundOne(page, config.label);
      await completeRoundOneNaturally(page, config.label);
      await expect(page.locator("#restoreGreenhouseBtn")).toBeVisible({ timeout: 4000 });
      await page.locator("#restoreGreenhouseBtn").click();
      await page.waitForFunction(() => (
        document.querySelector("#roundOneRestoration")?.dataset.restorationPhase === "settled"
      ), null, { timeout: 3000 });
      const action = page.locator("#nextOrderBtn");
      await expect(action).toBeVisible();
      await expect(action).toBeFocused();
      const actionBox = await action.boundingBox();
      expect(actionBox).toBeTruthy();
      const actionPoint = {
        x: actionBox.x + actionBox.width / 2,
        y: actionBox.y + actionBox.height / 2
      };

      await activateAt(page, config.mode, actionPoint);
      const entered = await boardAuthority(page);
      expect(entered.round).toBe(2);
      expect(entered.moves).toBe(9);
      await page.waitForTimeout(60);
      await activateAt(page, config.mode, actionPoint);
      await page.waitForTimeout(config.mode === "keyboard" ? 320 : 380);

      const guarded = await boardAuthority(page);
      expect(guarded).toMatchObject({
        round: 2,
        moves: 9,
        counts: [0, 0, 0, 0, 0, 0],
        selected: [],
        tiles: 64,
        rows: 8,
        scrollY: 0,
        overflowX: false,
        brokenImages: []
      });
      expect(guarded.hints).toHaveLength(2);
      expect(guarded.boardSave).toBe(entered.boardSave);
      expect(guarded.rovingIds).toEqual([guarded.hints[0].id]);
      expect(guarded.activeId).toBe(guarded.hints[0].id);
      expect(guarded.boardWidth).toBeCloseTo(config.mobile ? 378 : 600, 0);
      expect(guarded.boardHeight).toBeCloseTo(config.mobile ? 378 : 600, 0);
      if (config.mobile) {
        expect(guarded.overflowY).toBe(false);
      }

      const boardBeforeCommit = guarded.boardSave;
      if (config.mode === "keyboard") {
        await page.keyboard.press("Enter");
        await page.keyboard.press("Space");
      } else {
        await activateTile(page, config.mode, guarded.hints[0]);
        await activateTile(page, config.mode, guarded.hints[1]);
      }
      await page.waitForFunction((key) => {
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        return saved.currentRound === 2
          && saved.moves === 8
          && document.querySelector("#board")?.getAttribute("aria-busy") !== "true";
      }, SAVE_KEY, { timeout: 10000 });
      const committed = await boardAuthority(page);
      expect(committed.round).toBe(2);
      expect(committed.moves).toBe(8);
      expect(committed.boardSave).not.toBe(boardBeforeCommit);
      expect(committed.selected).toEqual([]);
      expect(committed.rovingIds).toHaveLength(1);
      expect(committed.activeId).toBe(committed.rovingIds[0]);
      expect(committed.tiles).toBe(64);
      expect(committed.rows).toBe(8);
      expect(committed.overflowX).toBe(false);
      expect(committed.brokenImages).toEqual([]);
      expect(browserMessages).toEqual([]);
      expect(pageErrors).toEqual([]);
      await page.screenshot({
        path: `work/payoff-handoff-${config.label}.png`,
        fullPage: false
      });
    } finally {
      await context.close();
    }
  });
}

for (const config of [
  {
    label: "round2-to-round3-desktop-pointer",
    viewport: { width: 1280, height: 720 },
    mobile: false,
    motion: "no-preference",
    mode: "pointer",
    startingRound: 2,
    expectedRound: 3,
    expectedMoves: 8
  },
  {
    label: "round3-to-round1-mobile390-touch-reduced",
    viewport: { width: 390, height: 844 },
    mobile: true,
    motion: "reduce",
    mode: "touch",
    startingRound: 3,
    expectedRound: 1,
    expectedMoves: 6
  }
]) {
  test(`shared payoff guard owns ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: config.mobile,
      isMobile: config.mobile,
      reducedMotion: config.motion
    });
    const page = await context.newPage();
    try {
      await openSettledPayoffFixture(page, config.label, config.startingRound);
      const actionBox = await page.locator("#nextOrderBtn").boundingBox();
      expect(actionBox).toBeTruthy();
      const actionPoint = {
        x: actionBox.x + actionBox.width / 2,
        y: actionBox.y + actionBox.height / 2
      };
      await activateAt(page, config.mode, actionPoint);
      const entered = await boardAuthority(page);
      expect(entered.round).toBe(config.expectedRound);
      expect(entered.moves).toBe(config.expectedMoves);
      await page.waitForTimeout(60);
      await activateAt(page, config.mode, actionPoint);
      await page.waitForTimeout(config.mode === "keyboard" ? 320 : 380);
      const guarded = await boardAuthority(page);
      expect(guarded).toMatchObject({
        round: config.expectedRound,
        moves: config.expectedMoves,
        counts: [0, 0, 0, 0, 0, 0],
        selected: [],
        tiles: 64,
        rows: 8,
        scrollY: 0,
        overflowX: false,
        brokenImages: []
      });
      expect(guarded.rovingIds).toHaveLength(1);
      expect(guarded.boardSave).toBe(entered.boardSave);
      expect(guarded.activeId).toBe(guarded.rovingIds[0]);
      expect(guarded.boardWidth).toBeCloseTo(config.mobile ? 378 : 600, 0);
      expect(guarded.boardHeight).toBeCloseTo(config.mobile ? 378 : 600, 0);
    } finally {
      await context.close();
    }
  });
}
