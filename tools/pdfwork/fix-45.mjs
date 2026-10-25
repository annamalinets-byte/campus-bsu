// Итоги сверки 4–5 этажей со стендом (октябрь 2026):
// 1) добавить женскую раздевалку на 4 этаж (стенд: РАЗДЕВАЛКА Ж/М; ADR-007: «раздевалки Ж/М»)
//    — в левом-strip блоке второй части кампуса, под мужской (её позиция — из слов пользователя);
// 2) поправить устаревшую заметку «главный деканат (к. 64)» на актуальные ауд. 70 и 65;
// 3) дописать заметку о сверке.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const file = join(ROOT, 'data', 'economics-building.json');
const d = JSON.parse(readFileSync(file, 'utf8'));

const lv4 = d.levels.find((l) => l.id === 4);
if (!lv4) throw new Error('нет 4 этажа');
if (!lv4.rooms.some((r) => r.id === 'NB_LOCK4F')) {
  lv4.rooms.push({
    id: 'NB_LOCK4F', number: 'РАЗДЕВАЛКА Ж',
    name: 'Женская раздевалка (за коридорчиком)',
    type: 'wardrobe', conf: 'stand',
    cx: -400, cy: -3510, w: 900, h: 1000,
  });
  console.log('добавлена женская раздевалка (NB_LOCK4F) на 4 этаж');
}

let fixedNote = false;
d.notes = d.notes.map((n) => {
  if (n.includes('деканат и главный деканат (к. 64) внизу')) {
    fixedNote = true;
    return n.replace('деканат и главный деканат (к. 64) внизу', 'деканат (ауд. 70) и главный деканат (ауд. 65) внизу');
  }
  return n;
});
console.log(fixedNote ? 'заметка о деканатах обновлена (64 → ауд. 70 и 65)' : 'заметка о деканатах не найдена — пропускаю');

d.notes.push('Сверка со стендом (2026-10-25): взаимное расположение комнат 4–5 этажей совпадает со стендом — библиотека слева (71/71А), 63 справа (63А над ней), деканаты внизу (обычный левее главного), WC Ж левее WC М, на 5 этаже 86 левее WC Ж. Добавлена женская раздевалка на 4 этаж (была только мужская). Открытый вопрос: на стенде рядом с раздевалками в блоке спортзала есть ещё один WC — в данных его нет, ждём уточнения от пользователя.');

writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
console.log('файл записан:', file);
