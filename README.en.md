# remove-ai-taste

[中文](README.md)

Review or rewrite Chinese and English prose to strip out AI writing habits. Numbers, dates, names, quotes and URLs come through untouched, and so do the author's arguments and voice.

It runs as a Claude Code or Codex skill: one skill file, a scanner, a local review UI and two checking scripts. A long draft goes from diagnosis to saved file like this:

1. **Scan.** `scripts/scan_ai_taste.py` does a first pass tuned to the genre. It skips code blocks, links and quotes, and only reports a pattern when it clusters.
2. **Diagnose.** The agent checks each hit against `references/writing-core.md`, adds the logic and structure problems a scanner can't see, and writes the original line next to a proposed rewrite.
3. **Batch.** `scripts/write_batch.mjs` packs the findings into one review batch.
4. **Author decides.** `bash app/start.sh` opens a page on 127.0.0.1. For each finding the author approves, edits the rewrite, sends it back for another try, or keeps the original. Items sent back return to the agent and come round again.
5. **Apply.** `scripts/apply_decisions.mjs` writes approved edits into the draft by matching the original text, not line numbers. If the author changed a passage while deciding, that item is reported as stale instead of being overwritten.
6. **Verify.** `scripts/verify_preservation.py` diffs before and after and fails if a number, name or quote changed.

For a handful of findings, or on a machine without a screen, skip steps 3–5: the agent puts the review or the rewritten text straight into the conversation.

![Review UI: each finding shows the original, a suggested rewrite and the reason; the author approves, edits, sends back or keeps the original](docs/review-ui.png)

## Install

Claude Code:

```bash
git clone https://github.com/Agents-Zone/remove-ai-taste.git ~/.claude/skills/remove-ai-taste
```

Codex (same directory; `agents/openai.yaml` supplies the display name and default prompt):

```bash
git clone https://github.com/Agents-Zone/remove-ai-taste.git ~/.codex/skills/remove-ai-taste
```

If you use both, clone once and symlink the other path.

Needs Python 3 and Node. Both use only the standard library, so there is nothing to install.

## Usage

In Claude Code:

```
/remove-ai-taste draft.md                 # review: report only, draft untouched
remove the AI taste from draft.md         # rewrite in place
/remove-ai-taste 123                      # review the .md changes in PR #123
```

Scripts on their own:

```bash
python3 scripts/scan_ai_taste.py draft.md --profile article     # article / professional / marketing / translation / short-message
python3 scripts/verify_preservation.py original.md revised.md
python3 -m unittest discover -s tests -q
```

## Rules

`references/rules.md` has nine rules, written in Chinese. Copy them into your `CLAUDE.md` or `AGENTS.md` so every session carries them.

Rules 1–7 cover AI habits: edit style only unless asked; no structure made of colons and bold labels; no "not X but Y" framing; cut filler transitions; let information weight set the structure; prefer nouns, actions and numbers over praise words; make people or things the subject. `references/writing-core.md` expands each one with tests and before/after examples. For English drafts the agent also reads `references/anti-ai-fingerprints.md`.

Rules 8–9 are about the reader. Before writing, decide who reads it and what they have to decide. Leave out details for decisions that reader doesn't make. In a review these two get their own section.

Genre conventions, such as which claims need a source or whether a closing slogan is fine, belong in each project's own `AGENTS.md` or style guide, and the skill reads them from there. Conventions for review comments and recommendations are in `references/genre-review.md`.

The design of the UI and the handoff files is in `APP-IN-SKILL-DESIGN.md`.

## License

MIT
