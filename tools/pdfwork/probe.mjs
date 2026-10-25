import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const OPS = pdfjs.OPS;
console.log('pdfjs version:', pdfjs.version);
const doc = await pdfjs.getDocument({ url: 'C:/Users/Малина/Desktop/карта.pdf', useSystemFonts: true }).promise;
const page = await doc.getPage(1);
const { fnArray, argsArray } = await page.getOperatorList();
const idx = fnArray.indexOf(OPS.constructPath);
console.log('constructPath at', idx, 'total ops:', fnArray.length);
const a = argsArray[idx];
console.log('args type:', typeof a, Array.isArray(a), a && a.constructor && a.constructor.name);
console.log('args[0]:', a && a[0] && a[0].constructor && a[0].constructor.name, a && a[0]);
console.log('args[1]:', a && a[1] && a[1].constructor && a[1].constructor.name, a && a[1] && Array.from(a[1]).slice(0, 12));
console.log('OPS keys sample: moveTo', OPS.moveTo, 'lineTo', OPS.lineTo, 'rectangle', OPS.rectangle);
// histogram of op codes
const hist = new Map();
for (const f of fnArray) hist.set(f, (hist.get(f) || 0) + 1);
const named = [...hist.entries()].map(([k, v]) => {
  const n = Object.keys(OPS).find(key => OPS[key] === k);
  return `${n || k}:${v}`;
}).sort((a, b) => parseInt(b.split(':')[1]) - parseInt(a.split(':')[1]));
console.log('top ops:', named.slice(0, 25).join('  '));
