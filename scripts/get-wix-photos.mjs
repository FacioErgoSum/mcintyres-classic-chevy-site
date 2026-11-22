// Downloads the yard and chassis photos from the old Wix site into public/photos,
// compressed for the web. Run once:  npm run photos
import fs from 'node:fs';
import sharp from 'sharp';

const WIX = 'https://static.wixstatic.com/media/';
const PHOTOS = [
  // the yard full of Tri-Fives (old site's home banner)
  { file: 'eb9c8f_68869ec519674559a9e04d3f32c27b77~mv2.jpg', out: 'yard', widths: [800, 1600] },
  // frame-off chassis build in front of the shop
  { file: 'eb9c8f_012ef0b751584c2ab1a7f2e8d81bf236~mv2_d_2048_1536_s_2.jpg', out: 'chassis', widths: [800, 1400] },
];

fs.mkdirSync('public/photos', { recursive: true });
for (const p of PHOTOS) {
  const res = await fetch(WIX + p.file);
  if (!res.ok) { console.log(`! ${p.out}: HTTP ${res.status}`); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  for (const w of p.widths) {
    const out = `public/photos/${p.out}-${w}.webp`;
    let img = sharp(buf).rotate().resize({ width: w, withoutEnlargement: true });
    if (!p.keepAlpha) img = img.flatten({ background: '#ffffff' });
    await img.webp({ quality: p.keepAlpha ? 90 : 78 }).toFile(out);
    console.log(`${out}  ${Math.round(fs.statSync(out).size / 1024)} KB`);
  }
}
