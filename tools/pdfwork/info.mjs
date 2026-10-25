import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const doc = await pdfjs.getDocument({ url: 'C:/Users/Малина/Desktop/карта.pdf', useSystemFonts: true }).promise;
console.log('pages:', doc.numPages);
for (let i = 1; i <= doc.numPages; i++) {
  const p = await doc.getPage(i);
  const vp = p.getViewport({ scale: 1 });
  console.log('page', i, 'size:', Math.round(vp.width), 'x', Math.round(vp.height), 'rotation:', p.rotate);
}
