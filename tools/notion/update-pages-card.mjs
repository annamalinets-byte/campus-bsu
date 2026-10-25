// Закрытие карточки «Выложить карту по ссылке» после включения GitHub Pages.
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
const page = (JSON.parse(q).results ?? []).find(r => String(r['Задача'] ?? '').includes('Выложить карту по ссылке'))?.url;
if (!page) throw new Error('карточка «Выложить карту по ссылке» не найдена');

await callTool('notion-update-page', {
  page_id: page, command: 'update_properties',
  properties: { 'Статус': 'Готово' },
});

// чекбоксы: инлайн-код в NFM — это <code>, не бэктики
const res = await callTool('notion-update-page', {
  page_id: page, command: 'update_content',
  content_updates: [
    { old_str: '- [ ] выбрать хостинг', new_str: '- [x] выбрать хостинг — GitHub Pages, бесплатно и из того же репозитория' },
    { old_str: '- [ ] выложить <code>index.html</code>', new_str: '- [x] выложить <code>index.html</code> — Pages: ветка main, папка / (root); скрипт tools/notion/enable-pages.mjs' },
    { old_str: '- [ ] проверить открытие с телефона по ссылке', new_str: '- [x] проверить открытие с телефона по ссылке — [annamalinets-byte.github.io/campus-bsu](https://annamalinets-byte.github.io/campus-bsu/) отвечает 200 (титул и снапшот данных на месте); прогон на реальном экране — в карточке «Проверить карту на реальном телефоне»' },
  ],
});
console.log('--- update_content ---\n' + text(res).slice(0, 1200));

const card = text(await callTool('notion-fetch', { id: page }));
console.log(card.includes('- [ ] ') ? 'ОСТАЛИСЬ незакрытые чекбоксы' : 'OK: все чекбоксы закрыты, карточка Готово');
