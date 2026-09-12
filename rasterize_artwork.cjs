// Optional artwork preparation: node rasterize_artwork.cjs (requires sharp).
// Normal emulator builds use the checked-in pixel data and need only Python.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

const names = ['us-new-york', 'gb-london', 'fr-paris', 'us-san-francisco', 'us-seattle', 'jp-tokyo'];
const size = 240;

async function main() {
  const images = {};
  for (const name of names) {
    const svg = fs.readFileSync(path.join(__dirname, 'assets', name + '.svg'));
    const { data, info } = await sharp(svg, { density: 144 })
      .resize(size, size, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.channels !== 4) throw new Error('Expected RGBA artwork: ' + name);
    let left = size, top = size, right = -1, bottom = -1;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (data[(y * size + x) * 4 + 3] > 65) {
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
    if (right < left) throw new Error('Empty artwork: ' + name);
    const width = right - left + 1, height = bottom - top + 1;
    const alpha = Buffer.alloc(width * height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      alpha[y * width + x] = data[((top + y) * size + left + x) * 4 + 3];
    }
    images[name] = { width, height, alpha: alpha.toString('hex'), sourceSha256: crypto.createHash('sha256').update(svg).digest('hex') };
    console.log(name + ': ' + width + ' x ' + height);
  }
  fs.writeFileSync(path.join(__dirname, 'assets', 'landmark-pixels.json'), JSON.stringify({ version: 1, images }) + '\n');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
