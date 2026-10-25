// Разметка MVP-скоупа v1 на доске «Карта корпуса БГУ — задачи»:
// 1) добавляем свойство «Версия» SELECT(v1/v2), если его ещё нет;
// 2) проставляем v1/v2 существующим карточкам по плану;
// 3) сужаем карточку «Маршрут» до облегчённой версии (полный граф — v2);
// 4) создаём два новых таска v1: «хостинг» и «валидатор».
// Запуск: node mark-v1.mjs
import { ready, callTool } from './mcp.mjs';

const DB_TITLE = 'Карта корпуса БГУ — задачи';

const text = (res) => (res?.content ?? []).map(c => c.text ?? '').join('\n');
const urlIn = (s) => (s.match(/https:\/\/(?:www\.notion\.so|app\.notion\.com)\/(?:p\/)?([0-9a-f]{32})/i) ?? [])[0];

// фрагмент названия карточки -> версия (фрагменты уникальны в пределах доски)
const PLAN = [
  // --- сделанное — фундамент v1 ----------------------------------------------
  ['Оцифровать стенд-схему', 'v1'],
  ['Карта главного корпуса', 'v1'],
  ['Поиск аудитории', 'v1'],
  ['интеграцию с Notion', 'v1'],
  // --- бэклог v1 --------------------------------------------------------------
  ['Положить проект в git', 'v1'],
  ['Детализировать 2–3', 'v1'],
  ['Сверить 4–5', 'v1'],
  ['синонимы и опечатки', 'v1'],
  ['Маршрут «как дойти»', 'v1'],
  ['реальном телефоне', 'v1'],
  // --- осознанно вне v1 --------------------------------------------------------
  ['полуэтажи', 'v2'],
  ['Онбординг', 'v2'],
  ['Доступность', 'v2'],
  ['PDF-экспорт', 'v2'],
  ['Памятка', 'v2'],
  // --- карточки, добавленные на доску позже board.mjs --------------------------
  ['Правый коридорчик', 'v1'], // пристройка этажей 2–4 — уже в скоупе текущей карты
  ['Вторая часть кампуса', 'v2'], // второй корпус — вне скоупа v1 по README
];

const NEW_CARDS = [
  {
    icon: '🌐', title: 'Выложить карту по ссылке',
    prio: 'Высокий', area: 'Инфраструктура',
    body: 'Сейчас карта открывается двойным кликом с ноута, а сценарий ADR-001 — телефон на ходу. `index.html` самодостаточен и без сборки: выложить на бесплатный статический хостинг (GitHub Pages / Netlify) и получить ссылку для телефона.\n\n- [ ] выбрать хостинг\n- [ ] выложить `index.html` (+ assets при необходимости)\n- [ ] проверить открытие с телефона по ссылке',
  },
  {
    icon: '🧪', title: 'Валидатор данных',
    prio: 'Низкий', area: 'Инфраструктура',
    body: 'Node-скрипт, запускать перед `inject.mjs`: дубли `number` (это ключ поиска), комнаты вне контура этажа, пропущенные поля (`name`/`cx`/`cy`). Правки данных ручные — ошибка сейчас ломает поиск молча.',
  },
];

const ROUTE_BODY = 'Сейчас карточка подсказывает словами.\n\n**v1 (облегчённая версия):** пошаговая подсветка этапов на карте — вход с ул. Карла Маркса → нужная лестница → этаж → дверь аудитории.\n\n**v2:** полный граф коридоров (BFS/Dijkstra) и режим «от пары к паре» — геометрия этажей условная, «точный» путь по ней давал бы ложную точность.';

await ready();

// 1. Ищем доску
const found = text(await callTool('notion-search', { query: DB_TITLE, page_size: 5 }));
const dbUrl = urlIn(found);
if (!found.includes(DB_TITLE) || !dbUrl) throw new Error('доска не найдена поиском');
const ft = text(await callTool('notion-fetch', { id: dbUrl }));
const dbId = urlIn(ft) ?? dbUrl;
const dsId = (ft.match(/collection:\/\/[0-9a-f-]{36}/i) ?? [])[0] ?? null;
if (!dbId || !dsId) throw new Error('не удалось определить database/data source');
console.log('доска:', dbUrl);

// 2. Свойство «Версия» (идемпотентно)
try {
  await callTool('notion-update-data-source', {
    data_source_id: dsId.replace(/^collection:\/\//i, ''),
    statements: `ADD COLUMN "Версия" SELECT('v1':blue, 'v2':gray)`,
  });
  console.log('свойство «Версия» добавлено');
} catch (e) {
  console.log('свойство «Версия»: не добавлено (видимо, уже есть) —', e.message.slice(0, 160));
}

// 3. Карточки: фрагмент названия -> page URL
const q = text(await callTool('notion-query-data-sources', {
  data: {
    mode: 'sql',
    data_source_urls: [dsId],
    query: `SELECT "Задача", url FROM "${dsId}"`,
  },
}));
console.log('--- query raw ---\n' + q.slice(0, 2500) + '\n--- /query raw ---');
// ответ — JSON вида {"results":[{"Задача": "...", "url": "https://app.notion.com/<32hex>"}, ...]}
let rows = [];
try { rows = JSON.parse(q).results ?? []; } catch { /* fallback ниже */
  rows = [...q.matchAll(/"Задача":"([^"]+)","url":"(https:\/\/[^"]+)"/g)].map(m => ({ 'Задача': m[1], url: m[2] }));
}
if (!rows.length) throw new Error('в результате запроса нет карточек');
const pageOf = (frag) => rows.find(r => String(r['Задача'] ?? '').includes(frag))?.url ?? null;

// 4. Проставляем версии
let ok = 0; const missed = [];
for (const [frag, ver] of PLAN) {
  const page = pageOf(frag);
  if (!page) { missed.push(frag); continue; }
  await callTool('notion-update-page', {
    page_id: page,
    command: 'update_properties',
    properties: { 'Версия': ver },
  });
  console.log(`${ver}  <-  ${frag}`);
  ok++;
}

// 5. Сужаем карточку «Маршрут»
const routePage = pageOf('Маршрут «как дойти»');
if (routePage) {
  await callTool('notion-update-page', { page_id: routePage, command: 'replace_content', new_str: ROUTE_BODY });
  console.log('карточка «Маршрут» переписана под v1-скоуп');
}

// 6. Новые карточки v1
for (const c of NEW_CARDS) {
  await callTool('notion-create-pages', {
    parent: { type: 'data_source_id', data_source_id: dsId.replace(/^collection:\/\//i, '') },
    pages: [{
      icon: c.icon,
      properties: { 'Задача': c.title, 'Статус': 'Бэклог', 'Приоритет': c.prio, 'Область': c.area, 'Версия': 'v1' },
      content: c.body,
    }],
    allow_async: false,
  });
  console.log('создана карточка:', c.title);
}

console.log(`\nГОТОВО: размечено ${ok}/${PLAN.length}. Не найдено: ${missed.length ? missed.join('; ') : '—'}`);
if (missed.length) process.exitCode = 1;
