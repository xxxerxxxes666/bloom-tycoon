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

const POST_OPENING_CASES = [
  { label: "desktop-keyboard", viewport: { width: 1280, height: 720 }, input: "keyboard" },
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
  { label: "desktop-pointer-reduced", viewport: { width: 1280, height: 720 }, input: "pointer", reduced: true },
  { label: "mobile-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "mobile-touch-reduced", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
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
  const hintedTiles = page.locator("#board .tile.idle-hint");
  await expect(hintedTiles).toHaveCount(2, { timeout: 3000 });
  const cells = await hintedTiles.evaluateAll((tiles) => (
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

async function activateTile(page, id, input, key = "Enter") {
  const tile = page.locator(`#${id}`);
  if (input === "touch") await tile.tap();
  else if (input === "pointer") await tile.click();
  else await tile.press(key);
}

async function activateHelp(page, input) {
  if (input === "touch") await page.locator("#tutorialHelpBtn").tap();
  else if (input === "pointer") await page.locator("#tutorialHelpBtn").click();
  else {
    await page.keyboard.press("Tab");
    await expect(page.locator("#tutorialHelpBtn")).toBeFocused();
    await page.keyboard.press("Enter");
  }
}

async function dismissHelp(page, input) {
  if (input === "touch") await page.locator("#tutorialSkipBtn").tap();
  else if (input === "pointer") await page.locator("#tutorialSkipBtn").click();
  else await page.keyboard.press("Enter");
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
  test(`Help retires only a conflicting transient selection on ${testCase.label}`, async ({ browser }) => {
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
      await openFresh(page, `conflicting-selection-${testCase.label}`);
      const pair = await openingPair(page);
      await page.locator("#tutorialSkipBtn").click();
      await expect(page.locator(`#${pair.source.id}`)).toBeFocused();
      await page.waitForTimeout(150);
      const unrelated = page.locator("#tile-0-0");
      if (testCase.input === "touch") await unrelated.tap();
      else await unrelated.press("Enter");
      await expect(unrelated).toHaveClass(/sel|selected/);
      const beforeHelp = await stateReport(page);
      expect(beforeHelp.selectedIds).toEqual(["tile-0-0"]);
      expect(beforeHelp.activeId).toBe("tile-0-0");
      expect(beforeHelp.rovingIds).toEqual(["tile-0-0"]);
      await expect(page.locator("body")).not.toHaveClass(/selected-guided-play/);
      await expect(page.locator(".tile.guided-counterpart")).toHaveCount(0);

      const beforeState = beforeHelp.state;
      if (testCase.input === "touch") {
        await page.locator("#tutorialHelpBtn").tap();
      } else {
        await page.keyboard.press("Tab");
        await expect(page.locator("#tutorialHelpBtn")).toBeFocused();
        await page.keyboard.press("Enter");
      }
      await expect(page.locator("#tutorialPanel")).toBeVisible();
      await expect(page.locator("#tutorialSkipBtn")).toBeFocused();
      await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2);
      const duringHelp = await stateReport(page);
      expect(duringHelp.selectedIds, `${testCase.label} conflicting selection retires`).toEqual([]);
      expect(duringHelp.rovingIds, `${testCase.label} guide source owns board entry`).toEqual([pair.source.id]);
      expect(duringHelp.state.moves, `${testCase.label} Help spends no move`).toBe(beforeState.moves);
      expect(duringHelp.state.counts, `${testCase.label} Help changes no objective`).toEqual(beforeState.counts);
      expect(duringHelp.state.board, `${testCase.label} Help preserves board identity`).toEqual(beforeState.board);
      expect(duringHelp.liveOwners, `${testCase.label} Help remains sole narrator`).toEqual(["tutorialPanel"]);

      if (testCase.input === "touch") await page.locator("#tutorialSkipBtn").tap();
      else {
        await page.waitForTimeout(140);
        await page.keyboard.press("Enter");
      }
      await expect(page.locator("#tutorialPanel")).toBeHidden();
      await expect(page.locator("#board .tile[tabindex='0']")).toHaveAttribute("id", pair.source.id);
      await expect(page.locator(`#${pair.destination.id}`)).toHaveAttribute("tabindex", "-1");

      if (testCase.input === "touch") {
        await expect(page.locator(`#${pair.source.id}`)).toBeFocused();
        await page.locator(`#${pair.source.id}`).tap();
        await page.locator(`#${pair.destination.id}`).tap();
      } else {
        await expect(page.locator("#tutorialHelpBtn")).toBeFocused();
        await page.keyboard.press("Shift+Tab");
        await expect(page.locator(`#${pair.source.id}`)).toBeFocused();
        await page.keyboard.press("Enter");
        await page.locator(`#${pair.destination.id}`).press("Space");
      }
      await page.waitForFunction((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === 5
          && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
      }, SAVE_KEY, { timeout: 12000 });
      const settled = await stateReport(page);
      expect(settled.state.moves, `${testCase.label} guided pair commits once`).toBe(5);
      expect(settled.state.counts[5], `${testCase.label} guided pair earns target credit`).toBeGreaterThan(0);
      expect(settled.selectedIds).toEqual([]);
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

test("Help preserves a selected flower that already belongs to its guided pair", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });
  const page = await context.newPage();
  try {
    await openFresh(page, "guided-selection-preserved");
    const pair = await openingPair(page);
    await page.locator("#tutorialSkipBtn").tap();
    await expect(page.locator(`#${pair.source.id}`)).toBeFocused();
    await page.waitForTimeout(150);
    await page.locator(`#${pair.source.id}`).tap();
    await expect(page.locator(`#${pair.source.id}`)).toHaveClass(/sel|selected/);
    await expect(page.locator("body")).toHaveClass(/selected-guided-play/);
    await expect(page.locator(`#${pair.destination.id}`)).toHaveClass(/guided-counterpart/);
    await expect(page.locator(`#${pair.destination.id}`)).toHaveAttribute(
      "aria-label",
      /legal match swap target.*guided exchange destination/
    );
    await expect(page.locator(".tile.legal-target[aria-label*='legal match swap target']")).toHaveCount(1);
    expect(await page.locator(".tile.match-preview:not(.guided-counterpart)").evaluateAll((tiles) => (
      tiles.every((tile) => Number.parseFloat(getComputedStyle(tile, "::after").opacity || "0") <= .3)
    ))).toBe(true);

    await page.locator("#tutorialHelpBtn").tap();
    await expect(page.locator("#tutorialPanel")).toBeVisible();
    await expect(page.locator("#tutorialCopy")).toHaveText("Choose the other glowing flower.");
    await expect(page.locator("body")).toHaveClass(/selected-guided-help/);
    await expect(page.locator(`#${pair.destination.id}`)).toHaveClass(/guided-counterpart/);
    await expect(page.locator(".tile[aria-label*='guided exchange destination']")).toHaveCount(1);
    await expect(page.locator(".tile.legal-target[aria-label*='legal match swap target']")).toHaveCount(1);
    expect(await page.locator(".tile.legal-target:not(.guided-counterpart)").evaluateAll((tiles) => (
      tiles.every((tile) => Number.parseFloat(getComputedStyle(tile, "::after").opacity || "0") <= .25)
    ))).toBe(true);
    await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2);
    const duringHelp = await stateReport(page);
    expect(duringHelp.selectedIds).toEqual([pair.source.id]);
    expect(duringHelp.rovingIds).toEqual([pair.source.id]);
    expect(duringHelp.state.moves).toBe(6);
    expect(duringHelp.state.counts).toEqual([0, 0, 0, 0, 0, 0]);

    await page.locator("#tutorialSkipBtn").tap();
    await expect(page.locator(`#${pair.source.id}`)).toBeFocused();
    await expect(page.locator("body")).toHaveClass(/selected-guided-play/);
    await expect(page.locator(`#${pair.destination.id}`)).toHaveClass(/guided-counterpart/);
    await expect(page.locator(".tile[aria-label*='guided exchange destination']")).toHaveCount(1);
    await expect(page.locator(".tile.legal-target[aria-label*='legal match swap target']")).toHaveCount(1);
    await page.locator(`#${pair.destination.id}`).tap();
    await page.waitForFunction((key) => {
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      return state.moves === 5
        && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
    }, SAVE_KEY, { timeout: 12000 });
    const settled = await stateReport(page);
    await expect(page.locator("body")).not.toHaveClass(/selected-guided-play/);
    await expect(page.locator(".tile.guided-counterpart")).toHaveCount(0);
    expect(settled.state.moves).toBe(5);
    expect(settled.state.counts[5]).toBeGreaterThan(0);
    expect(settled.selectedIds).toEqual([]);
    expect(settled.rovingIds).toEqual([settled.activeId]);
    expect(settled.tiles).toBe(64);
    expect(settled.rows).toBe(8);
    expect(settled.boardWidth).toBeCloseTo(378, 1);
    expect(settled.scrollY).toBe(0);
    expect(settled.overflowX).toBe(false);
    expect(settled.overflowY).toBe(false);
    expect(settled.brokenImages).toEqual([]);
  } finally {
    await context.close();
  }
});

for (const testCase of POST_OPENING_CASES) {
  for (const selectedEndpoint of ["source", "destination"]) {
    test(`post-opening Help preserves ${selectedEndpoint} continuation on ${testCase.label}`, async ({ browser }) => {
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
        await openFresh(page, `post-opening-${selectedEndpoint}-${testCase.label}`);
        const opening = await openingPair(page);
        await page.locator("#tutorialSkipBtn").click();
        await activateTile(page, opening.source.id, testCase.input);
        await activateTile(page, opening.destination.id, testCase.input, "Space");
        await page.waitForFunction((key) => {
          const state = JSON.parse(localStorage.getItem(key) || "{}");
          return state.moves === 5
            && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
        }, SAVE_KEY, { timeout: 12000 });
        await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2, { timeout: 10000 });
        await expect(page.locator("#firstSwapCue")).toContainText("Match Thorn Rose with the glowing pair.");

        const followupIds = await page.locator("#board .tile.idle-hint").evaluateAll((tiles) => (
          tiles.map((tile) => tile.id).sort()
        ));
        expect(followupIds).toEqual(["tile-3-0", "tile-3-1"]);
        const followup = {
          source: "tile-3-0",
          destination: "tile-3-1"
        };
        const selectedId = followup[selectedEndpoint];
        const counterpartId = selectedEndpoint === "source" ? followup.destination : followup.source;
        const selectedRovingId = testCase.input === "keyboard" ? counterpartId : selectedId;
        const beforeSelection = await stateReport(page);

        await activateTile(page, selectedId, testCase.input);
        await expect(page.locator(`#${selectedId}`)).toHaveClass(/sel|selected/);
        await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2);
        const selectedState = await stateReport(page);
        expect(selectedState.selectedIds).toEqual([selectedId]);
        expect(selectedState.activeId).toBe(selectedRovingId);
        expect(selectedState.rovingIds).toEqual([selectedRovingId]);
        expect(selectedState.state.moves).toBe(5);
        expect(selectedState.state.counts).toEqual(beforeSelection.state.counts);
        expect(selectedState.state.board).toEqual(beforeSelection.state.board);

        await activateHelp(page, testCase.input);
        await expect(page.locator("#tutorialPanel")).toBeVisible();
        await expect(page.locator("#tutorialSkipBtn")).toBeFocused();
        await expect(page.locator("#tutorialCopy")).toHaveText("Match Thorn Rose.");
        await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2);
        const duringHelpIds = await page.locator("#board .tile.idle-hint").evaluateAll((tiles) => (
          tiles.map((tile) => tile.id).sort()
        ));
        expect(duringHelpIds).toEqual(followupIds);
        const duringHelp = await stateReport(page);
        expect(duringHelp.selectedIds).toEqual([selectedId]);
        expect(duringHelp.rovingIds).toEqual([selectedRovingId]);
        expect(duringHelp.liveOwners).toEqual(["tutorialPanel"]);
        expect(duringHelp.state.moves).toBe(5);
        expect(duringHelp.state.counts).toEqual(beforeSelection.state.counts);
        expect(duringHelp.state.board).toEqual(beforeSelection.state.board);

        if (testCase.input === "keyboard") {
          await page.waitForTimeout(140);
        }
        await dismissHelp(page, testCase.input);
        await expect(page.locator("#tutorialPanel")).toBeHidden();
        await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2);
        const afterSkipIds = await page.locator("#board .tile.idle-hint").evaluateAll((tiles) => (
          tiles.map((tile) => tile.id).sort()
        ));
        expect(afterSkipIds).toEqual(followupIds);
        const afterSkip = await stateReport(page);
        expect(afterSkip.selectedIds).toEqual([selectedId]);
        expect(afterSkip.rovingIds).toEqual([selectedRovingId]);
        expect(afterSkip.state.moves).toBe(5);
        expect(afterSkip.state.counts).toEqual(beforeSelection.state.counts);
        expect(afterSkip.state.board).toEqual(beforeSelection.state.board);

        if (testCase.input === "keyboard") {
          await page.waitForTimeout(140);
        }
        await activateTile(page, counterpartId, testCase.input, "Space");
        await page.waitForFunction((key) => {
          const state = JSON.parse(localStorage.getItem(key) || "{}");
          return state.moves === 4
            && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
        }, SAVE_KEY, { timeout: 12000 });
        const settled = await stateReport(page);
        expect(settled.state.moves).toBe(4);
        expect(settled.state.counts[5]).toBeGreaterThan(beforeSelection.state.counts[5]);
        expect(settled.selectedIds).toEqual([]);
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
        } else {
          expect(settled.boardWidth).toBeCloseTo(600, 1);
        }
        expect(browserErrors).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
}

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
