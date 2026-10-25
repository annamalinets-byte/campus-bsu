// Фудкорт — на всю длину левого ребра (обычный прямоугольник, полная высота корпуса).
import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('data/economics-building.json', 'utf8'));
const lv = data.levels.find(l => l.id === 1);
const food = lv.rooms.find(r => r.id === 'FOOD');
food.name = 'Фудкорт (вдоль всего левого ребра)';
food.cx = 1200; food.cy = 4500; food.w = 2200; food.h = 5600; // y 1700..7300 — полная высота корпуса
data.notes[1] = data.notes[1].replace('обычный прямоугольник в левом нижнем углу', 'прямоугольник вдоль всей длины левого ребра');
writeFileSync('data/economics-building.json', JSON.stringify(data, null, 2) + '\n');
console.log('OK: food court', JSON.stringify({ cx: food.cx, cy: food.cy, w: food.w, h: food.h }));
