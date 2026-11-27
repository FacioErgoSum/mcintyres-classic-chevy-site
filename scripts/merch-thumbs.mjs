// Small copies of the merch photos for the merch page grid. Runs by itself before
// `npm run dev` and `npm run build`.
//
// The photos in public/merch/ are 1680 px wide for the item page's zoom; the grid
// shows them about 300 px wide. For each photo this makes name-thumb.webp
// (600 px, plenty for sharp phones) next to it. Originals are never changed, and
// a copy is only remade when its photo changes. The page falls back to the
// original when a copy is missing, so nothing breaks if this can't run.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('public/merch');
const WIDTH = 600;

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('Merch thumbnails: sharp is not installed, so the merch page uses the full-size photos.');
  process.exit(0);
}

const photos = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(webp|png|jpe?g)$/i.test(e.name) && !/-thumb\.webp$/i.test(e.name)) photos.push(p);
  }
};
if (fs.existsSync(root)) walk(root);

let made = 0;
for (const src of photos) {
  const dest = src.replace(/\.(webp|png|jpe?g)$/i, '-thumb.webp');
  try {
    if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs) continue;
    await sharp(src).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toFile(dest);
    made++;
  } catch (e) {
    console.warn(`Merch thumbnails: couldn’t shrink ${path.relative(root, src)} (${e.message}).`);
  }
}
console.log(`Merch thumbnails: ${photos.length} photos${made ? `, ${made} new copies` : ''}.`);
