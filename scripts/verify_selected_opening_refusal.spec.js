const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const PROFILES = [
  { label: "desktop-source-full", viewport: { width: 1280, height: 720 }, selectedSide: "source" },
  { label: "desktop-destination-reduced", viewport: { width: 1280, height: 720 }, selectedSide: "destination", reduced: true },
  { label: "mobile390-source-full", viewport: { width: 390, height: 844 }, mobile: true, selectedSide: "source" },
  { label: "mobile390-destination-reduced", viewport: { width: 390, height: 844 }, mobile: true, selectedSide: "destination", reduced: true }
];

test.setTimeout(30000);

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = [...document.querySelectorAll("#board .tile")];
    const boardRect = document.querySelector("#board").getBoundingClientRect();
    const guide = document.querySelector(".first-action-swap-guide");
    return {
      save: localStorage.getItem(key),
      moves: state.moves,
      counts: state.counts || [],
      boardState: (state.board || []).map((row) => row.join(",")).join("|"),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      invalid: tiles.filter((tile) => tile.classList.contains("invalid-swap")).map((tile) => tile.id).sort(),
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id).sort(),
      guideVisible: visible(guide),
      guideMode: guide?.dataset.mode || "",
      guideSource: guide ? `tile-${guide.dataset.sourceX}-${guide.dataset.sourceY}` : "",
      guideDestination: guide ? `tile-${guide.dataset.destinationX}-${guide.dataset.destinationY}` : "",
      tutorialIcon: document.querySelector("#tutorialPanel .tutorial-icon")?.textContent.trim() || "",
      tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      visibleButtons: [...document.querySelectorAll("button")]
        .filter((button) => visible(button) && !button.closest("#board"))
        .map((button) => button.textContent.trim()),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      enabled: tiles.filter((tile) => !tile.disabled).length,
      board: { width: boardRect.width, height: boardRect.height, bottom: boardRect.bottom },
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      scrollY,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function activate(page, cellId, mobile) {
  const tile = page.locator(`#${cellId}`);
  if (mobile) {
    await tile.tap();
  } else {
    await tile.click();
  }
}

for (const profile of PROFILES) {
  test(`${profile.label}: a wrong neighbor recoils with the selected opening flower`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile)
    });
    const page = await context.newPage();
    const problems = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("requestfailed", (request) => {
      if (request.failure()?.errorText !== "net::ERR_ABORTED") {
        problems.push(`${request.url()} ${request.failure()?.errorText || ""}`);
      }
    });
    if (profile.reduced) await page.emulateMedia({ reducedMotion: "reduce" });

    try {
      await page.addInitScript((key) => {
        localStorage.removeItem(key);
        sessionStorage.clear();
      }, SAVE_KEY);
      await page.goto(`${BASE_URL}?selected-opening-refusal=${profile.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      const opening = await report(page);
      const sourceId = opening.guideSource;
      const destinationId = opening.guideDestination;
      const selectedId = profile.selectedSide === "destination" ? destinationId : sourceId;
      const counterpartId = selectedId === sourceId ? destinationId : sourceId;
      expect(sourceId).toMatch(/^tile-/);
      expect(destinationId).toMatch(/^tile-/);
      const wrongId = await page.evaluate(({ selectedId, counterpartId }) => {
        const [, sourceX, sourceY] = selectedId.match(/^tile-(\d+)-(\d+)$/).map(Number);
        return [[1, 0], [-1, 0], [0, 1], [0, -1]]
          .map(([dx, dy]) => ({ x: sourceX + dx, y: sourceY + dy }))
          .filter(({ x, y }) => x >= 0 && x < 8 && y >= 0 && y < 8)
          .map(({ x, y }) => `tile-${x}-${y}`)
          .find((id) => id !== counterpartId);
      }, { selectedId, counterpartId });
      expect(wrongId, "opening source has an off-guide adjacent neighbor").toBeTruthy();

      await activate(page, selectedId, profile.mobile);
      const selected = await report(page);
      expect(selected.selected).toEqual([selectedId]);
      expect(selected.guideMode).toBe("destination");
      expect(selected.tutorialCopy).toBe("Choose the other glowing flower.");
      const beforeSave = selected.save;

      await activate(page, wrongId, profile.mobile);
      await expect(page.locator(".tile.invalid-swap")).toHaveCount(2);
      const refused = await report(page);
      expect(refused.save).toBe(beforeSave);
      expect(refused.moves).toBe(selected.moves);
      expect(refused.counts).toEqual(selected.counts);
      expect(refused.boardState).toBe(selected.boardState);
      expect(refused.invalid).toEqual([selectedId, wrongId].sort());
      expect(refused.selected).toEqual([]);
      expect(refused.guideVisible).toBe(false);
      expect(refused.tutorialIcon).toBe("NO BLOOM");
      expect(refused.tutorialCopy).toBe("Use the glowing pair.");
      await page.screenshot({ path: `work/selected-opening-refusal-${profile.label}-peak.png`, fullPage: true });

      await expect(page.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 3500 });
      const restored = await report(page);
      expect(restored.save).toBe(beforeSave);
      expect(restored.moves).toBe(selected.moves);
      expect(restored.counts).toEqual(selected.counts);
      expect(restored.boardState).toBe(selected.boardState);
      expect(restored.selected).toEqual([selectedId]);
      expect(restored.hints).toEqual([sourceId, destinationId].sort());
      expect(restored.guideVisible).toBe(true);
      expect(restored.guideMode).toBe("destination");
      expect(restored.tutorialCopy).toBe("Choose the other glowing flower.");
      expect(restored.active).toBe(counterpartId);
      expect(restored.roving).toEqual([counterpartId]);
      expect(restored.visibleButtons).toHaveLength(1);
      expect(restored.visibleButtons[0].toUpperCase()).toContain("SKIP");
      await page.screenshot({ path: `work/selected-opening-refusal-${profile.label}-restored.png`, fullPage: true });

      await activate(page, counterpartId, profile.mobile);
      await expect.poll(async () => (await report(page)).moves, { timeout: 12000 }).toBe(selected.moves - 1);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
      const settled = await report(page);
      expect(settled.counts.reduce((sum, count) => sum + count, 0)).toBeGreaterThan(selected.counts.reduce((sum, count) => sum + count, 0));
      expect(settled.tiles).toBe(64);
      expect(settled.rows).toBe(8);
      expect(settled.enabled).toBe(64);
      expect(settled.board.width).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      expect(settled.board.height).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      expect(settled.overflowX).toBe(false);
      expect(settled.brokenImages).toEqual([]);
      if (profile.mobile) {
        expect(settled.board.bottom).toBeLessThanOrEqual(844);
        expect(settled.scrollY).toBe(0);
      }
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
