// v10: чистовая раскладка 1 этажа после сужений корпуса (v4–v9 сжимали пропорционально,
// из-за разницы правил сжатия элементы съехали и налезли друг на друга).
// Габариты: крыло актового зала x 100..1792, y 100..678; корпус x 100..7100, y 678..2700.
// Все комнаты и лестницы заданы явными координатами, с равными зазорами, внутри контура.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const file = join(root, 'data', 'economics-building.json');
const data = JSON.parse(readFileSync(file, 'utf8'));
const lv1 = data.levels.find(l => l.id === 1);

const R = (id, number, name, type, cx, cy, w, h) =>
  ({ id, number, name, type, conf: 'stand', cx, cy, w, h });

// Верхний ряд (y 700..1300, шаг с зазором 100): лестница | дворик | WC Ж | гардероб | вахта | WC М | лестница.
// Турникеты: y 1450..1750. Библиотека: правая колонна y 1450..2700. Вход: низ, центр (напротив гардероба).
lv1.rooms = [
  R('ACT', 'ACT', 'Актовый зал (крыло сверху)', 'hall', 946, 389, 1450, 440),
  R('FOOD', 'FOOD', 'Фудкорт (вдоль всего левого ребра)', 'food', 946, 1689, 1692, 2022), // y 678..2700
  R('EXIT15', 'ВЫХОД-ДВОР', 'Дверь во внутренний дворик (на улицу)', 'entrance', 2750, 1000, 700, 600), // 2400..3100
  R('WC1F', 'WC1Ж', 'WC (Ж)', 'wc', 3550, 1000, 700, 600),        // 3200..3900
  R('WARD1', 'ГАРДЕРОБ', 'Гардероб (напротив входа)', 'wardrobe', 4500, 1000, 1000, 600), // 4000..5000
  R('GUARD', 'ВАХТА', 'Вахта', 'entrance', 5475, 1000, 750, 600), // 5100..5850
  R('WC1M', 'WC1М', 'WC (М)', 'wc', 6300, 1000, 700, 600),        // 5950..6650
  R('T2', 'ТУРН2', 'Турникеты (у левого края гардероба)', 'turnstile', 4200, 1600, 900, 300), // y 1450..1750
  R('T1', 'ТУРН1', 'Турникеты (у вахты)', 'turnstile', 5700, 1600, 900, 300),
  R('ENTRY', 'ВХОД', 'Вход с ул. Карла Маркса', 'entrance', 4500, 2550, 1600, 300), // y 2400..2700
  R('LIB1', '1', 'Библиотека (к. 1), вдоль правого ребра', 'library', 6700, 2075, 800, 1250) // x 6300..7100, y 1450..2700
];

lv1.stairs = [
  { x: 1850, y: 700, w: 450, h: 550, label: 'лестница' },  // 1850..2300
  { x: 6750, y: 700, w: 300, h: 550, label: 'лестница' }   // 6750..7050
];

const n = 'Раскладка 1 этажа пересобрана начисто (v10) под габариты 7000 x 2600: верхний ряд — лестница, дверь во дворик, WC Ж, гардероб (напротив входа), вахта, WC М, лестница; турникеты под гардеробом и вахтой; фудкорт — вся левая колонна под крылом актового зала; библиотека к. 1 — правая колонна; вход — снизу по центру.';
data.notes = data.notes.filter(x => !x.startsWith('Раскладка 1 этажа'));
data.notes.push(n);

writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');

// самопроверка: все комнаты внутри контура и без пересечений
const boxes = lv1.rooms.map(r => ({ id: r.id, x0: r.cx - r.w / 2, y0: r.cy - r.h / 2, x1: r.cx + r.w / 2, y1: r.cy + r.h / 2 }));
let bad = 0;
for (const b of boxes) {
  const inWing = b.y1 <= 678;
  const ok = inWing ? (b.x0 >= 100 && b.x1 <= 1792 && b.y0 >= 100) : (b.x0 >= 100 && b.x1 <= 7100 && b.y0 >= 678 && b.y1 <= 2700);
  if (!ok) { console.log('ЗА КОНТУРОМ:', b.id, JSON.stringify(b)); bad++; }
}
for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
  const a = boxes[i], b = boxes[j];
  if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) { console.log('ПЕРЕСЕЧЕНИЕ:', a.id, '+', b.id); bad++; }
}
for (const s of lv1.stairs) {
  for (const b of boxes) if (s.x < b.x1 && b.x0 < s.x + s.w && s.y < b.y1 && b.y0 < s.y + s.h) { console.log('ЛЕСТНИЦА НА КОМНАТЕ:', b.id); bad++; }
}
console.log(bad === 0 ? 'OK: 1 этаж ровный, всё в контуре, без пересечений' : 'ПРОБЛЕМ: ' + bad);
