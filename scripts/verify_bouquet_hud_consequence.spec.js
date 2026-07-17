const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const HUD_CASES = [
  {
    label: "r1-active",
    expected: "Next: Restore Glass",
    state: { currentRound: 1, moves: 6, counts: [0, 0, 0, 0, 0, 0], coins: 0 }
  },
  {
    label: "r1-failed",
    expected: "Retry Bouquet",
    retry: true,
    state: { currentRound: 1, moves: 0, counts: [0, 0, 0, 0, 0, 0], coins: 0 }
  },
  {
    label: "r1-pending",
    expected: "Ready: Restore Glass",
    action: { id: "restoreGreenhouseBtn", text: "Restore Greenhouse · 100 coins" },
    state: {
      currentRound: 1,
      moves: 1,
      counts: [0, 6, 0, 0, 0, 8],
      coins: 120,
      roundComplete: true
    }
  },
  {
    label: "r1-restored",
    expected: "Next: Moonlit Wreath",
    action: { id: "nextOrderBtn", text: "Next Order → Moonlit Wreath" },
    state: {
      currentRound: 1,
      moves: 1,
      counts: [0, 6, 0, 0, 0, 8],
      coins: 20,
      roundComplete: true,
      roundOneRestored: true
    }
  },
  {
    label: "r2-active",
    expected: "Next: Bloodroot Compact",
    state: {
      currentRound: 2,
      moves: 9,
      counts: [0, 0, 0, 0, 0, 0],
      coins: 20,
      roundOneRestored: true
    }
  },
  {
    label: "r2-failed",
    expected: "Retry Bouquet",
    retry: true,
    state: {
      currentRound: 2,
      moves: 0,
      counts: [0, 0, 0, 0, 0, 0],
      coins: 20,
      roundOneRestored: true
    }
  },
  {
    label: "r2-pending",
    expected: "Ready: Upgrade Glass",
    action: { id: "restoreGreenhouseBtn", text: "Upgrade Greenhouse · 120 coins" },
    state: {
      currentRound: 2,
      moves: 1,
      counts: [0, 0, 10, 0, 9, 7],
      coins: 170,
      clearedCursedThorns: 3,
      roundComplete: true,
      roundOneRestored: true
    }
  },
  {
    label: "r2-upgraded",
    expected: "Next: Bloodroot Compact",
    action: { id: "nextOrderBtn", text: "Next Order → Bloodroot Compact" },
    state: {
      currentRound: 2,
      moves: 1,
      counts: [0, 0, 10, 0, 9, 7],
      coins: 50,
      clearedCursedThorns: 3,
      roundComplete: true,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true
    }
  },
  {
    label: "r3-active",
    expected: "Next: Raise Conservatory",
    state: {
      currentRound: 3,
      moves: 8,
      counts: [0, 0, 0, 0, 0, 0],
      coins: 50,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true
    }
  },
  {
    label: "r3-failed",
    expected: "Retry Bouquet",
    retry: true,
    state: {
      currentRound: 3,
      moves: 0,
      counts: [0, 0, 0, 0, 0, 0],
      coins: 50,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true
    }
  },
  {
    label: "r3-pending",
    expected: "Ready: Raise Conservatory",
    action: { id: "restoreGreenhouseBtn", text: "Raise Conservatory · 180 coins" },
    state: {
      currentRound: 3,
      moves: 1,
      counts: [13, 0, 0, 14, 0, 0],
      coins: 230,
      roundComplete: true,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true
    }
  },
  {
    label: "r3-raised",
    expected: "Next: First Bouquet",
    action: { id: "nextOrderBtn", text: "Play Again → First Bouquet" },
    state: {
      currentRound: 3,
      moves: 1,
      counts: [13, 0, 0, 14, 0, 0],
      coins: 50,
      roundComplete: true,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: true
    }
  }
];

const VIEWPORTS = [
  { label: "desktop", width: 1280, height: 720 },
  { label: "mobile390", width: 390, height: 844 }
];

test.setTimeout(180000);

function savedState(fixture) {
  return {
    focusedEconomyVersion: 2,
    currentRound: 1,
    moves: 6,
    counts: [0, 0, 0, 0, 0, 0],
    coins: 0,
    cursedThorns: [],
    clearedCursedThorns: 0,
    roundComplete: false,
    roundOneRestored: false,
    roundTwoGreenhouseUpgraded: false,
    roundThreeConservatoryRaised: false,
    hasMadeValidMove: true,
    tutorialSkipped: true,
    tutorialActive: false,
    ...fixture.state
  };
}

async function hudReport(page) {
  return page.evaluate(() => {
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
    const label = document.querySelector("#bouquetProgressNext");
    const labelStyle = getComputedStyle(label);
    const board = document.querySelector("#board");
    const boardRect = board?.getBoundingClientRect();
    const activeAction = document.activeElement;
    return {
      text: label.textContent.trim(),
      visible: visible(label),
      clientWidth: label.clientWidth,
      scrollWidth: label.scrollWidth,
      clientHeight: label.clientHeight,
      scrollHeight: label.scrollHeight,
      textOverflow: labelStyle.textOverflow,
      whiteSpace: labelStyle.whiteSpace,
      activeActionId: activeAction?.id || "",
      activeActionText: activeAction?.textContent.trim() || "",
      visiblePayoffActions: [
        document.querySelector("#restoreGreenhouseBtn"),
        document.querySelector("#nextOrderBtn")
      ].filter(visible).map((button) => button.textContent.trim()),
      retryVisible: visible(document.querySelector("#renewBtn.visible")),
      tiles: document.querySelectorAll(".tile").length,
      rows: new Set(Array.from(document.querySelectorAll(".tile"), (tile) => tile.dataset.y)).size,
      boardVisible: visible(board),
      boardBottom: boardRect?.bottom || 0,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  });
}

async function assertHudState(page, fixture, viewport, reload) {
  await expect(page.locator(".tile")).toHaveCount(64);
  if (fixture.action) {
    const action = page.locator(`#${fixture.action.id}`);
    await expect(action).toBeVisible({ timeout: 10000 });
    await expect(action).toHaveText(fixture.action.text);
    await expect(action).toBeFocused();
  } else if (fixture.retry) {
    await expect(page.locator("#renewBtn.visible")).toHaveText("Retry Bouquet");
  } else {
    await expect(page.locator("#board")).toBeVisible();
  }

  const report = await hudReport(page);
  const label = `${viewport.label} ${fixture.label} reload ${reload}`;
  expect(report.text, `${label} exact consequence`).toBe(fixture.expected);
  expect(report.tiles, `${label} tile integrity`).toBe(64);
  expect(report.rows, `${label} board rows`).toBe(8);
  expect(report.overflowX, `${label} no page overflow`).toBe(false);
  expect(report.brokenImages, `${label} no broken images`).toEqual([]);

  if (viewport.label === "desktop") {
    expect(report.visible, `${label} consequence visible`).toBe(true);
    expect(report.scrollWidth, `${label} horizontal fit`).toBeLessThanOrEqual(report.clientWidth + 1);
    expect(report.scrollHeight, `${label} vertical fit`).toBeLessThanOrEqual(report.clientHeight + 1);
    expect(report.textOverflow, `${label} no ellipsis`).toBe("clip");
    expect(report.whiteSpace, `${label} bounded wrapping`).toBe("normal");
  } else {
    expect(report.visible, `${label} desktop-only label stays hidden`).toBe(false);
    if (!fixture.action) {
      expect(report.boardVisible, `${label} active board visible`).toBe(true);
      expect(report.boardBottom, `${label} board remains in first viewport`).toBeLessThanOrEqual(844);
    }
  }

  if (fixture.action) {
    expect(report.visiblePayoffActions, `${label} one payoff action`).toEqual([fixture.action.text]);
    expect(report.activeActionId, `${label} focused action id`).toBe(fixture.action.id);
    expect(report.activeActionText, `${label} focused action text`).toBe(fixture.action.text);
  } else {
    expect(report.visiblePayoffActions, `${label} no payoff action`).toEqual([]);
  }
  expect(report.retryVisible, `${label} retry visibility`).toBe(Boolean(fixture.retry));
}

for (const viewport of VIEWPORTS) {
  test(`focused bouquet HUD consequences fit every state on ${viewport.label}`, async ({ browser }) => {
    for (const fixture of HUD_CASES) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();
      const runtimeErrors = [];
      const requestFailures = [];
      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(message.text());
      });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));
      page.on("requestfailed", (request) => {
        const errorText = request.failure()?.errorText || "failed";
        const replacedGreenhouseImage = errorText === "net::ERR_ABORTED"
          && request.url().includes("/assets/greenhouse/")
          && request.url().endsWith(".jpg");
        if (!replacedGreenhouseImage) {
          requestFailures.push(`${request.url()} :: ${errorText}`);
        }
      });
      await page.addInitScript(({ key, state, marker }) => {
        if (!sessionStorage.getItem(marker)) {
          localStorage.setItem(key, JSON.stringify(state));
          sessionStorage.setItem(marker, "1");
        }
      }, {
        key: SAVE_KEY,
        state: savedState(fixture),
        marker: `bouquet-hud-${viewport.label}-${fixture.label}`
      });
      await page.goto(
        `${BASE_URL}?bouquet-hud=${viewport.label}-${fixture.label}`,
        { waitUntil: "networkidle" }
      );

      const reloadCount = fixture.action ? 2 : 1;
      for (let reload = 0; reload <= reloadCount; reload += 1) {
        await assertHudState(page, fixture, viewport, reload);
        if (
          reload === 0
          && ["r1-active", "r1-pending", "r2-pending", "r3-pending"].includes(fixture.label)
        ) {
          await page.screenshot({
            path: `work/hud-consequence-${viewport.label}-${fixture.label}.png`,
            fullPage: true
          });
        }
        if (reload < reloadCount) {
          await page.reload({ waitUntil: "networkidle" });
        }
      }

      expect(runtimeErrors, `${viewport.label} ${fixture.label} runtime errors`).toEqual([]);
      expect(requestFailures, `${viewport.label} ${fixture.label} request failures`).toEqual([]);
      await context.close();
    }
  });
}
