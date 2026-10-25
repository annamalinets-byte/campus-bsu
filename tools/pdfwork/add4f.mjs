// 4 этаж главного корпуса (по схеме пользователя, октябрь 2026):
// левое ребро — библиотека 71 (колонна, как фудкорт на 1 этаже), внутри неё маленький прямоугольник 71А;
// правое ребро — аудитория 63 той же колонной, её верхняя часть — 63А;
// нижнее ребро: библиотека → деканат → главный деканат → 63;
// верхнее ребро: библиотека → лестница → WC Ж → 67 → 69 → WC М → лестница → 63А.
import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('data/economics-building.json', 'utf8'));
data.levels = data.levels.filter(l => l.id !== 4);
data.levels.push({
  id: 4,
  title: '4 ЭТАЖ',
  short: '4',
  mezz: false,
  region: [0, 0, 9200, 6400],
  outline: 'M100,100 H9100 V6300 H100 Z',
  stairs: [
    { x: 2350, y: 350, w: 480, h: 700, label: 'лестница' },
    { x: 6500, y: 350, w: 480, h: 700, label: 'лестница' }
  ],
  zoneLabels: [],
  rooms: [
    { id: 'LIB71', number: '71',  name: 'Библиотека (к. 71), вдоль левого ребра', type: 'library',   conf: 'stand', cx: 1200, cy: 3200, w: 2200, h: 6200 },
    { id: 'R71A',  number: '71А', name: 'Аудитория 71А (внутри библиотеки)',       type: 'auditorium', conf: 'stand', cx: 1200, cy: 4700, w: 1300, h: 800 },
    { id: 'WC4F',  number: 'WC4Ж', name: 'WC (Ж)',                                  type: 'wc',        conf: 'stand', cx: 3300, cy: 700,  w: 800,  h: 900 },
    { id: 'R67',   number: '67',  name: 'Аудитория 67',                             type: 'auditorium', conf: 'stand', cx: 4300, cy: 700,  w: 900,  h: 900 },
    { id: 'R69',   number: '69',  name: 'Аудитория 69',                             type: 'auditorium', conf: 'stand', cx: 5300, cy: 700,  w: 900,  h: 900 },
    { id: 'WC4M',  number: 'WC4М', name: 'WC (М)',                                  type: 'wc',        conf: 'stand', cx: 6150, cy: 700,  w: 650,  h: 900 },
    { id: 'R63A',  number: '63А', name: 'Аудитория 63А',                            type: 'auditorium', conf: 'stand', cx: 8050, cy: 1300, w: 2100, h: 2400 },
    { id: 'DEAN4', number: 'ДЕК', name: 'Деканат',                                  type: 'deanery',   conf: 'stand', cx: 3450, cy: 5850, w: 2100, h: 900 },
    { id: 'GDEAN', number: '64',  name: 'Главный деканат (деканат ЭФ, к. 64)',     type: 'deanery',   conf: 'stand', cx: 5750, cy: 5850, w: 2300, h: 900 },
    { id: 'R63',   number: '63',  name: 'Аудитория 63 (вдоль правого ребра)',      type: 'auditorium', conf: 'stand', cx: 8050, cy: 4400, w: 2100, h: 3800 }
  ]
});
data.notes.push('4 этаж главного корпуса (октябрь 2026): библиотека 71 — колонна по левому ребру (71А внутри), 63 — колонна по правому ребру (63А — её верх), деканат и главный деканат (к. 64) внизу, сверху лестницы, WC Ж/М и аудитории 67/69.');
writeFileSync('data/economics-building.json', JSON.stringify(data, null, 2) + '\n');
console.log('OK: levels', data.levels.map(l => l.id).join(', '));
