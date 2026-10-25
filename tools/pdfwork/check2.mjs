import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const s = readFileSync(join(root, 'index.html'), 'utf8');
const m = s.match(/<script[^>]*id="building-data"[^>]*>([\s\S]*?)<\/script>/);
if (!m) { console.log('НЕТ БЛОКА building-data!'); process.exit(1); }
const d = JSON.parse(m[1]);
const lv2 = d.levels.find(l => l.id === 2);
console.log('уровень 2: комнат =', lv2.rooms.length);
console.log('id:', lv2.rooms.map(r => r.id).join(', '));
console.log('outline:', lv2.outline);
console.log('stairs:', JSON.stringify(lv2.stairs));
console.log('region:', JSON.stringify(lv2.region));
// самопроверка стыка: правое ребро крыла = левое ребро лестничной клетки нового корпуса
const wing = lv2.outline.match(/V-2710 H(\d+)/);
const nbStair = lv2.stairs.find(st => st.y < 0 && st.h >= 2600);
console.log('стык: крыло до', wing && wing[1], ', лестничная клетка от', nbStair && nbStair.x, '— совпадают:', String(wing && wing[1]) === String(nbStair && nbStair.x));
