const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const CASES = [
  {
    label: "r1-ordinary-desktop-pointer",
    round: 1,
    target: 5,
    mode: "ordinary",
    input: "pointer",
    viewport: { width: 1280, height: 720 }
  },
  {
    label: "r3-ordinary-mobile-touch-reduced",
    round: 3,
    target: 3,
    mode: "ordinary",
    input: "touch",
    reduced: true,
    mobile: true,
    viewport: { width: 390, height: 844 }
  },
  {
    label: "r1-black-candle-mobile-touch",
    round: 1,
    target: 5,
    secondary: 1,
    mode: "black-candle",
    input: "touch",
    mobile: true,
    viewport: { width: 390, height: 844 }
  },
  {
    label: "r3-black-candle-desktop-keyboard-reduced",
    round: 3,
    target: 3,
    secondary: 0,
    mode: "black-candle",
    input: "keyboard",
    reduced: true,
    viewport: { width: 1280, height: 720 }
  },
  {
    label: "r2-off-objective-desktop-pointer",
    round: 2,
    matchFlower: 0,
    targetIds: [2, 4, 5],
    refillRandom: [0.01, 0.12, 0.46],
    mode: "off-objective",
    input: "pointer",
    viewport: { width: 1280, height: 720 }
  },
  {
    label: "r3-off-objective-desktop-keyboard-reduced",
    round: 3,
    matchFlower: 1,
    targetIds: [3, 0],
    refillRandom: [0.26, 0.38, 0.76],
    mode: "off-objective",
    input: "keyboard",
    reduced: true,
    viewport: { width: 1280, height: 720 }
  },
  {
    label: "r2-off-objective-mobile-touch",
    round: 2,
    matchFlower: 0,
    targetIds: [2, 4, 5],
    refillRandom: [0.01, 0.12, 0.46],
    mode: "off-objective",
    input: "touch",
    mobile: true,
    viewport: { width: 390, height: 844 }
  },
  {
    label: "r3-off-objective-mobile-touch-reduced",
    round: 3,
    matchFlower: 1,
    targetIds: [3, 0],
    refillRandom: [0.26, 0.38, 0.76],
    mode: "off-objective",
    input: "touch",
    reduced: true,
    mobile: true,
    viewport: { width: 390, height: 844 }
  }
];

const SHUFFLE_CASES = [
  { label: "desktop-full-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "desktop-reduced-keyboard", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
  { label: "mobile-full-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "mobile-reduced-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
].flatMap((config) => [5, 4].map((moves) => ({ ...config, moves })));

const SHUFFLE_BOARD = [
  [3, 0, 4, 4, 0, 3, 3, 0],
  [2, 0, 0, 2, 3, 4, 0, 2],
  [4, 2, 0, 0, 2, 3, 4, 0],
  [1, 2, 1, 1, 3, 5, 4, 1],
  [0, 4, 2, 4, 0, 2, 3, 3],
  [2, 3, 4, 3, 3, 4, 0, 4],
  [3, 4, 2, 2, 0, 2, 4, 3],
  [4, 2, 2, 4, 3, 3, 0, 3]
];

async function seedCase(page, testCase) {
  const seedToken = `settled-outcome-seeded-${testCase.label}`;
  await page.addInitScript(({ key, testCase, seedToken }) => {
    if (sessionStorage.getItem(seedToken)) {
      return;
    }
    const state = {};
    const board = Array.from({ length: 8 }, (_, y) => (
      Array.from({ length: 8 }, (_, x) => (x + 2 * y) % 6)
    ));
    if (testCase.mode !== "black-candle") {
      const matchedFlower = testCase.mode === "off-objective"
        ? testCase.matchFlower
        : testCase.target;
      const filler = (matchedFlower + 1) % 6;
      board[0][0] = matchedFlower;
      board[0][1] = filler;
      board[0][2] = matchedFlower;
      board[0][3] = filler;
      board[1][1] = matchedFlower;
      state.armedLineRelic = null;
      if (testCase.mode === "off-objective") {
        const reserveTarget = testCase.targetIds[0];
        const reserveFiller = (reserveTarget + 1) % 6;
        board[7][4] = reserveTarget;
        board[7][5] = reserveFiller;
        board[7][6] = reserveTarget;
        board[6][5] = reserveTarget;
        const refill = testCase.refillRandom.slice();
        let refillIndex = 0;
        Math.random = () => refill[refillIndex++ % refill.length];
      }
    } else {
      board[0] = Array.from({ length: 8 }, (_, x) => (
        x % 2 ? testCase.secondary : testCase.target
      ));
      state.armedLineRelic = {
        x: 3,
        y: 0,
        direction: "horizontal",
        flowerId: testCase.secondary
      };
    }
    state.board = board;
    state.currentRound = testCase.round;
    state.moves = 4;
    state.counts = [0, 0, 0, 0, 0, 0];
    state.coins = 20;
    state.focusedEconomyVersion = 2;
    state.roundComplete = false;
    state.roundOneRestored = true;
    state.roundTwoGreenhouseUpgraded = testCase.round >= 3;
    state.roundThreeConservatoryRaised = false;
    state.hasMadeValidMove = true;
    state.restoredRoundTwoGuideMoves = 2;
    state.tutorialSkipped = true;
    state.tutorialActive = false;
    state.blackCandleLessonComplete = true;
    state.cursedThorns = [];
    state.clearedCursedThorns = testCase.round === 2 ? 3 : 0;
    localStorage.setItem(key, JSON.stringify(state));
    sessionStorage.setItem(seedToken, "1");
  }, { key: SAVE_KEY, testCase, seedToken });
  await page.goto(`${BASE_URL}?settled-outcome=${testCase.label}`, { waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
}

async function activatePair(page, testCase) {
  const pair = testCase.mode === "ordinary"
    ? await page.locator(".tile.idle-hint").evaluateAll((tiles) => tiles.map((tile) => ({
        x: Number(tile.dataset.x),
        y: Number(tile.dataset.y)
      })))
    : testCase.mode === "off-objective"
      ? [{ x: 1, y: 0 }, { x: 1, y: 1 }]
      : [{ x: 3, y: 0 }, { x: 4, y: 0 }];
  expect(pair, `${testCase.label} exact legal pair`).toHaveLength(2);
  const [source, destination] = pair.map(({ x, y }) => page.locator(`#tile-${x}-${y}`));
  if (testCase.input === "keyboard") {
    await source.focus();
    await page.keyboard.press("Enter");
    await destination.focus();
    await page.keyboard.press("Space");
  } else if (testCase.input === "touch") {
    await source.tap();
    await destination.tap();
  } else {
    await source.click();
    await destination.click();
  }
}

async function seedShuffleCase(page, testCase, suffix = "") {
  const seedKey = `shuffle-outcome-${testCase.label}-${testCase.moves}-${suffix}`;
  await page.addInitScript(({ key, testCase, seedKey, board }) => {
    if (sessionStorage.getItem(seedKey)) {
      return;
    }
    localStorage.setItem(key, JSON.stringify({
      focusedEconomyVersion: 2,
      currentRound: 1,
      moves: testCase.moves,
      counts: [0, 3, 0, 0, 0, 3],
      coins: 0,
      board,
      armedLineRelic: null,
      cursedThorns: [],
      clearedCursedThorns: 0,
      roundComplete: false,
      roundOneRestored: false,
      roundTwoGreenhouseUpgraded: false,
      roundThreeConservatoryRaised: false,
      hasMadeValidMove: true,
      restoredRoundTwoGuideMoves: 0,
      tutorialSkipped: true,
      tutorialActive: false,
      blackCandleLessonComplete: true
    }));
    sessionStorage.setItem(seedKey, "1");
  }, { key: SAVE_KEY, testCase, seedKey, board: SHUFFLE_BOARD });
  await page.goto(`${BASE_URL}?shuffle-outcome=${seedKey}`, { waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator("#shuffleBtn")).toBeVisible();
  await expect(page.locator("#shuffleBtn")).toBeEnabled();
}

async function activateShuffle(page, testCase) {
  const shuffle = page.locator("#shuffleBtn");
  if (testCase.input === "touch") {
    await shuffle.tap();
  } else if (testCase.input === "keyboard") {
    await shuffle.focus();
    await page.keyboard.press("Space");
  } else {
    await shuffle.click();
  }
}

async function observeOutcomeChronology(page) {
  await page.evaluate(() => {
    const cue = document.querySelector("#firstSwapCue");
    window.__settledOutcomeChronology = [];
    window.__settledOutcomeTimeline = [];
    const visible = (node) => Boolean(node) && !node.hidden
      && getComputedStyle(node).display !== "none"
      && node.getBoundingClientRect().width > 0
      && node.getBoundingClientRect().height > 0;
    const recordOwnerExposure = () => {
      const text = cue?.textContent.trim() || "";
      if (
        !text
        && document.body.classList.contains("settled-board-outcome-cue")
        && !window.__settledOutcomeTimeline.includes("owner")
      ) {
        window.__settledOutcomeTimeline.push("owner");
      }
    };
    const ownerObserver = new MutationObserver(recordOwnerExposure);
    const cueObserver = new MutationObserver(() => {
      const text = cue?.textContent.trim() || "";
      if (!text.includes("moves left.") || !document.body.classList.contains("settled-board-outcome-cue")) {
        return;
      }
      window.__settledOutcomeTimeline.push("result");
      const liveRegions = Array.from(document.querySelectorAll("[aria-live]"));
      window.__settledOutcomeChronology.push({
        text,
        display: getComputedStyle(cue).display,
        cueLive: cue.getAttribute("aria-live"),
        visibleOwners: liveRegions
          .filter(visible)
          .filter((node) => ["polite", "assertive"].includes(node.getAttribute("aria-live")))
          .map((node) => ({ id: node.id, live: node.getAttribute("aria-live") })),
        competingOwners: liveRegions
          .filter(visible)
          .filter((node) => node !== cue)
          .filter((node) => ["polite", "assertive"].includes(node.getAttribute("aria-live")))
          .map((node) => node.id)
      });
    });
    ownerObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });
    cueObserver.observe(cue, { childList: true, characterData: true, subtree: true });
    window.__settledOutcomeObserver = { ownerObserver, cueObserver };
  });
}

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => Boolean(node) && !node.hidden
      && getComputedStyle(node).display !== "none"
      && node.getBoundingClientRect().width > 0
      && node.getBoundingClientRect().height > 0;
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const shuffle = document.querySelector("#shuffleBtn")?.getBoundingClientRect();
    return {
      state: JSON.parse(localStorage.getItem(key) || "{}"),
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      cueVisible: visible(document.querySelector("#firstSwapCue")),
      bodyClasses: document.body.className,
      liveOwners: Array.from(document.querySelectorAll("[aria-live]"))
        .filter(visible)
        .filter((node) => ["polite", "assertive"].includes(node.getAttribute("aria-live")))
        .map((node) => ({ id: node.id, live: node.getAttribute("aria-live") })),
      focused: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).length,
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      disabled: tiles.filter((tile) => tile.disabled).length,
      boardWidth: board?.width || 0,
      boardBottom: board?.bottom || 0,
      shuffleWidth: shuffle?.width || 0,
      shuffleHeight: shuffle?.height || 0,
      moveLive: document.querySelector(".moves-counter")?.getAttribute("aria-live") || "",
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      scrollY,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

for (const testCase of CASES) {
  test(`${testCase.label} announces one settled result and reload stays quiet`, async ({ browser }) => {
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
      await seedCase(page, testCase);
      const before = await report(page);
      if (testCase.mode === "ordinary") {
        await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 8500 });
      }
      await observeOutcomeChronology(page);
      await activatePair(page, testCase);
      await expect.poll(async () => (
        (await report(page)).bodyClasses.includes("settled-board-outcome-cue")
      ), {
        message: `${testCase.label} presents the settled outcome after board feedback`,
        timeout: 12000
      }).toBe(true);
      await page.waitForFunction((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === 3
          && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
      }, SAVE_KEY, { timeout: 12000 });
      const settled = await report(page);
      const chronology = await page.evaluate(() => window.__settledOutcomeChronology || []);
      const timeline = await page.evaluate(() => window.__settledOutcomeTimeline || []);
      expect(timeline, `${testCase.label} exposes the empty owner before its result`)
        .toEqual(["owner", "result"]);
      expect(chronology, `${testCase.label} mutates the settled result exactly once`).toHaveLength(1);
      expect(chronology[0].text, `${testCase.label} chronology captures the final receipt`)
        .toBe(settled.cue);
      expect(chronology[0].display, `${testCase.label} cue is exposed before result mutation`)
        .not.toBe("none");
      expect(chronology[0].cueLive, `${testCase.label} cue owns polite narration before mutation`)
        .toBe("polite");
      expect(chronology[0].visibleOwners, `${testCase.label} one owner exists at mutation time`)
        .toEqual([{ id: "firstSwapCue", live: "polite" }]);
      expect(chronology[0].competingOwners, `${testCase.label} competing owners are off at mutation time`)
        .toEqual([]);
      if (testCase.mode === "off-objective") {
        expect(settled.cue, `${testCase.label} distinguishes a legal but unproductive match`)
          .toBe("Bloom cleared. No bouquet progress. 3 moves left.");
      } else {
        expect(settled.cue, `${testCase.label} names the actual target gain`).toContain("+");
        expect(settled.cue, `${testCase.label} gives the settled objective count`)
          .toMatch(/\d+ of \d+/);
      }
      expect(settled.cue, `${testCase.label} gives remaining moves`).toContain("3 moves left.");
      if (testCase.mode === "black-candle") {
        expect(settled.cue, `${testCase.label} names the physical lane result`)
          .toContain("Black Candle burned the row.");
        expect(settled.bodyClasses, `${testCase.label} retains Black Candle identity`)
          .toContain("black-candle-thorn-outcome-cue");
      }
      expect(settled.bodyClasses, `${testCase.label} owns the shared outcome surface`)
        .toContain("settled-board-outcome-cue");
      expect(settled.liveOwners, `${testCase.label} one polite result owner`)
        .toEqual([{ id: "firstSwapCue", live: "polite" }]);
      if (testCase.mode === "off-objective") {
        expect(settled.state.counts[testCase.matchFlower], `${testCase.label} clears the matched flower`)
          .toBeGreaterThan(before.state.counts[testCase.matchFlower]);
        testCase.targetIds.forEach((targetId) => {
          expect(settled.state.counts[targetId], `${testCase.label} leaves order flower ${targetId} unchanged`)
            .toBe(before.state.counts[targetId]);
        });
        await page.screenshot({ path: `work/off-objective-settled-${testCase.label}.png` });
      } else {
        expect(settled.state.counts[testCase.target], `${testCase.label} target gained after cascades`)
          .toBeGreaterThan(before.state.counts[testCase.target]);
      }
      expect(settled.state.moves, `${testCase.label} spends once`).toBe(3);
      expect(settled.selected, `${testCase.label} clears selection`).toBe(0);
      expect(settled.focused, `${testCase.label} keeps visible board focus`).toMatch(/^tile-/);
      expect(settled.roving, `${testCase.label} focus and roving agree`).toEqual([settled.focused]);
      expect(settled.tiles, `${testCase.label} tile integrity`).toBe(64);
      expect(settled.rows, `${testCase.label} row integrity`).toBe(8);
      expect(settled.disabled, `${testCase.label} control returned`).toBe(0);
      expect(settled.boardBottom, `${testCase.label} board remains in viewport`)
        .toBeLessThanOrEqual(testCase.viewport.height);
      expect(settled.overflowX, `${testCase.label} no horizontal overflow`).toBe(false);
      expect(settled.scrollY, `${testCase.label} no viewport drift`).toBe(0);
      expect(settled.brokenImages, `${testCase.label} images loaded`).toEqual([]);
      if (testCase.mobile) {
        expect(settled.boardWidth, `${testCase.label} exact mobile altar`).toBeCloseTo(378, 1);
        expect(settled.overflowY, `${testCase.label} no mobile vertical overflow`).toBe(false);
      }

      if (testCase.mode === "off-objective") {
        await expect(page.locator("body")).not.toHaveClass(/settled-board-outcome-cue/, { timeout: 5000 });
        await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2, { timeout: 1500 });
        const recovery = await report(page);
        const expectedTargets = testCase.targetIds
          .map((flowerId) => ["Sol Rot", "Bone Star", "Nightshade", "Bloodroot", "Amber Seed", "Thorn Rose"][flowerId])
          .join("|");
        expect(recovery.cue, `${testCase.label} names an objective-useful recovery pair`)
          .toMatch(new RegExp(`^(?:${expectedTargets}) next (?:↔|↑↓)$`));
        expect(recovery.cueVisible, `${testCase.label} keeps recovery visible`).toBe(true);
        expect(recovery.hints, `${testCase.label} exposes one exact recovery pair`).toHaveLength(2);
        expect(recovery.focused, `${testCase.label} focuses the recovery source`).toBe(recovery.hints[0]);
        expect(recovery.roving, `${testCase.label} gives recovery sole keyboard entry`)
          .toEqual([recovery.hints[0]]);
        expect(recovery.tiles, `${testCase.label} recovery tiles`).toBe(64);
        expect(recovery.rows, `${testCase.label} recovery rows`).toBe(8);
        expect(recovery.overflowX, `${testCase.label} recovery has no horizontal overflow`).toBe(false);
        expect(recovery.brokenImages, `${testCase.label} recovery images`).toEqual([]);
        await page.screenshot({ path: `work/off-objective-recovery-${testCase.label}.png`, fullPage: false });

        const recoverySave = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForTimeout(250);
        const quietReload = await report(page);
        expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY), `${testCase.label} rescue reload bytes`)
          .toBe(recoverySave);
        expect(quietReload.bodyClasses, `${testCase.label} transient rescue does not replay`)
          .not.toContain("focused-harvest-handoff-cue");
        expect(quietReload.cue, `${testCase.label} transient rescue copy does not replay`).not.toBe(recovery.cue);
        expect(quietReload.hints, `${testCase.label} reload starts in the quiet window`).toEqual([]);
        await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2, { timeout: 8500 });
        const resumed = await report(page);
        expect(resumed.hints, `${testCase.label} quiet autonomy restores the deterministic pair`)
          .toEqual(recovery.hints);

        const [sourceId, destinationId] = resumed.hints;
        const activate = async (id) => {
          const tile = page.locator(`#${id}`);
          if (testCase.input === "keyboard") {
            await tile.focus();
            await page.keyboard.press("Space");
          } else if (testCase.input === "touch") {
            await tile.tap();
          } else {
            await tile.click();
          }
        };
        await activate(sourceId);
        await activate(destinationId);
        await page.waitForFunction((key) => {
          const state = JSON.parse(localStorage.getItem(key) || "{}");
          return state.moves === 2
            && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
        }, SAVE_KEY, { timeout: 12000 });
        const continued = await report(page);
        expect(
          testCase.targetIds.some((flowerId) => (
            Number(continued.state.counts[flowerId]) > Number(recovery.state.counts[flowerId])
          )),
          `${testCase.label} recovery pair advances a named objective`
        ).toBe(true);
        expect(continued.state.moves, `${testCase.label} recovery pair spends exactly once`).toBe(2);
      }

      const settledSave = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      const reloaded = await report(page);
      expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY), `${testCase.label} atomic reload`)
        .toBe(settledSave);
      expect(reloaded.bodyClasses, `${testCase.label} reload has no transient result authority`)
        .not.toContain("settled-board-outcome-cue");
      expect(reloaded.cue, `${testCase.label} reload does not replay the settled result`)
        .not.toBe(settled.cue);
      expect(
        reloaded.liveOwners.every(({ id }) => ["coinBalance", "firstSwapCue"].includes(id)),
        `${testCase.label} reload returns only established ordinary narration`
      ).toBe(true);
      expect(reloaded.liveOwners.length, `${testCase.label} reload ordinary owners remain bounded`)
        .toBeGreaterThan(0);
      expect(reloaded.tiles, `${testCase.label} reload tiles`).toBe(64);
      expect(reloaded.rows, `${testCase.label} reload rows`).toBe(8);
      expect(browserErrors, `${testCase.label} browser errors`).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

for (const testCase of SHUFFLE_CASES) {
  test(`${testCase.label} Moves ${testCase.moves} Shuffle announces once and stays board-first`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile),
      reducedMotion: testCase.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const browserErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("requestfailed", (request) => {
      const errorText = request.failure()?.errorText || "";
      if (errorText !== "net::ERR_ABORTED") failedRequests.push(`${request.url()} ${errorText}`);
    });

    try {
      await seedShuffleCase(page, testCase);
      const before = await report(page);
      await observeOutcomeChronology(page);
      await activateShuffle(page, testCase);
      const movesLeft = testCase.moves - 1;
      await expect.poll(async () => (await report(page)).cue, {
        message: `${testCase.label} exposes the settled Shuffle receipt`,
        timeout: 5000
      }).toBe(`Board shuffled. ${movesLeft} moves left.`);
      const settled = await report(page);
      const chronology = await page.evaluate(() => window.__settledOutcomeChronology || []);
      const timeline = await page.evaluate(() => window.__settledOutcomeTimeline || []);
      expect(timeline, `${testCase.label} owner precedes result`).toEqual(["owner", "result"]);
      expect(chronology, `${testCase.label} result mutates once`).toHaveLength(1);
      expect(chronology[0].text).toBe(settled.cue);
      expect(chronology[0].display).not.toBe("none");
      expect(chronology[0].cueLive).toBe("polite");
      expect(chronology[0].visibleOwners).toEqual([{ id: "firstSwapCue", live: "polite" }]);
      expect(chronology[0].competingOwners).toEqual([]);
      expect(settled.bodyClasses).toContain("settled-board-outcome-cue");
      expect(settled.bodyClasses).toContain("shuffle-board-outcome-cue");
      expect(settled.liveOwners).toEqual([{ id: "firstSwapCue", live: "polite" }]);
      expect(settled.moveLive, `${testCase.label} move counter does not compete`).toBe("off");
      expect(settled.state.moves, `${testCase.label} spends exactly once`).toBe(movesLeft);
      expect(settled.selected).toBe(0);
      expect(settled.focused, `${testCase.label} Shuffle keeps focus`).toBe("shuffleBtn");
      expect(settled.roving, `${testCase.label} one board entry remains`).toHaveLength(1);
      expect(settled.tiles).toBe(64);
      expect(settled.rows).toBe(8);
      expect(settled.disabled).toBe(0);
      expect(settled.boardBottom).toBeLessThanOrEqual(testCase.viewport.height);
      expect(settled.overflowX).toBe(false);
      expect(settled.scrollY).toBe(0);
      expect(settled.brokenImages).toEqual([]);
      if (testCase.mobile) {
        expect(settled.boardWidth).toBeCloseTo(378, 1);
        expect(settled.shuffleWidth).toBeGreaterThanOrEqual(44);
        expect(settled.shuffleHeight).toBeGreaterThanOrEqual(44);
        expect(settled.overflowY).toBe(false);
      } else {
        expect(settled.boardWidth).toBeCloseTo(600, 1);
      }

      const settledSave = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
      await expect.poll(async () => (await report(page)).bodyClasses, {
        message: `${testCase.label} receipt retires`,
        timeout: 5000
      }).not.toContain("settled-board-outcome-cue");
      const retired = await report(page);
      expect(retired.cue).not.toContain("Board shuffled.");
      expect(retired.focused, `${testCase.label} retirement does not steal focus`).toBe("shuffleBtn");
      expect(retired.roving, `${testCase.label} roving identity survives retirement`)
        .toEqual(settled.roving);
      await expect.poll(async () => (await report(page)).hints.length, {
        message: `${testCase.label} ordinary objective guide resumes`,
        timeout: 8500
      }).toBe(2);
      const guided = await report(page);
      expect(guided.focused, `${testCase.label} delayed guide does not steal focus`).toBe("shuffleBtn");
      expect(guided.state.moves).toBe(movesLeft);

      await page.reload({ waitUntil: "networkidle" });
      const reloaded = await report(page);
      expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY), `${testCase.label} reload atomicity`)
        .toBe(settledSave);
      expect(reloaded.bodyClasses).not.toContain("settled-board-outcome-cue");
      expect(reloaded.cue).not.toContain("Board shuffled.");
      expect(reloaded.state.moves).toBe(movesLeft);
      expect(reloaded.tiles).toBe(64);
      expect(reloaded.rows).toBe(8);
      expect(browserErrors, `${testCase.label} browser errors`).toEqual([]);
      expect(failedRequests, `${testCase.label} request failures`).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("Shuffle receipt cancels on interaction and immediate reload", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const testCase = SHUFFLE_CASES.find(({ label, moves }) => label === "desktop-full-pointer" && moves === 5);
  try {
    await seedShuffleCase(page, testCase, "interaction");
    await activateShuffle(page, testCase);
    await expect(page.locator("#firstSwapCue")).toContainText("Board shuffled.", { timeout: 5000 });
    await page.locator("#tile-0-0").click();
    await page.waitForTimeout(2800);
    const interrupted = await report(page);
    expect(interrupted.bodyClasses).not.toContain("settled-board-outcome-cue");
    expect(interrupted.cue).not.toContain("Board shuffled.");
    expect(interrupted.state.moves).toBe(4);
    expect(interrupted.selected).toBe(1);
    expect(interrupted.focused).toBe("tile-0-0");

    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      state.moves = 5;
      localStorage.setItem(key, JSON.stringify(state));
    }, SAVE_KEY);
    await page.reload({ waitUntil: "networkidle" });
    await activateShuffle(page, testCase);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const reloaded = await report(page);
    expect(reloaded.state.moves).toBe(4);
    expect(reloaded.bodyClasses).not.toContain("settled-board-outcome-cue");
    expect(reloaded.cue).not.toContain("Board shuffled.");
    expect(reloaded.tiles).toBe(64);
    expect(reloaded.rows).toBe(8);
  } finally {
    await context.close();
  }
});

test("Shuffle receipt cancels in both background interruption windows", async ({ browser }) => {
  for (const phase of ["pending", "owner"]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true
    });
    const page = await context.newPage();
    const testCase = SHUFFLE_CASES.find(({ label, moves }) => label === "mobile-full-touch" && moves === 5);
    try {
      await seedShuffleCase(page, testCase, `background-${phase}`);
      await observeOutcomeChronology(page);
      await page.evaluate((phase) => {
        let forcedHidden = false;
        Object.defineProperty(document, "hidden", {
          configurable: true,
          get: () => forcedHidden
        });
        window.__setShuffleOutcomeDocumentHidden = (hidden) => {
          forcedHidden = hidden;
          document.dispatchEvent(new Event("visibilitychange"));
        };
        if (phase === "owner") {
          const observer = new MutationObserver(() => {
            if (
              document.body.classList.contains("settled-board-outcome-cue")
              && !(document.querySelector("#firstSwapCue")?.textContent.trim())
            ) {
              window.__setShuffleOutcomeDocumentHidden(true);
              observer.disconnect();
            }
          });
          observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        }
      }, phase);
      await activateShuffle(page, testCase);
      if (phase === "pending") {
        await page.evaluate(() => window.__setShuffleOutcomeDocumentHidden(true));
      }
      await page.waitForTimeout(1000);
      await page.evaluate(() => window.__setShuffleOutcomeDocumentHidden(false));
      await page.waitForTimeout(2600);
      const interrupted = await report(page);
      const chronology = await page.evaluate(() => window.__settledOutcomeChronology || []);
      expect(chronology, `${phase} background never mutates the receipt`).toEqual([]);
      expect(interrupted.bodyClasses).not.toContain("settled-board-outcome-cue");
      expect(interrupted.cue).not.toContain("Board shuffled.");
      expect(interrupted.state.moves).toBe(4);
      expect(interrupted.focused).toBe("shuffleBtn");
      expect(interrupted.roving).toHaveLength(1);
      expect(interrupted.tiles).toBe(64);
      expect(interrupted.rows).toBe(8);
      expect(interrupted.boardWidth).toBeCloseTo(378, 1);
      expect(interrupted.overflowX).toBe(false);
      expect(interrupted.overflowY).toBe(false);
      expect(interrupted.brokenImages).toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test("background interruption cancels the inter-frame result mutation", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  try {
    const testCase = CASES[0];
    await seedCase(page, testCase);
    await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 8500 });
    await observeOutcomeChronology(page);
    await page.evaluate(() => {
      let forcedHidden = false;
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => forcedHidden
      });
      const interruptionObserver = new MutationObserver(() => {
        if (
          document.body.classList.contains("settled-board-outcome-cue")
          && !(document.querySelector("#firstSwapCue")?.textContent.trim())
        ) {
          forcedHidden = true;
          document.dispatchEvent(new Event("visibilitychange"));
          interruptionObserver.disconnect();
        }
      });
      interruptionObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class"]
      });
    });
    await activatePair(page, testCase);
    await page.waitForFunction((key) => {
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      return state.moves === 3
        && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
    }, SAVE_KEY, { timeout: 12000 });
    await page.waitForTimeout(100);
    const interrupted = await report(page);
    const chronology = await page.evaluate(() => window.__settledOutcomeChronology || []);
    expect(chronology, "background interruption never mutates the result text").toEqual([]);
    expect(interrupted.bodyClasses, "background interruption retires transient authority")
      .not.toContain("settled-board-outcome-cue");
    expect(interrupted.cue, "background interruption restores the quiet prior cue")
      .not.toContain("moves left.");
    expect(interrupted.state.moves, "background interruption preserves accepted state").toBe(3);
    expect(interrupted.tiles, "background interruption preserves tile integrity").toBe(64);
    expect(interrupted.rows, "background interruption preserves row integrity").toBe(8);
    expect(interrupted.selected, "background interruption preserves no selection").toBe(0);
  } finally {
    await context.close();
  }
});

test("background interruption cancels pending feedback before owner exposure", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    const testCase = CASES[1];
    await seedCase(page, testCase);
    await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 8500 });
    await observeOutcomeChronology(page);
    await page.evaluate(() => {
      let forcedHidden = false;
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => forcedHidden
      });
      window.__setSettledOutcomeDocumentHidden = (hidden) => {
        forcedHidden = hidden;
        document.dispatchEvent(new Event("visibilitychange"));
      };
    });
    await activatePair(page, testCase);
    await page.waitForFunction((key) => {
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      return state.moves === 3
        && document.querySelector("#board")?.getAttribute("aria-busy") === "false"
        && !document.body.classList.contains("settled-board-outcome-cue")
        && (
          document.querySelectorAll(".board-particle").length > 0
          || document.querySelectorAll(".tile.harvest-flash, .tile.thorn-hit, .tile.thorn-cleared").length > 0
        );
    }, SAVE_KEY, { timeout: 12000 });
    await page.evaluate(() => window.__setSettledOutcomeDocumentHidden(true));
    await page.waitForTimeout(1400);
    await page.evaluate(() => window.__setSettledOutcomeDocumentHidden(false));
    await page.waitForTimeout(150);
    const interrupted = await report(page);
    const timeline = await page.evaluate(() => window.__settledOutcomeTimeline || []);
    const chronology = await page.evaluate(() => window.__settledOutcomeChronology || []);
    expect(timeline, "feedback-delay interruption never exposes an owner or result").toEqual([]);
    expect(chronology, "feedback-delay interruption never mutates a result").toEqual([]);
    expect(interrupted.bodyClasses, "feedback-delay interruption leaves no transient authority")
      .not.toContain("settled-board-outcome-cue");
    expect(interrupted.cue, "feedback-delay interruption cannot announce on foreground")
      .not.toContain("moves left.");
    expect(interrupted.state.moves, "feedback-delay interruption preserves accepted state").toBe(3);
    expect(interrupted.tiles, "feedback-delay interruption preserves tile integrity").toBe(64);
    expect(interrupted.rows, "feedback-delay interruption preserves row integrity").toBe(8);
    expect(interrupted.selected, "feedback-delay interruption preserves no selection").toBe(0);
    expect(interrupted.focused, "feedback-delay interruption keeps visible board focus").toMatch(/^tile-/);
    expect(interrupted.roving, "feedback-delay interruption keeps focus and roving aligned")
      .toEqual([interrupted.focused]);
    expect(interrupted.boardWidth, "feedback-delay interruption keeps exact mobile altar")
      .toBeCloseTo(378, 1);
    expect(interrupted.overflowX, "feedback-delay interruption keeps horizontal containment").toBe(false);
    expect(interrupted.overflowY, "feedback-delay interruption keeps vertical containment").toBe(false);
    expect(interrupted.brokenImages, "feedback-delay interruption keeps images loaded").toEqual([]);
  } finally {
    await context.close();
  }
});
