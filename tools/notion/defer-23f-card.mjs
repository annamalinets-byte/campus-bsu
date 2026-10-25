// По решению пользователя: «Детализировать 2–3 этажи» выводится из v1 (Версия -> v2).
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
const page = (JSON.parse(q).results ?? []).find(r => String(r['Задача'] ?? '').includes('Детализировать 2–3'))?.url;
if (!page) throw new Error('карточка «Детализировать 2–3 этажи» не найдена');

await callTool('notion-update-page', {
  page_id: page, command: 'update_properties',
  properties: { 'Версия': 'v2' },
});
await callTool('notion-update-page', {
  page_id: page, command: 'insert_content',
  content: '\nПо решению пользователя (2026-10-25) выведено из v1: детализация этажей 2–3 не критична для первой версии, на карте они остаются зоной «ФИЛФАК».',
  position: { type: 'end' },
});
console.log('карточка «Детализировать 2–3 этажи»: v1 -> v2');
