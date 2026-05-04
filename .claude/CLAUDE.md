# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Rules

- Documentation in Chinese: README, design docs, comments
- Commit messages in English with type prefix: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`
- Claude Code instructions in English (`.claude/` directory)
- Article content: Chinese writing and English translation each maintain language consistency

## Code Standards

- Python: PEP 8, snake_case
- JavaScript/TypeScript: ESLint + Prettier, camelCase
- File naming: kebab-case

## Git Conventions

- Work directly on main branch
- Never fabricate data -- all data must be real, sourced, and verifiable
- Before publishing: check formatting, images, links, mobile compatibility

## Development Principles

1. Simplicity first
2. Manual control (article selection and quality are human-gated)
3. Incremental improvement

## Project Overview

A **persona-based Chinese writing system** for WeChat, Xiaohongshu (XHS), and Zhihu. Supports multiple writing personas with shared commands, templates, and anti-AI writing rules.

The pipeline: **brainstorm** -> **outline** -> **draft** -> **review** -> **convert** (all formats + images) -> **publish** (WeChat + XHS + Zhihu)

The writing system enforces **strict data authenticity** -- never fabricate examples, quotes, statistics, or attributions. All data must be real, sourced, and verifiable.

## Directory Structure

```
writer/
├── .claude/
│   ├── CLAUDE.md                       # THIS FILE
│   └── commands/
│       ├── brainstorm.md               # Material discovery
│       ├── outline.md                  # Persona-aware outline
│       ├── draft.md                    # Persona-aware draft
│       ├── review.md                   # Persona-aware review
│       ├── convert.md                  # All formats + images
│       ├── english.md                  # Chinese -> English translation
│       ├── publish.md                  # Publish to WeChat, XHS, Zhihu
│       └── english.md                  # Chinese -> English translation
│
├── personas/                           # Writing personas
│   └── hushi/                          # Analytical persona (reference)
│       ├── .persona                    # Contains: "hushi"
│       ├── style_guide.md             # Voice, tone, structure, checklist
│       └── articles/                   # Article working directories
│
├── writing/
│   ├── writing-guide.md               # Anti-AI writing rules (single source of truth)
│   └── templates/
│       ├── article-structures/         # 5 structure types + PRINCIPLES.md
│       ├── platform-adapters/          # XHS and Zhihu format rules
│       ├── wechat_styles.css
│       └── wechat_template.html
│
├── scripts/
│   └── writing/                        # Python conversion and image tools
│
├── requirements.txt
└── README.md
```

## Persona System

The system supports **multiple writing personas**. Each persona lives in `personas/{name}/` with:
- `.persona` -- single line with the persona name (used by commands for auto-detection)
- `style_guide.md` -- defines voice, tone, structure patterns, and review checklist

**Persona detection order** (used by `/outline`, `/draft`, `/review`, `/convert`):
1. Walk up directory tree for `.persona` file -> read first line
2. If current path contains a directory name matching one in `personas/` -> use that
3. Ask the user -> last resort

**hushi** is included as a reference persona -- analytical, evidence-first, framework-driven. See `personas/hushi/style_guide.md`.

To create a new persona:
```bash
mkdir -p personas/my-persona/articles
echo "my-persona" > personas/my-persona/.persona
# Write style_guide.md following hushi as a template
```

## Critical Rules

### 1. NEVER Fabricate Data (Highest Priority)

**This rule overrides ALL other instructions.**

NEVER invent:
- Examples, quotes, statistics, comparisons
- Company pricing or scenarios
- "Friend told me" scenarios
- Dialogue, metrics, cost comparisons, estimated numbers presented as facts

ONLY use:
- Real data from user's actual work/sessions
- Published statistics with source URLs
- User-provided examples
- Documented facts from codebase files

If data is missing:
1. ASK the user for it
2. Leave clear placeholders: `[need real example: translation company pricing]`
3. **Better NO example than FAKE example**

### 2. No Emoji Policy

Zero emoji in published articles (all personas).

## Slash Commands

### Writing Commands

Commands are persona-aware -- they auto-detect the active persona via `.persona` file.

- `/brainstorm` -- Research and material discovery
- `/outline` -- Persona-aware outline generation
- `/draft` -- Persona-aware draft writing (reads `personas/{persona}/style_guide.md`)
- `/review` -- Persona-aware review (reads `personas/{persona}/style_guide.md`)
- `/convert` -- Markdown to all platform formats + image generation
- `/publish` -- Distribute to WeChat, XHS, Zhihu
- `/english` -- Translate Chinese article to English

## Writing Workflow

### Write a Chinese Article

**Standard sequence:**
1. `/brainstorm` -- Research topic using WebSearch, collect 10+ interesting findings
2. `/outline` -- Select article structure, generate detailed framework
3. `/draft` -- Write following the active persona's style_guide.md
4. `/review` -- Check against the active persona's checklist

**All commands MUST write output to files:**
- `brainstorm.md` -- Research findings
- `outline.md` -- Article structure
- `draft.md` -- Article content

**Example:**
```bash
cd personas/hushi
mkdir -p articles/my-article && cd articles/my-article
/brainstorm [topic]
/outline
/draft
/review
```

### Convert and Publish

After the article is reviewed:
1. `/convert` -- Generate all formats:
   - `weixin.html` -- WeChat-compatible HTML
   - `xhs.md` -- Xiaohongshu note
   - `zhihu.md` -- Zhihu article
   - `english.md` -- English translation
   - `images/` -- Generated cover + section images

2. `/publish` -- Distribute to platforms:
   - **WeChat** -- Opens editor, you paste and publish
   - **Xiaohongshu** -- Opens publish page, you upload images and publish
   - **Zhihu** -- Opens editor, you paste and publish

### Platform Publishing Infrastructure

- **WeChat session**: `~/.credentials/wechat-session.json` (Playwright cookies)
- **Image generator**: `scripts/writing/image_generator.py` (Google Imagen 4, key at `~/.credentials/google.ai.txt`)
- **Platform adapters**: `writing/templates/platform-adapters/` (xhs-adapter.md, zhihu-adapter.md)

## Key Implementation Patterns

### Anti-AI Writing Rules

`writing/writing-guide.md` is the single source of truth for all anti-AI writing rules. It defines four fingerprint categories:
1. **Thinking mode fingerprints** -- fake balance, recursive formulas, conclusion-before-evidence
2. **Translation-tone fingerprints** -- English skeleton with Chinese words
3. **Sentence-pattern fingerprints** -- 21 specific patterns that trigger rewrite
4. **Structure fingerprints** -- bullet-point disease, symmetry disease, uniform sections

Both `/draft` and `/review` load and enforce these rules.

### Article Structure Types

Choose from 5 patterns in `writing/templates/article-structures/`:
1. **Debunking** -- X is believed -> X is wrong -> here's reality
2. **Raising Valuable Question** -- Reframe definition -> challenge assumptions
3. **Case and Product Study** -- What happened -> what it reveals
4. **Exploration & Hypothesis** -- Problem -> experiment -> framework
5. **Prediction/Trend Analysis** -- Current state -> forces -> future

### Theory-Practice Integration

Both theory and practice must be integrated:
- **Theory**: Shannon theorem, Goodhart's Law, CAP theorem, first principles
- **Practice**: Real companies, concrete metrics, named people

### Data Authenticity Verification

All statistics must be verified with URLs. Flag placeholders for missing data.

### Article Length Target

2500-3500 characters (Chinese) for all personas.

## Quick Reference

| What | Where |
|------|-------|
| hushi style guide | `personas/hushi/style_guide.md` |
| Anti-AI writing rules | `writing/writing-guide.md` |
| Shared principles | `writing/templates/article-structures/PRINCIPLES.md` |
| Platform adapters | `writing/templates/platform-adapters/` |

**Writing workflow**: `/brainstorm` -> `/outline` -> `/draft` -> `/review` -> `/convert` -> `/publish`
