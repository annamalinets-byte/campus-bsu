// v16 (по устному запросу пользователя):
//  1. 4 этаж: сверху добавлен такой же блок второй части кампуса: слева направо —
//     мужская раздевалка (маленький прямоугольник, верхний левый угол),
//     спортзал почти на весь блок, справа лестничная клетка (как на эт. 2–3).
//  2. Аудитории 209/309/409 перенесены ПРЯМО НА лестничный пролёт —
//     в левый нижний угол лестничной клетки (x 5200–5900, y −3510…−2710).
// Идемпотентен.
import { readFileSync, writeFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('data/economics-building.json', 'utf8'));
const [, l2, l3, l4] = data.levels; // этажи 2, 3, 4

/* ---------- 2. 209/309/409 — на пролёт, левый нижний угол клетки ---------- */
// лестничная клетка: x 5200–6100, y −5310…−2710; «низ» на рендере = ребро y=−2710
const LANDING = { cx: 5550, cy: -3110, w: 700, h: 800 }; // 5200–5900 × −3510…−2710
function relocate(level, num) {
  const existing = level.rooms.find((r) => r.id === 'WING_' + num || r.id === 'NB_' + num);
  if (existing) {
    existing.id = 'NB_' + num;
    existing.number = num;
    existing.name = 'Аудитория ' + num + ', пролёт лестничной клетки';
    Object.assign(existing, LANDING);
  } else if (!level.rooms.some((r) => r.number === num)) {
    level.rooms.push({
      id: 'NB_' + num,
      number: num,
      name: 'Аудитория ' + num + ', пролёт лестничной клетки',
      type: 'auditorium',
      conf: 'stand',
      ...LANDING,
    });
  }
}
relocate(l2, '209');
relocate(l3, '309');
relocate(l4, '409');

/* ---------- 1. 4 этаж: блок второй части кампуса ---------- */
const NB_SUB = 'M-850,-5310 H6150 V-2710 H-850 Z';
if (!l4.outline.includes(NB_SUB)) {
  if (!/M100,100 H4378 V-2710 H6150 V100 H7100 V2700 H100 Z/.test(l4.outline)) {
    throw new Error('контур 4 этажа не в ожидаемом виде');
  }
  l4.outline = l4.outline + ' ' + NB_SUB;
}
if (!l4.stairs.some((s) => s.label === 'лестничная клетка')) {
  l4.stairs.push({ x: 5200, y: -5310, w: 900, h: 2600, label: 'лестничная клетка' });
}
l4.region = [-750, -5410, 7200, 2800];
if (!l4.rooms.some((r) => r.id === 'NB_GYM4')) {
  l4.rooms.push(
    {
      id: 'NB_LOCK4M',
      number: 'РАЗДЕВАЛКА М',
      name: 'Мужская раздевалка (за коридорчиком)',
      type: 'wardrobe',
      conf: 'stand',
      cx: -400, cy: -4810, w: 900, h: 1000, // маленький прямоугольник, верхний левый угол блока
    },
    {
      id: 'NB_GYM4',
      number: 'СПОРТЗАЛ',
      name: 'Спортзал (за коридорчиком)',
      type: 'sport',
      conf: 'stand',
      cx: 2625, cy: -4010, w: 5150, h: 2600, // почти весь блок: x 50…5200, во всю высоту
    }
  );
}

/* ---------- заметка в notes ---------- */
const note =
  'Вторая часть кампуса (октябрь 2026, v16): 4 этаж достроен — такой же блок, слева направо: мужская раздевалка (маленький прямоугольник, верхний левый угол), спортзал почти на весь блок, лестничная клетка справа (как на эт. 2–3). Аудитории 209/309/409 перенесены на сами лестничные пролёты — левый нижний угол лестничной клетки.';
if (!data.notes.includes(note)) data.notes.push(note);

writeFileSync('data/economics-building.json', JSON.stringify(data, null, 2) + '\n');

for (const [tag, lvl] of [['2 эт', l2], ['3 эт', l3], ['4 эт', l4]]) {
  const r = lvl.rooms.find((x) => ['209', '309', '409'].includes(x.number));
  console.log(tag, '|', r.id, r.number, '→ cx', r.cx, 'cy', r.cy, '(клетка 5200–6100 × −5310…−2710)');
}
console.log('4 эт NB-комнаты:', l4.rooms.filter((r) => r.id.startsWith('NB_')).map((r) => r.number).join(', '));
