// Добавляем 2 этаж главного корпуса — весь этаж помечен как ФИЛФАК (по просьбе пользователя).
import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('data/economics-building.json', 'utf8'));
if (!data.levels.some(l => l.id === 2)) {
  data.levels.push({
    id: 2,
    title: '2 ЭТАЖ',
    short: '2',
    mezz: false,
    region: [0, 0, 9200, 6400],
    outline: 'M100,100 H9100 V6300 H100 Z',
    stairs: [
      { x: 2350, y: 2800, w: 480, h: 700, label: 'лестница' },
      { x: 8390, y: 2800, w: 480, h: 700, label: 'лестница' }
    ],
    zoneLabels: [],
    rooms: [
      { id: 'FIL2', number: 'ФИЛФАК', name: 'Филологический факультет — весь этаж', type: 'department', conf: 'stand', cx: 4650, cy: 3200, w: 8600, h: 5800 }
    ]
  });
  data.notes.push('2 этаж главного корпуса (октябрь 2026): временно помечен целиком как ФИЛФАК — детализация последует.');
  writeFileSync('data/economics-building.json', JSON.stringify(data, null, 2) + '\n');
  console.log('OK: levels', data.levels.map(l => l.id).join(', '));
} else {
  console.log('level 2 already exists');
}
