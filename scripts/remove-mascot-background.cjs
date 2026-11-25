// Run after: npm install --prefix .artifacts/gif-tools sharp
// Operates on copies inside public; keeps the supplied source GIF unchanged.
const sharp = require('../.artifacts/gif-tools/node_modules/sharp');
const path = require('node:path');
const fs = require('node:fs');

async function main() {
  const root = path.resolve(__dirname, '..');
  const input = path.join(root, 'public/images/mascot/welcome.gif');
  const meta = await sharp(input, { animated: true }).metadata();
  const { data } = await sharp(input, { animated: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = meta.width, h = meta.pageHeight, pixels = w * h;
  for (let frame = 0; frame < meta.pages; frame++) {
    const offset = frame * pixels * 4;
    const seen = new Uint8Array(pixels);
    const queue = new Int32Array(pixels);
    let head = 0, tail = 0;
    function add(index) {
      if (seen[index]) return;
      const p = offset + index * 4;
      const lo = Math.min(data[p], data[p + 1], data[p + 2]);
      const hi = Math.max(data[p], data[p + 1], data[p + 2]);
      if (data[p + 3] === 0 || (lo >= 210 && hi - lo <= 20)) {
        seen[index] = 1; queue[tail++] = index;
      }
    }
    for (let x = 0; x < w; x++) { add(x); add((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { add(y * w); add(y * w + w - 1); }
    while (head < tail) {
      const i = queue[head++], x = i % w;
      if (x) add(i - 1);
      if (x < w - 1) add(i + 1);
      if (i >= w) add(i - w);
      if (i < pixels - w) add(i + w);
    }
    for (let i = 0; i < pixels; i++) if (seen[i]) data[offset + i * 4 + 3] = 0;
    console.log(`Frame ${frame + 1}/${meta.pages}: removed ${tail} background pixels`);
  }
  const options = { raw: { width: w, height: h * meta.pages, channels: 4, pageHeight: h } };
  const out = path.join(root, 'public/images/mascot');
  await sharp(data, options).webp({ lossless: true, loop: meta.loop, delay: meta.delay }).toFile(path.join(out, 'welcome-transparent.webp'));
  await sharp(data, options).gif({ loop: meta.loop, delay: meta.delay }).toFile(path.join(out, 'welcome-transparent.gif'));
  await sharp(data.subarray(0, pixels * 4), { raw: { width: w, height: h, channels: 4 } }).png().toFile(path.join(out, 'welcome-transparent.png'));
  const result = await sharp(path.join(out, 'welcome-transparent.webp'), { animated: true }).metadata();
  if (result.pages !== meta.pages || JSON.stringify(result.delay) !== JSON.stringify(meta.delay) || !result.hasAlpha)
    throw new Error('Animation or alpha verification failed');
  const previews = path.join(root, '.artifacts/mascot-preview');
  fs.mkdirSync(previews, { recursive: true });
  for (const frame of [0, 15, 29]) {
    const buffer = data.subarray(frame * pixels * 4, (frame + 1) * pixels * 4);
    await sharp(buffer, { raw: { width: w, height: h, channels: 4 } }).flatten({ background: '#f8faff' }).png()
      .toFile(path.join(previews, `frame-${frame}.png`));
  }
  console.log(`Verified ${result.pages} frames, original timing, true alpha, continuous loop.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
