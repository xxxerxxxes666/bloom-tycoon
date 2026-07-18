const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

test.describe.configure({ mode: "serial" });
test.setTimeout(90000);

function baseState(round = 3, overrides = {}) {
  return {
    focusedEconomyVersion: 2,
    currentRound: round,
    roundComplete: false,
    roundOneRestored: round >= 2,
    roundTwoGreenhouseUpgraded: round >= 3,
    roundThreeConservatoryRaised: false,
    moves: round === 2 ? 9 : 8,
    coins: round === 2 ? 20 : 50,
    counts: [0, 0, 0, 0, 0, 0],
    clearedCursedThorns: 0,
    cursedThorns: round === 2
      ? [{ x: 0, y: 1, hp: 1 }, { x: 1, y: 1, hp: 1 }, { x: 2, y: 1, hp: 1 }]
      : [],
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: round === 2 ? 2 : 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true,
    ...overrides
  };
}

function deterministicLegalBoard() {
  const board = Array.from({ length: 8 }, (_, y) => (
    Array.from({ length: 8 }, (_, x) => (x + y * 2) % 6)
  ));
  const patch = [
    [0, 0, 1, 2],
    [2, 1, 0, 3],
    [3, 4, 2, 1],
    [1, 2, 3, 4]
  ];
  patch.forEach((row, y) => row.forEach((value, x) => {
    board[y][x] = value;
  }));
  return board;
}

function observeRuntime(page) {
  const errors = { console: [], page: [], request: [], response: [] };
  page.on("console", (message) => {
    if (message.type() === "error") errors.console.push(message.text());
  });
  page.on("pageerror", (error) => errors.page.push(error.message));
  page.on("requestfailed", (request) => errors.request.push(`${request.method()} ${request.url()}`));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.response.push(`${response.status()} ${response.url()}`);
  });
  return errors;
}

async function openFixture(page, label, state, options = {}) {
  await page.addInitScript(({ key, saved, seedLabel }) => {
    let seed = 0;
    for (let index = 0; index < seedLabel.length; index += 1) {
      seed = (seed * 31 + seedLabel.charCodeAt(index)) >>> 0;
    }
    Math.random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const marker = `dead-board-fixture:${seedLabel}`;
    if (!sessionStorage.getItem(marker)) {
      localStorage.setItem(key, JSON.stringify(saved));
      sessionStorage.setItem(marker, "ready");
    }
  }, { key: SAVE_KEY, saved: state, seedLabel: label });
  await page.goto(`${BASE_URL}?dead-board-reweave=${label}&bloomReview=1`, { waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect.poll(() => page.evaluate(() => window.__bloomReviewHooksEnabled)).toBe(true);
  await page.evaluate(() => {
    window.__reweaveTransitions = [];
    let phase = document.body.dataset.altarReweavePhase || "settled";
    const sample = () => {
      const next = document.body.dataset.altarReweavePhase || "settled";
      if (next !== phase) {
        phase = next;
        window.__reweaveTransitions.push({ phase: next, at: performance.now() });
      }
    };
    window.__reweaveObserver = new MutationObserver(sample);
    window.__reweaveObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "data-altar-reweave-phase"] });
  });
  const fixture = await page.evaluate((fixtureOptions) => (
    window.__bloomDeadBoardRecoveryFixture(fixtureOptions)
  ), options);
  expect(fixture, `${label} local recovery fixture`).toBeTruthy();
  expect(fixture.triggerPair).toHaveLength(2);
  return fixture;
}

function tile(page, cell) {
  return page.locator(`#board .tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
}

async function clickPair(page, pair) {
  await tile(page, pair[0]).click();
  await tile(page, pair[1]).click();
}

async function touchPair(page, pair) {
  await tile(page, pair[0]).tap();
  await tile(page, pair[1]).tap();
}

async function keyboardPair(page, pair) {
  await tile(page, pair[0]).focus();
  await page.keyboard.press("Enter");
  const dx = pair[1].x - pair[0].x;
  const dy = pair[1].y - pair[0].y;
  await page.keyboard.press(dx > 0 ? "ArrowRight" : dx < 0 ? "ArrowLeft" : dy > 0 ? "ArrowDown" : "ArrowUp");
}

async function waitForActivePhase(page) {
  await expect(page.locator("body")).toHaveClass(/altar-reweave-active/, { timeout: 7000 });
  await expect(page.locator(".altar-reweave-veil")).toHaveCount(1);
}

async function waitForGuidedControl(page) {
  await expect(page.locator("body")).not.toHaveClass(/altar-reweave-active/, { timeout: 7000 });
  await expect(page.locator("body")).toHaveClass(/post-recovery-guide/);
  await expect(page.locator("#board .tile:disabled")).toHaveCount(0);
  await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2);
  await expect(page.locator(".first-action-swap-guide, .swap-path-arrow")).toHaveCount(1);
}

async function savedState(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}"), SAVE_KEY);
}

async function boardReport(page) {
  return page.evaluate(() => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const boardRect = document.querySelector("#board")?.getBoundingClientRect();
    const cueRect = document.querySelector("#firstSwapCue")?.getBoundingClientRect();
    return {
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      disabled: tiles.filter((tile) => tile.disabled).length,
      guideCount: document.querySelectorAll(".first-action-swap-guide, .swap-path-arrow").length,
      idleHints: document.querySelectorAll("#board .tile.idle-hint").length,
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      cueVisible: visible(document.querySelector("#firstSwapCue")),
      phase: document.body.dataset.altarReweavePhase,
      sequence: Number(document.body.dataset.altarReweaveSequence || 0),
      competing: document.querySelectorAll(".cascade-wave-label, .board-particle, .tile.invalid-swap, .first-action-swap-guide, .swap-path-arrow").length,
      brokenImages: Array.from(document.images).filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src),
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      boardTop: boardRect?.top || 0,
      boardBottom: boardRect?.bottom || 0,
      boardWidth: boardRect?.width || 0,
      boardHeight: boardRect?.height || 0,
      cueRight: cueRect?.right || 0,
      cueOverlapsBoard: Boolean(
        cueRect
        && boardRect
        && Math.min(cueRect.right, boardRect.right) - Math.max(cueRect.left, boardRect.left) > 1
        && Math.min(cueRect.bottom, boardRect.bottom) - Math.max(cueRect.top, boardRect.top) > 1
      ),
      completeRowsInViewport: new Set(tiles.filter((tile) => {
        const rect = tile.getBoundingClientRect();
        return rect.top >= -1 && rect.bottom <= innerHeight + 1;
      }).map((tile) => tile.dataset.y)).size,
      board: tiles.map((tile) => Number(tile.dataset.flowerId))
    };
  });
}

async function guidedPair(page) {
  return page.locator("#board .tile.idle-hint").evaluateAll((tiles) => tiles.map((node) => ({
    x: Number(node.dataset.x),
    y: Number(node.dataset.y)
  })));
}

function expectNoRuntimeErrors(errors, label) {
  expect(errors.console, `${label} console errors`).toEqual([]);
  expect(errors.page, `${label} page errors`).toEqual([]);
  expect(errors.request, `${label} request failures`).toEqual([]);
  expect(errors.response, `${label} hard responses`).toEqual([]);
}

test("desktop click recovery presents one reweave and an objective-useful continuation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const errors = observeRuntime(page);
  const fixture = await openFixture(page, "desktop-click", baseState(3));
  const started = Date.now();
  await clickPair(page, fixture.triggerPair);
  await waitForActivePhase(page);
  const activeSaved = await savedState(page);
  const active = await boardReport(page);
  expect(active).toMatchObject({ tiles: 64, rows: 8, disabled: 64, cueVisible: true, phase: "active", sequence: 1, competing: 0, overflowX: false, brokenImages: [] });
  expect(active.cue).toBe("No moves — altar reweaving.");
  expect(active.boardBottom, "desktop active reweave keeps the full altar in view").toBeLessThanOrEqual(716);
  expect(active.boardWidth).toBeCloseTo(480, 0);
  expect(active.boardHeight).toBeCloseTo(480, 0);
  expect(active.cueOverlapsBoard, "desktop active reweave cue stays beside the altar").toBe(false);
  expect(activeSaved.moves).toBe(fixture.moves - 1);
  await page.screenshot({ path: "work/dead-board-reweave-desktop-active.png" });
  await waitForGuidedControl(page);
  const controlMs = Date.now() - started;
  const transitions = await page.evaluate(() => window.__reweaveTransitions || []);
  expect(transitions.map((entry) => entry.phase)).toEqual(["active", "guided"]);
  const phaseMs = transitions[1].at - transitions[0].at;
  expect(phaseMs).toBeGreaterThanOrEqual(700);
  expect(phaseMs).toBeLessThan(950);
  expect(controlMs).toBeLessThan(3000);
  const settledSaved = await savedState(page);
  const settled = await boardReport(page);
  expect(settled).toMatchObject({ tiles: 64, rows: 8, disabled: 0, guideCount: 1, idleHints: 2, cueVisible: true, phase: "guided", sequence: 1, overflowX: false, brokenImages: [] });
  expect(settled.cue).toContain("Path restored");
  expect(settled.boardBottom, "desktop guided reweave keeps the full altar in view").toBeLessThanOrEqual(716);
  expect(settled.boardWidth).toBeCloseTo(480, 0);
  expect(settled.boardHeight).toBeCloseTo(480, 0);
  expect(settled.cueOverlapsBoard, "desktop guided cue stays beside the altar").toBe(false);
  expect(settledSaved).toMatchObject({
    moves: activeSaved.moves,
    coins: activeSaved.coins,
    counts: activeSaved.counts,
    cursedThorns: activeSaved.cursedThorns,
    clearedCursedThorns: activeSaved.clearedCursedThorns,
    armedLineRelic: activeSaved.armedLineRelic,
    roundOneRestored: activeSaved.roundOneRestored,
    roundTwoGreenhouseUpgraded: activeSaved.roundTwoGreenhouseUpgraded
  });
  await page.screenshot({ path: "work/dead-board-reweave-desktop-guided.png", fullPage: true });
  const progressBefore = settledSaved.counts.reduce((sum, value) => sum + value, 0);
  await clickPair(page, await guidedPair(page));
  await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 7000 });
  const exercised = await savedState(page);
  expect(exercised.moves).toBe(settledSaved.moves - 1);
  expect(exercised.counts.reduce((sum, value) => sum + value, 0)).toBeGreaterThan(progressBefore);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#board .tile:disabled")).toHaveCount(0);
  const reloaded = await savedState(page);
  expect(reloaded.moves).toBe(exercised.moves);
  expect(reloaded.counts).toEqual(exercised.counts);
  console.log(`dead-board desktop timing: ${JSON.stringify({ phaseMs, controlMs, transitions })}`);
  expectNoRuntimeErrors(errors, "desktop click recovery");
});

test("exact mobile touch preserves thorns and guides a thorn-useful continuation", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = observeRuntime(page);
  const fixture = await openFixture(page, "mobile-touch-thorns", baseState(2, {
    cursedThorns: [{ x: 0, y: 1, hp: 5 }, { x: 1, y: 1, hp: 5 }, { x: 2, y: 1, hp: 5 }]
  }), { preserveThorns: true });
  await touchPair(page, fixture.triggerPair);
  await waitForActivePhase(page);
  const authoritativeThorns = await savedState(page);
  await page.screenshot({ path: "work/dead-board-reweave-mobile390-active.png", fullPage: true });
  await waitForGuidedControl(page);
  const recovered = await savedState(page);
  const report = await boardReport(page);
  expect(recovered.cursedThorns).toEqual(authoritativeThorns.cursedThorns);
  expect(recovered.clearedCursedThorns).toBe(0);
  expect(report.completeRowsInViewport).toBe(8);
  expect(report.overflowX).toBe(false);
  expect(report.brokenImages).toEqual([]);
  expect(report.cue).toContain("Cursed Thorn");
  await page.screenshot({ path: "work/dead-board-reweave-mobile390-guided.png", fullPage: true });
  const beforeThorns = recovered.clearedCursedThorns;
  const beforeThornHp = recovered.cursedThorns.reduce((sum, thorn) => sum + thorn.hp, 0);
  await touchPair(page, await guidedPair(page));
  await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 7000 });
  const exercised = await savedState(page);
  expect(exercised.moves).toBe(recovered.moves - 1);
  const afterThornHp = exercised.cursedThorns.reduce((sum, thorn) => sum + thorn.hp, 0);
  expect(exercised.clearedCursedThorns > beforeThorns || afterThornHp < beforeThornHp).toBe(true);
  expectNoRuntimeErrors(errors, "mobile thorn recovery");
  await context.close();
});

test("keyboard recovery preserves an armed Black Candle and its lane guide wins", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const errors = observeRuntime(page);
  const relic = { x: 7, y: 7, direction: "horizontal", flowerId: 3 };
  const fixture = await openFixture(page, "keyboard-armed-relic", baseState(3, {
    board: deterministicLegalBoard(),
    armedLineRelic: relic
  }), { preserveArmedRelic: true });
  expect(fixture.triggerPair.every((cell) => cell.x !== relic.x || cell.y !== relic.y)).toBe(true);
  await keyboardPair(page, fixture.triggerPair);
  await waitForActivePhase(page);
  await waitForGuidedControl(page);
  const recovered = await savedState(page);
  expect(recovered.armedLineRelic).toEqual(relic);
  await expect(page.locator("#board .tile.black-candle-vine")).toHaveCount(1);
  await expect(page.locator("#board .tile.line-relic-lane-preview")).toHaveCount(8);
  await expect(page.locator("#firstSwapCue")).toContainText("Black Candle Vine");
  const guide = await guidedPair(page);
  expect(guide.some((cell) => cell.x === relic.x && cell.y === relic.y)).toBe(true);
  await keyboardPair(page, guide);
  await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 7000 });
  const exercised = await savedState(page);
  expect(exercised.moves).toBe(recovered.moves - 1);
  expect(exercised.armedLineRelic).toBeNull();
  expectNoRuntimeErrors(errors, "keyboard armed relic recovery");
});

test("reload during reweave restores the atomic settled post-recovery state", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const errors = observeRuntime(page);
  const fixture = await openFixture(page, "reload-interruption", baseState(3));
  await clickPair(page, fixture.triggerPair);
  await waitForActivePhase(page);
  const authoritative = await savedState(page);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("body")).not.toHaveClass(/altar-reweave-active|post-recovery-guide/);
  await expect(page.locator("#board .tile:disabled")).toHaveCount(0);
  const restored = await savedState(page);
  const report = await boardReport(page);
  expect(restored.board).toEqual(authoritative.board);
  expect(restored.moves).toBe(fixture.moves - 1);
  expect(restored.counts).toEqual(authoritative.counts);
  expect(report).toMatchObject({ tiles: 64, rows: 8, disabled: 0, overflowX: false, brokenImages: [] });
  expectNoRuntimeErrors(errors, "reload interruption");
});

test("reduced motion keeps the semantic/static reweave but suppresses sweep motion", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = observeRuntime(page);
  const fixture = await openFixture(page, "reduced-motion", baseState(3));
  const started = Date.now();
  await touchPair(page, fixture.triggerPair);
  await waitForActivePhase(page);
  const motion = await page.evaluate(() => ({
    mode: document.body.dataset.altarReweaveMotion,
    cue: document.querySelector("#firstSwapCue")?.textContent.trim(),
    veil: document.querySelectorAll(".altar-reweave-veil").length,
    animated: Array.from(document.querySelectorAll(".altar-reweave-veil, .altar-reweave-seal, #board .tile"))
      .filter((node) => getComputedStyle(node).animationName !== "none" && getComputedStyle(node).animationDuration !== "0s")
      .map((node) => getComputedStyle(node).animationName)
  }));
  expect(motion).toMatchObject({ mode: "reduced", cue: "No moves — altar reweaving.", veil: 1, animated: [] });
  await page.screenshot({ path: "work/dead-board-reweave-mobile390-reduced.png", fullPage: true });
  await waitForGuidedControl(page);
  const controlMs = Date.now() - started;
  const transitions = await page.evaluate(() => window.__reweaveTransitions || []);
  expect(transitions.map((entry) => entry.phase)).toEqual(["active", "guided"]);
  const phaseMs = transitions[1].at - transitions[0].at;
  expect(phaseMs).toBeGreaterThanOrEqual(500);
  expect(phaseMs).toBeLessThan(750);
  expect(controlMs).toBeLessThan(2500);
  console.log(`dead-board reduced timing: ${JSON.stringify({ phaseMs, controlMs, transitions })}`);
  expectNoRuntimeErrors(errors, "reduced-motion recovery");
  await context.close();
});

test("completion and failure ceremonies suppress all reweave presentation", async ({ browser }) => {
  for (const precedence of ["complete", "fail"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    const errors = observeRuntime(page);
    const fixture = await openFixture(page, `precedence-${precedence}`, baseState(3), { precedence });
    await clickPair(page, fixture.triggerPair);
    if (precedence === "complete") {
      await expect(page.locator("body")).toHaveClass(/focused-payoff-active/, { timeout: 7000 });
      await expect(page.locator("#roundOneRestoration")).toBeVisible();
    } else {
      await expect(page.locator("body")).toHaveClass(/focused-slice-failed/, { timeout: 7000 });
      await expect(page.locator("#renewBtn")).toHaveText("Retry Bouquet");
      await expect(page.locator("#renewBtn")).toBeVisible();
    }
    await expect(page.locator("body")).not.toHaveClass(/altar-reweave-active|post-recovery-guide/);
    await expect(page.locator(".altar-reweave-veil")).toHaveCount(0);
    await expect(page.locator("#firstSwapCue")).not.toContainText(/reweav|Path restored/i);
    expect(Number(await page.locator("body").getAttribute("data-altar-reweave-sequence"))).toBe(0);
    const saved = await savedState(page);
    expect(saved.moves).toBe(fixture.moves - 1);
    expect(saved.roundComplete).toBe(precedence === "complete");
    expectNoRuntimeErrors(errors, `${precedence} precedence`);
    await context.close();
  }
});

test("the deterministic recovery control stays absent from public runtime", async ({ page }) => {
  await page.goto(`${BASE_URL}?dead-board-public-gate`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect.poll(() => page.evaluate(() => window.__bloomReviewHooksEnabled)).toBe(false);
  expect(await page.evaluate(() => typeof window.__bloomDeadBoardRecoveryFixture)).toBe("undefined");
  await expect(page.locator("#board .tile")).toHaveCount(64);
  const movesBefore = (await savedState(page)).moves;
  const openingPair = await guidedPair(page);
  expect(openingPair).toHaveLength(2);
  await clickPair(page, openingPair);
  await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 7000 });
  expect(Number(await page.locator("body").getAttribute("data-altar-reweave-sequence"))).toBe(0);
  await expect(page.locator("body")).not.toHaveClass(/altar-reweave-active|post-recovery-guide/);
  expect((await savedState(page)).moves).toBe(movesBefore - 1);
});
