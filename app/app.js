// remove-ai-taste App-in-Skill — the visibility layer.
// The app renders what the skill prepared and captures the author's decisions.
// It NEVER edits the draft and NEVER performs an external effect (the boundary).

const STAGES = [
  { key: 'all', label: '全部' },
  { key: 'needs_review', label: '待审' },
  { key: 'to_approve', label: '待批准' },
  { key: 'approved', label: '已批准' },
  { key: 'done', label: '已应用' },
  { key: 'blocked', label: '已拦截' },
];

const SEV_LABEL = { blocking: '必须改', should_fix: '建议改', polish: '可更好' };
const CAT_LABEL = {
  ai_taste: 'AI 味',
  terminology: '术语',
  logic: '逻辑',
  density: '密度',
  structure: '结构',
  style: '风格',
};

const state = {
  batch: null,
  decisions: {}, // id -> decision
  locked: false,
  activeStage: 'all',
};

const $ = (sel) => document.querySelector(sel);

async function api(path, opts) {
  const r = await fetch(path, opts);
  if (!r.ok && r.status !== 423) throw new Error(`${path}: ${r.status}`);
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function load() {
  const [batch, dec, lock] = await Promise.all([
    api('/api/batch'),
    api('/api/decisions'),
    api('/api/lock'),
  ]);
  state.batch = batch.body;
  state.decisions = {};
  for (const d of dec.body?.decisions ?? []) state.decisions[d.id] = d;
  state.locked = Boolean(lock.body?.locked);
  render();
}

function effectiveStage(f) {
  // A decision overrides the batch's stored stage so the queue updates live.
  const d = state.decisions[f.id];
  if (!d) return f.stage ?? 'needs_review';
  if (d.verdict === 'approve' || d.verdict === 'revise') return 'approved';
  if (d.verdict === 'block') return 'blocked';
  if (d.verdict === 'request_changes') return 'needs_review';
  return f.stage ?? 'needs_review';
}

function render() {
  const findings = state.batch?.findings ?? [];

  // header
  $('#target').textContent = state.batch?.target?.path ?? '';
  $('#lock-banner').classList.toggle('hidden', !state.locked);

  // counts by effective stage
  const counts = {};
  for (const f of findings) {
    const s = effectiveStage(f);
    counts[s] = (counts[s] ?? 0) + 1;
  }
  $('#counts').innerHTML = ['blocking', 'should_fix', 'polish']
    .map((sev) => {
      const n = findings.filter((f) => f.severity === sev).length;
      return n ? `<span class="c"><b>${n}</b> ${SEV_LABEL[sev]}</span>` : '';
    })
    .join('');

  // stage tabs
  $('#stages').innerHTML = STAGES.map((st) => {
    const n = st.key === 'all' ? findings.length : counts[st.key] ?? 0;
    const active = state.activeStage === st.key ? 'active' : '';
    return `<button class="${active}" data-stage="${st.key}">${st.label}<span class="n">${n}</span></button>`;
  }).join('');

  // findings list
  const visible = findings.filter(
    (f) => state.activeStage === 'all' || effectiveStage(f) === state.activeStage
  );
  const main = $('#findings');
  if (!findings.length) {
    main.innerHTML = '<p class="empty">没有审阅批次。让 skill 先跑一遍审阅，生成 current_batch.json。</p>';
    return;
  }
  if (!visible.length) {
    main.innerHTML = '<p class="empty">这个阶段没有条目。</p>';
    return;
  }
  main.innerHTML = visible.map(renderCard).join('');
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function renderCard(f) {
  const d = state.decisions[f.id];
  const disabled = state.locked ? 'disabled' : '';
  const afterText = d?.edited_after ?? f.after ?? '';

  const verdictTag = d
    ? `<span class="verdict-tag verdict-${d.verdict}">${verdictLabel(d.verdict)}</span>`
    : '';

  return `
  <div class="card" data-id="${f.id}">
    <div class="card-head">
      <span class="badge sev-${f.severity}">${SEV_LABEL[f.severity] ?? f.severity}</span>
      <span class="cat">${CAT_LABEL[f.category] ?? f.category}</span>
      <span class="line-ref">行 ${f.line ?? '?'}</span>
      ${verdictTag}
      <span class="fid">${f.id}</span>
    </div>
    ${f.fingerprint ? `<p class="fingerprint">${esc(f.fingerprint)}</p>` : ''}
    <div class="diff">
      <div class="row before"><span class="label">原文</span>${esc(f.before)}</div>
      <div class="row" style="background:transparent;padding:0">
        <span class="label">改写建议（可直接编辑）</span>
        <textarea class="edit" data-id="${f.id}" ${disabled}>${esc(afterText)}</textarea>
      </div>
    </div>
    ${f.rationale ? `<p class="rationale">${esc(f.rationale)} ${f.guide_ref ? `<span class="guide-ref">· ${esc(f.guide_ref)}</span>` : ''}</p>` : ''}
    <div class="actions">
      <button class="primary act" data-act="approve" data-id="${f.id}" ${disabled}>批准</button>
      <button class="act" data-act="revise" data-id="${f.id}" ${disabled}>保存我的改写</button>
      <button class="act" data-act="request_changes" data-id="${f.id}" ${disabled}>要求重写</button>
      <button class="danger act" data-act="block" data-id="${f.id}" ${disabled}>保留原文</button>
    </div>
    <input class="comment-box" data-id="${f.id}" placeholder="给 agent 的备注（要求重写时随交接传过去，可用 @ai …）"
           value="${esc(d?.comment ?? '')}" ${disabled} />
  </div>`;
}

function verdictLabel(v) {
  return { approve: '已批准', revise: '已改写', request_changes: '要求重写', block: '保留原文' }[v] ?? v;
}

async function decide(id, verdict) {
  const card = document.querySelector(`.card[data-id="${id}"]`);
  const editedAfter = card?.querySelector('textarea.edit')?.value ?? null;
  const comment = card?.querySelector('input.comment-box')?.value ?? null;

  const payload = { id, verdict, comment: comment || null };
  // For "revise" the author's own text is canonical; "approve" takes the
  // agent's after as-is (but if they edited the box, treat it as revise).
  if (verdict === 'revise') {
    payload.verdict = 'revise';
    payload.edited_after = editedAfter;
  } else if (verdict === 'approve') {
    const original = state.batch.findings.find((f) => f.id === id)?.after ?? '';
    if (editedAfter != null && editedAfter !== original) {
      payload.verdict = 'revise';
      payload.edited_after = editedAfter;
    }
  }

  const { status } = await api('/api/decision', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (status === 423) {
    state.locked = true;
    render();
    return;
  }
  state.decisions[id] = { ...payload, decided_at: new Date().toISOString() };
  render();
}

// --- events (delegated) ---
document.addEventListener('click', (e) => {
  const stageBtn = e.target.closest('[data-stage]');
  if (stageBtn) {
    state.activeStage = stageBtn.dataset.stage;
    render();
    return;
  }
  const actBtn = e.target.closest('.act');
  if (actBtn) {
    decide(actBtn.dataset.id, actBtn.dataset.act);
  }
});

// Poll for lock/report changes, but don't clobber an edit in progress:
// skip the refresh while the author has focus inside a card.
load();
setInterval(() => {
  const editing = document.activeElement;
  if (editing && (editing.tagName === 'TEXTAREA' || editing.tagName === 'INPUT')) return;
  load();
}, 4000);
