const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const PROFILES = [
  { label: "desktop", viewport: { width: 1280, height: 720 } },
  { label: "desktop-reduced", viewport: { width: 1280, height: 720 }, reducedMotion: "reduce" },
  { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true },
  { label: "mobile390-reduced", viewport: { width: 390, height: 844 }, mobile: true, reducedMotion: "reduce" }
];

const ROUND_THREE_BOARD = [
  [3, 4, 3, 3, 0, 1, 0, 2],
  [5, 3, 0, 5, 2, 0, 3, 1],
  [4, 0, 1, 0, 4, 4, 0, 5],
  [3, 3, 1, 0, 1, 0, 3, 2],
  [2, 5, 5, 3, 3, 2, 0, 3],
  [1, 4, 3, 3, 0, 1, 0, 1],
  [3, 2, 4, 4, 1, 3, 5, 1],
  [3, 0, 5, 0, 5, 1, 0, 2]
];

test.setTimeout(120000);

function ownedRoundThreeState() {
  return {
    focusedEconomyVersion: 2,
    board: ROUND_THREE_BOARD.map((row) => [...row]),
    armedLineRelic: null,
    moves: 7,
    coins: 50,
    counts: [0, 0, 0, 0, 0, 0],
    cursedThorns: [],
    clearedCursedThorns: 0,
    currentRound: 3,
    roundComplete: false,
    roundOneRestored: true,
    roundTwoGreenhouseUpgraded: true,
    roundThreeConservatoryRaised: true,
    freshConservatorySettlement: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
}

function damagedCompletedOwnedRoundThreeState() {
  return {
    ...ownedRoundThreeState(),
    focusedEconomyVersion: true,
    moves: 3,
    coins: 230,
    counts: [13, 0, 0, 14, 0, 0],
    roundComplete: true
  };
}

function watchErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText || "";
    if (failure !== "net::ERR_ABORTED") errors.push(`${request.url()} ${failure}`);
  });
  return errors;
}

async function commitGuidedPair(page, mobile) {
  for (const role of ["source", "destination"]) {
    const tile = page.locator([
      `.tile[aria-label*="guided exchange ${role}"]`,
      `.tile[aria-label*="final harvest swap ${role}"]`
    ].join(", "));
    await expect(tile).toHaveCount(1);
    if (mobile) await tile.tap();
    else await tile.click();
  }
}

async function report(page) {
  return page.evaluate((key) => {
    const tiles = [...document.querySelectorAll(".tile")];
    const board = document.querySelector("#board")?.getBoundingClientRect();
    return {
      raw: localStorage.getItem(key),
      saved: JSON.parse(localStorage.getItem(key) || "{}"),
      rewardPromise: document.querySelector("#bouquetRewardPromise")?.textContent.trim() || "",
      transaction: document.querySelector("#payoffTransaction")?.innerText || "",
      ritual: document.querySelector("#ritualLog")?.innerText || "",
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      boardWidth: board?.width || 0,
      boardHeight: board?.height || 0,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: [...document.images]
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src)
    };
  }, SAVE_KEY);
}

for (const profile of PROFILES.filter(({ reducedMotion }) => !reducedMotion)) {
  test(`malformed economy version cannot duplicate a settled reward on ${profile.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile)
    });
    const page = await context.newPage();
    const errors = watchErrors(page);
    await page.addInitScript(({ key, state, marker }) => {
      if (!sessionStorage.getItem(marker)) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem(marker, "1");
      }
    }, {
      key: SAVE_KEY,
      state: damagedCompletedOwnedRoundThreeState(),
      marker: `owned-replay-version-repair-${profile.label}`
    });
    await page.goto(`${BASE_URL}?owned-replay-version-repair=${profile.label}`, {
      waitUntil: "networkidle"
    });
    await expect(page.getByRole("button", { name: "Play Again → First Bouquet", exact: true }))
      .toBeVisible();

    const repaired = await report(page);
    expect(repaired.saved.focusedEconomyVersion).toBe(3);
    expect(repaired.saved.coins).toBe(230);
    expect(repaired.saved.roundComplete).toBe(true);
    expect(repaired.rewardPromise).toBe("Banked 180 · Wallet 230");
    expect(repaired.transaction).toBe("REPLAY REWARD · +180 COINS BANKED · 230 COINS IN WALLET.");
    expect(repaired.ritual).toContain("Saved wallet repaired");
    expect(repaired.overflowX).toBe(false);
    expect(repaired.overflowY).toBe(false);
    expect(repaired.brokenImages).toEqual([]);
    await page.screenshot({
      path: `work/owned-replay-version-repaired-${profile.label}.png`,
      fullPage: true
    });

    await page.reload({ waitUntil: "networkidle" });
    const stable = await report(page);
    expect(stable.raw).toBe(repaired.raw);
    expect(stable.saved.coins).toBe(230);
    expect(stable.saved.focusedEconomyVersion).toBe(3);
    expect(stable.ritual).not.toContain("Saved wallet repaired");
    expect(stable.transaction).toBe(repaired.transaction);

    const replay = page.getByRole("button", { name: "Play Again → First Bouquet", exact: true });
    if (profile.mobile) await replay.tap();
    else await replay.click();
    await expect(page.locator("#board .tile")).toHaveCount(64);
    await expect(page.locator("#bouquetRewardPromise")).toHaveText("Bank 120 · Wallet 350", {
      timeout: 5000
    });
    const handoff = await report(page);
    expect(handoff.saved.currentRound).toBe(1);
    expect(handoff.saved.roundComplete).toBe(false);
    expect(handoff.saved.coins).toBe(230);
    expect(handoff.tiles).toBe(64);
    expect(handoff.rows).toBe(8);
    expect(handoff.boardWidth).toBeCloseTo(profile.mobile ? 378 : 600, 0);
    expect(handoff.boardHeight).toBeCloseTo(profile.mobile ? 378 : 600, 0);
    expect(handoff.overflowX).toBe(false);
    expect(handoff.overflowY).toBe(false);
    expect(handoff.brokenImages).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}

for (const profile of PROFILES) {
  test(`owned replay banks one visible wallet reward on ${profile.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile),
      reducedMotion: profile.reducedMotion || "no-preference"
    });
    const page = await context.newPage();
    const errors = watchErrors(page);
    await page.addInitScript(({ key, state, marker }) => {
      if (!sessionStorage.getItem(marker)) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem(marker, "1");
      }
    }, {
      key: SAVE_KEY,
      state: ownedRoundThreeState(),
      marker: `owned-replay-wallet-${profile.label}`
    });
    await page.goto(`${BASE_URL}?owned-replay-wallet=${profile.label}`, { waitUntil: "networkidle" });
    await expect(page.locator(".tile")).toHaveCount(64);
    await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 10000 });

    const cue = await page.locator("#firstSwapCue").textContent();
    const targetId = cue.includes("Bloodroot") ? 0 : cue.includes("Sol Rot") ? 3 : -1;
    expect(targetId, `authored closing cue names a Round 3 target: ${cue}`).not.toBe(-1);
    await page.evaluate(({ key, targetId }) => {
      const state = JSON.parse(localStorage.getItem(key));
      state.counts = [13, 0, 0, 14, 0, 0];
      state.counts[targetId] -= 1;
      state.moves = 2;
      localStorage.setItem(key, JSON.stringify(state));
    }, { key: SAVE_KEY, targetId });
    await page.reload({ waitUntil: "networkidle" });

    await expect(page.locator("#bouquetRewardPromise")).toHaveText("Bank 180 · Wallet 230");
    const active = await report(page);
    expect(active.saved.coins).toBe(50);
    expect(active.saved.roundComplete).toBe(false);
    expect(active.tiles).toBe(64);
    expect(active.rows).toBe(8);
    expect(active.boardWidth).toBeCloseTo(profile.mobile ? 378 : 600, 0);
    expect(active.boardHeight).toBeCloseTo(profile.mobile ? 378 : 600, 0);
    expect(active.overflowX).toBe(false);
    expect(active.overflowY).toBe(false);
    expect(active.brokenImages).toEqual([]);

    await commitGuidedPair(page, profile.mobile);
    await expect(page.getByRole("button", { name: "Play Again → First Bouquet", exact: true }))
      .toBeVisible({ timeout: 12000 });
    const completed = await report(page);
    expect(completed.saved.roundComplete).toBe(true);
    expect(completed.saved.coins).toBe(230);
    expect(completed.rewardPromise).toBe("Banked 180 · Wallet 230");
    expect(completed.transaction).toBe("REPLAY REWARD · +180 COINS BANKED · 230 COINS IN WALLET.");
    expect(completed.ritual).toContain("+180 replay coins banked. Wallet 230.");
    expect(completed.tiles).toBe(64);
    expect(completed.rows).toBe(8);
    expect(completed.boardWidth).toBe(0);
    expect(completed.boardHeight).toBe(0);
    expect(completed.overflowX).toBe(false);
    expect(completed.overflowY).toBe(false);
    expect(completed.brokenImages).toEqual([]);
    await page.screenshot({
      path: `work/owned-replay-wallet-${profile.label}-completion.png`,
      fullPage: true
    });

    for (let reload = 0; reload < 2; reload += 1) {
      await page.reload({ waitUntil: "networkidle" });
      const reloaded = await report(page);
      expect(reloaded.saved.roundComplete).toBe(true);
      expect(reloaded.saved.coins).toBe(230);
      expect(reloaded.transaction).toBe("REPLAY REWARD · +180 COINS BANKED · 230 COINS IN WALLET.");
      expect(reloaded.overflowX).toBe(false);
      expect(reloaded.overflowY).toBe(false);
      expect(reloaded.brokenImages).toEqual([]);
    }

    const replay = page.getByRole("button", { name: "Play Again → First Bouquet", exact: true });
    if (profile.mobile) await replay.tap();
    else await replay.click();
    await expect(page.locator("#board")).toBeVisible();
    await expect(page.locator("#bouquetRewardPromise")).toHaveText(/Bank 120 · Wallet 350|230 kept · Conservatory owned/);
    await expect(page.locator("#bouquetRewardPromise")).toHaveText("Bank 120 · Wallet 350", { timeout: 5000 });
    const nextCycle = await report(page);
    expect(nextCycle.saved.currentRound).toBe(1);
    expect(nextCycle.saved.roundComplete).toBe(false);
    expect(nextCycle.saved.coins).toBe(230);
    expect(nextCycle.tiles).toBe(64);
    expect(nextCycle.rows).toBe(8);
    expect(nextCycle.overflowX).toBe(false);
    expect(nextCycle.overflowY).toBe(false);
    expect(nextCycle.brokenImages).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}
