// Рендер страниц карта.pdf в PNG + извлечение текста с координатами.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { createCanvas } = require('@napi-rs/canvas');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');

const SRC = 'C:/Users/Малина/Desktop/карта.pdf';
const OUT = 'C:/Users/Малина/Downloads/Telegram Desktop/campus-bsu/campus-bsu/tools/pdfwork/out';
mkdirSync(OUT, { recursive: true });

const doc = await pdfjs.getDocument({ url: SRC, useSystemFonts: true }).promise;
console.log('pages:', doc.numPages);

const SCALE = 2.5;
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const vp = page.getViewport({ scale: SCALE });

  const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;

  const png = canvas.toBuffer('image/png');
  writeFileSync(join(OUT, `page-${i}.png`), png);

  // текст: строки + координаты в исходных единицах PDF (y сверху после flip)
  const tc = await page.getTextContent();
  const items = tc.items.map(it => ({
    s: it.str,
    x: Math.round(it.transform[4] * 10) / 10,
    y: Math.round((vp.height / SCALE - it.transform[5]) * 10) / 10, // y вниз от верха
    w: Math.round(it.width * 10) / 10,
    h: Math.round(it.height * 10) / 10
  })).filter(it => it.s.trim());
  writeFileSync(join(OUT, `page-${i}-text.json`), JSON.stringify(items, null, 1));

  console.log(`page ${i}: ${canvas.width}x${canvas.height}px, ${items.length} текстовых фрагментов`);
  page.cleanup();
}
console.log('OK');
