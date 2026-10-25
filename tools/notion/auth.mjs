// OAuth 2.0 + PKCE для официального MCP-сервера Notion (mcp.notion.com).
// Запуск: node auth.mjs — печатает в консоль строку AUTH_URL:<ссылка>,
// пытается открыть браузер, ждёт редиректа на localhost и сохраняет токены
// в .tokens.json рядом с собой. Порт подбирается свободный (8311+).
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SERVER_URL = 'https://mcp.notion.com/mcp';
const START_PORT = 8311;
const TOKENS_FILE = join(dirname(fileURLToPath(import.meta.url)), '.tokens.json');
const WAIT_MINUTES = 15;
const b64url = (buf) => buf.toString('base64url');

async function jget(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
  return r.json();
}

// 1. Обнаруживаем точки входа OAuth (RFC 9728 + метаданные сервера авторизации)
let protectedResource = 'https://mcp.notion.com/.well-known/oauth-protected-resource';
try {
  const probe = await fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'ping' }),
  });
  const wwwAuth = probe.headers.get('www-authenticate') || '';
  const m = wwwAuth.match(/resource_metadata="?([^"\s]+)"?/i);
  if (m) protectedResource = m[1];
} catch { /* останется дефолт */ }
const { authorization_servers } = await jget(protectedResource);
const asUrl = (authorization_servers[0] || 'https://mcp.notion.com').replace(/\/+$/, '');
const asMeta = await jget(`${asUrl}/.well-known/oauth-authorization-server`);
console.log('authorization_endpoint:', asMeta.authorization_endpoint);

// 2. Занимаем порт под редирект
const { srv, port } = await new Promise((resolve, reject) => {
  const tryPort = (p, left) => {
    const s = createServer(() => {});
    s.once('error', (e) => (e.code === 'EADDRINUSE' && left > 0 ? tryPort(p + 1, left - 1) : reject(e)));
    s.listen(p, () => { s.close(); resolve({ srv: null, port: p }); });
  };
  tryPort(START_PORT, 8);
});
const redirectUri = `http://localhost:${port}/callback`;
console.log('redirect_uri:', redirectUri);

// 3. PKCE
const verifier = b64url(randomBytes(48));
const challenge = b64url(createHash('sha256').update(verifier).digest());
const state = b64url(randomBytes(16));

// 4. Динамическая регистрация клиента: сначала публичный (PKCE), иначе конфиденциальный
let client = null;
for (const authMethod of ['none', null]) {
  const body = {
    client_name: 'campus-bsu map tasks',
    redirect_uris: [redirectUri],
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
  };
  if (authMethod) body.token_endpoint_auth_method = authMethod;
  const r = await fetch(asMeta.registration_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (r.ok) {
    client = await r.json();
    console.log(`клиент зарегистрирован (${authMethod ?? 'конфиденциальный'}):`, client.client_id);
    break;
  }
  console.log(`регистрация как ${authMethod ?? 'default'} -> ${r.status}, пробуем иначе`);
}
if (!client) throw new Error('Не удалось зарегистрировать OAuth-клиент');

// 5. Ссылка на страницу согласия
const authUrl = new URL(asMeta.authorization_endpoint);
authUrl.searchParams.set('client_id', client.client_id);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('state', state);
authUrl.searchParams.set('code_challenge', challenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
console.log('\nAUTH_URL:' + authUrl.href + '\n');

// 6. Пробуем открыть браузер (не фатально: ссылка уже напечатана в консоли)
for (const opener of [
  () => spawn('powershell.exe', ['-NoProfile', '-Command', 'Start-Process', `'${authUrl.href}'`], { detached: true, stdio: 'ignore' }),
  () => spawn('cmd.exe', ['/c', 'start', '', authUrl.href.replace(/&/g, '^^^&')], { detached: true, stdio: 'ignore' }),
]) {
  try { opener().unref(); break; } catch (e) { console.log('не удалось открыть браузер:', e.message); }
}

// 7. Слушаем редирект
const code = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    if (url.pathname !== '/callback') { res.writeHead(404).end(); return; }
    const ok = (html) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(html);
      server.close();
    };
    if (url.searchParams.get('state') !== state) {
      ok('<h2>❌ state не совпал</h2><p>Это ссылка от старого запуска — открой свежую из чата.</p>');
      reject(new Error('state mismatch'));
      return;
    }
    const err = url.searchParams.get('error');
    if (err || !url.searchParams.get('code')) {
      ok(`<h2>❌ ${err || 'код не получен'}</h2>`);
      reject(new Error('авторизация отклонена: ' + err));
      return;
    }
    ok('<h2>✅ Notion подключён</h2><p>Вкладку можно закрыть и вернуться в ZCode.</p>');
    resolve(url.searchParams.get('code'));
  });
  server.listen(port, () => console.log(`жду ответа браузера на :${port} (до ${WAIT_MINUTES} минут)…`));
  setTimeout(() => {
    try { server.close(); } catch {}
    reject(new Error('таймаут: авторизация не завершена'));
  }, WAIT_MINUTES * 60_000);
});

// 7. Меняем код на токен и сохраняем
const form = new URLSearchParams({
  grant_type: 'authorization_code',
  code,
  redirect_uri: redirectUri,
  client_id: client.client_id,
  code_verifier: verifier,
});
if (client.client_secret) form.set('client_secret', client.client_secret);
const tr = await fetch(asMeta.token_endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
  body: form,
});
const tokens = await tr.json();
if (!tr.ok) throw new Error(`обмен кода -> ${tr.status}: ${JSON.stringify(tokens)}`);

writeFileSync(TOKENS_FILE, JSON.stringify({
  ...tokens,
  server_url: SERVER_URL,
  client_id: client.client_id,
  client_secret: client.client_secret ?? null,
  token_endpoint: asMeta.token_endpoint,
  redirect_uri: redirectUri,
  obtained_at: Date.now(),
}, null, 2));
console.log('OK, токены сохранены:', TOKENS_FILE);
