// Закрытие четырёх карточек v1: валидатор, сверка 4–5, поиск-синонимы, маршрут.
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
const rows = JSON.parse(q).results ?? [];
const pageOf = (frag) => rows.find(r => String(r['Задача'] ?? '').includes(frag))?.url;

const CLOSE = [
  ['Валидатор данных',
   '\n\n✅ Готово (2026-10-25): <code>tools/pdfwork/validate.mjs</code> — дубли <code>number</code>/id, комнаты вне контура этажа, пустые/нечисловые поля, неизвестный conf. Первый прогон: 83 комнаты, 0 ошибок. Запускать перед <code>inject.mjs</code>.'],
  ['Сверить 4–5',
   '\n\n✅ Готово (2026-10-25, <code>tools/pdfwork/verify-45.mjs</code>): взаимное расположение совпадает со стендом — библиотека слева (71/71А), 63 справа (63А над ней), деканаты внизу, WC Ж левее WC М, на 5 этаже 86 левее WC Ж. Добавлена женская раздевалка на 4 этаж; заметка «деканы к. 64» поправлена на ауд. 70/65. Открытый вопрос: на стенде у раздевалок есть ещё один WC — в данных нет, ждём слов пользователя.'],
  ['синонимы и опечатки',
   '\n\n✅ Готово (2026-10-25): синонимы (туалет/столовая/еда/спорт/раздевалка/гардероб/вход/дворик/вахта/актовый/филфак/библиотека…), пол и этаж WC в запросе («туалет ж», «туалет 4», «wc 5 м»), опечатки в номерах через Левенштейна ≤ 1 («63п» → 63А). Проверено в браузере.'],
  ['Маршрут «как дойти»',
   '\n\n✅ v1 готово (2026-10-25): в карточке — строка «От входа» и кнопка «Показать путь на карте»: пошаговая подсветка (вход → нужная лестница → этаж → комната), отдельные сценарии для правого коридорчика и второй части кампуса. Проверено в мобильном viewport (390×844). Полный граф коридоров — v2.'],
];

for (const [frag, note] of CLOSE) {
  const page = pageOf(frag);
  if (!page) { console.log('НЕ НАЙДЕНО:', frag); continue; }
  await callTool('notion-update-page', {
    page_id: page, command: 'update_properties',
    properties: { 'Статус': 'Готово' },
  });
  await callTool('notion-update-page', {
    page_id: page, command: 'insert_content',
    content: note,
    position: { type: 'end' },
  });
  console.log('закрыта:', frag);
}
console.log('готово');
