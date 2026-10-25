// Закрытие карточки «Проверить карту на реальном телефоне» после успешного прогона.
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
const page = (JSON.parse(q).results ?? []).find(r => String(r['Задача'] ?? '').includes('реальном телефоне'))?.url;
if (!page) throw new Error('карточка «Проверить карту на реальном телефоне» не найдена');

await callTool('notion-update-page', {
  page_id: page, command: 'update_properties',
  properties: { 'Статус': 'Готово' },
});

const res = await callTool('notion-update-page', {
  page_id: page, command: 'update_content',
  content_updates: [{
    old_str: 'читаемость подписей комнат на небольшом экране.',
    new_str: 'читаемость подписей комнат на небольшом экране.\n\n✅ Проверено 2026-10-25 по ссылке GitHub Pages (annamalinets-byte.github.io/campus-bsu): поиск «63а» и «WC4Ж», жесты, читаемость — по отзыву пользователя всё ок.',
  }],
});
console.log('--- update_content ---\n' + text(res).slice(0, 1200));
console.log('карточка «Проверить карту на реальном телефоне» закрыта');
