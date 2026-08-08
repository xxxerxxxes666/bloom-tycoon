const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const HINT_TIMEOUT = 8500;

const CASES = [
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer", dismissKey: "Enter" },
  { label: "mobile390-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, dismissKey: "Enter" },
  { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true, dismissKey: "Space" },
  { label: "mobile390-touch-reduced", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true, dismissKey: "Space" }
];

test.setTimeout(180000);

async function openOrdinaryRoundAutonomy(page, label, round = 3) {
  await page.goto(`${BASE_URL}?idle-hint-autonomy=${label}-r${round}`, { waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  const seededState = await page.evaluate(({ key, round }) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const board = Array.from({ length: 8 }, (_, y) => (
      Array.from({ length: 8 }, (_, x) => (x + y * 2) % 6)
    ));
    board[0][0] = 3;
    board[0][1] = 1;
    board[0][2] = 3;
    board[0][3] = 4;
    board[1][1] = 3;
    board[4][4] = 0;
    board[4][5] = 1;
    board[4][6] = 0;
    board[5][5] = 0;
    Object.assign(state, {
      board,
      armedLineRelic: null,
      moves: 8,
      coins: 50,
      counts: round === 2 ? [0, 0, 3, 0, 0, 0] : [0, 0, 0, 0, 0, 0],
      cursedThorns: [],
      clearedCursedThorns: round === 2 ? 3 : 0,
      currentRound: round,
      roundComplete: false,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: true,
      hasMadeValidMove: true,
      restoredRoundTwoGuideMoves: 2,
      tutorialSkipped: true,
      tutorialActive: false,
      blackCandleLessonComplete: true
    });
    return JSON.stringify(state);
  }, { key: SAVE_KEY, round });
  await page.addInitScript(({ key, marker, state }) => {
    if (sessionStorage.getItem(marker)) return;
    localStorage.setItem(key, state);
    sessionStorage.setItem(marker, "1");
  }, {
    key: SAVE_KEY,
    marker: `idle-hint-autonomy-${label}-r${round}`,
    state: seededState
  });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function openRoundThreeAutonomy(page, label) {
  await openOrdinaryRoundAutonomy(page, label, 3);
}

async function openUntouchedRoundThree(page, label) {
  await page.goto(`${BASE_URL}?untouched-round-three=${label}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const board = Array.from({ length: 8 }, (_, y) => (
      Array.from({ length: 8 }, (_, x) => (x + y * 2) % 6)
    ));
    board[0][0] = 3;
    board[0][1] = 1;
    board[0][2] = 3;
    board[0][3] = 4;
    board[1][1] = 3;
    board[4][4] = 0;
    board[4][5] = 1;
    board[4][6] = 0;
    board[5][5] = 0;
    Object.assign(state, {
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
      hasMadeValidMove: false,
      restoredRoundTwoGuideMoves: 0,
      tutorialSkipped: true,
      tutorialActive: false,
      blackCandleLessonComplete: true
    });
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function autonomyReport(page) {
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
    return {
      state,
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => ({
        x: Number(tile.dataset.x),
        y: Number(tile.dataset.y)
      })),
      invalidTiles: tiles.filter((tile) => tile.classList.contains("invalid-swap")).length,
      selectedTiles: tiles.filter((tile) => tile.classList.contains("sel")).length,
      selectedIds: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      disabledTiles: tiles.filter((tile) => tile.disabled).length,
      activeElementId: document.activeElement?.id || "",
      rovingTileIds: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      tutorialVisible: visible(document.querySelector("#tutorialPanel")),
      helpVisible: visible(document.querySelector("#tutorialHelpBtn")),
      liveOwners: Array.from(document.querySelectorAll("[aria-live]"))
        .filter((node) => visible(node) && node.getAttribute("aria-live") !== "off")
        .map((node) => node.id),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      completeRows: new Set(tiles
        .filter((tile) => {
          const rect = tile.getBoundingClientRect();
          return rect.top >= -1 && rect.bottom <= innerHeight + 1;
        })
        .map((tile) => tile.dataset.y)).size,
      instructionCount: [
        document.querySelector("#tutorialPanel"),
        document.querySelector("#firstSwapCue"),
        document.querySelector("#nextOrderCue")
      ].filter(visible).length,
      thornTeaching: document.querySelectorAll(".tile.thorn-teach, .tile.thorn-teach-blocker").length,
      relicGuidance: document.querySelectorAll(".tile.line-relic-lane-preview, .tile.line-relic-destination").length,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      boardWidth: document.querySelector("#board")?.getBoundingClientRect().width || 0,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function hintUsefulness(page) {
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const board = state.board.map((row) => row.slice());
    const pair = Array.from(document.querySelectorAll(".tile.idle-hint")).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y)
    }));
    const [a, b] = pair;
    if (!a || !b) return { pair, legal: false, useful: false };
    const previous = board[a.y][a.x];
    board[a.y][a.x] = board[b.y][b.x];
    board[b.y][b.x] = previous;
    const moved = new Set([`${a.x},${a.y}`, `${b.x},${b.y}`]);
    const runs = [];
    for (let y = 0; y < 8; y += 1) {
      for (let start = 0, x = 1; x <= 8; x += 1) {
        if (x === 8 || board[y][x] !== board[y][start]) {
          if (x - start >= 3) {
            runs.push({
              flowerId: board[y][start],
              cells: Array.from({ length: x - start }, (_, offset) => [start + offset, y])
            });
          }
          start = x;
        }
      }
    }
    for (let x = 0; x < 8; x += 1) {
      for (let start = 0, y = 1; y <= 8; y += 1) {
        if (y === 8 || board[y][x] !== board[start][x]) {
          if (y - start >= 3) {
            runs.push({
              flowerId: board[start][x],
              cells: Array.from({ length: y - start }, (_, offset) => [x, start + offset])
            });
          }
          start = y;
        }
      }
    }
    const created = runs.filter((run) => run.cells.some(([x, y]) => moved.has(`${x},${y}`)));
    const unfinished = new Set(Array.from(
      document.querySelectorAll(".objective-target[data-flower-id]:not(.complete)")
    ).map((node) => Number(node.dataset.flowerId)));
    return {
      pair,
      legal: Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1 && created.length > 0,
      useful: created.some((run) => unfinished.has(run.flowerId))
    };
  }, SAVE_KEY);
}

async function selectedHelpHighlightReport(page, counterpart) {
  return page.evaluate(({ x, y }) => {
    const counterpartId = `tile-${x}-${y}`;
    const metrics = (tile) => ({
      id: tile.id,
      classes: tile.className,
      ariaLabel: tile.getAttribute("aria-label") || "",
      afterOpacity: Number.parseFloat(getComputedStyle(tile, "::after").opacity || "0"),
      outlineWidth: Number.parseFloat(getComputedStyle(tile).outlineWidth || "0")
    });
    const counterpartTile = document.querySelector(`#${counterpartId}`);
    return {
      bodyOwnsGuidance: document.body.classList.contains("selected-guided-help"),
      bodyOwnsPlayGuidance: document.body.classList.contains("selected-guided-play"),
      counterpart: counterpartTile ? metrics(counterpartTile) : null,
      alternativeLegal: Array.from(document.querySelectorAll(".tile.legal-target"))
        .filter((tile) => tile.id !== counterpartId)
        .map(metrics),
      forecast: Array.from(document.querySelectorAll(".tile.match-preview"))
        .filter((tile) => tile.id !== counterpartId)
        .map(metrics),
      labels: Array.from(document.querySelectorAll(".tile[aria-label]")).map(metrics)
    };
  }, counterpart);
}

function expectSelectedGuidedSemantics(report, counterpartId) {
  expect(report.counterpart?.ariaLabel).toContain("legal match swap target");
  expect(report.counterpart?.ariaLabel).toContain("guided exchange destination");
  expect(report.labels.filter((tile) => tile.ariaLabel.includes("guided exchange destination"))
    .map((tile) => tile.id)).toEqual([counterpartId]);
  expect(report.labels.filter((tile) => tile.ariaLabel.includes("legal match swap target"))
    .map((tile) => tile.id)).toEqual([counterpartId]);
  expect(report.alternativeLegal.every((tile) => (
    !tile.ariaLabel.includes("legal match swap target")
    && !tile.ariaLabel.includes("guided exchange destination")
  ))).toBe(true);
}

async function waitForAutonomyHint(page, label, expectedFocus = null) {
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: HINT_TIMEOUT });
  const report = await autonomyReport(page);
  const usefulness = await hintUsefulness(page);
  expect(usefulness.legal, `${label} legal pair`).toBe(true);
  expect(usefulness.useful, `${label} objective-useful pair`).toBe(true);
  expect(report.instructionCount, `${label} no new narrator`).toBe(0);
  expect(report.thornTeaching, `${label} no Thorn lesson resurrection`).toBe(0);
  expect(report.relicGuidance, `${label} no relic competition`).toBe(0);
  expect(report.tiles, `${label} tile integrity`).toBe(64);
  expect(report.rows, `${label} rows`).toBe(8);
  expect(report.completeRows, `${label} complete viewport rows`).toBe(8);
  expect(report.overflowX, `${label} fit`).toBe(false);
  expect(report.brokenImages, `${label} images`).toEqual([]);
  if (expectedFocus !== null) {
    expect(report.activeElementId, `${label} does not steal focus`).toBe(expectedFocus);
  }
  return { report, usefulness };
}

async function activatePair(page, pair, input) {
  const tileAt = (cell) => page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
  if (input === "touch") {
    await tileAt(pair[0]).tap();
    await tileAt(pair[1]).tap();
    return;
  }
  if (input === "keyboard") {
    await tileAt(pair[0]).focus();
    await page.keyboard.press("Enter");
    await tileAt(pair[1]).focus();
    await page.keyboard.press("Enter");
    return;
  }
  await tileAt(pair[0]).click();
  await tileAt(pair[1]).click();
}

async function activateTile(page, cell, input, key = "Enter") {
  const tile = page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
  if (input === "touch") {
    await tile.tap();
  } else if (input === "keyboard") {
    await tile.focus();
    await page.keyboard.press(key);
  } else {
    await tile.click();
  }
}

async function activateControl(page, selector, input, key = "Enter") {
  const control = page.locator(selector);
  if (input === "touch") {
    await control.tap();
  } else if (input === "keyboard") {
    await control.focus();
    await page.keyboard.press(key);
  } else {
    await control.click();
  }
}

async function expectDistinctKeyboardCursor(page, pairIds, label) {
  const visual = await page.evaluate(() => {
    const describe = (tile) => {
      const style = getComputedStyle(tile);
      return {
        id: tile.id,
        hinted: tile.classList.contains("idle-hint"),
        outlineColor: style.outlineColor,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineOffset: style.outlineOffset,
        animationName: style.animationName,
        boxShadow: style.boxShadow
      };
    };
    const active = document.activeElement?.closest?.(".tile");
    return {
      active: active ? describe(active) : null,
      hints: Array.from(document.querySelectorAll(".tile.idle-hint")).map(describe),
      keyboardMode: document.body.classList.contains("keyboard-board-navigation")
    };
  });
  expect(visual.active, `${label} has a focused board cursor`).toBeTruthy();
  expect(visual.keyboardMode, `${label} retains keyboard modality: ${JSON.stringify(visual)}`).toBe(true);
  expect(visual.active.outlineColor, `${label} uses the cool cursor ring`).toBe("rgb(188, 232, 235)");
  expect(visual.active.outlineStyle, `${label} cursor ring is static and solid`).toBe("solid");
  expect(visual.active.outlineWidth, `${label} cursor ring is stronger than a hint`).toBe("3px");
  expect(visual.active.outlineOffset, `${label} cursor ring is inset independently`).toBe("-5px");
  expect(visual.hints.map((hint) => hint.id).sort(), `${label} keeps the exact hint pair`)
    .toEqual(pairIds);
  visual.hints.filter((hint) => hint.id !== visual.active.id).forEach((hint) => {
    expect(hint.outlineColor, `${label} leaves the other hint warm`).toBe("rgb(240, 196, 119)");
    expect(hint.outlineWidth, `${label} leaves the other hint at two pixels`).toBe("2px");
  });
  if (visual.active.hinted) {
    expect(visual.active.animationName, `${label} focused hint cursor does not pulse`).toBe("none");
    expect(visual.active.boxShadow, `${label} focused hint retains the warm pair glow`)
      .toContain("215, 177, 109");
  }
}

async function moveKeyboardFocusTo(page, target, pairIds, expectedState, label) {
  const active = await page.evaluate(() => {
    const tile = document.activeElement?.closest?.(".tile");
    return tile ? { x: Number(tile.dataset.x), y: Number(tile.dataset.y) } : null;
  });
  expect(active, `${label} starts from a board tile`).toBeTruthy();
  const steps = [];
  const horizontalKey = target.x > active.x ? "ArrowRight" : "ArrowLeft";
  const verticalKey = target.y > active.y ? "ArrowDown" : "ArrowUp";
  for (let x = active.x; x !== target.x; x += target.x > x ? 1 : -1) steps.push(horizontalKey);
  for (let y = active.y; y !== target.y; y += target.y > y ? 1 : -1) steps.push(verticalKey);
  expect(steps.length, `${label} exercises real Arrow navigation`).toBeGreaterThan(0);
  for (const key of steps) {
    await page.keyboard.press(key);
    const report = await autonomyReport(page);
    expect(report.hints.map((cell) => `tile-${cell.x}-${cell.y}`).sort(), `${label} ${key} keeps pair`)
      .toEqual(pairIds);
    expect(report.rovingTileIds, `${label} ${key} focus and roving agree`)
      .toEqual([report.activeElementId]);
    expect(report.selectedTiles, `${label} ${key} selects nothing`).toBe(0);
    expect(report.state, `${label} ${key} changes no game state`).toEqual(expectedState);
    await expectDistinctKeyboardCursor(page, pairIds, `${label} ${key}`);
  }
}

async function cancelBoardInput(page, pair, testCase) {
  const tile = page.locator(`.tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`);
  if (testCase.input === "keyboard") {
    await tile.focus();
    await page.keyboard.press("ArrowRight");
    return;
  }
  const box = await tile.boundingBox();
  expect(box).toBeTruthy();
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  if (testCase.input === "touch") {
    await page.evaluate(({ cell, point }) => {
      const tile = document.querySelector(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
      const touch = new Touch({
        identifier: 91,
        target: tile,
        clientX: point.x,
        clientY: point.y
      });
      const moved = new Touch({
        identifier: 91,
        target: tile,
        clientX: point.x + 30,
        clientY: point.y
      });
      tile.dispatchEvent(new TouchEvent("touchstart", {
        touches: [touch],
        changedTouches: [touch],
        bubbles: true,
        cancelable: true
      }));
      document.querySelector("#board").dispatchEvent(new TouchEvent("touchmove", {
        touches: [moved],
        changedTouches: [moved],
        bubbles: true,
        cancelable: true
      }));
      document.querySelector("#board").dispatchEvent(new TouchEvent("touchcancel", {
        touches: [],
        changedTouches: [moved],
        bubbles: true,
        cancelable: true
      }));
    }, { cell: pair[0], point });
    return;
  }
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 30, point.y, { steps: 3 });
  await page.dispatchEvent("#board", "pointercancel", { pointerId: 1 });
  await page.mouse.up();
}

for (const round of [2, 3]) {
  for (const testCase of CASES) {
    for (const selectedEndpoint of ["source", "destination"]) {
      test(`ordinary R${round} idle Help preserves ${selectedEndpoint} on ${testCase.label}`, async ({ browser }) => {
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
          await openOrdinaryRoundAutonomy(
            page,
            `${testCase.label}-${selectedEndpoint}`,
            round
          );
          const initialFocus = (await autonomyReport(page)).activeElementId;
          const hint = await waitForAutonomyHint(
            page,
            `${testCase.label} R${round} ${selectedEndpoint}`,
            initialFocus
          );
          const pair = hint.usefulness.pair;
          const selectedCell = selectedEndpoint === "source" ? pair[0] : pair[1];
          const counterpart = selectedEndpoint === "source" ? pair[1] : pair[0];
          const pairIds = pair.map((cell) => `tile-${cell.x}-${cell.y}`).sort();
          const selectedId = `tile-${selectedCell.x}-${selectedCell.y}`;
          const before = hint.report.state;

          await activateTile(page, selectedCell, testCase.input);
          await expect(page.locator(`#${selectedId}`)).toHaveClass(/sel/);
          await expect(page.locator(".tile.idle-hint")).toHaveCount(2);
          let report = await autonomyReport(page);
          expect(report.hints.map((cell) => `tile-${cell.x}-${cell.y}`).sort()).toEqual(pairIds);
          expect(report.selectedIds).toEqual([selectedId]);
          expect(report.activeElementId).toBe(selectedId);
          expect(report.rovingTileIds).toEqual([selectedId]);
          expect(report.state.moves).toBe(before.moves);
          expect(report.state.counts).toEqual(before.counts);
          expect(report.state.board).toEqual(before.board);
          let highlight = await selectedHelpHighlightReport(page, counterpart);
          expect(highlight.bodyOwnsPlayGuidance).toBe(true);
          expect(highlight.bodyOwnsGuidance).toBe(false);
          expect(highlight.counterpart?.classes).toContain("guided-counterpart");
          expectSelectedGuidedSemantics(highlight, `tile-${counterpart.x}-${counterpart.y}`);
          expect(highlight.counterpart?.afterOpacity, JSON.stringify(highlight)).toBeGreaterThanOrEqual(.85);
          expect(highlight.alternativeLegal.every((tile) => tile.afterOpacity <= .25)).toBe(true);
          expect(highlight.forecast.every((tile) => tile.afterOpacity <= .3), JSON.stringify(highlight)).toBe(true);

          await activateControl(page, "#tutorialHelpBtn", testCase.input);
          await expect(page.locator("#tutorialSkipBtn")).toBeFocused();
          await expect(page.locator("#tutorialCopy")).toHaveText("Choose the other glowing flower.");
          if (
            (round === 2 && selectedEndpoint === "source" && testCase.label === "desktop-pointer")
            || (round === 3 && selectedEndpoint === "destination" && testCase.label === "mobile390-touch")
          ) {
            await page.screenshot({
              path: `work/help-counterpart-r${round}-${testCase.label}.png`
            });
          }
          if (round === 3 && selectedEndpoint === "source" && testCase.label === "desktop-pointer") {
            await page.screenshot({
              path: "work/help-counterpart-r3-desktop-pointer-source.png"
            });
          }
          report = await autonomyReport(page);
          expect(report.tutorialVisible).toBe(true);
          expect(report.liveOwners).toEqual(["tutorialPanel"]);
          expect(report.hints.map((cell) => `tile-${cell.x}-${cell.y}`).sort()).toEqual(pairIds);
          expect(report.selectedIds).toEqual([selectedId]);
          expect(report.rovingTileIds).toEqual([selectedId]);
          expect(report.state.moves).toBe(before.moves);
          expect(report.state.counts).toEqual(before.counts);
          expect(report.state.board).toEqual(before.board);
          highlight = await selectedHelpHighlightReport(page, counterpart);
          expect(highlight.bodyOwnsGuidance).toBe(true);
          expect(highlight.bodyOwnsPlayGuidance).toBe(false);
          expect(highlight.counterpart?.classes).toContain("guided-counterpart");
          expectSelectedGuidedSemantics(highlight, `tile-${counterpart.x}-${counterpart.y}`);
          expect(highlight.counterpart?.afterOpacity, JSON.stringify(highlight)).toBeGreaterThanOrEqual(.85);
          expect(highlight.counterpart?.outlineWidth).toBeGreaterThanOrEqual(2);
          expect(highlight.alternativeLegal.every((tile) => tile.afterOpacity <= .25)).toBe(true);
          expect(highlight.forecast.every((tile) => tile.afterOpacity <= .3), JSON.stringify(highlight)).toBe(true);
          if (round === 3 && selectedEndpoint === "source" && testCase.label === "desktop-pointer") {
            expect(highlight.alternativeLegal.length).toBeGreaterThan(0);
          }

          await activateControl(page, "#tutorialSkipBtn", testCase.input, testCase.dismissKey);
          await expect(page.locator("#tutorialPanel")).toBeHidden();
          const expectedDismissFocus = testCase.input === "keyboard"
            ? "tutorialHelpBtn"
            : selectedId;
          await expect(page.locator(`#${expectedDismissFocus}`)).toBeFocused();
          report = await autonomyReport(page);
          expect(report.hints.map((cell) => `tile-${cell.x}-${cell.y}`).sort()).toEqual(pairIds);
          expect(report.selectedIds).toEqual([selectedId]);
          expect(report.activeElementId).toBe(expectedDismissFocus);
          expect(report.rovingTileIds).toEqual([selectedId]);
          expect(report.state.moves).toBe(before.moves);
          expect(report.state.counts).toEqual(before.counts);
          expect(report.state.board).toEqual(before.board);
          highlight = await selectedHelpHighlightReport(page, counterpart);
          expect(highlight.bodyOwnsPlayGuidance).toBe(true);
          expect(highlight.bodyOwnsGuidance).toBe(false);
          expect(highlight.counterpart?.classes).toContain("guided-counterpart");
          expectSelectedGuidedSemantics(highlight, `tile-${counterpart.x}-${counterpart.y}`);
          expect(highlight.counterpart?.afterOpacity).toBeGreaterThanOrEqual(.85);
          expect(highlight.forecast.every((tile) => tile.afterOpacity <= .3)).toBe(true);

          await activateTile(page, counterpart, testCase.input, "Space");
          await page.waitForFunction(({ key, moves }) => {
            const state = JSON.parse(localStorage.getItem(key) || "{}");
            return state.moves === moves - 1
              && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
          }, { key: SAVE_KEY, moves: before.moves }, { timeout: 12000 });
          const settled = await autonomyReport(page);
          await expect(page.locator("body")).not.toHaveClass(/selected-guided-play/);
          await expect(page.locator(".tile.guided-counterpart")).toHaveCount(0);
          expect(settled.state.moves).toBe(before.moves - 1);
          expect(settled.state.counts.reduce((sum, count) => sum + count, 0))
            .toBeGreaterThan(before.counts.reduce((sum, count) => sum + count, 0));
          expect(settled.selectedIds).toEqual([]);
          expect(settled.activeElementId).toMatch(/^tile-/);
          expect(settled.rovingTileIds).toEqual([settled.activeElementId]);
          expect(settled.tiles).toBe(64);
          expect(settled.rows).toBe(8);
          expect(settled.completeRows).toBe(8);
          expect(settled.disabledTiles).toBe(0);
          expect(settled.boardWidth).toBeCloseTo(testCase.mobile ? 378 : 600, 1);
          expect(settled.overflowX).toBe(false);
          expect(settled.overflowY).toBe(false);
          expect(settled.brokenImages).toEqual([]);
          await page.waitForTimeout(350);
          expect((await autonomyReport(page)).state.moves).toBe(before.moves - 1);
          expect(browserErrors).toEqual([]);
        } finally {
          await context.close();
        }
      });
    }
  }
}

for (const testCase of CASES) {
  for (const selectedEndpoint of ["source", "destination"]) {
    test(`untouched Round 3 idle Help preserves ${selectedEndpoint} on ${testCase.label}`, async ({ browser }) => {
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
        await openUntouchedRoundThree(
          page,
          `selected-${testCase.label}-${selectedEndpoint}`
        );
        const initialFocus = (await autonomyReport(page)).activeElementId;
        const hint = await waitForAutonomyHint(
          page,
          `${testCase.label} untouched Round 3 ${selectedEndpoint}`,
          initialFocus
        );
        const pair = hint.usefulness.pair;
        const selectedCell = selectedEndpoint === "source" ? pair[0] : pair[1];
        const counterpart = selectedEndpoint === "source" ? pair[1] : pair[0];
        const selectedId = `tile-${selectedCell.x}-${selectedCell.y}`;
        const counterpartId = `tile-${counterpart.x}-${counterpart.y}`;
        const pairIds = pair.map((cell) => `tile-${cell.x}-${cell.y}`).sort();
        const before = hint.report.state;

        await activateTile(page, selectedCell, testCase.input);
        await expect(page.locator("body")).toHaveClass(/selected-guided-play/);
        await expect(page.locator(`#${selectedId}`)).toHaveClass(/sel/);
        await expect(page.locator(`#${counterpartId}`)).toHaveClass(/guided-counterpart/);
        let report = await autonomyReport(page);
        expect(report.hints.map((cell) => `tile-${cell.x}-${cell.y}`).sort()).toEqual(pairIds);
        expect(report.selectedIds).toEqual([selectedId]);
        expect(report.activeElementId).toBe(selectedId);
        expect(report.rovingTileIds).toEqual([selectedId]);
        expect(report.state.moves).toBe(8);
        expect(report.state.counts).toEqual([0, 0, 0, 0, 0, 0]);
        expect(report.state.board).toEqual(before.board);
        let highlight = await selectedHelpHighlightReport(page, counterpart);
        expect(highlight.bodyOwnsPlayGuidance).toBe(true);
        expectSelectedGuidedSemantics(highlight, counterpartId);

        await activateControl(page, "#tutorialHelpBtn", testCase.input);
        await expect(page.locator("#tutorialSkipBtn")).toBeFocused();
        await expect(page.locator("#tutorialCopy")).toHaveText("Choose the other glowing flower.");
        report = await autonomyReport(page);
        expect(report.liveOwners).toEqual(["tutorialPanel"]);
        expect(report.hints.map((cell) => `tile-${cell.x}-${cell.y}`).sort()).toEqual(pairIds);
        expect(report.selectedIds).toEqual([selectedId]);
        expect(report.rovingTileIds).toEqual([selectedId]);
        expect(report.state.moves).toBe(8);
        expect(report.state.counts).toEqual([0, 0, 0, 0, 0, 0]);
        expect(report.state.board).toEqual(before.board);
        highlight = await selectedHelpHighlightReport(page, counterpart);
        expect(highlight.bodyOwnsGuidance).toBe(true);
        expect(highlight.counterpart?.classes).toContain("guided-counterpart");
        expectSelectedGuidedSemantics(highlight, counterpartId);
        expect(highlight.alternativeLegal.every((tile) => tile.afterOpacity <= .25)).toBe(true);

        await activateControl(page, "#tutorialSkipBtn", testCase.input, testCase.dismissKey);
        await expect(page.locator("#tutorialPanel")).toBeHidden();
        report = await autonomyReport(page);
        expect(report.hints.map((cell) => `tile-${cell.x}-${cell.y}`).sort()).toEqual(pairIds);
        expect(report.selectedIds).toEqual([selectedId]);
        expect(report.rovingTileIds).toEqual([selectedId]);
        expect(report.state.moves).toBe(8);
        expect(report.state.counts).toEqual([0, 0, 0, 0, 0, 0]);
        expect(report.state.board).toEqual(before.board);
        highlight = await selectedHelpHighlightReport(page, counterpart);
        expect(highlight.bodyOwnsPlayGuidance).toBe(true);
        expectSelectedGuidedSemantics(highlight, counterpartId);

        await activateTile(page, counterpart, testCase.input, "Space");
        await page.waitForFunction((key) => {
          const state = JSON.parse(localStorage.getItem(key) || "{}");
          return state.moves === 7
            && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
        }, SAVE_KEY, { timeout: 12000 });
        const settled = await autonomyReport(page);
        expect(settled.state.moves).toBe(7);
        expect(settled.state.counts.reduce((sum, count) => sum + count, 0)).toBeGreaterThan(0);
        expect(settled.selectedIds).toEqual([]);
        expect(settled.activeElementId).toMatch(/^tile-/);
        expect(settled.rovingTileIds).toEqual([settled.activeElementId]);
        expect(settled.tiles).toBe(64);
        expect(settled.rows).toBe(8);
        expect(settled.completeRows).toBe(8);
        expect(settled.disabledTiles).toBe(0);
        expect(settled.boardWidth).toBeCloseTo(testCase.mobile ? 378 : 600, 1);
        expect(settled.overflowX).toBe(false);
        expect(settled.overflowY).toBe(false);
        expect(settled.brokenImages).toEqual([]);
        expect(browserErrors).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
}

for (const round of [2, 3]) {
  for (const testCase of CASES) {
    test(`quiet Round ${round} hint survives keyboard travel on ${testCase.label}`, async ({ browser }) => {
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
        if (round === 2) {
          await openOrdinaryRoundAutonomy(page, `keyboard-travel-${testCase.label}`, 2);
        } else {
          await openUntouchedRoundThree(page, `keyboard-travel-${testCase.label}`);
        }
        const initial = await autonomyReport(page);
        const hint = await waitForAutonomyHint(
          page,
          `${testCase.label} Round ${round} keyboard travel`,
          initial.activeElementId
        );
        const pair = hint.usefulness.pair;
        const initialCell = await page.evaluate(() => {
          const tile = document.activeElement?.closest?.(".tile");
          return tile ? { x: Number(tile.dataset.x), y: Number(tile.dataset.y) } : null;
        });
        const distance = (cell) => Math.abs(cell.x - initialCell.x) + Math.abs(cell.y - initialCell.y);
        const selectedCell = distance(pair[0]) >= distance(pair[1]) ? pair[0] : pair[1];
        const counterpart = selectedCell === pair[0] ? pair[1] : pair[0];
        const selectedId = `tile-${selectedCell.x}-${selectedCell.y}`;
        const counterpartId = `tile-${counterpart.x}-${counterpart.y}`;
        const pairIds = [selectedId, counterpartId].sort();
        const before = hint.report.state;

        await moveKeyboardFocusTo(
          page,
          selectedCell,
          pairIds,
          before,
          `${testCase.label} Round ${round}`
        );
        const counterpartKey = counterpart.x > selectedCell.x
          ? "ArrowRight"
          : counterpart.x < selectedCell.x
            ? "ArrowLeft"
            : counterpart.y > selectedCell.y ? "ArrowDown" : "ArrowUp";
        const returnKey = counterpartKey === "ArrowRight"
          ? "ArrowLeft"
          : counterpartKey === "ArrowLeft"
            ? "ArrowRight"
            : counterpartKey === "ArrowDown" ? "ArrowUp" : "ArrowDown";
        await page.keyboard.press(counterpartKey);
        await expectDistinctKeyboardCursor(
          page,
          pairIds,
          `${testCase.label} Round ${round} counterpart focus`
        );
        expect((await autonomyReport(page)).state).toEqual(before);
        await page.keyboard.press(returnKey);
        await expectDistinctKeyboardCursor(
          page,
          pairIds,
          `${testCase.label} Round ${round} source focus`
        );
        if (
          (round === 2 && testCase.label === "desktop-pointer")
          || (round === 3 && testCase.label === "mobile390-touch")
        ) {
          await page.screenshot({
            path: `work/keyboard-idle-hint-r${round}-${testCase.label}.png`
          });
        }
        expect((await autonomyReport(page)).activeElementId).toBe(selectedId);
        await page.keyboard.press("Enter");
        let selected = await autonomyReport(page);
        expect(selected.selectedIds).toEqual([selectedId]);
        expect(selected.hints.map((cell) => `tile-${cell.x}-${cell.y}`).sort()).toEqual(pairIds);
        expect(selected.rovingTileIds).toEqual([selected.activeElementId]);
        expect(selected.state).toEqual(before);

        await page.keyboard.press(counterpartKey);
        await page.waitForFunction(({ key, moves }) => {
          const state = JSON.parse(localStorage.getItem(key) || "{}");
          return state.moves === moves - 1
            && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
        }, { key: SAVE_KEY, moves: before.moves }, { timeout: 12000 });
        const settled = await autonomyReport(page);
        expect(settled.state.moves).toBe(before.moves - 1);
        expect(settled.state.counts.reduce((sum, count) => sum + count, 0))
          .toBeGreaterThan(before.counts.reduce((sum, count) => sum + count, 0));
        expect(settled.selectedIds).toEqual([]);
        expect(settled.activeElementId).toMatch(/^tile-/);
        expect(settled.rovingTileIds).toEqual([settled.activeElementId]);
        expect(settled.tiles).toBe(64);
        expect(settled.rows).toBe(8);
        expect(settled.completeRows).toBe(8);
        expect(settled.disabledTiles).toBe(0);
        expect(settled.boardWidth).toBeCloseTo(testCase.mobile ? 378 : 600, 1);
        expect(settled.overflowX).toBe(false);
        expect(settled.overflowY).toBe(false);
        expect(settled.brokenImages).toEqual([]);
        expect(browserErrors).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
}

for (const testCase of [CASES[0], CASES[3]]) {
  test(`selected active guide reload stays quiet on ${testCase.label}`, async ({ browser }) => {
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
      await openOrdinaryRoundAutonomy(page, `reload-${testCase.label}`, 2);
      const hint = await waitForAutonomyHint(page, `${testCase.label} reload setup`);
      const selectedCell = hint.usefulness.pair[0];
      const counterpart = hint.usefulness.pair[1];
      const before = hint.report.state;

      await activateTile(page, selectedCell, testCase.input);
      await expect(page.locator("body")).toHaveClass(/selected-guided-play/);
      await expect(page.locator(`#tile-${counterpart.x}-${counterpart.y}`))
        .toHaveClass(/guided-counterpart/);

      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(250);
      await expect(page.locator("body")).not.toHaveClass(/selected-guided-play/);
      await expect(page.locator(".tile.guided-counterpart")).toHaveCount(0);
      const restored = await autonomyReport(page);
      expect(restored.selectedIds).toEqual([]);
      expect(restored.tutorialVisible).toBe(false);
      expect(restored.state.moves).toBe(before.moves);
      expect(restored.state.counts).toEqual(before.counts);
      expect(restored.state.board).toEqual(before.board);
      expect(restored.tiles).toBe(64);
      expect(restored.rows).toBe(8);
      expect(restored.completeRows).toBe(8);
      expect(restored.overflowX).toBe(false);
      expect(restored.brokenImages).toEqual([]);
      await activateTile(page, selectedCell, testCase.input);
      await expect(page.locator("body")).not.toHaveClass(/selected-guided-play/);
      const ordinaryLegalLabels = await page.locator(".tile.legal-target").evaluateAll((tiles) => (
        tiles.map((tile) => tile.getAttribute("aria-label") || "")
      ));
      expect(ordinaryLegalLabels.length).toBeGreaterThan(0);
      expect(ordinaryLegalLabels.every((label) => label.includes("legal match swap target"))).toBe(true);
      expect((await autonomyReport(page)).state).toEqual(before);
      expect(browserErrors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

for (const testCase of CASES) {
  test(`focused autonomy hint owns quiet Round 3 recovery on ${testCase.label}`, async ({ browser }) => {
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
    page.on("requestfailed", (request) => {
      const url = request.url();
      const errorText = request.failure()?.errorText || "";
      const canceledFixtureImage = errorText === "net::ERR_ABORTED"
        && /\/assets\/greenhouse\/first_greenhouse_(?:restored|withered)\.jpg$/.test(url);
      if (!canceledFixtureImage) {
        failedRequests.push(`${url} ${errorText}`);
      }
    });

    try {
      await openRoundThreeAutonomy(page, testCase.label);
      const initialFocus = (await autonomyReport(page)).activeElementId;
      let hint = await waitForAutonomyHint(page, `${testCase.label} initial`, initialFocus);
      await page.screenshot({ path: `work/idle-hint-${testCase.label}.png` });

      await cancelBoardInput(page, hint.usefulness.pair, testCase);
      if (testCase.input === "keyboard") {
        const preservedAfterNavigation = await autonomyReport(page);
        expect(preservedAfterNavigation.hints).toHaveLength(2);
        expect(preservedAfterNavigation.selectedTiles).toBe(0);
        expect(preservedAfterNavigation.rovingTileIds).toEqual([preservedAfterNavigation.activeElementId]);
      } else {
        await expect(page.locator(".tile.idle-hint")).toHaveCount(0);
        hint = await waitForAutonomyHint(page, `${testCase.label} after canceled input`);
      }

      await activatePair(page, [{ x: 6, y: 7 }, { x: 7, y: 7 }], testCase.input);
      await expect(page.locator(".tile.invalid-swap")).toHaveCount(2, { timeout: 1500 });
      await expect(page.locator(".tile.idle-hint")).toHaveCount(0);
      await expect(page.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 2500 });
      hint = await waitForAutonomyHint(page, `${testCase.label} after refusal`);
      expect(hint.report.state.moves, `${testCase.label} refusal spends no move`).toBe(8);

      // Use the fixture's ordinary three-match here so Black Candle's immediate
      // armed guidance cannot masquerade as a generic post-move idle hint.
      await activatePair(page, [{ x: 1, y: 0 }, { x: 1, y: 1 }], testCase.input);
      await page.waitForFunction((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === 7
          && document.querySelectorAll(".tile").length === 64
          && Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled);
      }, SAVE_KEY, { timeout: 12000 });
      await expect(page.locator(".tile.idle-hint")).toHaveCount(0);
      await waitForAutonomyHint(page, `${testCase.label} after valid match`);
      const settledState = JSON.stringify((await autonomyReport(page)).state);

      for (let reload = 1; reload <= 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator(".tile")).toHaveCount(64);
        const immediate = await autonomyReport(page);
        expect(
          JSON.stringify(immediate.state),
          `${testCase.label} reload ${reload} exact settled save`
        ).toBe(settledState);
        expect(immediate.activeElementId, `${testCase.label} reload ${reload} board focus`)
          .toMatch(/^tile-\d-\d$/);
        expect(
          immediate.rovingTileIds,
          `${testCase.label} reload ${reload} active and roving agree`
        ).toEqual([immediate.activeElementId]);
        expect(immediate.selectedTiles, `${testCase.label} reload ${reload} no selection`).toBe(0);
        expect(immediate.tiles, `${testCase.label} reload ${reload} tiles`).toBe(64);
        expect(immediate.rows, `${testCase.label} reload ${reload} rows`).toBe(8);
        expect(immediate.completeRows, `${testCase.label} reload ${reload} visible rows`).toBe(8);
        expect(immediate.overflowX, `${testCase.label} reload ${reload} no overflow`).toBe(false);
        expect(immediate.brokenImages, `${testCase.label} reload ${reload} images`).toEqual([]);

        await page.keyboard.press("ArrowRight");
        const keyboardReady = await autonomyReport(page);
        expect(
          keyboardReady.rovingTileIds,
          `${testCase.label} reload ${reload} keyboard roving agreement`
        ).toEqual([keyboardReady.activeElementId]);
        expect(keyboardReady.selectedTiles, `${testCase.label} reload ${reload} keyboard no selection`)
          .toBe(0);
        expect(
          JSON.stringify(keyboardReady.state),
          `${testCase.label} reload ${reload} keyboard preserves save`
        ).toBe(settledState);

        const reloaded = await waitForAutonomyHint(
          page,
          `${testCase.label} reload ${reload}`,
          keyboardReady.activeElementId
        );
        expect(reloaded.report.state.moves, `${testCase.label} reload ${reload} move state`).toBe(7);
      }

      const helpButton = page.locator("#tutorialHelpBtn");
      if (testCase.input === "touch") {
        await helpButton.tap();
      } else if (testCase.input === "keyboard") {
        await helpButton.focus();
        await page.keyboard.press("Enter");
      } else {
        await helpButton.click();
      }
      await expect(page.locator("#tutorialSkipBtn")).toBeFocused();
      const replayState = JSON.stringify((await autonomyReport(page)).state);
      for (let reload = 1; reload <= 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        const replay = await autonomyReport(page);
        expect(replay.activeElementId, `${testCase.label} replay reload ${reload} Skip focus`)
          .toBe("tutorialSkipBtn");
        expect(replay.tutorialVisible, `${testCase.label} replay reload ${reload} visible`).toBe(true);
        expect(replay.rovingTileIds, `${testCase.label} replay reload ${reload} one board fallback`)
          .toHaveLength(1);
        expect(replay.selectedTiles, `${testCase.label} replay reload ${reload} no selection`).toBe(0);
        expect(replay.tiles, `${testCase.label} replay reload ${reload} tiles`).toBe(64);
        expect(replay.rows, `${testCase.label} replay reload ${reload} rows`).toBe(8);
        expect(replay.completeRows, `${testCase.label} replay reload ${reload} visible rows`).toBe(8);
        expect(replay.overflowX, `${testCase.label} replay reload ${reload} no overflow`).toBe(false);
        expect(replay.brokenImages, `${testCase.label} replay reload ${reload} images`).toEqual([]);
        expect(
          JSON.stringify(replay.state),
          `${testCase.label} replay reload ${reload} exact save`
        ).toBe(replayState);
      }

      await page.keyboard.press(testCase.dismissKey);
      const dismissedReplay = await autonomyReport(page);
      const settled = JSON.parse(settledState);
      expect(dismissedReplay.tutorialVisible, `${testCase.label} ${testCase.dismissKey} dismisses replay`)
        .toBe(false);
      expect(dismissedReplay.activeElementId, `${testCase.label} dismissal returns to Help`)
        .toBe("tutorialHelpBtn");
      expect(dismissedReplay.helpVisible, `${testCase.label} Help remains visible`).toBe(true);
      expect(dismissedReplay.rovingTileIds, `${testCase.label} board roving model preserved`).toHaveLength(1);
      expect(dismissedReplay.selectedTiles, `${testCase.label} dismissal selects no tile`).toBe(0);
      expect(dismissedReplay.state.moves, `${testCase.label} dismissal spends no move`).toBe(settled.moves);
      expect(dismissedReplay.state.counts, `${testCase.label} dismissal changes no counts`).toEqual(settled.counts);
      expect(dismissedReplay.state.board, `${testCase.label} dismissal changes no board`).toEqual(settled.board);
      expect(await page.locator(".tile.idle-hint").count(), `${testCase.label} no immediate replay hint`)
        .toBe(0);

      if (testCase.label === "desktop-pointer") {
        await page.waitForTimeout(3000);
        await helpButton.click();
        await expect(page.locator("#tutorialSkipBtn")).toBeFocused();
        await page.keyboard.press("Enter");
        expect(await page.locator(".tile.idle-hint").count(), `${testCase.label} repeated replay clears prior generation`)
          .toBe(0);
      }

      await page.waitForTimeout(6000);
      expect(await page.locator(".tile.idle-hint").count(), `${testCase.label} quiet window lasts six seconds`)
        .toBe(0);
      await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 2500 });
      const recoveredAfterReplay = await autonomyReport(page);
      const recoveredUsefulness = await hintUsefulness(page);
      expect(recoveredAfterReplay.activeElementId, `${testCase.label} recovered hint does not steal Help focus`)
        .toBe("tutorialHelpBtn");
      expect(recoveredAfterReplay.selectedTiles, `${testCase.label} recovered hint selects no tile`).toBe(0);
      expect(recoveredAfterReplay.state.moves, `${testCase.label} recovered hint spends no move`).toBe(settled.moves);
      expect(recoveredAfterReplay.state.counts, `${testCase.label} recovered hint changes no counts`)
        .toEqual(settled.counts);
      expect(recoveredAfterReplay.state.board, `${testCase.label} recovered hint changes no board`)
        .toEqual(settled.board);
      expect(recoveredUsefulness.legal, `${testCase.label} recovered replay hint is legal`).toBe(true);
      expect(recoveredUsefulness.useful, `${testCase.label} recovered replay hint advances the order`).toBe(true);

      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

for (const testCase of CASES) {
  test(`untouched Round 3 reload restores board focus on ${testCase.label}`, async ({ browser }) => {
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
    page.on("requestfailed", (request) => (
      failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`)
    ));

    try {
      await openUntouchedRoundThree(page, testCase.label);
      const initial = await autonomyReport(page);
      const savedState = JSON.stringify(initial.state);
      expect(initial.state).toMatchObject({
        currentRound: 3,
        moves: 8,
        counts: [0, 0, 0, 0, 0, 0],
        roundComplete: false,
        hasMadeValidMove: false
      });
      expect(initial.activeElementId, `${testCase.label} initial board focus`).toMatch(/^tile-\d-\d$/);
      expect(initial.rovingTileIds, `${testCase.label} initial focus and roving agree`)
        .toEqual([initial.activeElementId]);
      expect(initial.selectedTiles, `${testCase.label} initial no selection`).toBe(0);

      const initialTile = page.locator(`#${initial.activeElementId}`);
      if (testCase.mobile) await initialTile.tap();
      else await initialTile.click();
      expect((await autonomyReport(page)).selectedTiles, `${testCase.label} ordinary input remains active`).toBe(1);
      expect(
        JSON.stringify((await autonomyReport(page)).state),
        `${testCase.label} ordinary selection changes no save`
      ).toBe(savedState);

      for (let reload = 1; reload <= 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator(".tile")).toHaveCount(64);
        const restored = await autonomyReport(page);
        expect(
          JSON.stringify(restored.state),
          `${testCase.label} reload ${reload} exact untouched save`
        ).toBe(savedState);
        expect(restored.activeElementId, `${testCase.label} reload ${reload} board focus`)
          .toMatch(/^tile-\d-\d$/);
        expect(
          restored.rovingTileIds,
          `${testCase.label} reload ${reload} active and roving agree`
        ).toEqual([restored.activeElementId]);
        expect(restored.selectedTiles, `${testCase.label} reload ${reload} no selection`).toBe(0);
        expect(restored.tiles, `${testCase.label} reload ${reload} tiles`).toBe(64);
        expect(restored.rows, `${testCase.label} reload ${reload} rows`).toBe(8);
        expect(restored.completeRows, `${testCase.label} reload ${reload} visible rows`).toBe(8);
        expect(restored.overflowX, `${testCase.label} reload ${reload} no overflow`).toBe(false);
        expect(restored.brokenImages, `${testCase.label} reload ${reload} images`).toEqual([]);

        await page.keyboard.press("ArrowRight");
        const keyboardReady = await autonomyReport(page);
        expect(
          keyboardReady.rovingTileIds,
          `${testCase.label} reload ${reload} arrow keeps roving agreement`
        ).toEqual([keyboardReady.activeElementId]);
        expect(keyboardReady.selectedTiles, `${testCase.label} reload ${reload} arrow selects nothing`).toBe(0);
        expect(
          JSON.stringify(keyboardReady.state),
          `${testCase.label} reload ${reload} arrow changes no save`
        ).toBe(savedState);

        if (reload === 1) {
          await page.keyboard.press(testCase.dismissKey);
          const selectedByKeyboard = await autonomyReport(page);
          expect(
            selectedByKeyboard.selectedTiles,
            `${testCase.label} ${testCase.dismissKey} immediately operates board`
          ).toBe(1);
          expect(
            JSON.stringify(selectedByKeyboard.state),
            `${testCase.label} ${testCase.dismissKey} selection changes no save`
          ).toBe(savedState);
          continue;
        }

        const focusBeforeHint = keyboardReady.activeElementId;
        const hint = await waitForAutonomyHint(
          page,
          `${testCase.label} untouched reload`,
          focusBeforeHint
        );
        expect(hint.report.state.moves, `${testCase.label} delayed hint spends no move`).toBe(8);
        expect(hint.report.state.counts, `${testCase.label} delayed hint changes no counts`)
          .toEqual([0, 0, 0, 0, 0, 0]);
        expect(hint.report.selectedTiles, `${testCase.label} delayed hint selects nothing`).toBe(0);
      }

      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
