const { test, expect } = require("@playwright/test");
const zlib = require("zlib");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

test.setTimeout(120000);

function decodePng(buffer) {
  const chunks = [];
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      chunks.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += length + 12;
  }
  if (bitDepth !== 8 || ![2, 6].includes(colorType) || !width || !height) {
    throw new Error(`Unsupported screenshot PNG ${width}x${height} depth=${bitDepth} type=${colorType}`);
  }
  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const pixels = Buffer.alloc(stride * height);
  const paeth = (left, above, upperLeft) => {
    const estimate = left + above - upperLeft;
    const leftDistance = Math.abs(estimate - left);
    const aboveDistance = Math.abs(estimate - above);
    const upperLeftDistance = Math.abs(estimate - upperLeft);
    return leftDistance <= aboveDistance && leftDistance <= upperLeftDistance
      ? left
      : aboveDistance <= upperLeftDistance ? above : upperLeft;
  };
  for (let y = 0, source = 0; y < height; y += 1) {
    const filter = raw[source];
    source += 1;
    for (let x = 0; x < stride; x += 1, source += 1) {
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const above = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
      const prediction = filter === 0 ? 0
        : filter === 1 ? left
          : filter === 2 ? above
            : filter === 3 ? Math.floor((left + above) / 2)
              : filter === 4 ? paeth(left, above, upperLeft) : NaN;
      if (!Number.isFinite(prediction)) throw new Error(`Unsupported PNG row filter ${filter}`);
      pixels[y * stride + x] = (raw[source] + prediction) & 255;
    }
  }
  return { width, height, channels, stride, pixels };
}

function pixelBoxStats(png, box, scaleX, scaleY) {
  const left = Math.max(0, Math.floor(box.left * scaleX));
  const top = Math.max(0, Math.floor(box.top * scaleY));
  const right = Math.min(png.width, Math.ceil(box.right * scaleX));
  const bottom = Math.min(png.height, Math.ceil(box.bottom * scaleY));
  const luminance = [];
  let coloredPixels = 0;
  let litPixels = 0;
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const offset = y * png.stride + x * png.channels;
      const red = png.pixels[offset];
      const green = png.pixels[offset + 1];
      const blue = png.pixels[offset + 2];
      const value = red * .2126 + green * .7152 + blue * .0722;
      const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
      luminance.push(value);
      if (value > 26) litPixels += 1;
      if (value > 20 && chroma > 14) coloredPixels += 1;
    }
  }
  luminance.sort((a, b) => a - b);
  const percentile = (ratio) => luminance[Math.min(luminance.length - 1, Math.floor(luminance.length * ratio))] || 0;
  return {
    p75: percentile(.75),
    p90: percentile(.9),
    p97: percentile(.97),
    litPixels,
    coloredPixels,
    sampledPixels: luminance.length
  };
}

async function currentBouquetPixelFrame(page) {
  return page.evaluate(() => {
    const assembly = document.querySelector("#liveBouquetAssembly");
    if (!assembly) return null;
    const rectFor = (node) => {
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
    const ingredients = Array.from(assembly.querySelectorAll(".live-bouquet-ingredient"));
    return {
      progress: assembly.dataset.progress || "",
      compositionKey: assembly.dataset.compositionKey || "",
      viewport: { width: innerWidth, height: innerHeight },
      assembly: rectFor(assembly),
      runningAnimations: assembly.getAnimations({ subtree: true })
        .filter((animation) => animation.playState === "running").length,
      ingredients: ingredients.map((ingredient) => ({
        flowerId: Number(ingredient.dataset.flowerId),
        slot: Number(ingredient.dataset.liveSlot),
        slotProgress: Number(ingredient.dataset.slotProgress),
        connected: ingredient.isConnected,
        ...rectFor(ingredient)
      }))
    };
  });
}

function bouquetPixelFramesMatch(before, after) {
  if (!before || !after
      || before.progress !== after.progress
      || before.compositionKey !== after.compositionKey
      || before.viewport.width !== after.viewport.width
      || before.viewport.height !== after.viewport.height
      || before.ingredients.length !== after.ingredients.length) {
    return false;
  }
  const stableRect = (first, second) => ["left", "top", "right", "bottom", "width", "height"]
    .every((edge) => Math.abs(first[edge] - second[edge]) <= .5);
  return stableRect(before.assembly, after.assembly)
    && before.ingredients.every((ingredient, index) => (
      ingredient.flowerId === after.ingredients[index].flowerId
        && ingredient.slot === after.ingredients[index].slot
        && ingredient.slotProgress === after.ingredients[index].slotProgress
        && stableRect(ingredient, after.ingredients[index])
    ));
}

async function waitForBouquetPixelReadiness(page) {
  await page.waitForFunction(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    const assembly = document.querySelector("#liveBouquetAssembly");
    const ingredients = Array.from(assembly?.querySelectorAll(".live-bouquet-ingredient") || []);
    const measurable = (node) => {
      const rect = node.getBoundingClientRect();
      return node.isConnected && rect.width > 0 && rect.height > 0;
    };
    if (!assembly || !measurable(assembly) || !ingredients.length || !ingredients.every(measurable)
        || assembly.getAnimations({ subtree: true }).some((animation) => animation.playState === "running")) {
      return false;
    }
    const progress = assembly.dataset.progress;
    const compositionKey = assembly.dataset.compositionKey;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return assembly.isConnected
      && document.querySelector("#liveBouquetAssembly") === assembly
      && assembly.dataset.progress === progress
      && assembly.dataset.compositionKey === compositionKey
      && ingredients.every(measurable);
  }, null, { timeout: 2500 });
}

async function renderedBouquetPixelStats(page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await waitForBouquetPixelReadiness(page);
    const before = await currentBouquetPixelFrame(page);
    const png = decodePng(await page.screenshot({ animations: "allow" }));
    const after = await currentBouquetPixelFrame(page);
    if (!bouquetPixelFramesMatch(before, after)
        || after.runningAnimations
        || after.ingredients.some((ingredient) => !ingredient.connected || !ingredient.width || !ingredient.height)) {
      continue;
    }
    const scaleX = png.width / after.viewport.width;
    const scaleY = png.height / after.viewport.height;
    return after.ingredients.map((box) => ({ ...box, ...pixelBoxStats(png, box, scaleX, scaleY) }));
  }
  throw new Error("Live bouquet never reached a connected, painted, viewport-stable sampling frame");
}

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
  }, SAVE_KEY, { timeout: 9500 });
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
  await expect(hints).toHaveCount(2, { timeout: 9500 });
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

async function clickGuidedSwapAndSampleFlight(page, label) {
  const hints = page.locator(".tile.idle-hint");
  await expect(hints).toHaveCount(2, { timeout: 9500 });
  const pair = await hints.evaluateAll((tiles) => tiles.slice(0, 2).map((tile) => ({
    x: tile.dataset.x,
    y: tile.dataset.y
  })));
  expect(pair).toHaveLength(2);
  await page.evaluate(() => {
    const records = [];
    const geometry = [];
    const limit = 24;
    const geometryLimit = 180;
    const record = (node) => {
      if (!(node instanceof Element) || records.length >= limit) return;
      const descendants = node.querySelectorAll
        ? Array.from(node.querySelectorAll(".objective-flight, .bouquet-bind-seal"))
        : [];
      [node, ...descendants].forEach((candidate) => {
        if (records.length >= limit || !candidate.matches(".objective-flight, .bouquet-bind-seal")) return;
        records.push({
          type: candidate.classList.contains("objective-flight") ? "flight" : "seal",
          flowerId: Number(candidate.dataset.flowerId || -1),
          at: Math.round(performance.now())
        });
      });
    };
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach(record));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    let geometryFrame = 0;
    const sampleGeometry = () => {
      const assembly = document.querySelector("#liveBouquetAssembly");
      const pulsing = Array.from(assembly?.querySelectorAll(
        '.live-bouquet-ingredient.order-pulse[data-gain-receiver="true"]'
      ) || []);
      if (assembly && pulsing.length && geometry.length < geometryLimit) {
        const receiver = assembly.getBoundingClientRect();
        const overflow = pulsing.map((ingredient) => {
          const rect = ingredient.getBoundingClientRect();
          return {
            slot: Number(ingredient.dataset.liveSlot),
            amount: Math.max(
              0,
              receiver.left - rect.left - 1,
              rect.right - receiver.right - 1,
              receiver.top - rect.top - 1,
              rect.bottom - receiver.bottom - 1
            )
          };
        });
        geometry.push({
          receivers: pulsing.length,
          maximumOverflow: Math.max(...overflow.map((entry) => entry.amount)),
          overflow
        });
      }
      geometryFrame = requestAnimationFrame(sampleGeometry);
    };
    geometryFrame = requestAnimationFrame(sampleGeometry);
    window.__boundedBouquetFlightRecorder = {
      limit,
      records,
      geometry,
      stop() {
        observer.disconnect();
        cancelAnimationFrame(geometryFrame);
      }
    };
  });
  await page.locator(`.tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`).click();
  await page.locator(`.tile[data-x="${pair[1].x}"][data-y="${pair[1].y}"]`).click();
  await page.waitForFunction(() => (
    document.querySelector(".objective-flight")
      && document.querySelector(".bouquet-bind-seal")
  ), null, { timeout: 2500 });
  const landing = await page.evaluate(() => {
    const flights = Array.from(document.querySelectorAll(".objective-flight"));
    const seal = document.querySelector(".bouquet-bind-seal");
    const sealFlowerId = Number(seal?.dataset.flowerId);
    const assembly = document.querySelector("#liveBouquetAssembly")?.getBoundingClientRect();
    const inside = (point, rect, pad = 0) => Boolean(rect
      && point.x >= rect.left - pad
      && point.x <= rect.right + pad
      && point.y >= rect.top - pad
      && point.y <= rect.bottom + pad);
    const flightLandings = flights.map((flight) => {
      const animation = flight.getAnimations?.()[0];
      const finalFrame = animation?.effect?.getKeyframes?.().at(-1);
      const transform = finalFrame?.transform || "";
      const match = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(transform);
      const startLeft = Number.parseFloat(flight.style.left || "0");
      const startTop = Number.parseFloat(flight.style.top || "0");
      const point = {
        x: startLeft + 13 + (match ? Number(match[1]) : 0),
        y: startTop + 13 + (match ? Number(match[2]) : 0)
      };
      const growthSlot = Number(flight.dataset.growthSlot);
      const receiver = document.querySelector(
        `#liveBouquetAssembly .live-bouquet-ingredient[data-flower-id="${flight.dataset.flowerId}"][data-live-slot="${growthSlot}"][data-gain-receiver="true"]`
      );
      return {
        ...point,
        flowerId: Number(flight.dataset.flowerId),
        growthSlot,
        inAssembly: inside(point, assembly, 2),
        inBloom: inside(point, receiver?.getBoundingClientRect(), 8)
      };
    });
    const growing = Array.from(document.querySelectorAll(
      "#liveBouquetAssembly .live-bouquet-ingredient.order-pulse[data-gain-receiver=\"true\"]"
    ));
    return {
      flights: flightLandings,
      inAssembly: flightLandings.every((flight) => flight.inAssembly),
      inBloom: flightLandings.every((flight) => flight.inBloom),
      assemblyWidth: assembly?.width || 0,
      assemblyHeight: assembly?.height || 0,
      sealFlowerId,
      gainedAmount: Number(seal?.dataset.gainedAmount || 0),
      receiverSlotProgress: Math.min(...growing.map((receiver) => Number(receiver.dataset.slotProgress || 0))),
      pulsingReceivers: growing.length
    };
  });
  await page.screenshot({ path: `work/live-bouquet-${label}-first-landing.png`, fullPage: true });
  await page.waitForFunction(() => (
    document.querySelectorAll(".objective-flight, .bouquet-bind-seal").length === 0
  ), null, { timeout: 2500 });
  await page.waitForTimeout(450);
  landing.remainingTransients = await page.locator(".objective-flight, .bouquet-bind-seal").count();
  landing.recorder = await page.evaluate(() => {
    const recorder = window.__boundedBouquetFlightRecorder;
    recorder?.stop();
    return recorder ? { limit: recorder.limit, records: recorder.records, geometry: recorder.geometry } : null;
  });
  return landing;
}

async function activeBouquetAssemblyState(page) {
  return page.evaluate(() => {
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
    const assembly = document.querySelector("#liveBouquetAssembly");
    const rect = assembly?.getBoundingClientRect();
    const bindingStyle = assembly ? getComputedStyle(assembly, "::before") : null;
    const vineStyle = assembly ? getComputedStyle(assembly, "::after") : null;
    const ingredients = Array.from(document.querySelectorAll("#liveBouquetAssembly .live-bouquet-ingredient"))
      .map((ingredient) => {
        const style = getComputedStyle(ingredient);
        const rect = ingredient.getBoundingClientRect();
        const capacityStyle = getComputedStyle(ingredient, "::before");
        const image = ingredient.querySelector("img");
        const imageRect = image?.getBoundingClientRect();
        const bud = ingredient.querySelector(".live-bouquet-bud");
        const budRect = bud?.getBoundingClientRect();
        const budStyle = bud ? getComputedStyle(bud) : null;
        return {
          flowerId: Number(ingredient.dataset.flowerId),
          unitIndex: Number(ingredient.dataset.unitIndex),
          progress: ingredient.dataset.progress,
          slotProgress: Number(ingredient.dataset.slotProgress || 0),
          slotState: ingredient.dataset.slotState || "",
          visualProgress: Number(style.getPropertyValue("--ingredient-visual-progress") || 0),
          filled: ingredient.dataset.filled === "true",
          receiver: ingredient.dataset.receiver === "true",
          gainReceiver: ingredient.dataset.gainReceiver === "true",
          nextObjective: ingredient.dataset.nextObjective === "true",
          opacity: Number(style.opacity),
          transform: style.transform,
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          centerX: rect.left + rect.width / 2,
          centerY: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
          capacityBackgroundImage: capacityStyle.backgroundImage,
          capacityBackgroundColor: capacityStyle.backgroundColor,
          capacityBorderStyle: capacityStyle.borderStyle,
          contained: Boolean(assembly && rect.left >= assembly.getBoundingClientRect().left - 1
            && rect.right <= assembly.getBoundingClientRect().right + 1
            && rect.top >= assembly.getBoundingClientRect().top - 1
            && rect.bottom <= assembly.getBoundingClientRect().bottom + 1),
          imageContained: !image && ingredient.dataset.slotState === "empty" ? true : Boolean(imageRect
            && imageRect.left >= rect.left - 1
            && imageRect.right <= rect.right + 1
            && imageRect.top >= rect.top - 1
            && imageRect.bottom <= rect.bottom + 1),
          imageWidth: imageRect?.width || 0,
          imageHeight: imageRect?.height || 0,
          imageOpacity: image ? Number(getComputedStyle(ingredient.querySelector(".icon-wrap")).opacity) : 0,
          bud: budRect ? {
            left: budRect.left,
            right: budRect.right,
            top: budRect.top,
            bottom: budRect.bottom,
            width: budRect.width,
            height: budRect.height,
            opacity: Number(budStyle.opacity),
            backgroundImage: budStyle.backgroundImage,
            borderStyle: budStyle.borderStyle
          } : null,
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
    const knotRect = assembly?.querySelector(".live-bouquet-knot")?.getBoundingClientRect();
    const thorn = assembly?.querySelector(".live-bouquet-thorn");
    const thornRect = thorn?.getBoundingClientRect();
    const stemDetails = Array.from(assembly?.querySelectorAll(".live-bouquet-stem") || []).map((stem) => {
      const origin = getComputedStyle(stem).transformOrigin.split(" ").map(Number.parseFloat);
      return {
        anchorX: (rect?.left || 0) + stem.offsetLeft + (origin[0] || 0),
        anchorY: (rect?.top || 0) + stem.offsetTop + (origin[1] || 0)
      };
    });
    return {
      progress: assembly?.dataset.progress || "",
      compositionKey: assembly?.dataset.compositionKey || "",
      complete: assembly?.dataset.assemblyComplete || "",
      state: assembly?.dataset.assemblyState || "",
      round: assembly?.dataset.round || "",
      visibleBlooms: Number(assembly?.dataset.visibleBlooms || 0),
      emptyText: assembly?.querySelector(".live-bouquet-empty")?.textContent.replace(/\s+/g, " ").trim() || "",
      width: rect?.width || 0,
      height: rect?.height || 0,
      bindingWidth: Number.parseFloat(bindingStyle?.width || "0"),
      bindingHeight: Number.parseFloat(bindingStyle?.height || "0"),
      vineWidth: Number.parseFloat(vineStyle?.width || "0"),
      vineHeight: Number.parseFloat(vineStyle?.height || "0"),
      ingredients,
      liveComposition,
      stems: stemDetails.length,
      stemDetails,
      leaves: document.querySelectorAll("#liveBouquetAssembly .live-bouquet-leaf").length,
      buds: document.querySelectorAll("#liveBouquetAssembly .live-bouquet-bud").length,
      knot: knotRect ? {
        centerX: knotRect.left + knotRect.width / 2,
        centerY: knotRect.top + knotRect.height / 2,
        width: knotRect.width,
        height: knotRect.height
      } : null,
      thorn: thornRect ? {
        progress: thorn.dataset.thornProgress || "",
        left: thornRect.left,
        right: thornRect.right,
        top: thornRect.top,
        bottom: thornRect.bottom,
        width: thornRect.width,
        height: thornRect.height
      } : null,
      boardBottom: board?.bottom || 0,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      visibleLinearMeter: visible(document.querySelector("#bouquetOrderProgress .progress-meter")),
      visibleProgressbars: Array.from(document.querySelectorAll('[role="progressbar"]')).filter(visible).length
    };
  });
}

function maxIngredientOverlapRatio(ingredients) {
  let maximum = 0;
  let pair = [];
  for (let index = 0; index < ingredients.length; index += 1) {
    for (let compare = index + 1; compare < ingredients.length; compare += 1) {
      const first = ingredients[index];
      const second = ingredients[compare];
      const overlapWidth = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
      const overlapHeight = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
      const smallerArea = Math.min(first.width * first.height, second.width * second.height);
      const ratio = smallerArea ? (overlapWidth * overlapHeight) / smallerArea : 0;
      if (ratio > maximum) {
        maximum = ratio;
        pair = [index, compare];
      }
    }
  }
  return { maximum, pair };
}

function overlapRatio(first, second) {
  const overlapWidth = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
  const overlapHeight = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
  const smallerArea = Math.min(first.width * first.height, second.width * second.height);
  return smallerArea ? (overlapWidth * overlapHeight) / smallerArea : 0;
}

function expectedUnitComposition(targetCounts) {
  const placement = targetCounts.map(([flowerId, needed], targetIndex) => ({
    flowerId,
    needed,
    targetIndex,
    placed: 0
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

const ROUND_ONE_COMPOSITION = expectedUnitComposition([[5, 8], [1, 6]]);
const ROUND_TWO_COMPOSITION = expectedUnitComposition([[2, 10], [4, 9], [5, 7]]);
const ROUND_THREE_COMPOSITION = expectedUnitComposition([[3, 14], [0, 13]]);

function earnedHeadCounts(assembly) {
  return assembly.ingredients.reduce((counts, ingredient) => {
    if (ingredient.slotState === "filled") {
      counts[ingredient.flowerId] = (counts[ingredient.flowerId] || 0) + 1;
    }
    return counts;
  }, {});
}

function expectPhysicalBouquetGeometry(assembly, composition) {
  expect(assembly.ingredients.map((ingredient) => ingredient.flowerId), "live composition follows trophy order")
    .toEqual(composition);
  expect(assembly.ingredients, "every authoritative flower unit owns one capacity slot").toHaveLength(composition.length);
  expect(assembly.stems, "every capacity slot retains its physical stem").toBe(composition.length);
  expect(assembly.leaves, "every capacity slot retains its physical leaf").toBe(composition.length);
  expect(assembly.ingredients.filter((ingredient) => !ingredient.contained).map((ingredient) => ({
    slot: assembly.ingredients.indexOf(ingredient),
    left: ingredient.left,
    right: ingredient.right,
    top: ingredient.top,
    bottom: ingredient.bottom
  })), "heads stay inside the receiver").toEqual([]);
  expect(assembly.ingredients.every((ingredient) => ingredient.imageContained), "icons stay inside their head geometry").toBe(true);
  expect(assembly.ingredients.filter((ingredient) => ingredient.slotState === "filled").every((ingredient) => (
    ingredient.image.complete
    && ingredient.image.naturalWidth > 0
    && ingredient.image.naturalHeight > 0
  )), "every earned ingredient head is a complete repo-local image").toBe(true);
  const crownLeft = Math.min(...assembly.ingredients.map((ingredient) => ingredient.left));
  const crownRight = Math.max(...assembly.ingredients.map((ingredient) => ingredient.right));
  const crownWidth = crownRight - crownLeft;
  const crownYSpread = Math.max(...assembly.ingredients.map((ingredient) => ingredient.centerY))
    - Math.min(...assembly.ingredients.map((ingredient) => ingredient.centerY));
  const overlap = maxIngredientOverlapRatio(assembly.ingredients);
  expect(crownWidth, "all heads form a compact crown instead of spanning the rail")
    .toBeLessThan(assembly.width * .78);
  expect(crownWidth, "compact crown remains visually substantial")
    .toBeGreaterThan(assembly.width * .4);
  expect(crownYSpread, "bouquet crown has vertical tiers instead of a flat row").toBeGreaterThan(14);
  expect(overlap.maximum, "bouquet heads cluster with natural overlap").toBeGreaterThan(.08);
  expect(overlap.maximum, `ingredient heads remain individually legible; closest slots ${overlap.pair.join("/")}`)
    .toBeLessThan(.82);
  expect(assembly.ingredients.filter((ingredient) => ingredient.slotProgress === 0).every((ingredient) => (
    ingredient.capacityBackgroundImage === "none"
      && ingredient.capacityBackgroundColor === "rgba(0, 0, 0, 0)"
      && ingredient.capacityBorderStyle === "none"
  )), "empty capacity uses botanical silhouettes, not dark inventory sockets").toBe(true);
  const closed = assembly.ingredients.filter((ingredient) => ingredient.slotProgress === 0);
  expect(closed.every((ingredient) => ingredient.bud), "every unearned unit remains a visible closed botanical bud").toBe(true);
  expect(closed.every((ingredient) => (
    ingredient.bud.width >= 13
      && ingredient.bud.height >= 13
      && ingredient.bud.opacity >= .75
      && ingredient.bud.backgroundImage !== "none"
      && ingredient.bud.borderStyle !== "none"
  )), "closed buds have substantial neutral botanical geometry").toBe(true);
  expect(assembly.knot, "one binding knot remains visible").not.toBeNull();
  expect(assembly.knot.width, "binding knot remains materially legible").toBeGreaterThan(14);
  expect(assembly.knot.centerY, "binding knot sits below the crown")
    .toBeGreaterThan(assembly.ingredients.reduce((sum, ingredient) => sum + ingredient.centerY, 0) / composition.length + 14);
  const stemXSpread = Math.max(...assembly.stemDetails.map((stem) => stem.anchorX))
    - Math.min(...assembly.stemDetails.map((stem) => stem.anchorX));
  const stemYSpread = Math.max(...assembly.stemDetails.map((stem) => stem.anchorY))
    - Math.min(...assembly.stemDetails.map((stem) => stem.anchorY));
  expect(stemXSpread, "all stems converge horizontally at the binding").toBeLessThanOrEqual(2);
  expect(stemYSpread, "all stems converge vertically at the binding").toBeLessThanOrEqual(2);
  expect(Math.abs(assembly.stemDetails[0].anchorX - assembly.knot.centerX), "stem bundle meets the knot")
    .toBeLessThanOrEqual(4);
  expect(Math.abs(assembly.stemDetails[0].anchorY - assembly.knot.centerY), "stem bundle meets the knot")
    .toBeLessThanOrEqual(4);
  expect(assembly.visibleLinearMeter, "the generic linear fill is visually retired").toBe(false);
  expect(assembly.visibleProgressbars, "one semantic bouquet progressbar remains").toBe(1);
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
      craftedCompositionKey: document.querySelector(".crafted-bouquet")?.dataset.compositionKey || "",
      craftedComposition: Array.from(document.querySelectorAll(".crafted-flower-bloom"))
        .map((node) => Number(node.dataset.craftedFlower)),
      craftedFlowerNames: Array.from(document.querySelectorAll(".crafted-flower-bloom"))
        .map((node) => node.dataset.flowerName || ""),
      craftedBloomSlots: Array.from(document.querySelectorAll(".crafted-flower-bloom"))
        .map((node) => Number(node.dataset.craftedSlot)),
      craftedUnitIndices: Array.from(document.querySelectorAll(".crafted-flower-bloom"))
        .map((node) => Number(node.dataset.unitIndex)),
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
  const expectedBloomCount = contract.trophyName.includes("Moonlit Wreath") ? 26
    : contract.trophyName.includes("Bloodroot Compact") ? 27 : 14;
  expect(contract.craftedBlooms, "every objective flower becomes one trophy head").toBe(expectedBloomCount);
  expect(contract.craftedStems, "every trophy head keeps its converging stem").toBe(expectedBloomCount);
  expect(contract.craftedLeaves, "every trophy head keeps botanical foliage").toBe(expectedBloomCount);
  expect(contract.craftedBloomCount).toBe(String(expectedBloomCount));
  const expectedComposition = contract.trophyName.includes("Moonlit Wreath")
    ? ROUND_TWO_COMPOSITION
    : contract.trophyName.includes("Bloodroot Compact")
      ? ROUND_THREE_COMPOSITION
      : ROUND_ONE_COMPOSITION;
  const expectedCounts = contract.trophyName.includes("Moonlit Wreath")
    ? "2:10,4:9,5:7"
    : contract.trophyName.includes("Bloodroot Compact")
      ? "3:14,0:13"
      : "5:8,1:6";
  expect(contract.craftedComposition, "ceremony uses the exact one-unit target ingredient sequence").toEqual(expectedComposition);
  expect(contract.craftedTargetCounts, "ceremony carries authoritative objective counts").toBe(expectedCounts);
  expect(contract.craftedBloomSlots, "bouquet unit slots are unique and ordered")
    .toEqual(Array.from({ length: expectedBloomCount }, (_, index) => index));
  Object.entries(expectedComposition.reduce((groups, flowerId, index) => {
    (groups[flowerId] ||= []).push(contract.craftedUnitIndices[index]);
    return groups;
  }, {})).forEach(([, unitIndices]) => {
    expect(unitIndices, "each species carries a stable zero-based unit identity")
      .toEqual(Array.from({ length: unitIndices.length }, (_, index) => index));
  });
  expect(new Set(contract.craftedFlowerNames).size, "both target flower names render in trophy").toBeGreaterThanOrEqual(2);
  expect(Math.min(...contract.craftedBloomSizes), "every unit head remains materially legible").toBeGreaterThanOrEqual(24);
  expect(Math.min(...contract.craftedBloomSizes), "unit heads remain larger than ingredient labels").toBeGreaterThan(
    Math.max(...contract.ingredientTokenHeights, 0)
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
    const sourceCounts = contract.craftedImageSources.reduce((counts, image) => {
      const source = image.src.split("/").pop();
      counts[source] = (counts[source] || 0) + 1;
      return counts;
    }, {});
    expect(sourceCounts).toEqual({
      "crimson_rose_rune.png": 8,
      "bone_white_thorn_star.png": 6
    });
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
    expect(contract.transactionText).toMatch(/coins remain\.|spent$/);
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
  for (let reload = 1; reload <= 2; reload += 1) {
    await page.reload({ waitUntil: "networkidle" });
    const path = reload === 1 ? screenshotPath : screenshotPath.replace(/\.png$/, "-reload2.png");
    await expectCeremony(page, expectedButton, path, expectedGuide);
    await expect(page.locator("#roundOneRestoration button:not([hidden])")).toBeFocused();
  }
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
  const failedAssembly = await activeBouquetAssemblyState(page);
  expect(failedAssembly.visibleBlooms, "failed order retains no falsely earned heads").toBe(0);
  expect(earnedHeadCounts(failedAssembly)).toEqual({});
  await expectGreenhouseOwned(page, {
    stage: "restored",
    ownedStage: 1,
    pct: 33,
    art: "first_greenhouse_restored.jpg",
    note: "Owned 1/3 · Next: Upgrade Greenhouse"
  });
  await page.locator("#renewBtn.visible").click();
  await expectActiveBoard(page);
  const retriedAssembly = await activeBouquetAssemblyState(page);
  expect(retriedAssembly.progress, "Retry resets only the live order bouquet").toBe("0/29");
  expect(retriedAssembly.ingredients).toHaveLength(26);
  expect(retriedAssembly.visibleBlooms).toBe(0);
  expect(earnedHeadCounts(retriedAssembly)).toEqual({});
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
  expect(initialAssembly.width, "fresh live bouquet is readable in the progress strip").toBeGreaterThanOrEqual(compactReceiver ? 220 : 210);
  expect(initialAssembly.height, "fresh live bouquet has bouquet silhouette height").toBeGreaterThanOrEqual(compactReceiver ? 54 : 70);
  expect(initialAssembly.bindingWidth, "fresh live bouquet shows a physical binding").toBeGreaterThanOrEqual(50);
  expect(initialAssembly.vineWidth, "fresh live bouquet shows empty vine slots").toBeGreaterThanOrEqual(compactReceiver ? 74 : 84);
  expectPhysicalBouquetGeometry(initialAssembly, ROUND_ONE_COMPOSITION);
  expect(initialAssembly.ingredients.every((ingredient) => ingredient.slotState === "empty")).toBe(true);
  expect(initialAssembly.ingredients.every((ingredient) => ingredient.slotProgress === 0)).toBe(true);
  expect(initialAssembly.ingredients.filter((ingredient) => ingredient.nextObjective)).toHaveLength(1);
  expect(initialAssembly.ingredients.find((ingredient) => ingredient.nextObjective)?.flowerId).toBe(5);
  expect(initialAssembly.visibleBlooms).toBe(0);
  expect(initialAssembly.buds, "fresh Round 1 exposes fourteen restrained future buds").toBe(14);
  expect(initialAssembly.emptyText).toBe("");
  const initialVisual = await sampleElementVisual(page, "#liveBouquetAssembly");
  expect(initialVisual.samples, "unearned buds do not masquerade as flower-image heads").toHaveLength(0);
  const initialPixels = await renderedBouquetPixelStats(page);
  expect(initialPixels, "fresh bouquet exposes fourteen intended unit positions").toHaveLength(14);
  expect(initialAssembly.ingredients.every((ingredient) => ingredient.bud), "all fourteen fresh units visibly begin closed").toBe(true);
  expect(Math.min(...initialAssembly.ingredients.map((ingredient) => ingredient.bud.width)),
    "fresh capacity stays countable without flower-image stand-ins").toBeGreaterThanOrEqual(13);
  expect(Math.min(...initialPixels.map((head) => head.p90)),
    `every fresh bud renders above the empty panel floor: ${JSON.stringify(initialPixels)}`).toBeGreaterThan(10);
  expect(initialAssembly.overflowX).toBe(false);
  if (label.includes("mobile390")) {
    expect(initialAssembly.boardBottom, "mobile active board stays in viewport with live bouquet").toBeLessThanOrEqual(844);
  }
  await page.screenshot({ path: `work/live-bouquet-${label}-empty.png`, fullPage: true });
  await page.reload({ waitUntil: "networkidle" });
  const reloadedEmptyAssembly = await activeBouquetAssemblyState(page);
  expect(reloadedEmptyAssembly.progress).toBe(initialAssembly.progress);
  expectPhysicalBouquetGeometry(reloadedEmptyAssembly, ROUND_ONE_COMPOSITION);
  expect(reloadedEmptyAssembly.ingredients.map((ingredient) => ingredient.slotState))
    .toEqual(initialAssembly.ingredients.map((ingredient) => ingredient.slotState));
  expect(reloadedEmptyAssembly.emptyText).toBe(initialAssembly.emptyText);
  await page.reload({ waitUntil: "networkidle" });
  const twiceReloadedEmptyAssembly = await activeBouquetAssemblyState(page);
  expect(twiceReloadedEmptyAssembly.ingredients.map((ingredient) => ({
    flowerId: ingredient.flowerId,
    unitIndex: ingredient.unitIndex,
    slotState: ingredient.slotState
  }))).toEqual(reloadedEmptyAssembly.ingredients.map((ingredient) => ({
    flowerId: ingredient.flowerId,
    unitIndex: ingredient.unitIndex,
    slotState: ingredient.slotState
  })));
  const landing = await clickGuidedSwapAndSampleFlight(page, label);
  expect(landing.inAssembly, "positive target flight lands inside the live bouquet assembly").toBe(true);
  expect(landing.inBloom, "positive target flights land on every head changed by the gain").toBe(true);
  expect(landing.flights.map((flight) => flight.growthSlot), "3-Thorn gain owns three distinct physical heads")
    .toEqual([0, 2, 4]);
  expect(landing.sealFlowerId, "first authored harvest remains attributable to Thorn Rose").toBe(5);
  expect(landing.gainedAmount, "first authored harvest carries its authoritative gain").toBe(3);
  expect(landing.receiverSlotProgress, "every landing resolves to a newly earned full unit head").toBe(1);
  expect(landing.pulsingReceivers, "all three earned heads own the bounded acceptance beat").toBe(3);
  expect(landing.remainingTransients, "flight and seal self-clean before the next authoritative swap").toBe(0);
  expect(landing.recorder?.records.length, "preinstalled recorder observes the complete bounded landing lifecycle")
    .toBeGreaterThanOrEqual(2);
  expect(landing.recorder?.records.length).toBeLessThanOrEqual(landing.recorder?.limit || 0);
  expect(new Set(landing.recorder?.records.map((record) => record.type))).toEqual(new Set(["flight", "seal"]));
  expect(landing.recorder?.geometry.length, "the real opening animation exposes measurable earned receivers")
    .toBeGreaterThan(0);
  expect(Math.max(...landing.recorder.geometry.map((sample) => sample.receivers)),
    "all three opening heads are sampled during their acceptance beat").toBe(3);
  expect(Math.max(...landing.recorder.geometry.map((sample) => sample.maximumOverflow)),
    `animated earned heads stay inside the receiver: ${JSON.stringify(landing.recorder.geometry)}`).toBe(0);
  const firstAssembly = await activeBouquetAssemblyState(page);
  expectPhysicalBouquetGeometry(firstAssembly, ROUND_ONE_COMPOSITION);
  expect(firstAssembly.progress).toBe("3/14");
  await expect(page.locator('.objective-target[data-flower-id="5"] .objective-target-count')).toHaveText("3/8");
  await expect(page.locator('.objective-target[data-flower-id="1"] .objective-target-count')).toHaveText("0/6");
  await expect(page.locator(".moves-counter")).toContainText("Moves 5");
  expect(["mid", "nearly", "complete"]).toContain(firstAssembly.state);
  expect(firstAssembly.ingredients.some((ingredient) => ingredient.slotProgress > 0)).toBe(true);
  expect(firstAssembly.ingredients.some((ingredient) => ingredient.flowerId === 5 && ingredient.filled)).toBe(true);
  expect(firstAssembly.ingredients.filter((ingredient) => (
    ingredient.flowerId === 5 && ingredient.visualProgress >= .45
  )).length, "first match leaves exactly three visibly formed Thorn Rose heads").toBe(3);
  const firstPixels = await renderedBouquetPixelStats(page);
  const earnedPixelHeads = firstPixels.filter((head) => head.slotProgress > 0);
  expect(earnedPixelHeads, "3-Thorn gain renders exactly three earned physical heads").toHaveLength(3);
  earnedPixelHeads.forEach((head) => {
    const freshHead = initialPixels.find((initialHead) => initialHead.slot === head.slot);
    expect(head.coloredPixels,
      `earned Thorn slot ${head.slot} gains materially more rendered color than its capacity silhouette: ${JSON.stringify({ freshHead, head })}`)
      .toBeGreaterThan((freshHead?.coloredPixels || 0) * 1.45);
  });
  expect(Math.min(...firstAssembly.ingredients.filter((ingredient) => ingredient.slotProgress > 0).map((ingredient) => ingredient.imageWidth)),
    "each earned Thorn image is materially larger than every closed botanical bud")
    .toBeGreaterThan(Math.max(...firstAssembly.ingredients.filter((ingredient) => ingredient.slotProgress === 0).map((ingredient) => ingredient.bud.width)) * 1.5);
  expect(Math.max(...firstAssembly.ingredients
    .filter((ingredient) => ingredient.flowerId === 5 && ingredient.filled)
    .map((ingredient) => ingredient.imageWidth))).toBeGreaterThanOrEqual(28);
  expect(Math.max(...firstAssembly.ingredients
    .filter((ingredient) => ingredient.flowerId === 5)
    .map((ingredient) => ingredient.imageOpacity))).toBeGreaterThan(.75);
  const earnedHeadOpacity = Math.min(...firstAssembly.ingredients
    .filter((ingredient) => ingredient.slotProgress > 0)
    .map((ingredient) => ingredient.imageOpacity));
  const emptyHeadOpacity = Math.max(...firstAssembly.ingredients
    .filter((ingredient) => ingredient.slotProgress === 0)
    .map((ingredient) => ingredient.imageOpacity));
  expect(earnedHeadOpacity, "earned flower heads visually dominate blueprint capacity")
    .toBeGreaterThan(emptyHeadOpacity + .2);
  expect(firstAssembly.ingredients.filter((ingredient) => ingredient.receiver)).toHaveLength(2);
  expect(new Set(firstAssembly.ingredients
    .filter((ingredient) => ingredient.receiver)
    .map((ingredient) => ingredient.flowerId))).toEqual(new Set([5, 1]));
  expect(new Set(firstAssembly.ingredients
    .filter((ingredient) => ingredient.slotProgress > 0)
    .map((ingredient) => ingredient.flowerId))).toEqual(new Set([5]));
  expect(firstAssembly.visibleBlooms).toBe(firstAssembly.ingredients.filter((ingredient) => ingredient.slotProgress > 0).length);
  expect(firstAssembly.buds).toBe(11);
  expect(firstAssembly.ingredients.filter((ingredient) => ingredient.slotProgress === 0)
    .every((ingredient) => ingredient.bud?.width >= 13 && ingredient.bud?.height >= 13),
  "the eleven unearned units remain visibly closed after the first harvest").toBe(true);
  expect(earnedHeadCounts(firstAssembly)).toEqual({ 5: 3 });
  expect(firstAssembly.ingredients.some((ingredient) => ingredient.slotState === "partial")).toBe(false);
  expect(firstAssembly.ingredients.some((ingredient) => ingredient.slotState === "empty")).toBe(true);
  expect(firstAssembly.ingredients.find((ingredient) => ingredient.nextObjective)?.flowerId).toBe(5);
  expect(firstAssembly.emptyText).toBe("");
  expect(firstAssembly.width).toBeGreaterThanOrEqual(initialAssembly.width - 1);
  expect(firstAssembly.height).toBeGreaterThanOrEqual(initialAssembly.height - 1);
  await page.screenshot({ path: `work/live-bouquet-${label}-first-harvest.png`, fullPage: true });
  await page.reload({ waitUntil: "networkidle" });
  const partialReloadAssembly = await activeBouquetAssemblyState(page);
  await page.reload({ waitUntil: "networkidle" });
  const twiceReloadedPartialAssembly = await activeBouquetAssemblyState(page);
  expect(partialReloadAssembly.progress).toBe(firstAssembly.progress);
  expect(partialReloadAssembly.ingredients.filter((ingredient) => ingredient.filled)).toHaveLength(
    firstAssembly.ingredients.filter((ingredient) => ingredient.filled).length
  );
  expect(partialReloadAssembly.ingredients.map((ingredient) => ingredient.visualProgress)).toEqual(
    firstAssembly.ingredients.map((ingredient) => ingredient.visualProgress)
  );
  expect(partialReloadAssembly.ingredients).toHaveLength(firstAssembly.ingredients.length);
  expect(twiceReloadedPartialAssembly.ingredients.map((ingredient) => ({
    flowerId: ingredient.flowerId,
    unitIndex: ingredient.unitIndex,
    slotProgress: ingredient.slotProgress,
    slotState: ingredient.slotState,
    receiver: ingredient.receiver,
    nextObjective: ingredient.nextObjective
  }))).toEqual(partialReloadAssembly.ingredients.map((ingredient) => ({
    flowerId: ingredient.flowerId,
    unitIndex: ingredient.unitIndex,
    slotProgress: ingredient.slotProgress,
    slotState: ingredient.slotState,
    receiver: ingredient.receiver,
    nextObjective: ingredient.nextObjective
  })));
  let secondAssembly = twiceReloadedPartialAssembly;
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
  expectPhysicalBouquetGeometry(secondAssembly, ROUND_ONE_COMPOSITION);
  await page.screenshot({ path: `work/live-bouquet-${label}-mid-progress.png`, fullPage: true });
  await completeRoundWithReviewKey(page);
  const fullPreCeremonyAssembly = await activeBouquetAssemblyState(page);
  expect(fullPreCeremonyAssembly.complete).toBe("true");
  expect(fullPreCeremonyAssembly.liveComposition).toEqual(ROUND_ONE_COMPOSITION);
  expect(fullPreCeremonyAssembly.ingredients).toHaveLength(14);
  expect(fullPreCeremonyAssembly.visibleBlooms).toBe(14);
  expect(fullPreCeremonyAssembly.ingredients.every((ingredient) => ingredient.visualProgress === 1)).toBe(true);
  expect(fullPreCeremonyAssembly.ingredients.every((ingredient) => ingredient.slotState === "filled")).toBe(true);
  expect(earnedHeadCounts(fullPreCeremonyAssembly)).toEqual({ 1: 6, 5: 8 });
  await page.screenshot({ path: `work/live-bouquet-${label}-full-pre-ceremony.png`, fullPage: true });
  const roundOneCeremony = await expectCeremony(page, "Restore Greenhouse", `work/pass2-${label}-round1-pending.png`, "Coins restore the greenhouse.");
  expect(roundOneCeremony.craftedComposition).toEqual(fullPreCeremonyAssembly.liveComposition);
  expect(roundOneCeremony.craftedCompositionKey, "ceremony inherits the exact authoritative live slot identity")
    .toBe(fullPreCeremonyAssembly.compositionKey);
  expect(roundOneCeremony.liveAssemblies, "the completed handoff presents one bouquet, not a duplicate rail object").toBe(0);
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
  await runJourney(page, "mobile390", true);
  expect(consoleMessages).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("simultaneous target gains bind to distinct growing blooms and persist", async ({ page }) => {
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

  for (const config of [
    { label: "desktop", viewport: { width: 1280, height: 720 } },
    { label: "mobile390", viewport: { width: 390, height: 844 } }
  ]) {
    await page.setViewportSize(config.viewport);
    const baseFlowers = [0, 2, 3, 4];
    const fixtureBoard = Array.from({ length: 8 }, (_, y) => (
      Array.from({ length: 8 }, (_, x) => baseFlowers[(x + y * 2) % baseFlowers.length])
    ));
    fixtureBoard[2][3] = 1;
    fixtureBoard[3][3] = 5;
    fixtureBoard[4][3] = 1;
    fixtureBoard[2][4] = 5;
    fixtureBoard[3][4] = 1;
    fixtureBoard[4][4] = 5;
    const fixtureState = {
      focusedEconomyVersion: 2,
      board: fixtureBoard,
      armedLineRelic: { x: 0, y: 7, direction: "horizontal", flowerId: 0 },
      moves: 6,
      coins: 0,
      counts: [0, 0, 0, 0, 0, 0],
      cursedThorns: [],
      clearedCursedThorns: 0,
      currentRound: 1,
      roundComplete: false,
      roundOneRestored: false,
      roundTwoGreenhouseUpgraded: false,
      roundThreeConservatoryRaised: false,
      hasMadeValidMove: false,
      restoredRoundTwoGuideMoves: 0,
      tutorialSkipped: true,
      tutorialActive: false,
      blackCandleLessonComplete: true
    };
    const fixtureMarker = `simultaneous-bouquet-gain:${config.label}`;
    await page.addInitScript(({ key, marker, state }) => {
      if (!sessionStorage.getItem(marker)) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem(marker, "seeded");
      }
    }, { key: SAVE_KEY, marker: fixtureMarker, state: fixtureState });
    await page.goto(`${BASE_URL}?simultaneous_bouquet_gain_${config.label}&bloomReview=1`, { waitUntil: "networkidle" });
    await expect(page.locator(".tile")).toHaveCount(64);
    await page.locator('.tile[data-x="3"][data-y="3"]').click();
    await page.locator('.tile[data-x="4"][data-y="3"]').click();
    await page.waitForFunction(() => document.querySelectorAll(".objective-flight").length === 6, null, { timeout: 1800 });
    await page.waitForFunction(() => document.querySelectorAll(".bouquet-bind-seal").length === 2, null, { timeout: 1800 });
    const transient = await page.evaluate(() => {
      const rectData = (node) => {
        const rect = node.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      };
      const seals = Array.from(document.querySelectorAll(".bouquet-bind-seal"))
        .map((seal) => ({
          flowerId: Number(seal.dataset.flowerId),
          gainedAmount: Number(seal.dataset.gainedAmount),
          rect: rectData(seal)
        }))
        .sort((a, b) => a.flowerId - b.flowerId);
      const receivers = Array.from(document.querySelectorAll(
        "#liveBouquetAssembly .live-bouquet-ingredient.order-pulse[data-gain-receiver=\"true\"]"
      )).map((receiver) => ({
        flowerId: Number(receiver.dataset.flowerId),
        slot: Number(receiver.dataset.liveSlot),
        slotProgress: Number(receiver.dataset.slotProgress),
        rect: rectData(receiver)
      })).sort((a, b) => a.flowerId - b.flowerId);
      const flights = Array.from(document.querySelectorAll(".objective-flight"))
        .map((flight) => ({
          flowerId: Number(flight.dataset.flowerId),
          slot: Number(flight.dataset.growthSlot)
        }))
        .sort((a, b) => (a.flowerId - b.flowerId) || (a.slot - b.slot));
      return {
        seals,
        receivers,
        flights,
        progress: document.querySelector("#liveBouquetAssembly")?.dataset.progress || "",
        overflowX: document.documentElement.scrollWidth > innerWidth + 1
      };
    });
    expect(transient.progress).toBe("6/14");
    expect(transient.seals.map((seal) => [seal.flowerId, seal.gainedAmount])).toEqual([[1, 3], [5, 3]]);
    expect(transient.receivers.map((receiver) => [receiver.flowerId, receiver.slot]))
      .toEqual([[1, 1], [1, 3], [1, 5], [5, 0], [5, 2], [5, 4]]);
    expect(transient.receivers.every((receiver) => receiver.slotProgress > 0)).toBe(true);
    expect(transient.flights, "simultaneous species gains land once on every changed physical head")
      .toEqual(transient.receivers.map(({ flowerId, slot }) => ({ flowerId, slot })));
    expect(
      transient.seals[0].rect.right <= transient.seals[1].rect.left + 1
        || transient.seals[1].rect.right <= transient.seals[0].rect.left + 1,
      `${config.label} simultaneous acceptance seals remain distinct`
    ).toBe(true);
    expect(transient.overflowX).toBe(false);
    await page.screenshot({ path: `work/live-bouquet-${config.label}-mixed-simultaneous-landing.png`, fullPage: true });
    await page.waitForFunction(() => (
      document.querySelectorAll(".objective-flight, .bouquet-bind-seal").length === 0
    ), null, { timeout: 2500 });
    await page.reload({ waitUntil: "networkidle" });
    const persisted = await activeBouquetAssemblyState(page);
    expect(persisted.progress).toBe("6/14");
    expect(earnedHeadCounts(persisted)).toEqual({ 1: 3, 5: 3 });
    expect(new Set(persisted.ingredients
      .filter((ingredient) => ingredient.slotProgress > 0)
      .map((ingredient) => ingredient.flowerId))).toEqual(new Set([1, 5]));
    expect(await page.locator(".objective-flight, .bouquet-bind-seal").count()).toBe(0);
    await page.reload({ waitUntil: "networkidle" });
    const twicePersisted = await activeBouquetAssemblyState(page);
    expect(twicePersisted.ingredients.map((ingredient) => ({
      flowerId: ingredient.flowerId,
      unitIndex: ingredient.unitIndex,
      slotState: ingredient.slotState
    }))).toEqual(persisted.ingredients.map((ingredient) => ({
      flowerId: ingredient.flowerId,
      unitIndex: ingredient.unitIndex,
      slotState: ingredient.slotState
    })));
    expect(await page.locator(".objective-flight, .bouquet-bind-seal").count()).toBe(0);
  }

  expect(consoleMessages).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("nearly complete and mixed Round 2/3 progress stays legible in the physical bouquet", async ({ page }) => {
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

  const board = Array.from({ length: 8 }, (_, y) => (
    Array.from({ length: 8 }, (_, x) => (x + y * 2) % 6)
  ));
  const fixtures = [
    {
      label: "round1-nearly",
      round: 1,
      counts: [0, 5, 0, 0, 0, 8],
      clearedCursedThorns: 0,
      cursedThorns: [],
      expectedProgress: "13/14",
      expectedState: "nearly",
      composition: ROUND_ONE_COMPOSITION,
      species: [1, 5],
      earnedHeads: { 1: 5, 5: 8 },
      thornProgress: ""
    },
    {
      label: "round2-mixed",
      round: 2,
      counts: [0, 0, 5, 0, 4, 3],
      clearedCursedThorns: 2,
      cursedThorns: [{ x: 2, y: 1, hp: 1 }],
      expectedProgress: "14/29",
      expectedState: "mid",
      composition: ROUND_TWO_COMPOSITION,
      species: [2, 4, 5],
      earnedHeads: { 2: 5, 4: 4, 5: 3 },
      thornProgress: "2/3"
    },
    {
      label: "round3-mixed",
      round: 3,
      counts: [8, 0, 0, 7, 0, 0],
      clearedCursedThorns: 0,
      cursedThorns: [],
      expectedProgress: "15/27",
      expectedState: "mid",
      composition: ROUND_THREE_COMPOSITION,
      species: [0, 3],
      earnedHeads: { 0: 8, 3: 7 },
      thornProgress: ""
    }
  ];

  for (const viewport of [
    { label: "desktop", size: { width: 1280, height: 720 } },
    { label: "mobile390", size: { width: 390, height: 844 } }
  ]) {
    await page.setViewportSize(viewport.size);
    for (const fixture of fixtures) {
      await page.goto(`${BASE_URL}?physical-bouquet-${viewport.label}-${fixture.label}`, { waitUntil: "networkidle" });
      await page.evaluate(({ key, state }) => {
        localStorage.setItem(key, JSON.stringify(state));
      }, {
        key: SAVE_KEY,
        state: {
          focusedEconomyVersion: 2,
          board,
          moves: fixture.round === 1 ? 1 : fixture.round === 2 ? 5 : 4,
          coins: fixture.round === 2 ? 20 : 30,
          counts: fixture.counts,
          cursedThorns: fixture.cursedThorns,
          clearedCursedThorns: fixture.clearedCursedThorns,
          currentRound: fixture.round,
          roundComplete: false,
          roundOneRestored: fixture.round > 1,
          roundTwoGreenhouseUpgraded: fixture.round === 3,
          roundThreeConservatoryRaised: false,
          hasMadeValidMove: true,
          restoredRoundTwoGuideMoves: 2,
          tutorialSkipped: true,
          tutorialActive: false,
          blackCandleLessonComplete: true
        }
      });
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator(".tile")).toHaveCount(64);
      const assembly = await activeBouquetAssemblyState(page);
      expect(assembly.progress).toBe(fixture.expectedProgress);
      expect(assembly.state).toBe(fixture.expectedState);
      expectPhysicalBouquetGeometry(assembly, fixture.composition);
      expect(new Set(assembly.ingredients
        .filter((ingredient) => ingredient.slotProgress > 0)
        .map((ingredient) => ingredient.flowerId))).toEqual(new Set(fixture.species));
      expect(earnedHeadCounts(assembly), `${fixture.label} visual heads equal authoritative flower counts`)
        .toEqual(fixture.earnedHeads);
      expect(assembly.ingredients.filter((ingredient) => ingredient.slotProgress > 0).length)
        .toBeGreaterThanOrEqual(fixture.species.length);
      const renderedPixels = await renderedBouquetPixelStats(page);
      fixture.species.forEach((flowerId) => {
        const speciesHeads = renderedPixels.filter((head) => head.flowerId === flowerId && head.slotProgress > 0);
        expect(speciesHeads.length, `${fixture.label} visibly contributes species ${flowerId}`).toBeGreaterThan(0);
        expect(Math.max(...speciesHeads.map((head) => head.coloredPixels)),
          `${fixture.label} species ${flowerId} retains rendered color identity`).toBeGreaterThan(12);
      });
      if (fixture.label === "round1-nearly") {
        expect(renderedPixels.filter((head) => head.slotProgress > 0),
          "13/14 is exactly thirteen visibly earned heads").toHaveLength(13);
        expect(Math.min(...renderedPixels.filter((head) => head.slotProgress > 0).map((head) => head.p90)),
          `near-complete earned heads remain individually lit: ${JSON.stringify(renderedPixels)}`).toBeGreaterThan(18);
      }
      if (fixture.thornProgress) {
        expect(assembly.thorn?.progress, "Round 2 bouquet carries the authoritative Thorn seal").toBe(fixture.thornProgress);
        expect(Math.max(...assembly.ingredients.map((ingredient) => overlapRatio(ingredient, assembly.thorn))),
          "Thorn seal does not obscure an ingredient head").toBeLessThan(.2);
      } else {
        expect(assembly.thorn).toBeNull();
      }
      expect(assembly.overflowX).toBe(false);
      if (viewport.label === "mobile390") {
        expect(assembly.boardBottom, "all eight mobile rows remain in the first viewport").toBeLessThanOrEqual(844);
      }
      await page.screenshot({
        path: `work/live-bouquet-${viewport.label}-${fixture.label}.png`,
        fullPage: true
      });
    }
  }

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
    expect(binding.craftedComposition).toEqual(ROUND_ONE_COMPOSITION);
    expect(binding.craftedTargetCounts).toBe("5:8,1:6");
    expect(binding.craftedBouquets, "binding starts with the same one complete physical bouquet").toBe(1);
    expect(binding.craftedBlooms, "all fourteen inherited heads remain visible from the first binding frame").toBe(14);
    expect(binding.liveAssemblies, "binding never competes with a duplicate live-rail bouquet").toBe(0);
    const hiddenLiveCompositionKey = await page.locator("#liveBouquetAssembly").getAttribute("data-composition-key");
    expect(binding.craftedCompositionKey, "binding preserves exact live species, order, and objective identity")
      .toBe(hiddenLiveCompositionKey);
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
    expectPhysicalBouquetGeometry(active, ROUND_ONE_COMPOSITION);
    expect(active.ingredients.some((ingredient) => ingredient.slotProgress > 0)).toBe(true);
    expect(active.visibleBlooms).toBe(active.ingredients.filter((ingredient) => ingredient.slotProgress > 0).length);
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
    expect(contract.craftedBlooms).toBe(14);
    expect(contract.craftedStems).toBe(14);
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
