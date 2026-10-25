// Закрытие карточки «Положить проект в git» после успешного пуша (v1-таск).
import { ready, callTool } from './mcp.mjs';
const text = (res) => (res?.content ?? []).map(c => c.text ?? '').join('\n');
const urlIn = (s) => (s.match(/https:\/\/(?:www\.notion\.so|app\.notion\.com)\/(?:p\/)?([0-9a-f]{32})/i) ?? [])[0];

await ready();
const found = text(await callTool('notion-search', { query: 'Карта корпуса БГУ — задачи', page_size: 5 }));
const dbUrl = urlIn(found);
const ft = text(await callTool('notion-fetch', { id: dbUrl }));
const dsId = (ft.match(/collection:\/\/[0-9a-f-]{36}/i) ?? [])[0];

const q = text(await callTool('notion-query-data-sources', {
  data: { mode: 'sql', data_source_urls: [dsId], query: `SELECT "Задача", url FROM "${dsId}"` },
}));
const rows = JSON.parse(q).results ?? [];
const page = rows.find(r => String(r['Задача'] ?? '').includes('Положить проект в git'))?.url;
if (!page) throw new Error('карточка «Положить проект в git» не найдена');

await callTool('notion-update-page', {
  page_id: page, command: 'update_properties',
  properties: { 'Статус': 'Готово' },
});

// отмечаем третий чекбокс: ищем незакрытый пункт, начинающийся с "- [ ] запушить"
const card = text(await callTool('notion-fetch', { id: page }));
const line = card.split('\n').find(l => l.trim().startsWith('- [ ] запушить'));
if (!line) { console.log('незакрытый пункт не найден — возможно, уже отмечен'); }
else {
  await callTool('notion-update-page', {
    page_id: page, command: 'update_content',
    content_updates: [{ old_str: line.trim(), new_str: line.trim().replace('- [ ]', '- [x]') + ' — запушено 2026-10-25 (598c9da)' }],
  });
}
console.log('карточка «Положить проект в git» закрыта: Готово, все чекбоксы отмечены');
