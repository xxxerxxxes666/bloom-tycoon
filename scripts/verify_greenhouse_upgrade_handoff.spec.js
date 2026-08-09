const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const CONFIGS = [
  { label: "desktop-enter", viewport: { width: 1280, height: 720 }, input: "Enter" },
  { label: "desktop-space-reduced", viewport: { width: 1280, height: 720 }, input: "Space", reduced: true },
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "mobile-enter", viewport: { width: 390, height: 844 }, input: "Enter", mobile: true },
  { label: "mobile-space-reduced", viewport: { width: 390, height: 844 }, input: "Space", mobile: true, reduced: true },
  { label: "mobile-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true }
];

const OWNED_REPLAY_CONFIGS = [
  { label: "desktop-full", viewport: { width: 1280, height: 720 } },
  { label: "desktop-reduced", viewport: { width: 1280, height: 720 }, reduced: true },
  { label: "mobile-full", viewport: { width: 390, height: 844 }, mobile: true },
  { label: "mobile-reduced", viewport: { width: 390, height: 844 }, mobile: true, reduced: true }
];

test.setTimeout(180000);

function completedRoundTwoState() {
  return {
    focusedEconomyVersion: 2,
    currentRound: 2,
    moves: 1,
    counts: [0, 0, 10, 0, 9, 7],
    coins: 170,
    cursedThorns: [],
    clearedCursedThorns: 3,
    roundComplete: true,
    roundOneRestored: true,
    roundTwoGreenhouseUpgraded: false,
    roundThreeConservatoryRaised: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
}

function completedOwnedReplayRoundTwoState() {
  return {
    ...completedRoundTwoState(),
    coins: 50,
    roundTwoGreenhouseUpgraded: true,
    roundThreeConservatoryRaised: true,
    freshConservatorySettlement: false
  };
}

async function activate(page, config, locator, point = null) {
  if (config.input === "pointer") {
    await page.mouse.click(point.x, point.y);
  } else if (config.input === "touch") {
    await page.touchscreen.tap(point.x, point.y);
  } else {
    await locator.focus();
    await page.keyboard.press(config.input);
  }
}

async function report(page) {
  return page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const visibleRect = (node) => {
      if (!visible(node)) return null;
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
    };
    const receipt = document.querySelector("#nextOrderCue");
    const steadyCue = document.querySelector("#firstSwapCue");
    const command = visible(receipt) ? receipt : visible(steadyCue) ? steadyCue : null;
    const region = document.querySelector("#tutorialCommandRegion");
    return {
      save: localStorage.getItem(key),
      round: saved.currentRound,
      moves: saved.moves,
      counts: saved.counts,
      coins: saved.coins,
      complete: saved.roundComplete,
      restored: saved.roundOneRestored,
      upgraded: saved.roundTwoGreenhouseUpgraded,
      raised: saved.roundThreeConservatoryRaised,
      activeId: document.activeElement?.id || "",
      visibleActions: ["restoreGreenhouseBtn", "nextOrderBtn"]
        .filter((id) => visible(document.getElementById(id))),
      awakening: document.querySelector("#roundOneRestoration")?.classList.contains("restoration-awakening"),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      rovingIds: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      board: board ? { width: board.width, height: board.height, bottom: board.bottom } : null,
      handoffActive: document.body.classList.contains("restored-greenhouse-handoff"),
      geometry: {
        viewport: { left: 0, top: 0, right: innerWidth, bottom: innerHeight },
        region: visibleRect(region),
        command: visibleRect(command),
        commandId: command?.id || "",
        commandText: command?.textContent.replace(/\s+/g, " ").trim() || "",
        commandClientWidth: command?.clientWidth || 0,
        commandScrollWidth: command?.scrollWidth || 0,
        commandClientHeight: command?.clientHeight || 0,
        commandScrollHeight: command?.scrollHeight || 0,
        regionClientWidth: region?.clientWidth || 0,
        regionScrollWidth: region?.scrollWidth || 0,
        title: visibleRect(document.querySelector(".title")),
        help: visibleRect(document.querySelector("#tutorialHelpBtn")),
        objective: visibleRect(document.querySelector("#objective")),
        hud: visibleRect(document.querySelector("#bouquetProgress")),
        greenhouse: visibleRect(innerWidth <= 760
          ? document.querySelector("#mobileGreenhouseProgress")
          : document.querySelector(".hero")),
        board: visibleRect(document.querySelector("#board"))
      },
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

function contains(outer, inner, tolerance = 0.5) {
  return Boolean(
    outer
    && inner
    && inner.left >= outer.left - tolerance
    && inner.right <= outer.right + tolerance
    && inner.top >= outer.top - tolerance
    && inner.bottom <= outer.bottom + tolerance
  );
}

function intersects(first, second, tolerance = 0.5) {
  return Boolean(
    first
    && second
    && Math.min(first.right, second.right) - Math.max(first.left, second.left) > tolerance
    && Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > tolerance
  );
}

function expectCommandLaneGeometry(state, label, expectedCommandId) {
  const geometry = state.geometry;
  expect(geometry.commandId, `${label} command owner`).toBe(expectedCommandId);
  if (geometry.board?.width >= 599 && expectedCommandId) {
    expect(geometry.region.top, `${label} command region begins below the masthead`)
      .toBeGreaterThanOrEqual(geometry.title.bottom + 1);
  }
  const visibleRects = {
    region: geometry.region,
    title: geometry.title,
    help: geometry.help,
    objective: geometry.objective,
    hud: geometry.hud,
    greenhouse: geometry.greenhouse,
    board: geometry.board
  };
  if (expectedCommandId) visibleRects.command = geometry.command;
  for (const [name, rect] of Object.entries(visibleRects)) {
    expect(contains(geometry.viewport, rect), `${label} ${name} is contained in the viewport`).toBe(true);
  }
  expect(contains(geometry.region, geometry.help), `${label} Help belongs to the command region`).toBe(true);
  expect(geometry.regionScrollWidth, `${label} command region has no horizontal overflow`)
    .toBeLessThanOrEqual(geometry.regionClientWidth + 1);
  if (expectedCommandId) {
    expect(geometry.commandText, `${label} complete command copy`).not.toBe("");
    expect(contains(geometry.region, geometry.command), `${label} command belongs to the command region`).toBe(true);
    expect(geometry.commandScrollWidth, `${label} command has no internal horizontal overflow`)
      .toBeLessThanOrEqual(geometry.commandClientWidth + 1);
    expect(geometry.commandScrollHeight, `${label} command has no internal vertical overflow`)
      .toBeLessThanOrEqual(geometry.commandClientHeight + 1);
    expect(intersects(geometry.command, geometry.help), `${label} command clears Help`).toBe(false);
  }

  const externalSurfaces = ["title", "objective", "hud", "greenhouse", "board"];
  for (const surface of externalSurfaces) {
    expect(intersects(geometry.region, geometry[surface]), `${label} command region clears ${surface}`)
      .toBe(false);
  }
  const independentSurfaces = ["title", "help", "objective", "hud", "greenhouse", "board"];
  for (let first = 0; first < independentSurfaces.length; first += 1) {
    for (let second = first + 1; second < independentSurfaces.length; second += 1) {
      const firstName = independentSurfaces[first];
      const secondName = independentSurfaces[second];
      expect(
        intersects(geometry[firstName], geometry[secondName]),
        `${label} ${firstName} clears ${secondName}: ${JSON.stringify({
          [firstName]: geometry[firstName],
          [secondName]: geometry[secondName]
        })}`
      ).toBe(false);
    }
  }
}

function expectGeometry(state, config, label, boardVisible = false) {
  expect(state.tiles, `${label} tiles`).toBe(64);
  expect(state.rows, `${label} rows`).toBe(8);
  if (boardVisible) {
    expect(state.board.width, `${label} board width`).toBeCloseTo(config.mobile ? 378 : 600, 1);
    expect(state.board.height, `${label} board height`).toBeCloseTo(config.mobile ? 378 : 600, 1);
    expect(state.board.bottom, `${label} board bottom`).toBeLessThanOrEqual(config.viewport.height);
  }
  expect(state.scrollY, `${label} scroll`).toBe(0);
  expect(state.overflowX, `${label} x overflow`).toBe(false);
  if (config.mobile) expect(state.overflowY, `${label} y overflow`).toBe(false);
  expect(state.brokenImages, `${label} images`).toEqual([]);
}

for (const config of CONFIGS) {
  test(`Moonlit upgrade input cannot carry into Next Order on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: Boolean(config.mobile),
      isMobile: Boolean(config.mobile),
      reducedMotion: config.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const errors = [];
    const failedRequests = [];
    const httpErrors = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText || "";
      if (failure !== "net::ERR_ABORTED") failedRequests.push(`${request.url()} ${failure}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
    });

    try {
      const marker = `greenhouse-upgrade-handoff:${config.label}`;
      await page.addInitScript(({ key, fixtureMarker, state }) => {
        if (!sessionStorage.getItem(fixtureMarker)) {
          localStorage.setItem(key, JSON.stringify(state));
          sessionStorage.setItem(fixtureMarker, "seeded");
        }
      }, { key: SAVE_KEY, fixtureMarker: marker, state: completedRoundTwoState() });
      await page.goto(`${BASE_URL}?greenhouse-upgrade-handoff=${config.label}`, { waitUntil: "networkidle" });

      const upgrade = page.locator("#restoreGreenhouseBtn");
      await expect(upgrade).toBeVisible();
      await expect(upgrade).toBeEnabled();
      await expect(upgrade).toBeFocused();
      const box = await upgrade.boundingBox();
      const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      await activate(page, config, upgrade, point);
      await page.waitForFunction((key) => {
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        return saved.currentRound === 2 && saved.roundTwoGreenhouseUpgraded === true && saved.coins === 50;
      }, SAVE_KEY);
      const upgraded = await report(page);
      expect(upgraded).toMatchObject({
        round: 2,
        moves: 1,
        counts: [0, 0, 10, 0, 9, 7],
        coins: 50,
        complete: true,
        restored: true,
        upgraded: true,
        raised: false,
        activeId: "nextOrderBtn",
        visibleActions: ["nextOrderBtn"]
      });
      expect(upgraded.awakening, `${config.label} awakening starts`).toBe(true);

      await page.waitForTimeout(60);
      await activate(page, config, page.locator("#nextOrderBtn"), point);
      await page.waitForTimeout(380);
      const guarded = await report(page);
      expect(guarded.round, `${config.label} repeat does not enter Round 3`).toBe(2);
      expect(guarded.save, `${config.label} repeat preserves settled spend`).toBe(upgraded.save);
      expect(guarded.coins, `${config.label} spends once`).toBe(50);
      expect(guarded.upgraded).toBe(true);
      expect(guarded.complete).toBe(true);
      expect(guarded.activeId, `${config.label} Next Order retains focus`).toBe("nextOrderBtn");
      expect(guarded.visibleActions).toEqual(["nextOrderBtn"]);
      expect(guarded.selected).toEqual([]);
      expect(guarded.rovingIds, `${config.label} hidden board has no roving stop`).toEqual([]);
      expectGeometry(guarded, config, `${config.label} guarded`);

      await page.waitForTimeout(100);
      await activate(page, config, page.locator("#nextOrderBtn"), point);
      await page.waitForFunction((key) => {
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        return saved.currentRound === 3 && saved.roundComplete === false && saved.moves === 8;
      }, SAVE_KEY);
      await page.waitForTimeout(120);
      const entered = await report(page);
      expect(entered).toMatchObject({
        round: 3,
        moves: 8,
        counts: [0, 0, 0, 0, 0, 0],
        coins: 50,
        complete: false,
        restored: true,
        upgraded: true,
        raised: false,
        selected: [],
        tiles: 64,
        rows: 8
      });
      expect(entered.rovingIds).toHaveLength(1);
      expect(entered.activeId).toBe(entered.rovingIds[0]);
      expectGeometry(entered, config, `${config.label} entered`, true);
      expect(entered.handoffActive, `${config.label} bounded receipt is active`).toBe(true);
      expectCommandLaneGeometry(entered, `${config.label} receipt`, "nextOrderCue");
      expect(errors, `${config.label} console`).toEqual([]);
      expect(failedRequests, `${config.label} requests`).toEqual([]);
      expect(httpErrors, `${config.label} HTTP responses`).toEqual([]);

      const evidenceLabels = {
        "desktop-enter": "desktop-full",
        "desktop-space-reduced": "desktop-reduced",
        "mobile-enter": "mobile-full",
        "mobile-space-reduced": "mobile-reduced"
      };
      if (evidenceLabels[config.label]) {
        await page.screenshot({
          path: `work/greenhouse-upgrade-handoff-${evidenceLabels[config.label]}-receipt.png`,
          fullPage: false
        });
      }

      await page.waitForFunction(() => !document.body.classList.contains("restored-greenhouse-handoff"), null, {
        timeout: 3000
      });
      await page.waitForTimeout(80);
      const retired = await report(page);
      expect(retired.handoffActive, `${config.label} receipt retires on its existing lifecycle`).toBe(false);
      expect(retired.save, `${config.label} retirement is presentation-only`).toBe(entered.save);
      expect(retired).toMatchObject({
        round: 3,
        moves: 8,
        counts: [0, 0, 0, 0, 0, 0],
        coins: 50,
        complete: false,
        restored: true,
        upgraded: true,
        raised: false,
        selected: [],
        tiles: 64,
        rows: 8
      });
      expect(retired.rovingIds).toHaveLength(1);
      expect(retired.activeId).toBe(retired.rovingIds[0]);
      expectGeometry(retired, config, `${config.label} retired`, true);
      expectCommandLaneGeometry(retired, `${config.label} retired`, "");
      expect(errors, `${config.label} retired console`).toEqual([]);
      expect(failedRequests, `${config.label} retired requests`).toEqual([]);
      expect(httpErrors, `${config.label} retired HTTP responses`).toEqual([]);

      if (evidenceLabels[config.label]) {
        await page.screenshot({
          path: `work/greenhouse-upgrade-handoff-${evidenceLabels[config.label]}-retired.png`,
          fullPage: false
        });
      }
    } finally {
      await context.close();
    }
  });
}

for (const config of OWNED_REPLAY_CONFIGS) {
  test(`owned replay Next Order keeps its receipt below the masthead on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: Boolean(config.mobile),
      isMobile: Boolean(config.mobile),
      reducedMotion: config.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const errors = [];
    const failedRequests = [];
    const httpErrors = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText || "";
      if (failure !== "net::ERR_ABORTED") failedRequests.push(`${request.url()} ${failure}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
    });

    try {
      const marker = `owned-replay-handoff:${config.label}`;
      await page.addInitScript(({ key, fixtureMarker, state }) => {
        if (!sessionStorage.getItem(fixtureMarker)) {
          localStorage.setItem(key, JSON.stringify(state));
          sessionStorage.setItem(fixtureMarker, "seeded");
        }
      }, { key: SAVE_KEY, fixtureMarker: marker, state: completedOwnedReplayRoundTwoState() });
      await page.goto(`${BASE_URL}?owned-replay-handoff=${config.label}`, { waitUntil: "networkidle" });

      const nextOrder = page.locator("#nextOrderBtn");
      await expect(nextOrder).toBeVisible();
      await expect(nextOrder).toBeEnabled();
      await expect(nextOrder).toBeFocused();
      await nextOrder.click();
      await page.waitForFunction((key) => {
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        return saved.currentRound === 3 && saved.roundComplete === false && saved.moves === 8;
      }, SAVE_KEY);

      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      const firstFrame = await report(page);
      expect(firstFrame.geometry.commandText).toBe(
        "Moonlit Upgrade · Bloodroot Compact · Match Bloodroot + Sol Rot"
      );
      expect(firstFrame.handoffActive, `${config.label} first-frame receipt`).toBe(true);
      expectCommandLaneGeometry(firstFrame, `${config.label} first frame`, "nextOrderCue");
      expectGeometry(firstFrame, config, `${config.label} first frame`, true);

      await page.waitForTimeout(120);
      const at120ms = await report(page);
      expect(at120ms.handoffActive, `${config.label} 120ms receipt`).toBe(true);
      expectCommandLaneGeometry(at120ms, `${config.label} 120ms`, "nextOrderCue");
      expectGeometry(at120ms, config, `${config.label} 120ms`, true);

      await page.waitForTimeout(1580);
      const at1700ms = await report(page);
      expect(at1700ms.handoffActive, `${config.label} 1700ms receipt`).toBe(true);
      expectCommandLaneGeometry(at1700ms, `${config.label} 1700ms`, "nextOrderCue");
      expectGeometry(at1700ms, config, `${config.label} 1700ms`, true);
      expect(at1700ms).toMatchObject({
        round: 3,
        moves: 8,
        counts: [0, 0, 0, 0, 0, 0],
        coins: 50,
        complete: false,
        restored: true,
        upgraded: true,
        raised: true,
        selected: [],
        tiles: 64,
        rows: 8
      });
      expect(at1700ms.rovingIds).toHaveLength(1);
      expect(at1700ms.activeId).toBe(at1700ms.rovingIds[0]);
      expect(errors, `${config.label} console`).toEqual([]);
      expect(failedRequests, `${config.label} requests`).toEqual([]);
      expect(httpErrors, `${config.label} HTTP responses`).toEqual([]);

      await page.waitForFunction(() => !document.body.classList.contains("restored-greenhouse-handoff"), null, {
        timeout: 3000
      });
      const retired = await report(page);
      expect(retired.save, `${config.label} retirement remains presentation-only`).toBe(at1700ms.save);
      expect(retired.handoffActive).toBe(false);
      expectCommandLaneGeometry(retired, `${config.label} retired`, "");
      expectGeometry(retired, config, `${config.label} retired`, true);
      expect(errors, `${config.label} retired console`).toEqual([]);
      expect(failedRequests, `${config.label} retired requests`).toEqual([]);
      expect(httpErrors, `${config.label} retired HTTP responses`).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
