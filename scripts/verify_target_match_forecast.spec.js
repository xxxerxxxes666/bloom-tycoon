const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

test.setTimeout(180000);

async function openFresh(page, label) {
  await page.goto(`${BASE_URL}?target-match-forecast=${label}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
}

async function hintedPair(page) {
  return page.locator("#board .tile.idle-hint").evaluateAll((tiles) => tiles.map((tile) => ({
    x: Number(tile.dataset.x),
    y: Number(tile.dataset.y)
  })));
}

async function activatePair(page, pair, input) {
  const tile = (cell) => page.locator(
    `#board .tile[data-x="${cell.x}"][data-y="${cell.y}"]`
  );
  if (input === "touch") {
    await tile(pair[0]).tap();
    await tile(pair[1]).tap();
    return;
  }
  if (input === "keyboard") {
    await tile(pair[0]).focus();
    await page.keyboard.press("Enter");
    await expect(tile(pair[1])).toBeFocused();
    await page.keyboard.press("Enter");
    return;
  }
  await tile(pair[0]).click();
  await tile(pair[1]).click();
}

async function waitForSettledBoard(page) {
  await page.waitForFunction(() => {
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    return tiles.length === 64 && tiles.every((tile) => !tile.disabled);
  }, { timeout: 10000 });
}

async function completeOpening(page, input) {
  const opening = await hintedPair(page);
  expect(opening).toHaveLength(2);
  await activatePair(page, opening, input);
  await waitForSettledBoard(page);
  await expect(page.locator("#tutorialCopy")).toHaveText("Find 3 Thorn Roses.");
  await expect(page.locator(".target-match-forecast-guide, .tile.target-match-result")).toHaveCount(0);
}

async function expectedTargetResult(page, pair, targetFlowerId = 5) {
  return page.evaluate(({ pair: [a, b], targetFlowerId }) => {
    const grid = Array.from({ length: 8 }, () => Array(8).fill(-1));
    document.querySelectorAll("#board .tile").forEach((tile) => {
      grid[Number(tile.dataset.y)][Number(tile.dataset.x)] = Number(tile.dataset.flowerId);
    });
    [grid[a.y][a.x], grid[b.y][b.x]] = [grid[b.y][b.x], grid[a.y][a.x]];
    const result = new Set();
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        if (grid[y][x] !== targetFlowerId) continue;
        let horizontal = 0;
        while (x + horizontal < 8 && grid[y][x + horizontal] === targetFlowerId) horizontal += 1;
        let vertical = 0;
        while (y + vertical < 8 && grid[y + vertical][x] === targetFlowerId) vertical += 1;
        if (horizontal >= 3) {
          for (let offset = 0; offset < horizontal; offset += 1) result.add(`${x + offset},${y}`);
        }
        if (vertical >= 3) {
          for (let offset = 0; offset < vertical; offset += 1) result.add(`${x},${y + offset}`);
        }
      }
    }
    return [...result].sort();
  }, { pair, targetFlowerId });
}

async function forecastReport(page) {
  return page.evaluate(() => {
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const cells = Array.from(document.querySelectorAll("#board .tile.target-match-result"));
    const endpoints = Array.from(document.querySelectorAll("#board .tile.target-match-swap-endpoint"));
    const guide = document.querySelector("#board .target-match-forecast-guide");
    const causalVerb = guide?.querySelector(".target-match-causal-verb");
    const guideRect = guide?.getBoundingClientRect();
    const verbRect = causalVerb?.getBoundingClientRect();
    const receiver = document.querySelector(
      '.live-bouquet-ingredient[data-flower-id="5"][data-receiver="true"]'
    ) || document.querySelector('.live-bouquet-ingredient[data-flower-id="5"]');
    const boardRect = document.querySelector("#board").getBoundingClientRect();
    return {
      cue: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      boardCue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      bodyTarget: document.body.dataset.targetMatchForecast || "",
      guide: guide ? {
        pointerEvents: getComputedStyle(guide).pointerEvents,
        target: guide.dataset.targetFlowerId,
        cells: guide.dataset.resultCells.split(" ").filter(Boolean).sort(),
        endpoints: guide.dataset.swapEndpoints.split(" ").filter(Boolean).sort(),
        orientation: guide.dataset.orientation,
        text: guide.textContent.trim()
      } : null,
      geometry: guideRect && verbRect ? {
        board: boardRect.toJSON(),
        guide: guideRect.toJSON(),
        plate: verbRect.toJSON(),
        words: Array.from(causalVerb.querySelectorAll("span"), (word) => ({
          text: word.textContent.trim(),
          rect: word.getBoundingClientRect().toJSON()
        }))
      } : null,
      endpoints: endpoints.map((tile) => ({
        key: `${tile.dataset.x},${tile.dataset.y}`,
        role: tile.dataset.targetMatchSwapRole,
        result: tile.dataset.targetMatchResult === "true",
        pointerEvents: getComputedStyle(tile.querySelector(".target-match-endpoint-mark")).pointerEvents
      })).sort((a, b) => a.key.localeCompare(b.key)),
      cells: cells.map((tile) => ({
        key: `${tile.dataset.x},${tile.dataset.y}`,
        flowerId: Number(tile.dataset.targetMatchFlowerId),
        incoming: tile.dataset.targetMatchIncoming === "true",
        markPointerEvents: getComputedStyle(tile.querySelector(".target-match-result-mark")).pointerEvents
      })).sort((a, b) => a.key.localeCompare(b.key)),
      objectiveReceiver: document.querySelector('.objective-target[data-flower-id="5"]')
        ?.classList.contains("target-match-receiver") || false,
      bouquetReceiver: Boolean(receiver?.classList.contains("target-match-receiver")),
      bouquetReceiverVisible: visible(receiver),
      tiles: document.querySelectorAll("#board .tile").length,
      rows: new Set(Array.from(document.querySelectorAll("#board .tile"), (tile) => tile.dataset.y)).size,
      boardBottom: boardRect.bottom,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  });
}

async function expectForecast(page, label) {
  await expect(page.locator("#board .target-match-forecast-guide")).toHaveCount(1, { timeout: 15000 });
  const pair = await hintedPair(page);
  expect(pair, `${label} exact actionable pair`).toHaveLength(2);
  const expected = await expectedTargetResult(page, pair);
  expect(expected.length, `${label} useful Thorn result`).toBeGreaterThanOrEqual(3);
  const report = await forecastReport(page);
  expect(report.cue, `${label} concise truthful cue`).toBe("Match Thorn Rose.");
  expect(report.bodyTarget).toBe("Thorn Rose");
  expect(report.guide).toMatchObject({ pointerEvents: "none", target: "5", text: "SWAPGATHER" });
  expectForecastPlateContained(report.geometry, `${label} causal plate`);
  expect(report.guide.cells, `${label} guide exact result identity`).toEqual(expected);
  expect(report.guide.endpoints, `${label} guide exact endpoints`).toEqual(
    pair.map((cell) => `${cell.x},${cell.y}`).sort()
  );
  expect(report.endpoints, `${label} two exchange roles`).toHaveLength(2);
  expect(report.endpoints.map((entry) => entry.role).sort()).toEqual(["destination", "source"]);
  expect(report.endpoints.every((entry) => entry.pointerEvents === "none")).toBe(true);
  expect(report.cells.map((entry) => entry.key), `${label} only exact future run`).toEqual(expected);
  expect(report.cells.every((entry) => entry.flowerId === 5 && entry.markPointerEvents === "none")).toBe(true);
  expect(report.cells.filter((entry) => entry.incoming), `${label} moved Thorn ghost`).toHaveLength(1);
  expect(report.objectiveReceiver, `${label} objective target shares receiver grammar`).toBe(true);
  expect(report.bouquetReceiverVisible, `${label} live bouquet Thorn receiver exists`).toBe(true);
  expect(report.bouquetReceiver, `${label} live bouquet receiver is forecast consequence`).toBe(true);
  expect(report.tiles).toBe(64);
  expect(report.rows).toBe(8);
  expect(report.overflowX).toBe(false);
  expect(report.brokenImages).toEqual([]);
  return { pair, expected, report };
}

function expectForecastPlateContained(geometry, label) {
  expect(geometry, `${label} geometry exists`).not.toBeNull();
  const left = Math.max(geometry.board.left, geometry.guide.left);
  const right = Math.min(geometry.board.right, geometry.guide.right);
  expect(geometry.plate.left, `${label} clears left altar edge`).toBeGreaterThanOrEqual(left + .9);
  expect(geometry.plate.right, `${label} clears right altar edge`).toBeLessThanOrEqual(right - .9);
  expect(geometry.words.map((word) => word.text), `${label} keeps both words`).toEqual(["SWAP", "GATHER"]);
  geometry.words.forEach((word) => {
    expect(word.rect.left, `${label} ${word.text} left edge`).toBeGreaterThanOrEqual(geometry.plate.left);
    expect(word.rect.right, `${label} ${word.text} right edge`).toBeLessThanOrEqual(geometry.plate.right);
  });
}

async function tileRects(page, keys) {
  return page.evaluate((keys) => Object.fromEntries(keys.map((key) => {
    const [x, y] = key.split(",");
    const rect = document.querySelector(`#board .tile[data-x="${x}"][data-y="${y}"]`).getBoundingClientRect();
    return [key, [rect.x, rect.y, rect.width, rect.height].map((value) => Number(value.toFixed(3)))];
  })), keys);
}

for (const config of [
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "mobile390-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true }
]) {
  test(`Round 1 target forecast is exact, stable, and consequential on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: Boolean(config.mobile),
      isMobile: Boolean(config.mobile),
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
      await openFresh(page, config.label);
      expect((await forecastReport(page)).guide, `${config.label} opening remains endpoint-only`).toBeNull();
      await completeOpening(page, config.input);
      const { pair, expected, report } = await expectForecast(page, config.label);
      await page.screenshot({ path: `work/target-match-forecast-${config.label}.png`, fullPage: true });

      const geometryKeys = [...new Set([...pair.map((cell) => `${cell.x},${cell.y}`), ...expected])];
      const before = await tileRects(page, geometryKeys);
      await page.waitForTimeout(config.reduced ? 120 : 480);
      expect(await tileRects(page, geometryKeys), `${config.label} animation never moves hit targets`).toEqual(before);

      const source = page.locator(`#board .tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`);
      if (config.input === "touch") await source.tap();
      else if (config.input === "keyboard") {
        await source.focus();
        await page.keyboard.press("Enter");
      } else await source.click();
      await expect(page.locator(".target-match-forecast-guide, .tile.target-match-result, .target-match-receiver")).toHaveCount(0);
      await expect(page.locator("#board .tile.sel")).toHaveCount(1);
      expect(await tileRects(page, geometryKeys), `${config.label} selection rerender keeps geometry`).toEqual(before);

      const movesBefore = await page.locator(".moves-counter").textContent();
      const destination = page.locator(`#board .tile[data-x="${pair[1].x}"][data-y="${pair[1].y}"]`);
      if (config.input === "touch") await destination.tap();
      else if (config.input === "keyboard") {
        const dx = pair[1].x - pair[0].x;
        const dy = pair[1].y - pair[0].y;
        await page.keyboard.press(dx > 0 ? "ArrowRight" : dx < 0 ? "ArrowLeft" : dy > 0 ? "ArrowDown" : "ArrowUp");
      }
      else await destination.click();
      await expect(page.locator(".target-match-forecast-guide, .tile.target-match-result, .target-match-receiver")).toHaveCount(0);
      await waitForSettledBoard(page);
      const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
      expect(saved.moves, `${config.label} forecast activation spends exactly one`).toBe(4);
      expect(movesBefore, `${config.label} pre-activation budget`).toContain("5");
      expect(saved.counts[5], `${config.label} Thorn objective advances`).toBeGreaterThan(3);
      await expect(page.locator("#board .tile")).toHaveCount(64);
      if (config.mobile) {
        expect(report.boardBottom, `${config.label} all rows remain in core viewport`).toBeLessThanOrEqual(844);
      }
      await page.screenshot({ path: `work/target-match-forecast-${config.label}-settled.png`, fullPage: true });
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("Round 1 forecast lifecycle retires and restores only the agency phase", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openFresh(page, "lifecycle");
  await completeOpening(page, "pointer");
  await expectForecast(page, "lifecycle initial");

  await page.locator("#tutorialSkipBtn").click();
  await expect(page.locator(".target-match-forecast-guide, .tile.target-match-result, .target-match-receiver")).toHaveCount(0);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".target-match-forecast-guide, .tile.target-match-result, .target-match-receiver")).toHaveCount(0);

  await page.locator("#tutorialHelpBtn").click();
  await expect(page.locator("#tutorialCopy")).toHaveText("Find 3 Thorn Roses.");
  await expect(page.locator(".target-match-forecast-guide")).toHaveCount(0);
  await expectForecast(page, "lifecycle Help replay");

  const pair = await hintedPair(page);
  const wrong = await page.evaluate((pair) => Array.from(document.querySelectorAll("#board .tile"))
    .map((tile) => ({ x: Number(tile.dataset.x), y: Number(tile.dataset.y) }))
    .find((cell) => !pair.some((hint) => hint.x === cell.x && hint.y === cell.y)), pair);
  await page.locator(`#board .tile[data-x="${wrong.x}"][data-y="${wrong.y}"]`).click();
  await expect(page.locator(".target-match-forecast-guide, .tile.target-match-result, .target-match-receiver")).toHaveCount(0);
  expect(JSON.parse(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).moves).toBe(5);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#tutorialCopy")).toHaveText("Find 3 Thorn Roses.");
  await expectForecast(page, "lifecycle reload");

  const invalidPair = await page.evaluate(() => {
    const values = new Map(Array.from(document.querySelectorAll("#board .tile"), (tile) => [
      `${tile.dataset.x},${tile.dataset.y}`, Number(tile.dataset.flowerId)
    ]));
    const grid = Array.from({ length: 8 }, (_, y) => Array.from({ length: 8 }, (_, x) => values.get(`${x},${y}`)));
    const hasMatch = (a, b) => {
      [grid[a.y][a.x], grid[b.y][b.x]] = [grid[b.y][b.x], grid[a.y][a.x]];
      const moved = new Set([`${a.x},${a.y}`, `${b.x},${b.y}`]);
      let legal = false;
      for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) {
        const value = grid[y][x]; let h = 0; let v = 0;
        while (x + h < 8 && grid[y][x + h] === value) h += 1;
        while (y + v < 8 && grid[y + v][x] === value) v += 1;
        if (h >= 3 && Array.from({ length: h }, (_, i) => `${x + i},${y}`).some((key) => moved.has(key))) legal = true;
        if (v >= 3 && Array.from({ length: v }, (_, i) => `${x},${y + i}`).some((key) => moved.has(key))) legal = true;
      }
      [grid[a.y][a.x], grid[b.y][b.x]] = [grid[b.y][b.x], grid[a.y][a.x]];
      return legal;
    };
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        for (const target of [{ x: x + 1, y }, { x, y: y + 1 }]) {
          if (target.x < 8 && target.y < 8 && !hasMatch({ x, y }, target)) {
            return [{ x, y }, target];
          }
        }
      }
    }
    return null;
  });
  expect(invalidPair, "deterministic board exposes an invalid adjacent pair").toHaveLength(2);
  await page.locator(`#board .tile[data-x="${invalidPair[0].x}"][data-y="${invalidPair[0].y}"]`).click();
  await page.locator(`#board .tile[data-x="${invalidPair[1].x}"][data-y="${invalidPair[1].y}"]`).click();
  await expect(page.locator(".tile.invalid-swap")).toHaveCount(2);
  await expect(page.locator(".target-match-forecast-guide, .tile.target-match-result, .target-match-receiver")).toHaveCount(0);
  await expect(page.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 2200 });
  await expect(page.locator("#board .tile")).toHaveCount(64);
});

for (const config of [
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "mobile390-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
  { label: "mobile390-touch-reduced", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
]) {
  test(`Round 1 target forecast recovers after one abandoned selection on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: Boolean(config.mobile),
      isMobile: Boolean(config.mobile),
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
      await openFresh(page, `selection-recovery-${config.label}`);
      await completeOpening(page, config.input);
      const initial = await expectForecast(page, `${config.label} before abandoned selection`);
      const hintedKeys = new Set(initial.pair.map((cell) => `${cell.x},${cell.y}`));
      const wrong = await page.locator("#board .tile").evaluateAll((tiles, keys) => {
        const hints = new Set(keys);
        const tile = tiles.find((candidate) => !hints.has(`${candidate.dataset.x},${candidate.dataset.y}`));
        return { x: Number(tile.dataset.x), y: Number(tile.dataset.y) };
      }, [...hintedKeys]);
      const wrongTile = page.locator(`#board .tile[data-x="${wrong.x}"][data-y="${wrong.y}"]`);
      if (config.input === "touch") {
        await wrongTile.tap();
      } else if (config.input === "keyboard") {
        await wrongTile.focus();
        await page.keyboard.press("Enter");
      } else {
        await wrongTile.click();
      }

      await expect(page.locator(".target-match-forecast-guide, .first-action-swap-guide, .tile.idle-hint")).toHaveCount(0);
      await expect(wrongTile).toHaveClass(/\bsel\b/);
      await expect(wrongTile).toBeFocused();
      const selectedSave = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
      expect(selectedSave.moves).toBe(5);
      expect(selectedSave.counts[5]).toBe(3);

      await page.waitForTimeout(6000);
      await expect(page.locator(".target-match-forecast-guide, .first-action-swap-guide, .tile.idle-hint")).toHaveCount(0);
      await expect(wrongTile).toHaveClass(/\bsel\b/);
      await page.locator("#board .target-match-forecast-guide").waitFor({ state: "attached", timeout: 6000 });
      await expect(page.locator("#board .tile.sel")).toHaveCount(0);
      await expect(wrongTile).toBeFocused();
      const recovered = await expectForecast(page, `${config.label} recovered forecast`);
      expect(recovered.pair.map((cell) => `${cell.x},${cell.y}`).sort()).toEqual(
        initial.pair.map((cell) => `${cell.x},${cell.y}`).sort()
      );
      await page.screenshot({
        path: `work/target-match-forecast-selection-recovery-${config.label}.png`,
        fullPage: true
      });

      if (config.input === "keyboard") {
        const source = page.locator(
          `#board .tile[data-x="${recovered.pair[0].x}"][data-y="${recovered.pair[0].y}"]`
        );
        await source.focus();
        await page.keyboard.press("Enter");
        const dx = recovered.pair[1].x - recovered.pair[0].x;
        const dy = recovered.pair[1].y - recovered.pair[0].y;
        await page.keyboard.press(dx > 0 ? "ArrowRight" : dx < 0 ? "ArrowLeft" : dy > 0 ? "ArrowDown" : "ArrowUp");
      } else {
        await activatePair(page, recovered.pair, config.input);
      }
      await waitForSettledBoard(page);
      const settledSave = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
      expect(settledSave.moves).toBe(4);
      expect(settledSave.counts[5]).toBeGreaterThan(3);
      const settled = await forecastReport(page);
      expect(settled.tiles).toBe(64);
      expect(settled.rows).toBe(8);
      expect(settled.overflowX).toBe(false);
      expect(settled.brokenImages).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("Round 1 nonadjacent reselection restarts abandoned-selection recovery", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openFresh(page, "selection-recovery-reselection");
  await completeOpening(page, "pointer");
  const initial = await expectForecast(page, "reselection initial");
  const hintedKeys = new Set(initial.pair.map((cell) => `${cell.x},${cell.y}`));
  const wrong = await page.locator("#board .tile").evaluateAll((tiles, keys) => {
    const hints = new Set(keys);
    const candidates = tiles
      .filter((tile) => !hints.has(`${tile.dataset.x},${tile.dataset.y}`))
      .map((tile) => ({ x: Number(tile.dataset.x), y: Number(tile.dataset.y) }));
    const first = candidates[0];
    const second = candidates.find((cell) => Math.abs(cell.x - first.x) + Math.abs(cell.y - first.y) > 1);
    return [first, second];
  }, [...hintedKeys]);
  const tile = (cell) => page.locator(`#board .tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
  await tile(wrong[0]).click();
  await page.waitForTimeout(5600);
  await tile(wrong[1]).click();
  await page.waitForTimeout(1700);
  await expect(page.locator(".target-match-forecast-guide, .first-action-swap-guide, .tile.idle-hint")).toHaveCount(0);
  await expect(tile(wrong[1])).toHaveClass(/\bsel\b/);
  await expect(tile(wrong[1])).toBeFocused();
  await page.locator("#board .target-match-forecast-guide").waitFor({ state: "attached", timeout: 8000 });
  await expect(page.locator("#board .tile.sel")).toHaveCount(0);
  await expect(tile(wrong[1])).toBeFocused();
  await expectForecast(page, "reselection recovered forecast");
});

test("target forecast plate contains every edge placement and match orientation", async ({ browser }) => {
  test.setTimeout(300000);
  const seedContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const seedPage = await seedContext.newPage();
  await openFresh(seedPage, "edge-geometry-seed");
  await completeOpening(seedPage, "pointer");
  const seededForecast = await expectForecast(seedPage, "edge geometry seed");
  const savedState = await seedPage.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  const resultKeys = seededForecast.report.guide.cells;
  await seedContext.close();

  const viewports = [
    { label: "desktop", viewport: { width: 1280, height: 720 } },
    { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
  ];
  const fixtures = [
    {
      label: "left-vertical",
      cells: ["0,0", "0,1", "0,2"]
    },
    {
      label: "right-vertical",
      cells: ["7,0", "7,1", "7,2"]
    },
    {
      label: "left-horizontal",
      cells: ["0,4", "1,4", "2,4"]
    },
    {
      label: "right-horizontal",
      cells: ["5,4", "6,4", "7,4"]
    }
  ];

  for (const config of viewports) {
    for (const fixture of fixtures) {
      const context = await browser.newContext({
        viewport: config.viewport,
        hasTouch: Boolean(config.mobile),
        isMobile: Boolean(config.mobile)
      });
      const page = await context.newPage();
      try {
        await page.addInitScript(({ saveKey, savedState, resultKeys, fixtureCells }) => {
          localStorage.setItem(saveKey, savedState);
          const mappedCells = Object.fromEntries(resultKeys.map((key, index) => [key, fixtureCells[index]]));
          const nativeRect = Element.prototype.getBoundingClientRect;
          Element.prototype.getBoundingClientRect = function targetForecastEdgeRect() {
            if (this.matches?.("#board .tile")) {
              const key = `${this.dataset.x},${this.dataset.y}`;
              const mapped = mappedCells[key];
              if (mapped && mapped !== key) {
                const [x, y] = mapped.split(",");
                const proxy = document.querySelector(`#board .tile[data-x="${x}"][data-y="${y}"]`);
                if (proxy) return nativeRect.call(proxy);
              }
            }
            return nativeRect.call(this);
          };
        }, {
          saveKey: SAVE_KEY,
          savedState,
          resultKeys,
          fixtureCells: fixture.cells
        });
        await page.goto(`${BASE_URL}?target-match-forecast=edge-${config.label}-${fixture.label}`, {
          waitUntil: "networkidle"
        });
        await expect(
          page.locator("#board .target-match-forecast-guide"),
          `${config.label} ${fixture.label} forecast returns after fixture reload`
        ).toHaveCount(1, { timeout: 15000 });
        const geometry = (await forecastReport(page)).geometry;
        expectForecastPlateContained(geometry, `${config.label} ${fixture.label}`);
        const report = await forecastReport(page);
        expect(report.guide.pointerEvents).toBe("none");
        expect(report.tiles).toBe(64);
        expect(report.rows).toBe(8);
        expect(report.overflowX).toBe(false);
        expect(report.brokenImages).toEqual([]);
      } finally {
        await context.close();
      }
    }
  }
});
