const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const PROFILES = [
  {
    label: "desktop-pointer-source",
    viewport: { width: 1280, height: 720 },
    input: "pointer",
    endpoint: "source"
  },
  {
    label: "desktop-keyboard-destination-reduced",
    viewport: { width: 1280, height: 720 },
    input: "keyboard",
    endpoint: "destination",
    reducedMotion: "reduce"
  },
  {
    label: "mobile390-touch-source",
    viewport: { width: 390, height: 844 },
    input: "touch",
    endpoint: "source",
    mobile: true
  },
  {
    label: "mobile390-keyboard-destination-reduced",
    viewport: { width: 390, height: 844 },
    input: "keyboard",
    endpoint: "destination",
    mobile: true,
    reducedMotion: "reduce"
  }
];

function directionWord(from, to) {
  if (to.x < from.x) return "left";
  if (to.x > from.x) return "right";
  return to.y < from.y ? "above" : "below";
}

async function activate(page, locator, profile) {
  if (profile.input === "keyboard") {
    await locator.focus();
    await page.keyboard.press("Enter");
  } else if (profile.input === "touch") {
    await locator.tap();
  } else {
    await locator.click();
  }
}

async function report(page) {
  return page.evaluate((key) => {
    const panel = document.querySelector("#tutorialPanel");
    const copy = document.querySelector("#tutorialCopy");
    const board = document.querySelector("#board");
    const panelRect = panel.getBoundingClientRect();
    const copyRect = copy.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const tiles = [...document.querySelectorAll(".tile")];
    return {
      copy: copy.textContent.trim(),
      copyFits: copy.scrollWidth <= copy.clientWidth + 0.5
        && copy.scrollHeight <= copy.clientHeight + 0.5,
      copyInsidePanel: copyRect.left >= panelRect.left - 0.5
        && copyRect.right <= panelRect.right + 0.5
        && copyRect.top >= panelRect.top - 0.5
        && copyRect.bottom <= panelRect.bottom + 0.5,
      panelBoardOverlap: panelRect.bottom > boardRect.top,
      boardTop: boardRect.top,
      boardWidth: boardRect.width,
      boardHeight: boardRect.height,
      boardBottom: boardRect.bottom,
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id).sort(),
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      moves: JSON.parse(localStorage.getItem(key) || "{}").moves,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      scrollY,
      brokenImages: [...document.images]
        .filter((image) => image.offsetParent && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.currentSrc || image.src)
    };
  }, SAVE_KEY);
}

for (const profile of PROFILES) {
  test(`the taught opening names the second tap on ${profile.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile && profile.input === "touch"),
      isMobile: Boolean(profile.mobile),
      reducedMotion: profile.reducedMotion || "no-preference"
    });
    await context.addInitScript((key) => localStorage.removeItem(key), SAVE_KEY);
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText || "";
      if (failure !== "net::ERR_ABORTED") errors.push(`${request.url()} ${failure}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });

    try {
      await page.goto(`${BASE_URL}?opening-destination-copy=${profile.label}`, { waitUntil: "networkidle" });
      await expect(page.locator(".tile:not([disabled])")).toHaveCount(64);
      await expect(page.locator("#tutorialCopy")).toHaveText("Swap the glowing flowers.");

      const source = page.getByRole("button", { name: /guided exchange source/ });
      const destination = page.getByRole("button", { name: /guided exchange destination/ });
      const endpoint = profile.endpoint === "source" ? source : destination;
      const counterpart = profile.endpoint === "source" ? destination : source;
      const [endpointData, counterpartData] = await Promise.all([
        endpoint.evaluate((tile) => ({
          id: tile.id,
          x: Number(tile.dataset.x),
          y: Number(tile.dataset.y)
        })),
        counterpart.evaluate((tile) => ({
          id: tile.id,
          x: Number(tile.dataset.x),
          y: Number(tile.dataset.y),
          flower: tile.getAttribute("aria-label").split(" tile,")[0]
        }))
      ]);
      const before = await report(page);

      await activate(page, page.locator(`#${endpointData.id}`), profile);
      const selected = await report(page);
      expect(selected.copy).toBe(
        `Tap ${counterpartData.flower} ${directionWord(endpointData, counterpartData)}.`
      );
      expect(selected.selected).toEqual([endpointData.id]);
      expect(selected.hints).toEqual([endpointData.id, counterpartData.id].sort());
      expect(selected.copyFits).toBe(true);
      expect(selected.copyInsidePanel).toBe(true);
      expect(selected.panelBoardOverlap).toBe(false);
      expect(selected.boardTop).toBeCloseTo(before.boardTop, 1);
      expect(selected.moves).toBe(6);

      await page.screenshot({
        path: `work/opening-destination-copy-${profile.label}.png`,
        fullPage: true
      });

      await activate(page, page.locator(`#${counterpartData.id}`), profile);
      await expect.poll(async () => JSON.parse(
        await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY) || "{}"
      ).moves).toBe(5);
      const settled = await report(page);
      expect(settled.selected).toEqual([]);
      expect(settled.tiles).toBe(64);
      expect(settled.rows).toBe(8);
      expect(settled.boardWidth).toBeCloseTo(profile.mobile ? 378 : 600, 1);
      expect(settled.boardHeight).toBeCloseTo(profile.mobile ? 378 : 600, 1);
      expect(settled.boardBottom).toBeLessThanOrEqual(profile.viewport.height);
      expect(settled.overflowX).toBe(false);
      expect(settled.scrollY).toBe(0);
      expect(settled.brokenImages).toEqual([]);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
