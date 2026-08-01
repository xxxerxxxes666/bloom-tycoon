const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

test.describe.configure({ mode: "serial" });
test.setTimeout(45000);

async function openFresh(page, label) {
  await page.goto(`${BASE_URL}?tile-readability=${label}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
}

async function paintedGeometry(page) {
  return page.evaluate(async () => {
    const sourceBounds = async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width;
      let top = canvas.height;
      let right = -1;
      let bottom = -1;
      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          if (pixels[((y * canvas.width) + x) * 4 + 3] < 16) continue;
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
      return {
        naturalWidth: canvas.width,
        naturalHeight: canvas.height,
        left,
        top,
        width: right - left + 1,
        height: bottom - top + 1
      };
    };

    const species = {};
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    for (const tile of tiles) {
      const flowerId = tile.dataset.flowerId;
      if (species[flowerId] || tile.classList.contains("cursed-thorn")) continue;
      const wrap = tile.querySelector(".tile-icon-wrap");
      const image = wrap?.querySelector("img");
      if (!image) continue;
      const tileRect = tile.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const bounds = await sourceBounds(image.currentSrc || image.src);
      const objectSize = Math.min(imageRect.width, imageRect.height);
      const objectLeft = imageRect.left + ((imageRect.width - objectSize) / 2);
      const objectTop = imageRect.top + ((imageRect.height - objectSize) / 2);
      const paintedRect = {
        left: objectLeft + (objectSize * bounds.left / bounds.naturalWidth),
        top: objectTop + (objectSize * bounds.top / bounds.naturalHeight),
        width: objectSize * bounds.width / bounds.naturalWidth,
        height: objectSize * bounds.height / bounds.naturalHeight
      };
      paintedRect.right = paintedRect.left + paintedRect.width;
      paintedRect.bottom = paintedRect.top + paintedRect.height;
      species[flowerId] = {
        name: image.alt,
        tileWidth: tileRect.width,
        wrapWidth: wrapRect.width,
        wrapHeight: wrapRect.height,
        imageWidth: imageRect.width,
        imageHeight: imageRect.height,
        paintedWidthRatio: paintedRect.width / tileRect.width,
        paintedHeightRatio: paintedRect.height / tileRect.height,
        paintedAuthority: Math.max(paintedRect.width, paintedRect.height) / Math.max(tileRect.width, tileRect.height),
        clipped: paintedRect.left < tileRect.left
          || paintedRect.top < tileRect.top
          || paintedRect.right > tileRect.right
          || paintedRect.bottom > tileRect.bottom
      };
    }
    const firstTile = tiles[0];
    const tileStyle = getComputedStyle(firstTile);
    const socketStyle = getComputedStyle(firstTile, "::before");
    const boardRect = document.querySelector("#board").getBoundingClientRect();
    return {
      board: { width: boardRect.width, height: boardRect.height },
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      enabledTiles: tiles.filter((tile) => !tile.disabled).length,
      tile: {
        width: firstTile.getBoundingClientRect().width,
        paddingInline: Number.parseFloat(tileStyle.paddingInlineStart),
        paddingBlock: Number.parseFloat(tileStyle.paddingBlockStart),
        socketOpacity: Number.parseFloat(socketStyle.opacity)
      },
      species,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  });
}

async function openingSwap(page, touch) {
  const hints = page.locator("#board .tile.idle-hint");
  await expect(hints).toHaveCount(2, { timeout: 9000 });
  const pair = await hints.evaluateAll((tiles) => tiles.map((tile) => ({
    x: tile.dataset.x,
    y: tile.dataset.y
  })));
  const first = page.locator(`#board .tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`);
  const second = page.locator(`#board .tile[data-x="${pair[1].x}"][data-y="${pair[1].y}"]`);
  if (touch) {
    await first.tap();
    await second.tap();
  } else {
    await first.click();
    await second.click();
  }
  await expect.poll(() => page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      moves: state.moves,
      thornRose: state.counts?.[5],
      enabledTiles: document.querySelectorAll("#board .tile:not(:disabled)").length
    };
  }, SAVE_KEY), { timeout: 10000 }).toEqual({ moves: 5, thornRose: 3, enabledTiles: 64 });
}

for (const config of [
  { label: "desktop1280", viewport: { width: 1280, height: 720 }, board: 600, tile: 69, touch: false },
  { label: "mobile390", viewport: { width: 390, height: 844 }, board: 378, tile: 44.1875, touch: true }
]) {
  test(`ordinary painted silhouettes own their sockets ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      isMobile: config.touch,
      hasTouch: config.touch,
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    const runtimeErrors = [];
    const requestFailures = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") runtimeErrors.push(message.text());
    });
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("requestfailed", (request) => requestFailures.push(
      `${request.url()} :: ${request.failure()?.errorText || "failed"}`
    ));

    await openFresh(page, config.label);
    for (const state of ["fresh", "post-opening"]) {
      if (state === "post-opening") await openingSwap(page, config.touch);
      const report = await paintedGeometry(page);
      expect(report.board.width).toBeCloseTo(config.board, 0);
      expect(report.board.height).toBeCloseTo(config.board, 0);
      expect(report.tiles).toBe(64);
      expect(report.rows).toBe(8);
      expect(report.enabledTiles).toBe(64);
      expect(report.tile.width).toBeCloseTo(config.tile, 2);
      expect(report.tile.paddingInline).toBe(0);
      expect(report.tile.paddingBlock).toBe(0);
      expect(report.tile.socketOpacity, `${config.label} ${state} idle socket ornament stays subordinate`)
        .toBeLessThanOrEqual(0.32);
      expect(Object.keys(report.species).length, `${config.label} ${state} ordinary species coverage`)
        .toBeGreaterThanOrEqual(state === "fresh" ? 6 : 5);
      for (const species of Object.values(report.species)) {
        expect(species.wrapWidth, `${config.label} ${state} ${species.name} wrapper width`)
          .toBeGreaterThanOrEqual(config.tile - 2.1);
        expect(species.wrapHeight, `${config.label} ${state} ${species.name} wrapper height`)
          .toBeGreaterThanOrEqual(config.tile - 2.1);
        expect(species.imageWidth, `${config.label} ${state} ${species.name} image width`)
          .toBeCloseTo(species.wrapWidth * 0.98, 1);
        expect(species.imageHeight, `${config.label} ${state} ${species.name} image height`)
          .toBeCloseTo(species.wrapHeight * 0.98, 1);
        expect(species.paintedAuthority, `${config.label} ${state} ${species.name} painted authority`)
          .toBeGreaterThanOrEqual(0.84);
        expect(species.paintedAuthority, `${config.label} ${state} ${species.name} restrained painted authority`)
          .toBeLessThanOrEqual(0.91);
        expect(species.clipped, `${config.label} ${state} ${species.name} painted bounds stay unclipped`)
          .toBe(false);
      }
      expect(report.overflowX).toBe(false);
      expect(report.brokenImages).toEqual([]);
    }
    expect(runtimeErrors).toEqual([]);
    expect(requestFailures).toEqual([]);
    await context.close();
  });
}
