const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const CASES = [
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
  { label: "mobile390-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "mobile390-touch-reduced", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
];

test.setTimeout(90000);

async function openFresh(page, testCase) {
  if (testCase.reduced) {
    await page.emulateMedia({ reducedMotion: "reduce" });
  }
  await page.goto(`${BASE_URL}?audio-visibility=${testCase.label}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await page.evaluate(() => {
    let forcedHidden = false;
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => forcedHidden
    });
    window.__setAudioVisibilityHidden = (hidden) => {
      forcedHidden = hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    };
  });
}

async function activateOpeningPair(page, testCase) {
  const source = page.locator("#tile-1-0");
  const destination = page.locator("#tile-1-1");
  if (testCase.input === "keyboard") {
    await source.press("Enter");
    await destination.press("Space");
    return;
  }
  if (testCase.input === "touch") {
    for (const tile of [source, destination]) {
      const box = await tile.boundingBox();
      expect(box, `${testCase.label} guided tile box`).toBeTruthy();
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    }
    return;
  }
  await source.click();
  await destination.click();
}

async function report(page) {
  return page.evaluate((key) => {
    const tiles = [...document.querySelectorAll(".tile")];
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const board = document.querySelector("#board")?.getBoundingClientRect();
    return {
      audio: window.__bloomAudioProbe(),
      moves: state.moves,
      counts: state.counts,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).length,
      boardWidth: board?.width || 0,
      boardHeight: board?.height || 0,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      brokenImages: [...document.images]
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src)
    };
  }, SAVE_KEY);
}

for (const testCase of CASES) {
  test(`active soundscape follows page visibility on ${testCase.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile)
    });
    const page = await context.newPage();
    const browserErrors = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));
    try {
      await openFresh(page, testCase);
      await activateOpeningPair(page, testCase);
      await expect.poll(async () => (await page.evaluate(() => window.__bloomAudioProbe())).contextState)
        .toBe("running");

      await page.evaluate(() => window.__setAudioVisibilityHidden(true));
      await expect.poll(async () => (await page.evaluate(() => window.__bloomAudioProbe())).contextState)
        .toBe("suspended");
      const hidden = await report(page);
      expect(hidden.audio.visibilitySuspended, `${testCase.label} owns its suspension`).toBe(true);
      await page.waitForTimeout(900);
      const hiddenSettled = await report(page);
      expect(hiddenSettled.audio.contextState, `${testCase.label} stays quiet while hidden`).toBe("suspended");
      expect(hiddenSettled.audio.voiceCount, `${testCase.label} schedules no hidden voices`)
        .toBe(hidden.audio.voiceCount);

      await page.evaluate(() => window.__setAudioVisibilityHidden(false));
      await expect.poll(async () => (await page.evaluate(() => window.__bloomAudioProbe())).contextState)
        .toBe("running");
      await expect.poll(async () => (await report(page)).moves).toBe(5);
      const restored = await report(page);
      expect(restored.audio.visibilitySuspended, `${testCase.label} retires suspension authority`).toBe(false);
      expect(restored.counts[5], `${testCase.label} accepted Thorn Rose match`).toBe(3);
      expect(restored.tiles).toBe(64);
      expect(restored.rows).toBe(8);
      expect(restored.roving).toEqual([restored.active]);
      expect(restored.selected).toBe(0);
      expect(restored.boardWidth).toBeCloseTo(testCase.mobile ? 378 : 600, 1);
      expect(restored.boardHeight).toBeCloseTo(testCase.mobile ? 378 : 600, 1);
      expect(restored.overflowX).toBe(false);
      expect(restored.overflowY).toBe(false);
      expect(restored.brokenImages).toEqual([]);
      expect(browserErrors).toEqual([]);

      await page.reload({ waitUntil: "networkidle" });
      const reloaded = await report(page);
      expect(reloaded.audio.contextState, `${testCase.label} reload does not replay audio`).toBe("uninitialized");
      expect(reloaded.audio.soundscapeActive, `${testCase.label} reload leaves soundscape quiet`).toBe(false);
      expect(reloaded.moves).toBe(5);
      expect(reloaded.counts[5]).toBe(3);
      expect(reloaded.tiles).toBe(64);
      expect(reloaded.rows).toBe(8);
    } finally {
      await context.close();
    }
  });
}

test("a hidden first move cannot create or foreground-replay audio", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    const testCase = CASES[3];
    await openFresh(page, testCase);
    await page.evaluate(() => window.__setAudioVisibilityHidden(true));
    await activateOpeningPair(page, testCase);
    await page.waitForTimeout(900);
    const hidden = await report(page);
    expect(hidden.audio.contextState).toBe("uninitialized");
    expect(hidden.audio.soundscapeActive).toBe(false);
    expect(hidden.audio.voiceCount).toBe(0);
    expect(hidden.moves).toBe(5);
    expect(hidden.counts[5]).toBe(3);

    await page.evaluate(() => window.__setAudioVisibilityHidden(false));
    await page.waitForTimeout(200);
    const restored = await report(page);
    expect(restored.audio.contextState, "foreground does not replay a hidden move").toBe("uninitialized");
    expect(restored.audio.soundscapeActive).toBe(false);
    expect(restored.tiles).toBe(64);
    expect(restored.rows).toBe(8);
    expect(restored.overflowX).toBe(false);
    expect(restored.overflowY).toBe(false);
    expect(restored.brokenImages).toEqual([]);
  } finally {
    await context.close();
  }
});
