// Извлечение векторной геометрии из карта.pdf через getOperatorList().
// Собирает пути (сегменты + прямоугольники) в координатах страницы (y вниз от верха),
// группирует по секциям-этажам (по y заголовков), пишет out/geom.json.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const OPS = pdfjs.OPS;

const doc = await pdfjs.getDocument({ url: 'C:/Users/Малина/Desktop/карта.pdf', useSystemFonts: true }).promise;
const page = await doc.getPage(1);
const vp1 = page.getViewport({ scale: 1 });
const PH = vp1.height; // для флипа y

const opList = await page.getOperatorList();
const { fnArray, argsArray } = opList;

let ctm = [1, 0, 0, 1, 0, 0];
const stack = [];
let fill = null, stroke = null, strokeW = 1;
let cur = null; // { segments: [[x1,y1,x2,y2]], rects: [[x,y,w,h]], start }
const paths = [];

function apply(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}
function newPath() {
  return { segments: [], rects: [], closed: false };
}
function finish(kind) {
  if (!cur) return;
  const all = [];
  for (const s of cur.segments) all.push(s);
  for (const r of cur.rects) {
    const [x, y, w, h] = r;
    all.push([x, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y]);
  }
  if (!all.length) { cur = null; return; }
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const s of all) {
    minX = Math.min(minX, s[0], s[2]); maxX = Math.max(maxX, s[0], s[2]);
    minY = Math.min(minY, s[1], s[3]); maxY = Math.max(maxY, s[1], s[3]);
  }
  // y → вниз от верха страницы
  paths.push({
    kind,
    fill, stroke, strokeW,
    bbox: [Math.round(minX), Math.round(PH - maxY), Math.round(maxX), Math.round(PH - minY)],
    rects: cur.rects.map(r => [Math.round(r[0]), Math.round(PH - r[1] - r[3]), Math.round(r[2]), Math.round(r[3])]),
    nSeg: cur.segments.length
  });
  cur = null;
}

for (let i = 0; i < fnArray.length; i++) {
  const fn = fnArray[i], args = argsArray[i];
  switch (fn) {
    case OPS.save: stack.push(ctm.slice()); break;
    case OPS.restore: ctm = stack.pop() || [1, 0, 0, 1, 0, 0]; break;
    case OPS.transform: {
      const m = args, t = ctm;
      ctm = [
        m[0] * t[0] + m[1] * t[2], m[0] * t[1] + m[1] * t[3],
        m[2] * t[0] + m[3] * t[2], m[2] * t[1] + m[3] * t[3],
        m[4] * t[0] + m[5] * t[2] + t[4], m[4] * t[1] + m[5] * t[3] + t[5]
      ];
      break;
    }
    case OPS.constructPath: {
      // pdfjs v6: args = [paintOp, Array<Float32Array (op,x,y) triples>, minMax];
      // путь и его отрисовка — одна операция. paintOp: 20 stroke, 22 fill, 24 fillStroke…
      if (!cur) cur = newPath();
      for (const chunk of args[1] || []) {
        if (!chunk || !chunk.length) continue;
        let cx = 0, cy = 0, sx = 0, sy = 0;
        for (let p = 0; p + 2 < chunk.length + 1; p += 3) {
          const op = chunk[p];
          if (op === 0) {
            cx = chunk[p + 1]; cy = chunk[p + 2];
            sx = cx; sy = cy;
          } else if (op === 1) {
            const nx = chunk[p + 1], ny = chunk[p + 2];
            cur.segments.push([...apply(ctm, cx, cy), ...apply(ctm, nx, ny)]);
            cx = nx; cy = ny;
          } else if (op === 4) {
            if (cx !== sx || cy !== sy) cur.segments.push([...apply(ctm, cx, cy), ...apply(ctm, sx, sy)]);
            cx = sx; cy = sy;
          }
        }
      }
      const paint = args[0];
      if (paint === 28) { cur = null; break; } // endPath — без отрисовки
      const kind = paint === 20 || paint === 21 ? 'stroke'
        : (paint === 22 || paint === 23) ? 'fill'
        : 'fill+stroke';
      finish(kind);
      break;
    }
    case OPS.fill: case OPS.eoFill: finish('fill'); break;
    case OPS.stroke: finish('stroke'); break;
    case OPS.fillStroke: case OPS.eoFillStroke: finish('fill+stroke'); break;
    case OPS.setFillRGBColor: fill = args.slice(0, 3).map(v => Math.round(v * 255)); break;
    case OPS.setStrokeRGBColor: stroke = args.slice(0, 3).map(v => Math.round(v * 255)); break;
    case OPS.setLineWidth: strokeW = args[0]; break;
    case OPS.setTextMatrix: break;
    default: break;
  }
}

// секции по заголовкам (y верха секции)
const titles = [
  ['4 ЭТАЖ', 5852], ['5 ПОЛУЭТАЖ', 9382], ['3 ЭТАЖ', 15315], ['4 ПОЛУЭТАЖ', 19210],
  ['2 ЭТАЖ', 25674], ['3 ПОЛУЭТАЖ', 29572], ['2 ПОЛУЭТАЖ', 34513], ['1 ЭТАЖ', 42666]
];
const bounds = [[0, 5852, '(верх, без заголовка)'], ...titles.map(([n, y], i) => [y, i + 1 < titles.length ? titles[i + 1][1] : PH, n])];

const bySection = bounds.map(([y0, y1, name]) => {
  const ps = paths.filter(p => {
    const cy = (p.bbox[1] + p.bbox[3]) / 2;
    return cy >= y0 && cy < y1;
  });
  const fills = ps.filter(p => p.kind !== 'stroke');
  const rectFills = [];
  for (const p of fills) for (const r of p.rects) {
    const [x, y, w, h] = r;
    if (w > 200 && h > 200 && w < 12000 && h < 8000) rectFills.push(r);
  }
  return { name, y0, y1, paths: ps.length, fills: fills.length, rectFills };
});

writeFileSync('out/geom.json', JSON.stringify({ paths, bySection: bySection.map(s => ({ ...s, rectFills: s.rectFills.length })) }, null, 1));
writeFileSync('out/sections.json', JSON.stringify(bySection, null, 1));
console.log('total paths:', paths.length);
for (const s of bySection) console.log(`${s.name}: paths=${s.paths} fills=${s.fills} roomRects=${s.rectFills.length}`);
