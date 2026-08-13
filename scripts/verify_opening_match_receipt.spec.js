const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const CASES = [
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
  { label: "mobile-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "mobile-touch-reduced", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
];

const RECEIPT_TAB_CASES = [
  { label: "desktop-keyboard", viewport: { width: 1280, height: 720 } },
  { label: "mobile390-keyboard-reduced", viewport: { width: 390, height: 844 }, reduced: true }
];

async function openFresh(page, label) {
  await page.addInitScript(({ key, seedToken, rngLabel }) => {
    if (!sessionStorage.getItem(seedToken)) {
      localStorage.removeItem(key);
      sessionStorage.setItem(seedToken, "1");
    }
    let seed = 0;
    for (let index = 0; index < rngLabel.length; index += 1) {
      seed = (seed * 31 + rngLabel.charCodeAt(index)) >>> 0;
    }
    Math.random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }, {
    key: SAVE_KEY,
    seedToken: `opening-match-receipt-${label}`,
    rngLabel: label.includes("mobile") ? "fresh-black-candle-mobile390" : "fresh-black-candle-desktop"
  });
  await page.goto(`${BASE_URL}?opening-match-receipt=${label}`, { waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
  await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2, { timeout: 3000 });
}

async function report(page) {
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const boardEl = document.querySelector("#board");
    const cueEl = document.querySelector("#firstSwapCue");
    const commandEl = document.querySelector(".tutorial-command-region");
    const helpEl = document.querySelector("#tutorialHelpBtn");
    const board = boardEl?.getBoundingClientRect();
    const cue = cueEl?.getBoundingClientRect();
    const command = commandEl?.getBoundingClientRect();
    const cueBefore = cueEl ? getComputedStyle(cueEl, "::before") : null;
    const exactGuide = document.querySelector("#board .first-action-swap-guide");
    const guidedSource = tiles.find((tile) => (
      tile.getAttribute("aria-label") || ""
    ).includes("guided exchange source"));
    const visible = (node) => Boolean(node)
      && !node.hidden
      && getComputedStyle(node).display !== "none"
      && getComputedStyle(node).visibility !== "hidden"
      && node.getBoundingClientRect().width > 0
      && node.getBoundingClientRect().height > 0;
    const rectsOverlap = (a, b) => Boolean(a && b)
      && a.left < b.right
      && a.right > b.left
      && a.top < b.bottom
      && a.bottom > b.top;
    const mobileGreenhouseEl = [
      document.querySelector("#mobileGreenhousePlinth"),
      document.querySelector(".mobile-greenhouse-progress")
    ].find(visible);
    const mobileGreenhouse = mobileGreenhouseEl?.getBoundingClientRect();
    const cueHit = cue
      ? document.elementFromPoint(cue.left + cue.width / 2, cue.top + cue.height / 2)
      : null;
    const cueLabel = (cueBefore?.content || "")
      .replace(/^(["'])(.*)\1$/, "$2")
      .trim();
    return {
      state,
      cue: cueEl?.textContent.trim() || "",
      cueVisible: visible(cueEl),
      cueLabel,
      cueLabelDisplay: cueBefore?.display || "",
      cueLabelVisibility: cueBefore?.visibility || "",
      cueLabelOpacity: cueBefore?.opacity || "",
      cueLabelWidth: Number.parseFloat(cueBefore?.width || "0") || 0,
      cueLabelHeight: Number.parseFloat(cueBefore?.height || "0") || 0,
      cuePointerEvents: cueEl ? getComputedStyle(cueEl).pointerEvents : "",
      cueHitInteractiveId: cueHit?.closest("button, a, input, select, textarea")?.id || "",
      cueFits: Boolean(cueEl)
        && cueEl.scrollWidth <= cueEl.clientWidth + 1
        && cueEl.scrollHeight <= cueEl.clientHeight + 1,
      cueWithinViewport: Boolean(cue)
        && cue.left >= 0
        && cue.top >= 0
        && cue.right <= innerWidth
        && cue.bottom <= innerHeight,
      cueWithinCommand: Boolean(cue && command)
        && cue.left >= command.left - 1
        && cue.right <= command.right + 1
        && cue.top >= command.top - 1
        && cue.bottom <= command.bottom + 1,
      cueBoardOverlap: rectsOverlap(cue, board),
      cueGreenhouseOverlap: rectsOverlap(cue, mobileGreenhouse),
      helpInDom: Boolean(helpEl),
      helpVisible: visible(helpEl),
      helpCueOverlap: visible(helpEl) && rectsOverlap(helpEl.getBoundingClientRect(), cue),
      tutorial: document.querySelector("#tutorialPanel")?.textContent.replace(/\s+/g, " ").trim() || "",
      tutorialVisible: visible(document.querySelector("#tutorialPanel")),
      hintCount: document.querySelectorAll("#board .tile.idle-hint").length,
      directionalGuideCount: document.querySelectorAll("#board .first-action-swap-guide, #board .swap-path-arrow").length,
      forecastGuideCount: document.querySelectorAll("#board .target-match-forecast-guide").length,
      guideOverlayCount: document.querySelectorAll(
        "#board .first-action-swap-guide, #board .target-match-forecast-guide, #board .swap-path-arrow"
      ).length,
      guideSourceId: exactGuide
        ? `tile-${exactGuide.dataset.sourceX}-${exactGuide.dataset.sourceY}`
        : guidedSource?.id || "",
      guidedTileLabels: tiles
        .map((tile) => tile.getAttribute("aria-label") || "")
        .filter((label) => label.includes("guided exchange")),
      targetLiteracy: document.body.dataset.targetLiteracy || "",
      targetLiteracyTiles: document.querySelectorAll("#board .tile.target-literacy[data-flower-id='5']").length,
      visibleButtons: Array.from(document.querySelectorAll("button:not(.tile)"))
        .filter(visible)
        .map((button) => button.textContent.replace(/\s+/g, " ").trim()),
      bodyClasses: document.body.className,
      boardBusy: document.querySelector("#board")?.getAttribute("aria-busy") || "",
      cueLive: document.querySelector("#firstSwapCue")?.getAttribute("aria-live") || "",
      activeId: document.activeElement?.id || "",
      rovingIds: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      selectedIds: tiles.filter((tile) => tile.classList.contains("sel") || tile.classList.contains("selected"))
        .map((tile) => tile.id),
      liveOwners: Array.from(document.querySelectorAll("[aria-live]"))
        .filter(visible)
        .filter((node) => ["polite", "assertive"].includes(node.getAttribute("aria-live")))
        .map((node) => ({ id: node.id, live: node.getAttribute("aria-live") })),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      boardWidth: board?.width || 0,
      boardTop: board?.top || 0,
      boardBottom: board?.bottom || 0,
      cueTop: cue?.top || 0,
      cueBottom: cue?.bottom || 0,
      titleBottom: document.querySelector(".title")?.getBoundingClientRect().bottom || 0,
      bouquetProgress: document.querySelector("#bouquetProgressLabel")?.textContent.replace(/\s+/g, " ").trim() || "",
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function activateOpeningPair(page, input) {
  const source = page.locator("#tile-1-0");
  const destination = page.locator("#tile-1-1");
  if (input === "touch") {
    await source.tap();
    await destination.tap();
  } else if (input === "pointer") {
    await source.click();
    await destination.click();
  } else {
    await expect(source).toBeFocused();
    await source.press("Enter");
    await expect(destination).toBeFocused();
    await destination.press("Space");
  }
}

async function activateHintedPair(page, input) {
  const pair = page.locator("#board .tile.idle-hint");
  await expect(pair).toHaveCount(2, { timeout: 9000 });
  const [sourceId, destinationId] = await pair.evaluateAll((tiles) => tiles.map((tile) => tile.id));
  if (input === "touch") {
    await pair.nth(0).tap();
    await pair.nth(1).tap();
  } else if (input === "pointer") {
    await pair.nth(0).click();
    await pair.nth(1).click();
  } else {
    const sourceId = await pair.nth(0).getAttribute("id");
    await page.keyboard.press("Tab");
    await expect(page.locator(`#${sourceId}`)).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
  }
  return { sourceId, destinationId };
}

for (const testCase of CASES) {
  test(`opening match confirms its earned bouquet progress on ${testCase.label}`, async ({ browser }) => {
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
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText || "";
      if (failure !== "net::ERR_ABORTED") browserErrors.push(`${request.url()} ${failure}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400 && new URL(response.url()).origin === new URL(BASE_URL).origin) {
        browserErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    try {
      await openFresh(page, testCase.label);
      const initial = await report(page);
      expect(initial.state.moves, `${testCase.label} starts with six moves`).toBe(6);
      expect(initial.state.counts, `${testCase.label} starts with an empty bouquet`).toEqual([0, 0, 0, 0, 0, 0]);
      expect(initial.liveOwners, `${testCase.label} tutorial owns opening narration`)
        .toEqual([{ id: "tutorialPanel", live: "polite" }]);

      await page.evaluate(() => {
        window.__openingReceiptChronology = [];
        const cue = document.querySelector("#firstSwapCue");
        const observer = new MutationObserver(() => {
          const text = cue?.textContent.trim() || "";
          if (!text.includes("Next: find")) return;
          const visible = (node) => Boolean(node)
            && !node.hidden
            && getComputedStyle(node).display !== "none"
            && node.getBoundingClientRect().width > 0
            && node.getBoundingClientRect().height > 0;
          window.__openingReceiptChronology.push({
            text,
            busy: document.querySelector("#board")?.getAttribute("aria-busy"),
            owners: Array.from(document.querySelectorAll("[aria-live]"))
              .filter(visible)
              .filter((node) => ["polite", "assertive"].includes(node.getAttribute("aria-live")))
              .map((node) => node.id)
          });
        });
        observer.observe(cue, { childList: true, characterData: true, subtree: true });
        window.__openingReceiptObserver = observer;
      });

      await activateOpeningPair(page, testCase.input);
      await expect.poll(async () => (await report(page)).bodyClasses.includes("opening-harvest-commit-cue"), {
        message: `${testCase.label} acknowledges the accepted opening swap before settlement`,
        timeout: 1200
      }).toBe(true);
      const committed = await report(page);
      expect(committed.cue, `${testCase.label} names the immediate match consequence`).toBe(
        "Thorn Rose matched - 3 flowers rising."
      );
      expect(committed.cueLabel, `${testCase.label} renders the distinct commit label`).toBe("MATCH LOCKED");
      expect(committed.cueLabelDisplay, `${testCase.label} paints the commit label`).not.toBe("none");
      expect(committed.cueLabelVisibility, `${testCase.label} keeps the commit label visible`).toBe("visible");
      expect(Number(committed.cueLabelOpacity), `${testCase.label} keeps the commit label opaque`).toBeGreaterThan(0);
      expect(committed.cueLabelWidth, `${testCase.label} gives the rendered label measurable width`).toBeGreaterThan(0);
      expect(committed.cueLabelHeight, `${testCase.label} gives the rendered label measurable height`).toBeGreaterThan(0);
      expect(committed.boardBusy, `${testCase.label} keeps the altar locked during its accepted response`).toBe("true");
      expect(committed.cueLive, `${testCase.label} leaves detailed narration to the settled receipt`).toBe("off");
      expect(committed.cuePointerEvents, `${testCase.label} keeps the transient pointer-inert`).toBe("none");
      expect(committed.cueHitInteractiveId, `${testCase.label} does not put a command under the receipt hit point`).toBe("");
      expect(committed.cueFits, `${testCase.label} keeps the complete label and consequence unclipped`).toBe(true);
      expect(committed.cueWithinViewport, `${testCase.label} keeps the receipt in the viewport`).toBe(true);
      expect(committed.cueWithinCommand, `${testCase.label} contains the receipt in the existing command lane`).toBe(true);
      expect(committed.cueBoardOverlap, `${testCase.label} keeps the receipt clear of the altar`).toBe(false);
      if (testCase.mobile) {
        expect(committed.cueGreenhouseOverlap, `${testCase.label} keeps the receipt clear of the greenhouse`).toBe(false);
      }
      expect(committed.helpInDom, `${testCase.label} preserves semantic Help architecture`).toBe(true);
      expect(committed.helpVisible, `${testCase.label} prevents Help competing with the accepted response`).toBe(false);
      expect(committed.helpCueOverlap, `${testCase.label} has no hidden Help collision`).toBe(false);
      expect(committed.visibleButtons, `${testCase.label} presents one response rather than two actions`).toEqual([]);
      expect(committed.hintCount, `${testCase.label} retires the spent guide immediately`).toBe(0);
      expect(committed.guideOverlayCount, `${testCase.label} retires every spent guide overlay`).toBe(0);
      expect(committed.tiles, `${testCase.label} commit retains 64 tiles`).toBe(64);
      expect(committed.rows, `${testCase.label} commit retains eight rows`).toBe(8);
      expect(committed.boardWidth, `${testCase.label} commit keeps the exact altar width`)
        .toBe(testCase.mobile ? 378 : 600);
      expect(committed.boardBottom, `${testCase.label} commit keeps the altar in the first viewport`)
        .toBeLessThanOrEqual(testCase.viewport.height);
      expect(committed.overflowX, `${testCase.label} commit has no horizontal overflow`).toBe(false);
      expect(committed.overflowY, `${testCase.label} commit has no vertical overflow`).toBe(false);
      expect(committed.brokenImages, `${testCase.label} commit has no broken visible images`).toEqual([]);
      await page.screenshot({ path: `work/opening-match-commit-${testCase.label}.png` });

      await expect.poll(async () => (await report(page)).bodyClasses.includes("settled-board-outcome-cue"), {
        message: `${testCase.label} exposes the receipt only after settled feedback`,
        timeout: 12000
      }).toBe(true);

      const settled = await report(page);
      expect(settled.cue, `${testCase.label} names the earned flower, count, and move`).toBe(
        "Thorn Rose +3, 3 of 8. Next: find 3 more."
      );
      expect(settled.bodyClasses, `${testCase.label} joins the receipt to its next action`)
        .toContain("opening-harvest-handoff-cue");
      expect(settled.cueTop, `${testCase.label} command lane clears the title`)
        .toBeGreaterThanOrEqual(settled.titleBottom);
      expect(settled.state.moves, `${testCase.label} spends exactly once`).toBe(5);
      expect(settled.state.counts, `${testCase.label} credits only the authored Thorn Rose match`)
        .toEqual([0, 0, 0, 0, 0, 3]);
      expect(settled.bouquetProgress, `${testCase.label} keeps the exact opening bouquet receipt`).toContain("3/14");
      expect(settled.liveOwners, `${testCase.label} receipt is the sole narrator`)
        .toEqual([{ id: "firstSwapCue", live: "polite" }]);
      expect(settled.helpVisible, `${testCase.label} keeps Help subordinate to the narrated receipt`).toBe(false);
      expect(settled.state.tutorialActive, `${testCase.label} retires stale tutorial authority`).toBe(false);
      expect(settled.tutorialVisible, `${testCase.label} keeps the stale panel absent`).toBe(false);
      expect(settled.tutorial, `${testCase.label} removes stale tutorial copy`).not.toContain("Find 3 Thorn Roses.");
      expect(settled.selectedIds, `${testCase.label} clears selection`).toEqual([]);
      expect(settled.activeId, `${testCase.label} focus agrees with the sole roving tile`)
        .toBe(settled.rovingIds[0]);
      expect(settled.rovingIds, `${testCase.label} keeps one board entry`).toHaveLength(1);

      const chronology = await page.evaluate(() => window.__openingReceiptChronology || []);
      expect(chronology, `${testCase.label} mutates to the result exactly once`).toHaveLength(1);
      expect(chronology[0], `${testCase.label} settles before the result mutation`).toEqual({
        text: "Thorn Rose +3, 3 of 8. Next: find 3 more.",
        busy: "false",
        owners: ["firstSwapCue"]
      });

      expect(settled.tiles, `${testCase.label} retains 64 tiles`).toBe(64);
      expect(settled.rows, `${testCase.label} retains eight rows`).toBe(8);
      expect(settled.boardWidth, `${testCase.label} exact altar width`).toBe(testCase.mobile ? 378 : 600);
      expect(settled.boardBottom, `${testCase.label} altar remains in the viewport`)
        .toBeLessThanOrEqual(testCase.viewport.height);
      expect(settled.scrollY, `${testCase.label} stays at the top`).toBe(0);
      expect(settled.overflowX, `${testCase.label} has no horizontal overflow`).toBe(false);
      expect(settled.overflowY, `${testCase.label} has no vertical overflow`).toBe(false);
      expect(settled.brokenImages, `${testCase.label} has no broken visible images`).toEqual([]);
      await page.screenshot({ path: `work/opening-match-receipt-${testCase.label}.png` });

      await expect.poll(async () => (await report(page)).bodyClasses.includes("settled-board-outcome-cue"), {
        message: `${testCase.label} receipt retires into the authored agency handoff`,
        timeout: 5000
      }).toBe(false);
      const handoff = await report(page);
      expect(handoff.cue, `${testCase.label} immediately restores the next literal target`).toBe(
        "Find 3 Thorn Roses."
      );
      expect(handoff.bodyClasses, `${testCase.label} retires the transient harvest handoff`)
        .not.toContain("opening-harvest-handoff-cue");
      expect(handoff.cueVisible, `${testCase.label} keeps the agency command lane visible`).toBe(true);
      expect(handoff.hintCount, `${testCase.label} preserves the find-it-yourself window`).toBe(0);
      expect(handoff.targetLiteracy, `${testCase.label} reintroduces the target family`).toBe("Thorn Rose");
      expect(handoff.targetLiteracyTiles, `${testCase.label} highlights every visible target-family tile`)
        .toBeGreaterThan(0);
      expect(handoff.visibleButtons, `${testCase.label} keeps paid recovery subordinate`).toEqual(["Help"]);
      await page.waitForTimeout(2200);
      const sustainedLiteracy = await report(page);
      expect(sustainedLiteracy.targetLiteracy, `${testCase.label} keeps the species identity legible`)
        .toBe("Thorn Rose");
      expect(sustainedLiteracy.targetLiteracyTiles, `${testCase.label} sustains the family link before rescue`)
        .toBe(handoff.targetLiteracyTiles);
      expect(sustainedLiteracy.hintCount, `${testCase.label} still withholds the exact pair`).toBe(0);
      const preGuardState = handoff.state;
      await page.evaluate(() => document.querySelector("#shuffleBtn")?.click());
      const guarded = await report(page);
      expect(guarded.state.moves, `${testCase.label} hidden Shuffle cannot spend a move`).toBe(preGuardState.moves);
      expect(guarded.state.board, `${testCase.label} hidden Shuffle cannot rebuild the authored board`)
        .toEqual(preGuardState.board);
      await page.screenshot({ path: `work/opening-agency-handoff-${testCase.label}.png` });

      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      const restored = await report(page);
      expect(restored.state.moves, `${testCase.label} reload keeps the spent move`).toBe(5);
      expect(restored.state.counts, `${testCase.label} reload keeps earned flowers`)
        .toEqual([0, 0, 0, 0, 0, 3]);
      expect(restored.bodyClasses, `${testCase.label} reload cannot replay the receipt`)
        .not.toContain("settled-board-outcome-cue");
      expect(restored.bodyClasses, `${testCase.label} reload cannot replay the commit`)
        .not.toContain("opening-harvest-commit-cue");
      expect(restored.cueLabel, `${testCase.label} reload cannot replay the commit label`).not.toBe("MATCH LOCKED");
      expect(restored.cue, `${testCase.label} reload cannot replay result copy`).not.toContain("moves left.");
      expect(restored.state.tutorialActive, `${testCase.label} reload cannot revive stale tutorial authority`).toBe(false);
      expect(restored.tutorialVisible, `${testCase.label} reload keeps the stale panel absent`).toBe(false);
      expect(restored.tiles, `${testCase.label} reload retains 64 tiles`).toBe(64);
      expect(restored.rows, `${testCase.label} reload retains eight rows`).toBe(8);

      const secondSwap = await activateHintedPair(page, testCase.input);
      await expect.poll(async () => (await report(page)).bodyClasses.includes("settled-board-outcome-cue"), {
        message: `${testCase.label} exposes the second earned receipt`,
        timeout: 12000
      }).toBe(true);
      const secondReceipt = await report(page);
      const secondThornRoseCount = secondReceipt.state.counts[5];
      const secondThornRoseCredited = Math.min(8, secondThornRoseCount);
      const restoredThornRoseCredited = Math.min(8, restored.state.counts[5]);
      const secondThornRoseDelta = secondThornRoseCredited - restoredThornRoseCredited;
      const secondThornRoseProgress = secondThornRoseCredited >= 8
        ? `${secondThornRoseCredited} of 8 sealed.`
        : `${secondThornRoseCredited} of 8.`;
      expect(secondReceipt.cue, `${testCase.label} second receipt names only the earned result`).toBe(
        `Thorn Rose +${secondThornRoseDelta}, ${secondThornRoseProgress} 4 moves left.`
      );
      expect(secondThornRoseDelta, `${testCase.label} second receipt credits at least the authored match`)
        .toBeGreaterThanOrEqual(3);
      expect(secondReceipt.hintCount, `${testCase.label} receipt withholds the next exact pair`).toBe(0);
      expect(secondReceipt.guideOverlayCount, `${testCase.label} receipt withholds every board guide overlay`).toBe(0);
      expect(secondReceipt.guidedTileLabels, `${testCase.label} receipt withholds guided endpoint labels`).toEqual([]);
      expect(secondReceipt.liveOwners, `${testCase.label} second receipt remains the sole narrator`)
        .toEqual([{ id: "firstSwapCue", live: "polite" }]);
      if (testCase.input === "keyboard") {
        expect(secondReceipt.activeId, `${testCase.label} receipt keeps focus on the settled destination`)
          .toBe(secondSwap.destinationId);
        expect(secondReceipt.rovingIds, `${testCase.label} receipt keeps one settled keyboard entry`)
          .toEqual([secondSwap.destinationId]);
      }
      expect(secondReceipt.state.moves, `${testCase.label} second receipt spends once`).toBe(4);
      expect(secondThornRoseCount, `${testCase.label} second receipt credits Thorn Rose`).toBeGreaterThanOrEqual(6);
      expect(secondReceipt.tiles, `${testCase.label} second receipt retains 64 tiles`).toBe(64);
      expect(secondReceipt.rows, `${testCase.label} second receipt retains eight rows`).toBe(8);
      expect(secondReceipt.boardWidth, `${testCase.label} second receipt exact altar width`)
        .toBe(testCase.mobile ? 378 : 600);
      expect(secondReceipt.boardBottom, `${testCase.label} second receipt altar remains in the viewport`)
        .toBeLessThanOrEqual(testCase.viewport.height);
      expect(secondReceipt.overflowX, `${testCase.label} second receipt has no horizontal overflow`).toBe(false);
      expect(secondReceipt.brokenImages, `${testCase.label} second receipt has no broken visible images`).toEqual([]);
      await page.screenshot({ path: `work/second-harvest-receipt-${testCase.label}.png` });

      await expect.poll(async () => (await report(page)).bodyClasses.includes("settled-board-outcome-cue"), {
        message: `${testCase.label} second receipt retires into Black Candle guidance`,
        timeout: 5000
      }).toBe(false);
      const blackCandleHandoff = await report(page);
      expect(blackCandleHandoff.cue, `${testCase.label} restores the authored Black Candle cue`).toBe(
        "Make 4 Bone Stars - arm Black Candle Vine."
      );
      expect(blackCandleHandoff.hintCount, `${testCase.label} reveals one exact pair after the receipt`).toBe(2);
      expect(blackCandleHandoff.directionalGuideCount, `${testCase.label} reveals one directional guide`).toBe(1);
      expect(blackCandleHandoff.forecastGuideCount, `${testCase.label} reveals one causal result forecast`).toBe(1);
      expect(blackCandleHandoff.guideOverlayCount, `${testCase.label} composes direction and result as one lesson`).toBe(2);
      expect(blackCandleHandoff.guidedTileLabels, `${testCase.label} restores both guided endpoint labels`).toHaveLength(2);
      if (testCase.input === "keyboard") {
        expect(blackCandleHandoff.guideSourceId, `${testCase.label} exposes the exact guide source`).not.toBe("");
        expect(blackCandleHandoff.activeId, `${testCase.label} moves focus only when the guide appears`)
          .toBe(blackCandleHandoff.guideSourceId);
        expect(blackCandleHandoff.rovingIds, `${testCase.label} gives the visible guide sole keyboard entry`)
          .toEqual([blackCandleHandoff.guideSourceId]);
      }
      expect(blackCandleHandoff.visibleButtons, `${testCase.label} keeps Help as the sole command`).toEqual(["Help"]);
      expect(blackCandleHandoff.state.moves, `${testCase.label} handoff spends no extra move`).toBe(4);
      expect(blackCandleHandoff.state.counts, `${testCase.label} handoff changes no objective credit`)
        .toEqual(secondReceipt.state.counts);
      expect(blackCandleHandoff.tiles, `${testCase.label} handoff retains 64 tiles`).toBe(64);
      expect(blackCandleHandoff.rows, `${testCase.label} handoff retains eight rows`).toBe(8);
      expect(blackCandleHandoff.overflowX, `${testCase.label} handoff has no horizontal overflow`).toBe(false);
      expect(blackCandleHandoff.brokenImages, `${testCase.label} handoff has no broken visible images`).toEqual([]);
      await page.screenshot({ path: `work/second-harvest-black-candle-${testCase.label}.png` });
      expect(browserErrors, `${testCase.label} browser warning/error ledger`).toEqual([]);
    } finally {
      await page.evaluate(() => window.__openingReceiptObserver?.disconnect()).catch(() => {});
      await context.close();
    }
  });
}

for (const testCase of RECEIPT_TAB_CASES) {
  test(`Tab during the second receipt yields to its next guide on ${testCase.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      reducedMotion: testCase.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const browserErrors = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));

    try {
      await openFresh(page, `receipt-tab-${testCase.label}`);
      await activateOpeningPair(page, "keyboard");
      await expect.poll(async () => (await report(page)).bodyClasses.includes("settled-board-outcome-cue"), {
        message: `${testCase.label} reaches the first receipt`,
        timeout: 12000
      }).toBe(true);
      await expect.poll(async () => (await report(page)).bodyClasses.includes("settled-board-outcome-cue"), {
        message: `${testCase.label} retires the first receipt`,
        timeout: 5000
      }).toBe(false);

      const secondPair = page.locator("#board .tile.idle-hint");
      await expect(secondPair).toHaveCount(2, { timeout: 9000 });
      const [sourceId, destinationId] = await secondPair.evaluateAll((tiles) => tiles.map((tile) => tile.id));
      await page.locator(`#${sourceId}`).focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Space");
      const secondSwap = { sourceId, destinationId };
      await expect.poll(async () => (await report(page)).bodyClasses.includes("settled-board-outcome-cue"), {
        message: `${testCase.label} reaches the second receipt`,
        timeout: 12000
      }).toBe(true);
      const beforeTab = await report(page);
      expect(beforeTab.activeId, `${testCase.label} starts from the settled destination`)
        .toBe(secondSwap.destinationId);
      expect(beforeTab.rovingIds, `${testCase.label} has one settled board entry`)
        .toEqual([secondSwap.destinationId]);

      await page.keyboard.press("Tab");
      const yielded = await report(page);
      expect(yielded.activeId, `${testCase.label} can yield receipt focus to the page`).toBe("");
      expect(yielded.rovingIds, `${testCase.label} keeps the held board entry while yielded`)
        .toEqual([secondSwap.destinationId]);
      expect(yielded.bodyClasses, `${testCase.label} Tab does not retire the receipt early`)
        .toContain("settled-board-outcome-cue");

      await expect.poll(async () => (await report(page)).bodyClasses.includes("settled-board-outcome-cue"), {
        message: `${testCase.label} retires the second receipt into its guide`,
        timeout: 5000
      }).toBe(false);
      const handoff = await report(page);
      expect(handoff.guideSourceId, `${testCase.label} exposes the next exact guide source`).not.toBe("");
      expect(handoff.activeId, `${testCase.label} gives focus to the newly visible guide`)
        .toBe(handoff.guideSourceId);
      expect(handoff.rovingIds, `${testCase.label} gives the guide sole keyboard entry`)
        .toEqual([handoff.guideSourceId]);
      expect(handoff.cue, `${testCase.label} keeps one literal next command`).toBe(
        "Make 4 Bone Stars - arm Black Candle Vine."
      );
      expect(handoff.visibleButtons, `${testCase.label} keeps Help as the sole command`).toEqual(["Help"]);
      expect(handoff.state.moves, `${testCase.label} Tab spends no move`).toBe(4);
      expect(handoff.tiles, `${testCase.label} retains 64 tiles`).toBe(64);
      expect(handoff.rows, `${testCase.label} retains eight rows`).toBe(8);
      expect(handoff.boardWidth, `${testCase.label} keeps the exact altar width`)
        .toBe(testCase.viewport.width === 390 ? 378 : 600);
      expect(handoff.boardBottom, `${testCase.label} keeps all eight rows in the viewport`)
        .toBeLessThanOrEqual(testCase.viewport.height);
      expect(handoff.overflowX, `${testCase.label} has no horizontal overflow`).toBe(false);
      expect(handoff.overflowY, `${testCase.label} has no vertical overflow`).toBe(false);
      expect(handoff.brokenImages, `${testCase.label} has no broken visible images`).toEqual([]);
      expect(browserErrors, `${testCase.label} browser warning/error ledger`).toEqual([]);
      await page.screenshot({ path: `work/receipt-tab-guide-${testCase.label}.png` });
    } finally {
      await context.close();
    }
  });
}
