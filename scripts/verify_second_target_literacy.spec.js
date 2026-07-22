const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

test.setTimeout(90000);

async function installLiteracyRecorder(page) {
  await page.addInitScript((saveKey) => {
    addEventListener("DOMContentLoaded", () => {
      window.__secondTargetLiteracyTrace = [];
      const sample = (reason) => {
        const saved = JSON.parse(localStorage.getItem(saveKey) || "{}");
        const literacyTiles = Array.from(document.querySelectorAll(".tile.target-literacy"));
        window.__secondTargetLiteracyTrace.push({
          time: Math.round(performance.now()),
          reason,
          moves: saved.moves,
          counts: saved.counts || [],
          literacy: document.body.dataset.targetLiteracy || "",
          literacyCells: literacyTiles.map((tile) => ({
            x: Number(tile.dataset.x),
            y: Number(tile.dataset.y),
            flowerId: Number(tile.dataset.flowerId)
          })),
          familySize: document.querySelectorAll('.tile[data-flower-id="1"]').length,
          objectiveLiteracy: document.querySelectorAll(
            '.objective-target.target-literacy[data-flower-id="1"]'
          ).length,
          hintTiles: document.querySelectorAll(".tile.idle-hint").length,
          guideOverlays: document.querySelectorAll(
            ".first-action-swap-guide, .swap-path-arrow"
          ).length,
          enabledTiles: document.querySelectorAll("#board .tile:not(:disabled)").length,
          cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
          tutorial: document.querySelector("#tutorialCopy")?.textContent.trim() || ""
        });
      };
      new MutationObserver(() => sample("mutation")).observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class", "data-target-literacy"]
      });
      window.__secondTargetLiteracyInterval = window.setInterval(
        () => sample("interval"),
        40
      );
      sample("installed");
    }, { once: true });
  }, SAVE_KEY);
}

async function openFresh(page, suffix) {
  await page.goto(`${BASE_URL}?second-target-literacy=${suffix}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
}

async function savedState(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}"), SAVE_KEY);
}

async function loadSettledThornBoundary(page) {
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.counts = [0, 0, 0, 0, 0, 5];
    state.moves = 5;
    state.hasMadeValidMove = true;
    state.tutorialSkipped = false;
    state.tutorialActive = true;
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator(".tile.target-literacy, .objective-target.target-literacy"))
    .toHaveCount(0, { timeout: 3000 });
}

async function targetUsefulPairs(page, flowerId) {
  return page.evaluate((wantedFlowerId) => {
    const size = 8;
    const board = Array.from({ length: size }, (_, y) => (
      Array.from({ length: size }, (_, x) => Number(
        document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`).dataset.flowerId
      ))
    ));
    const matchedFlowerIds = () => {
      const ids = [];
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size;) {
          let end = x + 1;
          while (end < size && board[y][end] === board[y][x]) end += 1;
          if (end - x >= 3) ids.push(board[y][x]);
          x = end;
        }
      }
      for (let x = 0; x < size; x += 1) {
        for (let y = 0; y < size;) {
          let end = y + 1;
          while (end < size && board[end][x] === board[y][x]) end += 1;
          if (end - y >= 3) ids.push(board[y][x]);
          y = end;
        }
      }
      return ids;
    };
    const pairs = [];
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= size || ny >= size) continue;
          [board[y][x], board[ny][nx]] = [board[ny][nx], board[y][x]];
          const useful = matchedFlowerIds().includes(wantedFlowerId);
          [board[y][x], board[ny][nx]] = [board[ny][nx], board[y][x]];
          if (useful) pairs.push([{ x, y }, { x: nx, y: ny }]);
        }
      }
    }
    return pairs;
  }, flowerId);
}

async function clickPair(page, pair) {
  const before = await savedState(page);
  for (const cell of pair) {
    await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).click();
  }
  await page.waitForFunction(({ key, moves }) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    return state.moves === moves - 1
      && tiles.length === 64
      && tiles.every((tile) => !tile.disabled);
  }, { key: SAVE_KEY, moves: before.moves }, { timeout: 8000 });
}

async function activatePair(page, pair, input = "pointer") {
  const before = await savedState(page);
  const tile = (cell) => page.locator(
    `.tile[data-x="${cell.x}"][data-y="${cell.y}"]`
  );
  for (const cell of pair) {
    if (input === "keyboard") {
      await tile(cell).focus();
      await page.keyboard.press("Enter");
    } else if (input === "touch") {
      await tile(cell).tap();
    } else {
      await tile(cell).click();
    }
  }
  await page.waitForFunction(({ key, moves }) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    return state.moves === moves - 1
      && tiles.length === 64
      && tiles.every((currentTile) => !currentTile.disabled);
  }, { key: SAVE_KEY, moves: before.moves }, { timeout: 8000 });
}

async function findInvalidAdjacentPair(page) {
  return page.evaluate(() => {
    const size = 8;
    const board = Array.from({ length: size }, (_, y) => (
      Array.from({ length: size }, (_, x) => Number(
        document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`).dataset.flowerId
      ))
    ));
    const hasMatch = () => {
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size - 2; x += 1) {
          if (board[y][x] === board[y][x + 1] && board[y][x] === board[y][x + 2]) return true;
        }
      }
      for (let x = 0; x < size; x += 1) {
        for (let y = 0; y < size - 2; y += 1) {
          if (board[y][x] === board[y + 1][x] && board[y][x] === board[y + 2][x]) return true;
        }
      }
      return false;
    };
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= size || ny >= size) continue;
          [board[y][x], board[ny][nx]] = [board[ny][nx], board[y][x]];
          const legal = hasMatch();
          [board[y][x], board[ny][nx]] = [board[ny][nx], board[y][x]];
          if (!legal) return [{ x, y }, { x: nx, y: ny }];
        }
      }
    }
    return null;
  });
}

async function layoutReport(page) {
  return page.evaluate(() => {
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const rects = tiles.map((tile) => tile.getBoundingClientRect());
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
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      completeRows: new Set(rects
        .filter((rect) => rect.top >= -1 && rect.bottom <= innerHeight + 1)
        .map((rect) => Math.round(rect.top))).size,
      boardBottom: Math.round(document.querySelector("#board").getBoundingClientRect().bottom),
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
      enabledTiles: document.querySelectorAll("#board .tile:not(:disabled)").length
    };
  });
}

async function assertBoneLiteracyPeak(page, label, reduced) {
  await expect(page.locator("body")).toHaveAttribute("data-target-literacy", "Bone Star");
  const peak = await page.evaluate(() => {
    const trace = window.__secondTargetLiteracyTrace || [];
    return trace.find((entry) => (
      entry.counts[5] >= 8
      && entry.counts[1] < 6
      && entry.literacy === "Bone Star"
      && entry.literacyCells.length > 0
    ));
  });
  expect(peak, `${label} recorder catches Bone Star peak`).toBeTruthy();
  expect(peak.literacyCells, `${label} all current Bone Stars`).toHaveLength(peak.familySize);
  expect(peak.literacyCells.every((cell) => cell.flowerId === 1), `${label} only Bone Stars`).toBe(true);
  expect(peak.objectiveLiteracy, `${label} one objective echo`).toBe(1);
  expect(peak.hintTiles, `${label} no exact hinted tiles at peak`).toBe(0);
  expect(peak.guideOverlays, `${label} no exact guide at peak`).toBe(0);
  expect(peak.enabledTiles, `${label} input stays enabled`).toBe(64);
  expect(peak.tutorial, `${label} literal family cue`).toBe("Find Bone Stars.");
  const literacyStyle = await page.locator('.tile.target-literacy[data-flower-id="1"]').first()
    .evaluate((tile) => ({
      outline: getComputedStyle(tile).outlineStyle,
      duration: Number.parseFloat(getComputedStyle(tile, "::after").animationDuration)
    }));
  expect(literacyStyle.outline, `${label} bounded static outline`).toBe("solid");
  if (reduced) {
    expect(literacyStyle.duration, `${label} reduced motion has no pulse`).toBeLessThanOrEqual(0.001);
  }
}

test("authoritative Thorn completion hands the unfinished Bone Star family to the player", async ({ page }) => {
  await installLiteracyRecorder(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openFresh(page, "desktop-red");

  const fresh = await savedState(page);
  expect(fresh.moves).toBe(6);
  expect(fresh.counts).toEqual([0, 0, 0, 0, 0, 0]);
  await expect(page.locator('.objective-target[data-flower-id="5"]')).toContainText("0/8");
  await expect(page.locator('.objective-target[data-flower-id="1"]')).toContainText("0/6");
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 1000 });

  await loadSettledThornBoundary(page);
  const thornPair = (await targetUsefulPairs(page, 5))[0];
  expect(thornPair).toHaveLength(2);
  await clickPair(page, thornPair);

  const completedThorn = await savedState(page);
  expect(completedThorn.moves).toBe(4);
  expect(completedThorn.counts[5]).toBeGreaterThanOrEqual(8);
  expect(completedThorn.counts[1]).toBeLessThan(6);

  await expect(page.locator("body")).toHaveAttribute("data-target-literacy", "Bone Star");
  const peak = await page.evaluate(() => {
    const trace = window.__secondTargetLiteracyTrace || [];
    return trace.find((entry) => (
      entry.counts[5] >= 8
      && entry.counts[1] < 6
      && entry.literacy === "Bone Star"
      && entry.literacyCells.length > 0
    ));
  });
  expect(peak, "MutationObserver/interval recorder catches the Bone Star literacy peak").toBeTruthy();
  expect(peak.literacyCells).toHaveLength(peak.familySize);
  expect(peak.literacyCells.every((cell) => cell.flowerId === 1)).toBe(true);
  expect(peak.objectiveLiteracy).toBe(1);
  expect(peak.hintTiles).toBe(0);
  expect(peak.guideOverlays).toBe(0);
  expect(peak.enabledTiles).toBe(64);
  expect(peak.tutorial).toBe("Find Bone Stars.");

  await page.screenshot({ path: "work/bone-literacy-desktop-full-peak.png", fullPage: true });
  await expect(page.locator(".tile.target-literacy, .objective-target.target-literacy"))
    .toHaveCount(0, { timeout: 3000 });
  await expect(page.locator(".tile.idle-hint, .first-action-swap-guide, .swap-path-arrow"))
    .toHaveCount(0);
  await page.screenshot({ path: "work/bone-literacy-desktop-full-discovery.png", fullPage: true });

  const beforeBoneMove = await savedState(page);
  const bonePair = (await targetUsefulPairs(page, 1))[0];
  expect(bonePair, "a Bone Star match is discoverable without the hint").toHaveLength(2);
  await activatePair(page, bonePair, "pointer");
  const afterBoneMove = await savedState(page);
  expect(afterBoneMove.moves).toBe(beforeBoneMove.moves - 1);
  expect(afterBoneMove.counts[1]).toBeGreaterThan(beforeBoneMove.counts[1]);
  await expect(page.locator(".tile.target-literacy, .objective-target.target-literacy")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveAttribute("data-target-literacy", /.+/);
  await expect(page.locator("#firstSwapCue")).toContainText("Black Candle Vine");
  await expect(page.locator("#tutorialCopy")).toHaveText("Match 4 arms Black Candle Vine.");
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2);
});

for (const config of [
  {
    label: "mobile390-full",
    viewport: { width: 390, height: 844 },
    input: "touch",
    mobile: true,
    reduced: false
  },
  {
    label: "desktop-reduced",
    viewport: { width: 1280, height: 720 },
    input: "keyboard",
    mobile: false,
    reduced: true
  },
  {
    label: "mobile390-reduced",
    viewport: { width: 390, height: 844 },
    input: "touch",
    mobile: true,
    reduced: true
  }
]) {
  test(`Bone Star literacy remains bounded and actionable on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: config.mobile,
      isMobile: config.mobile,
      reducedMotion: config.reduced ? "reduce" : "no-preference"
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
      await installLiteracyRecorder(page);
      await openFresh(page, config.label);
      await loadSettledThornBoundary(page);
      const thornPair = (await targetUsefulPairs(page, 5))[0];
      expect(thornPair, `${config.label} Thorn completion pair`).toHaveLength(2);
      await activatePair(page, thornPair, config.input);
      await assertBoneLiteracyPeak(page, config.label, config.reduced);

      const peakLayout = await layoutReport(page);
      expect(peakLayout).toMatchObject({
        tiles: 64,
        rows: 8,
        completeRows: 8,
        overflowX: false,
        brokenImages: [],
        enabledTiles: 64
      });
      expect(peakLayout.boardBottom, `${config.label} board stays in viewport`)
        .toBeLessThanOrEqual(config.viewport.height);
      await page.screenshot({ path: `work/bone-literacy-${config.label}-peak.png`, fullPage: true });

      await expect(page.locator(".tile.target-literacy, .objective-target.target-literacy"))
        .toHaveCount(0, { timeout: 3000 });
      await expect(page.locator(".tile.idle-hint, .first-action-swap-guide, .swap-path-arrow"))
        .toHaveCount(0);
      await page.screenshot({ path: `work/bone-literacy-${config.label}-discovery.png`, fullPage: true });

      const beforeBoneMove = await savedState(page);
      const bonePair = (await targetUsefulPairs(page, 1))[0];
      expect(bonePair, `${config.label} discoverable Bone match`).toHaveLength(2);
      await activatePair(page, bonePair, config.input);
      const afterBoneMove = await savedState(page);
      expect(afterBoneMove.moves, `${config.label} ordinary Bone move spends once`)
        .toBe(beforeBoneMove.moves - 1);
      expect(afterBoneMove.counts[1], `${config.label} ordinary Bone move advances authority`)
        .toBeGreaterThan(beforeBoneMove.counts[1]);
      await expect(page.locator(".tile.target-literacy, .objective-target.target-literacy")).toHaveCount(0);
      await expect(page.locator("body")).not.toHaveAttribute("data-target-literacy", /.+/);
      await expect(page.locator("#firstSwapCue")).toContainText("Black Candle Vine");
      await expect(page.locator("#tutorialCopy")).toHaveText("Match 4 arms Black Candle Vine.");
      await expect(page.locator(".tile.idle-hint")).toHaveCount(2);

      const settledLayout = await layoutReport(page);
      expect(settledLayout).toMatchObject({
        tiles: 64,
        rows: 8,
        completeRows: 8,
        overflowX: false,
        brokenImages: [],
        enabledTiles: 64
      });
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("post-Thorn reloads skip stale celebration and retain the eventual useful Bone hint", async ({ page }) => {
  await installLiteracyRecorder(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openFresh(page, "reload-fallback");
  await loadSettledThornBoundary(page);
  const transitionStartedAt = Date.now();
  await clickPair(page, (await targetUsefulPairs(page, 5))[0]);
  const settledAuthority = await savedState(page);
  const boardSnapshot = JSON.stringify(settledAuthority.board);
  const focusBeforeHint = await page.evaluate(() => document.activeElement?.id || "");

  await expect(page.locator(".tile.target-literacy, .objective-target.target-literacy"))
    .toHaveCount(0, { timeout: 3000 });
  await page.waitForTimeout(3200);
  await expect(page.locator(".tile.idle-hint, .first-action-swap-guide, .swap-path-arrow"))
    .toHaveCount(0);
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 4000 });
  const hintElapsed = Date.now() - transitionStartedAt;
  expect(hintElapsed).toBeGreaterThanOrEqual(6200);
  expect(hintElapsed).toBeLessThan(9500);
  expect(await page.evaluate(() => document.activeElement?.id || "")).toBe(focusBeforeHint);
  expect((await savedState(page))).toMatchObject({
    moves: settledAuthority.moves,
    counts: settledAuthority.counts,
    coins: settledAuthority.coins
  });
  const hintedPair = await page.locator(".tile.idle-hint").evaluateAll((tiles) => (
    tiles.map((tile) => ({ x: Number(tile.dataset.x), y: Number(tile.dataset.y) }))
  ));
  const usefulBonePairs = await targetUsefulPairs(page, 1);
  const pairKey = (pair) => pair.map((cell) => `${cell.x},${cell.y}`).sort().join("|");
  expect(usefulBonePairs.map(pairKey)).toContain(pairKey(hintedPair));
  await expect(page.locator("#tutorialCopy")).toHaveText("Match Bone Star.");

  for (let reload = 0; reload < 2; reload += 1) {
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("#board .tile")).toHaveCount(64);
    const reloaded = await savedState(page);
    expect(reloaded.moves, `reload ${reload + 1} moves`).toBe(settledAuthority.moves);
    expect(reloaded.counts, `reload ${reload + 1} counts`).toEqual(settledAuthority.counts);
    expect(reloaded.coins, `reload ${reload + 1} economy`).toBe(settledAuthority.coins);
    expect(JSON.stringify(reloaded.board), `reload ${reload + 1} board`).toBe(boardSnapshot);
    await expect(page.locator("body")).not.toHaveAttribute("data-target-literacy", /.+/);
    await expect(page.locator(".tile.target-literacy, .objective-target.target-literacy"))
      .toHaveCount(0);
    await page.waitForTimeout(700);
    await expect(page.locator(".tile.idle-hint, .first-action-swap-guide, .swap-path-arrow"))
      .toHaveCount(0);
    const replayedLiteracy = await page.evaluate(() => (
      (window.__secondTargetLiteracyTrace || []).some((entry) => entry.literacy === "Bone Star")
    ));
    expect(replayedLiteracy, `reload ${reload + 1} does not replay Bone celebration`).toBe(false);
  }

  const focusBeforeReloadHint = await page.evaluate(() => document.activeElement?.id || "");
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 9000 });
  expect(await page.evaluate(() => document.activeElement?.id || "")).toBe(focusBeforeReloadHint);
  const reloadedHint = await page.locator(".tile.idle-hint").evaluateAll((tiles) => (
    tiles.map((tile) => ({ x: Number(tile.dataset.x), y: Number(tile.dataset.y) }))
  ));
  expect((await targetUsefulPairs(page, 1)).map(pairKey)).toContain(pairKey(reloadedHint));
});

test("invalid input, Help/Skip, failure, and Retry retire stale Bone literacy", async ({ page }) => {
  await installLiteracyRecorder(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openFresh(page, "cleanup-ownership");
  await loadSettledThornBoundary(page);
  await clickPair(page, (await targetUsefulPairs(page, 5))[0]);
  await expect(page.locator("body")).toHaveAttribute("data-target-literacy", "Bone Star");

  const beforeInvalid = await savedState(page);
  const invalidPair = await findInvalidAdjacentPair(page);
  expect(invalidPair).toHaveLength(2);
  for (const cell of invalidPair) {
    await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).click();
  }
  await expect(page.locator(".tile.invalid-swap")).toHaveCount(2, { timeout: 1500 });
  await expect(page.locator(".tile.target-literacy, .objective-target.target-literacy")).toHaveCount(0);
  await expect(page.locator(".tile.idle-hint, .first-action-swap-guide, .swap-path-arrow"))
    .toHaveCount(0);
  expect((await savedState(page)).moves).toBe(beforeInvalid.moves);
  await expect(page.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 2500 });

  await page.locator("#tutorialSkipBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  await expect(page.locator("body")).not.toHaveAttribute("data-target-literacy", /.+/);
  await page.locator("#tutorialHelpBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute("data-target-literacy", "Bone Star");
  await page.locator("#tutorialSkipBtn").click();
  await expect(page.locator(".tile.target-literacy, .objective-target.target-literacy")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveAttribute("data-target-literacy", /.+/);

  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.moves = 1;
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("body")).not.toHaveAttribute("data-target-literacy", /.+/);
  await page.locator("#shuffleBtn").click();
  await expect(page.locator("body")).toHaveClass(/focused-slice-failed/);
  await expect(page.locator("#renewBtn")).toBeVisible();
  await expect(page.locator(".tile.target-literacy, .objective-target.target-literacy")).toHaveCount(0);
  await expect(page.locator(".tile.idle-hint, .first-action-swap-guide, .swap-path-arrow"))
    .toHaveCount(0);

  await page.locator("#renewBtn").click();
  await expect(page.locator("#board .tile")).toHaveCount(64);
  const retried = await savedState(page);
  expect(retried.moves).toBe(6);
  expect(retried.counts).toEqual([0, 0, 0, 0, 0, 0]);
  expect(retried.roundComplete).toBe(false);
  await expect(page.locator("body")).not.toHaveClass(/focused-slice-failed/);
  await expect(page.locator("body")).not.toHaveAttribute("data-target-literacy", /.+/);
  await expect(page.locator(".tile.target-literacy, .objective-target.target-literacy")).toHaveCount(0);
});
