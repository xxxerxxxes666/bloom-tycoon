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
  }
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
    if (testCase.mode === "ordinary") {
      const filler = (testCase.target + 1) % 6;
      board[0][0] = testCase.target;
      board[0][1] = filler;
      board[0][2] = testCase.target;
      board[0][3] = filler;
      board[1][1] = testCase.target;
      state.armedLineRelic = null;
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
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      disabled: tiles.filter((tile) => tile.disabled).length,
      boardWidth: board?.width || 0,
      boardBottom: board?.bottom || 0,
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
      expect(settled.cue, `${testCase.label} names the actual target gain`).toContain("+");
      expect(settled.cue, `${testCase.label} gives the settled objective count`)
        .toMatch(/\d+ of \d+/);
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
      expect(settled.state.counts[testCase.target], `${testCase.label} target gained after cascades`)
        .toBeGreaterThan(before.state.counts[testCase.target]);
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
