#!/usr/bin/env node
// apply_decisions.mjs — the skill's execution step (Step 4 of the HACL).
//
// This is the ONLY component that edits the author's draft. It:
//   1. acquires the lock (Spec 3)
//   2. re-reads decisions.json FROM DISK (never from a cached batch)
//   3. applies approved + revised edits to the draft by before-text match
//   4. writes execution_report.json (applied / stale / blocked per finding)
//   5. releases the lock in a finally step
//
// before-text match (not line number) is deliberate: the author may have
// edited the draft between batches, so we never trust a stale line number to
// overwrite prose. A non-matching edit is reported `stale`, not forced in.

import { readFile, writeFile } from 'node:fs/promises';

import { FILES } from '../lib/paths.mjs';
import { createProvider } from '../lib/data-provider/index.mjs';
import { writeJSONAtomic, acquireLock, releaseLock } from '../lib/common.mjs';

const provider = createProvider();

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    count++;
    i += needle.length;
  }
  return count;
}

async function main() {
  const batch = await provider.getBatch();
  if (!batch) {
    console.error('no current_batch.json — nothing to apply');
    process.exit(1);
  }
  const draftPath = batch.target?.path;
  if (!draftPath || batch.target?.kind !== 'file') {
    console.error('apply only supports a file target (edit-to-canonical)');
    process.exit(1);
  }

  await acquireLock(FILES.lock, 'apply_decisions', `applying edits to ${draftPath}`);
  try {
    // Re-read decisions from disk — act on the author's final state.
    const decisionsDoc = await provider.getDecisions();
    const decisions = decisionsDoc.decisions ?? [];
    const byId = new Map(decisions.map((d) => [d.id, d]));
    const findings = new Map(batch.findings.map((f) => [f.id, f]));

    let draft = await readFile(draftPath, 'utf8');
    const results = [];

    // Apply approved/revised edits. Order longest-before first so a longer
    // match isn't shadowed by a shorter overlapping one.
    const applicable = decisions
      .filter((d) => d.verdict === 'approve' || d.verdict === 'revise')
      .map((d) => ({ d, f: findings.get(d.id) }))
      .filter((x) => x.f)
      .sort((a, b) => (b.f.before?.length ?? 0) - (a.f.before?.length ?? 0));

    for (const { d, f } of applicable) {
      const after = d.verdict === 'revise' ? d.edited_after ?? f.after : f.after;
      const occ = countOccurrences(draft, f.before);
      if (occ === 0) {
        results.push({ id: f.id, outcome: 'stale', reason: 'before-text no longer in draft' });
      } else if (occ > 1) {
        results.push({ id: f.id, outcome: 'stale', reason: `before-text appears ${occ}× — ambiguous, skipped` });
      } else {
        draft = draft.replace(f.before, after);
        results.push({ id: f.id, outcome: 'applied' });
      }
    }

    // Record blocked + request_changes outcomes for the report.
    for (const d of decisions) {
      if (d.verdict === 'block') results.push({ id: d.id, outcome: 'blocked' });
      if (d.verdict === 'request_changes')
        results.push({ id: d.id, outcome: 'returned_to_agent', comment: d.comment ?? null });
    }

    // Findings with no decision are simply pending — note them.
    for (const f of batch.findings) {
      if (!byId.has(f.id)) results.push({ id: f.id, outcome: 'pending' });
    }

    const applied = results.filter((r) => r.outcome === 'applied').length;
    if (applied > 0) {
      await writeFile(draftPath, draft, 'utf8');
    }

    await writeJSONAtomic(FILES.report, {
      batch_id: batch.batch_id,
      applied_at: new Date().toISOString(),
      draft: draftPath,
      results,
    });

    console.log(`applied ${applied} edit(s) to ${draftPath}`);
    const stale = results.filter((r) => r.outcome === 'stale');
    if (stale.length) {
      console.log(`${stale.length} stale (re-review): ${stale.map((r) => r.id).join(', ')}`);
    }
    const requeued = results.filter((r) => r.outcome === 'returned_to_agent');
    if (requeued.length) {
      console.log(`${requeued.length} returned to agent for rewrite: ${requeued.map((r) => r.id).join(', ')}`);
    }
  } finally {
    await releaseLock(FILES.lock);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
