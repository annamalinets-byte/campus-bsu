// Валидатор data/economics-building.json — запускать перед inject.mjs.
// Проверяет: обязательные поля, дубликаты id и number (number — ключ поиска!),
// комнаты вне габаритов контура этажа, отрицательные размеры.
// Запуск: node tools/pdfwork/validate.mjs  (из корня campus-bsu; код выхода 1 = есть ошибки)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const data = JSON.parse(readFileSync(join(ROOT, 'data', 'economics-building.json'), 'utf8'));

let errors = 0, warnings = 0;
const err = (m) => { console.error('  ОШИБКА: ' + m); errors++; };
const warn = (m) => { console.warn('  ПРЕДУПРЕЖДЕНИЕ: ' + m); warnings++; };

// --- bbox контура уровня: разбираем path из M/H/V/L/Z с абсолютными координатами
function outlineBbox(d) {
  let cx = 0, cy = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const track = (x, y) => {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  };
  for (const c of d.match(/[MHVLZ][^MHVLZ]*/gi) || []) {
    const cmd = c[0].toUpperCase();
    const args = (c.slice(1).match(/-?[\d.]+/g) || []).map(Number);
    if (cmd === 'M' || cmd === 'L') { cx = args[0]; cy = args[1]; track(cx, cy); }
    else if (cmd === 'H') { cx = args[0]; track(cx, cy); }
    else if (cmd === 'V') { cy = args[0]; track(cx, cy); }
    // Z замыкает контур — новые экстремумы не добавляет
  }
  return { minX, minY, maxX, maxY };
}

const seenNumbers = new Map(), seenIds = new Map();
for (const lv of data.levels) {
  const tag = `уровень «${lv.title}»`;
  if (!lv.id || !lv.title) err(`уровень без id/title: ${JSON.stringify(lv).slice(0, 80)}`);
  if (!lv.outline) { err(`${tag}: нет outline`); continue; }
  if (!Array.isArray(lv.rooms) || !lv.rooms.length) err(`${tag}: нет комнат`);
  if (lv.id !== 1 && (lv.stairs || []).length < 2) warn(`${tag}: меньше двух лестниц`);
  const bb = outlineBbox(lv.outline);

  for (const r of lv.rooms || []) {
    const w = `${tag}, ${r.id || '(без id)'}`;
    for (const f of ['id', 'number', 'name', 'type', 'conf', 'cx', 'cy', 'w', 'h']) {
      if (r[f] === undefined || r[f] === null || r[f] === '') err(`${w}: пустое поле «${f}»`);
    }
    for (const f of ['cx', 'cy', 'w', 'h']) {
      if (typeof r[f] !== 'number' || !isFinite(r[f])) err(`${w}: поле «${f}» не число (${JSON.stringify(r[f])})`);
    }
    if (r.w <= 0 || r.h <= 0) err(`${w}: w/h должны быть > 0 (w=${r.w}, h=${r.h})`);
    if (typeof r.cx === 'number' && typeof r.w === 'number') {
      const x0 = r.cx - r.w / 2, x1 = r.cx + r.w / 2;
      const y0 = r.cy - r.h / 2, y1 = r.cy + r.h / 2;
      if (x0 < bb.minX - 1 || x1 > bb.maxX + 1 || y0 < bb.minY - 1 || y1 > bb.maxY + 1) {
        err(`${w}: выходит за контур этажа (комната ${x0}..${x1} × ${y0}..${y1}, контур ${bb.minX}..${bb.maxX} × ${bb.minY}..${bb.maxY})`);
      }
    }
    if (seenIds.has(r.id)) err(`${w}: дубликат id «${r.id}» (уже в ${seenIds.get(r.id)})`);
    else seenIds.set(r.id, lv.title);
    const nk = String(r.number).toUpperCase().replace(/Ё/g, 'Е');
    if (seenNumbers.has(nk)) err(`${w}: дубликат number «${r.number}» (уже в ${seenNumbers.get(nk)}) — number это ключ поиска`);
    else seenNumbers.set(nk, lv.title);
    if (!data.confLabels?.[r.conf]) warn(`${w}: неизвестное значение conf «${r.conf}»`);
  }
}

const total = seenIds.size;
console.log(`Проверено уровней: ${data.levels.length}, комнат: ${total}. Ошибок: ${errors}, предупреждений: ${warnings}.`);
process.exit(errors ? 1 : 0);
