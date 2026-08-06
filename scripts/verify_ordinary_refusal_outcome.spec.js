const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const REFUSAL_COPY = "No bloom \u2014 no match.";

const VIEWPORTS = [
  { label: "desktop", viewport: { width: 1280, height: 720 }, input: "keyboard" },
  { label: "desktop-reduced", viewport: { width: 1280, height: 720 }, input: "pointer", reduced: true },
  { label: "mobile390", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "mobile390-reduced", viewport: { width: 390, height: 844 }, input: "keyboard", mobile: true, reduced: true }
];

test.setTimeout(60000);

function intersects(first, second) {
  return first.left < second.right
    && first.right > second.left
    && first.top < second.bottom
    && first.bottom > second.top;
}

async function openOrdinaryRound(page, round, label) {
  await page.addInitScript(({ key, marker }) => {
    if (!sessionStorage.getItem(marker)) {
      localStorage.removeItem(key);
      sessionStorage.setItem(marker, "1");
    }
  }, { key: SAVE_KEY, marker: `ordinary-refusal-${label}-fresh` });
  await page.goto(`${BASE_URL}?ordinary-refusal=${label}-r${round}`, { waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await page.evaluate(({ key, round }) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    Object.assign(state, {
      currentRound: round,
      roundComplete: false,
      moves: round === 2 ? 8 : 7,
      counts: round === 2 ? [0, 0, 3, 0, 0, 0] : [3, 0, 0, 3, 0, 0],
      coins: round === 2 ? 20 : 50,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: round === 3,
      roundThreeConservatoryRaised: false,
      hasMadeValidMove: true,
      tutorialSkipped: true,
      tutorialActive: false,
      blackCandleLessonComplete: true,
      cursedThorns: [],
      clearedCursedThorns: round === 2 ? 3 : 0,
      restoredRoundTwoGuideMoves: 2,
      armedLineRelic: null,
      freshConservatorySettlement: false
    });
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: SAVE_KEY, round });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator("#board .tile[tabindex='0']")).toHaveCount(1);
}

async function findInvalidAdjacentPair(page) {
  return page.evaluate(() => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(-1));
    document.querySelectorAll("#board .tile").forEach((tile) => {
      board[Number(tile.dataset.y)][Number(tile.dataset.x)] = Number(tile.dataset.flowerId);
    });
    const endpointMatches = (next, x, y) => {
      const value = next[y][x];
      let horizontal = 1;
      let vertical = 1;
      for (let step = x - 1; step >= 0 && next[y][step] === value; step -= 1) horizontal += 1;
      for (let step = x + 1; step < 8 && next[y][step] === value; step += 1) horizontal += 1;
      for (let step = y - 1; step >= 0 && next[step][x] === value; step -= 1) vertical += 1;
      for (let step = y + 1; step < 8 && next[step][x] === value; step += 1) vertical += 1;
      return horizontal >= 3 || vertical >= 3;
    };
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 8 || ny >= 8 || board[y][x] === board[ny][nx]) continue;
          const next = board.map((row) => row.slice());
          [next[y][x], next[ny][nx]] = [next[ny][nx], next[y][x]];
          if (!endpointMatches(next, x, y) && !endpointMatches(next, nx, ny)) {
            return [{ x, y }, { x: nx, y: ny }];
          }
        }
      }
    }
    return null;
  });
}

async function findLegalAdjacentPair(page, excluded = []) {
  return page.evaluate((excludedPairs) => {
    const excludedKeys = new Set(excludedPairs.map((pair) => pair
      .map((cell) => `${cell.x},${cell.y}`)
      .sort()
      .join("|")));
    const board = Array.from({ length: 8 }, () => Array(8).fill(-1));
    document.querySelectorAll("#board .tile").forEach((tile) => {
      board[Number(tile.dataset.y)][Number(tile.dataset.x)] = Number(tile.dataset.flowerId);
    });
    const endpointMatches = (next, x, y) => {
      const value = next[y][x];
      let horizontal = 1;
      let vertical = 1;
      for (let step = x - 1; step >= 0 && next[y][step] === value; step -= 1) horizontal += 1;
      for (let step = x + 1; step < 8 && next[y][step] === value; step += 1) horizontal += 1;
      for (let step = y - 1; step >= 0 && next[step][x] === value; step -= 1) vertical += 1;
      for (let step = y + 1; step < 8 && next[step][x] === value; step += 1) vertical += 1;
      return horizontal >= 3 || vertical >= 3;
    };
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 8 || ny >= 8 || board[y][x] === board[ny][nx]) continue;
          const pair = [{ x, y }, { x: nx, y: ny }];
          const pairKey = pair.map((cell) => `${cell.x},${cell.y}`).sort().join("|");
          if (excludedKeys.has(pairKey)) continue;
          const next = board.map((row) => row.slice());
          [next[y][x], next[ny][nx]] = [next[ny][nx], next[y][x]];
          if (endpointMatches(next, x, y) || endpointMatches(next, nx, ny)) {
            return pair;
          }
        }
      }
    }
    return null;
  }, excluded);
}

async function establishOrdinaryAgency(page) {
  await page.waitForTimeout(800);
  if (await page.locator("#tutorialPanel").isVisible()) {
    await page.locator("#tutorialSkipBtn").click();
    await expect(page.locator("#tutorialPanel")).not.toBeVisible();
  }
  const rovingTile = page.locator("#board .tile[tabindex='0']");
  await rovingTile.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#board .tile.selected, #board .tile.sel")).toHaveCount(0);
  await expect(page.locator("#board .tile.idle-hint")).toHaveCount(0);
}

async function activatePair(page, pair, input) {
  const source = page.locator(`#tile-${pair[0].x}-${pair[0].y}`);
  const destination = page.locator(`#tile-${pair[1].x}-${pair[1].y}`);
  if (input === "keyboard") {
    await source.focus();
    await page.keyboard.press("Enter");
    await destination.focus();
    await page.keyboard.press("Space");
    return;
  }
  if (input === "touch") {
    for (const tile of [source, destination]) {
      const box = await tile.boundingBox();
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    }
    return;
  }
  await source.click();
  await destination.click();
}

async function stateReport(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return !node.hidden
        && style.display !== "none"
        && style.visibility !== "hidden"
        && rect.width > 0
        && rect.height > 0;
    };
    const rect = (node) => {
      if (!visible(node)) return null;
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
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    return {
      moves: state.moves,
      counts: state.counts,
      board: (state.board || []).map((row) => row.join(",")).join("|"),
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      cueVisible: visible(document.querySelector("#firstSwapCue")),
      cueRect: rect(document.querySelector("#firstSwapCue")),
      helpRect: rect(document.querySelector("#tutorialHelpBtn")),
      greenhouseRect: rect(document.querySelector("#mobileGreenhouseProgress")),
      boardRect: rect(document.querySelector("#board")),
      tutorialVisible: visible(document.querySelector("#tutorialPanel")),
      liveOwners: Array.from(document.querySelectorAll("[aria-live]"))
        .filter((node) => visible(node) && ["polite", "assertive"].includes(node.getAttribute("aria-live")))
        .map((node) => ({
          id: node.id,
          live: node.getAttribute("aria-live"),
          text: node.textContent.replace(/\s+/g, " ").trim()
        })),
      invalidIds: tiles.filter((tile) => tile.classList.contains("invalid-swap")).map((tile) => tile.id),
      invalidLabels: tiles.filter((tile) => tile.classList.contains("invalid-swap"))
        .map((tile) => tile.getAttribute("aria-label") || ""),
      selected: tiles.filter((tile) => tile.classList.contains("sel") || tile.classList.contains("selected")).length,
      rovingIds: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      focusedId: document.activeElement?.id || "",
      tileCount: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id),
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      viewport: { width: innerWidth, height: innerHeight },
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src)
    };
  }, SAVE_KEY);
}

for (const config of VIEWPORTS) {
  for (const round of [2, 3]) {
    test(`ordinary R${round} refusal has one settled owner on ${config.label}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: config.viewport,
        hasTouch: Boolean(config.mobile),
        isMobile: Boolean(config.mobile),
        reducedMotion: config.reduced ? "reduce" : "no-preference"
      });
      const page = await context.newPage();
      const errors = [];
      page.on("console", (message) => {
        if (["warning", "error"].includes(message.type())) errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("requestfailed", (request) => {
        const errorText = request.failure()?.errorText || "";
        // Board renders replace tile image nodes; only failures that survive that expected cancellation are defects.
        if (errorText !== "net::ERR_ABORTED") errors.push(`${request.url()} ${errorText}`);
      });

      try {
        await openOrdinaryRound(page, round, `${config.label}-r${round}`);
        await establishOrdinaryAgency(page);
        const pair = await findInvalidAdjacentPair(page);
        expect(pair, `${config.label} R${round} has an invalid adjacent pair`).toBeTruthy();
        const before = await stateReport(page);
        await activatePair(page, pair, config.input);
        await expect(page.locator("#board .tile.invalid-swap")).toHaveCount(2);
        const peak = await stateReport(page);
        const sourceId = `tile-${pair[0].x}-${pair[0].y}`;

        expect(peak.moves).toBe(before.moves);
        expect(peak.counts).toEqual(before.counts);
        expect(peak.board).toBe(before.board);
        expect(peak.selected).toBe(0);
        expect(peak.invalidIds).toHaveLength(2);
        expect(peak.invalidLabels.every((label) => label.split("invalid swap refused").length - 1 === 1)).toBe(true);
        expect(peak.cue).toBe(REFUSAL_COPY);
        expect(peak.tutorialVisible).toBe(false);
        expect(peak.liveOwners).toEqual([{ id: "firstSwapCue", live: "polite", text: REFUSAL_COPY }]);
        expect(peak.focusedId).toBe(sourceId);
        expect(peak.rovingIds).toEqual([sourceId]);
        expect(peak.tileCount).toBe(64);
        expect(peak.rows).toBe(8);
        expect(peak.scrollY).toBe(0);
        expect(peak.overflowX).toBe(false);
        expect(peak.overflowY).toBe(false);
        expect(peak.brokenImages).toEqual([]);
        expect(peak.boardRect.width).toBe(config.mobile ? 378 : 600);
        expect(peak.boardRect.height).toBe(config.mobile ? 378 : 600);
        expect(peak.cueRect.left).toBeGreaterThanOrEqual(1);
        expect(peak.cueRect.right).toBeLessThanOrEqual(peak.viewport.width - 1);
        expect(peak.cueRect.bottom).toBeLessThanOrEqual(peak.boardRect.top);
        expect(intersects(peak.cueRect, peak.helpRect)).toBe(false);
        expect(intersects(peak.helpRect, peak.boardRect)).toBe(false);
        if (config.mobile) {
          expect(peak.helpRect.width).toBeGreaterThanOrEqual(44);
          expect(peak.helpRect.height).toBeGreaterThanOrEqual(44);
          expect(intersects(peak.cueRect, peak.greenhouseRect)).toBe(false);
          expect(intersects(peak.helpRect, peak.greenhouseRect)).toBe(false);
        }

        if (config.label === "mobile390" && round === 2) {
          await page.screenshot({ path: "work/ordinary-refusal-mobile390-r2.png", fullPage: true });
        }
        if (config.label === "desktop" && round === 3) {
          await page.screenshot({ path: "work/ordinary-refusal-desktop-r3.png", fullPage: true });
        }

        await expect(page.locator("#board .tile.invalid-swap")).toHaveCount(0, { timeout: 3500 });
        await expect(page.locator("#firstSwapCue")).not.toHaveClass(/swap-refused/);
        await expect(page.locator("#firstSwapCue")).not.toHaveText(REFUSAL_COPY);
        const recovered = await stateReport(page);
        expect(recovered.moves).toBe(before.moves);
        expect(recovered.counts).toEqual(before.counts);
        expect(recovered.board).toBe(before.board);
        expect(recovered.focusedId).toBe(sourceId);
        expect(recovered.rovingIds).toEqual([sourceId]);

        const legalPair = await findLegalAdjacentPair(page, [pair]);
        expect(legalPair, `${config.label} R${round} has a valid recovery pair`).toBeTruthy();
        await activatePair(page, pair, config.input);
        await expect(page.locator("#board .tile.invalid-swap")).toHaveCount(2);
        await page.waitForTimeout(160);
        await activatePair(page, legalPair, config.input);
        await expect(page.locator("#board .tile.invalid-swap")).toHaveCount(0);
        await expect(page.locator("#board .tile[aria-label*='invalid swap refused']")).toHaveCount(0);
        await expect(page.locator("#firstSwapCue")).not.toHaveClass(/swap-refused/);
        await expect.poll(async () => (await stateReport(page)).moves).toBe(before.moves - 1);
        const accepted = await stateReport(page);
        expect(accepted.cue).not.toBe(REFUSAL_COPY);
        expect(accepted.focusedId).toBe(accepted.rovingIds[0]);
        expect(accepted.rovingIds).toHaveLength(1);
        expect(accepted.tileCount).toBe(64);
        expect(accepted.rows).toBe(8);
        await page.waitForTimeout(1300);
        const pastRefusalBoundary = await stateReport(page);
        expect(pastRefusalBoundary.moves).toBe(before.moves - 1);
        expect(pastRefusalBoundary.invalidIds).toEqual([]);
        expect(pastRefusalBoundary.invalidLabels).toEqual([]);
        expect(pastRefusalBoundary.cue).not.toBe(REFUSAL_COPY);
        expect(pastRefusalBoundary.focusedId).toBe(pastRefusalBoundary.rovingIds[0]);
        expect(pastRefusalBoundary.rovingIds).toHaveLength(1);
        expect(pastRefusalBoundary.tileCount).toBe(64);
        expect(pastRefusalBoundary.rows).toBe(8);
        expect(pastRefusalBoundary.overflowX).toBe(false);
        expect(pastRefusalBoundary.brokenImages).toEqual([]);
        if (config.label === "mobile390" && round === 2) {
          await page.screenshot({ path: "work/rapid-invalid-valid-mobile390-r2.png", fullPage: true });
        }
        if (config.label === "desktop" && round === 3) {
          await page.screenshot({ path: "work/rapid-invalid-valid-desktop-r3.png", fullPage: true });
        }
        await page.waitForFunction(() => Array.from(document.images).every((image) => {
          const rect = image.getBoundingClientRect();
          const style = getComputedStyle(image);
          const visible = style.display !== "none"
            && style.visibility !== "hidden"
            && rect.width > 0
            && rect.height > 0;
          return !visible || (image.complete && image.naturalWidth > 0);
        }));

        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator("#board .tile")).toHaveCount(64);
        const reloaded = await stateReport(page);
        expect(reloaded.moves).toBe(before.moves - 1);
        expect(reloaded.counts).toEqual(pastRefusalBoundary.counts);
        expect(reloaded.board).toBe(pastRefusalBoundary.board);
        expect(reloaded.invalidIds).toEqual([]);
        expect(reloaded.liveOwners.some((owner) => owner.text === REFUSAL_COPY)).toBe(false);
        expect(reloaded.tileCount).toBe(64);
        expect(reloaded.rows).toBe(8);
        expect(reloaded.overflowX).toBe(false);
        expect(reloaded.brokenImages).toEqual([]);
        expect(errors).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
}
