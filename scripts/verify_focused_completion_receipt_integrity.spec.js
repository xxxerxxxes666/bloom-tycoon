const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const pageUrl = (query) => `${BASE_URL}${BASE_URL.includes("?") ? "&" : "?"}${query}`;

const CASES = [
  {
    label: "round-one-phantom",
    state: {
      focusedEconomyVersion: 2,
      currentRound: 1,
      roundComplete: true,
      moves: 3,
      coins: 120,
      counts: [0, 6, 0, 0, 0, 6],
      blackCandleLessonComplete: false
    },
    expectedCoins: 0,
    forbiddenAction: "Restore Greenhouse"
  },
  {
    label: "round-one-lesson-phantom",
    state: {
      focusedEconomyVersion: 2,
      currentRound: 1,
      roundComplete: true,
      moves: 3,
      coins: 120,
      counts: [0, 6, 0, 0, 0, 8],
      blackCandleLessonComplete: false
    },
    expectedCoins: 0,
    forbiddenAction: "Restore Greenhouse"
  },
  {
    label: "round-two-phantom",
    state: {
      focusedEconomyVersion: 2,
      currentRound: 2,
      roundComplete: true,
      roundOneRestored: true,
      moves: 5,
      coins: 170,
      counts: [0, 0, 10, 0, 9, 7],
      clearedCursedThorns: 2
    },
    expectedCoins: 20,
    forbiddenAction: "Upgrade Greenhouse"
  },
  {
    label: "round-three-phantom",
    state: {
      focusedEconomyVersion: 2,
      currentRound: 3,
      roundComplete: true,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      moves: 4,
      coins: 230,
      counts: [11, 0, 0, 14, 0, 0]
    },
    expectedCoins: 50,
    forbiddenAction: "Raise Conservatory"
  },
  {
    label: "owned-replay-phantom",
    state: {
      focusedEconomyVersion: 2,
      currentRound: 3,
      roundComplete: true,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: true,
      moves: 4,
      coins: 7820,
      counts: [11, 0, 0, 14, 0, 0]
    },
    expectedCoins: 7820,
    forbiddenAction: "Play Again"
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
        && rect.width > 0 && rect.height > 0;
    };
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board")?.getBoundingClientRect();
    return {
      save: localStorage.getItem(key),
      state,
      message: document.querySelector("#ritualLog")?.textContent.trim() || "",
      commands: [...document.querySelectorAll("button:not(.tile)")]
        .filter(visible)
        .map((button) => button.textContent.trim()),
      contractRound: document.querySelector("#activeOrders .order-contract")?.dataset.contractRound || "",
      disabledTiles: tiles.filter((tile) => tile.disabled).length,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      boardWidth: board?.width || 0,
      boardBottom: board?.bottom || 0,
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
  for (const receiptCase of CASES) {
    test(`${receiptCase.label} reopens from an unsupported receipt on ${viewportCase.label}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: viewportCase.viewport,
        hasTouch: Boolean(viewportCase.mobile),
        isMobile: Boolean(viewportCase.mobile)
      });
      const page = await context.newPage();
      const problems = [];
      page.on("console", (message) => {
        if (["warning", "error"].includes(message.type())) problems.push(message.text());
      });
      page.on("pageerror", (error) => problems.push(error.message));
      try {
        await page.addInitScript(({ key, state, marker }) => {
          if (!sessionStorage.getItem(marker)) {
            localStorage.setItem(key, JSON.stringify(state));
            sessionStorage.setItem(marker, "1");
          }
        }, {
          key: SAVE_KEY,
          state: receiptCase.state,
          marker: `receipt-${receiptCase.label}-${viewportCase.label}`
        });
        await page.goto(pageUrl(`receipt=${receiptCase.label}-${viewportCase.label}`), {
          waitUntil: "networkidle"
        });

        const repaired = await report(page);
        expect(repaired.state.roundComplete).toBe(false);
        expect(repaired.state.coins).toBe(receiptCase.expectedCoins);
        expect(repaired.state.freshConservatorySettlement).toBe(false);
        expect(repaired.message).toContain("Saved order reopened.");
        expect(repaired.commands.some((command) => command.includes(receiptCase.forbiddenAction))).toBe(false);
        expect(repaired.contractRound).toBe(String(receiptCase.state.currentRound));
        expect(repaired.tiles).toBe(64);
        expect(repaired.rows).toBe(8);
        expect(repaired.disabledTiles).toBe(0);
        expect(repaired.boardWidth).toBeCloseTo(viewportCase.mobile ? 378 : 600, 2);
        expect(repaired.boardBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
        expect(repaired.scrollY).toBe(0);
        expect(repaired.overflowX).toBe(false);
        if (viewportCase.mobile) expect(repaired.overflowY).toBe(false);
        expect(repaired.brokenImages).toEqual([]);
        expect(problems).toEqual([]);
        if (receiptCase.label === "round-one-phantom") {
          await page.screenshot({
            path: `work/focused-receipt-repair-${viewportCase.label}.png`,
            fullPage: false
          });
        }

        const repairedSave = repaired.save;
        await page.reload({ waitUntil: "networkidle" });
        const stable = await report(page);
        expect(stable.save).toBe(repairedSave);
        expect(stable.state.roundComplete).toBe(false);
        expect(stable.state.coins).toBe(receiptCase.expectedCoins);
        expect(stable.tiles).toBe(64);
        expect(stable.rows).toBe(8);
        expect(stable.boardWidth).toBeCloseTo(viewportCase.mobile ? 378 : 600, 2);
        expect(stable.boardBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
        expect(stable.scrollY).toBe(0);
        expect(stable.overflowX).toBe(false);
        if (viewportCase.mobile) expect(stable.overflowY).toBe(false);
        expect(stable.brokenImages).toEqual([]);
        expect(problems).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
}

test("a current earned receipt remains complete", async ({ page }) => {
  const state = {
    focusedEconomyVersion: 2,
    currentRound: 1,
    roundComplete: true,
    moves: 2,
    coins: 120,
    counts: [0, 6, 0, 0, 0, 8],
    blackCandleLessonComplete: true
  };
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: SAVE_KEY,
    value: state
  });
  await page.goto(pageUrl("receipt-valid=1"), { waitUntil: "networkidle" });
  const valid = await report(page);
  expect(valid.state.roundComplete).toBe(true);
  expect(valid.state.coins).toBe(120);
  expect(valid.commands.some((command) => command.includes("Restore Greenhouse"))).toBe(true);
});
