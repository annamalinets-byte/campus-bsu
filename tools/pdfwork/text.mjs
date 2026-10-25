import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const doc = await pdfjs.getDocument({ url: 'C:/Users/Малина/Desktop/карта.pdf', useSystemFonts: true }).promise;
const page = await doc.getPage(1);
const vp1 = page.getViewport({ scale: 1 });
console.log('viewport 1x:', vp1.width, 'x', vp1.height);
const tc = await page.getTextContent();
const items = tc.items.map(it => ({
  s: it.str,
  x: Math.round(it.transform[4] * 10) / 10,
  y: Math.round((vp1.height - it.transform[5]) * 10) / 10, // y вниз от верха страницы
  h: Math.round(it.height * 10) / 10
})).filter(it => it.s.trim());
writeFileSync('out/text.json', JSON.stringify(items, null, 1));
console.log('fragments:', items.length);
// краткая сводка: диапазоны координат и крупные надписи (заголовки этажей)
const big = items.filter(it => it.h > 150).slice(0, 60);
for (const b of big) console.log(`H=${b.h} @(${b.x},${b.y}): ${b.s.slice(0, 70)}`);
