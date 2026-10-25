// Простой статический сервер для локальной проверки карты (из корня campus-bsu/).
// Запуск: node tools/serve.mjs  →  http://127.0.0.1:8137/
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PORT = 8137;
const MIME = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.pdf': 'application/pdf', '.js': 'text/javascript', '.css': 'text/css' };

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(normalize(ROOT))) { res.writeHead(403); res.end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
}).listen(PORT, () => console.log(`http://127.0.0.1:${PORT}/ (root: ${ROOT})`));
