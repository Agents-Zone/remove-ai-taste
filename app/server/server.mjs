// Local HTTP server for the remove-ai-taste App-in-Skill.
// Node built-ins only (Spec 1): http, fs/promises, path, url.
// Serves on 127.0.0.1 only — never exposed externally.
// Idempotent launch: if a healthy instance owns the preferred port, reuse it.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createProvider } from '../../lib/data-provider/index.mjs';
import { FILES } from '../../lib/paths.mjs';
import { readLock } from '../../lib/common.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(__dirname, '..'); // serves index.html, app.js, styles.css
const HOST = '127.0.0.1';
const PORT_MIN = 3000;
const PORT_MAX = 4000;

const provider = createProvider();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function sendJSON(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(data);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function serveStatic(res, urlPath) {
  // Confine to APP_DIR; reject path traversal.
  const rel = normalize(urlPath === '/' ? '/index.html' : urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(APP_DIR, rel);
  if (!filePath.startsWith(APP_DIR)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
}

const server = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, `http://${HOST}`);

    // --- Health check (used for idempotent launch) ---
    if (pathname === '/api/health') {
      return sendJSON(res, 200, { ok: true, app: 'remove-ai-taste' });
    }

    // --- State the skill produced ---
    if (req.method === 'GET' && pathname === '/api/batch') {
      return sendJSON(res, 200, (await provider.getBatch()) ?? { findings: [] });
    }
    if (req.method === 'GET' && pathname === '/api/decisions') {
      return sendJSON(res, 200, await provider.getDecisions());
    }
    if (req.method === 'GET' && pathname === '/api/report') {
      return sendJSON(res, 200, (await provider.getReport()) ?? null);
    }
    if (req.method === 'GET' && pathname === '/api/config') {
      return sendJSON(res, 200, await provider.getSafeConfigSummary());
    }
    if (req.method === 'GET' && pathname === '/api/lock') {
      const lock = await readLock(FILES.lock);
      return sendJSON(res, 200, { locked: Boolean(lock && !lock.stale), lock });
    }

    // --- Author decisions (app -> skill) ---
    if (req.method === 'POST' && pathname === '/api/decision') {
      // The boundary: the app only writes local handoff files. It never edits
      // the draft and never performs an external effect.
      const lock = await readLock(FILES.lock);
      if (lock && !lock.stale) {
        return sendJSON(res, 423, { error: 'locked', message: lock.message });
      }
      const body = JSON.parse(await readBody(req));
      if (!body.id || !body.verdict) {
        return sendJSON(res, 400, { error: 'id and verdict required' });
      }
      const result = await provider.putDecision({
        id: body.id,
        verdict: body.verdict, // approve | request_changes | revise | block
        edited_after: body.edited_after ?? null,
        comment: body.comment ?? null,
      });
      return sendJSON(res, 200, result);
    }

    // --- Static UI ---
    return serveStatic(res, pathname);
  } catch (err) {
    sendJSON(res, 500, { error: String(err.message ?? err) });
  }
});

async function probeHealthy(port) {
  try {
    const r = await fetch(`http://${HOST}:${port}/api/health`, { signal: AbortSignal.timeout(400) });
    const j = await r.json();
    return j?.app === 'remove-ai-taste';
  } catch {
    return false;
  }
}

async function start() {
  // Idempotent: if our app already owns the preferred port, report and exit.
  for (let port = PORT_MIN; port <= PORT_MAX; port++) {
    if (await probeHealthy(port)) {
      console.log(`http://${HOST}:${port}`);
      console.log(`(reused existing instance on ${port})`);
      process.exit(0);
    }
    const bound = await tryListen(port);
    if (bound) {
      console.log(`http://${HOST}:${port}`);
      return;
    }
  }
  console.error(`no free port in ${PORT_MIN}-${PORT_MAX}`);
  process.exit(1);
}

function tryListen(port) {
  return new Promise((resolve) => {
    const onError = (err) => {
      server.removeListener('listening', onListening);
      resolve(err.code === 'EADDRINUSE' ? false : Promise.reject(err));
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolve(true);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, HOST);
  });
}

start();
