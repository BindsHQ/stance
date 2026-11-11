// Minimal static server for the docs export (maps /a/b → /a/b.html). Dev/test use only.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = join(import.meta.dirname, '..', 'apps', 'docs', 'out');
const port = Number(process.env.PORT ?? 4173);
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  const safe = normalize(url).replace(/^(\.\.[/\\])+/, '');
  const candidates = [join(root, safe), join(root, `${safe}.html`), join(root, safe, 'index.html')];
  const file = candidates.find((f) => f.startsWith(root) && existsSync(f) && statSync(f).isFile());
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/html' });
    res.end(
      existsSync(join(root, '404.html')) ? readFileSync(join(root, '404.html')) : 'Not found',
    );
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
