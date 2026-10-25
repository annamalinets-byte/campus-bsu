// Сверка 4–5 этажей с PDF-стендом: извлекаем подписи целевых комнат с координатами
// и печатаем по «полосам» (кластеры по y), чтобы сравнить взаимное расположение
// с data/economics-building.json (текущие этажи 4–5).
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pdfPath = join(ROOT, 'data', 'source-stand.pdf').replace(/\\/g, '/');
const doc = await pdfjs.getDocument({ url: pdfPath, useSystemFonts: true }).promise;
const page = await doc.getPage(1);
const vp = page.getViewport({ scale: 1 });
const tc = await page.getTextContent();

const items = tc.items.map(it => ({
  s: it.str.trim(),
  x: Math.round(it.transform[4]),
  y: Math.round(vp.height - it.transform[5]), // y вниз от верха страницы
  h: Math.round(it.height),
})).filter(it => it.s);

const TARGETS = new Set(['63', '63А', '63A', '64', '65', '67', '69', '70', '71', '71А', '71A',
  '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '86', 'WC']);
const WORDS = ['ДЕКАНАТ', 'ГЛАВНЫЙ', 'БИБЛИОТЕКА', 'СПОРТ', 'РАЗДЕВАЛКА', 'ЭТАЖ', 'Ж', 'М'];

const hits = items.filter(it =>
  TARGETS.has(it.s.toUpperCase().replace('A', 'А')) ||
  (WORDS.some(w => it.s.toUpperCase().includes(w)) && it.s.length <= 30)
);

// кластеризуем по y: новая полоса, если разрыв > 250 единиц
hits.sort((a, b) => a.y - b.y || a.x - b.x);
const bands = [];
for (const it of hits) {
  const last = bands[bands.length - 1];
  if (last && it.y - last.maxY < 250) { last.items.push(it); last.maxY = Math.max(last.maxY, it.y); }
  else bands.push({ items: [it], maxY: it.y });
}

bands.forEach((b, i) => {
  console.log(`\n--- полоса ${i + 1} (y ≈ ${b.items[0].y}–${b.maxY}) ---`);
  b.items.sort((a, c) => a.x - c.x);
  for (const it of b.items) console.log(`  x=${String(it.x).padStart(5)}  y=${String(it.y).padStart(5)}  h=${String(it.h).padStart(4)}  ${it.s}`);
});
console.log(`\nвсего подписей-совпадений: ${hits.length}, полос: ${bands.length}`);
