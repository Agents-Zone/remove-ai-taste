export const meta = {
  name: 'remove-ai-taste',
  description: 'Multi-agent de-AI pass on one draft: scan, 4-lens diagnose, adversarial verify, rewrite, fact check',
  whenToUse: 'Rewrite or review a Chinese/English draft so it reads less AI-generated, with independent checks that facts and the author voice survive. args: {draft: "/abs/path.md", mode?: "rewrite"|"review", out?: "/abs/path", profile?: "article"|"professional"|"marketing"|"translation"|"short-message", readerCuts?: boolean, skillDir?: "/abs/path"}',
  phases: [
    { title: 'Scan', detail: 'run the bundled scanner' },
    { title: 'Diagnose', detail: 'four lenses in parallel' },
    { title: 'Verify', detail: 'a skeptic tries to refute each finding' },
    { title: 'Rewrite', detail: 'paragraph-level rewrite, or a review report' },
    { title: 'Check', detail: 'facts preserved, residual AI taste, repair loop' },
  ],
}

// ---------- args ----------
const A = args || {}
if (!A.draft) throw new Error('args.draft (absolute path to the draft) is required')
const DRAFT = A.draft
const MODE = A.mode === 'review' ? 'review' : 'rewrite'
const PROFILE = A.profile || 'article'
const READER_CUTS = A.readerCuts === true
const SKILL = (A.skillDir || '~/.claude/skills/remove-ai-taste').replace(/\/$/, '')
const DOT = DRAFT.lastIndexOf('.')
const STEM = DOT > DRAFT.lastIndexOf('/') ? DRAFT.slice(0, DOT) : DRAFT
const OUT = A.out || (MODE === 'review' ? `${STEM}.review.md` : `${STEM}.revised.md`)
const MAX_REPAIRS = 1

const CORE = `${SKILL}/references/writing-core.md`
const RULES = `${SKILL}/references/rules.md`
const EN = `${SKILL}/references/anti-ai-fingerprints.md`
const BASE = `You are one stage of the remove-ai-taste workflow. Draft: ${DRAFT}. Rules: ${RULES} (nine rules), expanded in ${CORE}; for English drafts also ${EN}. Lines starting with § are author meta-instructions, never prose: ignore them as findings and leave them untouched. Never invent facts, numbers, quotes, people, or examples.`

// ---------- schemas ----------
const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          line: { type: 'integer' },
          before: { type: 'string', description: 'exact original text, copied verbatim' },
          issue: { type: 'string', description: 'which fingerprint or problem, in the draft language' },
          rule: { type: 'string', description: 'rules.md number and/or writing-core.md section' },
          severity: { type: 'string', enum: ['blocking', 'should_fix', 'polish'] },
          suggestion: { type: 'string', description: 'concrete rewrite, or empty if the fix is a deletion' },
          content_change: { type: 'boolean', description: 'true if fixing it removes or changes content rather than style' },
        },
        required: ['line', 'before', 'issue', 'rule', 'severity', 'content_change'],
      },
    },
  },
  required: ['findings'],
}
const VERDICTS = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: { index: { type: 'integer' }, real: { type: 'boolean' }, reason: { type: 'string' } },
        required: ['index', 'real', 'reason'],
      },
    },
  },
  required: ['verdicts'],
}
const WRITTEN = {
  type: 'object',
  properties: {
    out_path: { type: 'string' },
    style_changes: { type: 'array', items: { type: 'string' } },
    content_changes: { type: 'array', items: { type: 'string' } },
    evidence_gaps: { type: 'array', items: { type: 'string' } },
  },
  required: ['out_path', 'style_changes', 'content_changes', 'evidence_gaps'],
}
const CHECK = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    problems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['fact_changed', 'meaning_changed', 'invented', 'unapproved_cut', 'ai_taste_left', 'new_ai_taste'] },
          detail: { type: 'string' },
        },
        required: ['kind', 'detail'],
      },
    },
  },
  required: ['ok', 'problems'],
}

// ---------- Scan ----------
phase('Scan')
const scan = await agent(
  `${BASE}\nRun: python3 ${SKILL}/scripts/scan_ai_taste.py "${DRAFT}" --profile ${PROFILE}\nReturn the scanner output verbatim, then one line stating the draft language (zh or en), its genre, and who its reader is.`,
  { label: 'scan', effort: 'low' },
)

// ---------- Diagnose ----------
const LENSES = [
  { key: 'ai-taste', focus: 'AI habits at sentence and phrase level: thinking-pattern fingerprints, translationese, contrast scaffolds (不是…而是 / 不仅…更…), filler transitions, vocabulary, jargon, openings and closings. rules.md 1-7; writing-core sections 1-5.' },
  { key: 'structure', focus: 'Structure and density: colons and bold labels used as structure, symmetric lists and padded sections, bullets that should be prose, sentences that add no information, paragraph-ending slogans. rules.md 2, 5; writing-core structure, density and style sections.' },
  { key: 'reader', focus: 'The reader (rules.md 8-9). First name the reader and the decision they must make. Then flag sentences that do not speak to that reader\'s situation (describing charts, explaining theory, reporting effort) and details tied to decisions this reader does not make (schedules, internal task split, payment milestones for a decision maker). Fixes here are usually cuts: set content_change=true.' },
  { key: 'facts-terms', focus: 'Facts and terms: evaluative words standing in for evidence (显著, 可观, 质的飞跃), claims without numbers or source, causal jumps, overgeneralization, undefined or inconsistent terms. Do not ask for new data in the suggestion; propose wording that states only what the draft already supports, or mark [needs real source: ...].' },
]
phase('Diagnose')
const lensResults = await parallel(LENSES.map(l => () =>
  agent(
    `${BASE}\nRead the draft and the rule files. Your lens only: ${l.focus}\nScanner output and context:\n${scan}\nReport every real hit in your lens. Copy "before" verbatim from the draft. Skip anything that is normal for this genre.`,
    { label: `diagnose:${l.key}`, phase: 'Diagnose', schema: FINDINGS },
  ).then(r => (r ? r.findings.map(f => ({ ...f, lens: l.key })) : []))
))

// barrier is needed: lenses quote the same line with different spans, so group
// all findings by line and verify each line once
const byLine = new Map()
for (const f of lensResults.filter(Boolean).flat()) {
  if (!byLine.has(f.line)) byLine.set(f.line, [])
  byLine.get(f.line).push(f)
}
const groups = [...byLine.entries()].sort((a, b) => a[0] - b[0]).map(([line, fs]) => ({ line, fs }))
log(`${groups.reduce((n, g) => n + g.fs.length, 0)} findings on ${groups.length} lines`)

// ---------- Verify ----------
phase('Verify')
const judged = await pipeline(groups, g =>
  agent(
    `${BASE}\nReviewers flagged line ${g.line}. Read the draft around it, then judge each claim on its own and try to REFUTE it. Several claims may describe the same problem: keep the most precise one real and mark the duplicates real=false with reason "duplicate of #n".\n${g.fs.map((f, i) => `#${i}: "${f.before}" — ${f.issue} (${f.rule})`).join('\n')}\nRefute a claim if the text is normal for this genre, carries information the reader needs, is the author's deliberate voice, is not actually in the draft, or the cited rule does not apply.`,
    { label: `verify:L${g.line}`, phase: 'Verify', schema: VERDICTS },
  ).then(v => g.fs.map((f, i) => {
    const d = v && v.verdicts.find(x => x.index === i)
    return { ...f, verdict: d || { real: true, reason: 'not judged' } }
  })),
)
const all = judged.filter(Boolean).flat()
const confirmed = all.filter(f => f.verdict.real)
const dropped = all.filter(f => !f.verdict.real)
log(`${confirmed.length} confirmed, ${dropped.length} refuted`)

const list = fs => fs.map((f, i) =>
  `${i + 1}. [${f.severity}${f.content_change ? ', content' : ''}] L${f.line} "${f.before}" — ${f.issue} (${f.rule})${f.suggestion ? ` → ${f.suggestion}` : ''}`).join('\n')

// ---------- Review mode ----------
if (MODE === 'review') {
  phase('Rewrite')
  const report = await agent(
    `${BASE}\nWrite a review report in the draft's language to ${OUT}, following the report template in ${SKILL}/SKILL.md (AI 味检测 / 术语问题 / 逻辑问题 / 信息密度 / 读者问题 / 结构问题 / 风格问题 / 判定). Use only these verified findings, each with line number, quote and concrete rewrite:\n${list(confirmed)}\nThe report itself must follow the same rules. Do not modify the draft.`,
    { label: 'report', phase: 'Rewrite', schema: WRITTEN },
  )
  return { mode: MODE, out: report && report.out_path, confirmed: confirmed.length, refuted: dropped.length, findings: confirmed }
}

// ---------- Rewrite ----------
phase('Rewrite')
const cutPolicy = READER_CUTS
  ? 'The author approved content changes flagged [content] in advance; that approval is the asking rule 1 requires. Apply them (delete the schedule rows, owners, payment items and other details the reader does not act on) and list each in content_changes.'
  : 'Content changes flagged [content] are NOT approved: keep that content, restyle it only, and list each proposed cut in content_changes as a suggestion for the author.'
let written = await agent(
  `${BASE}\nRewrite the draft and write the result to ${OUT}. Leave the original file untouched.\nVerified findings:\n${list(confirmed)}\n\nHow to rewrite: work at paragraph and section level, not word swaps; tear down contrast scaffolds and rebuild as direct statements; keep every number, date, name, quote and URL exactly; keep the author's claims, scope, recommendations and voice. Where the draft only offers an evaluation word, state the fact it already gives or leave a visible [needs real source: ...]. ${cutPolicy}`,
  { label: 'rewrite', phase: 'Rewrite', schema: WRITTEN },
)

// ---------- Check + repair loop ----------
phase('Check')
let checks = []
for (let round = 0; round <= MAX_REPAIRS; round++) {
  checks = (await parallel([
    () => agent(
      `${BASE}\nCompare the original ${DRAFT} with the rewrite ${OUT}. Run: python3 ${SKILL}/scripts/verify_preservation.py "${DRAFT}" "${OUT}". The script flags every quoted span and number that disappeared; judge each flag yourself. These verified findings were meant to be removed or reworded, so slogans, filler, evaluation words and quoted catchphrases they cover going away is expected, not a problem:\n${list(confirmed)}\nReport fact_changed only when a real fact (number, date, name, quote of a person or source) is altered or lost, meaning_changed when a claim, recommendation or scope now says something different, invented when anything new was added beyond arithmetic on the draft's own numbers. ${READER_CUTS ? 'Content cuts listed above are approved.' : 'Content cuts not listed above are unapproved_cut.'} ok=true only if there are no problems.`,
      { label: `check:facts#${round}`, phase: 'Check', schema: CHECK },
    ),
    () => agent(
      `${BASE}\nRead the rewrite ${OUT} as a strict reviewer. Run: python3 ${SKILL}/scripts/scan_ai_taste.py "${OUT}" --profile ${PROFILE}. Report AI habits still present (ai_taste_left) or newly introduced by the rewrite (new_ai_taste), quoting the text. Ignore [needs real source] placeholders. ok=true only if nothing worth fixing remains.`,
      { label: `check:taste#${round}`, phase: 'Check', schema: CHECK },
    ),
  ])).filter(Boolean)
  const problems = checks.flatMap(c => c.problems)
  if (checks.length === 2 && checks.every(c => c.ok)) break
  if (round === MAX_REPAIRS) { log(`stopping after ${MAX_REPAIRS} repairs; ${problems.length} problem(s) remain`); break }
  log(`repair round ${round + 1}: ${problems.length} problem(s)`)
  written = await agent(
    `${BASE}\nThe rewrite at ${OUT} failed checks. Fix these problems by editing ${OUT} in place (the original ${DRAFT} stays the reference for facts):\n${problems.map(p => `- [${p.kind}] ${p.detail}`).join('\n')}\nDo not bring back any text the verified findings removed. Keep the earlier change lists, updated.\nVerified findings for reference:\n${list(confirmed)}`,
    { label: `repair#${round + 1}`, phase: 'Check', schema: WRITTEN },
  )
}

return {
  mode: MODE,
  out: OUT,
  confirmed: confirmed.length,
  refuted: dropped.length,
  style_changes: written ? written.style_changes : [],
  content_changes: written ? written.content_changes : [],
  evidence_gaps: written ? written.evidence_gaps : [],
  remaining_problems: checks.flatMap(c => c.problems),
}
