// Синхронизация снапшота данных в index.html с data/economics-building.json
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync('index.html', 'utf8');
const full = JSON.parse(readFileSync('data/economics-building.json', 'utf8'));
const slim = JSON.stringify({
  building: full.building,
  confLabels: full.confLabels,
  levels: full.levels
}, null, 1);
const re = /(<script type="application\/json" id="building-data">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) throw new Error('data block not found');
const out = html.replace(re, (m, a, b) => a + '\n' + slim + '\n' + b);
writeFileSync('index.html', out);
console.log('injected, snapshot bytes:', slim.length);
