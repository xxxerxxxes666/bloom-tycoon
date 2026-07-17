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

const ACTIVE_VIEWPORT_CASES = [
  {
    ...HUD_CASES.find((fixture) => fixture.label === "r2-active"),
    tutorialCopy: "Match beside thorns."
  },
  {
    ...HUD_CASES.find((fixture) => fixture.label === "r3-active"),
    tutorialCopy: "Complete Bloodroot Compact."
  }
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

async function findLegalMatchPair(page) {
  return page.evaluate(() => {
    const size = 8;
    const grid = Array.from({ length: size }, () => Array(size).fill(-1));
    document.querySelectorAll(".tile").forEach((tile) => {
      grid[Number(tile.dataset.y)][Number(tile.dataset.x)] = Number(tile.dataset.flowerId);
    });
    const runLength = (x, y, dx, dy) => {
      const flowerId = grid[y][x];
      let count = 1;
      for (const sign of [-1, 1]) {
        let nx = x + dx * sign;
        let ny = y + dy * sign;
        while (
          nx >= 0 && nx < size && ny >= 0 && ny < size
          && grid[ny][nx] === flowerId
        ) {
          count += 1;
          nx += dx * sign;
          ny += dy * sign;
        }
      }
      return count;
    };
    const createsMatch = (cell) => (
      runLength(cell.x, cell.y, 1, 0) >= 3
      || runLength(cell.x, cell.y, 0, 1) >= 3
    );
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= size || ny >= size || grid[y][x] === grid[ny][nx]) {
            continue;
          }
          [grid[y][x], grid[ny][nx]] = [grid[ny][nx], grid[y][x]];
          const legal = createsMatch({ x, y }) || createsMatch({ x: nx, y: ny });
          [grid[y][x], grid[ny][nx]] = [grid[ny][nx], grid[y][x]];
          if (legal) {
            return [{ x, y }, { x: nx, y: ny }];
          }
        }
      }
    }
    return [];
  });
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
    const retry = page.locator("#renewBtn.visible");
    await expect(retry).toHaveText("Retry Bouquet");
    await expect(retry).toBeFocused();
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

async function activeViewportReport(page) {
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
    const board = document.querySelector("#board");
    const boardRect = board?.getBoundingClientRect();
    const help = document.querySelector("#tutorialHelpBtn");
    const helpRect = help?.getBoundingClientRect();
    const tileRows = new Set(Array.from(document.querySelectorAll(".tile"), (tile) => tile.dataset.y));
    const completeRows = new Set(Array.from(document.querySelectorAll(".tile"))
      .filter((tile) => {
        const rect = tile.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= innerHeight;
      })
      .map((tile) => tile.dataset.y));
    return {
      boardTop: boardRect?.top || 0,
      boardBottom: boardRect?.bottom || 0,
      boardWidth: boardRect?.width || 0,
      boardHeight: boardRect?.height || 0,
      tiles: document.querySelectorAll(".tile").length,
      rows: tileRows.size,
      completeRows: completeRows.size,
      helpVisible: visible(help),
      helpTop: helpRect?.top || 0,
      helpBottom: helpRect?.bottom || 0,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  });
}

function assertActiveViewport(report, viewport, label) {
  expect(report.tiles, `${label} tile integrity`).toBe(64);
  expect(report.rows, `${label} board rows`).toBe(8);
  expect(report.completeRows, `${label} complete rows`).toBe(8);
  expect(report.boardTop, `${label} board starts inside viewport`).toBeGreaterThanOrEqual(0);
  expect(report.boardBottom, `${label} altar frame stays inside viewport`).toBeLessThanOrEqual(viewport.height - 4);
  expect(report.overflowX, `${label} no horizontal overflow`).toBe(false);
  expect(report.brokenImages, `${label} no broken images`).toEqual([]);
  if (viewport.label === "desktop") {
    expect(report.boardWidth, `${label} full desktop altar width`).toBeCloseTo(480, 0);
    expect(report.boardHeight, `${label} full desktop altar height`).toBeCloseTo(480, 0);
  }
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

for (const viewport of VIEWPORTS) {
  test(`failed bouquets focus Retry and preserve keyboard recovery on ${viewport.label}`, async ({ browser }) => {
    for (const round of [1, 2, 3]) {
      const failedFixture = HUD_CASES.find((fixture) => fixture.label === `r${round}-failed`);
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();
      const runtimeErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(message.text());
      });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));

      const naturalFailureState = savedState(failedFixture);
      naturalFailureState.moves = 1;
      await page.addInitScript(({ key, state, marker }) => {
        if (!sessionStorage.getItem(marker)) {
          localStorage.setItem(key, JSON.stringify(state));
          sessionStorage.setItem(marker, "1");
        }
      }, {
        key: SAVE_KEY,
        state: naturalFailureState,
        marker: `retry-focus-${viewport.label}-round-${round}`
      });
      await page.goto(
        `${BASE_URL}?retry-focus=${viewport.label}-round-${round}`,
        { waitUntil: "networkidle" }
      );

      const pair = await findLegalMatchPair(page);
      expect(pair, `${viewport.label} Round ${round} natural final move`).toHaveLength(2);
      for (const cell of pair) {
        await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).click();
      }

      const retry = page.locator("#renewBtn.visible");
      await expect(retry).toHaveText("Retry Bouquet", { timeout: 10000 });
      await expect(retry).toBeFocused();
      const failedState = await page.evaluate((key) => (
        JSON.parse(localStorage.getItem(key) || "{}")
      ), SAVE_KEY);
      expect(failedState.moves, `${viewport.label} Round ${round} final move spent once`).toBe(0);
      expect(failedState.currentRound, `${viewport.label} Round ${round} authored order`).toBe(round);

      for (let reload = 0; reload < 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(retry).toBeVisible();
        await expect(retry).toBeFocused();
      }

      const assertRecoveredRound = async (key) => {
        await expect(retry).toBeHidden();
        await expect(page.locator(".tile")).toHaveCount(64);
        const recovered = await page.evaluate((saveKey) => {
          const state = JSON.parse(localStorage.getItem(saveKey) || "{}");
          const tabStops = Array.from(document.querySelectorAll(".tile[tabindex='0']"));
          return {
            currentRound: state.currentRound,
            moves: state.moves,
            counts: state.counts,
            coins: state.coins,
            roundOneRestored: Boolean(state.roundOneRestored),
            roundTwoGreenhouseUpgraded: Boolean(state.roundTwoGreenhouseUpgraded),
            tiles: document.querySelectorAll(".tile").length,
            rows: new Set(Array.from(document.querySelectorAll(".tile"), (tile) => tile.dataset.y)).size,
            tabStops: tabStops.length,
            focusedTile: Boolean(document.activeElement?.classList.contains("tile")),
            overflowX: document.documentElement.scrollWidth > innerWidth + 1,
            brokenImages: Array.from(document.images)
              .filter((image) => {
                const rect = image.getBoundingClientRect();
                const style = getComputedStyle(image);
                return style.display !== "none"
                  && rect.width > 0
                  && rect.height > 0
                  && image.complete
                  && image.naturalWidth === 0;
              })
              .map((image) => image.getAttribute("src"))
          };
        }, SAVE_KEY);
        expect(recovered.currentRound, `${viewport.label} Round ${round} ${key} round`).toBe(round);
        expect(recovered.moves, `${viewport.label} Round ${round} ${key} moves`).toBe([6, 9, 8][round - 1]);
        expect(recovered.counts, `${viewport.label} Round ${round} ${key} counts`).toEqual([0, 0, 0, 0, 0, 0]);
        expect(recovered.coins, `${viewport.label} Round ${round} ${key} coins`).toBe(naturalFailureState.coins);
        expect(recovered.roundOneRestored, `${viewport.label} Round ${round} ${key} R1 restore`).toBe(round > 1);
        expect(
          recovered.roundTwoGreenhouseUpgraded,
          `${viewport.label} Round ${round} ${key} R2 upgrade`
        ).toBe(round > 2);
        expect(recovered.tiles, `${viewport.label} Round ${round} ${key} tiles`).toBe(64);
        expect(recovered.rows, `${viewport.label} Round ${round} ${key} rows`).toBe(8);
        expect(recovered.tabStops, `${viewport.label} Round ${round} ${key} tab stop`).toBe(1);
        expect(recovered.focusedTile, `${viewport.label} Round ${round} ${key} focus`).toBe(true);
        expect(recovered.overflowX, `${viewport.label} Round ${round} ${key} overflow`).toBe(false);
        expect(recovered.brokenImages, `${viewport.label} Round ${round} ${key} images`).toEqual([]);
      };

      await page.keyboard.press("Enter");
      await assertRecoveredRound("Enter");

      await page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        state.moves = 0;
        state.counts = [0, 0, 0, 0, 0, 0];
        state.roundComplete = false;
        localStorage.setItem(key, JSON.stringify(state));
      }, SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      await expect(retry).toBeVisible();
      await expect(retry).toBeFocused();
      await page.keyboard.press("Space");
      await assertRecoveredRound("Space");

      expect(runtimeErrors, `${viewport.label} Round ${round} runtime errors`).toEqual([]);
      await context.close();
    }
  });
}

test("short desktop keeps the full altar and replay Help in the first viewport", async ({ browser }) => {
  const viewport = VIEWPORTS[0];
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto(`${BASE_URL}?short-desktop=fresh`, { waitUntil: "networkidle" });
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialSkipBtn")).toBeVisible();
  await expect(page.locator("#tutorialHelpBtn")).toBeHidden();
  assertActiveViewport(await activeViewportReport(page), viewport, "fresh desktop tutorial");

  await page.locator("#tutorialSkipBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  await expect(page.locator("#tutorialHelpBtn")).toBeVisible();
  await expect(page.locator("#tutorialHelpBtn")).toBeEnabled();
  const skipped = await activeViewportReport(page);
  assertActiveViewport(skipped, viewport, "post-Skip desktop");
  expect(skipped.helpTop, "Help begins inside first viewport").toBeGreaterThanOrEqual(0);
  expect(skipped.helpBottom, "Help ends inside first viewport").toBeLessThanOrEqual(viewport.height - 4);

  await page.locator("#tutorialHelpBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialCopy")).toHaveText("Swap the glowing flowers.");
  assertActiveViewport(await activeViewportReport(page), viewport, "desktop replay tutorial");

  expect(runtimeErrors, "fresh desktop runtime errors").toEqual([]);
  await context.close();
});

for (const viewport of VIEWPORTS) {
  test(`active first-three altars stay complete in the first viewport on ${viewport.label}`, async ({ browser }) => {
    for (const fixture of ACTIVE_VIEWPORT_CASES) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();
      await page.addInitScript(({ key, state }) => {
        localStorage.setItem(key, JSON.stringify(state));
      }, { key: SAVE_KEY, state: savedState(fixture) });
      await page.goto(`${BASE_URL}?active-viewport=${viewport.label}-${fixture.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#board")).toBeVisible();
      assertActiveViewport(
        await activeViewportReport(page),
        viewport,
        `${viewport.label} ${fixture.label} before Help`
      );

      const help = page.locator("#tutorialHelpBtn");
      const skip = page.locator("#tutorialSkipBtn");
      await expect(help).toBeVisible();
      await expect(help).toBeEnabled();
      await help.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("#tutorialPanel")).toBeVisible();
      await expect(page.locator("#tutorialCopy")).toHaveText(fixture.tutorialCopy);
      await expect(help).toBeHidden();
      await expect(skip).toBeVisible();
      await expect(skip).toBeFocused();
      assertActiveViewport(
        await activeViewportReport(page),
        viewport,
        `${viewport.label} ${fixture.label} during Help replay`
      );
      if (fixture.label === "r3-active") {
        await page.screenshot({
          path: `work/help-replay-${viewport.label}-r3.png`,
          fullPage: true
        });
      }

      await page.keyboard.press("Enter");
      await expect(page.locator("#tutorialPanel")).toBeHidden();
      await expect(help).toBeVisible();
      await expect(help).toBeEnabled();
      await expect(help).toBeFocused();
      assertActiveViewport(
        await activeViewportReport(page),
        viewport,
        `${viewport.label} ${fixture.label} after replay Skip`
      );
      await context.close();
    }
  });
}
