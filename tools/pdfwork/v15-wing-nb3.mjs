// v15 (по устному запросу пользователя, 2026-10-24):
//  1. Аудитории коридорчиков (эт. 2–4) перенумерованы по возрастанию СНИЗУ ВВЕРХ.
//  2. Добавлены 209 / 309 / 409 — на лестничных пролётах (площадка у правой лестницы,
//     низ ленты-прохода коридорчика: x 4378–5078, y −800…−30).
//  3. 3 этаж достроен как 2-й: вторая часть кампуса (блок −850…6150 × −5310…−2710),
//     ауд. 311 (левая колонна), 312–315 (верхний ряд) + WC3Ж, 316–322 (нижний ряд),
//     лестничная клетка x 5200–6100.
// Идемпотентен: повторный запуск ничего не меняет.
import { readFileSync, writeFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('data/economics-building.json', 'utf8'));
const [, l2, l3, l4] = data.levels; // индексы 1..3 = этажи 2, 3, 4; 1 и 5 этажи не трогаем

/* ---------- 1. перенумерация колонн коридорчика снизу вверх ---------- */
// y растёт вниз, поэтому «ниже» = больший cy; первому (нижнему) достаётся меньший номер
function renumberWing(level, numbersBottomUp) {
  const nums = [...numbersBottomUp].sort((a, b) => Number(a) - Number(b));
  const wings = level.rooms
    .filter((r) => r.id.startsWith('WING_') && nums.includes(r.number))
    .sort((a, b) => b.cy - a.cy); // первый = самый нижний
  if (wings.length !== nums.length) {
    throw new Error('WING комнат ' + wings.length + ' ≠ номеров ' + nums.length);
  }
  wings.forEach((r, i) => {
    r.number = nums[i];
    r.id = 'WING_' + nums[i];
    r.name = 'Аудитория ' + nums[i] + ', правый коридорчик';
  });
}
renumberWing(l2, ['202', '203', '204', '210', '211', '212']);
renumberWing(l3, ['303', '304', '305', '306', '307', '308']);
renumberWing(l4, ['404', '407']); // нижняя (cy −1175) станет 404, верхняя (−2225) — 407

/* ---------- 2. аудитории на лестничных пролётах ---------- */
const LANDING = { cx: 4728, cy: -415, w: 700, h: 770 }; // низ ленты, у выхода с правой лестницы
function addLanding(level, num) {
  const id = 'WING_' + num;
  if (level.rooms.some((r) => r.id === id)) return;
  level.rooms.push({
    id,
    number: num,
    name: 'Аудитория ' + num + ', лестничный пролёт коридорчика',
    type: 'auditorium',
    conf: 'stand',
    ...LANDING,
  });
}
addLanding(l2, '209');
addLanding(l3, '309');
addLanding(l4, '409');

/* ---------- 3. вторая часть кампуса на 3 этаже (копия геометрии 2 этажа, v14) ---------- */
const NB_SUB = 'M-850,-5310 H6150 V-2710 H-850 Z';
if (!l3.outline.includes(NB_SUB)) {
  if (!/M100,100 H4378 V-2710 H6150 V100 H7100 V2700 H100 Z/.test(l3.outline)) {
    throw new Error('контур 3 этажа не в ожидаемом виде');
  }
  l3.outline = l3.outline + ' ' + NB_SUB;
}
if (!l3.stairs.some((s) => s.label === 'лестничная клетка')) {
  l3.stairs.push({ x: 5200, y: -5310, w: 900, h: 2600, label: 'лестничная клетка' });
}
l3.region = [-750, -5410, 7200, 2800];

const NB_FLOOR3 = [
  // [id, number, name, cx, cy, w, h, type]
  ['NB_311', '311', 'Аудитория 311 (за коридорчиком)', -375, -4010, 950, 2600, 'auditorium'],
  ['NB_312', '312', 'Аудитория 312 (за коридорчиком)', 690, -4860, 880, 700, 'auditorium'],
  ['NB_313', '313', 'Аудитория 313 (за коридорчиком)', 1670, -4860, 880, 700, 'auditorium'],
  ['NB_314', '314', 'Аудитория 314 (за коридорчиком)', 2650, -4860, 880, 700, 'auditorium'],
  ['NB_315', '315', 'Аудитория 315 (за коридорчиком)', 3630, -4860, 880, 700, 'auditorium'],
  ['NB_WC3F', 'WC3Ж', 'WC (Ж)', 4610, -4860, 880, 700, 'wc'],
  ['NB_316', '316', 'Аудитория 316 (за коридорчиком)', 520, -3160, 610, 700, 'auditorium'],
  ['NB_317', '317', 'Аудитория 317 (за коридорчиком)', 1230, -3160, 610, 700, 'auditorium'],
  ['NB_318', '318', 'Аудитория 318 (за коридорчиком)', 1940, -3160, 610, 700, 'auditorium'],
  ['NB_319', '319', 'Аудитория 319 (за коридорчиком)', 2650, -3160, 610, 700, 'auditorium'],
  ['NB_320', '320', 'Аудитория 320 (за коридорчиком)', 3360, -3160, 610, 700, 'auditorium'],
  ['NB_321', '321', 'Аудитория 321 (за коридорчиком)', 4070, -3160, 610, 700, 'auditorium'],
  ['NB_322', '322', 'Аудитория 322 (за коридорчиком)', 4780, -3160, 610, 700, 'auditorium'],
];
for (const [id, number, name, cx, cy, w, h, type] of NB_FLOOR3) {
  if (l3.rooms.some((r) => r.id === id)) continue;
  // WC наследует displayNum «WC» по образцу WC2Ж второго этажа
  const proto = l2.rooms.find((r) => r.id === 'NB_WC2F');
  const rec = { id, number, name, type, conf: 'stand', cx, cy, w, h };
  if (type === 'wc' && proto && proto.displayNum) rec.displayNum = proto.displayNum;
  l3.rooms.push(rec);
}

/* ---------- заметка в notes ---------- */
const note =
  'Правый коридорчик и вторая часть кампуса (октябрь 2026, v15): (1) аудитории коридорчиков перенумерованы по возрастанию снизу вверх (эт. 2: 202–204, 210–212; эт. 3: 303–308; эт. 4: 404, 407); (2) добавлены ауд. 209/309/409 на лестничных пролётах — площадка у правой лестницы, низ ленты-прохода; (3) 3 этаж достроен как 2-й: вторая часть кампуса (та же геометрия), ауд. 311 — левая колонна, 312–315 — верхний ряд + WC3Ж, 316–322 — нижний ряд, лестничная клетка справа.';
if (!data.notes.includes(note)) data.notes.push(note);

writeFileSync('data/economics-building.json', JSON.stringify(data, null, 2) + '\n');

/* ---------- контрольный вывод ---------- */
for (const [tag, lvl] of [['2 эт', l2], ['3 эт', l3], ['4 эт', l4]]) {
  const wing = lvl.rooms
    .filter((r) => r.id.startsWith('WING_'))
    .sort((a, b) => b.cy - a.cy)
    .map((r) => r.number)
    .join(',');
  console.log(tag, '| коридорчик снизу вверх:', wing);
}
console.log('3 эт NB:', l3.rooms.filter((r) => r.id.startsWith('NB_')).length, 'комнат; stairs:', l3.stairs.length);
