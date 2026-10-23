# remove-ai-taste as an App-in-Skill

A design sketch for pairing the `remove-ai-taste` skill with a local companion UI,
following the App-in-Skill (AiS) specification
(`research/app-in-skill-specification-...pdf`). This is a **design document**, not a
built app — it defines the file handoff schema, the boundary, and the review loop so
the app and scripts can be generated against a fixed contract.

## Why this skill fits AiS

`remove-ai-taste` already produces exactly the data shape AiS wants: a **审阅报告** is a
list of findings, each carrying a line number, an original quote, a problem type, a
severity, and a concrete rewrite suggestion. In chat that list is a scroll. As an
App-in-Skill it becomes a **review queue**: the agent prepares findings, the human
accepts / edits / rejects each one in a visual list, and the skill applies the approved
rewrites back to the draft.

Three pains the paper names, in this skill specifically:

- **Chat fatigue** — a long article can produce 30+ findings. Triaging them by scrolling
  a transcript is the wrong surface; a filterable list with severity badges is the right one.
- **Delegation barrier** — an editor wants to hand "here are the flagged paragraphs,
  decide which rewrites to take" to the author. A chat transcript can't be handed over;
  a file-backed queue can.
- **Trust gap** — the rewrite is a real mutation of the author's draft. Nobody wants the
  agent to silently overwrite prose. The author must see each before→after and approve it.

### Which kind of work (§5.7)

This is **edit-to-canonical**, not approve-an-action. The canonical artifact is the
user's `.md` draft. Each finding is a proposed edit carrying `before` → `after` fields;
"merge" means **apply the approved rewrite to the draft file**. This is the pattern where
the review model's full machinery pays off — versioned edits, before→after diffs, and the
`request_changes` revision loop (ask the agent to redo a rewrite that isn't right yet).

## The boundary (the one invariant)

> Every external effect is initiated by the skill, never by the app.

For this skill the **single external effect is writing to the user's draft `.md` file**.
That belongs to the skill alone — it is the "approve and apply" step. The app only ever
reads and writes the local `.data/` handoff files and serves the local UI. The app never
touches the draft.

```
Author ──chat──> remove-ai-taste skill ──writes──> draft.md   (the ONLY external effect)
   │                      │
   │ opens                │ writes findings / reads decisions
   ▼                      ▼
 Local app  <──read/write──>  .data/ handoff files   (local only, no draft access)
```

Consequence: even a buggy app cannot corrupt the author's draft. The app proposes; the
skill, holding the lock and re-reading decisions from disk, is the only thing that edits
prose.

## The file handoff (Spec 2)

Lives in `app/.data/` (named `.data`, not `.cache` — these are genuine workflow state,
not regenerable cache). Written atomically (temp file + rename). State and input live in
separate files so the skill never overwrites the author's decisions.

### `current_batch.json` — skill → app (state)

One review run = one batch. The skill writes this after Step 2 of the existing SKILL.md.

```jsonc
{
  "batch_id": "remove-ai-taste-YYYYMMDD-HHMMSS",
  "generated_at": "ISO 8601",
  "target": {
    "kind": "file" | "pr" | "staged",
    "path": "zh/chapters/02-specification.md",   // canonical artifact for edit-to-canonical
    "lang": "zh" | "en"
  },
  "guide_version": "writing-core.md @ <git-sha-or-mtime>",
  "summary": { "needs_review": 12, "to_approve": 0, "approved": 0, "done": 0, "blocked": 0 },
  "findings": [
    {
      "id": "f001",                       // stable across re-reads; used by chat refs ("approve #3")
      "stage": "needs_review",            // needs_review | to_approve | approved | done | blocked
      "line": 42,
      "category": "ai_taste",             // ai_taste | terminology | logic | density | structure | style
      "severity": "blocking",             // blocking (❌) | should_fix (⚠️) | polish (💡)
      "fingerprint": "不是 X，而是 Y 对比脚手架",
      "before": "改变的不是工具，而是工作流本身。",
      "after":  "工具没变，变的是工作流。",     // the proposed canonical edit
      "rationale": "拆掉 而是 对比框架，重建为直接陈述",
      "guide_ref": "writing-core.md §7"
    }
  ]
}
```

`severity` maps to the existing thresholds; `before`/`after` are the edit-to-canonical
payload. `blocking` findings correspond to the SKILL.md merge-blockers (AI 味密度超标,
核心术语未定义, 关键断言无支撑).

### `decisions.json` — app → skill (input)

The app writes this as the author works. The skill never writes it; it re-reads it from
disk before applying anything.

```jsonc
{
  "batch_id": "remove-ai-taste-YYYYMMDD-HHMMSS",
  "decisions": [
    {
      "id": "f001",
      "verdict": "approve",               // approve | request_changes | revise | block
      "decided_at": "ISO 8601",
      "edited_after": null,               // for verdict:"revise" — author's own rewrite, saved as a new version
      "comment": "@ai 这段保留原句节奏，换个不那么书面的词"  // request_changes / @ai note → agent task
    }
  ]
}
```

Verb semantics (from the paper's review model):

- **approve** — take the agent's `after`. The skill will write it into the draft.
- **revise** — the author edits the rewrite themselves; `edited_after` becomes the
  canonical text. Saved as a new version, the skill applies it verbatim.
- **request_changes** — the agent's rewrite isn't right; the `comment` rides the handoff
  as an agent task. The finding returns to `needs_review` after the agent redoes it.
  **A loop, not a rejection** — this is what makes review iterative.
- **block** — leave the original prose; do not rewrite. (The finding stays visible as a
  recorded judgment, not a silent drop.)

### `execution_report.json` — skill → app (state, after apply)

After the skill applies approved/revised edits to the draft:

```jsonc
{
  "batch_id": "...",
  "applied_at": "ISO 8601",
  "results": [
    { "id": "f001", "outcome": "applied", "draft_line_after": 42 },
    { "id": "f002", "outcome": "stale", "reason": "line no longer matches; re-review" },
    { "id": "f003", "outcome": "blocked" }
  ]
}
```

`stale` matters for prose: the author may have edited the draft between batches, so the
skill applies edits by matching `before` text (not raw line number) and reports any that
no longer match instead of corrupting the file.

### `agent.lock` — held while the skill generates or applies

Single lock file with `{ owner, message, started_at }`. While it exists, the app shows
read-only state and disables the approve/apply controls; the skill refuses a second
concurrent run. Released in a `finally` step. The author can still scroll and read.

### `onboarding.json` — the default initial phase (Spec 6)

First run latches here. For this skill onboarding is light — it confirms which
`writing-core.md` is the source of truth, the default language, and the severity
threshold that blocks a merge. `{ "completed": true }` latches the transition into normal
operation; a changed guide path drops back to onboarding.

## The review loop (HACL, §6)

1. **Agent prepares** — runs the existing Step 0–2 (load `writing-core.md`, triage scan,
   diagnose against the guide), writes findings to `current_batch.json`. Lock held during write.
2. **App displays** — renders findings as a stage-oriented queue, filterable by category
   and severity, each showing the before→after diff inline. Reads `decisions.json` to
   restore prior decisions (resume after a break).
3. **Author steers** — approve / revise (edit the rewrite) / request_changes (`@ai` note)
   / block. Saved to `decisions.json` immediately, so closing the browser loses nothing.
4. **Skill applies** — acquires lock, **re-reads `decisions.json` from disk**, applies
   approved + revised edits to the draft by `before`-text match, writes
   `execution_report.json`, releases lock.
5. **App confirms** — shows applied / stale / blocked per finding; author follows up in
   chat on stale items and starts the next batch.

The `request_changes` verb is the iterative core: the author asks for a different rewrite
in the app, the request rides the handoff as an agent task, the agent redoes that one
finding, and it returns to `needs_review` — without re-typing a prompt in chat.

## Stage flow for the queue (§5.2, recommended not required)

```
needs_review ──(agent proposes)──> to_approve ──approve/revise──> approved ──(skill applies)──> done
     ^                                  │
     └────── request_changes ───────────┘            block ──> blocked
```

The author navigates by stage ("what still needs my attention?"), not by scrolling all
findings. Category (ai_taste / terminology / …) and severity become badges within a
stage, not top-level navigation.

## Chat-only fallback (Spec 7)

The UI is an assist, not a requirement. With no display, or when the user asks for
chat-only, the skill presents findings directly in the conversation and accepts approvals
by id ("approve f001, f003; revise f002 to …"), reading and writing the same `.data/`
files as the backing store. The current SKILL.md **审阅报告** output is exactly this
fallback — it stays the default; the app is launched only when the work benefits from it.

## Reusing what the skill already has

| Existing piece | Role in the AiS app |
|---|---|
| `scripts/scan_ai_taste.py` | Triage pass feeding the agent before it writes the batch |
| SKILL.md Step 2 judgment thresholds | Source of each finding's `severity` |
| 审阅报告 output format | The chat-only fallback (Spec 7), kept verbatim |
| Rewrite-mode before→after | The `before`/`after` edit-to-canonical payload |
| `§` meta-instruction rule | Findings on `§` lines are suppressed at generation time (never queued) |

## Data provider (Spec 4) and where this could go

Default provider is **local files** — single author, private, offline, zero dependency.
The same app graduates to a cloud provider by config change, not rewrite, when an editor
and author in different places need a shared queue (an author and an editor on two machines
is exactly the two-operator case the paper's collaboration type describes). For a
prose-review workflow Notion (doc-centric) or a Postgres/Busabase Inbox would be the
natural shared backend; the UI and the handoff schema above do not change.

## Smallest next step

Per the paper's "smallest possible App-in-Skill": a single-file local server that reads
`current_batch.json` and renders the findings list with approve / revise / block / request
controls, plus one script (`apply_decisions.mjs`) that re-reads `decisions.json` and
applies approved edits to the draft by before-text match. Everything else (filters,
diffs, stage navigation) is elaboration the spec permits but does not require. The
`app-in-skill-creator` scaffold the paper mentions would wire the handoff, server, lock,
and onboarding as correct-by-construction defaults, leaving only this schema and the apply
script to specialize.
