const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const OWNED_REPLAY_SEED_BALANCE = 50;
const ROUND_TARGETS = {
  1: [5, 1],
  2: [2, 4, 5],
  3: [3, 0]
};
const ROUND_NEEDED = {
  1: { 5: 8, 1: 6 },
  2: { 2: 10, 4: 9, 5: 7 },
  3: { 3: 14, 0: 13 }
};

function expectedUnitComposition(targetCounts) {
  const placement = targetCounts.map(([flowerId, needed], targetIndex) => ({
    flowerId, needed, targetIndex, placed: 0
  }));
  const composition = [];
  while (composition.length < targetCounts.reduce((sum, [, needed]) => sum + needed, 0)) {
    const candidate = placement
      .filter((entry) => entry.placed < entry.needed)
      .sort((first, second) => (
        (first.placed / first.needed) - (second.placed / second.needed)
          || first.targetIndex - second.targetIndex
      ))[0];
    composition.push(candidate.flowerId);
    candidate.placed += 1;
  }
  return composition;
}

const ROUND_COMPOSITIONS = [
  expectedUnitComposition([[5, 8], [1, 6]]),
  expectedUnitComposition([[2, 10], [4, 9], [5, 7]]),
  expectedUnitComposition([[3, 14], [0, 13]])
];
const JOURNEY_SEEDS = [
  "altar-rose",
  "amber-vesper",
  "bloodroot-moon",
  "bone-star-vigil",
  "candle-vine",
  "nightshade-glass",
  "sol-rot-dawn",
  "thorn-choir"
];
const GOAL_FOLLOWING_SEEDS = [
  "vesper-thorn",
  "bloodroot-moon",
  "crypt-iris",
  "relic-garden"
];

function ownedReplayTransaction(reward) {
  return `Reward reinvested · ${reward} coins nourished the Conservatory · ${OWNED_REPLAY_SEED_BALANCE} coins kept.`;
}

test.setTimeout(180000);

async function openFresh(page, seedLabel, label) {
  await page.addInitScript((seedLabel) => {
    let seed = 0;
    for (let index = 0; index < seedLabel.length; index += 1) {
      seed = (seed * 31 + seedLabel.charCodeAt(index)) >>> 0;
    }
    Math.random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }, seedLabel);
  await page.goto(`${BASE_URL}?first-three-journey=${label}&seed=${seedLabel}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function journeyState(page) {
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
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
    const visibleRect = (node) => {
      if (!visible(node)) return null;
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
    const visibleTextRect = (node) => {
      if (!visible(node)) return null;
      const range = document.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      range.detach();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
    };
    const tileRows = [...new Set(Array.from(document.querySelectorAll(".tile"))
      .map((tile) => Math.round(tile.getBoundingClientRect().top)))].length;
    const tileAriaRows = new Set(Array.from(document.querySelectorAll(".tile"))
      .map((tile) => tile.getAttribute("aria-rowindex"))).size;
    const boardRect = document.querySelector(".board")?.getBoundingClientRect();
    const progressRect = document.querySelector("#bouquetProgress")?.getBoundingClientRect();
    const coinRect = document.querySelector("#coinBalance")?.getBoundingClientRect();
    const replayEntrySurface = innerWidth <= 760
      ? document.querySelector("#firstSwapCue")
      : document.querySelector("#bouquetRewardPromise");
    const payoffAction = Array.from(document.querySelectorAll("#roundOneRestoration button"))
      .find(visible) || null;
    const payoffFloatingCommands = [
      ["tutorialPanel", document.querySelector("#tutorialPanel")],
      ["firstSwapCue", document.querySelector("#firstSwapCue")],
      ["nextOrderCue", document.querySelector("#nextOrderCue")]
    ].filter(([, node]) => visible(node)).map(([id, node]) => ({
      id,
      text: node.textContent.replace(/\s+/g, " ").trim(),
      rect: visibleRect(node)
    }));
    const visibleLiveRegions = Array.from(document.querySelectorAll("[aria-live]"))
      .filter(visible)
      .map((node) => {
        const clone = node.cloneNode(true);
        clone.querySelectorAll("[aria-hidden='true'], [hidden]").forEach((hiddenNode) => hiddenNode.remove());
        return {
          id: node.id,
          live: node.getAttribute("aria-live"),
          text: clone.textContent.replace(/\s+/g, " ").trim()
        };
      });
    return {
      round: state.currentRound || 1,
      moves: state.moves,
      roundComplete: Boolean(state.roundComplete),
      roundOneRestored: Boolean(state.roundOneRestored),
      roundTwoGreenhouseUpgraded: Boolean(state.roundTwoGreenhouseUpgraded),
      roundThreeConservatoryRaised: Boolean(state.roundThreeConservatoryRaised),
      freshConservatorySettlement: Boolean(state.freshConservatorySettlement),
      coins: state.coins,
      counts: state.counts || [],
      focusedEconomyVersion: state.focusedEconomyVersion,
      coinBalanceText: document.querySelector("#coinBalance")?.textContent.replace(/\s+/g, " ").trim() || "",
      coinBalanceValue: document.querySelector("#coinBalance")?.dataset.balance || "",
      coinBalanceVisible: visible(document.querySelector("#coinBalance")),
      coinBalancePulsing: document.querySelector("#coinBalance")?.classList.contains("balance-pulse") || false,
      coinBalanceOccurrences: (document.body.innerText.match(/COINS\s+\d+/gi) || []).length,
      coinBalanceInsideProgress: Boolean(progressRect && coinRect
        && coinRect.left >= progressRect.left - 1
        && coinRect.right <= progressRect.right + 1
        && coinRect.top >= progressRect.top - 1
        && coinRect.bottom <= progressRect.bottom + 1),
      bouquet: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      bouquetNext: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      greenhouse: document.querySelector(".restoration-dial-phase")?.textContent.trim() || "",
      greenhouseStage: document.querySelector("#heroRestorationDial")?.dataset.restorationDialStage || "",
      greenhouseOwnedStage: document.querySelector("#heroRestorationDial")?.dataset.ownedStage || "",
      greenhousePct: document.querySelector("#heroRestorationDial")?.dataset.restorationDialPct || "",
      greenhouseText: document.querySelector("#heroRestorationDial")?.textContent.replace(/\s+/g, " ").trim() || "",
      greenhouseGoalCounts: document.querySelectorAll(".greenhouse-restoration-dial .restoration-goal-count").length,
      activeStageKey: document.querySelector("#activeGreenhouseStage")?.dataset.stageKey || "",
      activeStageArt: document.querySelector("#activeGreenhouseStageArt")?.getAttribute("src") || "",
      bodyStage: document.body.dataset.activeGreenhouseStage || "",
      bodyRevivalPct: document.body.dataset.greenhouseRevivalPct || "",
      payoffTransaction: document.querySelector("#payoffTransaction")?.textContent.trim() || "",
      payoffCopy: document.querySelector("#restorationCopy")?.textContent.trim() || "",
      payoffMode: document.querySelector("#roundOneRestoration")?.dataset.payoffMode || "",
      ownedRenewalPhase: document.querySelector("#roundOneRestoration")?.dataset.ownedRenewalPhase || "",
      ownedRenewalHidden: document.querySelector("#ownedReplayRenewal")?.hidden ?? true,
      ownedRenewalTransientNodes: document.querySelector("#ownedReplayRenewal")?.querySelectorAll("*").length || 0,
      restorationTitle: document.querySelector("#restorationTitle")?.textContent.trim() || "",
      restorationState: document.querySelector("#restorationState")?.textContent.trim() || "",
      trophyKicker: document.querySelector(".bouquet-trophy-kicker")?.textContent.trim() || "",
      trophyName: document.querySelector(".bouquet-trophy-name")?.textContent.trim() || "",
      trophyCopy: document.querySelector(".bouquet-trophy-copy")?.textContent.trim() || "",
      craftedComposition: Array.from(document.querySelectorAll(".crafted-flower-bloom"))
        .map((node) => Number(node.dataset.craftedFlower)),
      craftedTargetCounts: document.querySelector(".crafted-bouquet")?.dataset.craftedTargetCounts || "",
      restorationSceneLabel: document.querySelector(".restoration-scene")?.getAttribute("aria-label") || "",
      restorationSceneArt: document.querySelector(".restoration-scene")?.dataset.greenhouseArt || "",
      restoredSceneArt: document.querySelector(".greenhouse-art-restored")?.getAttribute("src") || "",
      witheredSceneArtVisible: visible(document.querySelector(".greenhouse-art-withered")),
      restoredSceneArtVisible: visible(document.querySelector(".greenhouse-art-restored")),
      visibleTransformationLabels: Array.from(document.querySelectorAll(".restoration-before-label, .restoration-after-label"))
        .filter(visible)
        .map((label) => label.textContent.trim()),
      ceremonyText: document.querySelector("#roundOneRestoration")?.innerText.replace(/\s+/g, " ").trim() || "",
      ceremonyBottom: document.querySelector("#roundOneRestoration")?.getBoundingClientRect().bottom || 0,
      transactionBottom: document.querySelector("#payoffTransaction")?.getBoundingClientRect().bottom || 0,
      actionBottom: Array.from(document.querySelectorAll("#roundOneRestoration button"))
        .find(visible)?.getBoundingClientRect().bottom || 0,
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      cueVisible: visible(document.querySelector("#firstSwapCue")),
      tutorialVisible: visible(document.querySelector("#tutorialPanel")),
      payoffFloatingCommands,
      payoffGeometry: {
        title: visibleRect(document.querySelector(".title")),
        coins: visibleRect(document.querySelector("#coinBalance")),
        bouquet: visibleRect(document.querySelector("#bouquetTrophy")),
        greenhouse: visibleRect(document.querySelector(".restoration-scene")),
        transaction: visibleRect(document.querySelector("#payoffTransaction")),
        action: visibleRect(payoffAction)
      },
      rewardPromise: document.querySelector("#bouquetRewardPromise")?.textContent.trim() || "",
      replayEntryReceipt: replayEntrySurface?.textContent.trim() || "",
      replayEntryActive: document.body.classList.contains("owned-replay-entry"),
      handoffCue: document.querySelector("#nextOrderCue")?.textContent.trim() || "",
      handoffCueVisible: visible(document.querySelector("#nextOrderCue")),
      handoffCueBottom: document.querySelector("#nextOrderCue")?.getBoundingClientRect().bottom || 0,
      replayEntryGeometry: {
        receipt: visibleRect(replayEntrySurface),
        receiptText: visibleTextRect(replayEntrySurface),
        receiptClientWidth: replayEntrySurface?.clientWidth || 0,
        receiptScrollWidth: replayEntrySurface?.scrollWidth || 0,
        receiptClientHeight: replayEntrySurface?.clientHeight || 0,
        receiptScrollHeight: replayEntrySurface?.scrollHeight || 0,
        receiptWhiteSpace: replayEntrySurface ? getComputedStyle(replayEntrySurface).whiteSpace : "",
        receiptFontSize: replayEntrySurface
          ? Number.parseFloat(getComputedStyle(replayEntrySurface).fontSize)
          : 0,
        detachedReceipt: visibleRect(document.querySelector("#nextOrderCue")),
        masthead: visibleRect(document.querySelector(".title")),
        help: visibleRect(document.querySelector("#tutorialHelpBtn")),
        bouquet: visibleRect(document.querySelector("#bouquetProgress")),
        greenhouseContinuity: visibleRect(document.querySelector("#mobileGreenhouseProgress")),
        board: visibleRect(document.querySelector("#board")),
        currentOrder: visibleRect(document.querySelector(".active-orders-card")),
        firstActionableTile: visibleRect(document.querySelector(".tile[tabindex='0']"))
      },
      hintedTiles: document.querySelectorAll(".tile.idle-hint").length,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      tutorial: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      tutorialIcon: document.querySelector("#tutorialPanel .tutorial-icon")?.textContent.trim() || "",
      tutorialIconAriaHidden: document.querySelector("#tutorialPanel .tutorial-icon")?.getAttribute("aria-hidden") || "",
      blackCandleTutorial: document.querySelector("#tutorialPanel")?.classList.contains("black-candle-tutorial") || false,
      finalHarvestPhase: document.body.dataset.finalHarvestPhase || "",
      finalHarvestPair: (document.body.dataset.finalHarvestPair || "").split(" ").filter(Boolean),
      finalHarvestTargets: (document.body.dataset.finalHarvestTargets || "").split(" ").filter(Boolean),
      finalHarvestSlots: (document.body.dataset.finalHarvestSlots || "").split(" ").filter(Boolean).map(Number),
      finalHarvestComposition: document.body.dataset.finalHarvestComposition || "",
      finalHarvestKind: document.body.dataset.finalHarvestKind || "",
      finalHarvestOwner: document.body.dataset.finalHarvestOwner || "",
      finalHarvestEndpointCount: document.querySelectorAll(".tile.final-harvest-endpoint").length,
      finalHarvestMatchCount: document.querySelectorAll(".tile.final-harvest-match").length,
      finalHarvestObjectiveTargets: document.querySelectorAll(".objective-target.final-harvest-target").length,
      finalHarvestContractTargets: document.querySelectorAll(".contract-ingredient.final-harvest-target").length,
      armedRelicSource: document.querySelector("#board")?.dataset.armedRelicSource || "",
      armedRelicDestination: document.querySelector("#board")?.dataset.armedRelicDestination || "",
      finalHarvestPhysicalSlots: Array.from(document.querySelectorAll(
        '.live-bouquet-ingredient[data-final-harvest-slot="true"]'
      )).map((slot) => ({
        index: Number(slot.dataset.liveSlot),
        flowerId: Number(slot.dataset.flowerId),
        state: slot.dataset.slotState,
        gainReceiver: slot.dataset.gainReceiver
      })),
      liveBouquetVisible: visible(document.querySelector("#liveBouquetAssembly")),
      liveBouquetComposition: document.querySelector("#liveBouquetAssembly")?.dataset.compositionKey || "",
      liveBouquetUnitKeys: Array.from(document.querySelectorAll(
        "#liveBouquetAssembly .live-bouquet-ingredient"
      )).map((unit) => unit.dataset.compositionUnit || ""),
      craftedBouquetComposition: document.querySelector(".crafted-bouquet")?.dataset.compositionKey || "",
      craftedBouquetUnitKeys: Array.from(document.querySelectorAll(
        ".crafted-bouquet .crafted-flower-bloom"
      )).map((unit) => unit.dataset.compositionUnit || ""),
      craftedStemUnitKeys: Array.from(document.querySelectorAll(
        ".crafted-bouquet .crafted-stem"
      )).map((unit) => unit.dataset.compositionUnit || ""),
      finalHarvestTransientNodes: document.querySelectorAll(
        ".objective-flight, .bouquet-bind-seal, .greenhouse-intake-flight"
      ).length,
      finalHarvestFlightCount: document.querySelectorAll(".objective-flight").length,
      visibleLiveRegions,
      liveRegionOwners: visibleLiveRegions.filter((region) => ["polite", "assertive"].includes(region.live)),
      activeElementId: document.activeElement?.id || "",
      rovingTileIds: Array.from(document.querySelectorAll(".tile[tabindex='0']")).map((tile) => tile.id),
      selectedTileCount: document.querySelectorAll(".tile.sel").length,
      tiles: document.querySelectorAll(".tile").length,
      tileRows,
      tileAriaRows,
      boardBottom: boardRect ? boardRect.bottom : 0,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      minimumTileWidth: Math.min(...Array.from(document.querySelectorAll(".tile"))
        .map((tile) => tile.getBoundingClientRect().width)),
      minimumTileHeight: Math.min(...Array.from(document.querySelectorAll(".tile"))
        .map((tile) => tile.getBoundingClientRect().height)),
      visibleButtons: Array.from(document.querySelectorAll("button"))
        .filter((button) => visible(button) && !button.closest(".board"))
        .map((button) => button.textContent.trim())
        .filter(Boolean),
      mobilePlinthVisible: visible(document.querySelector("#mobileGreenhousePlinth")),
      ritualLogVisible: visible(document.querySelector("#ritualLog")),
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function finalHarvestAuthorityState(page) {
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
    const visibleText = (node) => {
      if (!visible(node)) return "";
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      const parts = [];
      while (walker.nextNode()) {
        const parent = walker.currentNode.parentElement;
        if (parent && visible(parent)) {
          const text = walker.currentNode.textContent.replace(/\s+/g, " ").trim();
          if (text) parts.push(text);
        }
      }
      return parts.join(" ").replace(/\s+/g, " ").trim();
    };
    const rgb = (value) => {
      const hex = String(value).trim().match(/^#([0-9a-f]{6})$/i)?.[1];
      if (hex) {
        return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
      }
      const channels = String(value).match(/[\d.]+/g)?.slice(0, 3).map(Number) || [];
      return channels.length === 3 ? channels : null;
    };
    const luminance = (value) => {
      const channels = rgb(value);
      if (!channels) return null;
      const linear = channels.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const contrast = (foreground, background) => {
      const first = luminance(foreground);
      const second = luminance(background);
      if (first === null || second === null) return 0;
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    const finalTutorial = document.querySelector("#tutorialPanel.final-harvest-tutorial");
    const finalTutorialVisible = visible(finalTutorial);
    const cue = finalTutorialVisible
      ? finalTutorial
      : document.querySelector("#firstSwapCue");
    const commandNode = finalTutorialVisible
      ? document.querySelector("#tutorialCopy")
      : cue;
    const categoryNode = finalTutorialVisible
      ? finalTutorial.querySelector(".tutorial-icon")
      : null;
    const cueStyle = cue ? getComputedStyle(cue) : null;
    const commandStyle = commandNode ? getComputedStyle(commandNode) : cueStyle;
    const categoryStyle = categoryNode
      ? getComputedStyle(categoryNode)
      : cue ? getComputedStyle(cue, "::before") : null;
    const cueRect = cue?.getBoundingClientRect();
    const cueContrastBackground = cueStyle
      ?.getPropertyValue("--final-harvest-cue-contrast-bg").trim() || "";
    const actionLikeControls = Array.from(document.querySelectorAll(
      "button, a[href], input, select, textarea, summary, [role='button'], [tabindex]"
    ))
      .filter((node) => !node.closest(".board") && visible(node))
      .map((node) => ({
        id: node.id || "",
        kind: node.tagName.toLowerCase(),
        text: visibleText(node) || node.getAttribute("aria-label") || node.getAttribute("title") || ""
      }))
      .filter((entry, index, entries) => (
        entries.findIndex((candidate) => candidate.id === entry.id && candidate.text === entry.text) === index
      ));
    const sharedHudText = [
      "#objective",
      "#bouquetProgress",
      "#mobileGreenhouseProgress",
      "#heroRestorationDial",
      "#firstSwapCue",
      "#tutorialPanel",
      "#nextOrderCue",
      "#activeOrders",
      "#ritualLog",
      "#roundOneRestoration",
      "#roundCeremony"
    ].map((selector) => ({
      selector,
      text: visibleText(document.querySelector(selector))
    })).filter((entry) => entry.text);
    return {
      cuePresentation: {
        visible: visible(cue),
        opacity: cueStyle?.opacity || "",
        categoryOpacity: categoryStyle?.opacity || "",
        color: commandStyle?.color || "",
        categoryColor: categoryStyle?.color || "",
        contrastBackground: cueContrastBackground,
        contrastRatio: contrast(commandStyle?.color || "", cueContrastBackground),
        categoryContrastRatio: contrast(categoryStyle?.color || "", cueContrastBackground),
        category: categoryNode
          ? categoryNode.textContent.trim()
          : (categoryStyle?.content || "").replace(/^["']|["']$/g, ""),
        fontSize: Number.parseFloat(commandStyle?.fontSize || "0"),
        fontWeight: Number.parseInt(commandStyle?.fontWeight || "0", 10),
        rect: cueRect ? {
          left: cueRect.left,
          top: cueRect.top,
          right: cueRect.right,
          bottom: cueRect.bottom,
          width: cueRect.width,
          height: cueRect.height
        } : null,
        clipped: Boolean(cueRect && (
          cueRect.left < -0.5
          || cueRect.top < -0.5
          || cueRect.right > innerWidth + 0.5
          || cueRect.bottom > innerHeight + 0.5
        ))
      },
      actionLikeControls,
      sharedHudText
    };
  });
}

async function commandSurfaceGeometryState(page) {
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
    const rectOf = (node) => {
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
    const glyphRect = (node) => {
      if (!node || !visible(node)) return null;
      const range = document.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      range.detach();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
    };
    const hitOwnership = (node) => {
      if (!node || !visible(node)) return [];
      const rect = node.getBoundingClientRect();
      const inset = Math.min(8, rect.width / 4, rect.height / 4);
      return [
        ["center", rect.left + rect.width / 2, rect.top + rect.height / 2],
        ["top-left", rect.left + inset, rect.top + inset],
        ["top-right", rect.right - inset, rect.top + inset],
        ["bottom-left", rect.left + inset, rect.bottom - inset],
        ["bottom-right", rect.right - inset, rect.bottom - inset]
      ].map(([point, x, y]) => {
        const owner = document.elementFromPoint(x, y);
        return {
          point,
          x,
          y,
          owned: Boolean(owner && (owner === node || node.contains(owner))),
          ownerId: owner?.id || "",
          ownerClass: String(owner?.className || "")
        };
      });
    };
    const panel = document.querySelector("#tutorialPanel");
    const cue = document.querySelector("#firstSwapCue");
    const surface = visible(panel) ? panel : visible(cue) ? cue : null;
    const category = visible(panel)
      ? panel.querySelector(".tutorial-icon")
      : null;
    const action = visible(panel)
      ? document.querySelector("#tutorialCopy")
      : surface;
    const skip = document.querySelector("#tutorialSkipBtn");
    const tiles = Array.from(document.querySelectorAll(".tile")).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y),
      rect: rectOf(tile)
    }));
    const representativeTileHits = [0, 7, 27, 36, 56, 63].map((index) => {
      const tile = document.querySelectorAll(".tile")[index];
      const rect = tile?.getBoundingClientRect();
      const owner = rect
        ? document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
        : null;
      return {
        id: tile?.id || "",
        owned: Boolean(owner && tile && (owner === tile || tile.contains(owner))),
        ownerId: owner?.id || "",
        ownerClass: String(owner?.className || "")
      };
    });
    return {
      viewport: {
        width: innerWidth,
        height: innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight
      },
      bodyClasses: document.body.className,
      region: rectOf(document.querySelector("#tutorialCommandRegion")),
      surface: rectOf(surface),
      surfaceId: surface?.id || "",
      surfaceText: surface?.textContent.replace(/\s+/g, " ").trim() || "",
      category: {
        text: category?.textContent.trim() || "",
        box: rectOf(category),
        glyphs: glyphRect(category)
      },
      action: {
        text: action?.textContent.replace(/\s+/g, " ").trim() || "",
        box: rectOf(action),
        glyphs: glyphRect(action)
      },
      skip: {
        visible: visible(skip),
        text: skip?.textContent.trim() || "",
        box: visible(skip) ? rectOf(skip) : null,
        glyphs: glyphRect(skip),
        hitOwnership: hitOwnership(skip)
      },
      greenhouse: rectOf(document.querySelector("#mobileGreenhouseProgress")),
      board: rectOf(document.querySelector("#board")),
      tiles,
      representativeTileHits,
      tileRows: new Set(tiles.map((tile) => tile.y)).size,
      tileColumns: new Set(tiles.map((tile) => tile.x)).size,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1
    };
  });
}

function geometryContains(outer, inner, tolerance = 0.5) {
  return Boolean(
    outer
    && inner
    && inner.left >= outer.left - tolerance
    && inner.right <= outer.right + tolerance
    && inner.top >= outer.top - tolerance
    && inner.bottom <= outer.bottom + tolerance
  );
}

function geometryOverlaps(first, second, tolerance = 0.5) {
  return Boolean(
    first
    && second
    && Math.min(first.right, second.right) - Math.max(first.left, second.left) > tolerance
    && Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > tolerance
  );
}

function expectCommandSurfaceGeometry(geometry, label) {
  const viewport = {
    left: 0,
    top: 0,
    right: geometry.viewport.width,
    bottom: geometry.viewport.height
  };
  expect(geometryContains(viewport, geometry.region), `${label} command region is in viewport`).toBe(true);
  expect(geometryContains(geometry.region, geometry.surface), `${label} command surface is in its region`).toBe(true);
  expect(geometryContains(viewport, geometry.surface), `${label} command surface is in viewport`).toBe(true);
  expect(geometry.action.text, `${label} keeps literal action copy`).not.toBe("");
  expect(geometryContains(geometry.surface, geometry.action.box), `${label} action box is contained`).toBe(true);
  expect(geometryContains(geometry.surface, geometry.action.glyphs), `${label} action glyphs are contained`).toBe(true);
  if (geometry.category.text) {
    expect(geometryContains(geometry.surface, geometry.category.box), `${label} category box is contained`).toBe(true);
    expect(geometryContains(geometry.surface, geometry.category.glyphs), `${label} category glyphs are contained`).toBe(true);
    expect(
      geometryOverlaps(geometry.category.glyphs, geometry.action.glyphs),
      `${label} category and action glyphs do not overlap`
    ).toBe(false);
  }
  if (geometry.skip.visible) {
    expect(geometry.skip.text, `${label} complete Skip copy`).toBe("Skip");
    expect(geometryContains(geometry.surface, geometry.skip.box), `${label} Skip control is contained`).toBe(true);
    expect(geometryContains(geometry.surface, geometry.skip.glyphs), `${label} Skip glyphs are contained`).toBe(true);
    expect(geometryContains(viewport, geometry.skip.box), `${label} Skip control is in viewport`).toBe(true);
    expect(geometryContains(viewport, geometry.skip.glyphs), `${label} Skip glyphs are in viewport`).toBe(true);
    expect(geometryOverlaps(geometry.action.glyphs, geometry.skip.glyphs), `${label} action and Skip do not overlap`).toBe(false);
    if (geometry.category.text) {
      expect(
        geometryOverlaps(geometry.category.glyphs, geometry.skip.glyphs),
        `${label} category and Skip do not overlap`
      ).toBe(false);
    }
    expect(
      geometry.skip.hitOwnership.filter((probe) => !probe.owned),
      `${label} Skip center and inset probes belong to Skip`
    ).toEqual([]);
    if (geometry.viewport.width === 390) {
      expect(geometry.skip.box.width, `${label} mobile Skip width`).toBeGreaterThanOrEqual(44);
      expect(geometry.skip.box.height, `${label} mobile Skip height`).toBeGreaterThanOrEqual(44);
    }
  }
  expect(geometryOverlaps(geometry.region, geometry.greenhouse), `${label} command clears greenhouse strip`).toBe(false);
  expect(geometryOverlaps(geometry.surface, geometry.board), `${label} command clears board`).toBe(false);
  expect(geometryOverlaps(geometry.greenhouse, geometry.board), `${label} greenhouse clears board`).toBe(false);
  expect(geometry.tiles, `${label} keeps 64 tiles`).toHaveLength(64);
  expect(geometry.tileRows, `${label} keeps eight tile rows`).toBe(8);
  expect(geometry.tileColumns, `${label} keeps eight tile columns`).toBe(8);
  expect(
    geometry.representativeTileHits.filter((probe) => !probe.owned),
    `${label} representative tile centers belong to their tiles`
  ).toEqual([]);
  expect(geometry.overflowX, `${label} has no horizontal overflow`).toBe(false);
  expect(geometry.overflowY, `${label} has no vertical overflow`).toBe(false);
  if (geometry.viewport.width === 390) {
    expect(geometry.board.width, `${label} mobile board width`).toBeCloseTo(378, 5);
    expect(geometry.board.height, `${label} mobile board height`).toBeCloseTo(378, 5);
    expect(geometry.board.bottom, `${label} full board remains in viewport`)
      .toBeLessThanOrEqual(geometry.viewport.height);
    const tileWidths = new Set(geometry.tiles.map(({ rect }) => rect.width));
    const tileHeights = new Set(geometry.tiles.map(({ rect }) => rect.height));
    expect([...tileWidths], `${label} stable mobile tile widths`).toHaveLength(1);
    expect([...tileHeights], `${label} stable mobile tile heights`).toHaveLength(1);
  }
}

const GREENHOUSE_EXPECTATIONS = [
  {
    stage: 0,
    pct: "0",
    key: "withered",
    phase: "Withered",
    art: "first_greenhouse_withered.jpg",
    note: "Owned 0/3 · Next: Restore Greenhouse"
  },
  {
    stage: 1,
    pct: "33",
    key: "restored",
    phase: "First panes restored",
    art: "first_greenhouse_restored.jpg",
    note: "Owned 1/3 · Next: Upgrade Greenhouse"
  },
  {
    stage: 2,
    pct: "67",
    key: "moonlit",
    phase: "Moonlit upgrade owned",
    art: "moonlit_wreath_greenhouse.jpg",
    note: "Owned 2/3 · Next: Raise Conservatory"
  },
  {
    stage: 3,
    pct: "100",
    key: "bloodroot",
    phase: "Conservatory raised",
    art: "bloodroot_compact_greenhouse.jpg",
    note: "Owned 3/3"
  }
];

async function expectGreenhouseOwned(page, expectedStage, context) {
  const expected = GREENHOUSE_EXPECTATIONS[expectedStage];
  const state = await journeyState(page);
  expect(state.greenhouseOwnedStage, `${context} owned stage`).toBe(String(expected.stage));
  expect(state.greenhousePct, `${context} owned pct`).toBe(expected.pct);
  expect(state.bodyRevivalPct, `${context} body revival pct`).toBe(expected.pct);
  expect(state.greenhouseStage, `${context} dial stage`).toBe(expected.key);
  expect(state.activeStageKey, `${context} active stage key`).toBe(expected.key);
  expect(state.bodyStage, `${context} body stage`).toBe(expected.key);
  expect(state.activeStageArt, `${context} active greenhouse art`).toContain(expected.art);
  expect(state.greenhouse, `${context} greenhouse phase`).toBe(expected.phase);
  expect(state.greenhouseText, `${context} greenhouse note`).toContain(expected.note);
  expect(state.greenhouseGoalCounts, `${context} greenhouse target counts removed`).toBe(0);
  return state;
}

function expectFocusedPayoffNarration(state, context) {
  expect(state.tutorialVisible, `${context} shared tutorial narrator is hidden`).toBe(false);
  expect(state.tutorial, `${context} hidden tutorial narrator has no stale command`).toBe("");
  expect(state.cueVisible, `${context} active-board cue stays hidden`).toBe(false);
  expect(state.handoffCueVisible, `${context} detached handoff cue stays hidden`).toBe(false);
  expect(state.payoffFloatingCommands, `${context} has no floating command surface`).toEqual([]);
  expect(
    state.liveRegionOwners.map(({ id, live }) => ({ id, live })),
    `${context} ceremony has one live owner`
  ).toEqual([{
    id: "roundOneRestoration",
    live: "polite"
  }]);
  const visibleLiveById = Object.fromEntries(
    state.visibleLiveRegions.map((region) => [region.id, region])
  );
  expect(visibleLiveById.coinBalance?.live, `${context} coin balance is quiet`).toBe("off");
  expect(visibleLiveById.roundOneRestoration?.live, `${context} ceremony subtree owns narration`).toBe("polite");
  expect(state.liveRegionOwners[0].text, `${context} ceremony has no stale Black Candle category`).not.toMatch(/BLACK CANDLE/i);
  expect(state.payoffGeometry.title, `${context} title remains visible`).not.toBeNull();
  expect(state.payoffGeometry.coins, `${context} compact wallet remains visible`).not.toBeNull();
  expect(
    rectanglesOverlap(state.payoffGeometry.title, state.payoffGeometry.coins),
    `${context} title and compact wallet do not overlap`
  ).toBe(false);
  if (state.payoffGeometry.action) {
    for (const [name, rect] of Object.entries({
      title: state.payoffGeometry.title,
      wallet: state.payoffGeometry.coins,
      bouquet: state.payoffGeometry.bouquet,
      greenhouse: state.payoffGeometry.greenhouse,
      transaction: state.payoffGeometry.transaction
    })) {
      expect(
        rectanglesOverlap(state.payoffGeometry.action, rect),
        `${context} dominant action does not overlap ${name}`
      ).toBe(false);
    }
  }
}

async function expectPermanentRaisedGreenhouse(page, context) {
  const state = await expectGreenhouseOwned(page, 3, context);
  expect([
    state.roundOneRestored,
    state.roundTwoGreenhouseUpgraded,
    state.roundThreeConservatoryRaised
  ], `${context} persisted ownership flags`).toEqual([true, true, true]);
  expect(state.greenhouseText, `${context} permanent replay progress`).toContain("Permanent through replay");
  if (!state.roundComplete && !state.visibleButtons.includes("Retry Bouquet")) {
    expect(state.bouquetNext, `${context} replay bouquet keeps order authority`).toMatch(/^Bouquet · \d+\/\d+$/);
  }
  return state;
}

async function expectVisibleCoinBalance(page, expectedCoins, options = {}) {
  const state = await journeyState(page);
  expect(state.coinBalanceVisible).toBe(true);
  expect(state.coinBalanceText).toBe(`✪ Coins ${expectedCoins}`);
  expect(state.coinBalanceValue).toBe(String(expectedCoins));
  expect(state.coinBalanceOccurrences).toBe(1);
  expect(state.coinBalanceInsideProgress).toBe(true);
  if (options.pulsing !== undefined) {
    expect(state.coinBalancePulsing).toBe(options.pulsing);
  }
}

async function guidedPairHitReport(page, pair) {
  return page.evaluate(({ key, pair }) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const visible = (node) => {
      if (!node) return false;
      const bounds = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && bounds.width > 0
        && bounds.height > 0;
    };
    const reportNode = (node) => {
      if (!node) return null;
      const bounds = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        id: node.id,
        className: node.className,
        rect: {
          left: bounds.left,
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.bottom,
          width: bounds.width,
          height: bounds.height
        },
        visible: visible(node),
        pointerEvents: style.pointerEvents,
        position: style.position,
        zIndex: style.zIndex
      };
    };
    const reportTile = (cell) => {
      const node = document.querySelector(
        `.tile[data-x="${cell.x}"][data-y="${cell.y}"]`
      );
      const report = reportNode(node);
      if (!node || !report) return report;
      const bounds = node.getBoundingClientRect();
      const center = {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2
      };
      const owner = document.elementFromPoint(center.x, center.y);
      return {
        ...report,
        center,
        ownedByTile: Boolean(owner && (owner === node || node.contains(owner))),
        owner: owner ? {
          tag: owner.tagName,
          id: owner.id,
          className: owner.className,
          ancestors: Array.from((function* ownerChain() {
            let current = owner;
            while (current && current !== document.documentElement) {
              yield `${current.tagName.toLowerCase()}#${current.id}.${String(current.className)}`;
              current = current.parentElement;
            }
          })())
        } : null
      };
    };
    return {
      intendedPair: pair,
      source: reportTile(pair[0]),
      destination: reportTile(pair[1]),
      commands: {
        region: reportNode(document.querySelector("#tutorialCommandRegion")),
        panel: reportNode(document.querySelector("#tutorialPanel")),
        cue: reportNode(document.querySelector("#firstSwapCue")),
        nextCue: reportNode(document.querySelector("#nextOrderCue")),
        help: reportNode(document.querySelector("#tutorialHelpBtn")),
        skip: reportNode(document.querySelector("#tutorialSkipBtn"))
      },
      body: {
        className: document.body.className,
        dataset: { ...document.body.dataset }
      },
      board: {
        rect: reportNode(document.querySelector("#board"))?.rect || null,
        busy: document.querySelector("#board")?.getAttribute("aria-busy"),
        selected: Array.from(document.querySelectorAll(".tile.selected, .tile.sel"))
          .map((tile) => `${tile.dataset.x},${tile.dataset.y}`),
        unownedTileCenters: Array.from(document.querySelectorAll(".tile"))
          .map((tile) => reportTile({ x: tile.dataset.x, y: tile.dataset.y }))
          .filter((tile) => !tile?.ownedByTile)
      },
      authoritativeState: {
        currentRound: state.currentRound,
        moves: state.moves,
        counts: state.counts,
        roundComplete: state.roundComplete,
        tutorialStep: state.tutorialStep,
        tutorialSkipped: state.tutorialSkipped,
        board: state.board
      }
    };
  }, {
    key: SAVE_KEY,
    pair: pair.map((cell) => ({ x: Number(cell.x), y: Number(cell.y) }))
  });
}

function expectGuidedPairHitOwnership(report, label) {
  expect(
    report.commands.region.pointerEvents,
    `${label} command wrapper is presentation-only: ${JSON.stringify(report)}`
  ).toBe("none");
  for (const name of ["panel", "cue", "nextCue"]) {
    if (report.commands[name]?.visible) {
      expect(
        report.commands[name].pointerEvents,
        `${label} ${name} passes through outside controls: ${JSON.stringify(report)}`
      ).toBe("none");
    }
  }
  for (const name of ["help", "skip"]) {
    if (report.commands[name]?.visible) {
      expect(
        report.commands[name].pointerEvents,
        `${label} ${name} remains a real hit target: ${JSON.stringify(report)}`
      ).toBe("auto");
    }
  }
  expect(
    report.source.ownedByTile,
    `${label} source center belongs to its tile: ${JSON.stringify(report)}`
  ).toBe(true);
  expect(
    report.destination.ownedByTile,
    `${label} destination center belongs to its tile: ${JSON.stringify(report)}`
  ).toBe(true);
  expect(
    report.board.unownedTileCenters,
    `${label} every tile center belongs to its tile: ${JSON.stringify(report)}`
  ).toEqual([]);
}

async function clickGuidedSwap(page, strategy = "optimized") {
  const movesBefore = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").moves, SAVE_KEY);
  let lastError = null;
  let lastNoSpendReport = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const pairHandle = await page.waitForFunction(({ targets, needed, strategy }) => {
    const saved = JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}");
    if (document.querySelector("#board")?.getAttribute("aria-busy") === "true") {
      return null;
    }
    if (document.body.dataset.finalHarvestPhase === "eligible") {
      const pair = (document.body.dataset.finalHarvestPair || "")
        .split(" ")
        .filter(Boolean)
        .map((key) => {
          const [x, y] = key.split(",").map(Number);
          return { x, y };
        });
      if (pair.length === 2) {
        return pair;
      }
    }
    const round = saved.currentRound || 1;
    const hinted = Array.from(document.querySelectorAll(".tile.idle-hint")).slice(0, 2).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y)
    }));
    // Preserve the authored Round 1/2 lessons. Once they are taught, the
    // final-harvest journey remains an ordinary objective-following player
    // that does not deliberately manufacture another four-match.
    if (hinted.length === 2 && !(strategy === "final-harvest" && round >= 3)) {
      return hinted;
    }

    const board = Array.from({ length: 8 }, () => Array(8).fill(-1));
    Array.from(document.querySelectorAll(".tile")).forEach((tile) => {
      board[Number(tile.dataset.y)][Number(tile.dataset.x)] = Number(tile.dataset.flowerId);
    });
    const targetIds = targets[String(round)] || [];
    const thornCells = Array.from(document.querySelectorAll(".tile.cursed-thorn, .tile.thorn-teach-blocker")).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y)
    }));
    const adjacentToThorn = (x, y) => thornCells.some((thorn) => Math.abs(thorn.x - x) + Math.abs(thorn.y - y) === 1);
    const swap = (a, b) => {
      const next = board.map((row) => row.slice());
      const temp = next[a.y][a.x];
      next[a.y][a.x] = next[b.y][b.x];
      next[b.y][b.x] = temp;
      return next;
    };
    const matchesFor = (next) => {
      const cells = new Map();
      const runs = [];
      for (let y = 0; y < 8; y += 1) {
        let start = 0;
        for (let x = 1; x <= 8; x += 1) {
          if (x === 8 || next[y][x] !== next[y][start]) {
            if (next[y][start] >= 0 && x - start >= 3) {
              const run = [];
              for (let i = start; i < x; i += 1) {
                cells.set(`${i},${y}`, next[y][start]);
                run.push([i, y]);
              }
              runs.push(run);
            }
            start = x;
          }
        }
      }
      for (let x = 0; x < 8; x += 1) {
        let start = 0;
        for (let y = 1; y <= 8; y += 1) {
          if (y === 8 || next[y][x] !== next[start][x]) {
            if (next[start][x] >= 0 && y - start >= 3) {
              const run = [];
              for (let i = start; i < y; i += 1) {
                cells.set(`${x},${i}`, next[start][x]);
                run.push([x, i]);
              }
              runs.push(run);
            }
            start = y;
          }
        }
      }
      return { cells, runs };
    };
    let best = null;
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const a = { x, y };
          const b = { x: x + dx, y: y + dy };
          if (b.x >= 8 || b.y >= 8 || board[a.y][a.x] === board[b.y][b.x]) {
            continue;
          }
          const found = matchesFor(swap(a, b));
          if (!found.cells.size) {
            continue;
          }
          const matchedValues = Array.from(found.cells.values());
          const targetMatches = matchedValues.filter((value) => targetIds.includes(value)).length;
          const directTargetCounts = matchedValues.reduce((counts, value) => {
            if (targetIds.includes(value)) {
              counts[value] = (counts[value] || 0) + 1;
            }
            return counts;
          }, {});
          const thornScore = round === 2
            ? Array.from(found.cells.keys()).filter((key) => {
              const [cellX, cellY] = key.split(",").map(Number);
              return adjacentToThorn(cellX, cellY);
            }).length
            : 0;
          const fourScore = found.runs.some((run) => run.length >= 4) ? 3 : 0;
          const optimizationScore = strategy === "optimized"
            ? fourScore + found.cells.size
            : strategy === "final-harvest" && round >= 3 ? -fourScore * 8 : 0;
          const deficitScore = strategy === "final-harvest" && round >= 3
            ? Object.entries(directTargetCounts).reduce((sum, [flowerId, gain]) => {
              const required = needed[String(round)]?.[flowerId] || 0;
              const current = Number(saved.counts?.[flowerId] || 0);
              return sum + (required > current && current + gain >= required ? 50 : 0);
            }, 0)
            : 0;
          const score = targetMatches * 10 + thornScore * 7 + optimizationScore + deficitScore;
          if (!best || score > best.score) {
            best = { score, pair: [a, b] };
          }
        }
      }
    }
    return best?.pair || null;
    }, { targets: ROUND_TARGETS, needed: ROUND_NEEDED, strategy }, { timeout: 8500 });
    const pairValue = await pairHandle.jsonValue();
    const pair = (pairValue || []).map((tile) => ({
      x: String(tile.x),
      y: String(tile.y)
    }));
    expect(pair, "guided pair").toHaveLength(2);
    const beforeInput = await guidedPairHitReport(page, pair);
    expectGuidedPairHitOwnership(beforeInput, `guided swap attempt ${attempt + 1}`);
    const selected = beforeInput.board.selected;
    const selectedIndex = pair.findIndex((cell) => selected.includes(`${cell.x},${cell.y}`));
    const endpoints = selected.length === 1 && selectedIndex >= 0
      ? [pair[selectedIndex === 0 ? 1 : 0]]
      : pair;
    const useTouch = await page.evaluate(() => navigator.maxTouchPoints > 0);
    try {
      for (const endpoint of endpoints) {
        const currentReport = await guidedPairHitReport(page, pair);
        expectGuidedPairHitOwnership(currentReport, `guided swap endpoint ${endpoint.x},${endpoint.y}`);
        const tile = page.locator(`.tile[data-x="${endpoint.x}"][data-y="${endpoint.y}"]`);
        if (useTouch) {
          await tile.tap();
        } else {
          await tile.click();
        }
      }
      await page.waitForFunction(() => (
        document.querySelector("#roundOneRestoration")?.offsetParent
        || document.querySelector("#renewBtn")?.classList.contains("visible")
        || (
          document.querySelector("#board")?.getAttribute("aria-busy") !== "true"
          && Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled)
        )
      ), null, { timeout: 10000 });
      const afterInput = await journeyState(page);
      if (afterInput.roundComplete || afterInput.moves < movesBefore) {
        return;
      }
      lastNoSpendReport = await guidedPairHitReport(page, pair);
    } catch (error) {
      lastError = error;
      const state = await journeyState(page);
      if (state.roundComplete || state.moves < movesBefore) {
        return;
      }
      await page.waitForFunction(() => (
        document.querySelector("#board")?.getAttribute("aria-busy") !== "true"
        && Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled)
      ), null, { timeout: 10000 });
    }
  }
  throw new Error(
    `Guided swap spent no authoritative move after one stale-rerender retry: ${
      JSON.stringify(lastNoSpendReport)
    }${lastError ? `; ${lastError.message}` : ""}`
  );
}

function parsedFinalHarvestTargets(state) {
  return state.finalHarvestTargets.map((entry) => {
    const [flowerId, deficit, gain] = entry.split(":").map(Number);
    return { flowerId, deficit, gain };
  });
}

const TRANSIENT_FUTURE_ACTION_COPY = /\b(?:Retry|Next Order|Next Bouquet|Play Again|Restore|Upgrade|Raise)\b/i;

function expectTransientFinalHarvestAuthority(state, label) {
  const actionCopy = state.actionLikeControls.map((control) => control.text).join(" · ");
  const sharedCopy = state.sharedHudText.map((entry) => entry.text).join(" · ");
  expect(state.actionLikeControls.some((control) => control.id === "tutorialHelpBtn"),
    `${label} Help does not compete`).toBe(false);
  expect(actionCopy, `${label} has no future action control`).not.toMatch(TRANSIENT_FUTURE_ACTION_COPY);
  expect(sharedCopy, `${label} has no future action language`).not.toMatch(TRANSIENT_FUTURE_ACTION_COPY);
}

async function expectEligibleFinalHarvest(page, round, label) {
  const state = {
    ...(await journeyState(page)),
    ...(await finalHarvestAuthorityState(page)),
    commandGeometry: await commandSurfaceGeometryState(page)
  };
  const targets = parsedFinalHarvestTargets(state);
  expect(state.finalHarvestPhase, `${label} eligibility phase`).toBe("eligible");
  expect(state.round, `${label} authoritative round`).toBe(round);
  expect(state.roundComplete, `${label} remains active`).toBe(false);
  expect(state.finalHarvestPair, `${label} one exact finishing pair`).toHaveLength(2);
  if (state.finalHarvestOwner === "stronger-guidance") {
    expect(state.finalHarvestKind, `${label} only Black Candle may outrank the final cue`).toBe("black-candle");
    expect(state.finalHarvestEndpointCount, `${label} does not compete with Black Candle endpoints`).toBe(0);
    expect(state.finalHarvestMatchCount, `${label} does not compete with the burn lane`).toBe(0);
    expect(state.finalHarvestPair.slice().sort(), `${label} uses the exact Black Candle pair`)
      .toEqual([state.armedRelicSource, state.armedRelicDestination].sort());
  } else {
    expect(state.finalHarvestKind, `${label} plain finishing opportunity`).toBe("plain-match");
    expect(state.finalHarvestEndpointCount, `${label} pair endpoints agree`).toBe(2);
    expect(state.finalHarvestMatchCount, `${label} plain target match is visible`).toBeGreaterThanOrEqual(3);
  }
  expect(targets.length, `${label} has remaining target species`).toBeGreaterThanOrEqual(1);
  expect(targets.every(({ deficit, gain }) => deficit > 0 && gain >= deficit), `${label} gains close every deficit`).toBe(true);
  expect(state.finalHarvestSlots.length, `${label} slots equal total deficit`)
    .toBe(targets.reduce((sum, target) => sum + target.deficit, 0));
  expect(state.finalHarvestPhysicalSlots.map((slot) => slot.index).sort((a, b) => a - b))
    .toEqual(state.finalHarvestSlots.slice().sort((a, b) => a - b));
  expect(state.finalHarvestPhysicalSlots.every((slot) => slot.state === "empty"), `${label} final receivers are closed`).toBe(true);
  expect(state.finalHarvestObjectiveTargets, `${label} tactical objective agrees`).toBe(targets.length);
  expect(state.finalHarvestContractTargets, `${label} current-order deficit agrees`).toBe(targets.length);
  expect(state.liveBouquetComposition, `${label} receiver identity`).toBe(state.finalHarvestComposition);
  expect(state.liveBouquetUnitKeys, `${label} receiver preserves every ordered unit identity`)
    .toEqual(state.finalHarvestComposition.split("|"));
  expect(state.tiles, `${label} retains 64 tiles`).toBe(64);
  expect(state.tileRows, `${label} retains eight rows`).toBe(8);
  expect(state.overflowX, `${label} has no horizontal overflow`).toBe(false);
  if (state.viewportWidth === 390) {
    expect(state.boardBottom, `${label} keeps every row in the exact mobile viewport`)
      .toBeLessThanOrEqual(state.viewportHeight);
    expect(state.minimumTileWidth, `${label} mobile tile hit width meets the primary-control target`)
      .toBeGreaterThanOrEqual(44);
    expect(state.minimumTileHeight, `${label} mobile tile hit height meets the primary-control target`)
      .toBeGreaterThanOrEqual(44);
  }
  expect(state.brokenImages, `${label} has no broken images`).toEqual([]);
  expect(state.liveRegionOwners, `${label} has exactly one visible narrator`).toHaveLength(1);
  expectCommandSurfaceGeometry(state.commandGeometry, `${label} visible command`);
  expectTransientFinalHarvestAuthority(state, `${label} eligibility`);
  if (state.finalHarvestOwner === "stronger-guidance") {
    expect(state.liveRegionOwners[0].text, `${label} Black Candle remains sole narrator`)
      .toMatch(/BLACK CANDLE.*Swap (left|right|up|down) to burn this (row|column)/i);
    expect(state.liveRegionOwners[0].text, `${label} final copy yields cleanly`).not.toMatch(/Finish with/i);
  } else {
    expect(state.liveRegionOwners[0].text, `${label} narrator is literal`).toMatch(/^Finish with .+\.$/);
    expect(state.liveRegionOwners[0].text, `${label} narrator yields stronger categories`)
      .not.toMatch(/BLACK CANDLE|CURSED THORN|RETRY|NEXT ORDER/i);
    expect(state.cuePresentation.visible, `${label} literal command is visible`).toBe(true);
    expect(state.cuePresentation.category, `${label} literal command category`).toBe("FINAL HARVEST");
    expect(state.cuePresentation.opacity, `${label} literal command computed opacity`).toBe("1");
    expect(state.cuePresentation.categoryOpacity, `${label} category computed opacity`).toBe("1");
    expect(state.cuePresentation.contrastRatio, `${label} literal command WCAG-style contrast`)
      .toBeGreaterThanOrEqual(4.5);
    expect(state.cuePresentation.categoryContrastRatio, `${label} category WCAG-style contrast`)
      .toBeGreaterThanOrEqual(4.5);
    expect(state.cuePresentation.fontSize, `${label} literal command screenshot-scale type`)
      .toBeGreaterThanOrEqual(13);
    expect(state.cuePresentation.fontWeight, `${label} literal command weight`)
      .toBeGreaterThanOrEqual(900);
    expect(state.cuePresentation.clipped, `${label} cue stays inside the viewport`).toBe(false);
  }
  for (const { flowerId, deficit, gain } of targets) {
    expect(ROUND_NEEDED[round][flowerId], `${label} target belongs to the real order`).toBeDefined();
    expect(ROUND_NEEDED[round][flowerId] - state.counts[flowerId], `${label} saved deficit ${flowerId}`).toBe(deficit);
    expect(gain, `${label} direct gain ${flowerId}`).toBeGreaterThanOrEqual(deficit);
  }
  return state;
}

async function playUntilFinalHarvest(page, round, label, strategy = "goal-following") {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    let state = await journeyState(page);
    if (!state.finalHarvestPhase && !state.roundComplete) {
      await page.waitForTimeout(950);
      state = await journeyState(page);
    }
    if (state.finalHarvestPhase === "eligible") {
      return expectEligibleFinalHarvest(page, round, label);
    }
    expect(state.roundComplete, `${label} cannot complete before final-harvest eligibility`).toBe(false);
    expect(state.moves, `${label} retains a legal finishing path`).toBeGreaterThan(0);
    await clickGuidedSwap(page, strategy);
  }
  throw new Error(`${label} did not reach natural final-harvest eligibility`);
}

async function performFinalHarvestInput(page, state, activation) {
  const pair = state.finalHarvestPair.map((key) => {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  });
  const tile = (cell) => page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
  if (activation === "keyboard") {
    await tile(pair[0]).focus();
    await page.keyboard.press("Enter");
    const key = pair[1].x > pair[0].x
      ? "ArrowRight"
      : pair[1].x < pair[0].x
        ? "ArrowLeft"
        : pair[1].y > pair[0].y ? "ArrowDown" : "ArrowUp";
    await page.keyboard.press(key);
  } else if (activation === "touch") {
    await tile(pair[0]).tap();
    await tile(pair[1]).tap();
  } else {
    await tile(pair[0]).click();
    await tile(pair[1]).click();
  }
}

async function finishThroughFinalHarvest(page, state, activation, evidencePrefix) {
  const movesBefore = state.moves;
  await performFinalHarvestInput(page, state, activation);
  await page.waitForFunction(() => (
    document.body.dataset.finalHarvestPhase === "landing"
    && document.querySelectorAll(".objective-flight").length > 0
    && Array.from(document.querySelectorAll(
      '.live-bouquet-ingredient[data-final-harvest-slot="true"]'
    )).every((slot) => slot.dataset.gainReceiver === "true")
  ), null, {
    timeout: 5000
  });
  // Read the board-owned landing immediately, then keep its evidence frame.
  // Reduced motion deliberately keeps this truthful handoff brief.
  const landing = {
    ...(await journeyState(page)),
    ...(await finalHarvestAuthorityState(page))
  };
  expect(landing.finalHarvestPhase).toBe("landing");
  expect(landing.roundComplete, `${evidencePrefix} authority completes before handoff`).toBe(true);
  expect(landing.moves, `${evidencePrefix} spends exactly one move`).toBe(movesBefore - 1);
  expect(landing.liveBouquetVisible, `${evidencePrefix} live bouquet remains on the board`).toBe(true);
  expect(landing.liveBouquetComposition, `${evidencePrefix} landing identity`)
    .toBe(state.finalHarvestComposition);
  expect(landing.liveBouquetUnitKeys, `${evidencePrefix} landing preserves exact ordered unit identity`)
    .toEqual(state.liveBouquetUnitKeys);
  expect(landing.finalHarvestPhysicalSlots.every((slot) => (
    slot.state === "filled" && slot.gainReceiver === "true"
  )), `${evidencePrefix} every final physical slot receives its flower`).toBe(true);
  expect(landing.finalHarvestFlightCount, `${evidencePrefix} target flights are present`).toBeGreaterThan(0);
  expect(landing.tutorialVisible, `${evidencePrefix} landing suppresses the shared narrator`).toBe(false);
  expect(landing.tutorial, `${evidencePrefix} landing has no hidden duplicate copy`).toBe("");
  expect(landing.payoffFloatingCommands, `${evidencePrefix} landing has no floating command surface`).toEqual([]);
  expect(landing.liveRegionOwners, `${evidencePrefix} landing has no competing live narrator`).toEqual([]);
  expectTransientFinalHarvestAuthority(landing, `${evidencePrefix} landing`);
  const handoffSnapshotPromise = page.evaluate(() => new Promise((resolve) => {
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const visibleText = (node) => {
      if (!visible(node)) return "";
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      const parts = [];
      while (walker.nextNode()) {
        const parent = walker.currentNode.parentElement;
        if (parent && visible(parent)) {
          const text = walker.currentNode.textContent.replace(/\s+/g, " ").trim();
          if (text) parts.push(text);
        }
      }
      return parts.join(" ").replace(/\s+/g, " ").trim();
    };
    const visibleRect = (node) => {
      if (!visible(node)) return null;
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
    let observer;
    const capture = () => {
      if (!document.body.classList.contains("final-harvest-handoff-active")) {
        return false;
      }
      observer?.disconnect();
      resolve({
        finalHarvestPhase: document.body.dataset.finalHarvestPhase || "",
        craftedBouquetComposition: document.querySelector(".crafted-bouquet")?.dataset.compositionKey || "",
        craftedBouquetUnitKeys: Array.from(document.querySelectorAll(
          ".crafted-bouquet .crafted-flower-bloom"
        )).map((unit) => unit.dataset.compositionUnit || ""),
        craftedStemUnitKeys: Array.from(document.querySelectorAll(
          ".crafted-bouquet .crafted-stem"
        )).map((unit) => unit.dataset.compositionUnit || ""),
        craftedHighCount: document.querySelector(".crafted-bouquet")?.dataset.highCount || "",
        craftedBindingPhase: (() => {
          const binding = document.querySelector(".crafted-binding");
          const rect = binding?.getBoundingClientRect();
          const style = binding ? getComputedStyle(binding) : null;
          return rect ? {
            width: rect.width,
            height: rect.height,
            opacity: Number(style.opacity),
            animationName: style.animationName
          } : null;
        })(),
        craftedBloomAnimationNames: [...new Set(Array.from(document.querySelectorAll(
          ".crafted-bouquet .crafted-flower-bloom"
        )).map((unit) => getComputedStyle(unit).animationName))],
        craftedBloomFilters: Array.from(document.querySelectorAll(
          ".crafted-bouquet .crafted-flower-bloom"
        )).map((unit) => getComputedStyle(unit).filter),
        cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
        tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
        tutorialVisible: visible(document.querySelector("#tutorialPanel")),
        floatingCommands: [
          ["tutorialPanel", document.querySelector("#tutorialPanel")],
          ["firstSwapCue", document.querySelector("#firstSwapCue")],
          ["nextOrderCue", document.querySelector("#nextOrderCue")]
        ].filter(([, node]) => visible(node)).map(([id]) => id),
        liveRegionOwners: Array.from(document.querySelectorAll("[aria-live]"))
          .filter((node) => visible(node) && ["polite", "assertive"].includes(node.getAttribute("aria-live")))
          .map((node) => ({ id: node.id, live: node.getAttribute("aria-live") })),
        geometry: {
          title: visibleRect(document.querySelector(".title")),
          coins: visibleRect(document.querySelector("#coinBalance")),
          bouquet: visibleRect(document.querySelector("#bouquetTrophy")),
          greenhouse: visibleRect(document.querySelector(".restoration-scene")),
          transaction: visibleRect(document.querySelector("#payoffTransaction"))
        },
        actionLikeControls: Array.from(document.querySelectorAll(
          "button, a[href], input, select, textarea, summary, [role='button'], [tabindex]"
        ))
          .filter((node) => !node.closest(".board") && visible(node))
          .map((node) => ({
            id: node.id || "",
            kind: node.tagName.toLowerCase(),
            text: visibleText(node) || node.getAttribute("aria-label") || node.getAttribute("title") || ""
          })),
        sharedHudText: [
          "#objective",
          "#bouquetProgress",
          "#mobileGreenhouseProgress",
          "#heroRestorationDial",
          "#firstSwapCue",
          "#tutorialPanel",
          "#nextOrderCue",
          "#activeOrders",
          "#ritualLog",
          "#roundOneRestoration",
          "#roundCeremony"
        ].map((selector) => ({
          selector,
          text: visibleText(document.querySelector(selector))
        })).filter((entry) => entry.text)
      });
      return true;
    };
    if (capture()) return;
    observer = new MutationObserver(capture);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-final-harvest-phase"]
    });
  }));
  await page.screenshot({ path: `${evidencePrefix}-transfer.png` });
  const handoff = await handoffSnapshotPromise;
  expect(handoff.finalHarvestPhase, `${evidencePrefix} exact identity handoff phase`).toBe("ceremony");
  expect(handoff.craftedBouquetComposition, `${evidencePrefix} ceremony keeps bouquet identity`)
    .toBe(state.finalHarvestComposition);
  expect(handoff.craftedBouquetUnitKeys, `${evidencePrefix} handoff keeps every ordered earned unit`)
    .toEqual(state.liveBouquetUnitKeys);
  expect(handoff.craftedStemUnitKeys, `${evidencePrefix} handoff keeps one support for every earned unit`)
    .toEqual(state.liveBouquetUnitKeys);
  if (state.liveBouquetUnitKeys.length >= 24) {
    expect(handoff.craftedHighCount, `${evidencePrefix} high-count binding uses its scoped physical contract`)
      .toBe("true");
    expect(handoff.craftedBloomAnimationNames, `${evidencePrefix} handoff never invokes the generic glow animation`)
      .not.toContain("crafted-bloom-bind");
    expect(handoff.craftedBloomFilters.every((filter) => !/drop-shadow\([^)]*12px/.test(filter)),
      `${evidencePrefix} binding does not rebuild a per-head glow cloud`).toBe(true);
    expect(handoff.craftedBindingPhase, `${evidencePrefix} shared knot exists through binding`).not.toBeNull();
    expect(handoff.craftedBindingPhase.width, `${evidencePrefix} shared knot remains visible through binding`)
      .toBeGreaterThanOrEqual(42);
    expect(handoff.craftedBindingPhase.height, `${evidencePrefix} shared knot remains material through binding`)
      .toBeGreaterThanOrEqual(24);
    expect(handoff.craftedBindingPhase.opacity, `${evidencePrefix} shared knot never collapses during binding`)
      .toBeGreaterThanOrEqual(.7);
    expect(handoff.craftedBindingPhase.animationName, `${evidencePrefix} knot never invokes the generic collapsing motion`)
      .not.toBe("bouquet-vine-bind");
  }
  expect(handoff.tutorialVisible, `${evidencePrefix} binding suppresses the shared narrator`).toBe(false);
  expect(handoff.tutorialCopy, `${evidencePrefix} binding has no hidden narrator copy`).toBe("");
  expect(handoff.floatingCommands, `${evidencePrefix} binding has no floating command surface`).toEqual([]);
  expect(handoff.liveRegionOwners, `${evidencePrefix} binding ceremony owns live narration`).toEqual([{
    id: "roundOneRestoration",
    live: "polite"
  }]);
  expect(
    rectanglesOverlap(handoff.geometry.title, handoff.geometry.coins),
    `${evidencePrefix} binding keeps title and wallet separate`
  ).toBe(false);
  expectTransientFinalHarvestAuthority(handoff, `${evidencePrefix} handoff`);
  const bindingPeakDelay = !state.reducedMotion && state.liveBouquetUnitKeys.length >= 24 ? 390 : 0;
  if (bindingPeakDelay) {
    await page.waitForTimeout(390);
  }
  if (state.liveBouquetUnitKeys.length >= 24) {
    const bindingPeak = await page.evaluate(() => {
      const binding = document.querySelector(".crafted-binding");
      return {
        scrollY,
        bloomAnimationNames: [...new Set(Array.from(document.querySelectorAll(
          ".crafted-bouquet .crafted-flower-bloom"
        )).map((unit) => getComputedStyle(unit).animationName))],
        bloomFilters: Array.from(document.querySelectorAll(
          ".crafted-bouquet .crafted-flower-bloom"
        )).map((unit) => getComputedStyle(unit).filter),
        knotAnimationName: binding ? getComputedStyle(binding).animationName : ""
      };
    });
    if (state.reducedMotion) {
      expect(bindingPeak.bloomAnimationNames.every((name) => ["none", "order-pulse"].includes(name)),
        `${evidencePrefix} reduced binding has no moving crafted-head animation`).toBe(true);
    } else {
      expect(bindingPeak.bloomAnimationNames, `${evidencePrefix} visible binding peak uses restrained head motion`)
        .toEqual(["crafted-high-count-bloom-bind"]);
    }
    expect(bindingPeak.bloomFilters.every((filter) => !/drop-shadow\([^)]*12px/.test(filter)),
      `${evidencePrefix} visible binding peak keeps glow below head silhouettes`).toBe(true);
    expect(bindingPeak.knotAnimationName, `${evidencePrefix} visible binding peak keeps one physical knot`)
      .toBe(state.reducedMotion ? "none" : "crafted-high-count-knot-bind");
    expect(bindingPeak.scrollY, `${evidencePrefix} binding keeps the complete ceremony in view`).toBe(0);
  }
  await page.screenshot({ path: `${evidencePrefix}-binding.png`, fullPage: true });
  await page.locator("#roundOneRestoration").waitFor({ state: "visible", timeout: 5000 });
  await page.waitForFunction(() => !document.body.dataset.finalHarvestPhase, null, { timeout: 2500 });
  // The visibility edge can coincide with Chromium's view-transition snapshot.
  // Wait for that named transition and the bouquet seal to release before
  // keeping settled ceremony evidence.
  await page.waitForTimeout(bindingPeakDelay ? 440 : 850);
  const settled = {
    ...(await journeyState(page)),
    ...(await finalHarvestAuthorityState(page))
  };
  expect(settled.finalHarvestPhase, `${evidencePrefix} transient phase clears`).toBe("");
  expect(settled.finalHarvestTransientNodes, `${evidencePrefix} transient nodes clear`).toBe(0);
  expect(settled.cue, `${evidencePrefix} landing copy clears`).not.toBe("Final flowers landing.");
  expect(settled.roundComplete).toBe(true);
  expect(settled.craftedBouquetComposition, `${evidencePrefix} actionable ceremony keeps bouquet identity`)
    .toBe(state.finalHarvestComposition);
  expect(settled.craftedBouquetUnitKeys, `${evidencePrefix} actionable ceremony keeps every ordered earned unit`)
    .toEqual(state.liveBouquetUnitKeys);
  expect(settled.craftedStemUnitKeys, `${evidencePrefix} actionable ceremony keeps every converging support`)
    .toEqual(state.liveBouquetUnitKeys);
  expect(settled.tiles).toBe(64);
  expect(settled.overflowX).toBe(false);
  expect(settled.brokenImages).toEqual([]);
  await page.screenshot({ path: `${evidencePrefix}-ceremony.png`, fullPage: true });
  console.log(`${evidencePrefix} authority trace: ${JSON.stringify({
    eligible: {
      cue: state.cue,
      cuePresentation: state.cuePresentation,
      controls: state.actionLikeControls,
      hud: state.sharedHudText
    },
    landing: {
      cue: landing.cue,
      controls: landing.actionLikeControls,
      hud: landing.sharedHudText
    },
    handoff: {
      cue: handoff.cue,
      controls: handoff.actionLikeControls,
      hud: handoff.sharedHudText
    },
    settled: {
      controls: settled.actionLikeControls,
      hud: settled.sharedHudText
    }
  })}`);
  return settled;
}

async function spendPrimaryCeremonyAction(page, activation = "pointer") {
  await page.waitForSelector("#roundOneRestoration button:not([hidden])", { timeout: 5000 });
  const button = page.locator("#roundOneRestoration button:not([hidden])");
  await expect(button).toBeEnabled({ timeout: 2000 });
  const text = (await button.textContent()).trim();
  if (activation === "keyboard") {
    await expect(button).toBeFocused();
    await page.keyboard.press("Enter");
  } else if (activation === "touch") {
    await button.tap();
  } else {
    await button.click();
  }
  await page.waitForTimeout(650);
  return text;
}

async function spendFreshConservatoryWithTransferReload(page, activation = "pointer") {
  const button = page.getByRole("button", { name: "Raise Conservatory · 180 coins", exact: true });
  await expect(button).toBeEnabled({ timeout: 2000 });
  if (activation === "touch") {
    await button.tap();
  } else {
    await button.click();
  }
  await page.waitForFunction(() => {
    const panel = document.querySelector("#roundOneRestoration");
    const state = JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}");
    return panel?.dataset.restorationPhase === "transforming"
      && panel?.dataset.bouquetTransfer === "active"
      && state.freshConservatorySettlement === true;
  });
  const interrupted = await journeyState(page);
  expect(interrupted.coins).toBe(50);
  expect(interrupted.freshConservatorySettlement).toBe(true);
  expect(interrupted.visibleButtons).toEqual([]);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  return "Raise Conservatory · 180 coins";
}

async function installOwnedRenewalRecorder(page) {
  await page.evaluate(() => {
    const previous = window.__ownedRenewalRecorder;
    previous?.observer?.disconnect();
    if (previous?.interval) clearInterval(previous.interval);
    const samples = [];
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return !node.hidden
        && style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const sample = () => {
      const panel = document.querySelector("#roundOneRestoration");
      const renewal = document.querySelector("#ownedReplayRenewal");
      const scene = document.querySelector(".restoration-scene");
      const ingredients = Array.from(renewal?.querySelectorAll(".owned-renewal-ingredient") || []);
      const savedState = JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}");
      const liveRegions = Array.from(document.querySelectorAll("[aria-live]"))
        .filter(visible)
        .map((node) => {
          const clone = node.cloneNode(true);
          clone.querySelectorAll("[aria-hidden='true'], [hidden]").forEach((hiddenNode) => hiddenNode.remove());
          return {
            id: node.id,
            live: node.getAttribute("aria-live"),
            text: clone.textContent.replace(/\s+/g, " ").trim()
          };
        });
      const liveRegionOwners = liveRegions.filter((region) => ["polite", "assertive"].includes(region.live));
      samples.push({
        at: performance.now(),
        roundComplete: Boolean(savedState.roundComplete),
        armedRelic: Boolean(savedState.armedLineRelic),
        blackCandleActivationPhase: document.body.dataset.blackCandleActivationPhase || "",
        phase: panel?.dataset.ownedRenewalPhase || "",
        renewalPhase: renewal?.dataset.renewalPhase || "",
        topCue: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
        tutorialVisible: visible(document.querySelector("#tutorialPanel")),
        tutorialIcon: document.querySelector("#tutorialPanel .tutorial-icon")?.textContent.trim() || "",
        tutorialIconAriaHidden: document.querySelector("#tutorialPanel .tutorial-icon")?.getAttribute("aria-hidden") || "",
        blackCandleTutorial: document.querySelector("#tutorialPanel")?.classList.contains("black-candle-tutorial") || false,
        liveRegions,
        liveRegionOwners,
        actionCount: Array.from(panel?.querySelectorAll("button") || []).filter(visible).length,
        transactionVisible: document.querySelector("#payoffTransaction")?.style.visibility !== "hidden"
          && visible(document.querySelector("#payoffTransaction")),
        state: document.querySelector("#restorationState")?.textContent.trim() || "",
        ingredientIds: ingredients.map((node) => Number(node.dataset.flowerId)),
        targetCounts: ingredients.map((node) => Number(node.dataset.requiredCount)),
        ingredientImagesLoaded: ingredients.every((node) => {
          const image = node.querySelector("img");
          return Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
        }),
        responseVisible: visible(renewal?.querySelector(".owned-renewal-response")),
        raisedArtVisible: visible(scene?.querySelector(".greenhouse-art-restored")),
        lowerArtVisible: visible(scene?.querySelector(".greenhouse-art-withered")),
        transientNodes: renewal?.querySelectorAll(".owned-renewal-ingredient, .owned-renewal-response, .owned-renewal-window").length || 0,
        renewalHidden: renewal?.hidden ?? true
      });
    };
    const panel = document.querySelector("#roundOneRestoration");
    const observer = new MutationObserver(sample);
    observer.observe(panel, { attributes: true, childList: true, subtree: true });
    const interval = setInterval(sample, 16);
    window.__ownedRenewalRecorder = { observer, interval, samples, sample };
    sample();
  });
}

async function collectOwnedRenewalRecorder(page) {
  return page.evaluate(() => {
    const recorder = window.__ownedRenewalRecorder;
    if (!recorder) return [];
    recorder.sample();
    recorder.observer.disconnect();
    clearInterval(recorder.interval);
    delete window.__ownedRenewalRecorder;
    return recorder.samples;
  });
}

async function playCurrentRound(page, label, round, strategy = "optimized", expectedOwnedStage = 0, options = {}) {
  const start = await journeyState(page);
  const startMoves = start.moves;
  let swaps = 0;
  let attempts = 0;
  await expectGreenhouseOwned(page, expectedOwnedStage, `${label} round ${round} before swaps`);
  while (true) {
    const state = await journeyState(page);
    if (state.roundComplete) {
      if (options.captureOwnedRenewal) {
        const firstPhase = options.reducedMotion ? "acknowledgment" : "transfer";
        try {
          await page.waitForFunction((phase) => (
            document.querySelector("#roundOneRestoration")?.dataset.ownedRenewalPhase === phase
            || window.__ownedRenewalRecorder?.samples?.some((sample) => sample.phase === phase)
          ), firstPhase, { timeout: 3500 });
        } catch (error) {
          const diagnostic = await page.evaluate(() => ({
            current: document.querySelector("#roundOneRestoration")?.dataset.ownedRenewalPhase || "",
            phases: [...new Set(
              (window.__ownedRenewalRecorder?.samples || []).map((sample) => sample.phase).filter(Boolean)
            )],
            finalHarvestPhase: document.body.dataset.finalHarvestPhase || "",
            bouquetSealed: document.querySelector("#roundOneRestoration")?.classList.contains("bouquet-sealed")
          }));
          throw new Error(
            `${label} round ${round} never reached ${firstPhase}: ${JSON.stringify(diagnostic)}; ${error.message}`
          );
        }
        await page.waitForTimeout(options.reducedMotion ? 80 : 460);
        await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
        if (!options.reducedMotion && [1, 3].includes(round)) {
          await page.locator("#roundOneRestoration").screenshot({
            path: `${options.evidencePrefix}-round${round}-transfer.png`
          });
        }
        if (!options.reducedMotion) {
          await page.waitForFunction(() => (
            document.querySelector("#roundOneRestoration")?.dataset.ownedRenewalPhase === "renewal"
            || window.__ownedRenewalRecorder?.samples?.some((sample) => sample.phase === "renewal")
          ), null, { timeout: 2200 });
          await page.waitForTimeout(420);
          await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
        }
        if ([1, 3].includes(round)) {
          await page.locator("#roundOneRestoration").screenshot({
            path: `${options.evidencePrefix}-round${round}-${options.reducedMotion ? "acknowledgment" : "peak"}.png`
          });
        }
        await page.waitForFunction(() => (
          document.querySelector("#roundOneRestoration")?.dataset.ownedRenewalPhase === "settled"
        ), null, { timeout: 2500 });
      }
      // Any focused round may naturally finish on a Black Candle. Sample
      // completion economy only after its presentation-only burn/refill has
      // yielded to the existing one-action ceremony.
      await page.locator("#roundOneRestoration").waitFor({ state: "visible", timeout: 4000 });
      await expect(page.locator("body")).not.toHaveAttribute(
        "data-black-candle-activation-phase",
        /.+/,
        { timeout: 4000 }
      );
      const settledState = await journeyState(page);
      const summary = {
        round,
        startMoves,
        movesLeft: settledState.moves,
        swaps: startMoves - settledState.moves,
        bouquet: settledState.bouquet,
        greenhouse: settledState.greenhouse,
        cue: settledState.cue
      };
      await page.screenshot({ path: `work/first-three-${label}-round${round}-complete.png`, fullPage: true });
      return summary;
    }
    expect(state.moves, `${label} round ${round} has moves remaining`).toBeGreaterThan(0);
    await clickGuidedSwap(page, strategy);
    await expectGreenhouseOwned(page, expectedOwnedStage, `${label} round ${round} after swap ${swaps + 1}`);
    attempts += 1;
    swaps = startMoves - (await journeyState(page)).moves;
    expect(attempts, `${label} round ${round} should not drag`).toBeLessThanOrEqual(10);
  }
}

async function playFirstThree(page, config, seed, strategy) {
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

  await page.setViewportSize(config.viewport);
  const runLabel = `${config.label}-${strategy}-${seed}`;
  await openFresh(page, seed, runLabel);
  await assertActiveBoard(page, config.mobile);

  const results = await playFocusedCycle(page, config, runLabel, strategy);

  const finalState = await journeyState(page);
  expect(finalState.round).toBe(1);
  expect(finalState.coins).toBe(50);
  expect(finalState.focusedEconomyVersion).toBe(2);
  expect(finalState.tiles).toBe(64);
  expect(finalState.overflowX).toBe(false);
  expect(finalState.brokenImages).toEqual([]);
  await expectPermanentRaisedGreenhouse(page, `${runLabel} replay handoff ownership`);
  await page.screenshot({ path: `work/first-three-${runLabel}-replay.png`, fullPage: true });
  expect(consoleMessages).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  return { runLabel, results };
}

async function playFocusedCycle(page, config, runLabel, strategy, options = {}) {
  const results = [];
  for (let round = 1; round <= 3; round += 1) {
    const expectedOwnedBeforeSpend = round - 1;
    const startCoins = (await journeyState(page)).coins;
    await expectVisibleCoinBalance(page, startCoins);
    await expectGreenhouseOwned(page, expectedOwnedBeforeSpend, `${runLabel} round ${round} active start`);
    const result = await playCurrentRound(page, runLabel, round, strategy, expectedOwnedBeforeSpend);
    await expectGreenhouseOwned(page, expectedOwnedBeforeSpend, `${runLabel} round ${round} pending reward`);
    const pendingState = await journeyState(page);
    expectFocusedPayoffNarration(pendingState, `${runLabel} round ${round} pending spend`);
    const earnedCoins = pendingState.coins;
    await expectVisibleCoinBalance(page, earnedCoins, { pulsing: true });
    const firstAction = round === 3 && options.interruptFreshConservatoryTransfer
      ? await spendFreshConservatoryWithTransferReload(
          page,
          config.mobile ? "touch" : "pointer"
        )
      : await spendPrimaryCeremonyAction(page);
    if (round === 3) {
      await page.waitForSelector("#nextOrderBtn:not([hidden])", { timeout: 3000 });
    }
    const spentState = await journeyState(page);
    expectFocusedPayoffNarration(spentState, `${runLabel} round ${round} spent ceremony`);
    await expectGreenhouseOwned(page, round, `${runLabel} round ${round} immediately after spend`);
    await expectVisibleCoinBalance(page, spentState.coins, { pulsing: round === 3 ? false : true });
    result.balances = [startCoins, earnedCoins, spentState.coins];

    if (round === 3 && options.evidencePrefix) {
      expect(spentState.payoffTransaction).toBe(`Raised for 180. ${spentState.coins} coins remain.`);
      expect(spentState.payoffCopy).toBe("Begin a new growing cycle with your balance intact.");
      expect(spentState.visibleButtons).toEqual(["Play Again → First Bouquet"]);
      await expect(page.getByRole("button", { name: "Play Again → First Bouquet", exact: true })).toBeFocused();
      const transactionBox = await page.locator("#payoffTransaction").boundingBox();
      expect((transactionBox?.y || 0) + (transactionBox?.height || 0)).toBeLessThanOrEqual(config.viewport.height);
      await page.screenshot({ path: `${options.evidencePrefix}-owned-balance.png`, fullPage: true });
    }
    if (round === 3 && options.verifyFreshConservatoryReloads) {
      expect(spentState.freshConservatorySettlement).toBe(true);
      for (let reload = 0; reload < 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator(".tile")).toHaveCount(64);
        const reloaded = await journeyState(page);
        expect(reloaded.freshConservatorySettlement, `fresh conservatory reload ${reload + 1} keeps first-settlement authority`).toBe(true);
        expect(reloaded.coins, `fresh conservatory reload ${reload + 1} keeps the settled wallet`).toBe(50);
        expect(reloaded.payoffTransaction).toBe("Raised for 180. 50 coins remain.");
        expect(reloaded.payoffCopy).toBe("Begin a new growing cycle with your balance intact.");
        expect(reloaded.payoffMode).toBe("restoration");
        expect(reloaded.visibleButtons).toEqual(["Play Again → First Bouquet"]);
        expect(reloaded.craftedTargetCounts).toBe("3:14,0:13");
        expect(reloaded.craftedComposition).toHaveLength(27);
        expect(reloaded.tiles).toBe(64);
        expect(reloaded.tileAriaRows).toBe(8);
        expect(reloaded.overflowX).toBe(false);
        expect(reloaded.brokenImages).toEqual([]);
        await expect(page.getByRole("button", { name: "Play Again → First Bouquet", exact: true })).toBeFocused();
      }
    }
    if (round === 1 && options.verifyRestoredRoundOne) {
      const expectedRestoredCoins = startCoins + 20;
      expect(spentState.coins).toBe(expectedRestoredCoins);
      await page.screenshot({ path: `${options.evidencePrefix}-round1-restored-${expectedRestoredCoins}.png`, fullPage: true });
      for (let reload = 0; reload < 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator(".tile")).toHaveCount(64);
        const reloaded = await journeyState(page);
        expectFocusedPayoffNarration(reloaded, `${runLabel} round 1 restored reload ${reload + 1}`);
        expect(reloaded.coins, `replayed Round 1 reload ${reload + 1}`).toBe(expectedRestoredCoins);
        expect(reloaded.focusedEconomyVersion).toBe(2);
        expect(reloaded.payoffTransaction).toBe(`Restored for 100. ${expectedRestoredCoins} coins remain.`);
        expect(reloaded.visibleButtons).toEqual(["Next Order → Moonlit Wreath"]);
        await expectGreenhouseOwned(page, 1, `${runLabel} round 1 restored reload ${reload + 1}`);
      }
    }

    if (round === 3 && options.stopBeforeReplay) {
      result.actions = [firstAction];
      results.push(result);
      break;
    }
    const secondAction = await spendPrimaryCeremonyAction(
      page,
      round === 3 ? options.replayActivation : "pointer"
    );
    const advancedCoins = (await journeyState(page)).coins;
    await expectGreenhouseOwned(page, round === 3 ? 3 : round, `${runLabel} round ${round} after primary next action`);
    if (round === 3) {
      await page.waitForFunction(() => !document.querySelector("#coinBalance")?.classList.contains("balance-pulse"));
    }
    await expectVisibleCoinBalance(page, advancedCoins, { pulsing: round === 3 ? false : undefined });
    result.balances.push(advancedCoins);
    result.actions = [firstAction, secondAction];
    results.push(result);
    if (round < 3) {
      await expect(page.locator(".tile")).toHaveCount(64);
      await assertActiveBoard(page, config.mobile);
      await expectGreenhouseOwned(page, round, `${runLabel} round ${round + 1} active handoff`);
    }
  }
  return results;
}

async function reloadAndExpectActiveReplayBalance(page, config, expectedCoins, expectedHintedTiles = 2) {
  for (let reload = 0; reload < 2; reload += 1) {
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".tile")).toHaveCount(64);
    const state = await journeyState(page);
    expect(state.round).toBe(1);
    expect(state.roundComplete).toBe(false);
    expect(state.coins).toBe(expectedCoins);
    expect(state.focusedEconomyVersion).toBe(2);
    expect(state.replayEntryActive, `replay reload ${reload + 1} settles the bounded acknowledgment`).toBe(false);
    expect(state.handoffCueVisible, `replay reload ${reload + 1} does not resurrect renewal cue`).toBe(false);
    expect(state.hintedTiles, `replay reload ${reload + 1} preserves settled guidance authority`)
      .toBe(expectedHintedTiles);
    const expectedCue = expectedHintedTiles === 2
      ? /Thorn Rose next|Swap the glowing pair/
      : /Find 3 Thorn Roses/;
    expect(state.cue, `replay reload ${reload + 1} has one clear instruction`).toMatch(expectedCue);
    expect(state.cue).not.toMatch(/coins kept|Conservatory owned|New order ready/);
    expect(state.rewardPromise).toBe("Nourish 120 · Keep 50");
    await expectVisibleCoinBalance(page, expectedCoins, { pulsing: false });
    await expectPermanentRaisedGreenhouse(page, `replay reload ${reload + 1}`);
    await assertActiveBoard(page, config.mobile);
  }
}

async function failAndRetryOwnedReplayRoundOne(page, config, expectedCoins, runLabel) {
  await page.evaluate(({ key, coins }) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    Object.assign(state, {
      currentRound: 1,
      roundComplete: false,
      moves: 0,
      counts: [0, 6, 0, 0, 0, 5],
      coins,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: true,
      tutorialSkipped: true,
      tutorialActive: false,
      blackCandleLessonComplete: true
    });
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: SAVE_KEY, coins: expectedCoins });

  for (let reload = 0; reload < 2; reload += 1) {
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".tile")).toHaveCount(64);
    const failed = await journeyState(page);
    expect(failed.round).toBe(1);
    expect(failed.roundComplete).toBe(false);
    expect(failed.moves).toBe(0);
    expect(failed.coins).toBe(expectedCoins);
    expect(failed.visibleButtons).toEqual(["Retry Bouquet"]);
    expect(failed.replayEntryActive, "failure does not resurrect replay entry").toBe(false);
    expect(failed.handoffCueVisible, "failure has no detached replay receipt").toBe(false);
    expect(failed.cue).not.toMatch(/coins kept|Conservatory owned|New order ready/);
    expect(failed.rewardPromise).toBe("Nourish 120 · Keep 50");
    expect(failed.ownedRenewalHidden, "failure has no owned-renewal overlay").toBe(true);
    expect(failed.ownedRenewalTransientNodes, "failure has no owned-renewal debris").toBe(0);
    await expectPermanentRaisedGreenhouse(page, `${runLabel} failed replay reload ${reload + 1}`);
    await expectVisibleCoinBalance(page, expectedCoins, { pulsing: false });
    await assertActiveBoard(page, config.mobile);
  }

  const retryButton = page.getByRole("button", { name: "Retry Bouquet", exact: true });
  if (config.mobile) {
    await retryButton.tap();
  } else {
    await retryButton.click();
  }
  await page.waitForFunction(() => Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled), null, {
    timeout: 5000
  });
  const retried = await journeyState(page);
  expect(retried.round).toBe(1);
  expect(retried.roundComplete).toBe(false);
  expect(retried.moves).toBe(6);
  expect(retried.counts).toEqual([0, 0, 0, 0, 0, 0]);
  expect(retried.coins).toBe(expectedCoins);
  expect(retried.hintedTiles).toBe(2);
  expect(retried.visibleButtons).not.toContain("Retry Bouquet");
  expect(retried.replayEntryActive, "Retry does not resurrect replay entry").toBe(false);
  expect(retried.handoffCueVisible, "Retry has no detached replay receipt").toBe(false);
  expect(retried.cue).not.toMatch(/coins kept|Conservatory owned|New order ready/);
  expect(retried.rewardPromise).toBe("Nourish 120 · Keep 50");
  expect(retried.ownedRenewalHidden, "Retry clears owned-renewal overlay").toBe(true);
  expect(retried.ownedRenewalTransientNodes, "Retry clears owned-renewal debris").toBe(0);
  await expectPermanentRaisedGreenhouse(page, `${runLabel} retried replay`);
  await assertActiveBoard(page, config.mobile);
}

async function playOwnedReplayCycle(page, config, runLabel, strategy) {
  const expectedRewards = [120, 150, 180];
  const expectedStarts = [50, 50, 50];
  const expectedActions = [
    "Next Order → Moonlit Wreath",
    "Next Order → Bloodroot Compact",
    "Play Again → First Bouquet"
  ];
  const expectedTitles = [
    "First Bouquet Complete",
    "Moonlit Wreath Complete",
    "Bloodroot Compact Complete"
  ];
  const expectedNames = ["First Bouquet", "Moonlit Wreath", "Bloodroot Compact"];
  const expectedCompositions = ROUND_COMPOSITIONS;
  const expectedTargetCounts = ["5:8,1:6", "2:10,4:9,5:7", "3:14,0:13"];
  const expectedCopies = [
    "Bouquet complete. The raised conservatory remains yours.",
    "Bouquet complete. The raised conservatory remains yours.",
    "Bouquet complete. The raised conservatory remains yours."
  ];
  const results = [];

  for (let round = 1; round <= 3; round += 1) {
    const startCoins = (await journeyState(page)).coins;
    expect(startCoins, `${runLabel} round ${round} starting wallet`).toBe(expectedStarts[round - 1]);
    await expectVisibleCoinBalance(page, startCoins);
    await expectPermanentRaisedGreenhouse(page, `${runLabel} round ${round} active start`);
    await installOwnedRenewalRecorder(page);
    let result;
    let renewalSamples;
    try {
      result = await playCurrentRound(page, runLabel, round, strategy, 3, {
        captureOwnedRenewal: true,
        reducedMotion: config.reducedMotion,
        evidencePrefix: `work/replay-renewal-${config.label}`
      });
    } finally {
      renewalSamples = await collectOwnedRenewalRecorder(page);
    }
    const bindingSampleIndex = renewalSamples.findIndex((sample) => sample.phase === "binding");
    expect(bindingSampleIndex, `${runLabel} round ${round} recorder started before authoritative completion`).toBeGreaterThanOrEqual(0);
    const phaseSamples = renewalSamples.slice(bindingSampleIndex).filter((sample) => sample.phase);
    const phases = [...new Set(phaseSamples.map((sample) => sample.phase))];
    expect(phases, `${runLabel} round ${round} bounded renewal phases`).toEqual(config.reducedMotion
      ? ["binding", "acknowledgment", "settled"]
      : ["binding", "transfer", "renewal", "settled"]);
    const transientSamples = phaseSamples.filter((sample) => sample.phase !== "settled");
    expect(transientSamples.length, `${runLabel} round ${round} sampled transient ceremony`).toBeGreaterThan(0);
    expect(
      phaseSamples.every((sample) => sample.topCue === "" && !sample.tutorialVisible),
      `${runLabel} round ${round} ceremony phases suppress the shared narrator`
    ).toBe(true);
    expect(
      phaseSamples.every((sample) => (
        sample.tutorialIcon !== "BLACK CANDLE"
        && sample.tutorialIconAriaHidden === "true"
        && !sample.blackCandleTutorial
      )),
      `${runLabel} round ${round} completed bouquet outranks retained Black Candle narration`
    ).toBe(true);
    expect(
      phaseSamples.every((sample) => (
        sample.liveRegionOwners.length === 1
        && sample.liveRegionOwners[0].id === "roundOneRestoration"
        && sample.liveRegionOwners[0].live === "polite"
      )),
      `${runLabel} round ${round} ceremony keeps one authoritative live owner`
    ).toBe(true);
    const invalidPayoffOwnershipSamples = phaseSamples.filter((sample) => {
      const coinRegion = sample.liveRegions.find((region) => region.id === "coinBalance");
      const ceremonyRegion = sample.liveRegions.find((region) => region.id === "roundOneRestoration");
      return coinRegion?.live !== "off"
        || ceremonyRegion?.live !== "polite"
        || sample.liveRegionOwners.length !== 1
        || sample.liveRegionOwners[0]?.id !== "roundOneRestoration"
        || sample.liveRegionOwners[0]?.live !== "polite";
    });
    expect(
      invalidPayoffOwnershipSamples.map((sample) => ({
        phase: sample.phase,
        blackCandleActivationPhase: sample.blackCandleActivationPhase,
        liveRegions: sample.liveRegions
      })),
      `${runLabel} round ${round} keeps the wallet quiet and ceremony as the sole polite owner`
    ).toEqual([]);
    expect(transientSamples.every((sample) => sample.actionCount === 0), "no action during binding/renewal").toBe(true);
    expect(transientSamples.every((sample) => !sample.transactionVisible), "reward display waits for renewal").toBe(true);
    expect(transientSamples.every((sample) => sample.raisedArtVisible && !sample.lowerArtVisible), "raised art remains truthful").toBe(true);
    const ingredientSamples = phaseSamples.filter((sample) => ["transfer", "renewal", "acknowledgment"].includes(sample.phase));
    expect(ingredientSamples.length, `${runLabel} round ${round} sampled authoritative ingredient transfer`).toBeGreaterThan(0);
    expect(ingredientSamples.every((sample) => JSON.stringify(sample.ingredientIds) === JSON.stringify(expectedCompositions[round - 1])), "transfer follows trophy composition").toBe(true);
    expect(ingredientSamples.every((sample) => sample.ingredientImagesLoaded), "transfer images load local pixels").toBe(true);
    const expectedTransientNodes = expectedCompositions[round - 1].length + 4;
    expect(
      ingredientSamples.every((sample) => sample.transientNodes === expectedTransientNodes),
      "renewal node count stays fixed at one ingredient per earned unit plus four response nodes"
    ).toBe(true);
    expect(ingredientSamples.some((sample) => sample.responseVisible), "owned greenhouse gives one visible renewal response").toBe(true);
    const firstTransientAt = transientSamples[0].at;
    const settledSample = phaseSamples.find((sample) => sample.phase === "settled");
    const completionSample = renewalSamples.find((sample) => sample.roundComplete);
    expect(completionSample, `${runLabel} round ${round} records authoritative completion`).toBeTruthy();
    const completionToAction = settledSample.at - completionSample.at;
    const blackCandlePresentationObserved = renewalSamples.some((sample) => sample.blackCandleActivationPhase);
    const completionPacingLimit = config.reducedMotion
      ? blackCandlePresentationObserved ? 1000 : 700
      : blackCandlePresentationObserved ? 3150 : 2400;
    const phaseTransitions = phaseSamples.filter((sample, index, samples) => (
      index === 0 || sample.phase !== samples[index - 1].phase
    )).map((sample) => ({
      phase: sample.phase,
      elapsed: Math.round(sample.at - completionSample.at)
    }));
    const largestSampleGap = renewalSamples.slice(1).reduce((largest, sample, index) => (
      Math.max(largest, sample.at - renewalSamples[index].at)
    ), 0);
    console.log(`${runLabel} round ${round} pacing diagnostic: ${JSON.stringify({
      completionToAction: Math.round(completionToAction),
      blackCandlePresentationObserved,
      phaseTransitions,
      largestSampleGap: Math.round(largestSampleGap)
    })}`);
    expect(
      completionToAction,
      `${runLabel} round ${round} completion-to-action stays inside the focused pacing contract`
    ).toBeLessThanOrEqual(completionPacingLimit);
    if (!config.reducedMotion) {
      const transferSample = phaseSamples.find((sample) => sample.phase === "transfer");
      const intakeDuration = settledSample.at - transferSample.at;
      expect(
        intakeDuration,
        `${runLabel} round ${round} ingredient transfer and greenhouse response remain readable`
      ).toBeGreaterThanOrEqual(900);
      expect(
        intakeDuration,
        `${runLabel} round ${round} ingredient transfer and greenhouse response stay concise`
      ).toBeLessThanOrEqual(1300);
      result.ownedRenewalTiming = {
        completionToAction: Math.round(completionToAction),
        intakeDuration: Math.round(intakeDuration)
      };
    } else {
      result.ownedRenewalTiming = {
        completionToAction: Math.round(completionToAction)
      };
    }
    result.retainedArmedRelicAtCompletion = phaseSamples.some((sample) => sample.armedRelic);
    expect(settledSample.topCue, `${runLabel} round ${round} settled action has no duplicate cue`).toBe("");
    expect(settledSample.transientNodes, "settled ceremony removes all transient descendants").toBe(0);
    expect(settledSample.renewalHidden, "settled ceremony hides transient host").toBe(true);
    const rewardBalance = OWNED_REPLAY_SEED_BALANCE;
    const ceremony = await journeyState(page);
    expectFocusedPayoffNarration(
      ceremony,
      `${runLabel} round ${round} owned settled ceremony`
    );
    expect(ceremony.activeElementId, `${runLabel} round ${round} sole action owns focus`).toBe("nextOrderBtn");
    expect(ceremony.coins, `${runLabel} round ${round} reward reinvested once`).toBe(rewardBalance);
    expect(ceremony.payoffTransaction).toBe(ownedReplayTransaction(expectedRewards[round - 1]));
    expect(ceremony.payoffCopy).toBe(expectedCopies[round - 1]);
    expect(ceremony.payoffMode).toBe("owned-replay");
    expect(ceremony.tutorial).toBe("");
    expect(ceremony.tutorialIcon).not.toBe("BLACK CANDLE");
    expect(ceremony.tutorialIconAriaHidden).toBe("true");
    expect(ceremony.blackCandleTutorial).toBe(false);
    expect(ceremony.ownedRenewalPhase).toBe("settled");
    expect(ceremony.ownedRenewalHidden).toBe(true);
    expect(ceremony.ownedRenewalTransientNodes).toBe(0);
    expect(ceremony.restorationTitle).toBe(expectedTitles[round - 1]);
    expect(ceremony.trophyKicker).toBe("Bouquet Complete");
    expect(ceremony.trophyName).toBe(expectedNames[round - 1]);
    expect(ceremony.trophyCopy).toBe("Order complete. The Bloodroot Conservatory remains fully raised.");
    expect(ceremony.craftedComposition).toEqual(expectedCompositions[round - 1]);
    expect(ceremony.craftedTargetCounts).toBe(expectedTargetCounts[round - 1]);
    expect(ceremony.restorationState).toBe("BLOODROOT CONSERVATORY · OWNED · 100% RAISED");
    expect(ceremony.restorationSceneLabel).toBe("Owned Bloodroot Conservatory remains fully raised");
    expect(ceremony.restorationSceneArt).toBe("bloodroot");
    expect(ceremony.restoredSceneArt).toContain("bloodroot_compact_greenhouse.jpg");
    expect(ceremony.witheredSceneArtVisible, "owned replay suppresses lower-stage art").toBe(false);
    expect(ceremony.restoredSceneArtVisible, "owned replay shows raised art").toBe(true);
    expect(ceremony.visibleTransformationLabels, "owned replay has no before/after treatment").toEqual([]);
    expect(ceremony.ceremonyText).not.toMatch(/Greenhouse Restored|Greenhouse Relit|\bBefore\b|\bAfter\b|Restore Greenhouse|Upgrade Greenhouse|Raise Conservatory/i);
    expect(ceremony.visibleButtons).toEqual([expectedActions[round - 1]]);
    expect(ceremony.ceremonyBottom, "owned ceremony fits the first viewport").toBeLessThanOrEqual(config.viewport.height);
    expect(ceremony.transactionBottom, "owned transaction fits the first viewport").toBeLessThanOrEqual(config.viewport.height);
    expect(ceremony.actionBottom, "owned action fits the first viewport").toBeLessThanOrEqual(config.viewport.height);
    await expectPermanentRaisedGreenhouse(page, `${runLabel} round ${round} owned ceremony`);
    await expectVisibleCoinBalance(page, rewardBalance, { pulsing: !config.reducedMotion });
    await page.screenshot({ path: `work/economy-${config.label}-cycle2-round${round}-owned.png`, fullPage: true });

    for (let reload = 0; reload < 2; reload += 1) {
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator(".tile")).toHaveCount(64);
      const reloaded = await journeyState(page);
      expectFocusedPayoffNarration(
        reloaded,
        `${runLabel} round ${round} owned ceremony reload ${reload + 1}`
      );
      expect(reloaded.coins, `${runLabel} round ${round} reward reload ${reload + 1}`).toBe(rewardBalance);
      expect(reloaded.payoffTransaction).toBe(ownedReplayTransaction(expectedRewards[round - 1]));
      expect(reloaded.payoffCopy).toBe(expectedCopies[round - 1]);
      expect(reloaded.payoffMode).toBe("owned-replay");
      expect(reloaded.tutorial).toBe("");
      expect(reloaded.tutorialIcon).not.toBe("BLACK CANDLE");
      expect(reloaded.tutorialIconAriaHidden).toBe("true");
      expect(reloaded.blackCandleTutorial).toBe(false);
      expect(reloaded.ownedRenewalPhase).toBe("settled");
      expect(reloaded.ownedRenewalHidden).toBe(true);
      expect(reloaded.ownedRenewalTransientNodes).toBe(0);
      expect(reloaded.restorationTitle).toBe(expectedTitles[round - 1]);
      expect(reloaded.trophyKicker).toBe("Bouquet Complete");
      expect(reloaded.trophyName).toBe(expectedNames[round - 1]);
      expect(reloaded.trophyCopy).toBe("Order complete. The Bloodroot Conservatory remains fully raised.");
      expect(reloaded.craftedComposition).toEqual(expectedCompositions[round - 1]);
      expect(reloaded.craftedTargetCounts).toBe(expectedTargetCounts[round - 1]);
      expect(reloaded.restorationState).toBe("BLOODROOT CONSERVATORY · OWNED · 100% RAISED");
      expect(reloaded.restorationSceneArt).toBe("bloodroot");
      expect(reloaded.restoredSceneArt).toContain("bloodroot_compact_greenhouse.jpg");
      expect(reloaded.witheredSceneArtVisible).toBe(false);
      expect(reloaded.restoredSceneArtVisible).toBe(true);
      expect(reloaded.visibleTransformationLabels).toEqual([]);
      expect(reloaded.ceremonyText).not.toMatch(/Greenhouse Restored|Greenhouse Relit|\bBefore\b|\bAfter\b|Restore Greenhouse|Upgrade Greenhouse|Raise Conservatory/i);
      expect(reloaded.visibleButtons).toEqual([expectedActions[round - 1]]);
      expect(reloaded.ceremonyBottom).toBeLessThanOrEqual(config.viewport.height);
      expect(reloaded.transactionBottom).toBeLessThanOrEqual(config.viewport.height);
      expect(reloaded.actionBottom).toBeLessThanOrEqual(config.viewport.height);
      await expectPermanentRaisedGreenhouse(page, `${runLabel} round ${round} ceremony reload ${reload + 1}`);
      await expectVisibleCoinBalance(page, rewardBalance, { pulsing: false });
    }

    result.balances = [startCoins, rewardBalance, rewardBalance];
    result.actions = [expectedActions[round - 1]];
    results.push(result);
    if (round < 3) {
      const action = await spendPrimaryCeremonyAction(
        page,
        config.mobile ? "touch" : round === 2 ? "keyboard" : "pointer"
      );
      expect(action).toBe(expectedActions[round - 1]);
      const advanced = await journeyState(page);
      expect(advanced.coins).toBe(rewardBalance);
      await expectPermanentRaisedGreenhouse(page, `${runLabel} round ${round + 1} active handoff`);
      await assertActiveBoard(page, config.mobile);
    }
  }
  expect(
    results.some((result) => result.retainedArmedRelicAtCompletion),
    `${runLabel} naturally retains an armed relic through at least one completed-order ceremony`
  ).toBe(true);
  return results;
}

async function completeOwnedRoundAndReloadDuringPhase(page, config, runLabel, round, phase, strategy) {
  const start = await journeyState(page);
  const startMoves = start.moves;
  let attempts = 0;
  while (!(await journeyState(page)).roundComplete) {
    expect((await journeyState(page)).moves, `${runLabel} round ${round} has moves remaining`).toBeGreaterThan(0);
    await clickGuidedSwap(page, strategy);
    attempts += 1;
    expect(attempts, `${runLabel} round ${round} interruption path should not drag`).toBeLessThanOrEqual(10);
  }

  await page.waitForFunction((expectedPhase) => (
    document.querySelector("#roundOneRestoration")?.dataset.ownedRenewalPhase === expectedPhase
  ), phase, { timeout: 2500 });
  await page.waitForTimeout(32);
  const interrupted = await journeyState(page);
  expectFocusedPayoffNarration(interrupted, `${runLabel} round ${round} ${phase} interruption`);
  expect(interrupted.roundComplete).toBe(true);
  expect(interrupted.ownedRenewalPhase).toBe(phase);
  expect(interrupted.visibleButtons, `${runLabel} round ${round} ${phase} withholds action`).toEqual([]);
  expect(interrupted.payoffTransaction).toBe(ownedReplayTransaction([120, 150, 180][round - 1]));
  await page.screenshot({
    path: `work/replay-renewal-${config.label}-round${round}-${phase}-interrupted.png`,
    fullPage: true
  });

  const interruptedCoins = interrupted.coins;
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  const reloaded = await journeyState(page);
  expectFocusedPayoffNarration(reloaded, `${runLabel} round ${round} ${phase} settled reload`);
  expect(reloaded.round).toBe(round);
  expect(reloaded.roundComplete).toBe(true);
  expect(reloaded.coins, `${runLabel} round ${round} ${phase} reload does not duplicate reward`).toBe(interruptedCoins);
  expect(reloaded.ownedRenewalPhase).toBe("settled");
  expect(reloaded.ownedRenewalHidden).toBe(true);
  expect(reloaded.ownedRenewalTransientNodes).toBe(0);
  expect(reloaded.visibleButtons).toEqual([
    round === 1
      ? "Next Order → Moonlit Wreath"
      : round === 2
        ? "Next Order → Bloodroot Compact"
        : "Play Again → First Bouquet"
  ]);
  expect(reloaded.brokenImages).toEqual([]);
  expect(reloaded.overflowX).toBe(false);
  await expect(page.locator("#roundOneRestoration button:not([hidden])")).toBeFocused();
  await expectPermanentRaisedGreenhouse(page, `${runLabel} round ${round} ${phase} settled reload`);
  return {
    round,
    phase,
    startMoves,
    movesLeft: reloaded.moves,
    coins: interruptedCoins
  };
}

async function assertActiveBoard(page, mobile) {
  const state = await journeyState(page);
  expect(state.tiles).toBe(64);
  expect(state.tileRows).toBe(8);
  expect(state.overflowX).toBe(false);
  expect(state.brokenImages).toEqual([]);
  expect(state.mobilePlinthVisible, "active mobile plinth hidden").toBe(false);
  expect(state.coinBalanceVisible).toBe(true);
  expect(state.coinBalanceInsideProgress).toBe(true);
  if (mobile) {
    expect(state.ritualLogVisible, "active mobile ritual log hidden").toBe(false);
    expect(state.boardBottom, "exact mobile board stays in first viewport").toBeLessThanOrEqual(844);
    expect(state.minimumTileWidth, "every exact-mobile tile owns a 44px hit width")
      .toBeGreaterThanOrEqual(44);
    expect(state.minimumTileHeight, "every exact-mobile tile owns a 44px hit height")
      .toBeGreaterThanOrEqual(44);
  }
}

function rectanglesOverlap(first, second) {
  if (!first || !second) return false;
  return first.left < second.right - 0.5
    && first.right > second.left + 0.5
    && first.top < second.bottom - 0.5
    && first.bottom > second.top + 0.5;
}

function expectOwnedReplayEntryGeometry(state, config, label) {
  const geometry = state.replayEntryGeometry;
  expect(state.replayEntryActive, `${label} bounded replay entry is active`).toBe(true);
  expect(state.cueVisible, `${label} viewport uses the intended cue surface`).toBe(config.mobile);
  expect(state.handoffCueVisible, `${label} detached receipt stays retired`).toBe(false);
  expect(geometry.receipt, `${label} receipt geometry`).toBeTruthy();
  expect(geometry.detachedReceipt, `${label} no detached receipt geometry`).toBeNull();
  expect(geometry.board, `${label} board geometry`).toBeTruthy();
  expect(geometry.bouquet, `${label} bouquet geometry`).toBeTruthy();
  expect(geometry.firstActionableTile, `${label} first actionable tile geometry`).toBeTruthy();
  for (const [name, rect] of [
    ["masthead", geometry.masthead],
    ["Help", geometry.help],
    ["board", geometry.board],
    ["current-order rail", geometry.currentOrder],
    ["first actionable tile", geometry.firstActionableTile]
  ]) {
    expect(
      rectanglesOverlap(geometry.receipt, rect),
      `${label} receipt does not overlap ${name}`
    ).toBe(false);
  }
  if (config.mobile) {
    expect(geometry.greenhouseContinuity, `${label} compact greenhouse continuity geometry`).toBeTruthy();
    expect(geometry.receiptText, `${label} receipt text geometry`).toBeTruthy();
    expect(geometry.receiptText.left, `${label} receipt text clears its left edge`)
      .toBeGreaterThanOrEqual(geometry.receipt.left + 1);
    expect(geometry.receiptText.right, `${label} receipt text clears its right edge`)
      .toBeLessThanOrEqual(geometry.receipt.right - 1);
    expect(geometry.receiptText.top, `${label} receipt text clears its top edge`)
      .toBeGreaterThanOrEqual(geometry.receipt.top + 1);
    expect(geometry.receiptText.bottom, `${label} receipt text clears its bottom edge`)
      .toBeLessThanOrEqual(geometry.receipt.bottom - 1);
    expect(geometry.receiptScrollWidth, `${label} receipt has no clipped horizontal content`)
      .toBeLessThanOrEqual(geometry.receiptClientWidth);
    expect(geometry.receiptScrollHeight, `${label} receipt has no clipped vertical content`)
      .toBeLessThanOrEqual(geometry.receiptClientHeight);
    expect(geometry.receiptWhiteSpace, `${label} receipt may wrap within its command lane`).toBe("normal");
    expect(geometry.receiptFontSize, `${label} receipt keeps its established readable type`).toBeCloseTo(8.5, 1);
    expect(geometry.receipt.height, `${label} receipt keeps the compact command height`).toBeCloseTo(30, 1);
    expect(
      rectanglesOverlap(geometry.receipt, geometry.greenhouseContinuity),
      `${label} receipt stays disjoint from greenhouse continuity`
    ).toBe(false);
    expect(geometry.receipt.left, `${label} receipt follows the greenhouse command lane`)
      .toBeGreaterThanOrEqual(geometry.greenhouseContinuity.right);
    expect(geometry.receipt.left - geometry.greenhouseContinuity.right)
      .toBeLessThanOrEqual(12);
    expect(geometry.greenhouseContinuity.bottom, `${label} greenhouse remains above the board`)
      .toBeLessThanOrEqual(geometry.board.top);
    expect(geometry.receipt.bottom, `${label} receipt remains above the board`)
      .toBeLessThanOrEqual(geometry.board.top);
    expect(
      geometry.board.top - Math.max(
        geometry.greenhouseContinuity.bottom,
        geometry.receipt.bottom
      ),
      `${label} greenhouse and receipt hand directly into the board`
    ).toBeLessThanOrEqual(12);
  } else {
    expect(
      geometry.receipt.left,
      `${label} receipt is contained by the bouquet header`
    ).toBeGreaterThanOrEqual(geometry.bouquet.left);
    expect(geometry.receipt.right, `${label} receipt stays inside the bouquet header`)
      .toBeLessThanOrEqual(geometry.bouquet.right);
    expect(geometry.receipt.top, `${label} receipt stays below bouquet header top`)
      .toBeGreaterThanOrEqual(geometry.bouquet.top - 3);
    expect(geometry.receipt.bottom, `${label} receipt stays above bouquet header bottom`)
      .toBeLessThanOrEqual(geometry.bouquet.bottom);
    expect(geometry.bouquet.bottom, `${label} bouquet header hands directly into the board`)
      .toBeLessThanOrEqual(geometry.board.top + 0.5);
  }
  const receiptCenter = geometry.receipt.left + geometry.receipt.width / 2;
  expect(receiptCenter, `${label} receipt aligns with board left`).toBeGreaterThan(geometry.board.left);
  expect(receiptCenter, `${label} receipt aligns with board right`).toBeLessThan(geometry.board.right);
  expect(geometry.board.bottom, `${label} board remains in the first viewport`)
    .toBeLessThanOrEqual(config.viewport.height);
  if (config.mobile) {
    expect(
      rectanglesOverlap(geometry.receipt, geometry.greenhouseContinuity),
      `${label} receipt does not overlap greenhouse continuity`
    ).toBe(false);
    expect(geometry.receipt.left, `${label} receipt stays inside mobile left edge`).toBeGreaterThanOrEqual(0);
    expect(geometry.receipt.right, `${label} receipt stays inside mobile right edge`)
      .toBeLessThanOrEqual(config.viewport.width);
  }
}

async function findInvalidAdjacentPair(page) {
  return page.evaluate(() => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(-1));
    document.querySelectorAll(".tile").forEach((tile) => {
      board[Number(tile.dataset.y)][Number(tile.dataset.x)] = Number(tile.dataset.flowerId);
    });
    const matchedAtEndpoint = (next, endpoints) => {
      const keys = new Set(endpoints.map(({ x, y }) => `${x},${y}`));
      for (let y = 0; y < 8; y += 1) {
        for (let start = 0, x = 1; x <= 8; x += 1) {
          if (x === 8 || next[y][x] !== next[y][start]) {
            if (x - start >= 3) {
              for (let mx = start; mx < x; mx += 1) {
                if (keys.has(`${mx},${y}`)) return true;
              }
            }
            start = x;
          }
        }
      }
      for (let x = 0; x < 8; x += 1) {
        for (let start = 0, y = 1; y <= 8; y += 1) {
          if (y === 8 || next[y][x] !== next[start][x]) {
            if (y - start >= 3) {
              for (let my = start; my < y; my += 1) {
                if (keys.has(`${x},${my}`)) return true;
              }
            }
            start = y;
          }
        }
      }
      return false;
    };
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const a = { x, y };
          const b = { x: x + dx, y: y + dy };
          if (b.x >= 8 || b.y >= 8) continue;
          if (board[a.y][a.x] === board[b.y][b.x]) return [a, b];
          const next = board.map((row) => row.slice());
          [next[a.y][a.x], next[b.y][b.x]] = [next[b.y][b.x], next[a.y][a.x]];
          if (!matchedAtEndpoint(next, [a, b])) return [a, b];
        }
      }
    }
    return null;
  });
}

async function findNonObjectiveLegalPairs(page, round) {
  return page.evaluate(({ targetIds, finishingPair }) => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(-1));
    const relicCells = new Set();
    document.querySelectorAll(".tile").forEach((tile) => {
      const key = `${tile.dataset.x},${tile.dataset.y}`;
      board[Number(tile.dataset.y)][Number(tile.dataset.x)] = Number(tile.dataset.flowerId);
      if (tile.dataset.lineRelic) relicCells.add(key);
    });
    const matchesAtEndpoints = (next, endpoints) => {
      const endpointKeys = new Set(endpoints.map(({ x, y }) => `${x},${y}`));
      const values = [];
      for (let y = 0; y < 8; y += 1) {
        for (let start = 0, x = 1; x <= 8; x += 1) {
          if (x === 8 || next[y][x] !== next[y][start]) {
            if (x - start >= 3) {
              const run = [];
              for (let mx = start; mx < x; mx += 1) run.push({ x: mx, y });
              if (run.some(({ x: mx, y: my }) => endpointKeys.has(`${mx},${my}`))) {
                values.push(next[y][start]);
              }
            }
            start = x;
          }
        }
      }
      for (let x = 0; x < 8; x += 1) {
        for (let start = 0, y = 1; y <= 8; y += 1) {
          if (y === 8 || next[y][x] !== next[start][x]) {
            if (y - start >= 3) {
              const run = [];
              for (let my = start; my < y; my += 1) run.push({ x, y: my });
              if (run.some(({ x: mx, y: my }) => endpointKeys.has(`${mx},${my}`))) {
                values.push(next[start][x]);
              }
            }
            start = y;
          }
        }
      }
      return values;
    };
    const pairs = [];
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const a = { x, y };
          const b = { x: x + dx, y: y + dy };
          if (b.x >= 8 || b.y >= 8 || board[a.y][a.x] === board[b.y][b.x]) continue;
          const keys = [`${a.x},${a.y}`, `${b.x},${b.y}`];
          if (keys.some((key) => relicCells.has(key)) || keys.every((key) => finishingPair.includes(key))) {
            continue;
          }
          const next = board.map((row) => row.slice());
          [next[a.y][a.x], next[b.y][b.x]] = [next[b.y][b.x], next[a.y][a.x]];
          const matchedValues = matchesAtEndpoints(next, [a, b]);
          if (matchedValues.length && matchedValues.every((flowerId) => !targetIds.includes(flowerId))) {
            pairs.push([a, b]);
          }
        }
      }
    }
    return pairs;
  }, {
    targetIds: ROUND_TARGETS[round],
    finishingPair: (await journeyState(page)).finalHarvestPair
  });
}

async function exerciseFinalHarvestZeroGain(page, eligible, label) {
  const savedEligible = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  const zeroGainPairs = await findNonObjectiveLegalPairs(page, eligible.round);
  let observedZeroGain = false;
  for (const pair of zeroGainPairs) {
    const before = await journeyState(page);
    const tile = (cell) => page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
    await tile(pair[0]).click();
    await tile(pair[1]).click();
    await page.waitForFunction(() => Array.from(document.querySelectorAll(".tile")).every((node) => !node.disabled), null, {
      timeout: 10000
    });
    await page.waitForTimeout(950);
    const after = await journeyState(page);
    const objectiveCountsUnchanged = ROUND_TARGETS[eligible.round]
      .every((flowerId) => after.counts[flowerId] === before.counts[flowerId]);
    if (!after.roundComplete && objectiveCountsUnchanged && after.moves === before.moves - 1) {
      expect(after.finalHarvestPhase, `${label} zero-gain move never commits a transfer`).not.toBe("landing");
      expect(after.finalHarvestTransientNodes, `${label} zero-gain move clears all transient nodes`).toBe(0);
      observedZeroGain = true;
      break;
    }
    await page.evaluate(({ key, saved }) => localStorage.setItem(key, saved), {
      key: SAVE_KEY,
      saved: savedEligible
    });
    await page.reload({ waitUntil: "networkidle" });
  }
  await page.evaluate(({ key, saved }) => localStorage.setItem(key, saved), {
    key: SAVE_KEY,
    saved: savedEligible
  });
  await page.reload({ waitUntil: "networkidle" });
  await expectEligibleFinalHarvest(page, eligible.round, `${label} restored after zero-gain probe`);
  return observedZeroGain;
}

async function exerciseFinalHarvestLifecycle(page, eligible, label) {
  const savedEligible = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  for (let reload = 0; reload < 2; reload += 1) {
    await page.reload({ waitUntil: "networkidle" });
    const reloaded = await expectEligibleFinalHarvest(page, eligible.round, `${label} reload ${reload + 1}`);
    expect(reloaded.finalHarvestPair).toEqual(eligible.finalHarvestPair);
    expect(reloaded.finalHarvestTransientNodes).toBe(0);
  }

  if (await page.locator("#tutorialHelpBtn").isVisible()) {
    await page.locator("#tutorialHelpBtn").click();
    const help = await journeyState(page);
    expect(help.finalHarvestPhase, `${label} Help owns narration`).toBe("");
    expect(help.finalHarvestEndpointCount).toBe(0);
    expect(help.finalHarvestTransientNodes).toBe(0);
    await page.locator("#tutorialSkipBtn").click();
    await expectEligibleFinalHarvest(page, eligible.round, `${label} Skip returns truthful eligibility`);
  }

  const invalidPair = await findInvalidAdjacentPair(page);
  expect(invalidPair, `${label} has an ordinary invalid adjacent pair`).toHaveLength(2);
  const invalidTile = (cell) => page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
  await invalidTile(invalidPair[0]).click();
  await invalidTile(invalidPair[1]).click();
  await expect(page.locator(".tile.invalid-swap")).toHaveCount(2);
  const refused = await journeyState(page);
  expect(refused.finalHarvestPhase, `${label} invalid input clears presentation`).toBe("");
  expect(refused.finalHarvestEndpointCount).toBe(0);
  expect(refused.finalHarvestTransientNodes).toBe(0);
  await page.waitForFunction(() => document.body.dataset.finalHarvestPhase === "eligible", null, {
    timeout: 2500
  });

  const endpoint = page.locator(".tile.final-harvest-endpoint").first();
  const box = await endpoint.boundingBox();
  expect(box).not.toBeNull();
  await endpoint.dispatchEvent("pointerdown", {
    pointerId: 31,
    isPrimary: true,
    pointerType: "mouse",
    clientX: box.x + box.width / 2,
    clientY: box.y + box.height / 2
  });
  await endpoint.dispatchEvent("pointercancel", {
    pointerId: 31,
    isPrimary: true,
    pointerType: "mouse",
    clientX: box.x + box.width / 2,
    clientY: box.y + box.height / 2
  });
  const canceled = await expectEligibleFinalHarvest(page, eligible.round, `${label} canceled input`);
  expect(canceled.finalHarvestTransientNodes).toBe(0);

  await page.evaluate(({ key, saved }) => localStorage.setItem(key, saved), {
    key: SAVE_KEY,
    saved: savedEligible
  });
  await page.reload({ waitUntil: "networkidle" });
  await expectEligibleFinalHarvest(page, eligible.round, `${label} restored after cancellation`);

  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    state.moves = 0;
    state.roundComplete = false;
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  const failed = await journeyState(page);
  expect(failed.visibleButtons).toContain("Retry Bouquet");
  expect(failed.finalHarvestPhase, `${label} failure owns state`).toBe("");
  expect(failed.finalHarvestTransientNodes).toBe(0);
  await page.getByRole("button", { name: "Retry Bouquet", exact: true }).click();
  const retried = await journeyState(page);
  expect(retried.roundComplete).toBe(false);
  expect(retried.finalHarvestPhase, `${label} Retry has no stale final state`).toBe("");
  expect(retried.finalHarvestTransientNodes).toBe(0);
  expect(retried.tiles).toBe(64);

  await page.evaluate(({ key, saved }) => localStorage.setItem(key, saved), {
    key: SAVE_KEY,
    saved: savedEligible
  });
  await page.reload({ waitUntil: "networkidle" });
  return expectEligibleFinalHarvest(page, eligible.round, `${label} restored finishing state`);
}

async function runFinalHarvestJourney(browser, config) {
  const context = await browser.newContext({
    viewport: config.viewport,
    hasTouch: config.mobile,
    isMobile: config.mobile,
    reducedMotion: "no-preference"
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));
  let reducedMotionFixture = null;
  try {
    const runLabel = `${config.label}-final-harvest`;
    await openFresh(page, "altar-rose", runLabel);
    for (let round = 1; round <= 3; round += 1) {
      let eligible = await playUntilFinalHarvest(page, round, `${runLabel} round ${round}`, "final-harvest");
      if (round === 1) {
        const command = eligible.commandGeometry;
        console.log(`${runLabel} round 1 command geometry: ${JSON.stringify({
          viewport: command.viewport,
          region: command.region,
          surface: command.surface,
          category: command.category,
          action: command.action,
          skip: command.skip,
          greenhouse: command.greenhouse,
          board: command.board,
          tileRows: command.tileRows,
          tileColumns: command.tileColumns,
          representativeTileHits: command.representativeTileHits,
          overflowX: command.overflowX,
          overflowY: command.overflowY
        })}`);
      }
      if (!config.mobile && round === 2) {
        eligible = await exerciseFinalHarvestLifecycle(page, eligible, `${runLabel} round ${round}`);
      }
      if (config.mobile && round === 3) {
        reducedMotionFixture = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
      }
      await page.screenshot({
        path: `work/final-harvest-${config.label}-round${round}-eligible.png`,
        fullPage: true
      });
      const activation = config.mobile
        ? "touch"
        : round === 2 ? "keyboard" : "pointer";
      const settled = await finishThroughFinalHarvest(
        page,
        eligible,
        activation,
        `work/final-harvest-${config.label}-round${round}`
      );
      expect(settled.coins).toBe([120, 170, 230][round - 1]);
      const firstAction = await spendPrimaryCeremonyAction(page);
      expect(firstAction).toBe([
        "Restore Greenhouse · 100 coins",
        "Upgrade Greenhouse · 120 coins",
        "Raise Conservatory · 180 coins"
      ][round - 1]);
      if (round < 3) {
        const nextAction = await spendPrimaryCeremonyAction(page, config.mobile ? "touch" : "pointer");
        expect(nextAction).toBe([
          "Next Order → Moonlit Wreath",
          "Next Order → Bloodroot Compact"
        ][round - 1]);
        await assertActiveBoard(page, config.mobile);
        if (round === 2) {
          const untouchedState = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
          const initialRoundThree = await journeyState(page);
          expect(initialRoundThree.round, `${runLabel} untouched R3 initial round`).toBe(3);
          expect(initialRoundThree.moves, `${runLabel} untouched R3 initial moves`).toBe(8);
          expect(initialRoundThree.bouquet, `${runLabel} untouched R3 initial bouquet`)
            .toBe("Bouquet · 0/27");
          expect(initialRoundThree.activeElementId, `${runLabel} untouched R3 initial focus`)
            .toMatch(/^tile-\d-\d$/);
          expect(initialRoundThree.rovingTileIds, `${runLabel} untouched R3 initial roving agreement`)
            .toEqual([initialRoundThree.activeElementId]);
          expect(initialRoundThree.selectedTileCount, `${runLabel} untouched R3 initial selection`).toBe(0);
          for (let reload = 1; reload <= 2; reload += 1) {
            await page.reload({ waitUntil: "networkidle" });
            await assertActiveBoard(page, config.mobile);
            const restoredRoundThree = await journeyState(page);
            expect(
              await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
              `${runLabel} untouched R3 reload ${reload} exact save`
            ).toBe(untouchedState);
            expect(restoredRoundThree.activeElementId, `${runLabel} untouched R3 reload ${reload} focus`)
              .toMatch(/^tile-\d-\d$/);
            expect(
              restoredRoundThree.rovingTileIds,
              `${runLabel} untouched R3 reload ${reload} roving agreement`
            ).toEqual([restoredRoundThree.activeElementId]);
            expect(
              restoredRoundThree.selectedTileCount,
              `${runLabel} untouched R3 reload ${reload} selection`
            ).toBe(0);
          }
        }
      }
    }
    if (!config.mobile) {
      const probeContext = await browser.newContext({
        viewport: config.viewport,
        reducedMotion: "no-preference"
      });
      const probePage = await probeContext.newPage();
      probePage.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) {
          consoleMessages.push(`${message.type()}: ${message.text()}`);
        }
      });
      probePage.on("pageerror", (error) => pageErrors.push(error.message));
      probePage.on("requestfailed", (request) => (
        failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`)
      ));
      try {
        await openFresh(probePage, "altar-rose", `${runLabel}-zero-gain`);
        const probeEligible = await playUntilFinalHarvest(
          probePage,
          1,
          `${runLabel} zero-gain round 1`,
          "final-harvest"
        );
        expect(
          await exerciseFinalHarvestZeroGain(
            probePage,
            probeEligible,
            `${runLabel} zero-gain round 1`
          ),
          `${runLabel} exercises one authoritative zero-objective-gain move`
        ).toBe(true);
      } finally {
        await probeContext.close();
      }
    }
    expect(consoleMessages).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  } finally {
    await context.close();
  }
  return reducedMotionFixture;
}

for (const config of [
  { label: "desktop", viewport: { width: 1280, height: 720 }, mobile: false },
  { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
]) {
  test(`final harvest causally closes all three natural orders on ${config.label}`, async ({ browser }) => {
    const reducedMotionFixture = await runFinalHarvestJourney(browser, config);
    if (!config.mobile) {
      return;
    }
    expect(reducedMotionFixture).toBeTruthy();
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: true,
      isMobile: true,
      reducedMotion: "reduce"
    });
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}?final-harvest=reduced-motion`, { waitUntil: "networkidle" });
      await page.evaluate(({ key, saved }) => localStorage.setItem(key, saved), {
        key: SAVE_KEY,
        saved: reducedMotionFixture
      });
      await page.reload({ waitUntil: "networkidle" });
      const eligible = await expectEligibleFinalHarvest(page, 3, "mobile reduced-motion reconstructed state");
      expect(eligible.reducedMotion).toBe(true);
      await finishThroughFinalHarvest(
        page,
        eligible,
        "touch",
        "work/final-harvest-mobile390-reduced-round3"
      );
    } finally {
      await context.close();
    }
  });
}

for (const config of [
  { label: "desktop", viewport: { width: 1280, height: 720 }, mobile: false },
  { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
]) {
  for (const seed of JOURNEY_SEEDS) {
    test(`real first-three journey is fair on ${config.label} with ${seed}`, async ({ page }) => {
      const { runLabel, results } = await playFirstThree(page, config, seed, "optimized");

      console.log(`${runLabel} first-three journey: ${JSON.stringify(results)}`);
      expect(results[0].movesLeft, "Round 1 preserves one move after the taught activation").toBeGreaterThanOrEqual(1);
      expect(results[0].movesLeft, "Round 1 no longer has a huge move cushion").toBeLessThanOrEqual(4);
      expect(results[1].movesLeft, "Round 2 leaves a fair cushion").toBeGreaterThanOrEqual(1);
      expect(results[1].movesLeft, "Round 2 handles cascade variance").toBeLessThanOrEqual(5);
      expect(results[2].movesLeft, "Round 3 leaves a fair cushion").toBeGreaterThanOrEqual(1);
      expect(results[2].movesLeft, "Round 3 handles cascade variance").toBeLessThanOrEqual(5);
      expect(results[0].swaps, "Round 1 can finish quickly but still requires real swaps").toBeGreaterThanOrEqual(2);
      expect(results[0].swaps, "Round 1 tutorial does not drag").toBeLessThanOrEqual(5);
      expect(results[1].swaps, "Round 2 takes several real swaps").toBeGreaterThanOrEqual(4);
      expect(results[1].swaps, "Round 2 closes before the Moonlit Wreath path drags").toBeLessThanOrEqual(7);
      expect(results[2].swaps, "Round 3 takes real swaps").toBeGreaterThanOrEqual(2);
      expect(results[2].swaps, "Round 3 stays inside the focused fairness envelope").toBeLessThanOrEqual(6);
      expect(results[0].actions).toEqual(["Restore Greenhouse · 100 coins", "Next Order → Moonlit Wreath"]);
      expect(results[1].actions).toEqual(["Upgrade Greenhouse · 120 coins", "Next Order → Bloodroot Compact"]);
      expect(results[2].actions).toEqual(["Raise Conservatory · 180 coins", "Play Again → First Bouquet"]);

    });
  }

  for (const seed of GOAL_FOLLOWING_SEEDS) {
    test(`goal-following first-three journey completes on ${config.label} with ${seed}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: config.viewport,
        hasTouch: config.mobile,
        isMobile: config.mobile
      });
      const page = await context.newPage();
      try {
        const { runLabel, results } = await playFirstThree(page, config, seed, "goal-following");
        console.log(`${runLabel} first-three journey: ${JSON.stringify(results)}`);
        expect(results[0].swaps, "Round 1 goal-following tutorial does not drag").toBeLessThanOrEqual(5);
        expect(results[1].movesLeft, "Round 2 goal-following play completes").toBeGreaterThanOrEqual(0);
        expect(results[2].movesLeft, "Round 3 goal-following play completes").toBeGreaterThanOrEqual(0);
        expect(results[0].actions).toEqual(["Restore Greenhouse · 100 coins", "Next Order → Moonlit Wreath"]);
        expect(results[1].actions).toEqual(["Upgrade Greenhouse · 120 coins", "Next Order → Bloodroot Compact"]);
        expect(results[2].actions).toEqual(["Raise Conservatory · 180 coins", "Play Again → First Bouquet"]);
      } finally {
        await context.close();
      }
    });
  }

  test(`focused economy closes across two full cycles on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: config.mobile,
      isMobile: config.mobile,
      reducedMotion: "no-preference"
    });
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        consoleMessages.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      const errorText = request.failure()?.errorText || "";
      if (errorText !== "net::ERR_ABORTED") {
        failedRequests.push(`${request.url()} ${errorText}`);
      }
    });

    try {
      const runLabel = `${config.label}-two-cycle-vesper-thorn`;
      await openFresh(page, "vesper-thorn", runLabel);
      expect((await journeyState(page)).coins).toBe(0);

      const firstCycle = await playFocusedCycle(page, config, `${runLabel}-cycle1`, "goal-following", {
        evidencePrefix: `work/economy-${config.label}-cycle1`,
        stopBeforeReplay: true,
        verifyFreshConservatoryReloads: true,
        interruptFreshConservatoryTransfer: true
      });
      expect(firstCycle[2].balances).toEqual([50, 230, 50]);
      expect(firstCycle[2].actions).toEqual(["Raise Conservatory · 180 coins"]);
      const firstReplayAction = await spendPrimaryCeremonyAction(
        page,
        config.mobile ? "touch" : "pointer"
      );
      expect(firstReplayAction).toBe("Play Again → First Bouquet");
      firstCycle[2].balances.push((await journeyState(page)).coins);
      firstCycle[2].actions.push(firstReplayAction);
      expect((await journeyState(page)).freshConservatorySettlement).toBe(false);
      expect(firstCycle.map((round) => round.balances)).toEqual([
        [0, 120, 20, 20],
        [20, 170, 50, 50],
        [50, 230, 50, 50]
      ]);
      const replayHandoff = await journeyState(page);
      expect(replayHandoff.coins).toBe(50);
      expect(replayHandoff.replayEntryReceipt).toBe("50 coins kept · Conservatory owned · New order ready.");
      expect(replayHandoff.hintedTiles).toBe(2);
      expect(replayHandoff.reducedMotion).toBe(false);
      expect(replayHandoff.tiles).toBe(64);
      console.log(`${runLabel} replay-entry transient geometry: ${JSON.stringify(replayHandoff.replayEntryGeometry)}`);
      expectOwnedReplayEntryGeometry(replayHandoff, config, `${runLabel} first replay handoff`);
      await expectPermanentRaisedGreenhouse(page, `${runLabel} first replay handoff`);
      await expect(page.locator(".tile[tabindex='0']")).toHaveCount(1);
      await expect(page.locator(".tile[tabindex='0']")).toBeFocused();
      await page.screenshot({ path: `work/replay-entry-${config.label}-transient.png`, fullPage: true });
      await page.waitForFunction(() => !document.body.classList.contains("owned-replay-entry"));
      const settledReplayEntry = await journeyState(page);
      expect(settledReplayEntry.replayEntryActive).toBe(false);
      expect(settledReplayEntry.handoffCueVisible).toBe(false);
      expect(settledReplayEntry.cue).toMatch(/Thorn Rose next|Swap the glowing pair/);
      expect(settledReplayEntry.rewardPromise).toBe("Nourish 120 · Keep 50");
      expect(settledReplayEntry.replayEntryGeometry.detachedReceipt).toBeNull();
      expect(settledReplayEntry.replayEntryGeometry.board.top)
        .toBeCloseTo(replayHandoff.replayEntryGeometry.board.top, 0);
      expect(settledReplayEntry.boardBottom).toBeLessThanOrEqual(config.viewport.height);
      await page.screenshot({ path: `work/replay-entry-${config.label}-settled.png`, fullPage: true });
      console.log(`${runLabel} replay-entry geometry: ${JSON.stringify({
        transient: replayHandoff.replayEntryGeometry,
        settled: settledReplayEntry.replayEntryGeometry
      })}`);

      await reloadAndExpectActiveReplayBalance(page, config, 50);
      await page.screenshot({ path: `work/replay-active-reload-${config.label}.png`, fullPage: true });
      await failAndRetryOwnedReplayRoundOne(page, config, 50, runLabel);
      const retryReady = await journeyState(page);
      const replayTargetProgress = retryReady.counts[5] + retryReady.counts[1];
      await clickGuidedSwap(page, "goal-following");
      const afterReplaySwap = await journeyState(page);
      expect(afterReplaySwap.moves).toBe(retryReady.moves - 1);
      expect(afterReplaySwap.counts[5] + afterReplaySwap.counts[1], "replay guide harvests a First Bouquet target")
        .toBeGreaterThan(replayTargetProgress);
      expect(afterReplaySwap.coins).toBe(50);
      await expectPermanentRaisedGreenhouse(page, `${runLabel} replay after first swap`);
      expect(afterReplaySwap.handoffCueVisible).toBe(false);
      await expect(page.locator("#nextOrderCue")).toBeHidden();

      const secondCycle = await playOwnedReplayCycle(page, config, `${runLabel}-cycle2`, "goal-following");
      expect(secondCycle.map((round) => round.balances)).toEqual([
        [50, 50, 50],
        [50, 50, 50],
        [50, 50, 50]
      ]);
      const finalState = await journeyState(page);
      expect(finalState.coins).toBe(50);
      expect(finalState.payoffTransaction).toBe(ownedReplayTransaction(180));
      expect(finalState.payoffCopy).toBe("Bouquet complete. The raised conservatory remains yours.");
      expect(finalState.visibleButtons).toEqual(["Play Again → First Bouquet"]);
      await expectPermanentRaisedGreenhouse(page, `${runLabel} second-cycle final ceremony`);
      expect(finalState.overflowX).toBe(false);
      expect(finalState.brokenImages).toEqual([]);

      const secondReplayAction = await spendPrimaryCeremonyAction(page, config.mobile ? "touch" : "pointer");
      expect(secondReplayAction).toBe("Play Again → First Bouquet");
      const secondReplayHandoff = await journeyState(page);
      expect(secondReplayHandoff.coins).toBe(50);
      expect(secondReplayHandoff.replayEntryReceipt).toBe("50 coins kept · Conservatory owned · New order ready.");
      expectOwnedReplayEntryGeometry(secondReplayHandoff, config, `${runLabel} second replay handoff`);
      await expectPermanentRaisedGreenhouse(page, `${runLabel} second replay handoff`);
      await page.screenshot({ path: `work/replay-second-entry-${config.label}-transient.png`, fullPage: true });
      await clickGuidedSwap(page, "goal-following");
      const afterImmediateReplayMove = await journeyState(page);
      expect(afterImmediateReplayMove.replayEntryActive, "first replay move retires the receipt").toBe(false);
      expect(afterImmediateReplayMove.handoffCueVisible, "first replay move cannot restore the detached receipt").toBe(false);
      expect(afterImmediateReplayMove.rewardPromise).toBe("Nourish 120 · Keep 50");
      expect(afterImmediateReplayMove.coins).toBe(50);
      await page.screenshot({ path: `work/replay-second-entry-${config.label}-first-move.png`, fullPage: true });
      await reloadAndExpectActiveReplayBalance(page, config, 50, 0);
      const secondReplayReady = await journeyState(page);
      expect(secondReplayReady.coins).toBe(50);
      await page.screenshot({ path: `work/replay-second-active-reload-${config.label}.png`, fullPage: true });
      await failAndRetryOwnedReplayRoundOne(page, config, 50, `${runLabel}-bounded`);
      const thirdCycle = await playOwnedReplayCycle(page, config, `${runLabel}-cycle3`, "goal-following");
      expect(thirdCycle.map((round) => round.balances)).toEqual([
        [50, 50, 50],
        [50, 50, 50],
        [50, 50, 50]
      ]);
      const thirdFinalState = await journeyState(page);
      expect(thirdFinalState.coins).toBe(50);
      expect(thirdFinalState.payoffTransaction).toBe(ownedReplayTransaction(180));
      expect(thirdFinalState.visibleButtons).toEqual(["Play Again → First Bouquet"]);
      console.log(`${runLabel} balance and renewal traces: ${JSON.stringify({
        firstCycle: firstCycle.map((round) => round.balances),
        secondCycle: secondCycle.map((round) => round.balances),
        renewalTiming: secondCycle.map((round) => round.ownedRenewalTiming)
      })}`);
      expect(consoleMessages).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  });

  test(`owned replay transient reloads settle atomically on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: config.mobile,
      isMobile: config.mobile,
      reducedMotion: "no-preference"
    });
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        consoleMessages.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    try {
      const runLabel = `${config.label}-owned-replay-transient-reload`;
      await openFresh(page, "vesper-thorn", runLabel);
      const firstCycle = await playFocusedCycle(page, config, `${runLabel}-cycle1`, "goal-following", {
        replayActivation: config.mobile ? "touch" : "pointer"
      });
      expect(firstCycle.map((round) => round.balances)).toEqual([
        [0, 120, 20, 20],
        [20, 170, 50, 50],
        [50, 230, 50, 50]
      ]);

      const phases = ["binding", "transfer", "renewal"];
      const expectedBalances = [50, 50, 50];
      const interruptions = [];
      for (let round = 1; round <= 3; round += 1) {
        const interrupted = await completeOwnedRoundAndReloadDuringPhase(
          page,
          config,
          runLabel,
          round,
          phases[round - 1],
          "goal-following"
        );
        expect(interrupted.coins).toBe(expectedBalances[round - 1]);
        interruptions.push(interrupted);
        if (round < 3) {
          await spendPrimaryCeremonyAction(page, config.mobile ? "touch" : "pointer");
          await assertActiveBoard(page, config.mobile);
        }
      }
      console.log(`${runLabel} interruption trace: ${JSON.stringify(interruptions)}`);
      expect(consoleMessages).toEqual([]);
      expect(pageErrors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("reduced-motion exact-mobile replay boundary preserves the owned wallet", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce"
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText || "";
    if (errorText !== "net::ERR_ABORTED") {
      failedRequests.push(`${request.url()} ${errorText}`);
    }
  });

  try {
    const config = { label: "mobile390-reduced", viewport: { width: 390, height: 844 }, mobile: true, reducedMotion: true };
    await openFresh(page, "vesper-thorn", "reduced-motion-replay-boundary");
    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      Object.assign(state, {
        currentRound: 3,
        roundComplete: true,
        roundOneRestored: true,
        roundTwoGreenhouseUpgraded: true,
        roundThreeConservatoryRaised: false,
        moves: 2,
        coins: 230,
        counts: [13, 0, 0, 14, 0, 0],
        cursedThorns: [],
        clearedCursedThorns: 0,
        tutorialSkipped: true,
        tutorialActive: false,
        blackCandleLessonComplete: true
      });
      localStorage.setItem(key, JSON.stringify(state));
    }, SAVE_KEY);
    await page.reload({ waitUntil: "networkidle" });
    const pendingConservatory = await journeyState(page);
    expect(pendingConservatory.coins).toBe(230);
    expect(pendingConservatory.payoffTransaction).toBe("Earned 180 coins. Conservatory costs 180.");
    expect(pendingConservatory.visibleButtons).toEqual(["Raise Conservatory · 180 coins"]);
    await spendPrimaryCeremonyAction(page, "touch");
    const finalCeremony = await journeyState(page);
    expect(finalCeremony.coins).toBe(50);
    expect(finalCeremony.payoffTransaction).toBe("Raised for 180. 50 coins remain.");
    expect(finalCeremony.visibleButtons).toEqual(["Play Again → First Bouquet"]);
    expect(finalCeremony.freshConservatorySettlement).toBe(true);
    await expectGreenhouseOwned(page, 3, "reduced-motion first-cycle final ceremony");
    await page.screenshot({ path: "work/replay-final-mobile390-reduced.png", fullPage: true });

    for (let reload = 0; reload < 2; reload += 1) {
      await page.reload({ waitUntil: "networkidle" });
      const reloadedSettlement = await journeyState(page);
      expect(reloadedSettlement.freshConservatorySettlement).toBe(true);
      expect(reloadedSettlement.coins, `fresh conservatory reload ${reload + 1} keeps the spent balance`).toBe(50);
      expect(reloadedSettlement.payoffMode, `fresh conservatory reload ${reload + 1} stays a purchase settlement`).toBe("restoration");
      expect(reloadedSettlement.payoffTransaction).toBe("Raised for 180. 50 coins remain.");
      expect(reloadedSettlement.payoffCopy).toBe("Begin a new growing cycle with your balance intact.");
      expect(reloadedSettlement.visibleButtons).toEqual(["Play Again → First Bouquet"]);
      expect([
        reloadedSettlement.roundOneRestored,
        reloadedSettlement.roundTwoGreenhouseUpgraded,
        reloadedSettlement.roundThreeConservatoryRaised
      ]).toEqual([true, true, true]);
      expect(reloadedSettlement.tiles).toBe(64);
      expect(reloadedSettlement.tileAriaRows).toBe(8);
      expect(reloadedSettlement.overflowX).toBe(false);
      expect(reloadedSettlement.brokenImages).toEqual([]);
      await expectGreenhouseOwned(page, 3, `fresh conservatory settlement reload ${reload + 1}`);
      await expect(page.getByRole("button", { name: "Play Again → First Bouquet", exact: true })).toBeFocused();
    }

    await spendPrimaryCeremonyAction(page, "touch");
    const handoff = await journeyState(page);
    expect(handoff.reducedMotion).toBe(true);
    expect(handoff.coins).toBe(50);
    expect(handoff.freshConservatorySettlement).toBe(false);
    expect(handoff.replayEntryReceipt).toBe("50 coins kept · Conservatory owned · New order ready.");
    expectOwnedReplayEntryGeometry(handoff, config, "reduced-motion first replay handoff");
    expect(handoff.tiles).toBe(64);
    expect(handoff.tileRows).toBe(8);
    expect(handoff.boardBottom).toBeLessThanOrEqual(844);
    expect(handoff.overflowX).toBe(false);
    expect(handoff.brokenImages).toEqual([]);
    await expectPermanentRaisedGreenhouse(page, "reduced-motion first replay handoff");
    await page.screenshot({ path: "work/replay-entry-mobile390-reduced-transient.png", fullPage: true });
    await page.waitForFunction(() => !document.body.classList.contains("owned-replay-entry"));
    const reducedSettledEntry = await journeyState(page);
    expect(reducedSettledEntry.cue).toMatch(/Thorn Rose next|Swap the glowing pair/);
    expect(reducedSettledEntry.handoffCueVisible).toBe(false);
    expect(reducedSettledEntry.rewardPromise).toBe("Nourish 120 · Keep 50");
    expect(reducedSettledEntry.replayEntryGeometry.board.top)
      .toBeCloseTo(handoff.replayEntryGeometry.board.top, 0);
    await page.screenshot({ path: "work/replay-entry-mobile390-reduced-settled.png", fullPage: true });

    await reloadAndExpectActiveReplayBalance(page, config, 50);
    await page.screenshot({ path: "work/replay-active-reload-mobile390-reduced.png", fullPage: true });

    const reducedReplay = await playOwnedReplayCycle(
      page,
      config,
      "mobile390-reduced-natural-cycle2",
      "goal-following"
    );
    expect(reducedReplay.map((round) => round.balances)).toEqual([
      [50, 50, 50],
      [50, 50, 50],
      [50, 50, 50]
    ]);
    console.log(`mobile390-reduced renewal timing: ${JSON.stringify(reducedReplay.map((round) => round.ownedRenewalTiming))}`);
    const secondFinal = await journeyState(page);
    expect(secondFinal.coins).toBe(50);
    expect(secondFinal.payoffTransaction).toBe(ownedReplayTransaction(180));
    expect(secondFinal.payoffMode).toBe("owned-replay");
    expect(secondFinal.restorationTitle).toBe("Bloodroot Compact Complete");
    expect(secondFinal.trophyKicker).toBe("Bouquet Complete");
    expect(secondFinal.trophyCopy).toBe("Order complete. The Bloodroot Conservatory remains fully raised.");
    expect(secondFinal.restorationState).toBe("BLOODROOT CONSERVATORY · OWNED · 100% RAISED");
    expect(secondFinal.restorationSceneArt).toBe("bloodroot");
    expect(secondFinal.restoredSceneArt).toContain("bloodroot_compact_greenhouse.jpg");
    expect(secondFinal.witheredSceneArtVisible).toBe(false);
    expect(secondFinal.restoredSceneArtVisible).toBe(true);
    expect(secondFinal.visibleTransformationLabels).toEqual([]);
    expect(secondFinal.ceremonyText).not.toMatch(/Greenhouse Restored|Greenhouse Relit|\bBefore\b|\bAfter\b|Restore Greenhouse|Upgrade Greenhouse|Raise Conservatory/i);
    expect(secondFinal.visibleButtons).toEqual(["Play Again → First Bouquet"]);
    expect(secondFinal.ceremonyBottom).toBeLessThanOrEqual(844);
    expect(secondFinal.transactionBottom).toBeLessThanOrEqual(844);
    expect(secondFinal.actionBottom).toBeLessThanOrEqual(844);
    await expectPermanentRaisedGreenhouse(page, "reduced-motion second-cycle final ceremony");
    await page.screenshot({ path: "work/economy-mobile390-reduced-cycle2-round3-owned.png", fullPage: true });

    await spendPrimaryCeremonyAction(page, "touch");
    const secondHandoff = await journeyState(page);
    expect(secondHandoff.coins).toBe(50);
    expect(secondHandoff.replayEntryReceipt).toBe("50 coins kept · Conservatory owned · New order ready.");
    expectOwnedReplayEntryGeometry(secondHandoff, config, "reduced-motion second replay handoff");
    await expectPermanentRaisedGreenhouse(page, "reduced-motion second replay handoff");
    await page.screenshot({ path: "work/replay-second-entry-mobile390-reduced-transient.png", fullPage: true });
    await reloadAndExpectActiveReplayBalance(page, config, 50);
    const thirdReducedReplay = await playOwnedReplayCycle(
      page,
      config,
      "mobile390-reduced-natural-cycle3",
      "goal-following"
    );
    expect(thirdReducedReplay.map((round) => round.balances)).toEqual([
      [50, 50, 50],
      [50, 50, 50],
      [50, 50, 50]
    ]);
    const thirdReducedFinal = await journeyState(page);
    expect(thirdReducedFinal.coins).toBe(50);
    expect(thirdReducedFinal.payoffTransaction).toBe(ownedReplayTransaction(180));
    expect(thirdReducedFinal.visibleButtons).toEqual(["Play Again → First Bouquet"]);
    expect(consoleMessages).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  } finally {
    await context.close();
  }
});

test("current and legacy owned profiles converge to the carried seed without replaying a payout", async ({ browser }) => {
  for (const config of [
    { label: "desktop", viewport: { width: 1280, height: 720 }, mobile: false, reducedMotion: false },
    { label: "mobile390-reduced", viewport: { width: 390, height: 844 }, mobile: true, reducedMotion: true }
  ]) {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: config.mobile,
      isMobile: config.mobile,
      reducedMotion: config.reducedMotion ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    try {
      const profiles = [170, 320, 380, 500, 7820].flatMap((coins) => [
        { coins, economyVersion: 2, label: `current-${coins}` },
        { coins, economyVersion: 0, label: `legacy-${coins}` }
      ]);
      for (const profile of profiles) {
        await openFresh(
          page,
          `owned-normalization-${config.label}-${profile.label}`,
          `owned-normalization-${config.label}-${profile.label}`
        );
        const authoritative = await page.evaluate(({ key, profile }) => {
          const state = JSON.parse(localStorage.getItem(key) || "{}");
          Object.assign(state, {
            focusedEconomyVersion: profile.economyVersion,
            currentRound: 1,
            roundComplete: false,
            roundOneRestored: true,
            roundTwoGreenhouseUpgraded: true,
            roundThreeConservatoryRaised: true,
            freshConservatorySettlement: false,
            coins: profile.coins,
            moves: 6,
            counts: [0, 0, 0, 0, 0, 0],
            armedLineRelic: null,
            tutorialSkipped: true,
            tutorialActive: false,
            blackCandleLessonComplete: true
          });
          localStorage.setItem(key, JSON.stringify(state));
          return {
            board: JSON.stringify(state.board),
            counts: JSON.stringify(state.counts),
            moves: state.moves,
            ownership: [
              state.roundOneRestored,
              state.roundTwoGreenhouseUpgraded,
              state.roundThreeConservatoryRaised
            ],
            tutorial: [state.tutorialSkipped, state.tutorialActive, state.blackCandleLessonComplete],
            relic: state.armedLineRelic
          };
        }, { key: SAVE_KEY, profile });

        for (let reload = 0; reload < 2; reload += 1) {
          await page.reload({ waitUntil: "networkidle" });
          const state = await journeyState(page);
          expect(state.coins, `${config.label} ${profile.label} reload ${reload + 1} normalizes the spendless wallet`).toBe(50);
          expect(state.round).toBe(1);
          expect(state.roundComplete).toBe(false);
          expect(state.freshConservatorySettlement).toBe(false);
          expect(state.moves).toBe(authoritative.moves);
          expect(JSON.stringify(state.counts)).toBe(authoritative.counts);
          expect(state.tiles).toBe(64);
          expect(state.tileRows).toBe(8);
          expect(state.visibleButtons).toEqual(["Help"]);
          expect(state.replayEntryActive).toBe(false);
          expect(state.overflowX).toBe(false);
          expect(state.brokenImages).toEqual([]);
          const savedAuthority = await page.evaluate((key) => {
            const saved = JSON.parse(localStorage.getItem(key) || "{}");
            return {
              board: JSON.stringify(saved.board),
              ownership: [
                saved.roundOneRestored,
                saved.roundTwoGreenhouseUpgraded,
                saved.roundThreeConservatoryRaised
              ],
              tutorial: [saved.tutorialSkipped, saved.tutorialActive, saved.blackCandleLessonComplete],
              relic: saved.armedLineRelic
            };
          }, SAVE_KEY);
          expect(savedAuthority).toEqual({
            board: authoritative.board,
            ownership: authoritative.ownership,
            tutorial: authoritative.tutorial,
            relic: authoritative.relic
          });
          await expectPermanentRaisedGreenhouse(page, `${config.label} ${profile.label} reload ${reload + 1}`);
          await expectVisibleCoinBalance(page, 50, { pulsing: false });
          await assertActiveBoard(page, config.mobile);
        }
      }

      await playCurrentRound(page, `${config.label}-normalized-reinvestment`, 1, "goal-following", 3);
      await page.waitForSelector("#nextOrderBtn:not([hidden])", { timeout: 3000 });
      const completed = await journeyState(page);
      expect(completed.coins, `${config.label} advertised reward reinvests exactly once`).toBe(50);
      expect(completed.payoffTransaction).toBe(ownedReplayTransaction(120));
      expect(completed.visibleButtons).toEqual(["Next Order → Moonlit Wreath"]);
      await expectPermanentRaisedGreenhouse(page, `${config.label} normalized completion`);
      for (let reload = 0; reload < 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        const reloaded = await journeyState(page);
        expect(reloaded.coins, `${config.label} completed reload ${reload + 1} does not duplicate reward`).toBe(50);
        expect(reloaded.payoffTransaction).toBe(ownedReplayTransaction(120));
        expect(reloaded.visibleButtons).toEqual(["Next Order → Moonlit Wreath"]);
        await expectPermanentRaisedGreenhouse(page, `${config.label} normalized completion reload ${reload + 1}`);
      }
    } finally {
      await context.close();
    }
  }
});

test("owned replay receipt remains fully readable at the active-board handoff", async ({ browser }) => {
  for (const config of [
    { label: "desktop", viewport: { width: 1280, height: 720 }, mobile: false },
    { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true },
    { label: "mobile390-reduced", viewport: { width: 390, height: 844 }, mobile: true, reducedMotion: true }
  ]) {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: config.mobile,
      isMobile: config.mobile,
      reducedMotion: config.reducedMotion ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "warning" || message.type() === "error") {
        consoleMessages.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`);
    });

    try {
      await openFresh(page, `replay-receipt-${config.label}`, config.label);
      await page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        Object.assign(state, {
          currentRound: 3,
          roundComplete: true,
          roundOneRestored: true,
          roundTwoGreenhouseUpgraded: true,
          roundThreeConservatoryRaised: true,
          moves: 2,
          coins: 50,
          counts: [13, 0, 0, 14, 0, 0],
          cursedThorns: [],
          clearedCursedThorns: 0,
          tutorialSkipped: true,
          tutorialActive: false,
          blackCandleLessonComplete: true
        });
        localStorage.setItem(key, JSON.stringify(state));
      }, SAVE_KEY);
      await page.reload({ waitUntil: "load" });
      await expect(page.locator("#roundOneRestoration button:not([hidden])")).toBeVisible();
      await spendPrimaryCeremonyAction(page, config.mobile ? "touch" : "pointer");
      await page.waitForFunction(() => document.body.classList.contains("owned-replay-entry"));

      const handoff = await journeyState(page);
      expect(handoff.replayEntryReceipt, `${config.label} exact receipt`)
        .toBe("50 coins kept · Conservatory owned · New order ready.");
      expectOwnedReplayEntryGeometry(handoff, config, `${config.label} owned replay receipt`);
      expect(handoff.round, `${config.label} returns to First Bouquet`).toBe(1);
      expect(handoff.moves, `${config.label} starts with six moves`).toBe(6);
      expect(handoff.bouquet, `${config.label} starts an empty bouquet`).toBe("Bouquet · 0/14");
      expect(handoff.coins, `${config.label} keeps the wallet`).toBe(50);
      expect(handoff.activeElementId, `${config.label} restores opening board focus`).toBe("tile-1-0");
      expect(handoff.rovingTileIds, `${config.label} focus and roving model agree`).toEqual(["tile-1-0"]);
      expect(handoff.selectedTileCount, `${config.label} creates no selection`).toBe(0);
      expect(handoff.tiles, `${config.label} tile count`).toBe(64);
      expect(handoff.tileRows, `${config.label} row count`).toBe(8);
      expect(handoff.overflowX, `${config.label} no horizontal overflow`).toBe(false);
      expect(handoff.boardBottom, `${config.label} board stays in viewport`).toBeLessThanOrEqual(config.viewport.height);
      expect(handoff.brokenImages, `${config.label} no broken visible images`).toEqual([]);
      await page.screenshot({ path: `work/replay-receipt-${config.label}.png`, fullPage: true });

      expect(consoleMessages).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests.filter((failure) => !failure.includes("ERR_ABORTED"))).toEqual([]);
    } finally {
      await context.close();
    }
  }
});
