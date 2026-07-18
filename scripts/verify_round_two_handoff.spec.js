const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const CASES = [
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "mobile390-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
  { label: "mobile390-touch-reduced", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
];

test.setTimeout(240000);

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

async function activatePair(page, pair, input) {
  const tileAt = (cell) => page.locator(
    `.tile[data-x="${cell.x}"][data-y="${cell.y}"]`
  );
  if (input === "touch") {
    await tileAt(pair[0]).tap();
    await expect(tileAt(pair[0])).toHaveClass(/\bsel\b/);
    await tileAt(pair[1]).tap();
    return;
  }
  if (input === "keyboard") {
    await tileAt(pair[0]).focus();
    await page.keyboard.press("Enter");
    await expect(tileAt(pair[0])).toHaveClass(/\bsel\b/);
    await tileAt(pair[1]).focus();
    await page.keyboard.press("Enter");
    return;
  }
  await tileAt(pair[0]).click();
  await expect(tileAt(pair[0])).toHaveClass(/\bsel\b/);
  await tileAt(pair[1]).click();
}

async function guidedPair(page) {
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 7000 });
  return page.locator(".tile.idle-hint").evaluateAll((tiles) => tiles.map((tile) => ({
    x: Number(tile.dataset.x),
    y: Number(tile.dataset.y)
  })));
}

async function completeNaturalRoundOne(page, input) {
  for (let move = 0; move < 7; move += 1) {
    if (await page.locator("#roundOneRestoration").isVisible()) break;
    const pair = await guidedPair(page);
    const beforeMoves = await page.evaluate((key) => (
      JSON.parse(localStorage.getItem(key) || "{}").moves
    ), SAVE_KEY);
    await activatePair(page, pair, input === "touch" ? "touch" : "pointer");
    await page.waitForFunction(({ key, beforeMoves }) => {
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      const authoritativeMoveSpent = Number(state.moves) === Number(beforeMoves) - 1;
      const authoritativeCompletion = state.currentRound === 1 && state.roundComplete === true;
      return authoritativeMoveSpent && (
        authoritativeCompletion || (
          state.currentRound === 1
          && state.roundComplete === false
          && document.querySelectorAll(".tile").length === 64
          && Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled)
        )
      );
    }, { key: SAVE_KEY, beforeMoves }, { timeout: 12000 });
    const settled = await page.evaluate((key) => (
      JSON.parse(localStorage.getItem(key) || "{}")
    ), SAVE_KEY);
    expect(settled.currentRound, `Round 1 move ${move + 1} remains authoritative`).toBe(1);
    expect(settled.moves, `Round 1 move ${move + 1} spends once`).toBe(beforeMoves - 1);
    await page.waitForTimeout(220);
  }
  await expect(page.locator("#restoreGreenhouseBtn")).toBeVisible({ timeout: 7000 });
}

async function handoffReport(page) {
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
    const tiles = Array.from(document.querySelectorAll(".tile"));
    const boardRect = document.querySelector("#board")?.getBoundingClientRect();
    const game = document.querySelector(".game");
    const gameRect = game?.getBoundingClientRect();
    const completeRows = new Set(tiles.filter((tile) => {
      const rect = tile.getBoundingClientRect();
      return rect.top >= -1 && rect.bottom <= innerHeight + 1;
    }).map((tile) => tile.dataset.y));
    const completeColumns = new Set(tiles.filter((tile) => {
      const rect = tile.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= innerWidth + 1;
    }).map((tile) => tile.dataset.x));
    const ownedNote = Array.from(document.querySelectorAll(".restoration-owned-note")).find(visible);
    const ownedDial = Array.from(document.querySelectorAll(".greenhouse-restoration-dial")).find(visible);
    return {
      state,
      bodyClasses: document.body.className,
      gameWidth: gameRect?.width || 0,
      gameCssWidth: getComputedStyle(document.querySelector(".game")).width,
      gameTransform: getComputedStyle(document.querySelector(".game")).transform,
      innerWidth,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      completeRows: completeRows.size,
      completeColumns: completeColumns.size,
      disabledTiles: tiles.filter((tile) => tile.disabled).length,
      boardTop: boardRect?.top || 0,
      boardBottom: boardRect?.bottom || 0,
      boardLeft: boardRect?.left || 0,
      boardRight: boardRect?.right || 0,
      boardWidth: boardRect?.width || 0,
      scrollY,
      tutorialBottom: document.querySelector("#tutorialPanel")?.getBoundingClientRect().bottom || 0,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
      transitionNodeCount: document.querySelectorAll("#nextOrderCue, .next-order-cue").length,
      transitionClass: document.body.classList.contains("restored-greenhouse-handoff"),
      instructionCount: [
        document.querySelector("#tutorialPanel"),
        document.querySelector("#firstSwapCue")
      ].filter(visible).length,
      tutorialVisible: visible(document.querySelector("#tutorialPanel")),
      tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      firstCueVisible: visible(document.querySelector("#firstSwapCue")),
      firstCue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      ownedNote: ownedNote?.textContent.trim() || "",
      greenhouseText: ownedDial?.textContent.replace(/\s+/g, " ").trim() || "",
      ownedStage: ownedDial?.dataset.ownedStage || "",
      greenhouseStage: ownedDial?.dataset.restorationDialStage || "",
      visibleBars: Array.from(document.querySelectorAll(".progress-meter, .restoration-dial-track"))
        .filter(visible).length,
      guideTiles: document.querySelectorAll(".tile.idle-hint").length,
      thornSwapTiles: document.querySelectorAll(".tile.thorn-teach").length,
      thornTargets: document.querySelectorAll(".tile.thorn-teach-blocker").length,
      guideOverlays: document.querySelectorAll(".swap-path-arrow, .first-action-swap-guide").length,
      forbiddenGenericNarration: document.body.innerText.includes("Finish the Moonlit Wreath"),
      focusableTiles: document.querySelectorAll(".tile[tabindex='0']").length,
      focusedTile: document.activeElement?.classList.contains("tile") || false,
      motion: Array.from(document.querySelectorAll(".tile.thorn-teach, .tile.thorn-teach-blocker"))
        .map((tile) => getComputedStyle(tile).animationName)
    };
  }, SAVE_KEY);
}

async function usefulGuideReport(page) {
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const pair = Array.from(document.querySelectorAll(".tile.idle-hint")).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y)
    }));
    const board = state.board.map((row) => row.slice());
    const [a, b] = pair;
    if (!a || !b) return { pair, legal: false, useful: false, targetFlowerId: -1 };
    const previous = board[a.y][a.x];
    board[a.y][a.x] = board[b.y][b.x];
    board[b.y][b.x] = previous;
    const runs = [];
    for (let y = 0; y < 8; y += 1) {
      for (let start = 0, x = 1; x <= 8; x += 1) {
        if (x === 8 || board[y][x] !== board[y][start]) {
          if (x - start >= 3) runs.push({
            flowerId: board[y][start],
            cells: Array.from({ length: x - start }, (_, offset) => [start + offset, y])
          });
          start = x;
        }
      }
    }
    for (let x = 0; x < 8; x += 1) {
      for (let start = 0, y = 1; y <= 8; y += 1) {
        if (y === 8 || board[y][x] !== board[start][x]) {
          if (y - start >= 3) runs.push({
            flowerId: board[start][x],
            cells: Array.from({ length: y - start }, (_, offset) => [x, start + offset])
          });
          start = y;
        }
      }
    }
    const moved = new Set([`${a.x},${a.y}`, `${b.x},${b.y}`]);
    const created = runs.filter((run) => run.cells.some(([x, y]) => moved.has(`${x},${y}`)));
    const usefulRun = created.find((run) => (
      [2, 4, 5].includes(run.flowerId)
      && run.cells.some(([x, y]) => state.cursedThorns.some((thorn) => (
        Math.abs(thorn.x - x) + Math.abs(thorn.y - y) <= 1
      )))
    ));
    return {
      pair,
      legal: Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1 && created.length > 0,
      useful: Boolean(usefulRun),
      targetFlowerId: usefulRun?.flowerId ?? -1
    };
  }, SAVE_KEY);
}

async function startThornFeedbackRecorder(page) {
  await page.evaluate(() => {
    window.__roundTwoHandoffThornEvents = [];
    window.__roundTwoHandoffRecorder = window.setInterval(() => {
      document.querySelectorAll(".thorn-event").forEach((node) => {
        const text = node.textContent.trim();
        if (text && !window.__roundTwoHandoffThornEvents.includes(text)) {
          window.__roundTwoHandoffThornEvents.push(text);
        }
      });
    }, 16);
  });
}

async function stopThornFeedbackRecorder(page) {
  return page.evaluate(() => {
    clearInterval(window.__roundTwoHandoffRecorder);
    return window.__roundTwoHandoffThornEvents || [];
  });
}

function expectReadyHandoff(report, testCase, label) {
  expect(report.state).toMatchObject({
    currentRound: 2,
    moves: 9,
    coins: 20,
    counts: [0, 0, 0, 0, 0, 0],
    clearedCursedThorns: 0,
    roundComplete: false,
    roundOneRestored: true,
    roundTwoGreenhouseUpgraded: false,
    hasMadeValidMove: false
  });
  expect(report.state.cursedThorns, `${label} three authoritative blockers`).toHaveLength(3);
  expect(report.tiles, `${label} tile integrity`).toBe(64);
  expect(report.rows, `${label} board rows`).toBe(8);
  expect(report.completeRows, `${label} complete rows in first viewport`).toBe(8);
  expect(
    report.completeColumns,
    `${label} complete columns in first viewport ${JSON.stringify({
      boardLeft: report.boardLeft,
      boardRight: report.boardRight,
      boardWidth: report.boardWidth,
      gameWidth: report.gameWidth,
      cssWidth: report.gameCssWidth,
      innerWidth: report.innerWidth,
      classes: report.bodyClasses
    })}`
  ).toBe(8);
  expect(report.disabledTiles, `${label} board actionable`).toBe(0);
  expect(
    report.boardBottom,
    `${label} board in first viewport ${JSON.stringify({
      boardTop: report.boardTop,
      tutorialBottom: report.tutorialBottom,
      scrollY: report.scrollY
    })}`
  ).toBeLessThanOrEqual(testCase.viewport.height);
  expect(report.overflowX, `${label} no horizontal overflow`).toBe(false);
  expect(report.brokenImages, `${label} no broken images`).toEqual([]);
  expect(report.transitionNodeCount, `${label} shared final-order transition surface retained`).toBe(1);
  expect(report.transitionClass, `${label} no transition runtime state`).toBe(false);
  expect(report.bodyClasses, `${label} focused Round 2 layout`).toContain("restored-next-order-focus");
  expect(report.instructionCount, `${label} sole instruction owner`).toBe(1);
  expect(report.tutorialVisible, `${label} direct thorn lesson visible`).toBe(true);
  expect(report.tutorialCopy, `${label} literal thorn action`).toBe("Match beside the Thorn.");
  expect(report.firstCueVisible, `${label} no duplicate cue`).toBe(false);
  expect(report.firstCue).toContain("Crack the marked thorns");
  expect(report.forbiddenGenericNarration, `${label} no generic competing narration`).toBe(false);
  if (testCase.mobile) {
    expect(report.greenhouseText, `${label} compact owned restoration consequence`).toContain("RESTORED");
    expect(report.greenhouseText, `${label} restored pane consequence`).toContain("First panes restored");
  } else {
    expect(report.ownedNote, `${label} owned restoration consequence`).toBe("Owned 1/3 · Next: Upgrade Greenhouse");
  }
  expect(report.ownedStage, `${label} owned stage`).toBe("1");
  expect(report.greenhouseStage, `${label} active greenhouse authority`).toBe("restored");
  expect(report.visibleBars, `${label} bouquet plus greenhouse bars`).toBe(2);
  expect(report.guideTiles, `${label} one guided pair`).toBe(2);
  expect(report.thornSwapTiles, `${label} pair identifies cause`).toBe(2);
  expect(report.thornTargets, `${label} blockers identify target`).toBe(3);
  expect(report.focusableTiles, `${label} roving keyboard target`).toBe(1);
  expect(report.focusedTile, `${label} board receives focus`).toBe(true);
  if (testCase.reduced) {
    expect(new Set(report.motion), `${label} static reduced-motion guide`).toEqual(new Set(["none"]));
  }
  if (!testCase.mobile) {
    expect(
      report.gameWidth,
      `${label} full desktop geometry ${JSON.stringify({
        classes: report.bodyClasses,
        cssWidth: report.gameCssWidth,
        transform: report.gameTransform,
        innerWidth: report.innerWidth
      })}`
    ).toBeGreaterThan(1100);
  }
}

for (const testCase of CASES) {
  test(`Round 1 restoration hands off cleanly to Round 2 on ${testCase.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile),
      reducedMotion: testCase.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(
      `${request.url()} ${request.failure()?.errorText || ""}`
    ));

    try {
      await seedDeterministicMath(page, `round-two-handoff-${testCase.label}`);
      await page.goto(`${BASE_URL}?round-two-handoff=${testCase.label}`, { waitUntil: "networkidle" });
      await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator(".tile")).toHaveCount(64);
      await completeNaturalRoundOne(page, testCase.input);

      const ceremonyState = await page.evaluate((key) => (
        JSON.parse(localStorage.getItem(key) || "{}")
      ), SAVE_KEY);
      expect(ceremonyState.coins).toBe(120);
      expect(ceremonyState.roundComplete).toBe(true);
      if (testCase.input === "touch") await page.locator("#restoreGreenhouseBtn").tap();
      else await page.locator("#restoreGreenhouseBtn").click();
      await expect(page.locator("#nextOrderBtn")).toBeVisible({ timeout: 7000 });
      expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).coins, SAVE_KEY)).toBe(20);
      if (testCase.input === "touch") await page.locator("#nextOrderBtn").tap();
      else await page.locator("#nextOrderBtn").click();

      await expect(page.locator("#tutorialCopy")).toHaveText("Match beside the Thorn.");
      await expect(page.locator(".tile.thorn-teach")).toHaveCount(2, { timeout: 7000 });
      await page.waitForTimeout(100);
      let report = await handoffReport(page);
      if (testCase.reduced) {
        await page.screenshot({
          path: `work/round-two-handoff-${testCase.label}-ready.png`
        });
      }
      expectReadyHandoff(report, testCase, `${testCase.label} initial`);
      let guide = await usefulGuideReport(page);
      expect(guide.legal, `${testCase.label} legal guide`).toBe(true);
      expect(guide.useful, `${testCase.label} guide advances a target beside a thorn`).toBe(true);
      if (!testCase.reduced) {
        await page.screenshot({
          path: `work/round-two-handoff-${testCase.label}-ready.png`
        });
      }

      const authoritativeOpening = JSON.stringify(report.state);
      for (let reload = 1; reload <= 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator(".tile.thorn-teach")).toHaveCount(2, { timeout: 7000 });
        await page.waitForTimeout(100);
        report = await handoffReport(page);
        expectReadyHandoff(report, testCase, `${testCase.label} reload ${reload}`);
        expect(JSON.stringify(report.state), `${testCase.label} authoritative reload ${reload}`).toBe(authoritativeOpening);
        guide = await usefulGuideReport(page);
        expect(guide.legal, `${testCase.label} reload ${reload} legal guide`).toBe(true);
        expect(guide.useful, `${testCase.label} reload ${reload} useful guide`).toBe(true);
      }

      const before = report.state;
      const beforeThornHp = before.cursedThorns.reduce((sum, thorn) => sum + thorn.hp, 0);
      await startThornFeedbackRecorder(page);
      await activatePair(page, guide.pair, testCase.input);
      await expect(page.locator(".thorn-event").first()).toBeVisible({ timeout: 7000 });
      await page.screenshot({
        path: `work/round-two-handoff-${testCase.label}-thorn-crack.png`
      });
      await page.waitForFunction(({ key, moves }) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === moves - 1
          && document.querySelectorAll(".tile").length === 64
          && Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled);
      }, { key: SAVE_KEY, moves: before.moves }, { timeout: 12000 });
      const thornEvents = await stopThornFeedbackRecorder(page);
      const after = await handoffReport(page);
      const afterThornHp = after.state.cursedThorns.reduce((sum, thorn) => sum + thorn.hp, 0);
      expect(after.state.moves, `${testCase.label} one move spent`).toBe(before.moves - 1);
      expect(afterThornHp, `${testCase.label} thorn HP damaged`).toBeLessThan(beforeThornHp);
      expect(after.state.clearedCursedThorns, `${testCase.label} thorn progress`).toBeGreaterThan(before.clearedCursedThorns);
      expect(after.state.counts[guide.targetFlowerId], `${testCase.label} flower progress`).toBeGreaterThan(before.counts[guide.targetFlowerId]);
      expect(thornEvents.some((event) => event === "CRACK" || event === "BREAK"), `${testCase.label} localized crack feedback`).toBe(true);
      expect(after.transitionNodeCount, `${testCase.label} shared transition surface retained`).toBe(1);
      expect(after.instructionCount, `${testCase.label} lesson retires`).toBe(0);
      expect(after.guideTiles, `${testCase.label} guide pair retires`).toBe(0);
      expect(after.thornSwapTiles, `${testCase.label} cause highlight retires`).toBe(0);
      expect(after.thornTargets, `${testCase.label} target highlight retires`).toBe(0);
      expect(after.guideOverlays, `${testCase.label} guide overlay retires`).toBe(0);
      expect(after.disabledTiles, `${testCase.label} control returned`).toBe(0);
      expect(after.tiles, `${testCase.label} post-action tiles`).toBe(64);
      expect(after.rows, `${testCase.label} post-action rows`).toBe(8);
      expect(after.completeRows, `${testCase.label} post-action complete rows`).toBe(8);
      expect(after.completeColumns, `${testCase.label} post-action complete columns`).toBe(8);
      expect(after.boardBottom, `${testCase.label} post-action board fit`).toBeLessThanOrEqual(testCase.viewport.height);
      await page.screenshot({
        path: `work/round-two-handoff-${testCase.label}-post-swap.png`
      });

      await page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key));
        state.moves = 0;
        state.roundComplete = false;
        localStorage.setItem(key, JSON.stringify(state));
      }, SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#renewBtn.visible")).toHaveText("Retry Bouquet");
      if (testCase.input === "touch") await page.locator("#renewBtn.visible").tap();
      else await page.locator("#renewBtn.visible").click();
      await expect(page.locator(".tile:not(:disabled)")).toHaveCount(64, { timeout: 7000 });
      const retried = await handoffReport(page);
      expect(retried.transitionNodeCount, `${testCase.label} Retry retains only the hidden shared banner`).toBe(1);
      expect(retried.tiles, `${testCase.label} Retry tile integrity`).toBe(64);
      expect(retried.rows, `${testCase.label} Retry rows`).toBe(8);
      expect(retried.overflowX, `${testCase.label} Retry fit`).toBe(false);
      expect(retried.instructionCount, `${testCase.label} Retry does not duplicate the lesson`).toBeLessThanOrEqual(1);
      expect(consoleErrors, `${testCase.label} console errors`).toEqual([]);
      expect(pageErrors, `${testCase.label} page errors`).toEqual([]);
      expect(failedRequests, `${testCase.label} request failures`).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
