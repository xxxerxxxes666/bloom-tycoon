const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const ROUND_FIXTURES = {
  1: {
    coins: 0,
    owned: [false, false, false],
    moves: 6,
    failedState: {
      currentRound: 1,
      moves: 0,
      counts: [0, 6, 0, 0, 0, 5],
      coins: 0,
      roundOneRestored: false,
      roundTwoGreenhouseUpgraded: false,
      roundThreeConservatoryRaised: false
    },
    objectiveCounts: ["Thorn Rose 5/8", "Bone Star 6/6"],
    failedDeficits: ["3 Thorn Rose still needed"],
    completedSelectors: ['.objective-target[data-flower-id="1"].complete'],
    retryCue: /Swap the glowing pair|Thorn Rose next|Bone Star next/,
    progressCheck: (before, after) => after.counts[5] > before.counts[5] || after.counts[1] > before.counts[1]
  },
  2: {
    coins: 20,
    owned: [true, false, false],
    moves: 9,
    failedState: {
      currentRound: 2,
      moves: 0,
      counts: [0, 0, 7, 0, 9, 7],
      coins: 20,
      clearedCursedThorns: 3,
      cursedThorns: [],
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: false,
      roundThreeConservatoryRaised: false
    },
    objectiveCounts: ["Nightshade 7/10", "Amber Seed 9/9", "Thorn Rose 7/7", "Cursed Thorn 3/3"],
    failedDeficits: ["3 Nightshade still needed"],
    completedSelectors: [
      '.objective-target[data-flower-id="4"].complete',
      '.objective-target[data-flower-id="5"].complete',
      '.objective-target[data-thorn-objective="true"].complete'
    ],
    retryCue: /Crack the marked thorns/,
    progressCheck: (before, after) => after.clearedCursedThorns > before.clearedCursedThorns
  },
  3: {
    coins: 50,
    owned: [true, true, false],
    moves: 8,
    failedState: {
      currentRound: 3,
      moves: 0,
      counts: [13, 0, 0, 11, 0, 0],
      coins: 50,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: false
    },
    objectiveCounts: ["Bloodroot 11/14", "Sol Rot 13/13"],
    failedDeficits: ["3 Bloodroot still needed"],
    completedSelectors: ['.objective-target[data-flower-id="0"].complete'],
    retryCue: /Match Bloodroot and Sol Rot|Bloodroot next|Sol Rot next/,
    progressCheck: (before, after) => after.counts[3] > before.counts[3] || after.counts[0] > before.counts[0]
  }
};

const VIEWPORTS = [
  { label: "desktop", viewport: { width: 1280, height: 720 }, mobile: false, reduced: false },
  { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true, reduced: false },
  { label: "desktop-reduced", viewport: { width: 1280, height: 720 }, mobile: false, reduced: true },
  { label: "mobile390-reduced", viewport: { width: 390, height: 844 }, mobile: true, reduced: true }
];

test.setTimeout(180000);

function baseState(fixture) {
  return {
    focusedEconomyVersion: 2,
    board: null,
    armedLineRelic: { x: 3, y: 3, direction: "horizontal", flowerId: 1 },
    counts: [0, 0, 0, 0, 0, 0],
    cursedThorns: [],
    clearedCursedThorns: 0,
    currentRound: 1,
    roundComplete: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: 2,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true,
    ...fixture.failedState
  };
}

async function openFailedState(page, round, label) {
  const fixture = ROUND_FIXTURES[round];
  await page.goto(`${BASE_URL}?failure-retry=${label}-r${round}`, { waitUntil: "networkidle" });
  await page.evaluate(({ key, state }) => {
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: SAVE_KEY, state: baseState(fixture) });
  await page.reload({ waitUntil: "networkidle" });
}

async function uiState(page) {
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
    const boardRect = document.querySelector("#board")?.getBoundingClientRect();
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      state,
      objective: document.querySelector("#objective")?.innerText.replace(/\s+/g, " ").trim() || "",
      ceremony: document.querySelector("#roundCeremony")?.innerText.replace(/\s+/g, " ").trim() || "",
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      visibleButtons: Array.from(document.querySelectorAll("button"))
        .filter((button) => visible(button) && !button.closest(".board"))
        .map((button) => button.textContent.trim())
        .filter(Boolean),
      tiles: document.querySelectorAll(".tile").length,
      rows: new Set(Array.from(document.querySelectorAll(".tile"), (tile) => tile.dataset.y)).size,
      disabledTiles: Array.from(document.querySelectorAll(".tile")).filter((tile) => tile.disabled).length,
      idleHints: Array.from(document.querySelectorAll(".tile.idle-hint")).map((tile) => ({
        x: Number(tile.dataset.x),
        y: Number(tile.dataset.y),
        flowerId: Number(tile.dataset.flowerId)
      })),
      thornTeachTiles: document.querySelectorAll(".tile.thorn-teach").length,
      cursedThornTiles: document.querySelectorAll(".tile.cursed-thorn").length,
      relicTiles: document.querySelectorAll(".tile.black-candle-vine").length,
      failureMarked: document.querySelector("#roundCeremony")?.classList.contains("failed") || false,
      retryVisible: visible(document.querySelector("#renewBtn.visible")),
      payoffVisible: visible(document.querySelector("#roundOneRestoration")),
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      boardBottom: boardRect?.bottom || 0,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function assertFailedState(page, round, label) {
  const fixture = ROUND_FIXTURES[round];
  const report = await uiState(page);
  expect(report.objective).toContain(`ROUND ${round} · BOUQUET WITHERED`);
  expect(report.objective).toContain("Moves 0");
  for (const count of fixture.objectiveCounts) {
    expect(report.objective, `${label} round ${round} objective count ${count}`).toContain(count);
  }
  for (const deficit of fixture.failedDeficits) {
    expect(report.ceremony, `${label} round ${round} deficit ${deficit}`).toContain(deficit);
  }
  for (const selector of fixture.completedSelectors) {
    await expect(page.locator(selector), `${label} round ${round} completed target ${selector}`).toHaveCount(1);
  }
  expect(report.visibleButtons).toEqual(["Retry Bouquet"]);
  expect(report.tiles).toBe(64);
  expect(report.rows).toBe(8);
  expect(report.disabledTiles).toBe(64);
  expect(report.idleHints).toHaveLength(0);
  expect(report.failureMarked).toBe(true);
  expect(report.retryVisible).toBe(true);
  expect(report.payoffVisible).toBe(false);
  expect(report.overflowX).toBe(false);
  expect(report.brokenImages).toEqual([]);
  expect(report.state.coins).toBe(fixture.coins);
  expect([
    Boolean(report.state.roundOneRestored),
    Boolean(report.state.roundTwoGreenhouseUpgraded),
    Boolean(report.state.roundThreeConservatoryRaised)
  ]).toEqual(fixture.owned);
  if (label.includes("mobile390")) {
    expect(report.boardBottom).toBeLessThanOrEqual(844);
  }
  return report;
}

async function clickOrTap(locator, mobile) {
  if (mobile) {
    await locator.tap();
  } else {
    await locator.click();
  }
}

async function exerciseGuidedPair(page, mobile) {
  const before = (await uiState(page)).state;
  const hints = (await uiState(page)).idleHints;
  expect(hints).toHaveLength(2);
  await clickOrTap(page.locator(`.tile[data-x="${hints[0].x}"][data-y="${hints[0].y}"]`), mobile);
  await clickOrTap(page.locator(`.tile[data-x="${hints[1].x}"][data-y="${hints[1].y}"]`), mobile);
  await page.waitForFunction((movesBefore) => {
    const state = JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}");
    return state.moves < movesBefore || state.roundComplete;
  }, before.moves, { timeout: 10000 });
  await page.waitForTimeout(650);
  return { before, after: (await uiState(page)).state };
}

for (const config of VIEWPORTS) {
  for (const round of [1, 2, 3]) {
    test(`focused failure retry recovery ${config.label} round ${round}`, async ({ browser, page }) => {
      const activePage = config.mobile
        ? await browser.newPage({ viewport: config.viewport, hasTouch: true, isMobile: true })
        : page;
      const consoleMessages = [];
      const pageErrors = [];
      const failedRequests = [];
      activePage.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") {
          consoleMessages.push(`${message.type()}: ${message.text()}`);
        }
      });
      activePage.on("pageerror", (error) => pageErrors.push(error.message));
      activePage.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));
      await activePage.setViewportSize(config.viewport);
      if (config.reduced) {
        await activePage.emulateMedia({ reducedMotion: "reduce" });
      }

      try {
        await openFailedState(activePage, round, config.label);
        await assertFailedState(activePage, round, config.label);
        await activePage.screenshot({ path: `work/failure-retry-${config.label}-r${round}-failed.png`, fullPage: true });
        for (let reload = 0; reload < 2; reload += 1) {
          await activePage.reload({ waitUntil: "networkidle" });
          await assertFailedState(activePage, round, `${config.label}-reload${reload + 1}`);
        }

        await clickOrTap(activePage.locator("#renewBtn.visible"), config.mobile);
        await activePage.waitForFunction(() => Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled), null, { timeout: 5000 });
        const retried = await uiState(activePage);
        const fixture = ROUND_FIXTURES[round];
        expect(retried.state.moves).toBe(fixture.moves);
        expect(retried.state.counts).toEqual([0, 0, 0, 0, 0, 0]);
        expect(retried.state.coins).toBe(fixture.coins);
        expect([
          Boolean(retried.state.roundOneRestored),
          Boolean(retried.state.roundTwoGreenhouseUpgraded),
          Boolean(retried.state.roundThreeConservatoryRaised)
        ]).toEqual(fixture.owned);
        expect(retried.relicTiles).toBe(0);
        expect(retried.failureMarked).toBe(false);
        expect(retried.retryVisible).toBe(false);
        expect(retried.cue).toMatch(fixture.retryCue);
        expect(retried.idleHints).toHaveLength(2);
        expect(retried.tiles).toBe(64);
        expect(retried.rows).toBe(8);
        expect(retried.disabledTiles).toBe(0);
        expect(retried.overflowX).toBe(false);
        expect(retried.brokenImages).toEqual([]);
        if (round === 2) {
          expect(retried.cursedThornTiles).toBe(3);
          expect(retried.thornTeachTiles).toBeGreaterThanOrEqual(2);
        }
        await activePage.screenshot({ path: `work/failure-retry-${config.label}-r${round}-retried.png`, fullPage: true });

        const progress = await exerciseGuidedPair(activePage, config.mobile);
        expect(progress.after.moves).toBe(progress.before.moves - 1);
        expect(fixture.progressCheck(progress.before, progress.after)).toBe(true);
        expect(consoleMessages).toEqual([]);
        expect(pageErrors).toEqual([]);
        expect(failedRequests).toEqual([]);
      } finally {
        if (activePage !== page) {
          await activePage.close();
        }
      }
    });
  }
}
