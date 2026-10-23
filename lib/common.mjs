// Shared helpers: atomic JSON read/write and file-based locking.
// Atomic write = temp file + rename, so a reader never sees a partial write
// (Spec 2 requirement).

import { readFile, writeFile, rename, unlink, stat, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function readJSON(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

export async function writeJSONAtomic(path, value) {
  // app/.data/ is gitignored, so a fresh clone does not have it yet.
  await mkdir(dirname(path), { recursive: true });
  const tmp = join(dirname(path), `.${Date.now()}.${process.pid}.tmp`);
  await writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
  await rename(tmp, path);
}

// --- File-based lock (Spec 3) ---
// Single lock file with owner, message, started_at. A stale lock (crashed run)
// is detectable by its timestamp.

const STALE_LOCK_MS = 10 * 60 * 1000; // 10 minutes

export async function readLock(lockPath) {
  const lock = await readJSON(lockPath, null);
  if (!lock) return null;
  const age = Date.now() - new Date(lock.started_at).getTime();
  return { ...lock, stale: age > STALE_LOCK_MS };
}

export async function acquireLock(lockPath, owner, message) {
  const existing = await readLock(lockPath);
  if (existing && !existing.stale) {
    throw new Error(`locked by ${existing.owner}: ${existing.message}`);
  }
  await writeJSONAtomic(lockPath, {
    owner,
    message,
    started_at: new Date().toISOString(),
  });
}

export async function releaseLock(lockPath) {
  try {
    await unlink(lockPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

export async function isLocked(lockPath) {
  const lock = await readLock(lockPath);
  return Boolean(lock && !lock.stale);
}
