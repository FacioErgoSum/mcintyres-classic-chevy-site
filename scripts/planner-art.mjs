// Gets the parts finder pictures in public/planner/ ready. Runs by itself
// before `npm run dev` and `npm run build`.
//
// 1. Zoom to fit: trims the plain border around each picture (white or
//    see-through, whatever color its top-left corner is), so every part fills
//    its tile the same way. The trimmed copies go in public/planner/fit/ as
//    .webp. Your originals are never changed.
// 2. Writes lib/planner-art.json, e.g. { "year-1955": "/planner/fit/year-1955.webp", ... }
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('public/planner');
const fitDir = path.join(dir, 'fit');
const MARGIN = 0.03; // keep a sliver of space around the part (3% of its size)
const rank = { '.webp': 0, '.png': 1, '.jpg': 2, '.jpeg': 3 }; // webp wins if there are two

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('Parts finder pictures: sharp is not installed, so pictures are used untrimmed.');
}

const sources = {};
if (fs.existsSync(dir)) {
  for (const f of fs.readdirSync(dir).sort()) {
    const ext = path.extname(f).toLowerCase();
    if (!(ext in rank)) continue;
    const name = path.basename(f, path.extname(f)).toLowerCase();
    if (!sources[name] || rank[ext] < rank[path.extname(sources[name]).toLowerCase()]) sources[name] = f;
  }
}

const out = {};
let trimmed = 0;
if (sharp) fs.mkdirSync(fitDir, { recursive: true });
for (const [name, file] of Object.entries(sources)) {
  const src = path.join(dir, file);
  const dest = path.join(fitDir, `${name}.webp`);
  if (!sharp) {
    out[name] = `/planner/${file}`;
    continue;
  }
  try {
    const fresh = fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs;
    if (!fresh) {
      const { data, info } = await sharp(src).ensureAlpha().trim({ threshold: 20 }).toBuffer({ resolveWithObject: true });
      const pad = Math.round(Math.max(info.width, info.height) * MARGIN);
      await sharp(data)
        .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 86, alphaQuality: 90 })
        .toFile(dest);
      trimmed++;
    }
    out[name] = `/planner/fit/${name}.webp?v=${Math.round(fs.statSync(dest).mtimeMs)}`;
  } catch (e) {
    console.warn(`Parts finder pictures: couldn’t trim ${file} (${e.message}); using it as it is.`);
    out[name] = `/planner/${file}`;
  }
}

fs.writeFileSync(path.resolve('lib/planner-art.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`Parts finder pictures: ${Object.keys(out).length} ready${trimmed ? `, ${trimmed} trimmed to fit` : ''}.`);
