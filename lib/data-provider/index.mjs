// Pluggable data provider (Spec 4).
// Every provider implements the same minimal interface:
//   getBatch()        -> the current review batch (skill -> app state)
//   getDecisions()    -> the author's decisions (app -> skill input)
//   putDecision(d)    -> persist one decision
//   getReport()       -> the execution report (skill -> app state)
//   isConfigured()    -> onboarding/readiness check
//   getSafeConfigSummary() -> sanitized summary for the UI (no secrets)
//
// Default and only implementation here is `local` (local files). Others
// (postgres, notion, busabase) plug in behind the same interface without
// changing the server or the UI — moving between them is a config change.

import { FILES } from '../paths.mjs';
import { readJSON, writeJSONAtomic } from '../common.mjs';

class LocalFileProvider {
  async getBatch() {
    return readJSON(FILES.batch, null);
  }

  async getDecisions() {
    return readJSON(FILES.decisions, { batch_id: null, decisions: [] });
  }

  async putDecision(decision) {
    const batch = await this.getBatch();
    const current = await this.getDecisions();
    const batch_id = batch?.batch_id ?? current.batch_id ?? null;

    // Drop any prior decision for the same finding, then append the new one.
    const decisions = current.decisions.filter((d) => d.id !== decision.id);
    decisions.push({ ...decision, decided_at: new Date().toISOString() });

    await writeJSONAtomic(FILES.decisions, { batch_id, decisions });
    return { batch_id, count: decisions.length };
  }

  async getReport() {
    return readJSON(FILES.report, null);
  }

  async isConfigured() {
    const ob = await readJSON(FILES.onboarding, null);
    return Boolean(ob && ob.completed === true);
  }

  async getSafeConfigSummary() {
    const ob = await readJSON(FILES.onboarding, null);
    return {
      provider: process.env.REVIEW_WRITING_DATA_PROVIDER ?? 'local',
      configured: Boolean(ob && ob.completed === true),
      guide_path: ob?.guide_path ?? null,
      default_lang: ob?.default_lang ?? null,
      blocking_threshold: ob?.blocking_threshold ?? null,
    };
  }
}

const PROVIDER = process.env.REVIEW_WRITING_DATA_PROVIDER ?? 'local';

export function createProvider() {
  switch (PROVIDER) {
    case 'local':
      return new LocalFileProvider();
    // case 'postgres': return new PostgresProvider();
    // case 'notion':   return new NotionProvider();
    // case 'busabase': return new BusabaseProvider();
    default:
      throw new Error(`Unknown data provider: ${PROVIDER}`);
  }
}
