// Обновление карточки «Положить проект в git» после первого коммита (v1-таск).
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
console.log('карточка:', page);

await callTool('notion-update-page', {
  page_id: page, command: 'update_properties',
  properties: { 'Статус': 'В работе' },
});

await callTool('notion-update-page', {
  page_id: page, command: 'update_content',
  content_updates: [
    { old_str: '- [ ] `git init` + первый коммит', new_str: '- [x] `git init` + первый коммит' },
    { old_str: '- [ ] `.gitignore`: `.tokens.json` (секрет!), кэш браузера', new_str: '- [x] `.gitignore`: `.tokens.json` (секрет!), кэш браузера' },
    { old_str: '- [ ] копия в надёжное место (GitHub-приват / флешка)', new_str: '- [ ] запушить в github.com/annamalinets-byte/campus-bsu (репозиторий сейчас публичный; токены в историю не попали — в первом коммите только README). Git 2.56 установлен через winget, коммит e0a2a79 от 2026-10-25 — весь проект октября' },
  ],
});
console.log('карточка обновлена: статус «В работе», чекбоксы отмечены, осталось запушить');
