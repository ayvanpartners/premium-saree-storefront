/* ------------------------------------------------------------------ *
 * Minimal static server for reviewing dist/ locally.
 *
 * Mirrors what a static host does: directory URLs resolve to
 * index.html, unknown paths return the real 404 page with a 404
 * status, and compressible text is gzipped so transfer sizes look
 * like production rather than like a local filesystem.
 * ------------------------------------------------------------------ */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = Number(process.env.PORT || 4330);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.md': 'text/markdown; charset=utf-8',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon'
};

const COMPRESSIBLE = new Set(['.html', '.css', '.mjs', '.js', '.json', '.svg', '.xml', '.txt']);

const server = createServer(async (req, res) => {
  const requested = decodeURIComponent((req.url || '/').split('?')[0]);
  // Contain the path inside dist/ regardless of what is requested.
  const safe = normalize(requested).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, safe);

  try {
    const info = await stat(file).catch(() => null);
    if (!info || info.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    send(res, 200, file, body, req);
  } catch {
    try {
      const notFound = await readFile(join(ROOT, '404.html'));
      send(res, 404, '404.html', notFound, req);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not found');
    }
  }
});

function send(res, status, file, body, req) {
  const ext = extname(file);
  // Real hosting fingerprints filenames and caches hard. This build
  // does not, so anything editable is served no-cache — otherwise a
  // rebuild appears to change nothing until you clear the cache.
  const longLived = ['.woff2', '.svg', '.webp', '.avif', '.jpg', '.jpeg', '.png'].includes(ext);
  const headers = {
    'content-type': TYPES[ext] || 'application/octet-stream',
    'cache-control': longLived ? 'public, max-age=3600' : 'no-cache',
    // Close to what a sensible host would send.
    'x-content-type-options': 'nosniff'
  };
  const accepts = String(req.headers['accept-encoding'] || '').includes('gzip');
  if (accepts && COMPRESSIBLE.has(ext) && body.length > 512) {
    const gz = gzipSync(body);
    headers['content-encoding'] = 'gzip';
    headers['content-length'] = gz.length;
    res.writeHead(status, headers);
    res.end(gz);
    return;
  }
  headers['content-length'] = body.length;
  res.writeHead(status, headers);
  res.end(body);
}

server.listen(PORT, () => {
  console.log(`Serving dist/ at http://localhost:${PORT}`);
});
