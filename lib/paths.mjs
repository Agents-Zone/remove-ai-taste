// Canonical paths for the remove-ai-taste App-in-Skill.
// Single source of truth so the server, scripts, and provider agree.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const SKILL_ROOT = join(__dirname, '..');
export const APP_ROOT = join(SKILL_ROOT, 'app');
export const DATA_DIR = join(APP_ROOT, '.data');

export const FILES = {
  batch: join(DATA_DIR, 'current_batch.json'),
  decisions: join(DATA_DIR, 'decisions.json'),
  report: join(DATA_DIR, 'execution_report.json'),
  lock: join(DATA_DIR, 'agent.lock'),
  onboarding: join(DATA_DIR, 'onboarding.json'),
};
