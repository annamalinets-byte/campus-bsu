// Дописать строку в meta данных об итерации v13 (сдвиг второй части кампуса).
import { readFileSync, writeFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('data/economics-building.json', 'utf8'));
const note =
  'Вторая часть кампуса (октябрь 2026, v13): блок сдвинут влево на 1872 — лестничная клетка (правое ребро блока) встала прямо над лентой-проходом коридорчика (лестничная клетка x 4278–5178, лента 4378–5078), переход коридорчик → лестница визуально непрерывен. Из-за сдвига блок выступает влево за габарит главного корпуса (левое ребро x −1772 против 100).';
if (!data.notes.includes(note)) {
  data.notes.push(note);
  writeFileSync('data/economics-building.json', JSON.stringify(data, null, 2) + '\n');
  console.log('notes: добавлена заметка v13');
} else {
  console.log('notes: заметка v13 уже есть');
}
