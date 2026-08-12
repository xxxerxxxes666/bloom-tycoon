const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const REFUSAL_COPY = "No bloom \u2014 no match.";
const OPENING_RECEIPT = "Thorn Rose +3, 3 of 8. Next: find 3 more.";

const CASES = [
  { label: "desktop-full-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "desktop-reduced-keyboard", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
  { label: "mobile390-full-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "mobile390-reduced-keyboard", viewport: { width: 390, height: 844 }, input: "keyboard", mobile: true, reduced: true }
];

test.setTimeout(90000);

function intersects(first, second) {
  return first.left < second.right
    && first.right > second.left
    && first.top < second.bottom
    && first.bottom > second.top;
}

async function activate(page, locator, input) {
  if (input === "keyboard") {
    await locator.focus();
    await page.keyboard.press("Enter");
    return;
  }
  if (input === "touch") {
    const box = await locator.boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    return;
  }
  await locator.click();
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
  await activate(page, source, input);
  await activate(page, destination, input);
}

async function findUnrelatedInvalidPair(page, guideIds) {
  return page.evaluate((excludedIds) => {
    const excluded = new Set(excludedIds);
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
          const sourceId = `tile-${x}-${y}`;
          const destinationId = `tile-${nx}-${ny}`;
          if (
            nx >= 8
            || ny >= 8
            || excluded.has(sourceId)
            || excluded.has(destinationId)
            || board[y][x] === board[ny][nx]
          ) {
            continue;
          }
          const next = board.map((row) => row.slice());
          [next[y][x], next[ny][nx]] = [next[ny][nx], next[y][x]];
          if (!endpointMatches(next, x, y) && !endpointMatches(next, nx, ny)) {
            return [{ x, y }, { x: nx, y: ny }];
          }
        }
      }
    }
    return null;
  }, guideIds);
}

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node || node.hidden) return false;
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && box.width > 0
        && box.height > 0;
    };
    const rect = (node) => {
      if (!visible(node)) return null;
      const box = node.getBoundingClientRect();
      return {
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        width: box.width,
        height: box.height
      };
    };
    const save = localStorage.getItem(key) || "";
    const state = JSON.parse(save || "{}");
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    return {
      save,
      moves: state.moves,
      counts: state.counts,
      board: (state.board || []).map((row) => row.join(",")).join("|"),
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id),
      invalid: tiles.filter((tile) => tile.classList.contains("invalid-swap")).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("selected") || tile.classList.contains("sel")).map((tile) => tile.id),
      focused: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      liveOwners: Array.from(document.querySelectorAll("[aria-live]"))
        .filter((node) => visible(node) && ["polite", "assertive"].includes(node.getAttribute("aria-live")))
        .map((node) => ({
          id: node.id,
          live: node.getAttribute("aria-live"),
          text: node.textContent.replace(/\s+/g, " ").trim()
        })),
      tileCount: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      boardRect: rect(document.querySelector("#board")),
      cueRect: rect(document.querySelector("#firstSwapCue")),
      helpRect: rect(document.querySelector("#tutorialHelpBtn")),
      scrollY,
      viewport: { width: innerWidth, height: innerHeight },
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src)
    };
  }, SAVE_KEY);
}

function expectHealthyFrame(state, config) {
  expect(state.tileCount).toBe(64);
  expect(state.rows).toBe(8);
  expect(state.roving).toHaveLength(1);
  expect(state.boardRect.width).toBe(config.mobile ? 378 : 600);
  expect(state.boardRect.height).toBe(config.mobile ? 378 : 600);
  expect(state.scrollY).toBe(0);
  expect(state.overflowX).toBe(false);
  expect(state.overflowY).toBe(false);
  expect(state.brokenImages).toEqual([]);
  if (state.cueRect) {
    expect(state.cueRect.left).toBeGreaterThanOrEqual(1);
    expect(state.cueRect.right).toBeLessThanOrEqual(state.viewport.width - 1);
    expect(state.cueRect.bottom).toBeLessThanOrEqual(state.boardRect.top);
  }
  if (state.cueRect && state.helpRect) {
    expect(intersects(state.cueRect, state.helpRect)).toBe(false);
  }
  if (state.helpRect) {
    expect(intersects(state.helpRect, state.boardRect)).toBe(false);
  }
}

for (const config of CASES) {
  test(`untouched opening refusal restores its real pair on ${config.label}`, async ({ browser }) => {
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
      if (errorText !== "net::ERR_ABORTED") errors.push(`${request.url()} ${errorText}`);
    });

    try {
      await page.addInitScript(({ key, marker }) => {
        if (!sessionStorage.getItem(marker)) {
          localStorage.removeItem(key);
          sessionStorage.setItem(marker, "1");
        }
      }, { key: SAVE_KEY, marker: `opening-refusal-${config.label}` });
      await page.goto(`${BASE_URL}?opening-refusal=${config.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2, { timeout: 3000 });
      const untouched = await report(page);
      expect(untouched.moves).toBe(6);
      expect(untouched.counts).toEqual([0, 0, 0, 0, 0, 0]);
      expect(untouched.hints).toHaveLength(2);
      expectHealthyFrame(untouched, config);
      const guideIds = untouched.hints;
      const guidePair = guideIds.map((id) => {
        const [, x, y] = id.match(/^tile-(\d+)-(\d+)$/).map(Number);
        return { x, y };
      });

      await activate(page, page.locator("#tutorialSkipBtn"), config.input);
      await expect(page.locator("#tutorialPanel")).not.toBeVisible();
      await page.waitForTimeout(360);
      const afterSkip = await report(page);
      expect(afterSkip.hints).toEqual(guideIds);
      expect(afterSkip.moves).toBe(6);
      expect(afterSkip.selected).toEqual([]);
      const stableOpeningSave = afterSkip.save;
      const stableOpeningBoard = afterSkip.board;

      const firstInvalidPair = await findUnrelatedInvalidPair(page, guideIds);
      expect(firstInvalidPair).toBeTruthy();
      await activatePair(page, firstInvalidPair, config.input);
      await expect(page.locator("#board .tile.invalid-swap")).toHaveCount(2);
      const interruptedRefusal = await report(page);
      expect(interruptedRefusal.cue).toBe(REFUSAL_COPY);
      expect(interruptedRefusal.liveOwners).toEqual([
        { id: "firstSwapCue", live: "polite", text: REFUSAL_COPY }
      ]);
      expect(interruptedRefusal.moves).toBe(6);
      expect(interruptedRefusal.counts).toEqual([0, 0, 0, 0, 0, 0]);
      expect(interruptedRefusal.board).toBe(stableOpeningBoard);
      expect(interruptedRefusal.save).toBe(stableOpeningSave);
      expect(interruptedRefusal.selected).toEqual([]);
      expectHealthyFrame(interruptedRefusal, config);

      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2, { timeout: 3000 });
      const reloaded = await report(page);
      expect(reloaded.hints).toEqual(guideIds);
      expect(reloaded.invalid).toEqual([]);
      expect(reloaded.selected).toEqual([]);
      expect(reloaded.moves).toBe(6);
      expect(reloaded.counts).toEqual([0, 0, 0, 0, 0, 0]);
      expect(reloaded.board).toBe(stableOpeningBoard);
      expect(reloaded.save).toBe(stableOpeningSave);
      expect(reloaded.focused).toBe(guideIds[0]);
      expect(reloaded.roving).toEqual([guideIds[0]]);
      expectHealthyFrame(reloaded, config);

      const returnCue = reloaded.cue;
      const secondInvalidPair = await findUnrelatedInvalidPair(page, guideIds);
      expect(secondInvalidPair).toBeTruthy();
      await activatePair(page, secondInvalidPair, config.input);
      await expect(page.locator("#board .tile.invalid-swap")).toHaveCount(2);
      await expect(page.locator("#board .tile.invalid-swap")).toHaveCount(0, { timeout: 3500 });
      const recovered = await report(page);
      expect(recovered.cue).toBe(returnCue);
      expect(recovered.hints).toEqual(guideIds);
      expect(recovered.invalid).toEqual([]);
      expect(recovered.selected).toEqual([]);
      expect(recovered.moves).toBe(6);
      expect(recovered.counts).toEqual([0, 0, 0, 0, 0, 0]);
      expect(recovered.board).toBe(stableOpeningBoard);
      expect(recovered.save).toBe(stableOpeningSave);
      expect(recovered.focused).toBe(guideIds[0]);
      expect(recovered.roving).toEqual([guideIds[0]]);
      expect(recovered.liveOwners).toEqual([
        { id: "firstSwapCue", live: "polite", text: returnCue }
      ]);
      expectHealthyFrame(recovered, config);

      await activatePair(page, guidePair, config.input);
      await expect.poll(async () => (await report(page)).moves).toBe(5);
      await expect(page.locator("#firstSwapCue")).toHaveText(OPENING_RECEIPT, { timeout: 4000 });
      const committed = await report(page);
      expect(committed.counts).toEqual([0, 0, 0, 0, 0, 3]);
      expect(committed.selected).toEqual([]);
      expect(committed.invalid).toEqual([]);
      expect(committed.liveOwners).toEqual([
        { id: "firstSwapCue", live: "polite", text: OPENING_RECEIPT }
      ]);
      expect(committed.focused).toBe(committed.roving[0]);
      expectHealthyFrame(committed, config);
      const committedSave = committed.save;
      const committedBoard = committed.board;

      await page.reload({ waitUntil: "networkidle" });
      const finalState = await report(page);
      expect(finalState.moves).toBe(5);
      expect(finalState.counts).toEqual([0, 0, 0, 0, 0, 3]);
      expect(finalState.board).toBe(committedBoard);
      expect(finalState.save).toBe(committedSave);
      expect(finalState.cue).not.toBe(REFUSAL_COPY);
      expect(finalState.cue).not.toBe(OPENING_RECEIPT);
      expect(finalState.selected).toEqual([]);
      expect(finalState.invalid).toEqual([]);
      expect(finalState.focused).toBe("");
      expect(finalState.roving).toHaveLength(1);
      expectHealthyFrame(finalState, config);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
