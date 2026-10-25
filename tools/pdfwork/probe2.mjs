import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const OPS = pdfjs.OPS;
const doc = await pdfjs.getDocument({ url: 'C:/Users/Малина/Desktop/карта.pdf', useSystemFonts: true }).promise;
const page = await doc.getPage(1);
const { fnArray, argsArray } = await page.getOperatorList();

// коды 10..30 → имена
const byCode = new Map();
for (const [k, v] of Object.entries(OPS)) if (typeof v === 'number' && v >= 10 && v <= 30) byCode.set(v, k);
console.log('codes 10-30:', [...byCode.entries()].sort((a, b) => a[0] - b[0]).map(([v, k]) => v + '=' + k).join(' '));

let shown = 0;
for (let i = 0; i < fnArray.length && shown < 6; i++) {
  if (fnArray[i] === OPS.constructPath) {
    const a = argsArray[i];
    console.log(`--- cp[${i}]: a0=${JSON.stringify(a[0])} a1.len=${a[1] && a[1].length}`);
    const inner = a[1];
    if (Array.isArray(inner)) {
      for (let j = 0; j < Math.min(inner.length, 3); j++) {
        const el = inner[j];
        console.log(`  inner[${j}]:`, el && el.constructor ? el.constructor.name : typeof el, Array.isArray(el) || (el && el.BYTES_PER_ELEMENT) ? Array.from(el).slice(0, 20) : el);
      }
    }
    if (a[2] !== undefined) console.log('  a2:', a[2]);
    shown++;
  }
}
