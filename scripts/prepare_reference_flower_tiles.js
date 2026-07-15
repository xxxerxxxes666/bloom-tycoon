const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { PNG } = require("pngjs");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = process.argv[2] || path.join(ROOT, "assets/tiles/generated/diablo_gothic_botanical_spritesheet.png");
const OUT_96 = path.join(ROOT, "assets/tiles/96");
const OUT_48 = path.join(ROOT, "assets/tiles/48");
const EVIDENCE = path.join(ROOT, "work/art-pass-six-flower");

const TILES = [
  { name: "Sol Rot", file: "withered_sun_medallion.png", fill: 0.9, lift: 1.02 },
  { name: "Bone Star", file: "bone_white_thorn_star.png", fill: 0.92, lift: 1.05 },
  { name: "Nightshade", file: "purple_nightshade_bloom.png", fill: 0.94, lift: 1.09 },
  { name: "Bloodroot", file: "bloodroot_ruby_shard.png", fill: 0.94, lift: 1.08 },
  { name: "Amber Seed", file: "amber_resin_seed.png", fill: 0.9, lift: 1.03 },
  { name: "Thorn Rose", file: "crimson_rose_rune.png", fill: 0.91, lift: 1.04 },
];

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function readPngFromGit(ref, repoPath) {
  const data = execFileSync("git", ["show", `${ref}:${repoPath}`], { cwd: ROOT });
  return PNG.sync.read(data);
}

function writePng(file, png) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(png, { colorType: 6 }));
}

function sample(src, x, y) {
  const sx = Math.max(0, Math.min(src.width - 1, x));
  const sy = Math.max(0, Math.min(src.height - 1, y));
  const i = (sy * src.width + sx) * 4;
  return [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]];
}

function setPixel(dst, x, y, rgba) {
  const i = (y * dst.width + x) * 4;
  dst.data[i] = rgba[0];
  dst.data[i + 1] = rgba[1];
  dst.data[i + 2] = rgba[2];
  dst.data[i + 3] = rgba[3];
}

function alphaFor(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const light = (r + g + b) / 3;
  const signal = Math.max(max, light + chroma * 1.25);
  if (signal <= 7) return 0;
  if (signal >= 34) return 255;
  return Math.round(((signal - 7) / 27) * 255);
}

function cropCell(src, index) {
  const cellW = Math.floor(src.width / 2);
  const cellH = Math.floor(src.height / 3);
  const cellX = (index % 2) * cellW;
  const cellY = Math.floor(index / 2) * cellH;
  const cell = new PNG({ width: cellW, height: cellH });
  let minX = cellW;
  let minY = cellH;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < cellH; y += 1) {
    for (let x = 0; x < cellW; x += 1) {
      const [r, g, b] = sample(src, cellX + x, cellY + y);
      const alpha = alphaFor(r, g, b);
      setPixel(cell, x, y, [r, g, b, alpha]);
      if (alpha > 18) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(cellW - 1, maxX + pad);
  maxY = Math.min(cellH - 1, maxY + pad);
  return { cell, box: { minX, minY, maxX, maxY } };
}

function alphaAt(src, x, y) {
  return sample(src, x, y)[3];
}

function neighborAlpha(src, x, y, radius) {
  let strongest = 0;
  for (let oy = -radius; oy <= radius; oy += 1) {
    for (let ox = -radius; ox <= radius; ox += 1) {
      if (ox === 0 && oy === 0) continue;
      strongest = Math.max(strongest, alphaAt(src, x + ox, y + oy));
    }
  }
  return strongest;
}

function pruneAlphaNoise(png) {
  const src = PNG.sync.read(PNG.sync.write(png, { colorType: 6 }));
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const [r, g, b, a] = sample(src, x, y);
      const n = neighborAlpha(src, x, y, 1);
      if (a < 26 && n < 38) {
        setPixel(png, x, y, [r, g, b, 0]);
      } else if (a > 0 && a < 52 && n > 120) {
        setPixel(png, x, y, [r, g, b, Math.min(74, a + 16)]);
      }
    }
  }
}

function bilinear(src, fx, fy) {
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(src.width - 1, x0 + 1);
  const y1 = Math.min(src.height - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const a = sample(src, x0, y0);
  const b = sample(src, x1, y0);
  const c = sample(src, x0, y1);
  const d = sample(src, x1, y1);
  const out = [0, 0, 0, 0];
  for (let i = 0; i < 4; i += 1) {
    const top = a[i] * (1 - tx) + b[i] * tx;
    const bottom = c[i] * (1 - tx) + d[i] * tx;
    out[i] = Math.round(top * (1 - ty) + bottom * ty);
  }
  return out;
}

function resizeIcon(src, box, size, tile) {
  const dst = new PNG({ width: size, height: size });
  const boxW = box.maxX - box.minX + 1;
  const boxH = box.maxY - box.minY + 1;
  const target = Math.round(size * tile.fill);
  const scale = Math.min(target / boxW, target / boxH);
  const drawW = Math.max(1, Math.round(boxW * scale));
  const drawH = Math.max(1, Math.round(boxH * scale));
  const left = Math.round((size - drawW) / 2);
  const top = Math.round((size - drawH) / 2);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) setPixel(dst, x, y, [0, 0, 0, 0]);
  }

  for (let y = 0; y < drawH; y += 1) {
    for (let x = 0; x < drawW; x += 1) {
      const sx = box.minX + (x + 0.5) / scale - 0.5;
      const sy = box.minY + (y + 0.5) / scale - 0.5;
      const [r, g, b, a] = bilinear(src, sx, sy);
      if (a < 4) continue;
      const nx = drawW <= 1 ? 0.5 : x / (drawW - 1);
      const ny = drawH <= 1 ? 0.5 : y / (drawH - 1);
      const candle = Math.max(0, 1 - Math.hypot(nx - 0.22, ny - 0.16) / 0.92);
      const underburn = Math.max(0, (nx + ny - 1.02) * 0.42);
      const lift = (size === 48 ? 1.08 : 1.035) * tile.lift;
      const contrast = size === 48 ? 1.13 : 1.07;
      const grade = (v, warmth = 0) => {
        const lit = (v + candle * warmth - underburn * 34 - 18) * contrast * lift + 18;
        return Math.max(0, Math.min(255, Math.round(lit)));
      };
      setPixel(dst, left + x, top + y, [
        grade(r, 14),
        grade(g, 8),
        grade(b, 2),
        a,
      ]);
    }
  }

  pruneAlphaNoise(dst);
  addSocketShadow(dst, size);
  return { png: dst, drawW, drawH, scale };
}

function addSocketShadow(png, size) {
  const src = PNG.sync.read(PNG.sync.write(png, { colorType: 6 }));
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (x === 0 || y === 0 || x === png.width - 1 || y === png.height - 1) continue;
      if (alphaAt(src, x, y) > 0) continue;
      const near = neighborAlpha(src, x - Math.round(size * 0.025), y - Math.round(size * 0.025), size === 48 ? 1 : 2);
      if (near < 42) continue;
      const a = Math.min(size === 48 ? 46 : 38, Math.round(near * 0.16));
      setPixel(png, x, y, [5, 3, 3, a]);
    }
  }
}

function paste(dst, src, ox, oy, matte = [5, 4, 4]) {
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const [r, g, b, a] = sample(src, x, y);
      const alpha = a / 255;
      const bg = sample(dst, ox + x, oy + y);
      setPixel(dst, ox + x, oy + y, [
        Math.round(r * alpha + (bg[3] ? bg[0] : matte[0]) * (1 - alpha)),
        Math.round(g * alpha + (bg[3] ? bg[1] : matte[1]) * (1 - alpha)),
        Math.round(b * alpha + (bg[3] ? bg[2] : matte[2]) * (1 - alpha)),
        255,
      ]);
    }
  }
}

function contactSheet(images, labels, file) {
  const cell = 128;
  const gap = 16;
  const width = gap + images.length * (cell + gap);
  const height = 160;
  const sheet = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const v = (x + y) % 2 ? 7 : 5;
      setPixel(sheet, x, y, [v, 5, 5, 255]);
    }
  }
  images.forEach((img, i) => {
    const ox = gap + i * (cell + gap) + 16;
    paste(sheet, img, ox, 14);
  });
  writePng(file, sheet);
  fs.writeFileSync(file.replace(/\.png$/, ".txt"), labels.join("\n") + "\n", "utf8");
}

function beforeAfterSheet(beforeImages, afterImages, file) {
  const cell = 104;
  const gap = 14;
  const labelBand = 22;
  const width = gap + TILES.length * (cell + gap);
  const height = labelBand + (cell + gap) * 2 + gap;
  const sheet = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const warmBand = y < labelBand + cell + gap;
      const v = warmBand ? 6 : 9;
      setPixel(sheet, x, y, [v, warmBand ? 5 : 7, warmBand ? 4 : 8, 255]);
    }
  }
  beforeImages.forEach((img, i) => paste(sheet, img, gap + i * (cell + gap) + 4, labelBand + 4));
  afterImages.forEach((img, i) => paste(sheet, img, gap + i * (cell + gap) + 4, labelBand + cell + gap + 4));
  writePng(file, sheet);
  fs.writeFileSync(file.replace(/\.png$/, ".txt"), [
    "Row 1: before assets in the previous carved-square PNG style.",
    "Row 2: after assets cropped from the supplied 2x3 original raster sheet, transparent-background, normalized scale.",
    ...TILES.map((tile) => tile.name),
  ].join("\n") + "\n", "utf8");
}

function grayscale(src) {
  const dst = new PNG({ width: src.width, height: src.height });
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const [r, g, b, a] = sample(src, x, y);
      const luma = Math.round(r * 0.2126 + g * 0.7152 + b * 0.0722);
      setPixel(dst, x, y, [luma, luma, luma, a]);
    }
  }
  return dst;
}

function silhouette(src) {
  const dst = new PNG({ width: src.width, height: src.height });
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const a = sample(src, x, y)[3];
      setPixel(dst, x, y, [228, 218, 192, a > 18 ? 255 : 0]);
    }
  }
  return dst;
}

function main() {
  const src = readPng(SOURCE);
  if (src.width % 2 || src.height % 3) {
    throw new Error(`Source sheet must divide into 2x3 equal cells, got ${src.width}x${src.height}`);
  }

  fs.mkdirSync(EVIDENCE, { recursive: true });
  const beforeRef = process.env.BEFORE_REF || "";
  const old96 = TILES.map((tile) => (
    beforeRef
      ? readPngFromGit(beforeRef, `assets/tiles/96/${tile.file}`)
      : readPng(path.join(OUT_96, tile.file))
  ));
  const after96 = [];
  const metrics = [];

  TILES.forEach((tile, index) => {
    const { cell, box } = cropCell(src, index);
    const large = resizeIcon(cell, box, 96, tile);
    const small = resizeIcon(cell, box, 48, tile);
    writePng(path.join(OUT_96, tile.file), large.png);
    writePng(path.join(OUT_48, tile.file), small.png);
    after96.push(large.png);
    metrics.push({
      name: tile.name,
      file: tile.file,
      sourceBox: `${box.maxX - box.minX + 1}x${box.maxY - box.minY + 1}`,
      output96: `${large.drawW}x${large.drawH}`,
      output48: `${small.drawW}x${small.drawH}`,
    });
  });

  contactSheet(old96, TILES.map((tile) => `before: ${tile.name}`), path.join(EVIDENCE, "six-flowers-before-96.png"));
  contactSheet(after96, TILES.map((tile) => `after: ${tile.name}`), path.join(EVIDENCE, "six-flowers-after-96.png"));
  contactSheet(after96.map(grayscale), TILES.map((tile) => `grayscale: ${tile.name}`), path.join(EVIDENCE, "six-flowers-grayscale-96.png"));
  contactSheet(after96.map(silhouette), TILES.map((tile) => `silhouette: ${tile.name}`), path.join(EVIDENCE, "six-flowers-silhouette-96.png"));
  beforeAfterSheet(old96, after96, path.join(EVIDENCE, "six-flowers-before-after-96.png"));
  fs.writeFileSync(path.join(EVIDENCE, "crop-metrics.json"), JSON.stringify({ source: SOURCE, beforeRef: beforeRef || null, sourceSize: `${src.width}x${src.height}`, metrics }, null, 2) + "\n");
  console.log(JSON.stringify({ source: SOURCE, beforeRef: beforeRef || null, sourceSize: `${src.width}x${src.height}`, metrics }, null, 2));
}

main();
