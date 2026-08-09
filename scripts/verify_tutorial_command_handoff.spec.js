const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const RAPID_REPEAT_MS = 60;
const TUTORIAL_COMMAND_INPUT_GUARD_MS = 280;
const TUTORIAL_COMMAND_SETTLED_GUARD_MS = 120;
const POST_BOUNDARY_MARGIN_MS = 20;
const runnerDelay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function pressRapidRepeat(page, key) {
  const startedAt = Date.now();
  await runnerDelay(RAPID_REPEAT_MS);
  const issuedAfter = Date.now() - startedAt;
  expect(issuedAfter, `${key} repeat is issued near +60ms`).toBeGreaterThanOrEqual(RAPID_REPEAT_MS - 10);
  expect(issuedAfter, `${key} repeat is issued before the guard boundary`)
    .toBeLessThan(TUTORIAL_COMMAND_INPUT_GUARD_MS);
  await page.keyboard.press(key);
}

test.use({
  launchOptions: process.env.BLOOM_CHROME_PATH
    ? { executablePath: process.env.BLOOM_CHROME_PATH }
    : {}
});

const CASES = [
  { label: "desktop-enter", viewport: { width: 1280, height: 720 }, input: "keyboard", key: "Enter" },
  { label: "desktop-space-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", key: "Space", reduced: true },
  { label: "mobile-enter", viewport: { width: 390, height: 844 }, input: "keyboard", key: "Enter", mobile: true },
  { label: "mobile-space-reduced", viewport: { width: 390, height: 844 }, input: "keyboard", key: "Space", mobile: true, reduced: true },
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "mobile-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true }
];

async function openFresh(page, label) {
  await page.addInitScript(({ key, marker }) => {
    window.__tutorialCommandTestEvents = [];
    window.__tutorialCommandTestSaves = [];
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function instrumentTutorialCommandSave(storageKey, value) {
      originalSetItem.call(this, storageKey, value);
      if (this === localStorage && storageKey === key) {
        window.__tutorialCommandTestSaves.push({ value: String(value), at: performance.now() });
      }
    };
    document.addEventListener("click", (event) => {
      if (["tutorialHelpBtn", "tutorialSkipBtn"].includes(event.target?.id)) {
        window.__tutorialCommandTestEvents.push({
          type: "click",
          targetId: event.target.id,
          detail: event.detail,
          at: performance.now()
        });
      }
    }, true);
    document.addEventListener("keydown", (event) => {
      if (["Enter", " "].includes(event.key)) {
        window.__tutorialCommandTestEvents.push({
          type: "keydown",
          targetId: event.target?.id || "",
          key: event.key,
          at: performance.now()
        });
      }
    }, true);
    if (!sessionStorage.getItem(marker)) {
      localStorage.removeItem(key);
      sessionStorage.setItem(marker, "1");
    }
  }, { key: SAVE_KEY, marker: `tutorial-command-handoff:${label}` });
  await page.goto(`${BASE_URL}?tutorial-command-handoff=${label}`, { waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
  await expect(page.locator("#tile-1-0")).toBeFocused();
}

async function expectGuardedRepeatChronology(page, ownerId, nextOwnerId, key) {
  const chronology = await page.evaluate(({
    ownerId: commandId,
    nextOwnerId: focusId,
    key: repeatKey,
    saveKey
  }) => {
    const events = window.__tutorialCommandTestEvents || [];
    const command = [...events].reverse().find((event) => (
      event.type === "click" && event.targetId === commandId && event.detail === 0
    ));
    const repeat = [...events].reverse().find((event) => (
      event.type === "keydown"
      && event.targetId === focusId
      && event.key === repeatKey
      && (!command || event.at >= command.at)
    ));
    const commandSave = command && repeat
      ? [...(window.__tutorialCommandTestSaves || [])].reverse().find((save) => (
        save.at >= command.at && save.at <= repeat.at
      ))
      : null;
    return {
      commandAt: command?.at ?? -1,
      repeatAt: repeat?.at ?? -1,
      elapsed: command && repeat ? repeat.at - command.at : -1,
      commandSave: commandSave?.value ?? null,
      currentSave: localStorage.getItem(saveKey),
      events: events.slice(-8)
    };
  }, { ownerId, nextOwnerId, key, saveKey: SAVE_KEY });
  const eventEvidence = JSON.stringify(chronology.events);
  expect(chronology.commandAt, `${ownerId} keyboard command is observed: ${eventEvidence}`)
    .toBeGreaterThanOrEqual(0);
  expect(chronology.repeatAt, `${nextOwnerId} guarded repeat is observed: ${eventEvidence}`)
    .toBeGreaterThanOrEqual(0);
  expect(chronology.elapsed, `${ownerId} repeat dispatch follows its +60ms issue`).toBeGreaterThanOrEqual(RAPID_REPEAT_MS - 10);
  expect(chronology.elapsed, `${ownerId} repeat dispatch remains inside the bounded guard`)
    .toBeLessThan(TUTORIAL_COMMAND_INPUT_GUARD_MS);
  expect(chronology.commandSave, `${ownerId} command save is observed`).not.toBeNull();
  expect(chronology.currentSave, `${ownerId} repeat leaves the command save byte-identical`)
    .toBe(chronology.commandSave);
  return chronology;
}

async function waitPastCommandBoundary(page, ownerId) {
  const remaining = await page.evaluate(({ ownerId: commandId, boundaryMs }) => {
    const command = [...(window.__tutorialCommandTestEvents || [])].reverse().find((event) => (
      event.type === "click" && event.targetId === commandId
    ));
    return command ? Math.max(0, boundaryMs - (performance.now() - command.at)) : boundaryMs;
  }, {
    ownerId,
    boundaryMs: TUTORIAL_COMMAND_SETTLED_GUARD_MS + POST_BOUNDARY_MARGIN_MS
  });
  if (remaining > 0) {
    await page.waitForTimeout(remaining);
  }
}

async function activate(page, selector, testCase) {
  const target = page.locator(selector);
  if (testCase.input === "touch") {
    await target.tap();
  } else if (testCase.input === "pointer") {
    await target.click();
  } else {
    await target.focus();
    await page.keyboard.press(testCase.key);
  }
}

async function report(page) {
  return page.evaluate((key) => {
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const visible = (node) => Boolean(node)
      && !node.hidden
      && getComputedStyle(node).display !== "none"
      && getComputedStyle(node).visibility !== "hidden"
      && node.getBoundingClientRect().width > 0
      && node.getBoundingClientRect().height > 0;
    return {
      save: localStorage.getItem(key),
      state: JSON.parse(localStorage.getItem(key) || "{}"),
      activeId: document.activeElement?.id || "",
      tutorialVisible: visible(document.querySelector("#tutorialPanel")),
      tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      liveOwners: Array.from(document.querySelectorAll("[aria-live]"))
        .filter(visible)
        .filter((node) => ["polite", "assertive"].includes(node.getAttribute("aria-live")))
        .map((node) => node.id),
      selectedIds: tiles
        .filter((tile) => tile.classList.contains("selected") || tile.classList.contains("sel"))
        .map((tile) => tile.id),
      rovingIds: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      boardWidth: board?.width || 0,
      boardBottom: board?.bottom || 0,
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

function expectBoardIntegrity(state, testCase, label) {
  expect(state.tiles, `${label} tile count`).toBe(64);
  expect(state.rows, `${label} row count`).toBe(8);
  expect(state.boardWidth, `${label} altar width`).toBeCloseTo(testCase.mobile ? 378 : 600, 1);
  expect(state.boardBottom, `${label} altar stays in viewport`).toBeLessThanOrEqual(testCase.viewport.height);
  expect(state.scrollY, `${label} viewport remains at top`).toBe(0);
  expect(state.overflowX, `${label} no horizontal overflow`).toBe(false);
  if (testCase.mobile) {
    expect(state.overflowY, `${label} no vertical overflow`).toBe(false);
  }
  expect(state.brokenImages, `${label} images remain loaded`).toEqual([]);
}

for (const testCase of CASES) {
  test(`tutorial commands cannot carry input into the next owner on ${testCase.label}`, async ({ browser }) => {
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
      failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`);
    });

    try {
      await openFresh(page, testCase.label);
      await activate(page, "#tutorialSkipBtn", testCase);
      await expect(page.locator("#tutorialPanel")).toBeHidden();
      await expect(page.locator("#tile-1-0")).toBeFocused();
      if (testCase.input === "keyboard") {
        await waitPastCommandBoundary(page, "tutorialSkipBtn");
        await page.keyboard.press("Tab");
        await expect(page.locator("#tutorialHelpBtn")).toBeFocused();
      }

      if (testCase.input === "keyboard") {
        await page.keyboard.press(testCase.key);
      } else {
        await activate(page, "#tutorialHelpBtn", testCase);
      }

      if (testCase.input === "keyboard") {
        await pressRapidRepeat(page, testCase.key);
        await expectGuardedRepeatChronology(
          page,
          "tutorialHelpBtn",
          "tutorialSkipBtn",
          testCase.key === "Space" ? " " : testCase.key
        );
        await expect(page.locator("#tutorialPanel")).toBeVisible();
        await expect(page.locator("#tutorialSkipBtn")).toBeFocused();
        const guardedHelp = await report(page);
        expect(guardedHelp.tutorialVisible, `${testCase.label} repeat does not dismiss Help`).toBe(true);
        expect(guardedHelp.activeId, `${testCase.label} Skip retains focus`).toBe("tutorialSkipBtn");
        expect(guardedHelp.tutorialCopy, `${testCase.label} replay copy`).toBe("Swap the glowing flowers.");
        expect(guardedHelp.liveOwners, `${testCase.label} tutorial is sole narrator`).toEqual(["tutorialPanel"]);
        expect(guardedHelp.selectedIds, `${testCase.label} Help repeat selects no flower`).toEqual([]);
        expect(guardedHelp.rovingIds, `${testCase.label} source remains sole roving tile`).toEqual(["tile-1-0"]);
        expectBoardIntegrity(guardedHelp, testCase, `${testCase.label} Help owner`);
        if (["desktop-enter", "mobile-enter"].includes(testCase.label)) {
          await page.screenshot({
            path: `work/tutorial-command-handoff-${testCase.label}.png`,
            fullPage: false
          });
        }
        await waitPastCommandBoundary(page, "tutorialHelpBtn");
        await page.keyboard.press("Shift+Tab");
        await expect(page.locator("#tile-1-0")).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(page.locator("#tutorialSkipBtn")).toBeFocused();
      } else {
        await expect(page.locator("#tutorialPanel")).toBeVisible();
        const helpOpen = await report(page);
        expect(helpOpen.tutorialCopy, `${testCase.label} replay copy`).toBe("Swap the glowing flowers.");
        expect(helpOpen.liveOwners, `${testCase.label} tutorial is sole narrator`).toEqual(["tutorialPanel"]);
        expectBoardIntegrity(helpOpen, testCase, `${testCase.label} Help owner`);
      }

      await activate(page, "#tutorialSkipBtn", testCase);
      const skippedFocusId = testCase.input === "keyboard" ? "tutorialHelpBtn" : "tile-1-0";

      if (testCase.input === "keyboard") {
        await pressRapidRepeat(page, testCase.key);
        await expectGuardedRepeatChronology(
          page,
          "tutorialSkipBtn",
          "tutorialHelpBtn",
          testCase.key === "Space" ? " " : testCase.key
        );
        await expect(page.locator("#tutorialPanel")).toBeHidden();
        await expect(page.locator(`#${skippedFocusId}`)).toBeFocused();
        const guardedSkip = await report(page);
        expect(guardedSkip.tutorialVisible, `${testCase.label} Skip remains dismissed`).toBe(false);
        expect(guardedSkip.activeId, `${testCase.label} Help keeps focus`).toBe("tutorialHelpBtn");
        expect(guardedSkip.selectedIds, `${testCase.label} repeat selects no source`).toEqual([]);
        expect(guardedSkip.rovingIds, `${testCase.label} source remains sole roving tile`).toEqual(["tile-1-0"]);
        await waitPastCommandBoundary(page, "tutorialSkipBtn");
        await page.keyboard.press("Shift+Tab");
        await expect(page.locator("#tile-1-0")).toBeFocused();
      } else {
        await expect(page.locator("#tutorialPanel")).toBeHidden();
        await expect(page.locator(`#${skippedFocusId}`)).toBeFocused();
        const skipped = await report(page);
        expect(skipped.selectedIds, `${testCase.label} Skip starts no exchange`).toEqual([]);
        expect(skipped.rovingIds, `${testCase.label} Skip restores sole source`).toEqual(["tile-1-0"]);
      }

      await activate(page, "#tile-1-0", testCase);
      await activate(page, "#tile-1-1", testCase);
      await page.waitForFunction((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === 5
          && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
      }, SAVE_KEY, { timeout: 12000 });
      const committed = await report(page);
      expect(committed.state.moves, `${testCase.label} deliberate exchange commits once`).toBe(5);
      expect(committed.state.counts[5], `${testCase.label} earns Thorn Rose`).toBeGreaterThan(0);
      expect(committed.selectedIds, `${testCase.label} exchange clears selection`).toEqual([]);
      expect(committed.activeId, `${testCase.label} focus returns to board`).toMatch(/^tile-/);
      expect(committed.rovingIds, `${testCase.label} focus and roving agree`).toEqual([committed.activeId]);
      expectBoardIntegrity(committed, testCase, testCase.label);
      expect(browserErrors, `${testCase.label} browser errors`).toEqual([]);
      expect(failedRequests, `${testCase.label} request errors`).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
