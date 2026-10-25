// Включение GitHub Pages (ветка main, папка /) через API — токен берём у git credential
// manager (он уже сохранил его при пуше). Токен не логируется.
import { spawnSync } from 'node:child_process';

const GIT = 'C:\\Program Files\\Git\\cmd\\git.exe';
const OWNER_REPO = 'annamalinets-byte/campus-bsu';
const SITE = 'https://annamalinets-byte.github.io/campus-bsu/';

const cred = spawnSync(GIT, ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n' });
const token = (cred.stdout.toString().match(/^password=(.+)$/m) ?? [])[1];
if (!token) throw new Error(`токен GitHub не получен (exit ${cred.status}): ${cred.stderr.toString().slice(0, 200)}`);

const api = (path, opts = {}) => fetch(`https://api.github.com${path}`, {
  ...opts,
  headers: {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'user-agent': 'campus-bsu-tools',
    'x-github-api-version': '2022-11-28',
    ...(opts.headers ?? {}),
  },
});

// 1. Включаем Pages (source = main / root)
let r = await api(`/repos/${OWNER_REPO}/pages`, {
  method: 'POST',
  body: JSON.stringify({ source: { branch: 'main', path: '/' } }),
});
if (r.status === 201) console.log('Pages включён (201 created)');
else if (r.status === 409 || r.status === 204) console.log('Pages уже был включён');
else throw new Error(`POST /pages -> ${r.status}: ${(await r.text()).slice(0, 300)}`);

// 2. Информация о странице
r = await api(`/repos/${OWNER_REPO}/pages`);
const p = await r.json();
console.log('URL:', p.html_url, '| status:', p.status, '| build:', p.build_status);

// 3. Ждём первый деплой (до ~5 минут)
for (let i = 1; i <= 20; i++) {
  const res = await fetch(SITE, { redirect: 'follow' }).catch(() => null);
  if (res && res.ok) {
    const body = await res.text();
    console.log(`сайт отвечает ${res.status}, страница ${body.length} байт — деплой готов (попытка ${i})`);
    process.exit(0);
  }
  if (i === 20) throw new Error(`сайт не поднялся за 5 минут (последний статус ${res?.status})`);
  console.log(`попытка ${i}: ${res?.status ?? 'сеть'} — жду 15 с…`);
  await new Promise(s => setTimeout(s, 15000));
}
