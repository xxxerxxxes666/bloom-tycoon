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
    label: "desktop-keyboard",
    viewport: { width: 1280, height: 720 },
    input: "keyboard"
  },
  {
    label: "desktop-keyboard-reduced",
    viewport: { width: 1280, height: 720 },
    input: "keyboard",
    reduced: true
  },
  {
    label: "mobile-touch",
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
  }, { key: SAVE_KEY, seedToken: `fresh-tutorial-focus-${label}` });
  await page.goto(`${BASE_URL}?fresh-tutorial-focus=${label}`, { waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
}

async function openingPair(page) {
  const cells = await page.locator("#board .tile.idle-hint").evaluateAll((tiles) => (
    tiles.map((tile) => ({ id: tile.id, x: Number(tile.dataset.x), y: Number(tile.dataset.y) }))
  ));
  expect(cells, "fresh tutorial exposes one pair").toHaveLength(2);
  const source = cells.find(({ id }) => id === "tile-1-0") || cells[0];
  const destination = cells.find(({ id }) => id !== source.id);
  return { source, destination };
}

async function stateReport(page) {
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const visible = (node) => Boolean(node)
      && !node.hidden
      && getComputedStyle(node).display !== "none"
      && node.getBoundingClientRect().width > 0
      && node.getBoundingClientRect().height > 0;
    return {
      state,
      activeId: document.activeElement?.id || "",
      rovingIds: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      selectedIds: tiles.filter((tile) => tile.classList.contains("sel") || tile.classList.contains("selected"))
        .map((tile) => tile.id),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      disabled: tiles.filter((tile) => tile.disabled).length,
      boardWidth: board?.width || 0,
      boardBottom: board?.bottom || 0,
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
      liveOwners: Array.from(document.querySelectorAll("[aria-live]"))
        .filter(visible)
        .filter((node) => ["polite", "assertive"].includes(node.getAttribute("aria-live")))
        .map((node) => node.id),
      coinLive: document.querySelector("#coinBalance")?.getAttribute("aria-live") || "",
      firstCueLive: document.querySelector("#firstSwapCue")?.getAttribute("aria-live") || "",
      firstCueVisible: visible(document.querySelector("#firstSwapCue")),
      tutorialLive: document.querySelector("#tutorialPanel")?.getAttribute("aria-live") || ""
    };
  }, SAVE_KEY);
}

async function openOwnedReplayRoundOne(page, label) {
  await page.goto(`${BASE_URL}?owned-replay-cue=${label}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    Object.assign(state, {
      currentRound: 3,
      roundComplete: true,
      moves: 0,
      coins: 50,
      counts: [13, 0, 0, 14, 0, 0],
      cursedThorns: [],
      clearedCursedThorns: 0,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: true,
      freshConservatorySettlement: false,
      hasMadeValidMove: true,
      restoredRoundTwoGuideMoves: 2,
      tutorialSkipped: true,
      tutorialActive: false,
      blackCandleLessonComplete: true
    });
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#nextOrderBtn")).toBeVisible();
  await page.locator("#nextOrderBtn").click();
  await expect(page.locator("body")).toHaveClass(/owned-replay-entry/);
  await expect(page.locator("#firstSwapCue")).toBeVisible();
  await expect(page.locator("#board .tile")).toHaveCount(64);
}

for (const testCase of CASES) {
  test(`fresh tutorial hands the untouched board to its source on ${testCase.label}`, async ({ browser }) => {
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
      const initial = await stateReport(page);
      expect(initial.activeId, `${testCase.label} source receives DOM focus`).toBe(pair.source.id);
      expect(initial.rovingIds, `${testCase.label} source solely owns roving focus`).toEqual([pair.source.id]);
      expect(initial.selectedIds, `${testCase.label} focus creates no selection`).toEqual([]);
      expect(initial.state.moves, `${testCase.label} focus spends no move`).toBe(6);
      expect(initial.state.counts, `${testCase.label} focus changes no objectives`).toEqual([0, 0, 0, 0, 0, 0]);
      expect(initial.liveOwners, `${testCase.label} tutorial remains the sole narrator`).toEqual(["tutorialPanel"]);

      const untouchedSave = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
      for (let reload = 1; reload <= 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator("#tutorialPanel")).toBeVisible();
        const restored = await stateReport(page);
        expect(
          await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
          `${testCase.label} reload ${reload} exact save`
        ).toBe(untouchedSave);
        expect(restored.activeId, `${testCase.label} reload ${reload} source focus`).toBe(pair.source.id);
        expect(restored.rovingIds, `${testCase.label} reload ${reload} sole roving source`)
          .toEqual([pair.source.id]);
        await expect(page.locator(`#${pair.destination.id}`), `${testCase.label} reload ${reload} destination stays out of tab order`)
          .toHaveAttribute("tabindex", "-1");
        expect(restored.selectedIds, `${testCase.label} reload ${reload} no selection`).toEqual([]);
        expect(restored.state.moves, `${testCase.label} reload ${reload} no move spent`).toBe(6);
        expect(restored.state.counts, `${testCase.label} reload ${reload} no objective drift`)
          .toEqual([0, 0, 0, 0, 0, 0]);
        expect(restored.liveOwners, `${testCase.label} reload ${reload} tutorial narration`)
          .toEqual(["tutorialPanel"]);
      }

      if (testCase.input === "keyboard") {
        await page.keyboard.press("Tab");
        await expect(page.locator("#tutorialSkipBtn")).toBeFocused();
        await page.keyboard.press("Shift+Tab");
        await expect(page.locator(`#${pair.source.id}`)).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(page.locator(`#${pair.destination.id}`)).toBeFocused();
        await page.keyboard.press("Space");
      } else {
        await page.locator(`#${pair.source.id}`).tap();
        await page.locator(`#${pair.destination.id}`).tap();
      }

      await page.waitForFunction((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === 5
          && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
      }, SAVE_KEY, { timeout: 12000 });
      const settled = await stateReport(page);
      expect(settled.state.moves, `${testCase.label} opening commits once`).toBe(5);
      expect(settled.state.counts[5], `${testCase.label} opening earns Thorn Rose progress`).toBeGreaterThan(0);
      expect(settled.selectedIds, `${testCase.label} opening clears selection`).toEqual([]);
      expect(settled.activeId, `${testCase.label} control returns to the board`).toMatch(/^tile-/);
      expect(settled.rovingIds, `${testCase.label} focus and roving agree`).toEqual([settled.activeId]);
      expect(settled.tiles, `${testCase.label} tile integrity`).toBe(64);
      expect(settled.rows, `${testCase.label} row integrity`).toBe(8);
      expect(settled.disabled, `${testCase.label} control returned`).toBe(0);
      expect(settled.boardBottom, `${testCase.label} board stays in viewport`).toBeLessThanOrEqual(testCase.viewport.height);
      expect(settled.scrollY, `${testCase.label} viewport does not drift`).toBe(0);
      expect(settled.overflowX, `${testCase.label} no horizontal overflow`).toBe(false);
      expect(settled.brokenImages, `${testCase.label} images loaded`).toEqual([]);
      if (testCase.mobile) {
        expect(settled.boardWidth, `${testCase.label} exact mobile altar`).toBeCloseTo(378, 1);
        expect(settled.overflowY, `${testCase.label} no mobile vertical overflow`).toBe(false);
      }
      expect(browserErrors, `${testCase.label} browser errors`).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("fresh tutorial does not steal focus after pre-panel board input", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });
  const page = await context.newPage();
  try {
    await page.addInitScript((key) => {
      localStorage.removeItem(key);
      sessionStorage.clear();
    }, SAVE_KEY);
    await page.goto(`${BASE_URL}?fresh-tutorial-focus=pre-panel-touch`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#tutorialPanel")).toBeHidden();
    const pair = await openingPair(page);
    await page.locator(`#${pair.source.id}`).tap();
    await expect(page.locator(`#${pair.source.id}`)).toHaveClass(/sel|selected/);
    const prePanelFocus = await stateReport(page);
    await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
    const duringSelection = await stateReport(page);
    expect(duringSelection.selectedIds).toEqual([pair.source.id]);
    expect(duringSelection.activeId, "delayed panel preserves the player's board focus")
      .toBe(prePanelFocus.activeId);
    expect(duringSelection.rovingIds).toEqual(prePanelFocus.rovingIds);
    expect(duringSelection.state.moves).toBe(6);
    await page.locator(`#${pair.destination.id}`).tap();
    await page.waitForFunction((key) => (
      JSON.parse(localStorage.getItem(key) || "{}").moves === 5
        && document.querySelector("#board")?.getAttribute("aria-busy") === "false"
    ), SAVE_KEY, { timeout: 12000 });
    const settled = await stateReport(page);
    expect(settled.state.moves).toBe(5);
    expect(settled.selectedIds).toEqual([]);
    expect(settled.tiles).toBe(64);
    expect(settled.rows).toBe(8);
    expect(settled.boardWidth).toBeCloseTo(378, 1);
    expect(settled.overflowX).toBe(false);
    expect(settled.overflowY).toBe(false);
  } finally {
    await context.close();
  }
});

test("untouched Help replay reload keeps Skip as the stronger focus owner", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await openFresh(page, "untouched-help-replay");
    const pair = await openingPair(page);
    await expect(page.locator(`#${pair.source.id}`)).toBeFocused();
    await page.locator("#tutorialSkipBtn").tap();
    await expect(page.locator("#tutorialPanel")).toBeHidden();
    await expect(page.locator(`#${pair.source.id}`)).toBeFocused();
    await page.locator("#tutorialHelpBtn").tap();
    await expect(page.locator("#tutorialPanel")).toBeVisible();
    await expect(page.locator("#tutorialSkipBtn")).toBeFocused();
    const replaySave = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("#tutorialPanel")).toBeVisible();
    await expect(page.locator("#tutorialSkipBtn")).toBeFocused();
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(replaySave);
    const restored = await stateReport(page);
    expect(restored.state.moves).toBe(6);
    expect(restored.state.counts).toEqual([0, 0, 0, 0, 0, 0]);
    expect(restored.selectedIds).toEqual([]);
    expect(restored.rovingIds).toEqual([pair.source.id]);
    expect(restored.tiles).toBe(64);
    expect(restored.rows).toBe(8);
    expect(restored.boardWidth).toBeCloseTo(378, 1);
    expect(restored.scrollY).toBe(0);
    expect(restored.overflowX).toBe(false);
    expect(restored.overflowY).toBe(false);
  } finally {
    await context.close();
  }
});

for (const testCase of CASES) {
  test(`visible owned-replay board cue solely owns narration on ${testCase.label}`, async ({ browser }) => {
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
      await openOwnedReplayRoundOne(page, testCase.label);
      for (let load = 0; load < 3; load += 1) {
        if (load > 0) await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator("#firstSwapCue")).toBeVisible();
        const cueState = await stateReport(page);
        expect(cueState.liveOwners, `${testCase.label} load ${load} cue is sole narrator`)
          .toEqual(["firstSwapCue"]);
        expect(cueState.coinLive, `${testCase.label} load ${load} wallet is quiet`).toBe("off");
        expect(cueState.firstCueLive, `${testCase.label} load ${load} cue is polite`).toBe("polite");
        expect(cueState.activeId, `${testCase.label} load ${load} board owns focus`).toMatch(/^tile-/);
        expect(cueState.rovingIds, `${testCase.label} load ${load} focus and roving agree`)
          .toEqual([cueState.activeId]);
        expect(cueState.tiles).toBe(64);
        expect(cueState.rows).toBe(8);
        expect(cueState.selectedIds).toEqual([]);
      }

      await page.locator("#tutorialHelpBtn").click();
      await expect(page.locator("#tutorialPanel")).toBeVisible();
      const tutorialState = await stateReport(page);
      expect(tutorialState.liveOwners, `${testCase.label} Help replay owns narration`)
        .toEqual(["tutorialPanel"]);
      expect(tutorialState.coinLive).toBe("off");
      expect(tutorialState.firstCueLive).toBe("off");

      await page.locator("#tutorialSkipBtn").click();
      await expect(page.locator("#firstSwapCue")).toBeVisible();
      const restoredCue = await stateReport(page);
      expect(restoredCue.liveOwners, `${testCase.label} Skip restores cue ownership`)
        .toEqual(["firstSwapCue"]);

      const pair = await openingPair(page);
      if (testCase.input === "keyboard") {
        await page.locator(`#${pair.source.id}`).press("Enter");
        await page.locator(`#${pair.destination.id}`).press("Space");
      } else {
        await page.locator(`#${pair.source.id}`).tap();
        await page.locator(`#${pair.destination.id}`).tap();
      }
      await page.waitForFunction((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === 5 && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
      }, SAVE_KEY, { timeout: 12000 });
      await expect(page.locator("#firstSwapCue"), `${testCase.label} settled receipt becomes visible`)
        .toBeVisible({ timeout: 3000 });
      const settled = await stateReport(page);
      expect(settled.state.moves, `${testCase.label} opening commits once`).toBe(5);
      expect(settled.state.counts[5], `${testCase.label} Thorn Rose progress`).toBeGreaterThan(0);
      expect(settled.liveOwners, `${testCase.label} visible result/follow-up cue remains sole narrator`)
        .toEqual(["firstSwapCue"]);
      expect(settled.coinLive).toBe("off");
      expect(settled.activeId).toMatch(/^tile-/);
      expect(settled.rovingIds).toEqual([settled.activeId]);
      expect(settled.tiles).toBe(64);
      expect(settled.rows).toBe(8);
      expect(settled.scrollY).toBe(0);
      expect(settled.overflowX).toBe(false);
      expect(settled.brokenImages).toEqual([]);
      if (testCase.mobile) {
        expect(settled.boardWidth).toBeCloseTo(378, 1);
        expect(settled.overflowY).toBe(false);
      }
      expect(browserErrors, `${testCase.label} browser errors`).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
