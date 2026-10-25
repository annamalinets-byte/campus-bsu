// Сводка: полигоны + тексты по секциям (читаемо в консоль)
import { readFileSync } from 'node:fs';
const g = JSON.parse(readFileSync('out/geom.json', 'utf8'));
const text = JSON.parse(readFileSync('out/text.json', 'utf8'));

for (const s of g.bySection) {
  console.log(`\n=== ${s.name} (y ${s.y0}..${s.y1}) — ${s.paths} путей ===`);
  const ps = g.paths.filter(p => {
    const cy = (p.bbox[1] + p.bbox[3]) / 2;
    return cy >= s.y0 && cy < s.y1;
  });
  for (const p of ps) {
    const [x0, y0, x1, y1] = p.bbox;
    console.log(`  fill=rgb(${p.fill}) ${Math.round(x1 - x0)}x${Math.round(y1 - y0)} @(${Math.round(x0)},${Math.round(y0)}) seg=${p.nSeg}`);
  }
  const ts = text.filter(t => t.y >= s.y0 && t.y < s.y1)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const t of ts) console.log(`  TXT "${t.s}" @(${t.x},${t.y}) h=${t.h}`);
}
