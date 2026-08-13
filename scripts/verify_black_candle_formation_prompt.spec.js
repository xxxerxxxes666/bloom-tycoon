const { test, expect } = require("@playwright/test");
const { inflateSync } = require("node:zlib");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const PROMPT = "Match 4 Bone Stars to arm Black Candle Vine.";
const CUE = "Make 4 Bone Stars - arm Black Candle Vine.";

test.setTimeout(220000);

function decodePng(png) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(png.subarray(0, 8).equals(signature), "Chromium screenshot is a PNG").toBe(true);
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      expect(data[8], "8-bit screenshot channels").toBe(8);
      colorType = data[9];
      expect(data[12], "non-interlaced screenshot").toBe(0);
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += length + 12;
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  expect(channels, `supported Chromium PNG color type ${colorType}`).toBeGreaterThan(0);
  const packed = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  const paeth = (left, above, upperLeft) => {
    const estimate = left + above - upperLeft;
    const leftDistance = Math.abs(estimate - left);
    const aboveDistance = Math.abs(estimate - above);
    const upperLeftDistance = Math.abs(estimate - upperLeft);
    return leftDistance <= aboveDistance && leftDistance <= upperLeftDistance
      ? left : aboveDistance <= upperLeftDistance ? above : upperLeft;
  };
  let source = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = packed[source];
    source += 1;
    for (let x = 0; x < stride; x += 1) {
      const raw = packed[source + x];
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const above = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= channels
        ? pixels[(y - 1) * stride + x - channels] : 0;
      const value = filter === 0 ? raw
        : filter === 1 ? raw + left
          : filter === 2 ? raw + above
            : filter === 3 ? raw + Math.floor((left + above) / 2)
              : filter === 4 ? raw + paeth(left, above, upperLeft)
                : NaN;
      if (Number.isNaN(value)) throw new Error(`Unsupported PNG row filter ${filter}`);
      pixels[y * stride + x] = value & 255;
    }
    source += stride;
  }
  return { width, height, channels, pixels };
}

function paintedRowRatios(png) {
  const { width, height, channels, pixels } = decodePng(png);
  return Array.from({ length: 8 }, (_, row) => {
    let painted = 0;
    let sampled = 0;
    const rowTop = Math.floor((row * height) / 8);
    const rowBottom = Math.floor(((row + 1) * height) / 8);
    for (let y = rowTop + 4; y < rowBottom - 4; y += 2) {
      for (let x = 4; x < width - 4; x += 2) {
        const pixel = (y * width + x) * channels;
        const red = pixels[pixel];
        const green = pixels[pixel + 1];
        const blue = pixels[pixel + 2];
        painted += red + green + blue >= 54 ? 1 : 0;
        sampled += 1;
      }
    }
    return painted / sampled;
  });
}

async function seedDeterministicMath(page, seedLabel) {
  await page.addInitScript((label) => {
    let seed = 0;
    for (let index = 0; index < label.length; index += 1) {
      seed = (seed * 31 + label.charCodeAt(index)) >>> 0;
    }
    Math.random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }, seedLabel);
}

async function openFresh(page, suffix) {
  await page.goto(`${BASE_URL}?black-candle-prompt=${suffix}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
}

async function savedState(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}"), SAVE_KEY);
}

async function loadBlackCandleFormationBoundary(page) {
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.counts = [0, 0, 0, 0, 0, 8];
    state.moves = 4;
    state.hasMadeValidMove = true;
    state.tutorialSkipped = false;
    state.tutorialActive = false;
    state.blackCandleLessonComplete = false;
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 12000 });
}

async function hintedPair(page) {
  return page.locator(".tile.idle-hint").evaluateAll((tiles) => tiles.map((tile) => ({
    x: Number(tile.dataset.x),
    y: Number(tile.dataset.y),
    id: tile.id
  })));
}

async function commitPair(page, pair, input) {
  const before = await savedState(page);
  const source = page.locator(`#tile-${pair[0].x}-${pair[0].y}`);
  const destination = page.locator(`#tile-${pair[1].x}-${pair[1].y}`);
  if (input === "keyboard") {
    await source.focus();
    await page.keyboard.press("Enter");
    await destination.focus();
    await page.keyboard.press("Space");
  } else {
    await source.click();
    await destination.click();
  }
  await page.waitForFunction(({ key, moves }) => {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    return saved.moves === moves - 1
      && document.querySelectorAll("#board .tile").length === 64
      && Array.from(document.querySelectorAll("#board .tile")).every((tile) => !tile.disabled);
  }, { key: SAVE_KEY, moves: before.moves }, { timeout: 12000 });
  return before;
}

async function commitPairWithPaintSampling(page, pair, input) {
  const before = await savedState(page);
  const source = page.locator(`#tile-${pair[0].x}-${pair[0].y}`);
  const destination = page.locator(`#tile-${pair[1].x}-${pair[1].y}`);
  const boardBox = await page.locator("#board").boundingBox();
  expect(boardBox).not.toBeNull();
  if (input === "keyboard") {
    await source.focus();
    await page.keyboard.press("Enter");
    await destination.focus();
    await page.keyboard.press("Space");
  } else {
    await source.click();
    await destination.click();
  }

  const frames = [];
  const deadline = Date.now() + 1700;
  while (Date.now() < deadline) {
    const png = await page.screenshot({
      type: "png",
      clip: boardBox,
      animations: "allow"
    });
    const state = await page.evaluate(() => ({
      resolving: document.body.classList.contains("board-resolving"),
      relics: document.querySelectorAll('.tile[data-line-relic="black-candle-vine"]').length,
      tiles: document.querySelectorAll("#board .tile").length
    }));
    frames.push({ ratios: paintedRowRatios(png), ...state });
    if (!state.resolving && state.relics === 1 && frames.length >= 8) break;
    await page.waitForTimeout(16);
  }
  await page.waitForFunction(({ key, moves }) => {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    return saved.moves === moves - 1
      && document.querySelectorAll("#board .tile").length === 64
      && Array.from(document.querySelectorAll("#board .tile")).every((tile) => !tile.disabled);
  }, { key: SAVE_KEY, moves: before.moves }, { timeout: 12000 });
  return frames;
}

async function lessonReport(page) {
  return page.evaluate(() => {
    const panel = document.querySelector("#tutorialPanel");
    const copy = document.querySelector("#tutorialCopy");
    const skip = document.querySelector("#tutorialSkipBtn");
    const board = document.querySelector("#board");
    const panelRect = panel.getBoundingClientRect();
    const copyRect = copy.getBoundingClientRect();
    const skipRect = skip.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const visible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden"
        && rect.width > 0 && rect.height > 0;
    };
    return {
      prompt: copy.textContent.trim(),
      cue: document.querySelector("#firstSwapCue").textContent.trim(),
      panelVisible: visible(panel),
      copySkipOverlap: !(
        copyRect.right <= skipRect.left
        || skipRect.right <= copyRect.left
        || copyRect.bottom <= skipRect.top
        || skipRect.bottom <= copyRect.top
      ),
      panelBottom: Math.round(panelRect.bottom),
      boardTop: Math.round(boardRect.top),
      boardWidth: Math.round(boardRect.width),
      boardHeight: Math.round(boardRect.height),
      tiles: document.querySelectorAll("#board .tile").length,
      rows: new Set(Array.from(document.querySelectorAll("#board .tile"), (tile) => tile.dataset.y)).size,
      hints: Array.from(document.querySelectorAll(".tile.idle-hint"), (tile) => tile.id),
      roving: Array.from(document.querySelectorAll("#board .tile[tabindex='0']"), (tile) => tile.id),
      focused: document.activeElement?.id || "",
      selected: document.querySelectorAll("#board .tile.sel").length,
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
      liveOwners: Array.from(document.querySelectorAll('[aria-live="polite"]'))
        .filter(visible)
        .map((node) => ({ id: node.id, text: node.innerText.trim() }))
    };
  });
}

for (const config of [
  { label: "desktop-full-pointer", viewport: { width: 1280, height: 720 }, reduced: false, input: "pointer" },
  { label: "desktop-reduced-keyboard", viewport: { width: 1280, height: 720 }, reduced: true, input: "keyboard" },
  { label: "mobile390-full-pointer", viewport: { width: 390, height: 844 }, reduced: false, input: "pointer" },
  { label: "mobile390-reduced-keyboard", viewport: { width: 390, height: 844 }, reduced: true, input: "keyboard" }
]) {
  test(`Black Candle formation names its flower and result on ${config.label}`, async ({ page }) => {
    const warnings = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) warnings.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      if (request.failure()?.errorText !== "net::ERR_ABORTED") {
        failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`);
      }
    });

    await page.setViewportSize(config.viewport);
    await page.emulateMedia({ reducedMotion: config.reduced ? "reduce" : "no-preference" });
    await seedDeterministicMath(
      page,
      config.viewport.width === 390 ? "fresh-black-candle-mobile390" : "fresh-black-candle-desktop"
    );
    await openFresh(page, config.label);
    await loadBlackCandleFormationBoundary(page);

    await expect(page.locator("#tutorialCopy")).toHaveText("");
    await expect(page.locator("#firstSwapCue")).toHaveText(CUE);
    await expect(page.locator("body")).toHaveAttribute("data-target-match-forecast", "Bone Star");
    await expect(page.locator("body")).toHaveAttribute("data-target-match-outcome", "arm-black-candle");
    await expect(page.locator('.target-match-forecast-guide[data-outcome="arm-black-candle"]')).toHaveCount(1);
    await expect(page.locator(".target-match-result")).toHaveCount(4);
    await expect(page.locator(".target-match-causal-verb")).toHaveText("SWAPARM");

    const expectedPair = await hintedPair(page);
    expect(expectedPair).toHaveLength(2);
    const beforeFormation = await savedState(page);
    expect(beforeFormation.moves).toBe(4);

    const authoritativeSave = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);

    const report = await lessonReport(page);
    expect(report.prompt).toBe("");
    expect(report.cue).toBe(CUE);
    expect(report.panelVisible).toBe(false);
    expect(report.copySkipOverlap).toBe(false);
    expect(report.boardWidth).toBe(config.viewport.width === 390 ? 378 : 600);
    expect(report.boardHeight).toBe(report.boardWidth);
    expect(report.tiles).toBe(64);
    expect(report.rows).toBe(8);
    expect(report.hints).toEqual(expectedPair.map((cell) => cell.id));
    expect(report.roving).toEqual([expectedPair[0].id]);
    expect(["", expectedPair[0].id, "tutorialHelpBtn"]).toContain(report.focused);
    expect(report.selected).toBe(0);
    expect(report.scrollY).toBe(0);
    expect(report.overflowX).toBe(false);
    expect(report.brokenImages).toEqual([]);
    expect(report.liveOwners).toEqual([{ id: "firstSwapCue", text: CUE }]);
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(authoritativeSave);
    await page.screenshot({ path: `work/black-candle-formation-${config.label}.png`, fullPage: true });

    await page.locator("#tutorialHelpBtn").click();
    await expect(page.locator("#tutorialCopy")).toHaveText(PROMPT);
    await expect(page.locator("#firstSwapCue")).toHaveText(CUE);
    await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 3000 });
    expect(await hintedPair(page)).toEqual(expectedPair);
    await page.locator("#tutorialSkipBtn").click();
    await expect(page.locator("#tutorialHelpBtn")).toBeVisible();

    const paintFrames = config.viewport.width === 390
      ? await commitPairWithPaintSampling(page, expectedPair, config.input)
      : (await commitPair(page, expectedPair, config.input), []);
    if (config.viewport.width === 390) {
      expect(paintFrames.length, `${config.label} captures several animation frames`).toBeGreaterThanOrEqual(8);
      expect(
        paintFrames.every((frame) => frame.tiles === 64),
        `${config.label} retains all controls in every sampled frame`
      ).toBe(true);
      const blankFrames = paintFrames.flatMap((frame, frameIndex) => frame.ratios
        .map((ratio, row) => ({ frame: frameIndex, row, ratio }))
        .filter(({ ratio }) => ratio < 0.08));
      expect(blankFrames, `${config.label} keeps visible socket pixels in every row band`).toEqual([]);
    }
    await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(1);
    const formed = await savedState(page);
    expect(formed.moves).toBe(3);
    expect(formed.counts[1] - beforeFormation.counts[1]).toBe(4);
    await expect(page.locator("#tutorialCopy")).toHaveText("");
    await expect(page.locator("#firstSwapCue")).toHaveText("Swap Black Candle Vine right - burn this row.");
    await expect(page.locator(".line-relic-lane-preview")).toHaveCount(8);
    await expect(page.locator("#board .tile")).toHaveCount(64);
    await page.screenshot({ path: `work/black-candle-row-paint-${config.label}.png` });
    expect(warnings).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
}
