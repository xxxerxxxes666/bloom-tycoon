const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

test.setTimeout(120000);

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

async function resetPage(page, suffix) {
  await page.goto(`${BASE_URL}?${suffix}&bloomReview=1`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function clickGuidedSwap(page) {
  const hints = page.locator(".tile.idle-hint");
  await page.waitForFunction((key) => {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const payoff = document.querySelector("#roundOneRestoration");
    return saved.roundComplete === true
      || (payoff && getComputedStyle(payoff).display !== "none")
      || document.querySelectorAll(".tile.idle-hint").length === 2;
  }, SAVE_KEY, { timeout: 5000 });
  if (await hints.count() !== 2) {
    return false;
  }
  const pair = await hints.evaluateAll((tiles) => tiles.slice(0, 2).map((tile) => ({
    x: tile.dataset.x,
    y: tile.dataset.y
  })));
  expect(pair).toHaveLength(2);
  await page.evaluate((pair) => {
    pair.forEach(({ x, y }) => {
      document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`)?.click();
    });
  }, pair);
  await page.waitForTimeout(1400);
  return true;
}

async function clickGuidedSwapNoWait(page) {
  const hints = page.locator(".tile.idle-hint");
  await expect(hints).toHaveCount(2, { timeout: 5000 });
  const pair = await hints.evaluateAll((tiles) => tiles.slice(0, 2).map((tile) => ({
    x: tile.dataset.x,
    y: tile.dataset.y
  })));
  expect(pair).toHaveLength(2);
  await page.evaluate((pair) => {
    pair.forEach(({ x, y }) => {
      document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`)?.click();
    });
  }, pair);
}

async function clickGuidedSwapAndSampleFlight(page) {
  const hints = page.locator(".tile.idle-hint");
  await expect(hints).toHaveCount(2, { timeout: 5000 });
  const pair = await hints.evaluateAll((tiles) => tiles.slice(0, 2).map((tile) => ({
    x: tile.dataset.x,
    y: tile.dataset.y
  })));
  expect(pair).toHaveLength(2);
  await page.evaluate((pair) => {
    pair.forEach(({ x, y }) => {
      document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`)?.click();
    });
  }, pair);
  await page.waitForFunction(() => document.querySelector(".objective-flight"), null, { timeout: 2500 });
  const landing = await page.evaluate(() => {
    const flight = document.querySelector(".objective-flight");
    const animation = flight?.getAnimations?.()[0];
    const finalFrame = animation?.effect?.getKeyframes?.().at(-1);
    const transform = finalFrame?.transform || "";
    const match = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(transform);
    const startLeft = Number.parseFloat(flight?.style.left || "0");
    const startTop = Number.parseFloat(flight?.style.top || "0");
    const landingX = startLeft + 13 + (match ? Number(match[1]) : 0);
    const landingY = startTop + 13 + (match ? Number(match[2]) : 0);
    const assembly = document.querySelector("#liveBouquetAssembly")?.getBoundingClientRect();
    const bloomRects = Array.from(document.querySelectorAll("#liveBouquetAssembly .live-bouquet-ingredient"))
      .map((node) => node.getBoundingClientRect());
    const inside = (rect, pad = 0) => Boolean(rect
      && landingX >= rect.left - pad
      && landingX <= rect.right + pad
      && landingY >= rect.top - pad
      && landingY <= rect.bottom + pad);
    return {
      landingX,
      landingY,
      inAssembly: inside(assembly, 2),
      inBloom: bloomRects.some((rect) => inside(rect, 8)),
      assemblyWidth: assembly?.width || 0,
      assemblyHeight: assembly?.height || 0
    };
  });
  await page.waitForFunction(() => (
    document.querySelectorAll(".objective-flight, .bouquet-bind-seal").length === 0
  ), null, { timeout: 2500 });
  await page.waitForTimeout(450);
  return landing;
}

async function activeBouquetAssemblyState(page) {
  return page.evaluate(() => {
    const assembly = document.querySelector("#liveBouquetAssembly");
    const rect = assembly?.getBoundingClientRect();
    const bindingStyle = assembly ? getComputedStyle(assembly, "::before") : null;
    const vineStyle = assembly ? getComputedStyle(assembly, "::after") : null;
    const ingredients = Array.from(document.querySelectorAll("#liveBouquetAssembly .live-bouquet-ingredient"))
      .map((ingredient) => {
        const style = getComputedStyle(ingredient);
        const rect = ingredient.getBoundingClientRect();
        const image = ingredient.querySelector("img");
        const imageRect = image?.getBoundingClientRect();
        return {
          flowerId: Number(ingredient.dataset.flowerId),
          progress: ingredient.dataset.progress,
          slotProgress: Number(ingredient.dataset.slotProgress || 0),
          filled: ingredient.dataset.filled === "true",
          receiver: ingredient.dataset.receiver === "true",
          opacity: Number(style.opacity),
          transform: style.transform,
          width: rect.width,
          height: rect.height,
          imageWidth: imageRect?.width || 0,
          imageHeight: imageRect?.height || 0,
          imageOpacity: Number(getComputedStyle(ingredient.querySelector(".icon-wrap")).opacity),
          image: {
            src: image?.getAttribute("src") || "",
            complete: image?.complete || false,
            naturalWidth: image?.naturalWidth || 0,
            naturalHeight: image?.naturalHeight || 0
          }
        };
      });
    const liveComposition = ingredients.map((ingredient) => ingredient.flowerId);
    const board = document.querySelector(".board")?.getBoundingClientRect();
    return {
      progress: assembly?.dataset.progress || "",
      complete: assembly?.dataset.assemblyComplete || "",
      state: assembly?.dataset.assemblyState || "",
      round: assembly?.dataset.round || "",
      width: rect?.width || 0,
      height: rect?.height || 0,
      bindingWidth: Number.parseFloat(bindingStyle?.width || "0"),
      bindingHeight: Number.parseFloat(bindingStyle?.height || "0"),
      vineWidth: Number.parseFloat(vineStyle?.width || "0"),
      vineHeight: Number.parseFloat(vineStyle?.height || "0"),
      ingredients,
      liveComposition,
      stems: document.querySelectorAll("#liveBouquetAssembly .live-bouquet-stem").length,
      leaves: document.querySelectorAll("#liveBouquetAssembly .live-bouquet-leaf").length,
      boardBottom: board?.bottom || 0,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1
    };
  });
}

async function sampleElementVisual(page, selector) {
  return page.evaluate((targetSelector) => {
    const node = document.querySelector(targetSelector);
    const rect = node?.getBoundingClientRect();
    const images = Array.from(node?.querySelectorAll("img") || []);
    const samples = images.map((image) => {
      const canvas = document.createElement("canvas");
      const width = Math.max(1, image.naturalWidth || 1);
      const height = Math.max(1, image.naturalHeight || 1);
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      let coloredPixels = 0;
      let sampledPixels = 0;
      try {
        context.drawImage(image, 0, 0, width, height);
        const data = context.getImageData(0, 0, width, height).data;
        for (let index = 0; index < data.length; index += 16) {
          const alpha = data[index + 3];
          if (alpha < 18) continue;
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          if (Math.max(red, green, blue) - Math.min(red, green, blue) > 12 && red + green + blue > 45) {
            coloredPixels += 1;
          }
          sampledPixels += 1;
        }
      } catch (error) {
        return { src: image.getAttribute("src") || "", sampledPixels: 0, coloredPixels: 0, error: error.message };
      }
      return {
        src: image.getAttribute("src") || "",
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        sampledPixels,
        coloredPixels
      };
    });
    return {
      width: rect?.width || 0,
      height: rect?.height || 0,
      samples
    };
  }, selector);
}

async function completeRoundWithReviewKey(page) {
  await expect.poll(async () => page.evaluate(() => window.__bloomReviewHooksEnabled === true)).toBe(true);
  await page.locator("body").click({ position: { x: 12, y: 12 } });
  await page.keyboard.press("n");
  await expect(page.locator("#roundOneRestoration")).toBeVisible({ timeout: 5000 });
}

async function visibleContract(page) {
  return page.evaluate(() => {
    const isVisible = (node) => {
      if (!node) return false;
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const visible = (selector) => Array.from(document.querySelectorAll(selector)).filter(isVisible);
    const visibleButtons = visible("#roundOneRestoration button").map((button) => button.textContent.trim());
    const visibleNonBoardButtons = Array.from(document.querySelectorAll("button"))
      .filter((button) => isVisible(button) && !button.closest(".board"))
      .map((button) => button.textContent.trim())
      .filter(Boolean);
    const visibleRetired = [
      ".restoration-xp-preview",
      ".greenhouse-payoff-ladder",
      ".restoration-step",
      ".reward-choice-panel",
      ".ceremony-rewards",
      ".ceremony-next-target",
      ".flowerpedia-ledger",
      ".chapter-progress",
      ".chest-access",
      ".booster-panel",
      ".sacrifice-panel",
      ".bouquet-path",
      ".path-ledger-drawer",
      ".left",
      ".active-greenhouse-stage",
      ".bouquet-bind-seal",
      "#roundCeremony",
      "#renewBtn"
    ].filter((selector) => visible(selector).length);
    const brokenImages = Array.from(document.images)
      .filter((image) => isVisible(image) && image.complete && image.naturalWidth === 0)
      .map((image) => image.getAttribute("src"));
    return {
      bodyClass: document.body.className,
      assemblyReady: document.querySelector("#roundOneRestoration")?.dataset.assemblyReady || "",
      trophies: visible(".bouquet-trophy").length,
      craftedBouquets: visible(".crafted-bouquet").length,
      craftedBlooms: visible(".crafted-flower-bloom").length,
      craftedStems: visible(".crafted-stem").length,
      craftedLeaves: visible(".crafted-leaf").length,
      craftedBloomCount: document.querySelector(".crafted-bouquet")?.dataset.craftedBloomCount || "",
      craftedTargetCounts: document.querySelector(".crafted-bouquet")?.dataset.craftedTargetCounts || "",
      craftedComposition: Array.from(document.querySelectorAll(".crafted-flower-bloom"))
        .map((node) => Number(node.dataset.craftedFlower)),
      craftedFlowerNames: Array.from(document.querySelectorAll(".crafted-flower-bloom"))
        .map((node) => node.dataset.flowerName || ""),
      craftedBloomSlots: Array.from(document.querySelectorAll(".crafted-flower-bloom"))
        .map((node) => Number(node.dataset.craftedSlot)),
      craftedBloomSizes: Array.from(document.querySelectorAll(".crafted-flower-bloom"))
        .map((node) => {
          const rect = node.getBoundingClientRect();
          return Math.round(Math.min(rect.width, rect.height));
        }),
      craftedImageSources: Array.from(document.querySelectorAll(".crafted-flower-bloom img"))
        .map((image) => ({
          src: image.getAttribute("src") || "",
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          complete: image.complete
        })),
      craftedBinding: (() => {
        const rect = document.querySelector(".crafted-binding")?.getBoundingClientRect();
        return rect ? { width: Math.round(rect.width), height: Math.round(rect.height) } : { width: 0, height: 0 };
      })(),
      ingredientTokenHeights: visible(".bouquet-payoff-token")
        .map((node) => Math.round(node.getBoundingClientRect().height)),
      payoffTokenLayout: (() => {
        const trophy = document.querySelector("#bouquetTrophy");
        const bonus = document.querySelector(".bouquet-trophy-bonus");
        const trophyRect = trophy?.getBoundingClientRect();
        const bonusRect = bonus?.getBoundingClientRect();
        const bonusStyle = bonus ? getComputedStyle(bonus) : null;
        return {
          bonus: bonusRect ? {
            left: bonusRect.left,
            right: bonusRect.right,
            width: bonusRect.width,
            clientWidth: bonus.clientWidth,
            scrollWidth: bonus.scrollWidth,
            display: bonusStyle.display,
            minWidth: bonusStyle.minWidth,
            gridTemplateColumns: bonusStyle.gridTemplateColumns,
            contained: Boolean(
              trophyRect
              && bonusRect.left >= trophyRect.left - 1
              && bonusRect.right <= trophyRect.right + 1
            )
          } : null,
          tokens: visible(".bouquet-payoff-token").map((node) => {
            const bounds = node.getBoundingClientRect();
            return {
              text: node.textContent.trim(),
              left: bounds.left,
              right: bounds.right,
              width: bounds.width,
              clientWidth: node.clientWidth,
              scrollWidth: node.scrollWidth,
              contained: Boolean(
                trophyRect
                && bounds.left >= trophyRect.left - 1
                && bounds.right <= trophyRect.right + 1
              ),
              textFits: node.scrollWidth <= node.clientWidth + 1
            };
          })
        };
      })(),
      trophyState: document.querySelector("#bouquetTrophy")?.dataset.assemblyState || "",
      liveAssemblies: visible("#liveBouquetAssembly").length,
      scenes: visible(".restoration-scene").length,
      transactions: visible(".payoff-transaction").length,
      transactionText: document.querySelector("#payoffTransaction")?.textContent.trim() || "",
      trophyKicker: document.querySelector(".bouquet-trophy-kicker")?.textContent.trim() || "",
      trophyName: document.querySelector(".bouquet-trophy-name")?.textContent.trim() || "",
      coins: JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}").coins ?? 0,
      board: visible(".board").length,
      controls: visible(".controls").length,
      objective: visible(".objective").length,
      tutorialVisible: visible("#tutorialPanel").length === 1,
      tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      buttons: visibleButtons,
      nonBoardButtons: visibleNonBoardButtons,
      retired: visibleRetired,
      transientFlights: visible(".objective-flight, .bouquet-bind-seal, .greenhouse-intake-flight").length,
      text: document.body.innerText,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      brokenImages
    };
  });
}

async function expectCeremony(page, expectedButton, screenshotPath, expectedGuide = "") {
  await page.waitForTimeout(250);
  const waitingForBouquet = await visibleContract(page);
  if (waitingForBouquet.assemblyReady === "false") {
    expect(waitingForBouquet.buttons, "payoff action waits for the bouquet object").toEqual([]);
    expect(waitingForBouquet.trophyState).toBe("forming");
  }
  const primaryButton = page.locator("#roundOneRestoration button:not([hidden])");
  await expect(primaryButton).toBeVisible({ timeout: 1800 });
  await expect(primaryButton).toBeEnabled({ timeout: 1800 });
  const contract = await visibleContract(page);
  expect(contract.trophies, "one visible bouquet trophy").toBe(1);
  expect(contract.craftedBouquets, "one crafted bouquet object").toBe(1);
  expect(contract.craftedBlooms, "six overlapping bouquet bloom heads").toBe(6);
  expect(contract.craftedStems, "six bouquet stems").toBe(6);
  expect(contract.craftedLeaves, "six bouquet leaves").toBe(6);
  expect(contract.craftedBloomCount).toBe("6");
  const expectedComposition = contract.trophyName.includes("Moonlit Wreath")
    ? [2, 4, 5, 2, 4, 5]
    : contract.trophyName.includes("Bloodroot Compact")
      ? [3, 0, 3, 0, 3, 0]
      : [5, 1, 5, 1, 5, 1];
  const expectedCounts = contract.trophyName.includes("Moonlit Wreath")
    ? "2:10,4:9,5:7"
    : contract.trophyName.includes("Bloodroot Compact")
      ? "3:14,0:13"
      : "5:8,1:6";
  expect(contract.craftedComposition, "ceremony uses the exact six-slot target ingredient sequence").toEqual(expectedComposition);
  expect(contract.craftedTargetCounts, "ceremony carries authoritative objective counts").toBe(expectedCounts);
  expect(contract.craftedBloomSlots, "six bouquet slots are unique and ordered").toEqual([0, 1, 2, 3, 4, 5]);
  expect(new Set(contract.craftedFlowerNames).size, "both target flower names render in trophy").toBeGreaterThanOrEqual(2);
  expect(Math.min(...contract.craftedBloomSizes), "flower heads are materially larger than labels and binding").toBeGreaterThanOrEqual(58);
  expect(Math.min(...contract.craftedBloomSizes), "flower heads dominate the hand binding").toBeGreaterThan(contract.craftedBinding.height * 2);
  expect(Math.min(...contract.craftedBloomSizes), "flower heads dominate ingredient labels").toBeGreaterThan(
    Math.max(...contract.ingredientTokenHeights, 0) * 2
  );
  expect(contract.payoffTokenLayout.bonus, "ingredient row remains measurable").toMatchObject({
    display: "grid",
    minWidth: "0px",
    contained: true
  });
  expect(
    contract.payoffTokenLayout.bonus.scrollWidth,
    "ingredient row does not overflow its own trophy track"
  ).toBeLessThanOrEqual(contract.payoffTokenLayout.bonus.clientWidth + 1);
  expect(
    contract.payoffTokenLayout.tokens.every((token) => token.contained),
    JSON.stringify(contract.payoffTokenLayout.tokens)
  ).toBe(true);
  expect(
    contract.payoffTokenLayout.tokens.every((token) => token.textFits),
    JSON.stringify(contract.payoffTokenLayout.tokens)
  ).toBe(true);
  expect(contract.craftedImageSources.every((image) => image.complete && image.naturalWidth >= 48 && image.naturalHeight >= 48)).toBe(true);
  if (contract.trophyName.includes("First Bouquet")) {
    expect(contract.craftedImageSources.map((image) => image.src)).toEqual([
      "../assets/tiles/96/crimson_rose_rune.png",
      "../assets/tiles/96/bone_white_thorn_star.png",
      "../assets/tiles/96/crimson_rose_rune.png",
      "../assets/tiles/96/bone_white_thorn_star.png",
      "../assets/tiles/96/crimson_rose_rune.png",
      "../assets/tiles/96/bone_white_thorn_star.png"
    ]);
  }
  expect(contract.trophyState, "bouquet presentation is ready").toBe("assembled");
  expect(contract.scenes, "one visible greenhouse scene").toBe(1);
  expect(contract.transactions, "one visible transaction line").toBe(1);
  expect(contract.transactionText, "no raw ledger-arrow accounting").not.toContain("->");
  if (expectedButton.includes("Restore Greenhouse")) {
    expect(contract.transactionText).toBe("Earned 120 coins. Restore costs 100.");
    expect(contract.trophyKicker).toBe("Bouquet Bound");
    expect(contract.coins).toBe(120);
  }
  if (expectedButton.includes("Next Order")) {
    expect(contract.transactionText).toMatch(/coins remain\.|Play Again reinvests the remaining \d+ coins\.|spent$/);
    if (contract.text.includes("Greenhouse Restored")) {
      expect(contract.transactionText).toBe("Restored for 100. 20 coins remain.");
      expect(contract.trophyKicker).toBe("Greenhouse Relit");
      expect(contract.coins).toBe(20);
    }
  }
  expect(contract.buttons, "one visible primary action").toHaveLength(1);
  expect(contract.buttons[0]).toContain(expectedButton);
  expect(contract.nonBoardButtons, "one visible non-board action during ceremony").toHaveLength(1);
  expect(contract.nonBoardButtons[0]).toContain(expectedButton);
  if (expectedGuide) {
    expect(contract.tutorialVisible, "terse payoff guidance remains visible").toBe(true);
    expect(contract.tutorialCopy).toBe(expectedGuide);
  }
  expect(contract.board, "board hidden during ceremony").toBe(0);
  expect(contract.controls, "controls hidden during ceremony").toBe(0);
  expect(contract.objective, "objective hidden during ceremony").toBe(0);
  expect(contract.retired, "retired ceremony UI hidden").toEqual([]);
  expect(contract.transientFlights, "target-flight feedback cleans up").toBe(0);
  expect(contract.text).not.toMatch(/Path \/ Ledger|Flowerpedia|Chapter|Chest|Storage|Reward Choice|Bouquet Streak|Greenhouse \+\d+ XP/);
  expect(contract.overflowX, "no horizontal overflow").toBe(false);
  expect(contract.brokenImages, "no visible broken images").toEqual([]);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return contract;
}

async function expectActiveBoard(page) {
  await expect(page.locator(".tile")).toHaveCount(64, { timeout: 5000 });
  await expect(page.locator(".tile[tabindex='0']")).toHaveCount(1);
  await expect(page.locator(".tile[tabindex='0']")).toBeFocused();
  const active = await page.evaluate(() => {
    const board = document.querySelector(".board");
    const rect = board?.getBoundingClientRect();
    const style = board ? getComputedStyle(board) : null;
    return {
      boardVisible: Boolean(board && style.display !== "none" && rect.width > 0 && rect.height > 0),
      tiles: document.querySelectorAll(".tile").length,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1
    };
  });
  expect(active).toMatchObject({ boardVisible: true, tiles: 64, overflowX: false });
}

async function expectGreenhouseOwned(page, expected) {
  const state = await page.evaluate(() => ({
    stage: document.querySelector("#heroRestorationDial")?.dataset.restorationDialStage || "",
    ownedStage: document.querySelector("#heroRestorationDial")?.dataset.ownedStage || "",
    pct: document.querySelector("#heroRestorationDial")?.dataset.restorationDialPct || "",
    text: document.querySelector("#heroRestorationDial")?.textContent.replace(/\s+/g, " ").trim() || "",
    activeStageKey: document.querySelector("#activeGreenhouseStage")?.dataset.stageKey || "",
    activeStageArt: document.querySelector("#activeGreenhouseStageArt")?.getAttribute("src") || "",
    goalCounts: document.querySelectorAll(".greenhouse-restoration-dial .restoration-goal-count").length
  }));
  expect(state.stage).toBe(expected.stage);
  expect(state.ownedStage).toBe(String(expected.ownedStage));
  expect(state.pct).toBe(String(expected.pct));
  expect(state.activeStageKey).toBe(expected.stage);
  expect(state.activeStageArt).toContain(expected.art);
  expect(state.text).toContain(expected.note);
  expect(state.goalCounts).toBe(0);
}

async function expectCleanReplayBoard(page) {
  await expectActiveBoard(page);
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  await expect(page.locator("#tutorialHelpBtn")).toBeVisible();
  await expect(page.locator("#tutorialHelpBtn")).toHaveAttribute("aria-label", "Replay Tutorial");
  const buttons = await page.evaluate(() => {
    const visible = (node) => {
      if (!node) return false;
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    return Array.from(document.querySelectorAll("button"))
      .filter((button) => visible(button) && !button.closest(".board"))
      .map((button) => button.textContent.trim())
      .filter(Boolean);
  });
  expect(buttons.length, "clean active board keeps the non-board action cap").toBeLessThanOrEqual(2);
  expect(buttons).toContain("?");
  const mobileFooter = await page.evaluate(() => {
    const visible = (node) => {
      if (!node) return false;
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    return {
      isMobile: window.innerWidth <= 760,
      plinth: visible(document.querySelector("#mobileGreenhousePlinth")),
      log: visible(document.querySelector("#ritualLog"))
    };
  });
  if (mobileFooter.isMobile) {
    expect(mobileFooter.plinth, "mobile active play has no greenhouse footer").toBe(false);
    expect(mobileFooter.log, "mobile active play has no ritual log footer").toBe(false);
  }
}

async function clickPrimary(page) {
  await expect(page.locator("#roundOneRestoration button:not([hidden])")).toBeFocused();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(450);
}

async function assertReloadKeeps(page, expectedButton, screenshotPath, expectedGuide = "") {
  await page.reload({ waitUntil: "networkidle" });
  await expectCeremony(page, expectedButton, screenshotPath, expectedGuide);
  await expect(page.locator("#roundOneRestoration button:not([hidden])")).toBeFocused();
}

async function forceRoundTwoFailure(page) {
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.currentRound = 2;
    state.roundComplete = false;
    state.roundOneRestored = true;
    state.roundTwoGreenhouseUpgraded = false;
    state.moves = 0;
    state.counts = [0, 0, 0, 0, 0, 0];
    state.clearedCursedThorns = 0;
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#renewBtn.visible")).toHaveText("Retry Bouquet");
  await expectGreenhouseOwned(page, {
    stage: "restored",
    ownedStage: 1,
    pct: 33,
    art: "first_greenhouse_restored.jpg",
    note: "Owned 1/3 · Next: Upgrade Greenhouse"
  });
  await page.locator("#renewBtn.visible").click();
  await expectActiveBoard(page);
  await expectGreenhouseOwned(page, {
    stage: "restored",
    ownedStage: 1,
    pct: 33,
    art: "first_greenhouse_restored.jpg",
    note: "Owned 1/3 · Next: Upgrade Greenhouse"
  });
}

async function runJourney(page, label, includeRetry) {
  await resetPage(page, `pass2_${label}`);
  const viewport = page.viewportSize();
  const compactReceiver = label.includes("mobile390")
    || (viewport && viewport.width > 760 && viewport.height <= 760);
  const initialAssembly = await activeBouquetAssemblyState(page);
  expect(initialAssembly.progress).toBe("0/14");
  expect(initialAssembly.state).toBe("fresh");
  expect(initialAssembly.width, "fresh live bouquet is readable in the progress strip").toBeGreaterThanOrEqual(compactReceiver ? 124 : 146);
  expect(initialAssembly.height, "fresh live bouquet has bouquet silhouette height").toBeGreaterThanOrEqual(compactReceiver ? 54 : 70);
  expect(initialAssembly.bindingWidth, "fresh live bouquet shows a physical binding").toBeGreaterThanOrEqual(compactReceiver ? 60 : 64);
  expect(initialAssembly.vineWidth, "fresh live bouquet shows empty vine slots").toBeGreaterThanOrEqual(compactReceiver ? 74 : 84);
  expect(initialAssembly.ingredients).toHaveLength(6);
  expect(initialAssembly.stems).toBe(6);
  expect(initialAssembly.leaves).toBe(6);
  expect(initialAssembly.ingredients.map((ingredient) => ingredient.flowerId)).toEqual([5, 1, 5, 1, 5, 1]);
  expect(initialAssembly.ingredients.every((ingredient) => ingredient.filled === false)).toBe(true);
  expect(initialAssembly.ingredients.every((ingredient) => ingredient.image.complete && ingredient.image.naturalWidth >= 48)).toBe(true);
  expect(Math.min(...initialAssembly.ingredients.map((ingredient) => ingredient.imageWidth))).toBeGreaterThanOrEqual(compactReceiver ? 18 : 24);
  const initialVisual = await sampleElementVisual(page, "#liveBouquetAssembly");
  expect(initialVisual.samples).toHaveLength(6);
  expect(initialVisual.samples.every((sample) => sample.complete && sample.naturalWidth >= 48 && sample.coloredPixels > 20)).toBe(true);
  expect(initialAssembly.overflowX).toBe(false);
  if (label.includes("mobile390")) {
    expect(initialAssembly.boardBottom, "mobile active board stays in viewport with live bouquet").toBeLessThanOrEqual(844);
  }
  await page.screenshot({ path: `work/live-bouquet-${label}-empty.png`, fullPage: true });
  await page.reload({ waitUntil: "networkidle" });
  const reloadedEmptyAssembly = await activeBouquetAssemblyState(page);
  expect(reloadedEmptyAssembly.progress).toBe(initialAssembly.progress);
  expect(reloadedEmptyAssembly.ingredients).toHaveLength(6);
  expect(reloadedEmptyAssembly.stems).toBe(6);
  expect(reloadedEmptyAssembly.leaves).toBe(6);
  const landing = await clickGuidedSwapAndSampleFlight(page);
  expect(landing.inAssembly, "positive target flight lands inside the live bouquet assembly").toBe(true);
  expect(landing.inBloom, "positive target flight lands on a visible bouquet bloom target").toBe(true);
  const firstAssembly = await activeBouquetAssemblyState(page);
  expect(firstAssembly.progress).not.toBe(initialAssembly.progress);
  expect(["mid", "nearly", "complete"]).toContain(firstAssembly.state);
  expect(firstAssembly.ingredients.some((ingredient) => ingredient.slotProgress > 0)).toBe(true);
  expect(firstAssembly.ingredients.some((ingredient) => ingredient.flowerId === 5 && ingredient.filled)).toBe(true);
  expect(Math.max(...firstAssembly.ingredients
    .filter((ingredient) => ingredient.flowerId === 5 && ingredient.filled)
    .map((ingredient) => ingredient.imageWidth))).toBeGreaterThanOrEqual(compactReceiver ? 30 : 40);
  expect(Math.max(...firstAssembly.ingredients
    .filter((ingredient) => ingredient.flowerId === 5)
    .map((ingredient) => ingredient.imageOpacity))).toBeGreaterThan(.75);
  expect(firstAssembly.ingredients.filter((ingredient) => ingredient.receiver)).toHaveLength(2);
  expect(firstAssembly.ingredients.map((ingredient) => ingredient.flowerId)).toEqual([5, 1, 5, 1, 5, 1]);
  expect(firstAssembly.width).toBeGreaterThanOrEqual(initialAssembly.width - 1);
  expect(firstAssembly.height).toBeGreaterThanOrEqual(initialAssembly.height - 1);
  await page.screenshot({ path: `work/live-bouquet-${label}-first-harvest.png`, fullPage: true });
  await page.reload({ waitUntil: "networkidle" });
  const partialReloadAssembly = await activeBouquetAssemblyState(page);
  expect(partialReloadAssembly.progress).toBe(firstAssembly.progress);
  expect(partialReloadAssembly.ingredients.filter((ingredient) => ingredient.filled)).toHaveLength(
    firstAssembly.ingredients.filter((ingredient) => ingredient.filled).length
  );
  expect(partialReloadAssembly.ingredients).toHaveLength(6);
  let secondAssembly = partialReloadAssembly;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const speciesWithProgress = new Set(secondAssembly.ingredients
      .filter((ingredient) => ingredient.slotProgress > 0)
      .map((ingredient) => ingredient.flowerId));
    if (speciesWithProgress.has(5) && speciesWithProgress.has(1)) {
      break;
    }
    await clickGuidedSwap(page);
    secondAssembly = await activeBouquetAssemblyState(page);
  }
  expect(secondAssembly.progress).not.toBe(firstAssembly.progress);
  expect(Math.max(...secondAssembly.ingredients.map((ingredient) => ingredient.slotProgress)))
    .toBeGreaterThanOrEqual(Math.max(...firstAssembly.ingredients.map((ingredient) => ingredient.slotProgress)));
  const speciesWithProgress = new Set(secondAssembly.ingredients
    .filter((ingredient) => ingredient.slotProgress > 0)
    .map((ingredient) => ingredient.flowerId));
  expect(speciesWithProgress.has(5), "mid-progress contains earned Thorn Rose heads").toBe(true);
  expect(speciesWithProgress.has(1), "mid-progress contains earned Bone Star heads").toBe(true);
  await page.screenshot({ path: `work/live-bouquet-${label}-mid-progress.png`, fullPage: true });
  const liveCompositionBeforeComplete = secondAssembly.liveComposition;
  await completeRoundWithReviewKey(page);
  const fullPreCeremonyAssembly = await activeBouquetAssemblyState(page);
  expect(fullPreCeremonyAssembly.complete).toBe("true");
  expect(fullPreCeremonyAssembly.liveComposition).toEqual(liveCompositionBeforeComplete);
  await page.screenshot({ path: `work/live-bouquet-${label}-full-pre-ceremony.png`, fullPage: true });
  const roundOneCeremony = await expectCeremony(page, "Restore Greenhouse", `work/pass2-${label}-round1-pending.png`, "Coins restore the greenhouse.");
  expect(roundOneCeremony.craftedComposition).toEqual(fullPreCeremonyAssembly.liveComposition);
  await assertReloadKeeps(page, "Restore Greenhouse", `work/pass2-${label}-round1-pending-reload.png`, "Coins restore the greenhouse.");
  await clickPrimary(page);
  await expectCeremony(page, "Next Order", `work/pass2-${label}-round1-restored.png`, "Tap Next Order.");
  await assertReloadKeeps(page, "Next Order", `work/pass2-${label}-round1-restored-reload.png`, "Tap Next Order.");
  await clickPrimary(page);
  await expectActiveBoard(page);

  if (includeRetry) {
    await forceRoundTwoFailure(page);
  }

  await completeRoundWithReviewKey(page);
  await expectCeremony(page, "Upgrade Greenhouse", `work/pass2-${label}-round2-pending.png`);
  await assertReloadKeeps(page, "Upgrade Greenhouse", `work/pass2-${label}-round2-pending-reload.png`);
  await clickPrimary(page);
  await expectCeremony(page, "Next Order", `work/pass2-${label}-round2-upgraded.png`);
  await assertReloadKeeps(page, "Next Order", `work/pass2-${label}-round2-upgraded-reload.png`);
  await clickPrimary(page);
  await expectCleanReplayBoard(page);
  await expect(page.locator(".moves-counter")).toContainText("Moves 8");
  await expect(page.locator("#firstSwapCue")).toHaveText("Match Bloodroot and Sol Rot.");
  await expect(page.locator("#firstSwapCue")).not.toContainText("Nightshade");
  await expect(page.locator("#ritualLog")).toContainText("Final Order: Match Bloodroot and Sol Rot.");
  await expect(page.locator("#ritualLog")).not.toContainText("blooms under the moonlit greenhouse upgrade");

  await completeRoundWithReviewKey(page);
  await expectCeremony(page, "Raise Conservatory", `work/pass2-${label}-round3-pending.png`, "Raise Conservatory.");
  await assertReloadKeeps(page, "Raise Conservatory", `work/pass2-${label}-round3-pending-reload.png`, "Raise Conservatory.");
  await clickPrimary(page);
  await expectCeremony(page, "Play Again", `work/pass2-${label}-round3-raised.png`, "Play again.");
  await assertReloadKeeps(page, "Play Again", `work/pass2-${label}-round3-raised-reload.png`, "Play again.");
  await clickPrimary(page);
  await expectCleanReplayBoard(page);
}

test("payoff ceremony contract desktop journey", async ({ page }) => {
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));
  await page.setViewportSize({ width: 1280, height: 720 });
  await runJourney(page, "desktop", true);
  expect(consoleMessages).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("payoff ceremony contract mobile 390x844 journey", async ({ page }) => {
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));
  await page.setViewportSize({ width: 390, height: 844 });
  await runJourney(page, "mobile390", false);
  expect(consoleMessages).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

for (const config of [
  { label: "desktop", viewport: { width: 1280, height: 720 } },
  { label: "mobile390", viewport: { width: 390, height: 844 } }
]) {
  test(`natural Round 1 Black Candle handoff binds bouquet before restore on ${config.label}`, async ({ page }) => {
    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));
    await page.setViewportSize(config.viewport);
    await seedDeterministicMath(page, `fresh-black-candle-${config.label}`);
    await resetPage(page, `binding_natural_${config.label}`);

    let observedArmedCandle = false;
    let observedLineHold = false;
    for (let moveIndex = 0; moveIndex < 8; moveIndex += 1) {
      const stateBefore = await page.evaluate(() => ({
        roundComplete: JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}").roundComplete === true,
        cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
        candleTiles: document.querySelectorAll(".tile.black-candle-vine").length
      }));
      if (stateBefore.roundComplete) break;
      if (stateBefore.cue.includes("Black Candle Vine") || stateBefore.candleTiles > 0) {
        observedArmedCandle = true;
        await page.screenshot({ path: `work/binding-${config.label}-black-candle-armed.png`, fullPage: true });
        await clickGuidedSwapNoWait(page);
        await page.waitForFunction(() => {
          const particle = document.querySelector(".board-particle.line-relic");
          const board = document.querySelector(".board");
          const boardRect = board?.getBoundingClientRect();
          const boardStyle = board ? getComputedStyle(board) : null;
          const lanePreview = document.querySelector(".tile.line-relic-lane-preview, .tile.line-relic-destination, .tile.black-candle-vine");
          return (particle || board?.classList.contains("line-relic-hit") || lanePreview)
            && boardStyle?.display !== "none"
            && boardRect?.width > 0
            && boardRect?.height > 0;
        }, null, { timeout: 2600 });
        const lineHold = await page.evaluate(() => ({
          boardVisible: (() => {
            const board = document.querySelector(".board");
            const rect = board?.getBoundingClientRect();
            const style = board ? getComputedStyle(board) : null;
            return Boolean(style?.display !== "none" && rect?.width > 0 && rect?.height > 0);
          })(),
          particles: document.querySelectorAll(".board-particle.line-relic").length,
          boardLineHit: document.querySelector(".board")?.classList.contains("line-relic-hit") || false,
          lanePreview: document.querySelectorAll(".tile.line-relic-lane-preview, .tile.line-relic-destination, .tile.black-candle-vine").length,
          assemblyReady: document.querySelector("#roundOneRestoration")?.dataset.assemblyReady || "",
          buttons: Array.from(document.querySelectorAll("#roundOneRestoration button"))
            .filter((button) => {
              const rect = button.getBoundingClientRect();
              const style = getComputedStyle(button);
              return !button.hidden
                && style.display !== "none"
                && style.visibility !== "hidden"
                && rect.width > 0
                && rect.height > 0;
            })
            .map((button) => button.textContent.trim())
        }));
        expect(lineHold.boardVisible, "Black Candle line clear is visible before bouquet-only presentation").toBe(true);
        expect(
          lineHold.particles + Number(lineHold.boardLineHit) + lineHold.lanePreview,
          "Black Candle hold renders either the line clear, hit state, or lane preview"
        ).toBeGreaterThan(0);
        expect(lineHold.buttons, "restore is not actionable during the line clear hold").toEqual([]);
        await page.screenshot({ path: `work/binding-${config.label}-final-special-hold.png`, fullPage: true });
        observedLineHold = true;
        await page.waitForTimeout(250);
        const afterLineHold = await page.evaluate(() => ({
          roundComplete: JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}").roundComplete === true,
          assemblyReady: document.querySelector("#roundOneRestoration")?.dataset.assemblyReady || ""
        }));
        if (afterLineHold.roundComplete || afterLineHold.assemblyReady === "false") {
          break;
        }
        await page.waitForTimeout(900);
      } else {
        await clickGuidedSwap(page);
      }
    }

    expect(observedArmedCandle, "natural guided play forms the Black Candle Vine").toBe(true);
    expect(observedLineHold, "natural guided play activates the Black Candle Vine before bouquet binding").toBe(true);
    await expect(page.locator("#roundOneRestoration")).toBeVisible({ timeout: 5000 });
    await page.waitForFunction(() => document.querySelector("#roundOneRestoration")?.dataset.assemblyReady === "false", null, { timeout: 2200 });
    const binding = await visibleContract(page);
    expect(binding.trophyState).toBe("forming");
    expect(binding.buttons, "restore waits until binding resolves").toEqual([]);
    expect(binding.craftedComposition).toEqual([5, 1, 5, 1, 5, 1]);
    expect(binding.craftedTargetCounts).toBe("5:8,1:6");
    await page.screenshot({ path: `work/binding-${config.label}-bouquet-binding.png`, fullPage: true });
    await expectCeremony(page, "Restore Greenhouse", `work/binding-${config.label}-pending-restore.png`, "Coins restore the greenhouse.");
    expect(consoleMessages).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
}

for (const config of [
  { label: "desktop", viewport: { width: 1280, height: 720 }, minWidth: 116, minHeight: 52 },
  { label: "mobile390", viewport: { width: 390, height: 844 }, minWidth: 100, minHeight: 42 }
]) {
  test(`reduced motion presents assembled bouquet and ready restore promptly on ${config.label}`, async ({ page }) => {
    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(config.viewport);
    await resetPage(page, `pass2_reduced_motion_${config.label}`);
    await expectGreenhouseOwned(page, {
      stage: "withered",
      ownedStage: 0,
      pct: 0,
      art: "first_greenhouse_withered.jpg",
      note: "Owned 0/3 · Next: Restore Greenhouse"
    });
    await clickGuidedSwap(page);
    await expectGreenhouseOwned(page, {
      stage: "withered",
      ownedStage: 0,
      pct: 0,
      art: "first_greenhouse_withered.jpg",
      note: "Owned 0/3 · Next: Restore Greenhouse"
    });
    await clickGuidedSwap(page);
    const active = await activeBouquetAssemblyState(page);
    expect(active.ingredients).toHaveLength(6);
    expect(active.width).toBeGreaterThanOrEqual(config.minWidth);
    expect(active.height).toBeGreaterThanOrEqual(config.minHeight);
    await completeRoundWithReviewKey(page);
    await expectGreenhouseOwned(page, {
      stage: "withered",
      ownedStage: 0,
      pct: 0,
      art: "first_greenhouse_withered.jpg",
      note: "Owned 0/3 · Next: Restore Greenhouse"
    });
    await expect(page.locator("#roundOneRestoration button:not([hidden])")).toBeEnabled({ timeout: 700 });
    const contract = await visibleContract(page);
    expect(contract.trophyState).toBe("assembled");
    expect(contract.craftedBouquets).toBe(1);
    expect(contract.craftedBlooms).toBe(6);
    expect(contract.craftedStems).toBe(6);
    expect(contract.buttons).toEqual(["Restore Greenhouse · 100 coins"]);
    expect(contract.coins).toBe(120);
    expect(contract.overflowX).toBe(false);
    expect(contract.brokenImages).toEqual([]);
    await page.screenshot({ path: `work/pass2-reduced-motion-${config.label}-round1-pending.png`, fullPage: true });
    expect(consoleMessages).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
}
