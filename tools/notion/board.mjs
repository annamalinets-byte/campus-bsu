// Создание канбан-доски задач по карте корпуса БГУ в Notion.
// Запуск: node board.mjs — создаёт базу (если ещё не создана), канбан-вид
// и заполняет карточки. Повторный запуск НЕ должен дублировать доску:
// сначала ищем существующую базу по названию.
import { ready, callTool } from './mcp.mjs';

const DB_TITLE = 'Карта корпуса БГУ — задачи';

const CARDS = [
  // --- уже сделано -----------------------------------------------------------
  {
    icon: '📐', title: 'Оцифровать стенд-схему корпуса (PDF → JSON)',
    status: 'Готово', prio: 'Высокий', area: 'Данные',
    body: 'Геометрия этажей снята с `source-stand.pdf` и разложена в `data/economics-building.json`: уровни, контуры, лестницы, зоны и комнаты в локальных координатах.',
  },
  {
    icon: '🗺️', title: 'Карта главного корпуса: этажи 1–5',
    status: 'Готово', prio: 'Высокий', area: 'Данные',
    body: 'Рабочая карта обычных этажей: контур корпуса, лестницы, WC, фудкорт, актовый зал, библиотека, деканаты. Полуэтажи временно исключены — история решений в `DECISIONS.md`.',
  },
  {
    icon: '🔍', title: 'Поиск аудитории: подсветка + карточка «как найти»',
    status: 'Готово', prio: 'Высокий', area: 'Поиск',
    body: 'Ввод номера или названия → карта переключает этаж, подсвечивает комнату, показывает карточку с пояснением. WC ищутся по ключу вида «WC4Ж».',
  },
  {
    icon: '🔌', title: 'Настроить интеграцию с Notion (эта доска)',
    status: 'Готово', prio: 'Средний', area: 'Инфраструктура',
    body: 'OAuth-доступ к Notion через официальный MCP-сервер, скрипты в `tools/notion/` (auth.mjs — авторизация, mcp.mjs — клиент, board.mjs — эта доска). Токен хранится в `.tokens.json` — не публиковать.',
  },
  // --- бэклог ---------------------------------------------------------------
  {
    icon: '🧩', title: 'Детализировать 2–3 этажи (сейчас одна зона «ФИЛФАК»)',
    status: 'Бэклог', prio: 'Высокий', area: 'Данные',
    body: 'Сейчас 2-й и 3-й этажи — одна большая зона-комната. Нужно вспомнить реальные кабинеты и кафедры и расставить их по этажам.\n\n- [ ] Список комнат 2-го этажа\n- [ ] Список комнат 3-го этажа\n- [ ] Внести в `economics-building.json` → `inject.mjs` → перегенерация SVG',
  },
  {
    icon: '📏', title: 'Сверить 4–5 этажи со стенд-схемой',
    status: 'Бэклог', prio: 'Средний', area: 'Данные',
    body: 'Проверить расположение аудиторий 63/63А/65/67/69/70/71/71А/72–76/82/86 против `source-stand.pdf`.',
  },
  {
    icon: '🪜', title: 'Вернуть полуэтажи в карту',
    status: 'Бэклог', prio: 'Низкий', area: 'Данные',
    body: 'Уровни временно исключены по решению пользователя (см. `DECISIONS.md`). Вернуть, когда появится геометрия и нумерация комнат.',
  },
  {
    icon: '💬', title: 'Поиск: синонимы и опечатки',
    status: 'Бэклог', prio: 'Средний', area: 'Поиск',
    body: 'Научить поиск понимать «туалет» ↔ WC, «столовая» ↔ фудкорт, «библиотека»; прощать опечатки в номерах аудиторий.',
  },
  {
    icon: '🧭', title: 'Маршрут «как дойти» от входа до аудитории',
    status: 'Бэклог', prio: 'Средний', area: 'Карта и UI',
    body: 'Сейчас карточка подсказывает словами. Нарисовать путь на карте: вход с ул. Карла Маркса → лестница → нужный этаж → дверь аудитории.',
  },
  {
    icon: '📱', title: 'Проверить карту на реальном телефоне',
    status: 'Бэклог', prio: 'Высокий', area: 'Карта и UI',
    body: 'Проект mobile-first (ADR-001). Проверить тач-жесты: drag-панорама, щипок-зум, читаемость подписей комнат на небольшом экране.',
  },
  {
    icon: '👋', title: 'Онбординг при первом открытии',
    status: 'Бэклог', prio: 'Низкий', area: 'Карта и UI',
    body: 'Короткая подсказка «введи номер аудитории» и пояснение управления картой (drag — панорама, колесо, Ctrl+колесо/щипок — зум) при первом заходе.',
  },
  {
    icon: '⌨️', title: 'Доступность: клавиатура и aria',
    status: 'Бэклог', prio: 'Низкий', area: 'Карта и UI',
    body: 'Ввод и фокус в поиске с клавиатуры, навигация по результатам стрелками, aria-подписи комнат для скринридеров.',
  },
  {
    icon: '🧵', title: 'Положить проект в git',
    status: 'Бэклог', prio: 'Высокий', area: 'Инфраструктура',
    body: 'Проект лежит в Downloads без контроля версий — легко потерять правки JSON и снапшот `index.html`.\n\n- [ ] `git init` + первый коммит\n- [ ] `.gitignore`: `.tokens.json` (секрет!), кэш браузера\n- [ ] копия в надёжное место (GitHub-приват / флешка)',
  },
  {
    icon: '💾', title: 'Бэкапы и PDF-экспорт схем',
    status: 'Бэклог', prio: 'Средний', area: 'Инфраструктура',
    body: 'Резервная копия `source-stand.pdf` и данных; собирать PDF из этажных SVG (`generate-floor-plans.mjs`) для печати на стенд.',
  },
  {
    icon: '📖', title: 'Памятка: как самой править комнаты',
    status: 'Бэклог', prio: 'Низкий', area: 'Контент',
    body: 'Шпаргалка рабочего цикла правки карты: `economics-building.json` → `node tools/pdfwork/inject.mjs` → `node tools/generate-floor-plans.mjs` → проверка в браузере с `?v=N` против кэша.',
  },
];

const text = (res) => (res?.content ?? []).map(c => c.text ?? '').join('\n');

await ready();

// 1. Ищем существующую доску, чтобы не дублировать
let dbId = null, dsId = null;
const found = await callTool('notion-search', { query: DB_TITLE, page_size: 5 });
const foundText = text(found);
const urlIn = (s) => (s.match(/https:\/\/(?:www\.notion\.so|app\.notion\.com)\/(?:p\/)?([0-9a-f]{32})/i) ?? [])[0];
const existingUrl = urlIn(foundText);
if (foundText.includes(DB_TITLE) && existingUrl) {
  console.log('Доска уже существует:', existingUrl);
  const fetched = await callTool('notion-fetch', { id: existingUrl });
  const ft = text(fetched);
  dbId = urlIn(ft) ?? existingUrl;
  dsId = (ft.match(/collection:\/\/[0-9a-f-]{36}/i) ?? [])[0] ?? null;
}

// 2. Создаём базу задач
if (!dbId) {
  const db = await callTool('notion-create-database', {
    title: DB_TITLE,
    description: 'Канбан задач по интерактивной карте корпуса БГУ (ул. Карла Маркса, 31). Ведётся из ZCode, инструменты в campus-bsu/tools/notion/.',
    schema: 'CREATE TABLE ("Задача" TITLE, "Статус" STATUS(\'Бэклог\':gray:to_do, \'В работе\':blue:in_progress, \'Готово\':green:complete), "Приоритет" SELECT(\'Высокий\':red, \'Средний\':yellow, \'Низкий\':gray), "Область" SELECT(\'Данные\':blue, \'Поиск\':purple, \'Карта и UI\':pink, \'Инфраструктура\':brown, \'Контент\':orange))',
  });
  const dbText = text(db);
  console.log('--- create-database ---\n' + dbText.slice(0, 1500) + '\n');
  dbId = urlIn(dbText);
  dsId = (dbText.match(/collection:\/\/[0-9a-f-]{36}/i) ?? [])[0] ?? null;
}
if (!dbId || !dsId) throw new Error('не удалось определить database_id / data_source_id (см. вывод выше)');
console.log('database:', dbId, '\ndata source:', dsId);

// 3. Канбан-вид поверх таблицы
try {
  const view = await callTool('notion-create-view', {
    data_source_id: dsId.replace(/^collection:\/\//i, ''),
    database_id: dbId,
    name: 'Канбан',
    type: 'board',
    configure: 'GROUP BY "Статус" BY OPTION SHOW EMPTY; SHOW "Приоритет", "Область"',
  });
  console.log('\n--- create-view ---\n' + text(view).slice(0, 600));
} catch (e) {
  console.log('\ncreate-view не удался (вид можно добавить руками):', e.message);
}

// 4. Карточки (порциями, чтобы не упереться в лимит размера)
const pages = CARDS.map(c => ({
  icon: c.icon,
  properties: { 'Задача': c.title, 'Статус': c.status, 'Приоритет': c.prio, 'Область': c.area },
  content: c.body,
}));
const chunks = [pages];
let made = 0;
for (const chunk of chunks) {
  try {
    const res = await callTool('notion-create-pages', {
      parent: { type: 'data_source_id', data_source_id: dsId.replace(/^collection:\/\//i, '') },
      pages: chunk,
      allow_async: false,
    });
    made += chunk.length;
    console.log(`\n--- create-pages (${chunk.length}) ---\n` + text(res).slice(0, 3000));
  } catch (e) {
    if (chunk.length > 4) {
      console.log('Крупный запрос отклонён, дроблю:', e.message.slice(0, 200));
      chunks.push(...[chunk.slice(0, 4), chunk.slice(4)].filter(c => c.length));
    } else {
      throw e;
    }
  }
}
console.log(`\nГОТОВО: доска ${dbId}, карточек создано: ${made}`);
