// Дочищаем чекбоксы карточки «Положить проект в git» (контент в NFM: <code>, не бэктики).
import { ready, callTool } from './mcp.mjs';
const text = (res) => (res?.content ?? []).map(c => c.text ?? '').join('\n');
const urlIn = (s) => (s.match(/https:\/\/(?:www\.notion\.so|app\.notion\.com)\/(?:p\/)?([0-9a-f]{32})/i) ?? [])[0];

await ready();
const found = text(await callTool('notion-search', { query: 'Карта корпуса БГУ — задачи', page_size: 5 }));
const ft = text(await callTool('notion-fetch', { id: urlIn(found) }));
const dsId = (ft.match(/collection:\/\/[0-9a-f-]{36}/i) ?? [])[0];
const q = text(await callTool('notion-query-data-sources', {
  data: { mode: 'sql', data_source_urls: [dsId], query: `SELECT "Задача", url FROM "${dsId}"` },
}));
const page = (JSON.parse(q).results ?? []).find(r => String(r['Задача'] ?? '').includes('Положить проект в git'))?.url;
if (!page) throw new Error('карточка не найдена');

const res = await callTool('notion-update-page', {
  page_id: page, command: 'update_content',
  content_updates: [
    { old_str: '- [ ] <code>git init</code>', new_str: '- [x] <code>git init</code> — коммит e0a2a79, 2026-10-25' },
    { old_str: '- [ ] <code>.gitignore</code>', new_str: '- [x] <code>.gitignore</code>' },
    { old_str: '- [ ] запушить в', new_str: '- [x] запушить в' },
  ],
});
console.log('--- update_content ---\n' + text(res).slice(0, 1200));

// контрольная проверка: незакрытых чекбоксов в карточке быть не должно
const card = text(await callTool('notion-fetch', { id: page }));
console.log(card.includes('- [ ] ') ? 'ОСТАЛИСЬ незакрытые чекбоксы' : 'OK: все чекбоксы закрыты');
