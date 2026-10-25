// v14: правый край второй части кампуса (2 этаж) выровнен с правым краем
// коридорчика: блок x −1772…5228 → −850…6150, сдвиг +922.
// Лестничная клетка переезжает с 4278–5178 на 5200–6100 (над колонной 202–212).
// Идемпотентен.
import { readFileSync, writeFileSync } from 'node:fs';

const DX = 922;
const OLD_SUB = 'M-1772,-5310 H5228 V-2710 H-1772 Z';
const NEW_SUB = `M${-1772 + DX},-5310 H${5228 + DX} V-2710 H${-1772 + DX} Z`;

const data = JSON.parse(readFileSync('data/economics-building.json', 'utf8'));
const level = data.levels[1]; // 2 ЭТАЖ

if (level.outline.includes(NEW_SUB)) {
  console.log('уже сдвинуто (v14), выходим');
  process.exit(0);
}
if (!level.outline.includes(OLD_SUB)) {
  throw new Error('ожидался контур v13 (−1772…5228) — сначала прогони shift-nb.mjs');
}

level.outline = level.outline.replace(OLD_SUB, NEW_SUB);

let moved = 0;
for (const st of level.stairs) {
  if (st.label === 'лестничная клетка') {
    if (st.x !== 4278) throw new Error('лестничная клетка не на 4278 — состояние не v13');
    st.x += DX;
    moved++;
  }
}
if (moved !== 1) throw new Error('лестничная клетка не найдена (или найдена не один раз)');

for (const r of level.rooms) {
  if (r.id.startsWith('NB_')) r.cx += DX;
}

// регион — bbox [minX, minY, maxX, maxY]: новое лево блока −850 со 100-й маржой
if (JSON.stringify(level.region) !== JSON.stringify([-1872, -5410, 7200, 2800])) {
  throw new Error('регион уровня 2 не v13 — проверь данные');
}
level.region = [-750, -5410, 7200, 2800];

const note =
  'Вторая часть кампуса (октябрь 2026, v14): правый край блока выровнен с правым краём коридорчика (оба x 6150) — сдвиг вправо на 922; лестничная клетка теперь x 5200–6100 (над колонной аудиторий 202–212, у правого ребра блока). Левое ребро блока x −850.';
if (!data.notes.includes(note)) data.notes.push(note);

writeFileSync('data/economics-building.json', JSON.stringify(data, null, 2) + '\n');
console.log('сдвинуто на +' + DX + ': блок −850…6150, лестничная клетка 5200–6100');
