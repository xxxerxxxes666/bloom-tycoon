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

async function selectCell(page, cell, input) {
  const tile = page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
  if (input === "touch") {
    await tile.tap();
    return;
  }
  if (input === "keyboard") {
    await tile.focus();
    await page.keyboard.press("Enter");
    return;
  }
  await tile.click();
}

async function activateControl(page, selector, input) {
  const control = page.locator(selector);
  if (input === "touch") {
    await control.tap();
    return;
  }
  if (input === "keyboard") {
    await control.focus();
    await page.keyboard.press("Enter");
    return;
  }
  await control.click();
}

async function cancelBoardDrag(page, cell, input) {
  const tile = page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
  const box = await tile.boundingBox();
  expect(box, `${input} cancel source geometry`).toBeTruthy();
  const point = {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2
  };
  if (input === "touch") {
    await page.evaluate(({ cell, point }) => {
      const tile = document.querySelector(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
      const board = document.querySelector("#board");
      const start = new Touch({
        identifier: 71,
        target: tile,
        clientX: point.x,
        clientY: point.y
      });
      const moved = new Touch({
        identifier: 71,
        target: tile,
        clientX: point.x + 12,
        clientY: point.y
      });
      tile.dispatchEvent(new TouchEvent("touchstart", {
        touches: [start],
        changedTouches: [start],
        bubbles: true,
        cancelable: true
      }));
      board.dispatchEvent(new TouchEvent("touchmove", {
        touches: [moved],
        changedTouches: [moved],
        bubbles: true,
        cancelable: true
      }));
      board.dispatchEvent(new TouchEvent("touchcancel", {
        touches: [],
        changedTouches: [moved],
        bubbles: true,
        cancelable: true
      }));
    }, { cell, point });
    return;
  }
  if (input === "keyboard") {
    await tile.focus();
    await page.keyboard.press("ArrowRight");
    return;
  }
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 12, point.y);
  await page.dispatchEvent("#board", "pointercancel", { pointerId: 1 });
  await page.mouse.up();
}

async function guidedPair(page) {
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 7000 });
  return page.locator(".tile.idle-hint").evaluateAll((tiles) => tiles.map((tile) => ({
    x: Number(tile.dataset.x),
    y: Number(tile.dataset.y)
  })));
}

async function invalidPair(page, excludedCells = []) {
  return page.evaluate(({ key, excludedCells }) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const excluded = new Set(excludedCells);
    const board = state.board.map((row) => row.slice());
    const selectedTile = document.querySelector("#board .tile.sel");
    const selectedCell = selectedTile
      ? { x: Number(selectedTile.dataset.x), y: Number(selectedTile.dataset.y) }
      : null;
    const createsMatch = (a, b) => {
      const previous = board[a.y][a.x];
      board[a.y][a.x] = board[b.y][b.x];
      board[b.y][b.x] = previous;
      const hasRunAt = ({ x, y }) => {
        const flowerId = board[y][x];
        let horizontal = 1;
        let vertical = 1;
        for (let offset = x - 1; offset >= 0 && board[y][offset] === flowerId; offset -= 1) horizontal += 1;
        for (let offset = x + 1; offset < 8 && board[y][offset] === flowerId; offset += 1) horizontal += 1;
        for (let offset = y - 1; offset >= 0 && board[offset][x] === flowerId; offset -= 1) vertical += 1;
        for (let offset = y + 1; offset < 8 && board[offset][x] === flowerId; offset += 1) vertical += 1;
        return horizontal >= 3 || vertical >= 3;
      };
      const matched = hasRunAt(a) || hasRunAt(b);
      board[b.y][b.x] = board[a.y][a.x];
      board[a.y][a.x] = previous;
      return matched;
    };
    for (let y = 7; y >= 0; y -= 1) {
      for (let x = 7; x >= 0; x -= 1) {
        for (const [dx, dy] of [[-1, 0], [0, -1]]) {
          const target = { x: x + dx, y: y + dy };
          const source = { x, y };
          if (target.x < 0 || target.y < 0) continue;
          if (excluded.has(`${source.x},${source.y}`) || excluded.has(`${target.x},${target.y}`)) continue;
          if (selectedCell && Math.abs(source.x - selectedCell.x) + Math.abs(source.y - selectedCell.y) === 1) continue;
          if (!createsMatch(source, target)) return [source, target];
        }
      }
    }
    return [];
  }, { key: SAVE_KEY, excludedCells });
}

async function legalOffGuidePair(page, { changeTeachingColumn = false } = {}) {
  return page.evaluate(({ key, changeTeachingColumn }) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const board = state.board.map((row) => row.slice());
    const hinted = new Set(Array.from(document.querySelectorAll(".tile.idle-hint"))
      .map((tile) => `${tile.dataset.x},${tile.dataset.y}`));
    const runsAfterSwap = (a, b) => {
      const previous = board[a.y][a.x];
      board[a.y][a.x] = board[b.y][b.x];
      board[b.y][b.x] = previous;
      const runs = [];
      for (let y = 0; y < 8; y += 1) {
        for (let start = 0, x = 1; x <= 8; x += 1) {
          if (x === 8 || board[y][x] !== board[y][start]) {
            if (x - start >= 3) {
              runs.push(Array.from({ length: x - start }, (_, offset) => [start + offset, y]));
            }
            start = x;
          }
        }
      }
      for (let x = 0; x < 8; x += 1) {
        for (let start = 0, y = 1; y <= 8; y += 1) {
          if (y === 8 || board[y][x] !== board[start][x]) {
            if (y - start >= 3) {
              runs.push(Array.from({ length: y - start }, (_, offset) => [x, start + offset]));
            }
            start = y;
          }
        }
      }
      board[b.y][b.x] = board[a.y][a.x];
      board[a.y][a.x] = previous;
      const moved = new Set([`${a.x},${a.y}`, `${b.x},${b.y}`]);
      return runs.filter((run) => run.some(([x, y]) => moved.has(`${x},${y}`)));
    };
    const candidates = [];
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const a = { x, y };
          const b = { x: x + dx, y: y + dy };
          if (b.x >= 8 || b.y >= 8) continue;
          if (hinted.has(`${a.x},${a.y}`) || hinted.has(`${b.x},${b.y}`)) continue;
          const runs = runsAfterSwap(a, b);
          if (!runs.length) continue;
          const touchesThorn = runs.some((run) => run.some(([runX, runY]) => (
            state.cursedThorns.some((thorn) => (
              Math.abs(thorn.x - runX) + Math.abs(thorn.y - runY) <= 1
            ))
          )));
          if (touchesThorn) continue;
          const changesTeachingColumn = runs.some((run) => run.some(([runX]) => runX <= 2));
          if (!changeTeachingColumn || changesTeachingColumn) {
            candidates.push([a, b]);
          }
        }
      }
    }
    return candidates[0] || [];
  }, { key: SAVE_KEY, changeTeachingColumn });
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
      activeElementId: document.activeElement?.id || "",
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
      guideCells: Array.from(document.querySelectorAll(".tile.idle-hint"))
        .map((tile) => `${tile.dataset.x},${tile.dataset.y}`)
        .sort(),
      thornSwapTiles: document.querySelectorAll(".tile.thorn-teach").length,
      thornTargets: document.querySelectorAll(".tile.thorn-teach-blocker").length,
      guideOverlays: document.querySelectorAll(".swap-path-arrow, .first-action-swap-guide").length,
      selectedCells: Array.from(document.querySelectorAll(".tile.sel"))
        .map((tile) => `${tile.dataset.x},${tile.dataset.y}`),
      invalidTiles: document.querySelectorAll(".tile.invalid-swap").length,
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

function expectAuthoritativeThornLesson(report, label, { selected = null } = {}) {
  expect(report.state.moves, `${label} move budget`).toBe(9);
  expect(report.state.counts, `${label} no flower credit`).toEqual([0, 0, 0, 0, 0, 0]);
  expect(report.state.clearedCursedThorns, `${label} no thorn credit`).toBe(0);
  expect(report.tutorialVisible, `${label} lesson visible`).toBe(true);
  expect(report.tutorialCopy, `${label} literal Thorn copy`).toBe("Match beside the Thorn.");
  expect(report.guideCells, `${label} authored pair`).toEqual(["1,2", "1,3"]);
  expect(report.thornSwapTiles, `${label} two cause tiles`).toBe(2);
  expect(report.thornTargets, `${label} three blocker targets`).toBe(3);
  expect(report.guideOverlays, `${label} one guide overlay`).toBe(1);
  expect(report.selectedCells, `${label} coherent selection`).toEqual(selected ? [selected] : []);
}

function expectRecoveredThornLesson(report, testCase, expectedState, expectedGuideCells, label) {
  expect(report.state.moves, `${label} spent off-guide move retained`).toBe(expectedState.moves);
  expect(report.state.counts, `${label} earned flower credit retained`).toEqual(expectedState.counts);
  expect(report.state.clearedCursedThorns, `${label} untouched Thorn progress`).toBe(0);
  expect(report.state.cursedThorns, `${label} all blockers remain`).toHaveLength(3);
  expect(report.tutorialVisible, `${label} lesson visible`).toBe(true);
  expect(report.tutorialCopy, `${label} literal Thorn copy`).toBe("Match beside the Thorn.");
  expect(report.guideCells, `${label} deterministic recomputed pair`).toEqual(expectedGuideCells);
  expect(report.thornSwapTiles, `${label} two recomputed cause tiles`).toBe(2);
  expect(report.thornTargets, `${label} three blocker targets`).toBe(3);
  expect(report.guideOverlays, `${label} one recomputed guide overlay`).toBe(1);
  expect(report.selectedCells, `${label} settled selection cleared`).toEqual([]);
  expect(report.focusedTile, `${label} recomputed source focused`).toBe(true);
  expect(report.focusableTiles, `${label} one roving tile`).toBe(1);
  expect(report.tiles, `${label} tile integrity`).toBe(64);
  expect(report.rows, `${label} eight authoritative rows`).toBe(8);
  expect(report.completeRows, `${label} eight visible rows`).toBe(8);
  expect(report.completeColumns, `${label} eight visible columns`).toBe(8);
  expect(report.disabledTiles, `${label} control returned`).toBe(0);
  expect(report.boardBottom, `${label} board in first viewport`).toBeLessThanOrEqual(testCase.viewport.height);
  expect(report.overflowX, `${label} no horizontal overflow`).toBe(false);
  expect(report.brokenImages, `${label} no broken images`).toEqual([]);
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

      await activateControl(page, "#tutorialSkipBtn", testCase.input);
      report = await handoffReport(page);
      expect(report.tutorialVisible, `${testCase.label} Skip retires lesson copy`).toBe(false);
      expect(report.guideTiles, `${testCase.label} Skip retires pair`).toBe(0);
      expect(report.thornSwapTiles, `${testCase.label} Skip retires cause teaching`).toBe(0);
      expect(report.thornTargets, `${testCase.label} Skip retires blocker teaching`).toBe(0);
      expect(report.guideOverlays, `${testCase.label} Skip retires guide overlay`).toBe(0);

      await activateControl(page, "#tutorialHelpBtn", testCase.input);
      await expect(page.locator(".tile.thorn-teach")).toHaveCount(2, { timeout: 7000 });
      report = await handoffReport(page);
      expectAuthoritativeThornLesson(report, `${testCase.label} Help replay`);
      expect(report.activeElementId, `${testCase.label} Help focuses Skip`).toBe("tutorialSkipBtn");
      await page.screenshot({
        path: `work/round-two-thorn-help-replay-${testCase.label}.png`
      });

      await cancelBoardDrag(page, { x: 0, y: 0 }, testCase.input);
      await page.waitForTimeout(380);
      report = await handoffReport(page);
      expectAuthoritativeThornLesson(report, `${testCase.label} replay canceled input`);

      await selectCell(page, { x: 0, y: 0 }, testCase.input);
      await page.waitForTimeout(60);
      report = await handoffReport(page);
      expectAuthoritativeThornLesson(report, `${testCase.label} replay wrong first selection`, { selected: "0,0" });

      await selectCell(page, { x: 7, y: 7 }, testCase.input);
      await page.waitForTimeout(60);
      report = await handoffReport(page);
      expectAuthoritativeThornLesson(report, `${testCase.label} replay nonadjacent reselection`, { selected: "7,7" });

      const repeatedInvalidPair = await invalidPair(page, ["0,0", "1,0", "1,2", "1,3"]);
      expect(repeatedInvalidPair, `${testCase.label} second refusal pair`).toHaveLength(2);
      await selectCell(page, repeatedInvalidPair[0], testCase.input);
      await selectCell(page, repeatedInvalidPair[1], testCase.input);
      await page.waitForTimeout(120);
      report = await handoffReport(page);
      expect(report.tutorialCopy, `${testCase.label} refusal peak copy`).toBe("Use the glowing pair.");
      expect(report.invalidTiles, `${testCase.label} refusal marks`).toBe(2);
      expect(report.guideCells, `${testCase.label} refusal retains glowing pair`).toEqual(["1,2", "1,3"]);
      expect(report.thornSwapTiles, `${testCase.label} refusal retains causes`).toBe(2);
      expect(report.thornTargets, `${testCase.label} refusal retains blockers`).toBe(3);
      expect(report.guideOverlays, `${testCase.label} refusal retains guide overlay`).toBe(1);
      if (!testCase.reduced) {
        await page.screenshot({
          path: `work/round-two-thorn-mistake-${testCase.label}.png`
        });
      }

      await selectCell(page, { x: 0, y: 0 }, testCase.input);
      await selectCell(page, { x: 1, y: 0 }, testCase.input);
      await page.waitForTimeout(120);
      report = await handoffReport(page);
      expect(report.tutorialCopy, `${testCase.label} repeated refusal peak copy`).toBe("Use the glowing pair.");
      expect(report.invalidTiles, `${testCase.label} repeated refusal marks`).toBe(2);
      expect(report.guideCells, `${testCase.label} repeated refusal retains pair`).toEqual(["1,2", "1,3"]);
      expect(report.guideOverlays, `${testCase.label} repeated refusal retains guide overlay`).toBe(1);
      await page.waitForTimeout(1040);
      report = await handoffReport(page);
      expectAuthoritativeThornLesson(report, `${testCase.label} replay refusal cleanup`);
      expect(report.invalidTiles, `${testCase.label} refusal cleanup`).toBe(0);

      const offGuidePair = testCase.reduced
        ? await legalOffGuidePair(page, { changeTeachingColumn: true })
        : [{ x: 4, y: 0 }, { x: 5, y: 0 }];
      expect(offGuidePair, `${testCase.label} natural off-guide pair`).toHaveLength(2);
      const beforeOffGuide = report.state;
      await activatePair(page, offGuidePair, testCase.input);
      await page.waitForFunction(({ key, moves }) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === moves - 1
          && state.clearedCursedThorns === 0
          && document.querySelectorAll(".tile").length === 64
          && Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled);
      }, { key: SAVE_KEY, moves: beforeOffGuide.moves }, { timeout: 12000 });
      await expect(page.locator(".tile.thorn-teach")).toHaveCount(2, { timeout: 7000 });
      report = await handoffReport(page);
      const offGuideFlowerCredit = report.state.counts.reduce((sum, count) => sum + count, 0)
        - beforeOffGuide.counts.reduce((sum, count) => sum + count, 0);
      expect(report.state.moves, `${testCase.label} off-guide move spends once`).toBe(8);
      expect(offGuideFlowerCredit, `${testCase.label} off-guide move earns real flowers`).toBeGreaterThan(0);
      expect(report.state.clearedCursedThorns, `${testCase.label} off-guide move leaves Thorns untouched`).toBe(0);
      guide = await usefulGuideReport(page);
      expect(guide.legal, `${testCase.label} recovered guide is legal`).toBe(true);
      expect(guide.useful, `${testCase.label} recovered guide damages a Thorn`).toBe(true);
      const recoveredGuideCells = report.guideCells;
      const recoveredState = JSON.stringify(report.state);
      expectRecoveredThornLesson(
        report,
        testCase,
        report.state,
        recoveredGuideCells,
        `${testCase.label} off-guide recovery`
      );
      await page.screenshot({
        path: `work/round-two-thorn-off-guide-recovery-${testCase.label}.png`
      });

      for (let reload = 1; reload <= 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator(".tile.thorn-teach")).toHaveCount(2, { timeout: 7000 });
        await page.waitForTimeout(100);
        report = await handoffReport(page);
        expectRecoveredThornLesson(
          report,
          testCase,
          JSON.parse(recoveredState),
          recoveredGuideCells,
          `${testCase.label} recovered reload ${reload}`
        );
        expect(JSON.stringify(report.state), `${testCase.label} settled reload ${reload}`).toBe(recoveredState);
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
      expect(after.state.clearedCursedThorns, `${testCase.label} Thorn goal seals`).toBe(3);
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

      await activateControl(page, "#tutorialHelpBtn", testCase.input);
      await page.waitForTimeout(100);
      const completedLessonReplay = await handoffReport(page);
      expect(completedLessonReplay.thornSwapTiles, `${testCase.label} completed lesson Help does not restore causes`).toBe(0);
      expect(completedLessonReplay.thornTargets, `${testCase.label} completed lesson Help does not restore blockers`).toBe(0);
      expect(completedLessonReplay.guideTiles, `${testCase.label} completed lesson Help does not restore hints`).toBe(0);
      expect(completedLessonReplay.guideOverlays, `${testCase.label} completed lesson Help does not restore overlay`).toBe(0);
      await activateControl(page, "#tutorialSkipBtn", testCase.input);

      await page.addInitScript(({ key, fixtureKey }) => {
        if (sessionStorage.getItem(fixtureKey)) {
          return;
        }
        sessionStorage.setItem(fixtureKey, "1");
        const state = JSON.parse(localStorage.getItem(key));
        if (state) {
          state.moves = 0;
          state.counts = [0, 0, 0, 0, 0, 0];
          state.roundComplete = false;
          localStorage.setItem(key, JSON.stringify(state));
        }
      }, {
        key: SAVE_KEY,
        fixtureKey: `round-two-retry-${testCase.label}`
      });
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

async function roundTwoRelicReport(page) {
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
    const relic = state.armedLineRelic || null;
    const focusedTile = document.activeElement?.classList.contains("tile")
      ? `${document.activeElement.dataset.x},${document.activeElement.dataset.y}`
      : "";
    const tileRects = Array.from(document.querySelectorAll(".tile")).map((tile) => ({
      y: tile.dataset.y,
      rect: tile.getBoundingClientRect()
    }));
    return {
      state,
      tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      tutorialIcon: document.querySelector("#tutorialPanel .tutorial-icon")?.textContent.trim() || "",
      namedTutorial: document.querySelector("#tutorialPanel")?.classList.contains("black-candle-tutorial") || false,
      instructionCount: [
        document.querySelector("#tutorialPanel"),
        document.querySelector("#firstSwapCue")
      ].filter(visible).length,
      hints: Array.from(document.querySelectorAll(".tile.idle-hint")).map((tile) => ({
        x: Number(tile.dataset.x),
        y: Number(tile.dataset.y),
        relic: tile.classList.contains("black-candle-vine"),
        destination: tile.classList.contains("line-relic-destination")
      })),
      laneTiles: document.querySelectorAll(".tile.line-relic-lane-preview").length,
      destinations: document.querySelectorAll(".tile.line-relic-destination").length,
      relicTiles: document.querySelectorAll('.tile[data-line-relic="black-candle-vine"]').length,
      thornCauses: document.querySelectorAll(".tile.thorn-teach").length,
      thornTargets: document.querySelectorAll(".tile.thorn-teach-blocker").length,
      guideOverlays: document.querySelectorAll(".swap-path-arrow, .first-action-swap-guide").length,
      focusedTile,
      rovingTiles: document.querySelectorAll(".tile[tabindex='0']").length,
      tiles: tileRects.length,
      rows: new Set(tileRects.map(({ y }) => y)).size,
      completeRows: new Set(tileRects
        .filter(({ rect }) => rect.top >= -1 && rect.bottom <= innerHeight + 1)
        .map(({ y }) => y)).size,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

function expectRoundTwoRelicAuthority(report, testCase, expectedState, label) {
  const relic = report.state.armedLineRelic;
  expect(relic, `${label} persisted relic`).toMatchObject({
    direction: "horizontal",
    flowerId: 4
  });
  expect(report.state.currentRound, `${label} remains Round 2`).toBe(2);
  expect(report.state.moves, `${label} exact move state`).toBe(expectedState.moves);
  expect(report.state.counts, `${label} exact flower state`).toEqual(expectedState.counts);
  expect(report.state.clearedCursedThorns, `${label} Thorn progress stays zero`).toBe(0);
  expect(report.tutorialCopy, `${label} directional row action`).toBe("Swap right to burn this row.");
  expect(report.tutorialIcon, `${label} visible category`).toBe("BLACK CANDLE");
  expect(report.namedTutorial, `${label} named tutorial styling`).toBe(true);
  expect(report.instructionCount, `${label} one narrator`).toBe(1);
  expect(report.hints, `${label} exact activation pair`).toHaveLength(2);
  expect(report.hints.filter((tile) => tile.relic), `${label} relic is hinted`).toHaveLength(1);
  expect(report.hints.filter((tile) => tile.destination), `${label} destination is hinted`).toHaveLength(1);
  expect(report.laneTiles, `${label} complete row preview`).toBe(8);
  expect(report.destinations, `${label} one destination`).toBe(1);
  expect(report.relicTiles, `${label} one rendered relic`).toBe(1);
  expect(report.thornCauses, `${label} Thorn cause teaching yields`).toBe(0);
  expect(report.thornTargets, `${label} Thorn target teaching yields`).toBe(0);
  expect(report.focusedTile, `${label} DOM focus follows relic`).toBe(`${relic.x},${relic.y}`);
  expect(report.rovingTiles, `${label} one roving tile`).toBe(1);
  expect(report.tiles, `${label} tile integrity`).toBe(64);
  expect(report.rows, `${label} eight rows`).toBe(8);
  expect(report.completeRows, `${label} complete first viewport board`).toBe(8);
  expect(report.overflowX, `${label} no overflow`).toBe(false);
  expect(report.brokenImages, `${label} no broken images`).toEqual([]);
  if (testCase.mobile) {
    expect(report.completeRows, `${label} exact mobile rows`).toBe(8);
  }
}

for (const testCase of CASES) {
  test(`Black Candle outranks the active Round 2 Thorn lesson on ${testCase.label}`, async ({ browser }) => {
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
      await seedDeterministicMath(page, `round-two-relic-authority-${testCase.label}`);
      await page.goto(`${BASE_URL}?round-two-relic-authority=${testCase.label}`, { waitUntil: "networkidle" });
      await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      await completeNaturalRoundOne(page, testCase.input);
      await activateControl(page, "#restoreGreenhouseBtn", testCase.input);
      await expect(page.locator("#nextOrderBtn")).toBeVisible({ timeout: 7000 });
      await activateControl(page, "#nextOrderBtn", testCase.input);
      await expect(page.locator("#tutorialCopy")).toHaveText("Match beside the Thorn.");

      const beforeFormation = await page.evaluate((key) => (
        JSON.parse(localStorage.getItem(key) || "{}")
      ), SAVE_KEY);
      const formationPair = [{ x: 5, y: 0 }, { x: 5, y: 1 }];
      await activatePair(page, formationPair, testCase.input);
      await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(1, { timeout: 7000 });
      await page.waitForFunction(({ key, moves }) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === moves - 1
          && Boolean(state.armedLineRelic)
          && document.querySelectorAll(".tile").length === 64
          && Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled);
      }, { key: SAVE_KEY, moves: beforeFormation.moves }, { timeout: 12000 });
      let report = await roundTwoRelicReport(page);
      expect(report.state.moves, `${testCase.label} formation spends once`).toBe(8);
      expect(report.state.counts[4] - beforeFormation.counts[4], `${testCase.label} strict four credits Amber`).toBe(4);
      expectRoundTwoRelicAuthority(report, testCase, report.state, `${testCase.label} formed`);
      const armedState = JSON.stringify(report.state);
      await page.screenshot({
        path: `work/round-two-black-candle-authority-${testCase.label}.png`
      });

      for (let reload = 1; reload <= 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(1, { timeout: 7000 });
        report = await roundTwoRelicReport(page);
        expect(JSON.stringify(report.state), `${testCase.label} reload ${reload} exact state`).toBe(armedState);
        expectRoundTwoRelicAuthority(
          report,
          testCase,
          JSON.parse(armedState),
          `${testCase.label} reload ${reload}`
        );
      }

      const beforeActivation = report.state;
      const activationPair = report.hints.map(({ x, y }) => ({ x, y }));
      await startThornFeedbackRecorder(page);
      await activatePair(page, activationPair, testCase.input);
      await page.waitForFunction(({ key, moves }) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === moves - 1
          && !state.armedLineRelic
          && document.querySelectorAll(".tile").length === 64
          && Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled);
      }, { key: SAVE_KEY, moves: beforeActivation.moves }, { timeout: 12000 });
      const thornEvents = await stopThornFeedbackRecorder(page);
      report = await roundTwoRelicReport(page);
      expect(report.state.moves, `${testCase.label} activation spends once`).toBe(7);
      expect(report.state.clearedCursedThorns, `${testCase.label} row burn seals Thorns`).toBe(3);
      expect(report.relicTiles, `${testCase.label} relic retires`).toBe(0);
      expect(report.namedTutorial, `${testCase.label} Black Candle narrator retires`).toBe(false);
      expect(report.tutorialCopy, `${testCase.label} ordinary Round 2 guidance resumes`).toBe("Finish the Moonlit Wreath.");
      expect(thornEvents.some((event) => event === "CRACK" || event === "BREAK"), `${testCase.label} Thorn feedback`).toBe(true);
      expect(report.tiles, `${testCase.label} post-activation tiles`).toBe(64);
      expect(report.rows, `${testCase.label} post-activation rows`).toBe(8);

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle" }),
        page.evaluate((key) => {
          const state = JSON.parse(localStorage.getItem(key));
          state.currentRound = 2;
          state.moves = 8;
          state.counts = [0, 0, 0, 0, 4, 0];
          state.coins = 20;
          state.roundComplete = false;
          state.roundOneRestored = true;
          state.roundTwoGreenhouseUpgraded = false;
          state.tutorialSkipped = false;
          state.tutorialActive = true;
          state.hasMadeValidMove = true;
          state.restoredRoundTwoGuideMoves = 1;
          state.clearedCursedThorns = 0;
          state.cursedThorns = [
            { x: 0, y: 1, hp: 1 },
            { x: 1, y: 1, hp: 9 },
            { x: 2, y: 1, hp: 9 }
          ];
          state.board = Array.from({ length: 8 }, (_, y) => (
            Array.from({ length: 8 }, (_, x) => (x + 2 * y) % 6)
          ));
          state.board[0][3] = 4;
          state.armedLineRelic = { x: 3, y: 0, direction: "horizontal", flowerId: 4 };
          localStorage.setItem(key, JSON.stringify(state));
          window.location.reload();
        }, SAVE_KEY)
      ]);
      report = await roundTwoRelicReport(page);
      const partialActivationPair = report.hints.map(({ x, y }) => ({ x, y }));
      await activatePair(page, partialActivationPair, testCase.input);
      await page.waitForFunction((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return !state.armedLineRelic
          && state.moves === 7
          && state.clearedCursedThorns === 1
          && state.cursedThorns.length === 2
          && document.querySelectorAll(".tile").length === 64
          && Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled);
      }, SAVE_KEY, { timeout: 12000 });
      report = await handoffReport(page);
      expect(report.state.clearedCursedThorns, `${testCase.label} one Thorn clears`).toBe(1);
      expect(report.state.cursedThorns, `${testCase.label} two damaged blockers remain`).toHaveLength(2);
      expect(report.tutorialCopy, `${testCase.label} Thorn narrator resumes after relic`).toBe("Match beside the Thorn.");
      expect(report.guideTiles, `${testCase.label} recomputed pair`).toBe(2);
      expect(report.thornSwapTiles, `${testCase.label} recomputed causes`).toBe(2);
      expect(report.thornTargets, `${testCase.label} remaining blocker targets`).toBe(2);
      expect(report.guideOverlays, `${testCase.label} one recomputed overlay`).toBe(1);
      expect(report.focusedTile, `${testCase.label} recovered source receives focus`).toBe(true);
      expect(report.tiles, `${testCase.label} partial path tile integrity`).toBe(64);
      expect(report.rows, `${testCase.label} partial path rows`).toBe(8);
      expect(report.overflowX, `${testCase.label} partial path no overflow`).toBe(false);
      expect(report.brokenImages, `${testCase.label} partial path images`).toEqual([]);
      const partialGuideCells = report.guideCells;
      const partialState = JSON.stringify(report.state);
      let partialGuide = await usefulGuideReport(page);
      expect(partialGuide.legal, `${testCase.label} partial guide is legal`).toBe(true);
      expect(partialGuide.useful, `${testCase.label} partial guide damages a Thorn`).toBe(true);

      for (let reload = 1; reload <= 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator(".tile.thorn-teach")).toHaveCount(2, { timeout: 7000 });
        report = await handoffReport(page);
        expect(JSON.stringify(report.state), `${testCase.label} partial reload ${reload} exact state`).toBe(partialState);
        expect(report.state.clearedCursedThorns, `${testCase.label} partial reload ${reload} progress`).toBe(1);
        expect(report.state.cursedThorns, `${testCase.label} partial reload ${reload} blockers`).toHaveLength(2);
        expect(report.tutorialCopy, `${testCase.label} partial reload ${reload} narrator`).toBe("Match beside the Thorn.");
        expect(report.guideCells, `${testCase.label} partial reload ${reload} pair`).toEqual(partialGuideCells);
        expect(report.thornSwapTiles, `${testCase.label} partial reload ${reload} causes`).toBe(2);
        expect(report.thornTargets, `${testCase.label} partial reload ${reload} targets`).toBe(2);
        expect(report.guideOverlays, `${testCase.label} partial reload ${reload} overlay`).toBe(1);
        expect(report.focusedTile, `${testCase.label} partial reload ${reload} focus`).toBe(true);
        expect(report.focusableTiles, `${testCase.label} partial reload ${reload} roving tile`).toBe(1);
        expect(report.tiles, `${testCase.label} partial reload ${reload} tiles`).toBe(64);
        expect(report.rows, `${testCase.label} partial reload ${reload} rows`).toBe(8);
        expect(report.overflowX, `${testCase.label} partial reload ${reload} no overflow`).toBe(false);
        expect(report.brokenImages, `${testCase.label} partial reload ${reload} images`).toEqual([]);
        partialGuide = await usefulGuideReport(page);
        expect(partialGuide.legal, `${testCase.label} partial reload ${reload} legal guide`).toBe(true);
        expect(partialGuide.useful, `${testCase.label} partial reload ${reload} useful guide`).toBe(true);
      }
      await page.screenshot({
        path: `work/round-two-partial-thorn-reload-${testCase.label}.png`,
        fullPage: true
      });

      const beforeRecoveredMove = report.state;
      const beforeRemainingKeys = new Set(
        beforeRecoveredMove.cursedThorns.map((thorn) => `${thorn.x},${thorn.y}`)
      );
      const beforeRemainingHp = beforeRecoveredMove.cursedThorns
        .reduce((sum, thorn) => sum + thorn.hp, 0);
      await startThornFeedbackRecorder(page);
      await activatePair(page, partialGuide.pair, testCase.input);
      await page.waitForFunction(({ key, moves }) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === moves - 1
          && !state.armedLineRelic
          && document.querySelectorAll(".tile").length === 64
          && Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled);
      }, { key: SAVE_KEY, moves: beforeRecoveredMove.moves }, { timeout: 12000 });
      const recoveredThornEvents = await stopThornFeedbackRecorder(page);
      report = await handoffReport(page);
      const afterRemainingHp = report.state.cursedThorns
        .reduce((sum, thorn) => sum + thorn.hp, 0);
      expect(report.state.moves, `${testCase.label} recovered pair spends once`).toBe(6);
      expect(afterRemainingHp, `${testCase.label} recovered pair damages remaining blockers`).toBeLessThan(beforeRemainingHp);
      expect(
        report.state.cursedThorns.every((thorn) => beforeRemainingKeys.has(`${thorn.x},${thorn.y}`)),
        `${testCase.label} recovered pair never resurrects stale blocker coordinates`
      ).toBe(true);
      expect(
        recoveredThornEvents.some((event) => event === "CRACK" || event === "BREAK"),
        `${testCase.label} recovered pair emits Thorn feedback`
      ).toBe(true);
      expect(report.tiles, `${testCase.label} recovered pair tiles`).toBe(64);
      expect(report.rows, `${testCase.label} recovered pair rows`).toBe(8);
      expect(report.disabledTiles, `${testCase.label} recovered pair returns control`).toBe(0);
      expect(report.overflowX, `${testCase.label} recovered pair no overflow`).toBe(false);
      expect(report.brokenImages, `${testCase.label} recovered pair images`).toEqual([]);
      expect(consoleErrors, `${testCase.label} console errors`).toEqual([]);
      expect(pageErrors, `${testCase.label} page errors`).toEqual([]);
      expect(failedRequests, `${testCase.label} request failures`).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
