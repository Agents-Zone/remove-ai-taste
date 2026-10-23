#!/usr/bin/env node
// write_batch.mjs — helper the skill calls after diagnosing a draft.
//
// The agent produces findings (Step 0-2 of SKILL.md) and pipes them in as JSON
// on stdin: an array of findings or a full batch object. This wraps them into a
// well-formed current_batch.json with a stable batch_id and summary, holding the
// lock while it writes. It also latches onboarding on first successful write.
//
//   echo '<findings-json>' | node scripts/write_batch.mjs <draft-path> [lang]
//
// findings-json: [{ line, category, severity, fingerprint, before, after,
//                   rationale, guide_ref }, ...]  (ids are assigned here)

import { FILES } from '../lib/paths.mjs';
import { writeJSONAtomic, readJSON, acquireLock, releaseLock } from '../lib/common.mjs';

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const draftPath = process.argv[2];
  const lang = process.argv[3] ?? 'zh';
  if (!draftPath) {
    console.error('usage: ... | write_batch.mjs <draft-path> [lang]');
    process.exit(1);
  }

  const raw = JSON.parse((await readStdin()) || '[]');
  const incoming = Array.isArray(raw) ? raw : raw.findings ?? [];

  const findings = incoming.map((f, i) => ({
    id: f.id ?? `f${String(i + 1).padStart(3, '0')}`,
    stage: f.stage ?? 'needs_review',
    line: f.line ?? null,
    category: f.category ?? 'ai_taste',
    severity: f.severity ?? 'should_fix',
    fingerprint: f.fingerprint ?? '',
    before: f.before ?? '',
    after: f.after ?? '',
    rationale: f.rationale ?? '',
    guide_ref: f.guide_ref ?? '',
  }));

  const summary = { needs_review: 0, to_approve: 0, approved: 0, done: 0, blocked: 0 };
  for (const f of findings) summary[f.stage] = (summary[f.stage] ?? 0) + 1;

  const batch = {
    batch_id: `remove-ai-taste-${stamp()}`,
    generated_at: new Date().toISOString(),
    target: { kind: 'file', path: draftPath, lang },
    summary,
    findings,
  };

  await acquireLock(FILES.lock, 'write_batch', `writing batch for ${draftPath}`);
  try {
    await writeJSONAtomic(FILES.batch, batch);
    // Fresh decisions doc for the new batch.
    await writeJSONAtomic(FILES.decisions, { batch_id: batch.batch_id, decisions: [] });
    // Latch onboarding on first successful batch.
    const ob = await readJSON(FILES.onboarding, null);
    if (!ob?.completed) {
      await writeJSONAtomic(FILES.onboarding, {
        completed: true,
        guide_path: '~/.claude/skills/remove-ai-taste/references/writing-core.md',
        default_lang: lang,
        blocking_threshold: 'blocking',
        latched_at: new Date().toISOString(),
      });
    }
  } finally {
    await releaseLock(FILES.lock);
  }

  console.log(`${batch.batch_id}: ${findings.length} finding(s) -> ${FILES.batch}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
