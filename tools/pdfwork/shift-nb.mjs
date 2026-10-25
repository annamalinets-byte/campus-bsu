// v13: сдвиг второй части кампуса (2 этаж) влево, чтобы её лестничная клетка
// встала прямо над лентой-проходом коридорчика (x 4378–5078, центр 4728).
// Лестничная клетка была у правого ребра блока (x 6150–7050, центр 6600) и
// касалась коридорчика только уголком. dx = 4728 − 6600 = −1872.
// Идемпотентен: при повторном запуске видит уже сдвинутый контур и выходит.
import { readFileSync, writeFileSync } from 'node:fs';

const DX = -1872;
const OLD_SUB = 'M100,-5310 H7100 V-2710 H100 Z';
const NEW_SUB = `M${100 + DX},-5310 H${7100 + DX} V-2710 H${100 + DX} Z`;

const data = JSON.parse(readFileSync('data/economics-building.json', 'utf8'));
const level = data.levels[1]; // 2 ЭТАЖ — единственный с второй частью кампуса

if (level.outline.includes(NEW_SUB)) {
  console.log('уже сдвинуто (v13), выходим');
  process.exit(0);
}
if (!level.outline.includes(OLD_SUB)) {
  throw new Error('контур второй части кампуса не найден — проверь outline уровня 2');
}

level.outline = level.outline.replace(OLD_SUB, NEW_SUB);

let moved = 0;
for (const st of level.stairs) {
  if (st.label === 'лестничная клетка') { st.x += DX; moved++; }
}
if (moved !== 1) throw new Error('лестничная клетка не найдена (или найдена не один раз)');

for (const r of level.rooms) {
  if (r.id.startsWith('NB_')) r.cx += DX;
}

// регион — bbox [minX, minY, maxX, maxY]: накрываем сдвинутый блок (лево −1772) со стомаржиной
level.region = [-1872, -5410, 7200, 2800];

writeFileSync('data/economics-building.json', JSON.stringify(data, null, 2) + '\n');
console.log('сдвинуто на', DX, ': лестничная клетка теперь x', 4278, '–', 5178, '(над лентой 4378–5078)');
