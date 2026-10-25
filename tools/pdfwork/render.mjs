// Рендер фрагмента страницы карта.pdf: node render.mjs <scale> <x> <y> <w> <h> <out.png>
// x,y — левый-верхний угол в единицах PDF (y от верха страницы).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { createCanvas } = require('@napi-rs/canvas');
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

const [scale, x, y, w, h, out] = process.argv.slice(2).map((v, i) => (i === 5 ? v : Number(v)));
const doc = await pdfjs.getDocument({ url: 'C:/Users/Малина/Desktop/карта.pdf', useSystemFonts: true }).promise;
const page = await doc.getPage(1);
const vp1 = page.getViewport({ scale: 1 });
const vp = page.getViewport({ scale });

const cw = Math.ceil(w * scale), ch = Math.ceil(h * scale);
const canvas = createCanvas(cw, ch);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#fff';
ctx.fillRect(0, 0, cw, ch);
// pdfjs рисует всю страницу; сдвигаем контекст, чтобы вырезать нужный фрагмент
// y в viewport растёт вниз; наш y тоже от верха
await page.render({ canvasContext: ctx, viewport: vp, transform: [scale, 0, 0, scale, -x * scale, -y * scale] }).promise;
writeFileSync(out, canvas.toBuffer('image/png'));
console.log('saved', out, cw + 'x' + ch);
