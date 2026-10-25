// 5 этаж главного корпуса (по схеме пользователя, октябрь 2026):
// верхнее ребро слева направо: 86, лестница, WC Ж, 72, 73, 74, WC М, лестница, 75;
// нижнее ребро слева направо: 82, 81, 80, 79, 78, 77, 76; левое и правое рёбра — просто стены.
import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('data/economics-building.json', 'utf8'));
data.levels = data.levels.filter(l => l.id !== 5);
data.levels.push({
  id: 5,
  title: '5 ЭТАЖ',
  short: '5',
  mezz: false,
  region: [0, 0, 9200, 6400],
  outline: 'M100,100 H9100 V6300 H100 Z',
  stairs: [
    { x: 1350, y: 350, w: 480, h: 700, label: 'лестница' },
    { x: 7050, y: 350, w: 480, h: 700, label: 'лестница' }
  ],
  zoneLabels: [],
  rooms: [
    { id: 'R86',  number: '86',  name: 'Аудитория 86', type: 'auditorium', conf: 'stand', cx: 700,  cy: 700, w: 1000, h: 900 },
    { id: 'WC5F', number: 'WC5Ж', name: 'WC (Ж)',      type: 'wc',         conf: 'stand', cx: 2300, cy: 700, w: 800,  h: 900 },
    { id: 'R72',  number: '72',  name: 'Аудитория 72', type: 'auditorium', conf: 'stand', cx: 3300, cy: 700, w: 1000, h: 900 },
    { id: 'R73',  number: '73',  name: 'Аудитория 73', type: 'auditorium', conf: 'stand', cx: 4400, cy: 700, w: 1000, h: 900 },
    { id: 'R74',  number: '74',  name: 'Аудитория 74', type: 'auditorium', conf: 'stand', cx: 5500, cy: 700, w: 1000, h: 900 },
    { id: 'WC5M', number: 'WC5М', name: 'WC (М)',      type: 'wc',         conf: 'stand', cx: 6500, cy: 700, w: 800,  h: 900 },
    { id: 'R75',  number: '75',  name: 'Аудитория 75', type: 'auditorium', conf: 'stand', cx: 8400, cy: 700, w: 1400, h: 900 },
    { id: 'R82',  number: '82',  name: 'Аудитория 82', type: 'auditorium', conf: 'stand', cx: 750,  cy: 5600, w: 1250, h: 900 },
    { id: 'R81',  number: '81',  name: 'Аудитория 81', type: 'auditorium', conf: 'stand', cx: 2030, cy: 5600, w: 1250, h: 900 },
    { id: 'R80',  number: '80',  name: 'Аудитория 80', type: 'auditorium', conf: 'stand', cx: 3315, cy: 5600, w: 1250, h: 900 },
    { id: 'R79',  number: '79',  name: 'Аудитория 79', type: 'auditorium', conf: 'stand', cx: 4600, cy: 5600, w: 1250, h: 900 },
    { id: 'R78',  number: '78',  name: 'Аудитория 78', type: 'auditorium', conf: 'stand', cx: 5885, cy: 5600, w: 1250, h: 900 },
    { id: 'R77',  number: '77',  name: 'Аудитория 77', type: 'auditorium', conf: 'stand', cx: 7170, cy: 5600, w: 1250, h: 900 },
    { id: 'R76',  number: '76',  name: 'Аудитория 76', type: 'auditorium', conf: 'stand', cx: 8450, cy: 5600, w: 1250, h: 900 }
  ]
});
data.notes.push('5 этаж главного корпуса (октябрь 2026): верхний ряд — 86, лестница, WC Ж, 72, 73, 74, WC М, лестница, 75; нижний ряд — 82…76; боковые рёбра — стены.');
writeFileSync('data/economics-building.json', JSON.stringify(data, null, 2) + '\n');
console.log('OK: levels', data.levels.map(l => l.id).join(', '));
