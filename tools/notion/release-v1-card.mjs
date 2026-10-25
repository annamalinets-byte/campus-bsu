// Milestone-карточка «v1 выпущена» на доске (принята пользователем 2026-10-25).
import { ready, callTool } from './mcp.mjs';
const text = (res) => (res?.content ?? []).map(c => c.text ?? '').join('\n');
const urlIn = (s) => (s.match(/https:\/\/(?:www\.notion\.so|app\.notion\.com)\/(?:p\/)?([0-9a-f]{32})/i) ?? [])[0];

await ready();
const found = text(await callTool('notion-search', { query: 'Карта корпуса БГУ — задачи', page_size: 5 }));
const ft = text(await callTool('notion-fetch', { id: urlIn(found) }));
const dsId = (ft.match(/collection:\/\/[0-9a-f-]{36}/i) ?? [])[0];

await callTool('notion-create-pages', {
  parent: { type: 'data_source_id', data_source_id: dsId.replace(/^collection:\/\//i, '') },
  pages: [{
    icon: '🚀',
    properties: {
      'Задача': 'v1 выпущена: карта + поиск + маршрут от входа (12/12 карточек)',
      'Статус': 'Готово', 'Приоритет': 'Высокий', 'Область': 'Инфраструктура', 'Версия': 'v1',
    },
    content: 'Принята пользователем 2026-10-25 («все отлично»), проверена в мобильном viewport и с телефона.\n\n' +
      '- Ссылка: annamalinets-byte.github.io/campus-bsu (GitHub Pages, авто-деплой с каждого push)\n' +
      '- Репозиторий: github.com/annamalinets-byte/campus-bsu (git с 2026-10-25, .tokens.json в .gitignore)\n' +
      '- Поиск: синонимы (туалет/столовая/спорт/…), пол и этаж WC в запросе, опечатки (Левенштейн ≤ 1)\n' +
      '- Маршрут: пошаговая подсветка «вход → лестница → этаж → комната»; полный граф коридоров — v2\n' +
      '- Инструменты: tools/pdfwork/validate.mjs (перед inject.mjs), tools/serve.mjs (порт 8137), tools/notion/',
  }],
  allow_async: false,
});
console.log('milestone-карточка «v1 выпущена» создана');
