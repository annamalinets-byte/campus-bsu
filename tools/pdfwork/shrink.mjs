// Уменьшение PNG до заданной ширины: node shrink.mjs in.png out.png [width]
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const [inp, outp, wStr] = process.argv.slice(2);
const w = Number(wStr || 2400);
const img = await loadImage(readFileSync(inp));
const h = Math.round(img.height * w / img.width);
const canvas = createCanvas(w, h);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#fff';
ctx.fillRect(0, 0, w, h);
ctx.drawImage(img, 0, 0, w, h);
writeFileSync(outp, canvas.toBuffer('image/png'));
console.log('saved', outp, w + 'x' + h);
