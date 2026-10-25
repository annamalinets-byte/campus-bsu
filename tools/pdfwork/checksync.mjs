// Проверка: совпадает ли снапшот <script id="building-data"> в index.html с data/economics-building.json
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const m = html.match(/<script type="application\/json" id="building-data">([\s\S]*?)<\/script>/);
if (!m) {
  console.log('SNAPSHOT: не найден блок building-data');
  process.exit(1);
}
const fromHtml = JSON.parse(m[1]);
const full = JSON.parse(readFileSync('data/economics-building.json', 'utf8'));
// inject.mjs пишет «худую» версию без meta — сравниваем те же поля
const fromFile = { building: full.building, confLabels: full.confLabels, levels: full.levels };

const norm = (o) => JSON.stringify(o);
const same = norm(fromHtml) === norm(fromFile);
console.log('SNAPSHOT SYNC:', same ? 'OK (index.html == json)' : 'РАСХОЖДЕНИЕ — нужно запустить inject.mjs');
if (!same) {
  const roomsHtml = fromHtml.levels.map((l) => l.rooms.map((r) => r.number || r.id).join(',')).join(' | ');
  const roomsFile = fromFile.levels.map((l) => l.rooms.map((r) => r.number || r.id).join(',')).join(' | ');
  console.log('html rooms :', roomsHtml);
  console.log('json rooms :', roomsFile);
}
// заодно: какая версия упомянута в title/версии страницы
const v = html.match(/<title>([^<]*)<\/title>/);
console.log('TITLE:', v && v[1]);
