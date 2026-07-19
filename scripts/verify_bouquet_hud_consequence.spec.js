const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const HUD_CASES = [
  {
    label: "r1-active",
    expected: "Next: Restore Glass",
    state: { currentRound: 1, moves: 6, counts: [0, 0, 0, 0, 0, 0], coins: 0 }
  },
  {
    label: "r1-failed",
    expected: "Retry Bouquet",
    retry: true,
    state: { currentRound: 1, moves: 0, counts: [0, 0, 0, 0, 0, 0], coins: 0 }
  },
  {
    label: "r1-pending",
    expected: "Ready: Restore Glass",
    action: { id: "restoreGreenhouseBtn", text: "Restore Greenhouse · 100 coins" },
    state: {
      currentRound: 1,
      moves: 1,
      counts: [0, 6, 0, 0, 0, 8],
      coins: 120,
      roundComplete: true
    }
  },
  {
    label: "r1-restored",
    expected: "Next: Moonlit Wreath",
    action: { id: "nextOrderBtn", text: "Next Order → Moonlit Wreath" },
    state: {
      currentRound: 1,
      moves: 1,
      counts: [0, 6, 0, 0, 0, 8],
      coins: 20,
      roundComplete: true,
      roundOneRestored: true
    }
  },
  {
    label: "r2-active",
    expected: "Next: Bloodroot Compact",
    state: {
      currentRound: 2,
      moves: 9,
      counts: [0, 0, 0, 0, 0, 0],
      coins: 20,
      roundOneRestored: true
    }
  },
  {
    label: "r2-failed",
    expected: "Retry Bouquet",
    retry: true,
    state: {
      currentRound: 2,
      moves: 0,
      counts: [0, 0, 0, 0, 0, 0],
      coins: 20,
      roundOneRestored: true
    }
  },
  {
    label: "r2-pending",
    expected: "Ready: Upgrade Glass",
    action: { id: "restoreGreenhouseBtn", text: "Upgrade Greenhouse · 120 coins" },
    state: {
      currentRound: 2,
      moves: 1,
      counts: [0, 0, 10, 0, 9, 7],
      coins: 170,
      clearedCursedThorns: 3,
      roundComplete: true,
      roundOneRestored: true
    }
  },
  {
    label: "r2-upgraded",
    expected: "Next: Bloodroot Compact",
    action: { id: "nextOrderBtn", text: "Next Order → Bloodroot Compact" },
    state: {
      currentRound: 2,
      moves: 1,
      counts: [0, 0, 10, 0, 9, 7],
      coins: 50,
      clearedCursedThorns: 3,
      roundComplete: true,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true
    }
  },
  {
    label: "r3-active",
    expected: "Next: Raise Conservatory",
    state: {
      currentRound: 3,
      moves: 8,
      counts: [0, 0, 0, 0, 0, 0],
      coins: 50,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true
    }
  },
  {
    label: "r3-failed",
    expected: "Retry Bouquet",
    retry: true,
    state: {
      currentRound: 3,
      moves: 0,
      counts: [0, 0, 0, 0, 0, 0],
      coins: 50,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true
    }
  },
  {
    label: "r3-pending",
    expected: "Ready: Raise Conservatory",
    action: { id: "restoreGreenhouseBtn", text: "Raise Conservatory · 180 coins" },
    state: {
      currentRound: 3,
      moves: 1,
      counts: [13, 0, 0, 14, 0, 0],
      coins: 230,
      roundComplete: true,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true
    }
  },
  {
    label: "r3-raised",
    expected: "Next: First Bouquet",
    action: { id: "nextOrderBtn", text: "Play Again → First Bouquet" },
    state: {
      currentRound: 3,
      moves: 1,
      counts: [13, 0, 0, 14, 0, 0],
      coins: 50,
      roundComplete: true,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: true
    }
  }
];

const VIEWPORTS = [
  { label: "desktop", width: 1280, height: 720 },
  { label: "mobile390", width: 390, height: 844 }
];

const FAILURE_VIEWPORTS = [
  ...VIEWPORTS,
  { label: "mobile390-reduced", width: 390, height: 844, reducedMotion: "reduce" }
];

const LOW_MOVE_BOARD = Array.from(
  { length: 8 },
  (_, y) => Array.from({ length: 8 }, (_, x) => (x + (2 * y)) % 6)
);
LOW_MOVE_BOARD[0][3] = 3;
LOW_MOVE_BOARD[1][3] = 3;
LOW_MOVE_BOARD[2][3] = 4;
LOW_MOVE_BOARD[2][4] = 3;
LOW_MOVE_BOARD[3][3] = 2;

const ACTIVE_VIEWPORT_CASES = [
  {
    ...HUD_CASES.find((fixture) => fixture.label === "r2-active"),
    tutorialCopy: "Match beside the Thorn."
  },
  {
    ...HUD_CASES.find((fixture) => fixture.label === "r3-active"),
    tutorialCopy: "Complete Bloodroot Compact."
  }
];

test.setTimeout(180000);

function savedState(fixture) {
  return {
    focusedEconomyVersion: 2,
    currentRound: 1,
    moves: 6,
    counts: [0, 0, 0, 0, 0, 0],
    coins: 0,
    cursedThorns: [],
    clearedCursedThorns: 0,
    roundComplete: false,
    roundOneRestored: false,
    roundTwoGreenhouseUpgraded: false,
    roundThreeConservatoryRaised: false,
    hasMadeValidMove: true,
    tutorialSkipped: true,
    tutorialActive: false,
    ...fixture.state
  };
}

function lowMoveState(moves, counts = [0, 0, 0, 0, 0, 0]) {
  return savedState({
    state: {
      currentRound: 3,
      moves,
      counts,
      coins: 50,
      board: LOW_MOVE_BOARD.map((row) => [...row]),
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true
    }
  });
}

async function commitLowMoveSwap(page, expectPressurePulse = true) {
  await page.locator('.tile[data-x="3"][data-y="2"]').click();
  await page.locator('.tile[data-x="4"][data-y="2"]').click();
  if (expectPressurePulse) {
    await expect(page.locator(".moves-counter")).toHaveClass(/move-decrement-pulse/, {
      timeout: 10000
    });
    await expect(page.locator(".tile:not(:disabled)")).toHaveCount(64, { timeout: 10000 });
  }
}

async function movePressureReport(page) {
  return page.evaluate(() => {
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
    const counter = document.querySelector(".moves-counter");
    const objective = document.querySelector("#objective");
    const board = document.querySelector("#board");
    const counterStyle = getComputedStyle(counter);
    const objectiveRect = objective.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const active = document.activeElement;
    return {
      text: counter.textContent.trim(),
      className: counter.className,
      role: counter.getAttribute("role"),
      ariaLive: counter.getAttribute("aria-live"),
      ariaLabel: counter.getAttribute("aria-label"),
      animationName: counterStyle.animationName,
      transform: counterStyle.transform,
      color: counterStyle.color,
      backgroundImage: counterStyle.backgroundImage,
      fontWeight: counterStyle.fontWeight,
      objectiveHeight: objectiveRect.height,
      boardTop: boardRect.top,
      boardBottom: boardRect.bottom,
      boardWidth: boardRect.width,
      boardHeight: boardRect.height,
      objectiveLow: objective.classList.contains("low-moves"),
      retryVisible: visible(document.querySelector("#renewBtn.visible")),
      retryFocused: active?.id === "renewBtn",
      payoffActionVisible: [
        document.querySelector("#restoreGreenhouseBtn"),
        document.querySelector("#nextOrderBtn")
      ].some(visible),
      tiles: document.querySelectorAll(".tile").length,
      rows: new Set(Array.from(document.querySelectorAll(".tile"), (tile) => tile.dataset.y)).size,
      tabStops: document.querySelectorAll(".tile[tabindex='0']").length,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => {
          const rect = image.getBoundingClientRect();
          const style = getComputedStyle(image);
          return style.display !== "none"
            && rect.width > 0
            && rect.height > 0
            && image.complete
            && image.naturalWidth === 0;
        })
        .map((image) => image.getAttribute("src"))
    };
  });
}

async function findLegalMatchPair(page, excludedCells = []) {
  return page.evaluate((excludedCells) => {
    const size = 8;
    const excluded = new Set(excludedCells.map((cell) => `${cell.x},${cell.y}`));
    const grid = Array.from({ length: size }, () => Array(size).fill(-1));
    document.querySelectorAll(".tile").forEach((tile) => {
      grid[Number(tile.dataset.y)][Number(tile.dataset.x)] = Number(tile.dataset.flowerId);
    });
    const runLength = (x, y, dx, dy) => {
      const flowerId = grid[y][x];
      let count = 1;
      for (const sign of [-1, 1]) {
        let nx = x + dx * sign;
        let ny = y + dy * sign;
        while (
          nx >= 0 && nx < size && ny >= 0 && ny < size
          && grid[ny][nx] === flowerId
        ) {
          count += 1;
          nx += dx * sign;
          ny += dy * sign;
        }
      }
      return count;
    };
    const createsMatch = (cell) => (
      runLength(cell.x, cell.y, 1, 0) >= 3
      || runLength(cell.x, cell.y, 0, 1) >= 3
    );
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (
            nx >= size
            || ny >= size
            || excluded.has(`${x},${y}`)
            || excluded.has(`${nx},${ny}`)
            || grid[y][x] === grid[ny][nx]
          ) {
            continue;
          }
          [grid[y][x], grid[ny][nx]] = [grid[ny][nx], grid[y][x]];
          const legal = createsMatch({ x, y }) || createsMatch({ x: nx, y: ny });
          [grid[y][x], grid[ny][nx]] = [grid[ny][nx], grid[y][x]];
          if (legal) {
            return [{ x, y }, { x: nx, y: ny }];
          }
        }
      }
    }
    return [];
  }, excludedCells);
}

async function hudReport(page) {
  return page.evaluate(() => {
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
    const label = document.querySelector("#bouquetProgressNext");
    const labelStyle = getComputedStyle(label);
    const board = document.querySelector("#board");
    const boardRect = board?.getBoundingClientRect();
    const activeAction = document.activeElement;
    return {
      text: label.textContent.trim(),
      visible: visible(label),
      clientWidth: label.clientWidth,
      scrollWidth: label.scrollWidth,
      clientHeight: label.clientHeight,
      scrollHeight: label.scrollHeight,
      textOverflow: labelStyle.textOverflow,
      whiteSpace: labelStyle.whiteSpace,
      activeActionId: activeAction?.id || "",
      activeActionText: activeAction?.textContent.trim() || "",
      visiblePayoffActions: [
        document.querySelector("#restoreGreenhouseBtn"),
        document.querySelector("#nextOrderBtn")
      ].filter(visible).map((button) => button.textContent.trim()),
      retryVisible: visible(document.querySelector("#renewBtn.visible")),
      tiles: document.querySelectorAll(".tile").length,
      rows: new Set(Array.from(document.querySelectorAll(".tile"), (tile) => tile.dataset.y)).size,
      boardVisible: visible(board),
      boardBottom: boardRect?.bottom || 0,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  });
}

async function assertHudState(page, fixture, viewport, reload) {
  await expect(page.locator(".tile")).toHaveCount(64);
  if (fixture.action) {
    const action = page.locator(`#${fixture.action.id}`);
    await expect(action).toBeVisible({ timeout: 10000 });
    await expect(action).toHaveText(fixture.action.text);
    await expect(action).toBeFocused();
  } else if (fixture.retry) {
    const retry = page.locator("#renewBtn.visible");
    await expect(retry).toHaveText("Retry Bouquet");
    await expect(retry).toBeFocused();
  } else {
    await expect(page.locator("#board")).toBeVisible();
  }

  const report = await hudReport(page);
  const label = `${viewport.label} ${fixture.label} reload ${reload}`;
  expect(report.text, `${label} exact consequence`).toBe(fixture.expected);
  expect(report.tiles, `${label} tile integrity`).toBe(64);
  expect(report.rows, `${label} board rows`).toBe(8);
  expect(report.overflowX, `${label} no page overflow`).toBe(false);
  expect(report.brokenImages, `${label} no broken images`).toEqual([]);

  if (viewport.label === "desktop") {
    expect(report.visible, `${label} consequence visible`).toBe(true);
    expect(report.scrollWidth, `${label} horizontal fit`).toBeLessThanOrEqual(report.clientWidth + 1);
    expect(report.scrollHeight, `${label} vertical fit`).toBeLessThanOrEqual(report.clientHeight + 1);
    expect(report.textOverflow, `${label} no ellipsis`).toBe("clip");
    expect(report.whiteSpace, `${label} bounded wrapping`).toBe("normal");
  } else {
    expect(report.visible, `${label} desktop-only label stays hidden`).toBe(false);
    if (!fixture.action) {
      expect(report.boardVisible, `${label} active board visible`).toBe(true);
      expect(report.boardBottom, `${label} board remains in first viewport`).toBeLessThanOrEqual(844);
    }
  }

  if (fixture.action) {
    expect(report.visiblePayoffActions, `${label} one payoff action`).toEqual([fixture.action.text]);
    expect(report.activeActionId, `${label} focused action id`).toBe(fixture.action.id);
    expect(report.activeActionText, `${label} focused action text`).toBe(fixture.action.text);
  } else {
    expect(report.visiblePayoffActions, `${label} no payoff action`).toEqual([]);
  }
  expect(report.retryVisible, `${label} retry visibility`).toBe(Boolean(fixture.retry));
}

async function activeViewportReport(page) {
  return page.evaluate(() => {
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
    const board = document.querySelector("#board");
    const boardRect = board?.getBoundingClientRect();
    const help = document.querySelector("#tutorialHelpBtn");
    const helpRect = help?.getBoundingClientRect();
    const tileRows = new Set(Array.from(document.querySelectorAll(".tile"), (tile) => tile.dataset.y));
    const completeRows = new Set(Array.from(document.querySelectorAll(".tile"))
      .filter((tile) => {
        const rect = tile.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= innerHeight;
      })
      .map((tile) => tile.dataset.y));
    return {
      boardTop: boardRect?.top || 0,
      boardBottom: boardRect?.bottom || 0,
      boardWidth: boardRect?.width || 0,
      boardHeight: boardRect?.height || 0,
      tiles: document.querySelectorAll(".tile").length,
      rows: tileRows.size,
      completeRows: completeRows.size,
      helpVisible: visible(help),
      helpTop: helpRect?.top || 0,
      helpBottom: helpRect?.bottom || 0,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  });
}

function assertActiveViewport(report, viewport, label) {
  expect(report.tiles, `${label} tile integrity`).toBe(64);
  expect(report.rows, `${label} board rows`).toBe(8);
  expect(report.completeRows, `${label} complete rows`).toBe(8);
  expect(report.boardTop, `${label} board starts inside viewport`).toBeGreaterThanOrEqual(0);
  expect(report.boardBottom, `${label} altar frame stays inside viewport`).toBeLessThanOrEqual(viewport.height - 4);
  expect(report.overflowX, `${label} no horizontal overflow`).toBe(false);
  expect(report.brokenImages, `${label} no broken images`).toEqual([]);
  if (viewport.label === "desktop") {
    expect(report.boardWidth, `${label} full desktop altar width`).toBeCloseTo(480, 0);
    expect(report.boardHeight, `${label} full desktop altar height`).toBeCloseTo(480, 0);
  }
}

async function roundTwoHandoffReport(page) {
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
    const rect = (node) => {
      const bounds = node?.getBoundingClientRect();
      return bounds
        ? {
            left: bounds.left,
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
            width: bounds.width,
            height: bounds.height
          }
        : null;
    };
    const overlaps = (a, b) => Boolean(
      a
      && b
      && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
      && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
    );
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const board = document.querySelector("#board");
    const boardRect = rect(board);
    const objectiveRect = rect(document.querySelector("#objective"));
    const nextCue = document.querySelector("#nextOrderCue");
    const tutorialPanel = document.querySelector("#tutorialPanel");
    const firstCue = document.querySelector("#firstSwapCue");
    const instructionSurfaces = [nextCue, tutorialPanel, firstCue]
      .filter(visible)
      .map((node) => ({
        id: node.id,
        text: node.textContent.replace(/\s+/g, " ").trim()
      }));
    const completeRows = new Set(Array.from(document.querySelectorAll(".tile"))
      .filter((tile) => {
        const bounds = tile.getBoundingClientRect();
        return bounds.top >= 0 && bounds.bottom <= innerHeight;
      })
      .map((tile) => tile.dataset.y));
    const thornGoal = document.querySelector('[data-thorn-objective="true"]');
    return {
      handoffActive: document.body.classList.contains("restored-greenhouse-handoff"),
      instructionSurfaces,
      nextCueNodes: document.querySelectorAll("#nextOrderCue, .next-order-cue").length,
      nextCueText: nextCue?.textContent.trim() || "",
      tutorialText: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      guideTiles: document.querySelectorAll(".tile.idle-hint").length,
      thornTeachTiles: document.querySelectorAll(".tile.thorn-teach").length,
      thornTargetTiles: document.querySelectorAll(".tile.thorn-teach-blocker").length,
      guideOverlays: document.querySelectorAll(".swap-path-arrow, .first-action-swap-guide").length,
      cueOverlapsBoard: overlaps(rect(nextCue), boardRect),
      objectiveOverlapsBoard: overlaps(objectiveRect, boardRect),
      boardTop: boardRect?.top || 0,
      boardBottom: boardRect?.bottom || 0,
      boardWidth: boardRect?.width || 0,
      boardHeight: boardRect?.height || 0,
      tiles: document.querySelectorAll(".tile").length,
      rows: new Set(Array.from(document.querySelectorAll(".tile"), (tile) => tile.dataset.y)).size,
      completeRows: completeRows.size,
      currentRound: state.currentRound,
      moves: state.moves,
      counts: state.counts || [],
      coins: state.coins,
      clearedCursedThorns: state.clearedCursedThorns || 0,
      cursedThorns: Array.isArray(state.cursedThorns) ? state.cursedThorns.length : 0,
      enabledTiles: document.querySelectorAll(".tile:not(:disabled)").length,
      invalidTiles: document.querySelectorAll(".tile.invalid-swap").length,
      idleHints: Array.from(document.querySelectorAll(".tile.idle-hint"), (tile) => ({
        x: Number(tile.dataset.x),
        y: Number(tile.dataset.y)
      })),
      tabStops: document.querySelectorAll(".tile[tabindex='0']").length,
      focusedTile: document.activeElement?.classList.contains("tile") || false,
      thornComplete: thornGoal?.classList.contains("complete") || false,
      thornSeal: thornGoal?.querySelector(".objective-target-seal")?.textContent.trim() || "",
      thornAriaLabel: thornGoal?.getAttribute("aria-label") || "",
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function installInPageHandoffTimeline(page, sampleTimes = [150, 1700, 3500]) {
  await page.evaluate(({ key, sampleTimes: times }) => {
    const timeline = {
      samples: [],
      startedAt: null
    };
    window.__bloomHandoffTimeline = timeline;

    const visible = (node) => {
      if (!node) return false;
      const bounds = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && bounds.width > 0
        && bounds.height > 0;
    };
    const rect = (node) => {
      const bounds = node?.getBoundingClientRect();
      return bounds
        ? {
            left: bounds.left,
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
            width: bounds.width,
            height: bounds.height
          }
        : null;
    };
    const overlaps = (a, b) => Boolean(
      a
      && b
      && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
      && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
    );
    const capture = (sampleAt) => {
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      const board = document.querySelector("#board");
      const boardRect = rect(board);
      const nextCue = document.querySelector("#nextOrderCue");
      const tutorialPanel = document.querySelector("#tutorialPanel");
      const firstCue = document.querySelector("#firstSwapCue");
      const instructionSurfaces = [nextCue, tutorialPanel, firstCue]
        .filter(visible)
        .map((node) => ({
          id: node.id,
          text: node.textContent.replace(/\s+/g, " ").trim()
        }));
      const tiles = Array.from(document.querySelectorAll(".tile"));
      const completeRows = new Set(tiles
        .filter((tile) => {
          const bounds = tile.getBoundingClientRect();
          return bounds.top >= 0 && bounds.bottom <= innerHeight;
        })
        .map((tile) => tile.dataset.y));
      timeline.samples.push({
        sampleAt,
        elapsed: performance.now() - timeline.startedAt,
        handoffActive: document.body.classList.contains("restored-greenhouse-handoff"),
        instructionSurfaces,
        cueOpacity: Number(getComputedStyle(nextCue).opacity || 0),
        cueOverlapsBoard: overlaps(rect(nextCue), boardRect),
        objectiveOverlapsBoard: overlaps(rect(document.querySelector("#objective")), boardRect),
        boardTop: boardRect?.top || 0,
        boardBottom: boardRect?.bottom || 0,
        boardWidth: boardRect?.width || 0,
        boardHeight: boardRect?.height || 0,
        tiles: tiles.length,
        rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
        completeRows: completeRows.size,
        currentRound: state.currentRound,
        moves: state.moves,
        coins: state.coins,
        overflowX: document.documentElement.scrollWidth > innerWidth + 1,
        brokenImages: Array.from(document.images)
          .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
          .map((image) => image.getAttribute("src"))
      });
    };
    const start = () => {
      if (timeline.startedAt !== null) return;
      timeline.startedAt = performance.now();
      observer.disconnect();
      times.forEach((sampleAt) => {
        window.setTimeout(() => capture(sampleAt), sampleAt);
      });
    };
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains("restored-greenhouse-handoff")) {
        start();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    if (document.body.classList.contains("restored-greenhouse-handoff")) {
      start();
    }
  }, { key: SAVE_KEY, sampleTimes });
}

async function readInPageHandoffTimeline(page, expectedSamples = 3) {
  await expect.poll(
    () => page.evaluate(() => window.__bloomHandoffTimeline?.samples.length || 0),
    { timeout: 10000 }
  ).toBe(expectedSamples);
  return page.evaluate(() => window.__bloomHandoffTimeline.samples);
}

function restoredRoundOneHandoffState() {
  const restored = HUD_CASES.find((fixture) => fixture.label === "r1-restored");
  return {
    ...savedState(restored),
    tutorialSkipped: false,
    tutorialActive: true,
    blackCandleLessonComplete: true
  };
}

function upgradedRoundTwoHandoffState() {
  const upgraded = HUD_CASES.find((fixture) => fixture.label === "r2-upgraded");
  return {
    ...savedState(upgraded),
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
}

function assertRoundTwoHandoffGeometry(report, viewport, label) {
  expect(report.tiles, `${label} tile integrity`).toBe(64);
  expect(report.rows, `${label} authoritative rows`).toBe(8);
  expect(report.completeRows, `${label} complete viewport rows`).toBe(8);
  expect(report.boardTop, `${label} board starts inside viewport`).toBeGreaterThanOrEqual(0);
  expect(report.boardBottom, `${label} altar frame stays in viewport`).toBeLessThanOrEqual(
    viewport.height - 4
  );
  expect(report.cueOverlapsBoard, `${label} cue stays clear of altar`).toBe(false);
  expect(report.objectiveOverlapsBoard, `${label} objective stays clear of altar`).toBe(false);
  expect(report.overflowX, `${label} horizontal overflow`).toBe(false);
  expect(report.brokenImages, `${label} broken images`).toEqual([]);
  if (viewport.label === "desktop") {
    expect(report.boardWidth, `${label} full desktop altar width`).toBeCloseTo(480, 0);
    expect(report.boardHeight, `${label} full desktop altar height`).toBeCloseTo(480, 0);
    expect(report.boardBottom, `${label} desktop lower margin`).toBeLessThanOrEqual(716);
  } else {
    expect(report.boardWidth, `${label} exact mobile altar width`).toBeCloseTo(378, 0);
    expect(report.boardHeight, `${label} exact mobile altar height`).toBeCloseTo(378, 0);
  }
}

for (const viewport of VIEWPORTS) {
  test(`focused bouquet HUD consequences fit every state on ${viewport.label}`, async ({ browser }) => {
    for (const fixture of HUD_CASES) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();
      const runtimeErrors = [];
      const requestFailures = [];
      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(message.text());
      });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));
      page.on("requestfailed", (request) => {
        const errorText = request.failure()?.errorText || "failed";
        const replacedGreenhouseImage = errorText === "net::ERR_ABORTED"
          && request.url().includes("/assets/greenhouse/")
          && request.url().endsWith(".jpg");
        if (!replacedGreenhouseImage) {
          requestFailures.push(`${request.url()} :: ${errorText}`);
        }
      });
      await page.addInitScript(({ key, state, marker }) => {
        if (!sessionStorage.getItem(marker)) {
          localStorage.setItem(key, JSON.stringify(state));
          sessionStorage.setItem(marker, "1");
        }
      }, {
        key: SAVE_KEY,
        state: savedState(fixture),
        marker: `bouquet-hud-${viewport.label}-${fixture.label}`
      });
      await page.goto(
        `${BASE_URL}?bouquet-hud=${viewport.label}-${fixture.label}`,
        { waitUntil: "networkidle" }
      );

      const reloadCount = fixture.action ? 2 : 1;
      for (let reload = 0; reload <= reloadCount; reload += 1) {
        await assertHudState(page, fixture, viewport, reload);
        if (
          reload === 0
          && ["r1-active", "r1-pending", "r2-pending", "r3-pending"].includes(fixture.label)
        ) {
          await page.screenshot({
            path: `work/hud-consequence-${viewport.label}-${fixture.label}.png`,
            fullPage: true
          });
        }
        if (reload < reloadCount) {
          await page.reload({ waitUntil: "networkidle" });
        }
      }

      expect(runtimeErrors, `${viewport.label} ${fixture.label} runtime errors`).toEqual([]);
      expect(requestFailures, `${viewport.label} ${fixture.label} request failures`).toEqual([]);
      await context.close();
    }
  });
}

for (const viewport of VIEWPORTS) {
  test(`settled low-move transitions stay direct, static on reload, and geometry-safe on ${viewport.label}`, async ({ browser }) => {
    for (const fromMoves of [4, 3, 2]) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();
      const runtimeErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(message.text());
      });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));
      await page.addInitScript(({ key, state, marker }) => {
        if (!sessionStorage.getItem(marker)) {
          localStorage.setItem(key, JSON.stringify(state));
          sessionStorage.setItem(marker, "1");
        }
      }, {
        key: SAVE_KEY,
        state: lowMoveState(fromMoves),
        marker: `move-pressure-${viewport.label}-${fromMoves}`
      });
      await page.goto(
        `${BASE_URL}?move-pressure=${viewport.label}-${fromMoves}`,
        { waitUntil: "networkidle" }
      );

      const before = await movePressureReport(page);
      expect(before.className, `${viewport.label} ${fromMoves} load has no pulse`).not.toContain(
        "move-decrement-pulse"
      );
      expect(before.ariaLive, `${viewport.label} ${fromMoves} load stays quiet`).toBe("off");
      await commitLowMoveSwap(page);

      const remaining = fromMoves - 1;
      const peak = await movePressureReport(page);
      const expectedText = remaining === 1 ? "LAST MOVE · 1" : `Moves ${remaining}`;
      const expectedLabel = remaining === 1
        ? "Last move. 1 move remaining."
        : `${remaining} moves remaining.`;
      expect(peak.text, `${viewport.label} ${fromMoves}->${remaining} text`).toBe(expectedText);
      expect(peak.className, `${viewport.label} ${fromMoves}->${remaining} low class`).toContain("moves-low");
      expect(peak.className, `${viewport.label} ${fromMoves}->${remaining} pulse class`).toContain(
        "move-decrement-pulse"
      );
      expect(
        peak.className.includes("moves-last"),
        `${viewport.label} ${fromMoves}->${remaining} last class`
      ).toBe(remaining === 1);
      expect(peak.role, `${viewport.label} ${fromMoves}->${remaining} status role`).toBe("status");
      expect(peak.ariaLive, `${viewport.label} ${fromMoves}->${remaining} polite update`).toBe("polite");
      expect(peak.ariaLabel, `${viewport.label} ${fromMoves}->${remaining} exact label`).toBe(expectedLabel);
      expect(peak.animationName, `${viewport.label} ${fromMoves}->${remaining} pulse animation`).toBe(
        remaining === 1 ? "last-move-decrement-pulse" : "move-decrement-pulse"
      );
      expect(peak.backgroundImage, `${viewport.label} ${fromMoves}->${remaining} direct surface`).not.toBe("none");
      expect(Number(peak.fontWeight), `${viewport.label} ${fromMoves}->${remaining} direct weight`).toBeGreaterThanOrEqual(800);
      expect(peak.objectiveLow, `${viewport.label} ${fromMoves}->${remaining} frame support`).toBe(true);
      expect(peak.objectiveHeight, `${viewport.label} ${fromMoves}->${remaining} objective height`).toBeCloseTo(
        before.objectiveHeight,
        1
      );
      expect(peak.boardTop, `${viewport.label} ${fromMoves}->${remaining} board top`).toBeCloseTo(
        before.boardTop,
        1
      );
      expect(peak.boardBottom, `${viewport.label} ${fromMoves}->${remaining} board bottom`).toBeCloseTo(
        before.boardBottom,
        1
      );
      expect(peak.boardWidth, `${viewport.label} ${fromMoves}->${remaining} board width`).toBeCloseTo(
        before.boardWidth,
        1
      );
      expect(peak.boardHeight, `${viewport.label} ${fromMoves}->${remaining} board height`).toBeCloseTo(
        before.boardHeight,
        1
      );
      expect(peak.tiles, `${viewport.label} ${fromMoves}->${remaining} tiles`).toBe(64);
      expect(peak.rows, `${viewport.label} ${fromMoves}->${remaining} rows`).toBe(8);
      expect(peak.overflowX, `${viewport.label} ${fromMoves}->${remaining} overflow`).toBe(false);
      expect(peak.brokenImages, `${viewport.label} ${fromMoves}->${remaining} images`).toEqual([]);

      await page.waitForTimeout(700);
      const settled = await movePressureReport(page);
      expect(settled.text, `${viewport.label} ${remaining} settled text`).toBe(expectedText);
      expect(settled.className, `${viewport.label} ${remaining} settled pulse clears`).not.toContain(
        "move-decrement-pulse"
      );
      expect(settled.className, `${viewport.label} ${remaining} static pressure remains`).toContain("moves-low");
      expect(settled.ariaLive, `${viewport.label} ${remaining} settled status is quiet`).toBe("off");

      await page.reload({ waitUntil: "networkidle" });
      const reloaded = await movePressureReport(page);
      expect(reloaded.text, `${viewport.label} ${remaining} reload text`).toBe(expectedText);
      expect(reloaded.className, `${viewport.label} ${remaining} reload no pulse`).not.toContain(
        "move-decrement-pulse"
      );
      expect(reloaded.className, `${viewport.label} ${remaining} reload pressure`).toContain("moves-low");
      expect(reloaded.ariaLive, `${viewport.label} ${remaining} reload stays quiet`).toBe("off");
      expect(reloaded.tiles, `${viewport.label} ${remaining} reload tiles`).toBe(64);
      expect(reloaded.rows, `${viewport.label} ${remaining} reload rows`).toBe(8);
      expect(reloaded.overflowX, `${viewport.label} ${remaining} reload overflow`).toBe(false);
      expect(runtimeErrors, `${viewport.label} ${fromMoves}->${remaining} runtime errors`).toEqual([]);
      await context.close();
    }
  });

  test(`reduced motion and final-move outcomes outrank urgency on ${viewport.label}`, async ({ browser }) => {
    const reducedContext = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce"
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.addInitScript(({ key, state, marker }) => {
      if (!sessionStorage.getItem(marker)) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem(marker, "1");
      }
    }, {
      key: SAVE_KEY,
      state: lowMoveState(2),
      marker: `move-pressure-reduced-${viewport.label}`
    });
    await reducedPage.goto(
      `${BASE_URL}?move-pressure-reduced=${viewport.label}`,
      { waitUntil: "networkidle" }
    );
    await commitLowMoveSwap(reducedPage);
    const reduced = await movePressureReport(reducedPage);
    expect(reduced.text, `${viewport.label} reduced last move text`).toBe("LAST MOVE · 1");
    expect(reduced.className, `${viewport.label} reduced static last class`).toContain("moves-last");
    expect(reduced.animationName, `${viewport.label} reduced animation`).toBe("none");
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"], `${viewport.label} reduced transform`).toContain(
      reduced.transform
    );
    await reducedContext.close();

    const successContext = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    const successPage = await successContext.newPage();
    await successPage.addInitScript(({ key, state, marker }) => {
      if (!sessionStorage.getItem(marker)) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem(marker, "1");
      }
    }, {
      key: SAVE_KEY,
      state: lowMoveState(1, [13, 0, 0, 11, 0, 0]),
      marker: `move-pressure-success-${viewport.label}`
    });
    await successPage.goto(
      `${BASE_URL}?move-pressure-success=${viewport.label}`,
      { waitUntil: "networkidle" }
    );
    await commitLowMoveSwap(successPage, false);
    await expect(successPage.locator("#restoreGreenhouseBtn")).toBeVisible({ timeout: 10000 });
    const success = await movePressureReport(successPage);
    expect(success.payoffActionVisible, `${viewport.label} final success action`).toBe(true);
    expect(success.retryVisible, `${viewport.label} final success no Retry`).toBe(false);
    expect(success.className, `${viewport.label} final success no low state`).not.toContain("moves-low");
    expect(success.className, `${viewport.label} final success no pulse`).not.toContain(
      "move-decrement-pulse"
    );
    expect(success.objectiveLow, `${viewport.label} final success frame clears`).toBe(false);
    await successContext.close();

    const failureContext = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    const failurePage = await failureContext.newPage();
    await failurePage.addInitScript(({ key, state, marker }) => {
      if (!sessionStorage.getItem(marker)) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem(marker, "1");
      }
    }, {
      key: SAVE_KEY,
      state: lowMoveState(1),
      marker: `move-pressure-failure-${viewport.label}`
    });
    await failurePage.goto(
      `${BASE_URL}?move-pressure-failure=${viewport.label}`,
      { waitUntil: "networkidle" }
    );
    await commitLowMoveSwap(failurePage, false);
    await expect(failurePage.locator("#renewBtn.visible")).toBeFocused({ timeout: 10000 });
    const failure = await movePressureReport(failurePage);
    expect(failure.retryVisible, `${viewport.label} final failure Retry`).toBe(true);
    expect(failure.retryFocused, `${viewport.label} final failure Retry focus`).toBe(true);
    expect(failure.payoffActionVisible, `${viewport.label} final failure no payoff`).toBe(false);
    expect(failure.className, `${viewport.label} final failure no low state`).not.toContain("moves-low");
    expect(failure.className, `${viewport.label} final failure no pulse`).not.toContain(
      "move-decrement-pulse"
    );
    expect(failure.objectiveLow, `${viewport.label} final failure frame clears`).toBe(false);
    expect(failure.tiles, `${viewport.label} final failure tiles`).toBe(64);
    expect(failure.rows, `${viewport.label} final failure rows`).toBe(8);
    expect(failure.overflowX, `${viewport.label} final failure overflow`).toBe(false);
    expect(failure.brokenImages, `${viewport.label} final failure images`).toEqual([]);
    await failureContext.close();
  });
}

for (const viewport of FAILURE_VIEWPORTS) {
  test(`failed bouquets focus Retry and preserve keyboard recovery on ${viewport.label}`, async ({ browser }) => {
    for (const round of [1, 2, 3]) {
      const failedFixture = HUD_CASES.find((fixture) => fixture.label === `r${round}-failed`);
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        ...(viewport.reducedMotion ? { reducedMotion: viewport.reducedMotion } : {})
      });
      const page = await context.newPage();
      const runtimeErrors = [];
      const requestFailures = [];
      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(message.text());
      });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));
      page.on("requestfailed", (request) => {
        requestFailures.push(`${request.url()} ${request.failure()?.errorText || ""}`);
      });

      const naturalFailureState = savedState(failedFixture);
      naturalFailureState.moves = 1;
      await page.addInitScript(({ key, state, marker }) => {
        if (!sessionStorage.getItem(marker)) {
          localStorage.setItem(key, JSON.stringify(state));
          sessionStorage.setItem(marker, "1");
        }
      }, {
        key: SAVE_KEY,
        state: naturalFailureState,
        marker: `retry-focus-${viewport.label}-round-${round}`
      });
      await page.goto(
        `${BASE_URL}?retry-focus=${viewport.label}-round-${round}`,
        { waitUntil: "networkidle" }
      );

      const armedBeforeFailure = await page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        const relicCell = { x: 0, y: 0 };
        state.tutorialSkipped = false;
        state.tutorialActive = true;
        state.armedLineRelic = {
          ...relicCell,
          direction: "horizontal",
          flowerId: state.board[relicCell.y][relicCell.x]
        };
        localStorage.setItem(key, JSON.stringify(state));
        return state.armedLineRelic;
      }, SAVE_KEY);

      for (let reload = 0; reload < 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator("#tutorialPanel")).toBeVisible();
        await expect(page.locator("#tutorialPanel")).toHaveClass(/black-candle-tutorial/);
        await expect(page.locator("#tutorialPanel .tutorial-icon")).toHaveText("BLACK CANDLE");
        await expect(page.locator("#tutorialPanel .tutorial-icon")).toHaveAttribute("aria-hidden", "false");
        await expect(page.locator("#tutorialCopy")).toHaveText(
          /^Swap (left|right) to burn this row\.$/
        );
        await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(1);
        await expect(page.locator(".line-relic-lane-preview")).toHaveCount(8);
        await expect(page.locator(".line-relic-destination")).toHaveCount(1);
        const activeRelic = await page.evaluate((key) => {
          const state = JSON.parse(localStorage.getItem(key) || "{}");
          return {
            armedLineRelic: state.armedLineRelic,
            focusedId: document.activeElement?.id || ""
          };
        }, SAVE_KEY);
        expect(
          activeRelic.armedLineRelic,
          `${viewport.label} Round ${round} active reload ${reload + 1} relic`
        ).toEqual(armedBeforeFailure);
        expect(
          activeRelic.focusedId,
          `${viewport.label} Round ${round} active reload ${reload + 1} focus`
        ).toBe(`tile-${armedBeforeFailure.x}-${armedBeforeFailure.y}`);
      }

      const pair = await findLegalMatchPair(page, [
        armedBeforeFailure,
        { x: armedBeforeFailure.x + 1, y: armedBeforeFailure.y }
      ]);
      expect(pair, `${viewport.label} Round ${round} natural final move`).toHaveLength(2);
      for (const cell of pair) {
        await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).click();
      }

      const retry = page.locator("#renewBtn.visible");
      await expect(retry).toHaveText("Retry Bouquet", { timeout: 10000 });
      await expect(retry).toBeFocused();
      const failedState = await page.evaluate((key) => (
        JSON.parse(localStorage.getItem(key) || "{}")
      ), SAVE_KEY);
      expect(failedState.moves, `${viewport.label} Round ${round} final move spent once`).toBe(0);
      expect(failedState.currentRound, `${viewport.label} Round ${round} authored order`).toBe(round);
      expect(
        failedState.armedLineRelic,
        `${viewport.label} Round ${round} natural final failure retains relic`
      ).toMatchObject({
        direction: armedBeforeFailure.direction,
        flowerId: armedBeforeFailure.flowerId
      });
      const failedRelic = failedState.armedLineRelic;

      const assertRetryNarratorOwnsFailure = async (
        contextLabel,
        expectedRelic = failedRelic
      ) => {
        await expect(page.locator("#tutorialPanel")).toBeVisible();
        await expect(page.locator("#tutorialCopy")).toHaveText("Moves ended. Retry the bouquet.");
        await expect(page.locator("#tutorialPanel .tutorial-icon")).toHaveText("RETRY");
        await expect(page.locator("#tutorialPanel .tutorial-icon")).toHaveAttribute("aria-hidden", "false");
        await expect(page.locator("#tutorialPanel")).toHaveClass(/failed-tutorial/);
        await expect(page.locator("#tutorialPanel")).not.toHaveClass(/black-candle-tutorial/);
        await expect(page.locator("body")).not.toHaveClass(/armed-line-relic-cue/);
        await expect(retry).toBeVisible();
        await expect(retry).toBeFocused();
        const report = await page.evaluate((key) => {
          const state = JSON.parse(localStorage.getItem(key) || "{}");
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
          return {
            armedLineRelic: state.armedLineRelic,
            liveRegions: Array.from(document.querySelectorAll("[aria-live]"))
              .filter(visible)
              .map((node) => ({
                id: node.id,
                live: node.getAttribute("aria-live"),
                text: node.innerText.trim()
              })),
            coinLive: document.querySelector("#coinBalance")?.getAttribute("aria-live") || "",
            ceremonyLive: document.querySelector("#roundOneRestoration")?.getAttribute("aria-live") || "",
            tutorialLive: document.querySelector("#tutorialPanel")?.getAttribute("aria-live") || "",
            visibleButtons: Array.from(document.querySelectorAll("button"))
              .filter(visible)
              .filter((button) => !button.classList.contains("tile"))
              .map((button) => button.textContent.trim()),
            lanePreview: document.querySelectorAll(".line-relic-lane-preview").length,
            destinations: document.querySelectorAll(".line-relic-destination").length,
            tiles: document.querySelectorAll(".tile").length,
            rows: new Set(Array.from(document.querySelectorAll(".tile"), (tile) => tile.dataset.y)).size,
            overflowX: document.documentElement.scrollWidth > innerWidth + 1
          };
        }, SAVE_KEY);
        expect(report.armedLineRelic, `${contextLabel} retains relic gameplay state`).toEqual(
          expectedRelic
        );
        const liveOwners = report.liveRegions.filter(({ live }) => (
          live === "polite" || live === "assertive"
        ));
        expect(liveOwners, `${contextLabel} has one visible live owner`).toEqual([{
          id: "tutorialPanel",
          live: "polite",
          text: "RETRY\nMoves ended. Retry the bouquet."
        }]);
        expect(report.coinLive, `${contextLabel} quiet coin balance`).toBe("off");
        expect(report.ceremonyLive, `${contextLabel} quiet ceremony subtree`).toBe("off");
        expect(report.tutorialLive, `${contextLabel} polite Retry narrator`).toBe("polite");
        expect(report.visibleButtons, `${contextLabel} has one recovery action`).toEqual(["Retry Bouquet"]);
        expect(report.lanePreview, `${contextLabel} hides stale relic lane`).toBe(0);
        expect(report.destinations, `${contextLabel} hides stale relic destination`).toBe(0);
        expect(report.tiles, `${contextLabel} tiles`).toBe(64);
        expect(report.rows, `${contextLabel} rows`).toBe(8);
        expect(report.overflowX, `${contextLabel} overflow`).toBe(false);
      };

      for (let reload = 0; reload < 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await assertRetryNarratorOwnsFailure(
          `${viewport.label} Round ${round} failed relic reload ${reload + 1}`
        );
        if (round === 3 && reload === 0) {
          await page.screenshot({
            path: `work/failure-retry-category-${viewport.label}.png`,
            fullPage: true
          });
        }
      }

      const assertRecoveredRound = async (key) => {
        await expect(retry).toBeHidden();
        await expect(page.locator("#tutorialPanel")).not.toHaveClass(/failed-tutorial/);
        await expect(page.locator("#tutorialPanel")).not.toHaveClass(/black-candle-tutorial/);
        await expect(page.locator("#tutorialPanel .tutorial-icon")).not.toHaveText("RETRY");
        await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(0);
        await expect(page.locator(".tile")).toHaveCount(64);
        const recovered = await page.evaluate((saveKey) => {
          const state = JSON.parse(localStorage.getItem(saveKey) || "{}");
          const tabStops = Array.from(document.querySelectorAll(".tile[tabindex='0']"));
          return {
            currentRound: state.currentRound,
            moves: state.moves,
            counts: state.counts,
            coins: state.coins,
            roundOneRestored: Boolean(state.roundOneRestored),
            roundTwoGreenhouseUpgraded: Boolean(state.roundTwoGreenhouseUpgraded),
            coinLive: document.querySelector("#coinBalance")?.getAttribute("aria-live") || "",
            ceremonyLive: document.querySelector("#roundOneRestoration")?.getAttribute("aria-live") || "",
            tiles: document.querySelectorAll(".tile").length,
            rows: new Set(Array.from(document.querySelectorAll(".tile"), (tile) => tile.dataset.y)).size,
            tabStops: tabStops.length,
            focusedTile: Boolean(document.activeElement?.classList.contains("tile")),
            overflowX: document.documentElement.scrollWidth > innerWidth + 1,
            brokenImages: Array.from(document.images)
              .filter((image) => {
                const rect = image.getBoundingClientRect();
                const style = getComputedStyle(image);
                return style.display !== "none"
                  && rect.width > 0
                  && rect.height > 0
                  && image.complete
                  && image.naturalWidth === 0;
              })
              .map((image) => image.getAttribute("src"))
          };
        }, SAVE_KEY);
        expect(recovered.currentRound, `${viewport.label} Round ${round} ${key} round`).toBe(round);
        expect(recovered.moves, `${viewport.label} Round ${round} ${key} moves`).toBe([6, 9, 8][round - 1]);
        expect(recovered.counts, `${viewport.label} Round ${round} ${key} counts`).toEqual([0, 0, 0, 0, 0, 0]);
        expect(recovered.coins, `${viewport.label} Round ${round} ${key} coins`).toBe(naturalFailureState.coins);
        expect(recovered.roundOneRestored, `${viewport.label} Round ${round} ${key} R1 restore`).toBe(round > 1);
        expect(
          recovered.roundTwoGreenhouseUpgraded,
          `${viewport.label} Round ${round} ${key} R2 upgrade`
        ).toBe(round > 2);
        expect(recovered.coinLive, `${viewport.label} Round ${round} ${key} coin live`).toBe("polite");
        expect(recovered.ceremonyLive, `${viewport.label} Round ${round} ${key} ceremony live`).toBe("polite");
        expect(recovered.tiles, `${viewport.label} Round ${round} ${key} tiles`).toBe(64);
        expect(recovered.rows, `${viewport.label} Round ${round} ${key} rows`).toBe(8);
        expect(recovered.tabStops, `${viewport.label} Round ${round} ${key} tab stop`).toBe(1);
        expect(recovered.focusedTile, `${viewport.label} Round ${round} ${key} focus`).toBe(true);
        expect(recovered.overflowX, `${viewport.label} Round ${round} ${key} overflow`).toBe(false);
        expect(recovered.brokenImages, `${viewport.label} Round ${round} ${key} images`).toEqual([]);
      };

      await page.keyboard.press("Enter");
      await assertRecoveredRound("Enter");

      await page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        state.moves = 0;
        state.counts = [0, 0, 0, 0, 0, 0];
        state.roundComplete = false;
        state.tutorialSkipped = false;
        state.tutorialActive = true;
        state.armedLineRelic = {
          x: 3,
          y: 3,
          direction: "vertical",
          flowerId: state.board[3][3]
        };
        localStorage.setItem(key, JSON.stringify(state));
      }, SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      await assertRetryNarratorOwnsFailure(`${viewport.label} Round ${round} Space failure`, {
        x: 3,
        y: 3,
        direction: "vertical",
        flowerId: await page.evaluate(() => (
          JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}")
            .armedLineRelic?.flowerId
        ))
      });
      await page.keyboard.press("Space");
      await assertRecoveredRound("Space");

      expect(runtimeErrors, `${viewport.label} Round ${round} runtime errors`).toEqual([]);
      expect(requestFailures, `${viewport.label} Round ${round} request failures`).toEqual([]);
      await context.close();
    }
  });
}

const ROUND_TWO_HANDOFF_INPUTS = [
  { label: "desktop-pointer", viewport: VIEWPORTS[0], input: "pointer" },
  { label: "desktop-keyboard", viewport: VIEWPORTS[0], input: "keyboard" },
  { label: "mobile390-touch", viewport: VIEWPORTS[1], input: "touch" }
];

for (const config of ROUND_TWO_HANDOFF_INPUTS) {
  test(`Round 1 to 2 handoff stays board-first and immediately playable on ${config.label}`, async ({ browser }) => {
    const contextOptions = {
      viewport: { width: config.viewport.width, height: config.viewport.height }
    };
    if (config.input === "touch") {
      contextOptions.hasTouch = true;
      contextOptions.isMobile = true;
    }

    const idleContext = await browser.newContext(contextOptions);
    const idlePage = await idleContext.newPage();
    const idleErrors = [];
    idlePage.on("console", (message) => {
      if (message.type() === "error") idleErrors.push(message.text());
    });
    idlePage.on("pageerror", (error) => idleErrors.push(error.message));
    await idlePage.addInitScript(({ key, state, marker }) => {
      if (!sessionStorage.getItem(marker)) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem(marker, "1");
      }
    }, {
      key: SAVE_KEY,
      state: restoredRoundOneHandoffState(),
      marker: `round-two-handoff-idle-${config.label}`
    });
    await idlePage.goto(
      `${BASE_URL}?round-two-handoff-idle=${config.label}`,
      { waitUntil: "networkidle" }
    );
    const idleAction = idlePage.locator("#nextOrderBtn");
    await expect(idleAction).toBeFocused();
    if (config.input === "keyboard") {
      await idlePage.keyboard.press("Enter");
    } else if (config.input === "touch") {
      await idleAction.tap();
    } else {
      await idleAction.click();
    }

    await expect(idlePage.locator("#tutorialCopy")).toHaveText("Match beside the Thorn.");
    await expect(idlePage.locator(".tile.thorn-teach")).toHaveCount(2);
    const immediate = await roundTwoHandoffReport(idlePage);
    assertRoundTwoHandoffGeometry(immediate, config.viewport, `${config.label} immediate lesson`);
    expect(immediate.currentRound, `${config.label} authored second order`).toBe(2);
    expect(immediate.moves, `${config.label} untouched move budget`).toBe(9);
    expect(immediate.handoffActive, `${config.label} no duplicate shared handoff`).toBe(false);
    expect(immediate.nextCueNodes, `${config.label} shared final-order node retained`).toBe(1);
    expect(immediate.instructionSurfaces, `${config.label} one direct instruction`).toEqual([{
      id: "tutorialPanel",
      text: "✦ Match beside the Thorn. Skip"
    }]);
    expect(immediate.guideTiles, `${config.label} one adjacent highlighted pair`).toBe(2);
    expect(immediate.thornTeachTiles, `${config.label} highlighted pair teaches cause`).toBe(2);
    expect(immediate.thornTargetTiles, `${config.label} authored blockers teach target`).toBe(3);
    expect(immediate.guideOverlays, `${config.label} one direct-manipulation guide`).toBe(1);
    await idlePage.screenshot({
      path: `work/round-two-handoff-${config.label}-ready.png`,
      fullPage: true
    });
    expect(idleErrors, `${config.label} idle runtime errors`).toEqual([]);
    await idleContext.close();

    const actionContext = await browser.newContext(contextOptions);
    const actionPage = await actionContext.newPage();
    const runtimeErrors = [];
    const requestFailures = [];
    actionPage.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    actionPage.on("pageerror", (error) => runtimeErrors.push(error.message));
    actionPage.on("requestfailed", (request) => {
      const errorText = request.failure()?.errorText || "failed";
      const replacedGreenhouseImage = errorText === "net::ERR_ABORTED"
        && request.url().includes("/assets/greenhouse/")
        && request.url().endsWith(".jpg");
      if (!replacedGreenhouseImage) {
        requestFailures.push(`${request.url()} :: ${errorText}`);
      }
    });
    await actionPage.addInitScript(({ key, state, marker }) => {
      if (!sessionStorage.getItem(marker)) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem(marker, "1");
      }
    }, {
      key: SAVE_KEY,
      state: restoredRoundOneHandoffState(),
      marker: `round-two-handoff-action-${config.label}`
    });
    await actionPage.goto(
      `${BASE_URL}?round-two-handoff-action=${config.label}`,
      { waitUntil: "networkidle" }
    );
    const action = actionPage.locator("#nextOrderBtn");
    await expect(action).toBeFocused();
    if (config.input === "keyboard") {
      await actionPage.keyboard.press("Enter");
    } else if (config.input === "touch") {
      await action.tap();
    } else {
      await action.click();
    }
    await actionPage.waitForTimeout(150);
    const activeHandoff = await roundTwoHandoffReport(actionPage);
    assertRoundTwoHandoffGeometry(
      activeHandoff,
      config.viewport,
      `${config.label} immediate lesson`
    );
    expect(activeHandoff.handoffActive, `${config.label} shared handoff stays inactive`).toBe(false);
    expect(activeHandoff.nextCueNodes, `${config.label} shared final-order node retained`).toBe(1);
    expect(activeHandoff.instructionSurfaces, `${config.label} one literal lesson`).toEqual([{
      id: "tutorialPanel",
      text: "✦ Match beside the Thorn. Skip"
    }]);
    expect(activeHandoff.guideTiles, `${config.label} actionable highlighted pair`).toBe(2);
    expect(activeHandoff.thornTeachTiles, `${config.label} pair teaches Thorn damage`).toBe(2);
    expect(activeHandoff.thornTargetTiles, `${config.label} blocker highlights`).toBe(3);

    const tileAt = (x, y) => actionPage.locator(`.tile[data-x="${x}"][data-y="${y}"]`);
    if (config.input === "keyboard") {
      await expect(tileAt(1, 2)).toBeFocused();
      await actionPage.keyboard.press("Enter");
      await actionPage.keyboard.press("ArrowDown");
    } else if (config.input === "touch") {
      await tileAt(1, 2).tap();
      await expect(tileAt(1, 2)).toHaveClass(/\bsel\b/);
      await tileAt(1, 3).tap();
    } else {
      await tileAt(1, 2).click();
      await expect(tileAt(1, 2)).toHaveClass(/\bsel\b/);
      await tileAt(1, 3).click();
    }

    await expect.poll(async () => (
      actionPage.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return {
          moves: state.moves,
          cleared: state.clearedCursedThorns,
          thorns: state.cursedThorns?.length,
          enabledTiles: document.querySelectorAll(".tile:not(:disabled)").length
        };
      }, SAVE_KEY)
    ), { timeout: 10000 }).toEqual({
      moves: 8,
      cleared: 3,
      thorns: 0,
      enabledTiles: 64
    });

    const sealed = await roundTwoHandoffReport(actionPage);
    assertRoundTwoHandoffGeometry(sealed, config.viewport, `${config.label} sealed`);
    expect(sealed.handoffActive, `${config.label} shared handoff remains inactive`).toBe(false);
    expect(sealed.instructionSurfaces, `${config.label} lesson retires after success`).toEqual([]);
    expect(sealed.guideTiles, `${config.label} pair highlight retires`).toBe(0);
    expect(sealed.thornTeachTiles, `${config.label} Thorn teaching retires`).toBe(0);
    expect(sealed.thornTargetTiles, `${config.label} blocker teaching retires`).toBe(0);
    expect(sealed.guideOverlays, `${config.label} direct guide retires`).toBe(0);
    expect(sealed.thornComplete, `${config.label} thorn goal retired`).toBe(true);
    expect(sealed.thornSeal, `${config.label} thorn goal seal`).toBe("Sealed");
    expect(sealed.thornAriaLabel, `${config.label} thorn goal semantics`).toBe(
      "Cursed Thorn goal sealed, 3 of 3 cleared"
    );

    await actionPage.reload({ waitUntil: "networkidle" });
    const reloaded = await roundTwoHandoffReport(actionPage);
    assertRoundTwoHandoffGeometry(reloaded, config.viewport, `${config.label} reload`);
    expect(reloaded.handoffActive, `${config.label} reload does not replay handoff`).toBe(false);
    expect(reloaded.instructionSurfaces, `${config.label} reload does not replay lesson`).toEqual([]);
    expect(reloaded.moves, `${config.label} reload move cost`).toBe(8);
    expect(reloaded.clearedCursedThorns, `${config.label} reload thorn credit`).toBe(3);
    expect(reloaded.cursedThorns, `${config.label} reload cleared thorns`).toBe(0);
    expect(reloaded.thornComplete, `${config.label} reload sealed state`).toBe(true);
    expect(runtimeErrors, `${config.label} runtime errors`).toEqual([]);
    expect(requestFailures, `${config.label} request failures`).toEqual([]);
    await actionContext.close();
  });
}

for (const config of ROUND_TWO_HANDOFF_INPUTS) {
  test(`Round 2 to 3 handoff names the final order and stays immediately playable on ${config.label}`, async ({ browser }) => {
    const contextOptions = {
      viewport: { width: config.viewport.width, height: config.viewport.height }
    };
    if (config.input === "touch") {
      contextOptions.hasTouch = true;
      contextOptions.isMobile = true;
    }

    const idleContext = await browser.newContext(contextOptions);
    const idlePage = await idleContext.newPage();
    const idleErrors = [];
    idlePage.on("console", (message) => {
      if (message.type() === "error") idleErrors.push(message.text());
    });
    idlePage.on("pageerror", (error) => idleErrors.push(error.message));
    await idlePage.addInitScript(({ key, state, marker }) => {
      if (!sessionStorage.getItem(marker)) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem(marker, "1");
      }
    }, {
      key: SAVE_KEY,
      state: upgradedRoundTwoHandoffState(),
      marker: `round-three-handoff-idle-${config.label}`
    });
    await idlePage.goto(
      `${BASE_URL}?round-three-handoff-idle=${config.label}`,
      { waitUntil: "networkidle" }
    );
    await installInPageHandoffTimeline(idlePage);
    const idleAction = idlePage.locator("#nextOrderBtn");
    await expect(idleAction).toBeFocused();
    if (config.input === "keyboard") {
      await idlePage.keyboard.press("Enter");
    } else if (config.input === "touch") {
      await idleAction.tap();
    } else {
      await idleAction.click();
    }

    const timeline = await readInPageHandoffTimeline(idlePage);
    for (const report of timeline) {
      const label = `${config.label} final-order ${report.sampleAt}ms`;
      assertRoundTwoHandoffGeometry(report, config.viewport, label);
      expect(report.currentRound, `${label} active round`).toBe(3);
      expect(report.moves, `${label} final-order budget`).toBe(8);
      expect(report.coins, `${label} retained economy`).toBe(50);
      if (report.sampleAt < 2200) {
        expect(report.handoffActive, `${label} handoff owns instruction`).toBe(true);
        expect(report.instructionSurfaces, `${label} one final-order narrator`).toEqual([{
          id: "nextOrderCue",
          text: "Moonlit Upgrade · Bloodroot Compact · Match Bloodroot + Sol Rot"
        }]);
      } else {
        expect(report.handoffActive, `${label} handoff yields`).toBe(false);
        expect(
          report.instructionSurfaces.some((surface) => surface.id === "nextOrderCue"),
          `${label} transient cue retired`
        ).toBe(false);
      }
    }
    expect(idleErrors, `${config.label} final-order idle runtime errors`).toEqual([]);
    await idleContext.close();

    const refusalContext = await browser.newContext(contextOptions);
    const refusalPage = await refusalContext.newPage();
    const refusalErrors = [];
    refusalPage.on("console", (message) => {
      if (message.type() === "error") refusalErrors.push(message.text());
    });
    refusalPage.on("pageerror", (error) => refusalErrors.push(error.message));
    await refusalPage.addInitScript(({ key, state, marker }) => {
      if (!sessionStorage.getItem(marker)) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem(marker, "1");
      }
    }, {
      key: SAVE_KEY,
      state: upgradedRoundTwoHandoffState(),
      marker: `round-three-handoff-refusal-${config.label}`
    });
    await refusalPage.goto(
      `${BASE_URL}?round-three-handoff-refusal=${config.label}`,
      { waitUntil: "networkidle" }
    );
    const refusalAction = refusalPage.locator("#nextOrderBtn");
    await expect(refusalAction).toBeFocused();
    // Anchor the refusal clock to synchronous product time; the separate action
    // context below still verifies pointer, keyboard, and touch activation.
    await refusalAction.evaluate((button) => button.click());
    await refusalPage.waitForTimeout(150);

    const performInvalidPair = async () => {
      const source = refusalPage.locator('.tile[data-x="0"][data-y="0"]');
      const destination = refusalPage.locator('.tile[data-x="0"][data-y="1"]');
      if (config.input === "keyboard") {
        await source.focus();
        await refusalPage.keyboard.press("Enter");
        await refusalPage.keyboard.press("ArrowDown");
      } else if (config.input === "touch") {
        const sourceBox = await source.boundingBox();
        const destinationBox = await destination.boundingBox();
        await refusalPage.touchscreen.tap(
          sourceBox.x + sourceBox.width / 2,
          sourceBox.y + sourceBox.height / 2
        );
        await refusalPage.touchscreen.tap(
          destinationBox.x + destinationBox.width / 2,
          destinationBox.y + destinationBox.height / 2
        );
      } else {
        await source.click();
        await destination.click();
      }
    };

    for (let refusal = 0; refusal < 2; refusal += 1) {
      await performInvalidPair();
      await refusalPage.waitForTimeout(140);
      const peak = await roundTwoHandoffReport(refusalPage);
      assertRoundTwoHandoffGeometry(
        peak,
        config.viewport,
        `${config.label} final-order refusal ${refusal + 1}`
      );
      if (refusal === 0) {
        expect(peak.handoffActive, `${config.label} invalid pair preserves handoff`).toBe(true);
        expect(peak.instructionSurfaces, `${config.label} handoff remains sole narrator`).toEqual([{
          id: "nextOrderCue",
          text: "Moonlit Upgrade · Bloodroot Compact · Match Bloodroot + Sol Rot"
        }]);
        await refusalPage.screenshot({
          path: `work/round-three-handoff-refusal-${config.label}.png`,
          fullPage: true
        });
      }
      expect(peak.invalidTiles, `${config.label} refusal marks both tiles`).toBe(2);
      expect(peak.moves, `${config.label} refusal spends no move`).toBe(8);
      expect(peak.counts, `${config.label} refusal credits no flowers`).toEqual([0, 0, 0, 0, 0, 0]);
      expect(peak.coins, `${config.label} refusal preserves coins`).toBe(50);
    }

    await expect(refusalPage.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 1800 });
    await expect.poll(async () => (
      (await roundTwoHandoffReport(refusalPage)).handoffActive
    ), { timeout: 3500 }).toBe(false);
    await expect(refusalPage.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 9000 });
    const recoveredGuide = await roundTwoHandoffReport(refusalPage);
    expect(
      recoveredGuide.instructionSurfaces.some((surface) => surface.id === "nextOrderCue"),
      `${config.label} final-order handoff does not replay`
    ).toBe(false);
    expect(recoveredGuide.idleHints, `${config.label} exactly one legal hint pair`).toHaveLength(2);

    const [hintSourceCell, hintDestinationCell] = recoveredGuide.idleHints;
    const hintSource = refusalPage.locator(
      `.tile[data-x="${hintSourceCell.x}"][data-y="${hintSourceCell.y}"]`
    );
    const hintDestination = refusalPage.locator(
      `.tile[data-x="${hintDestinationCell.x}"][data-y="${hintDestinationCell.y}"]`
    );
    if (config.input === "keyboard") {
      await hintSource.focus();
      await refusalPage.keyboard.press("Enter");
      const dx = hintDestinationCell.x - hintSourceCell.x;
      const dy = hintDestinationCell.y - hintSourceCell.y;
      await refusalPage.keyboard.press(
        dx === 1 ? "ArrowRight" : dx === -1 ? "ArrowLeft" : dy === 1 ? "ArrowDown" : "ArrowUp"
      );
    } else if (config.input === "touch") {
      await hintSource.tap();
      await hintDestination.tap();
    } else {
      await hintSource.click();
      await hintDestination.click();
    }
    await expect.poll(async () => {
      const report = await roundTwoHandoffReport(refusalPage);
      return {
        moves: report.moves,
        enabledTiles: report.enabledTiles
      };
    }, { timeout: 10000 }).toEqual({
      moves: 7,
      enabledTiles: 64
    });
    const recoveredMove = await roundTwoHandoffReport(refusalPage);
    expect(
      recoveredMove.counts.reduce((sum, count) => sum + count, 0),
      `${config.label} recovered hint credits flowers`
    ).toBeGreaterThan(0);
    expect(refusalErrors, `${config.label} final-order refusal runtime errors`).toEqual([]);
    await refusalContext.close();

    const actionContext = await browser.newContext(contextOptions);
    const actionPage = await actionContext.newPage();
    const runtimeErrors = [];
    const requestFailures = [];
    actionPage.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    actionPage.on("pageerror", (error) => runtimeErrors.push(error.message));
    actionPage.on("requestfailed", (request) => {
      const errorText = request.failure()?.errorText || "failed";
      const replacedGreenhouseImage = errorText === "net::ERR_ABORTED"
        && request.url().includes("/assets/greenhouse/")
        && request.url().endsWith(".jpg");
      if (!replacedGreenhouseImage) {
        requestFailures.push(`${request.url()} :: ${errorText}`);
      }
    });
    await actionPage.addInitScript(({ key, state, marker }) => {
      if (!sessionStorage.getItem(marker)) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem(marker, "1");
      }
    }, {
      key: SAVE_KEY,
      state: upgradedRoundTwoHandoffState(),
      marker: `round-three-handoff-action-${config.label}`
    });
    await actionPage.goto(
      `${BASE_URL}?round-three-handoff-action=${config.label}`,
      { waitUntil: "networkidle" }
    );
    const action = actionPage.locator("#nextOrderBtn");
    await expect(action).toBeFocused();
    if (config.input === "keyboard") {
      await actionPage.keyboard.press("Enter");
    } else if (config.input === "touch") {
      await action.tap();
    } else {
      await action.click();
    }
    await actionPage.waitForTimeout(150);
    const activeHandoff = await roundTwoHandoffReport(actionPage);
    assertRoundTwoHandoffGeometry(
      activeHandoff,
      config.viewport,
      `${config.label} immediate final-order handoff`
    );
    expect(activeHandoff.handoffActive).toBe(true);
    expect(activeHandoff.instructionSurfaces).toEqual([{
      id: "nextOrderCue",
      text: "Moonlit Upgrade · Bloodroot Compact · Match Bloodroot + Sol Rot"
    }]);
    expect(activeHandoff.tabStops, `${config.label} final-order roving tab stop`).toBe(1);
    expect(activeHandoff.focusedTile, `${config.label} final-order board focus`).toBe(true);
    await actionPage.screenshot({
      path: `work/round-three-handoff-${config.label}.png`,
      fullPage: true
    });

    const pair = await findLegalMatchPair(actionPage);
    expect(pair, `${config.label} final-order legal opening pair`).toHaveLength(2);
    const [sourceCell, destinationCell] = pair;
    const source = actionPage.locator(
      `.tile[data-x="${sourceCell.x}"][data-y="${sourceCell.y}"]`
    );
    const destination = actionPage.locator(
      `.tile[data-x="${destinationCell.x}"][data-y="${destinationCell.y}"]`
    );
    if (config.input === "keyboard") {
      await source.focus();
      await actionPage.keyboard.press("Enter");
      const dx = destinationCell.x - sourceCell.x;
      const dy = destinationCell.y - sourceCell.y;
      await actionPage.keyboard.press(
        dx === 1 ? "ArrowRight" : dx === -1 ? "ArrowLeft" : dy === 1 ? "ArrowDown" : "ArrowUp"
      );
    } else if (config.input === "touch") {
      await source.tap();
      await destination.tap();
    } else {
      await source.click();
      await destination.click();
    }

    await expect.poll(async () => (
      actionPage.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return {
          moves: state.moves,
          credited: (state.counts || []).reduce((sum, count) => sum + count, 0),
          enabledTiles: document.querySelectorAll(".tile:not(:disabled)").length
        };
      }, SAVE_KEY)
    ), { timeout: 10000 }).toEqual({
      moves: 7,
      credited: expect.any(Number),
      enabledTiles: 64
    });

    const settledState = await actionPage.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      return {
        counts: state.counts,
        coins: state.coins
      };
    }, SAVE_KEY);
    expect(
      settledState.counts.reduce((sum, count) => sum + count, 0),
      `${config.label} final-order flower credit`
    ).toBeGreaterThan(0);
    expect(settledState.coins, `${config.label} final-order coins`).toBe(50);

    const settled = await roundTwoHandoffReport(actionPage);
    assertRoundTwoHandoffGeometry(settled, config.viewport, `${config.label} final-order settled`);
    expect(settled.handoffActive, `${config.label} committed pair retires final-order handoff`).toBe(false);
    expect(
      settled.instructionSurfaces.some((surface) => surface.id === "nextOrderCue"),
      `${config.label} no stale final-order cue`
    ).toBe(false);

    await actionPage.reload({ waitUntil: "networkidle" });
    const reloaded = await roundTwoHandoffReport(actionPage);
    assertRoundTwoHandoffGeometry(reloaded, config.viewport, `${config.label} final-order reload`);
    expect(reloaded.handoffActive, `${config.label} reload does not replay final-order cue`).toBe(false);
    expect(reloaded.currentRound, `${config.label} reload round`).toBe(3);
    expect(reloaded.moves, `${config.label} reload move cost`).toBe(7);
    expect(reloaded.counts, `${config.label} reload flower credit`).toEqual(settledState.counts);
    expect(reloaded.coins, `${config.label} reload retained economy`).toBe(50);
    expect(reloaded.enabledTiles, `${config.label} reload enabled board`).toBe(64);
    expect(reloaded.tabStops, `${config.label} reload roving tab stop`).toBe(1);
    expect(runtimeErrors, `${config.label} final-order runtime errors`).toEqual([]);
    expect(requestFailures, `${config.label} final-order request failures`).toEqual([]);
    await actionContext.close();
  });
}

test("short desktop keeps the full altar and replay Help in the first viewport", async ({ browser }) => {
  const viewport = VIEWPORTS[0];
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto(`${BASE_URL}?short-desktop=fresh`, { waitUntil: "networkidle" });
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialSkipBtn")).toBeVisible();
  await expect(page.locator("#tutorialHelpBtn")).toBeHidden();
  assertActiveViewport(await activeViewportReport(page), viewport, "fresh desktop tutorial");

  await page.locator("#tutorialSkipBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  await expect(page.locator("#tutorialHelpBtn")).toBeVisible();
  await expect(page.locator("#tutorialHelpBtn")).toBeEnabled();
  const skipped = await activeViewportReport(page);
  assertActiveViewport(skipped, viewport, "post-Skip desktop");
  expect(skipped.helpTop, "Help begins inside first viewport").toBeGreaterThanOrEqual(0);
  expect(skipped.helpBottom, "Help ends inside first viewport").toBeLessThanOrEqual(viewport.height - 4);

  await page.locator("#tutorialHelpBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialCopy")).toHaveText("Swap the glowing flowers.");
  assertActiveViewport(await activeViewportReport(page), viewport, "desktop replay tutorial");

  expect(runtimeErrors, "fresh desktop runtime errors").toEqual([]);
  await context.close();
});

for (const viewport of VIEWPORTS) {
  test(`active first-three altars stay complete in the first viewport on ${viewport.label}`, async ({ browser }) => {
    for (const fixture of ACTIVE_VIEWPORT_CASES) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();
      await page.addInitScript(({ key, state }) => {
        localStorage.setItem(key, JSON.stringify(state));
      }, { key: SAVE_KEY, state: savedState(fixture) });
      await page.goto(`${BASE_URL}?active-viewport=${viewport.label}-${fixture.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#board")).toBeVisible();
      assertActiveViewport(
        await activeViewportReport(page),
        viewport,
        `${viewport.label} ${fixture.label} before Help`
      );

      const help = page.locator("#tutorialHelpBtn");
      const skip = page.locator("#tutorialSkipBtn");
      await expect(help).toBeVisible();
      await expect(help).toBeEnabled();
      await help.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("#tutorialPanel")).toBeVisible();
      await expect(page.locator("#tutorialCopy")).toHaveText(fixture.tutorialCopy);
      await expect(help).toBeHidden();
      await expect(skip).toBeVisible();
      await expect(skip).toBeFocused();
      assertActiveViewport(
        await activeViewportReport(page),
        viewport,
        `${viewport.label} ${fixture.label} during Help replay`
      );
      if (fixture.label === "r3-active") {
        await page.screenshot({
          path: `work/help-replay-${viewport.label}-r3.png`,
          fullPage: true
        });
      }

      await page.keyboard.press("Enter");
      await expect(page.locator("#tutorialPanel")).toBeHidden();
      await expect(help).toBeVisible();
      await expect(help).toBeEnabled();
      await expect(help).toBeFocused();
      assertActiveViewport(
        await activeViewportReport(page),
        viewport,
        `${viewport.label} ${fixture.label} after replay Skip`
      );
      await context.close();
    }
  });
}

test("active hierarchy scales the roomy altar without moving the accepted short or mobile geometry", async ({ browser }) => {
  const captures = [
    {
      label: "r1-desktop1280",
      viewport: { width: 1280, height: 720 },
      screenshot: "work/active-hierarchy-r1-desktop1280.png",
      expectedBoard: 480,
      expectedTile: 54.25,
      maxGreenhouseAreaRatio: 0.53,
      exerciseOpening: true
    },
    {
      label: "r1-roomy1440",
      viewport: { width: 1440, height: 900 },
      screenshot: "work/active-hierarchy-r1-roomy1440.png",
      expectedBoard: 650,
      expectedTile: 75.25,
      maxGreenhouseAreaRatio: 0.27,
      centered: true
    },
    {
      label: "r1-mobile390",
      viewport: { width: 390, height: 844 },
      mobile: true,
      screenshot: "work/active-hierarchy-r1-mobile390.png",
      expectedBoard: 378,
      expectedTile: 42.875,
      mobileBaseline: true
    },
    {
      label: "r2-thorn-roomy1440",
      viewport: { width: 1440, height: 900 },
      screenshot: "work/active-hierarchy-r2-thorn-roomy1440.png",
      expectedBoard: 650,
      expectedTile: 75.25,
      maxGreenhouseAreaRatio: 0.27,
      centered: true,
      state: {
        ...savedState(HUD_CASES.find((fixture) => fixture.label === "r2-active")),
        moves: 9,
        counts: [0, 0, 0, 0, 0, 0],
        clearedCursedThorns: 0,
        cursedThorns: [{ x: 0, y: 1, hp: 1 }, { x: 1, y: 1, hp: 1 }, { x: 2, y: 1, hp: 1 }],
        hasMadeValidMove: false,
        restoredRoundTwoGuideMoves: 0,
        tutorialSkipped: false,
        tutorialActive: true,
        blackCandleLessonComplete: true
      }
    },
    {
      label: "r3-low-move-roomy1440",
      viewport: { width: 1440, height: 900 },
      screenshot: "work/active-hierarchy-r3-low-move-roomy1440.png",
      expectedBoard: 650,
      expectedTile: 75.25,
      maxGreenhouseAreaRatio: 0.27,
      centered: true,
      activeOrders: true,
      state: {
        ...savedState(HUD_CASES.find((fixture) => fixture.label === "r3-active")),
        moves: 1,
        counts: [10, 0, 0, 11, 0, 0],
        tutorialSkipped: true,
        tutorialActive: false,
        blackCandleLessonComplete: true
      }
    }
  ];

  for (const capture of captures) {
    const context = await browser.newContext({
      viewport: capture.viewport,
      isMobile: Boolean(capture.mobile),
      hasTouch: Boolean(capture.mobile)
    });
    const page = await context.newPage();
    const runtimeErrors = [];
    const requestFailures = [];
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("requestfailed", (request) => requestFailures.push(
      `${request.url()} :: ${request.failure()?.errorText || "failed"}`
    ));
    if (capture.state) {
      await page.addInitScript(({ key, state }) => {
        localStorage.setItem(key, JSON.stringify(state));
      }, { key: SAVE_KEY, state: capture.state });
    }

    await page.goto(`${BASE_URL}?active-hierarchy=${capture.label}`, { waitUntil: "networkidle" });
    await expect(page.locator("#board .tile")).toHaveCount(64);
    if (capture.label.startsWith("r1-")) {
      await expect(page.locator("#tutorialCopy")).toHaveText("Swap the glowing flowers.");
      await expect(page.locator("#tutorialPanel")).toBeVisible();
    }
    if (capture.label.startsWith("r2-")) {
      await expect(page.locator("#tutorialCopy")).toHaveText("Match beside the Thorn.");
      await expect(page.locator("#tutorialPanel")).toBeVisible();
      await expect(page.locator("#board .tile.cursed-thorn")).toHaveCount(3);
    }

    const report = await page.evaluate(() => {
      const visible = (node) => {
        if (!node) return false;
        const bounds = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return style.display !== "none"
          && style.visibility !== "hidden"
          && Number(style.opacity || 1) !== 0
          && bounds.width > 0
          && bounds.height > 0;
      };
      const rect = (selector) => {
        const node = document.querySelector(selector);
        if (!node) return null;
        const bounds = node.getBoundingClientRect();
        return {
          left: bounds.left,
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.bottom,
          width: bounds.width,
          height: bounds.height
        };
      };
      const overlap = (a, b) => Boolean(
        a
        && b
        && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
        && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
      );
      const board = rect("#board");
      const hero = rect(".hero");
      const tiles = Array.from(document.querySelectorAll("#board .tile"));
      const completeRows = new Set(tiles
        .filter((tile) => {
          const bounds = tile.getBoundingClientRect();
          return bounds.top >= 0 && bounds.bottom <= innerHeight;
        })
        .map((tile) => tile.dataset.y));
      const instruction = ["#tutorialPanel", "#firstSwapCue", "#nextOrderCue"]
        .map((selector) => document.querySelector(selector))
        .find(visible);
      const visibleButtons = Array.from(document.querySelectorAll("button"))
        .filter((button) => visible(button) && !button.closest("#board"));
      return {
        viewport: { width: innerWidth, height: innerHeight },
        bodyClasses: document.body.className,
        board,
        hero,
        firstTile: rect("#board .tile"),
        objective: rect("#objective"),
        progress: rect("#bouquetProgress"),
        mobileGreenhouse: rect("#mobileGreenhouseProgress"),
        instruction: instruction ? rect(`#${instruction.id}`) : null,
        heroDialVisible: visible(document.querySelector("#heroRestorationDial")),
        heroDialText: document.querySelector("#heroRestorationDial")?.textContent.replace(/\s+/g, " ").trim() || "",
        activeOrdersVisible: visible(document.querySelector(".active-orders-card")),
        tiles: tiles.length,
        rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
        completeRows: completeRows.size,
        boardObjectiveOverlap: overlap(board, rect("#objective")),
        boardProgressOverlap: overlap(board, rect("#bouquetProgress")),
        boardInstructionOverlap: overlap(board, instruction ? rect(`#${instruction.id}`) : null),
        visibleButtonCount: visibleButtons.length,
        overflowX: document.documentElement.scrollWidth > innerWidth + 1,
        brokenImages: Array.from(document.images)
          .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
          .map((image) => image.getAttribute("src"))
      };
    });

    expect(report.tiles, `${capture.label} tile integrity`).toBe(64);
    expect(report.rows, `${capture.label} authoritative rows`).toBe(8);
    expect(report.completeRows, `${capture.label} complete viewport rows`).toBe(8);
    expect(report.board.width, `${capture.label} altar width`).toBeCloseTo(capture.expectedBoard, 0);
    expect(report.board.height, `${capture.label} altar height`).toBeCloseTo(capture.expectedBoard, 0);
    expect(report.firstTile.width, `${capture.label} flower socket width`).toBeCloseTo(capture.expectedTile, 2);
    expect(report.firstTile.height, `${capture.label} flower socket height`).toBeCloseTo(capture.expectedTile, 2);
    expect(report.board.top, `${capture.label} altar starts in viewport`).toBeGreaterThanOrEqual(0);
    expect(report.board.bottom, `${capture.label} altar ends in viewport`).toBeLessThanOrEqual(capture.viewport.height - 4);
    expect(report.boardObjectiveOverlap, `${capture.label} objective clears altar`).toBe(false);
    expect(report.boardProgressOverlap, `${capture.label} bouquet HUD clears altar`).toBe(false);
    expect(report.boardInstructionOverlap, `${capture.label} cue clears altar`).toBe(false);
    expect(report.visibleButtonCount, `${capture.label} contextual control limit`).toBeLessThanOrEqual(2);
    expect(report.overflowX, `${capture.label} horizontal overflow`).toBe(false);
    expect(report.brokenImages, `${capture.label} broken images`).toEqual([]);

    if (capture.maxGreenhouseAreaRatio) {
      expect(report.heroDialVisible, `${capture.label} greenhouse progress remains visible`).toBe(true);
      expect(report.heroDialText, `${capture.label} greenhouse ownership and next restoration`).toMatch(
        /\d+%.*(?:Withered|restored|upgrade owned).*OWNED \d\/3.*NEXT:/i
      );
      expect(
        (report.hero.width * report.hero.height) / (report.board.width * report.board.height),
        `${capture.label} greenhouse remains subordinate to altar`
      ).toBeLessThanOrEqual(capture.maxGreenhouseAreaRatio);
    }
    if (capture.centered) {
      expect(
        report.board.left + (report.board.width / 2),
        `${capture.label} altar is centered in the viewport`
      ).toBeCloseTo(capture.viewport.width / 2, 0);
    }
    if (capture.activeOrders) {
      expect(report.activeOrdersVisible, `${capture.label} current Active Orders remain visible`).toBe(true);
    }
    if (capture.mobileBaseline) {
      expect(report.heroDialVisible, `${capture.label} desktop greenhouse rail remains absent`).toBe(false);
      expect(report.board.top, `${capture.label} accepted altar top`).toBeCloseTo(302, 0);
      expect(report.objective.top, `${capture.label} accepted objective top`).toBeCloseTo(59, 0);
      expect(report.progress.top, `${capture.label} accepted bouquet HUD top`).toBeCloseTo(125, 0);
      expect(report.mobileGreenhouse.top, `${capture.label} accepted greenhouse HUD top`).toBeCloseTo(218, 0);
    }

    await page.screenshot({ path: capture.screenshot, fullPage: false });

    if (capture.exerciseOpening) {
      const hints = page.locator("#board .tile.idle-hint");
      await expect(hints).toHaveCount(2);
      const pair = await hints.evaluateAll((tiles) => tiles.map((tile) => ({
        x: tile.dataset.x,
        y: tile.dataset.y
      })));
      await page.locator(`.tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`).click();
      await page.locator(`.tile[data-x="${pair[1].x}"][data-y="${pair[1].y}"]`).click();
      await expect.poll(() => page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return {
          moves: state.moves,
          targetCredit: (state.counts?.[1] || 0) + (state.counts?.[5] || 0),
          enabledTiles: document.querySelectorAll("#board .tile:not(:disabled)").length,
          tiles: document.querySelectorAll("#board .tile").length,
          tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || ""
        };
      }, SAVE_KEY), { timeout: 10000 }).toEqual({
        moves: 5,
        targetCredit: expect.any(Number),
        enabledTiles: 64,
        tiles: 64,
        tutorialCopy: expect.not.stringMatching(/^Swap the glowing flowers\.$/)
      });
      const opening = await page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return (state.counts?.[1] || 0) + (state.counts?.[5] || 0);
      }, SAVE_KEY);
      expect(opening, `${capture.label} instructed swap advances target objectives`).toBeGreaterThan(0);
    }

    expect(runtimeErrors, `${capture.label} runtime errors`).toEqual([]);
    expect(requestFailures, `${capture.label} request failures`).toEqual([]);
    await context.close();
  }
});
