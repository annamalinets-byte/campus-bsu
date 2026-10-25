// Универсальный клиент Notion MCP (Streamable HTTP + JSON-RPC).
// CLI:  node mcp.mjs <method> '<json-params>'   например: node mcp.mjs tools/list
// API:  import { ready, callTool } from './mcp.mjs'
// Токены лежат в .tokens.json (обновляются автоматически через refresh_token).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const TOKENS_FILE = join(dirname(fileURLToPath(import.meta.url)), '.tokens.json');
let T = JSON.parse(readFileSync(TOKENS_FILE, 'utf8'));
let sessionId = null;
let protocolVersion = null;
let nextId = 1;

async function accessToken(forceRefresh = false) {
  const fresh = T.access_token &&
    Date.now() - (T.obtained_at || 0) < ((T.expires_in || 3600) - 120) * 1000;
  if (!forceRefresh && fresh) return T.access_token;
  if (!T.refresh_token) {
    if (T.access_token && !forceRefresh) return T.access_token;
    throw new Error('нет refresh_token — запусти auth.mjs заново');
  }
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: T.refresh_token,
    client_id: T.client_id,
  });
  if (T.client_secret) body.set('client_secret', T.client_secret);
  const r = await fetch(T.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`refresh -> ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  T = { ...T, ...j, obtained_at: Date.now() };
  writeFileSync(TOKENS_FILE, JSON.stringify(T, null, 2));
  console.error('токен обновлён через refresh_token');
  return T.access_token;
}

async function rpc(method, params = {}, forceAuth = false) {
  const notification = method.startsWith('notifications/');
  const headers = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    authorization: `Bearer ${await accessToken(forceAuth)}`,
  };
  if (sessionId) headers['mcp-session-id'] = sessionId;
  if (protocolVersion) headers['mcp-protocol-version'] = protocolVersion;
  const msg = { jsonrpc: '2.0', method, params };
  if (!notification) msg.id = nextId++;

  let r = await fetch(T.server_url, { method: 'POST', headers, body: JSON.stringify(msg) });
  const sid = r.headers.get('mcp-session-id');
  if (sid) sessionId = sid;
  if (r.status === 401 && !forceAuth) return rpc(method, params, true);

  if (r.status === 202 || r.status === 204) return null;
  const ct = r.headers.get('content-type') || '';
  let payload;
  if (ct.includes('text/event-stream')) {
    const text = await r.text();
    const msgs = [];
    for (const m of text.matchAll(/^data:\s*(.+)$/gm)) {
      try { msgs.push(JSON.parse(m[1])); } catch { /* пропускаем не-JSON строки */ }
    }
    payload = msgs[msgs.length - 1] ?? null;
  } else {
    payload = await r.json().catch(() => null);
  }
  if (!r.ok) throw new Error(`${method} -> ${r.status}: ${(await r.text()).slice(0, 400)}`);
  if (payload?.error) throw new Error(`${method}: ${JSON.stringify(payload.error).slice(0, 400)}`);
  return payload;
}

export async function ready() {
  const init = await rpc('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'campus-bsu-tasks', version: '1.0.0' },
  });
  protocolVersion = init?.result?.protocolVersion ?? '2025-03-26';
  await rpc('notifications/initialized', {});
  return init;
}

export async function callTool(name, args) {
  const out = await rpc('tools/call', { name, arguments: args });
  const result = out?.result;
  if (result?.isError) {
    throw new Error(`инструмент ${name}: ${JSON.stringify(result.content).slice(0, 800)}`);
  }
  return result;
}

// --- CLI-режим -------------------------------------------------------------
const self = process.argv[1]?.replace(/\\/g, '/').endsWith('/mcp.mjs');
if (self) {
  const [method, paramsArg] = process.argv.slice(2);
  if (!method) {
    console.error('использование: node mcp.mjs <method> [json-params]');
    process.exit(2);
  }
  await ready();
  const out = await rpc(method, paramsArg ? JSON.parse(paramsArg) : {});
  console.log(JSON.stringify(out, null, 2));
}
