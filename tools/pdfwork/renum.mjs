// Главный деканат → ауд. 65, деканат → ауд. 70 (4 этаж)
import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('data/economics-building.json', 'utf8'));
const lv = data.levels.find(l => l.id === 4);
for (const r of lv.rooms) {
  if (r.id === 'GDEAN') { r.number = '65'; r.name = 'Главный деканат (деканат ЭФ, ауд. 65)'; }
  if (r.id === 'DEAN4') { r.number = '70'; r.name = 'Деканат (ауд. 70)'; }
}
writeFileSync('data/economics-building.json', JSON.stringify(data, null, 2) + '\n');
console.log('OK:', lv.rooms.filter(r => ['GDEAN', 'DEAN4'].includes(r.id)).map(r => r.number + '=' + r.name).join(' | '));
