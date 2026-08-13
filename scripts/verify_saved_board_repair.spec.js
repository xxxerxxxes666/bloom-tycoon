const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const RECEIPT_COPY = "SAVED ALTAR REPAIRED · STABLE PLAYABLE BOARD RESTORED.";

const MATCHED_BOARD = Array.from({ length: 8 }, () => Array(8).fill(0));
const ROUND_TWO_STATE = {
  focusedEconomyVersion: 3,
  currentRound: 2,
  roundComplete: false,
  moves: 8,
  coins: 20,
  counts: [0, 0, 3, 0, 3, 2],
  cursedThorns: [
    { x: 1, y: 1, hp: 1 },
    { x: 2, y: 1, hp: 1 }
  ],
  clearedCursedThorns: 1,
  roundOneRestored: true,
  roundTwoGreenhouseUpgraded: false,
  roundThreeConservatoryRaised: false,
  hasMadeValidMove: true,
  restoredRoundTwoGuideMoves: 1,
  tutorialSkipped: true,
  tutorialActive: false,
  blackCandleLessonComplete: true
};

const CASES = [
  {
    label: "invalid-shape",
    raw: JSON.stringify({ ...ROUND_TWO_STATE, board: [[0]] }),
    expectedRound: 2,
    expectedMoves: 8,
    expectedCoins: 20,
    expectedCounts: ROUND_TWO_STATE.counts,
    expectedProgress: "Bouquet · 9/29"
  },
  {
    label: "pre-matched",
    raw: JSON.stringify({ ...ROUND_TWO_STATE, board: MATCHED_BOARD }),
    expectedRound: 2,
    expectedMoves: 8,
    expectedCoins: 20,
    expectedCounts: ROUND_TWO_STATE.counts,
    expectedProgress: "Bouquet · 9/29"
  },
  {
    label: "unreadable-json",
    raw: "{not-json",
    expectedRound: 1,
    expectedMoves: 6,
    expectedCoins: 0,
    expectedCounts: [0, 0, 0, 0, 0, 0],
    expectedProgress: "Bouquet · 0/14"
  }
];

const VIEWPORTS = [
  { label: "desktop", viewport: { width: 1280, height: 720 } },
  { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
];

test.setTimeout(60000);

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return !node.hidden && style.display !== "none" && style.visibility !== "hidden"
        && Number(style.opacity || 1) > 0.01 && rect.width > 0 && rect.height > 0;
    };
    const geometry = (node) => {
      if (!node) return null;
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
    const overlaps = (first, second) => {
      if (!visible(first) || !visible(second)) return false;
      const a = first.getBoundingClientRect();
      const b = second.getBoundingClientRect();
      return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5
        && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;
    };
    const raw = localStorage.getItem(key) || "";
    let state = null;
    try {
      state = JSON.parse(raw);
    } catch (error) {
      state = null;
    }
    const board = state?.board;
    const hasMatch = (candidate) => {
      if (!Array.isArray(candidate) || candidate.length !== 8) return true;
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          if (x <= 5 && candidate[y][x] === candidate[y][x + 1] && candidate[y][x] === candidate[y][x + 2]) return true;
          if (y <= 5 && candidate[y][x] === candidate[y + 1][x] && candidate[y][x] === candidate[y + 2][x]) return true;
        }
      }
      return false;
    };
    const createsMatch = (candidate, ax, ay, bx, by) => {
      const copy = candidate.map((row) => row.slice());
      [copy[ay][ax], copy[by][bx]] = [copy[by][bx], copy[ay][ax]];
      return hasMatch(copy);
    };
    const hasLegalMove = (candidate) => {
      if (!Array.isArray(candidate) || candidate.length !== 8 || hasMatch(candidate)) return false;
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          if (x < 7 && createsMatch(candidate, x, y, x + 1, y)) return true;
          if (y < 7 && createsMatch(candidate, x, y, x, y + 1)) return true;
        }
      }
      return false;
    };
    const tiles = [...document.querySelectorAll("#board .tile")];
    const boardNode = document.querySelector("#board");
    const altar = boardNode?.getBoundingClientRect();
    const cue = document.querySelector("#firstSwapCue");
    const cueStyle = cue ? getComputedStyle(cue) : null;
    const title = document.querySelector(".title");
    const objective = document.querySelector("#objective");
    const help = document.querySelector("#tutorialHelpBtn");
    const greenhouse = innerWidth <= 760
      ? document.querySelector("#mobileGreenhouseProgress")
      : document.querySelector(".hero");
    const tutorial = document.querySelector("#tutorialPanel");
    const liveOwners = [...document.querySelectorAll('[aria-live="polite"]')]
      .filter(visible)
      .map((node) => node.id);
    const receiptText = cue?.textContent.trim() || "";
    const receiptVisible = visible(cue) && receiptText.startsWith("SAVED ALTAR REPAIRED");
    const cueRect = geometry(cue);
    return {
      now: performance.now(),
      raw,
      state,
      boardValid: Array.isArray(board) && board.length === 8
        && board.every((row) => Array.isArray(row) && row.length === 8
          && row.every((tile) => Number.isInteger(tile) && tile >= 0 && tile < 6)),
      hasMatch: hasMatch(board),
      hasLegalMove: hasLegalMove(board),
      message: document.querySelector("#ritualLog")?.textContent.trim() || "",
      progress: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      phase: document.body.dataset.savedAltarRepairPhase || "",
      motion: document.body.classList.contains("reduced-motion") ? "reduced" : "full",
      cue: receiptText,
      cueAuthority: cue?.dataset.commandAuthority || "",
      cueLive: cue?.getAttribute("aria-live") || "",
      cueVisible: visible(cue),
      cueRect,
      cueFontSize: Number.parseFloat(cueStyle?.fontSize || "0"),
      cueOpacity: Number.parseFloat(cueStyle?.opacity || "0"),
      cueColor: cueStyle?.color || "",
      receiptVisible,
      receiptContained: Boolean(cueRect)
        && cueRect.left >= -0.5
        && cueRect.top >= -0.5
        && cueRect.right <= innerWidth + 0.5
        && cueRect.bottom <= innerHeight + 0.5,
      receiptOverlaps: {
        title: overlaps(cue, title),
        objective: overlaps(cue, objective),
        help: overlaps(cue, help),
        greenhouse: overlaps(cue, greenhouse),
        altar: overlaps(cue, boardNode)
      },
      tutorialVisible: visible(tutorial),
      tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      liveOwners,
      liveAttributes: Object.fromEntries([
        "coinBalance",
        "roundOneRestoration",
        "tutorialPanel",
        "firstSwapCue",
        "nextOrderCue"
      ].map((id) => [id, document.getElementById(id)?.getAttribute("aria-live") || ""])),
      repairAnnouncements: window.__savedAltarRepairAnnouncements || [],
      repairTimeline: window.__savedAltarRepairTimeline || {},
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      disabled: tiles.filter((tile) => tile.disabled).length,
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      activeId: document.activeElement?.id || "",
      boardWidth: altar?.width || 0,
      boardHeight: altar?.height || 0,
      boardBottom: altar?.bottom || 0,
      lastRowBottom: Math.max(0, ...tiles
        .filter((tile) => tile.dataset.y === "7")
        .map((tile) => tile.getBoundingClientRect().bottom)),
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

for (const viewportCase of VIEWPORTS) {
  for (const repairCase of CASES) {
    test(`${repairCase.label} altar repair persists on ${viewportCase.label}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: viewportCase.viewport,
        hasTouch: Boolean(viewportCase.mobile),
        isMobile: Boolean(viewportCase.mobile),
        reducedMotion: repairCase.label === "unreadable-json" ? "reduce" : "no-preference"
      });
      const page = await context.newPage();
      const problems = [];
      const failedRequests = [];
      const badResponses = [];
      page.on("console", (message) => {
        if (["warning", "error"].includes(message.type())) problems.push(message.text());
      });
      page.on("pageerror", (error) => problems.push(error.message));
      page.on("requestfailed", (request) => {
        const failure = request.failure()?.errorText || "";
        if (failure !== "net::ERR_ABORTED") failedRequests.push(`${request.url()} ${failure}`);
      });
      page.on("response", (response) => {
        if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
      });
      try {
        await page.addInitScript(({ key, raw, marker }) => {
          window.__savedAltarRepairAnnouncements = [];
          window.__savedAltarRepairTimeline = {};
          let lastReceipt = "";
          const recordReceipt = () => {
            const cue = document.querySelector("#firstSwapCue");
            if (!cue) return;
            const rect = cue.getBoundingClientRect();
            const style = getComputedStyle(cue);
            const text = cue.textContent.trim();
            const visible = style.display !== "none"
              && style.visibility !== "hidden"
              && Number(style.opacity || 1) > 0.01
              && rect.width > 0
              && rect.height > 0;
            const receipt = visible
              && cue.getAttribute("aria-live") === "polite"
              && cue.dataset.commandAuthority === "saved-altar-repair"
              && text.startsWith("SAVED ALTAR REPAIRED")
              ? text
              : "";
            if (receipt && receipt !== lastReceipt) {
              window.__savedAltarRepairTimeline.receiptAt = performance.now();
              window.__savedAltarRepairAnnouncements.push({
                owner: cue.id,
                text: receipt,
                at: window.__savedAltarRepairTimeline.receiptAt
              });
            }
            if (
              window.__savedAltarRepairTimeline.receiptAt
              && !window.__savedAltarRepairTimeline.retiredAt
              && document.body?.dataset.savedAltarRepairPhase === "settled"
            ) {
              window.__savedAltarRepairTimeline.retiredAt = performance.now();
              window.__savedAltarRepairTimeline.retiredRaw = localStorage.getItem(key) || "";
            }
            const tutorial = document.querySelector("#tutorialPanel");
            if (
              window.__savedAltarRepairTimeline.retiredAt
              && !window.__savedAltarRepairTimeline.tutorialAt
              && tutorial
              && tutorial.getAttribute("aria-live") === "polite"
              && getComputedStyle(tutorial).display !== "none"
              && tutorial.getBoundingClientRect().height > 0
            ) {
              window.__savedAltarRepairTimeline.tutorialAt = performance.now();
            }
            lastReceipt = receipt;
          };
          const installRecorder = () => {
            new MutationObserver(recordReceipt).observe(document.documentElement, {
              attributes: true,
              childList: true,
              characterData: true,
              subtree: true
            });
            queueMicrotask(recordReceipt);
          };
          if (document.documentElement) {
            installRecorder();
          } else {
            document.addEventListener("readystatechange", installRecorder, { once: true });
          }
          if (!sessionStorage.getItem(marker)) {
            localStorage.setItem(key, raw);
            sessionStorage.setItem(marker, "1");
          }
        }, {
          key: SAVE_KEY,
          raw: repairCase.raw,
          marker: `saved-board-repair-${repairCase.label}-${viewportCase.label}`
        });
        await page.goto(`${BASE_URL}?saved-board-repair=${repairCase.label}-${viewportCase.label}`, {
          waitUntil: "networkidle"
        });

        await expect.poll(async () => (await report(page)).receiptVisible, {
          timeout: 1800,
          message: `${repairCase.label} ${viewportCase.label} receipt never became visible`
        }).toBe(true);
        await expect.poll(async () => (await report(page)).repairAnnouncements.length).toBe(1);
        const peak = await report(page);
        let repaired = peak;
        expect(repaired.state).not.toBeNull();
        expect(repaired.state.currentRound).toBe(repairCase.expectedRound);
        expect(repaired.state.moves).toBe(repairCase.expectedMoves);
        expect(repaired.state.coins).toBe(repairCase.expectedCoins);
        expect(repaired.state.counts).toEqual(repairCase.expectedCounts);
        expect(repaired.progress).toBe(repairCase.expectedProgress);
        expect(repaired.message).toContain("Saved altar repaired.");
        expect(repaired.phase).toBe("receipt");
        expect(repaired.motion).toBe(repairCase.label === "unreadable-json" ? "reduced" : "full");
        expect(repaired.cue).toBe(RECEIPT_COPY);
        expect(repaired.cueAuthority).toBe("saved-altar-repair");
        expect(repaired.cueLive).toBe("polite");
        expect(repaired.receiptVisible).toBe(true);
        expect(repaired.receiptContained).toBe(true);
        expect(repaired.cueRect.width).toBeGreaterThan(viewportCase.mobile ? 150 : 190);
        expect(repaired.cueRect.height).toBeGreaterThanOrEqual(viewportCase.mobile ? 44 : 25);
        expect(repaired.cueFontSize).toBeGreaterThanOrEqual(viewportCase.mobile ? 9 : 10);
        expect(repaired.cueOpacity).toBeGreaterThan(0.95);
        expect(repaired.cueColor).not.toBe("rgba(0, 0, 0, 0)");
        expect(repaired.receiptOverlaps).toEqual({
          title: false,
          objective: false,
          help: false,
          greenhouse: false,
          altar: false
        });
        expect(repaired.tutorialVisible).toBe(false);
        expect(repaired.liveOwners).toEqual(["firstSwapCue"]);
        expect(repaired.liveAttributes).toEqual({
          coinBalance: "off",
          roundOneRestoration: "off",
          tutorialPanel: "off",
          firstSwapCue: "polite",
          nextOrderCue: "off"
        });
        expect(repaired.repairAnnouncements).toEqual([expect.objectContaining({
          owner: "firstSwapCue",
          text: RECEIPT_COPY
        })]);
        expect(repaired.boardValid).toBe(true);
        expect(repaired.hasMatch).toBe(false);
        expect(repaired.hasLegalMove).toBe(true);
        expect(repaired.tiles).toBe(64);
        expect(repaired.rows).toBe(8);
        expect(repaired.disabled).toBe(0);
        expect(repaired.roving).toHaveLength(1);
        expect(repaired.boardWidth).toBeCloseTo(viewportCase.mobile ? 378 : 600, 1);
        expect(repaired.boardHeight).toBeCloseTo(viewportCase.mobile ? 378 : 600, 1);
        expect(repaired.boardBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
        expect(repaired.lastRowBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
        expect(repaired.scrollY).toBe(0);
        expect(repaired.overflowX).toBe(false);
        if (viewportCase.mobile) expect(repaired.overflowY).toBe(false);
        expect(repaired.brokenImages).toEqual([]);
        expect(problems).toEqual([]);
        expect(failedRequests).toEqual([]);
        expect(badResponses).toEqual([]);

        await page.screenshot({
          path: `work/saved-altar-repair-${repairCase.label}-${viewportCase.label}.png`,
          fullPage: false
        });

        await expect.poll(async () => (await report(page)).phase, {
          timeout: 3600,
          message: `${repairCase.label} ${viewportCase.label} receipt did not retire`
        }).toBe("settled");
        const retired = await report(page);
        expect(retired.receiptVisible).toBe(false);
        expect(retired.repairTimeline.retiredRaw).toBe(peak.raw);
        expect(retired.repairTimeline.retiredAt - retired.repairTimeline.receiptAt)
          .toBeGreaterThanOrEqual(1950);
        expect(retired.repairTimeline.retiredAt - retired.repairTimeline.receiptAt)
          .toBeLessThan(2600);
        expect(retired.repairAnnouncements).toHaveLength(1);

        if (repairCase.label === "unreadable-json") {
          await expect.poll(async () => (await report(page)).state?.tutorialActive, {
            timeout: 1600
          }).toBe(true);
          repaired = await report(page);
          expect(repaired.repairTimeline.tutorialAt - repaired.repairTimeline.retiredAt)
            .toBeGreaterThanOrEqual(600);
          expect(repaired.repairTimeline.tutorialAt - repaired.repairTimeline.retiredAt)
            .toBeLessThan(1100);
          expect(repaired.tutorialVisible).toBe(true);
          expect(repaired.tutorialCopy).toBe("Swap the glowing flowers.");
          expect(repaired.liveOwners).toEqual(["tutorialPanel"]);
          expect(repaired.liveAttributes.tutorialPanel).toBe("polite");
          expect(repaired.liveAttributes.firstSwapCue).toBe("off");
        } else {
          await expect.poll(async () => (await report(page)).cueAuthority, {
            timeout: 1400,
            message: `${repairCase.label} ${viewportCase.label} active-order cue did not return`
          }).toBe("board-cue");
          repaired = await report(page);
          expect(repaired.raw).toBe(peak.raw);
          expect(repaired.cue).toMatch(/^(Nightshade|Amber Seed|Thorn Rose) next (?:↑↓|↔)$/);
          expect(repaired.cueVisible).toBe(true);
          expect(repaired.cueAuthority).toBe("board-cue");
          expect(repaired.liveOwners).toEqual(["firstSwapCue"]);
        }

        console.log(`${repairCase.label} ${viewportCase.label} repair receipt ${JSON.stringify({
          motion: peak.motion,
          receipt: peak.cueRect,
          receiptMs: Math.round(retired.repairTimeline.retiredAt - retired.repairTimeline.receiptAt),
          nextOwner: repaired.liveOwners,
          nextCue: repairCase.label === "unreadable-json" ? repaired.tutorialCopy : repaired.cue,
          board: {
            width: peak.boardWidth,
            height: peak.boardHeight,
            bottom: peak.boardBottom,
            lastRowBottom: peak.lastRowBottom
          },
          overflowX: peak.overflowX,
          overflowY: peak.overflowY
        })}`);

        if (repairCase.label === "invalid-shape") {
          await page.screenshot({
            path: `/tmp/bloom-saved-altar-repair-${viewportCase.label}.png`,
            fullPage: false
          });
        }

        await page.reload({ waitUntil: "networkidle" });
        const stable = await report(page);
        expect(stable.phase).toBe("settled");
        expect(stable.receiptVisible).toBe(false);
        expect(stable.repairAnnouncements).toEqual([]);
        expect(stable.message).not.toContain("Saved altar repaired.");
        expect(stable.raw).toBe(repaired.raw);
        expect(stable.state.board).toEqual(repaired.state.board);
        expect(stable.state.currentRound).toBe(repairCase.expectedRound);
        expect(stable.state.moves).toBe(repairCase.expectedMoves);
        expect(stable.state.coins).toBe(repairCase.expectedCoins);
        expect(stable.state.counts).toEqual(repairCase.expectedCounts);
        expect(stable.progress).toBe(repairCase.expectedProgress);
        expect(stable.boardValid).toBe(true);
        expect(stable.hasMatch).toBe(false);
        expect(stable.hasLegalMove).toBe(true);
        expect(stable.tiles).toBe(64);
        expect(stable.rows).toBe(8);
        expect(stable.disabled).toBe(0);
        expect(stable.roving).toHaveLength(1);
        expect(stable.boardWidth).toBeCloseTo(viewportCase.mobile ? 378 : 600, 1);
        expect(stable.boardHeight).toBeCloseTo(viewportCase.mobile ? 378 : 600, 1);
        expect(stable.boardBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
        expect(stable.lastRowBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
        expect(stable.scrollY).toBe(0);
        expect(stable.overflowX).toBe(false);
        if (viewportCase.mobile) expect(stable.overflowY).toBe(false);
        expect(stable.brokenImages).toEqual([]);
        expect(problems).toEqual([]);
        expect(failedRequests).toEqual([]);
        expect(badResponses).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
}
