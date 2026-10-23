---
name: remove-ai-taste
description: Review or rewrite any text to detect and remove AI-flavoured patterns — articles, reports, slide copy, courseware, contracts, emails, review/recommendation opinions. Use to review writing quality, OR to humanize / de-AI / 改写 / 润色 / 去 AI 味 a draft while preserving facts and voice. Triggers on review writing, check AI flavor, make prose less AI-like, remove AI taste, de-AI a draft, humanize writing, polish or rewrite Chinese or English drafts of any genre.
tools: Read, Write, Edit, Glob, Grep, Bash, Agent
model: inherit
---

# Remove AI Taste: Prose Quality & Anti-AI Check

审阅或改写任何文字，去除 AI 味、术语不严谨、逻辑缺口和风格问题。文章、报告、PPT 文案、课件、合同、邮件、评审意见都用这一个 skill，文体差异由附录处理。

三层规则的关系：`references/rules.md` 是七条总则，只管 AI 腔，建议抄进你的 `CLAUDE.md` / `AGENTS.md` 让每次会话常驻；本 skill 的 `references/writing-core.md` 是它的展开，任何文体通用；哪类话要来源、哪类话可以直说、结尾能不能带口号，是文体口径，放在产出该文体的工作区里，Step 0 按文体路由过去。

## Modes

This skill has two modes. Default to **review** unless the user asks to rewrite/humanize/de-AI/改写/润色 the text itself.

- **review**（默认）— 只诊断，不改原文。列出问题、引用原文、给改写建议，输出审阅报告。流程见 Step 1–2 和 Output。
- **rewrite** — 直接改写文稿去除 AI 味，保留事实与作者声音。流程见 "Rewrite Mode" 一节。

判断模式：用户说"审一下/检查/review/有没有 AI 味" → review；说"改写/润色/去 AI 味/humanize/帮我改" → rewrite。不确定就问。

## Companion UI (App-in-Skill, optional)

审一篇长文会产出几十条 finding。聊天里只能往下滚；条目多、或要把"挑哪些改写"交给作者本人时，可以开一个本地审阅界面。设计与契约见 `APP-IN-SKILL-DESIGN.md`。

**边界（不可违反）**：唯一会改作者草稿的是 `scripts/apply_decisions.mjs`（skill 持锁执行）。界面只读写 `app/.data/` 交接文件，永不碰草稿。聊天仍是默认通道，界面只在值得时才开。

流程（仅 file 目标的 edit-to-canonical）：

```bash
# 1. 诊断后，把 findings 以 JSON 写成一个审阅批次（findings 字段见设计文档）
echo '<findings-json>' | node scripts/write_batch.mjs <draft-path> [zh|en]

# 2. 开界面（幂等，端口 3000-4000，只在 127.0.0.1）
bash app/start.sh        # 打印 URL，让作者在界面里 批准/改写/要求重写/保留原文

# 3. 作者决定后，应用已批准/已改写的编辑到草稿（按 before 文本匹配，不按行号）
node scripts/apply_decisions.mjs   # 写 execution_report.json；stale 项报告而非强改
```

`request_changes` 的备注会作为 agent task 回到 `needs_review`——重写那一条再回审，是循环不是拒绝。没有显示器或用户要纯文字时，跳过界面，沿用下面的审阅报告作为回退。

## Step 0: Load Writing Rules

1. Read `references/writing-core.md`（AI 腔通用核心，任何文体都查）。
2. 判断目标文体，读它的口径规则。口径规则住在产出该文体的项目里，不在本 skill 里：
   - 评审意见、推荐理由、评委点评 → `references/genre-review.md`。
   - 市场材料、客户材料、公众号文章、日报周报等 → 读当前项目的 `AGENTS.md` / `CLAUDE.md` / 风格指南里对应的章节（哪类话要来源、哪类话可以直说、结尾能不能带口号）。项目没写，就只按 writing-core.md 审，不自己发明口径。
3. 英文稿另读 `references/anti-ai-fingerprints.md`。

## Triage Scan (optional, both modes)

对本地文本文件，先跑一遍扫描器做初筛，再用判断力复核——它只抓明显的短语和结构症状，不替代人工判断：

```bash
python3 ~/.claude/skills/remove-ai-taste/scripts/scan_ai_taste.py path/to/draft.md --profile professional
```

`--profile` 五档：`article`（文章、公开发表）、`professional`（正式文档、客户材料、评审意见）、`marketing`（海报、推文、campaign 文案、deck 愿景页，只查短语级）、`translation`（译稿）、`short-message`（聊天、短消息）。档位决定结构和格式检查的松紧，见 writing-core.md「编辑档位」。加 `--format json` 输出结构化结果，供 `write_batch.mjs` 用。

扫描器会跳过代码块、行内代码、链接、引文这些受保护片段，只在同类问题成簇出现时才报，不因单个词命中就告警。findings 分 must / should 两级。命中仍只是线索，最终以 writing-core.md 的判定标准为准。

改完本地文件后核对受保护片段（数字、日期、专名、引文、URL）是否原样保留：

```bash
python3 ~/.claude/skills/remove-ai-taste/scripts/verify_preservation.py original.md revised.md
```

改扫描器规则后跑测试：`python3 -m unittest discover -s ~/.claude/skills/remove-ai-taste/tests -q`。

## References (load when needed)

- `references/rules.md` — 七条总则，writing-core.md 是它的展开。
- `references/writing-core.md` — 通用核心，Step 0 必读。
- `references/genre-review.md` — 评审意见文体附录。其他文体的口径规则见 Step 0 的路由表，不在本目录。
- `references/voice-calibration.md` — 用户提供或明确批准声音样本时才读；学表达习惯，不搬事实与个人细节。
- `references/anti-ai-fingerprints.md` — 英文为主的 AI 指纹速查（fake balance、translationese、sentence/structure fingerprints）。审阅或改写**英文**稿件，或做深度 review / 大改时加载；writing-core.md 偏中文，这份补英文部分。

## Usage

```bash
/remove-ai-taste 123                                    # PR by number
/remove-ai-taste https://github.com/org/repo/pull/123  # PR by URL
/remove-ai-taste zh/chapters/02-specification.md        # Specific file
/remove-ai-taste                                        # Staged changes
```

---

## Step 1: Get the Content

**PR number or URL:**
```bash
gh pr diff "$PR_NUMBER" --repo "$OWNER/$REPO"
```

**Specific file:**
```bash
# Read the file directly
```

**Staged changes:**
```bash
git diff --cached
```

Only review `.md` files. Ignore config, code, and other non-prose files.

---

## Step 2: Review Against Writing Guide

Apply every section of `references/writing-core.md` and the matching genre rules from Step 0 to the content:

1. **AI 味检测（BLOCKING）** — Sections 1-5 of the guide: thinking patterns, translationese (1b), forced-casual register in professional documents (1c), sentence patterns, vocabulary, structure, openings/closings
2. **术语严谨性（BLOCKING）** — Section 8: undefined terms, consistency, circular definitions
3. **事实与口径** — 按 Step 0 读到的文体口径核对：具名客户、具名人物的数字和引语有没有来源；该文体允许直说的判断、口号、行动召唤不当问题报
4. **信息密度** — Section 10: every sentence must add information
5. **结构与流** — Check: is the takeaway clear? Does each section start from a problem the reader can relate to? Do sections build on each other or just sit side by side?
6. **语言风格** — Section 12: natural paragraphs, punctuation, spacing, zero emoji

### Judgment thresholds (from Section 7 of the guide)

- Thinking pattern fingerprint hit → rewrite that paragraph's argument logic
- Forced-casual fingerprint hit in a professional document (1c: clipped predicates, colloquial verbs, own/owner → 有主人, punchy fragments) → rewrite as a complete formal statement, not a shorter one
- Translationese fingerprint hit (physical verbs, adjective pre-judgment, abstract-noun subjects, untranslated English, or syntax-level: relative-clause order, hard-translated noun pairs, object-less verbs, participle-fragment closers; confirm with the back-translation test) → rewrite by restating in natural Chinese, not patching the original sentence
- 2+ sentence/vocabulary fingerprints in same paragraph → rewrite the paragraph
- Any structure fingerprint hit → restructure
- AI pattern density > 3 per 500 characters → flag entire article

---

## Output: 审阅报告

```markdown
## 写作审阅：[文件名或 PR 标题]

### AI 味检测

[列出所有标记。每条：行号、原文引用、问题类型、改写建议]

### 术语问题

[未定义术语、术语不一致、定义循环]

### 逻辑问题

[无源断言、因果倒置、因果跳跃、过度泛化]

### 信息密度

[多余的句子、低密度段落、不成立的比喻]

### 结构问题

[Takeaway、问题驱动、因果递进等]

### 风格问题

[bullet point 滥用、标点等]

### 判定

🔴 需要修改 / 🟡 建议优化 / 🟢 可以合并
```

### 严重程度

| 级别 | 含义 | 合并影响 |
|------|------|---------|
| ❌ | 必须修改 | 阻止合并 |
| ⚠️ | 建议修改 | 不阻止但应处理 |
| 💡 | 可以更好 | 非阻塞建议 |

**阻止合并的条件：**
- AI 味密度超标
- 核心术语未定义
- 具名事实（数字、引语、客户名）无来源或未确认可公开

---

## PR 审阅流程

当作为 PR 审阅调用时：

1. 获取 PR diff，筛选 `.md` 文件的变更
2. 按 Step 2 逐条审阅
3. 生成审阅报告
4. 用 `gh pr comment` 将报告发送到 PR

```bash
gh pr comment "$PR_NUMBER" --repo "$OWNER/$REPO" --body "$REPORT"
```

---

## 审阅评论自身的语言要求

审阅评论本身必须遵循同样的规则：

- 不能出现 writing-core.md 列出的任何 AI 味模式
- 直接说问题，不铺垫
- 引用原文时给出行号
- 改写建议要具体，给出改后的文字

---

## Rewrite Mode

当用户要的是改写而不是审阅时，按以下流程把 AI 味改掉，同时保住事实和声音。

### 确定目标文本

用户指定的文件、粘贴的草稿，或当前目录的 `draft.md`（用户没指定时）。

### 默认只改文风，不改内容

1. 默认把任务当成文风/品味清理：不改事实、论点、例子、范围、建议、信息架构。只动句式、节奏、过渡、AI 指纹。
2. 如果去 AI 味必须改动内容或增删材料，先征得同意再改；不要默默改。
3. 保留作者真实的声音、读者对象、平台调性。去 AI 味是去机器习气，不是把文字改平庸。
4. 缺证据时留可见占位符 `[needs real source: ...]` / `[needs real example: ...]`，绝不编造数据、引述、人物、公司、个人轶事或"朋友说"式开头。
5. **`§` 是作者写给 LLM 的元指令，不是正文。** 以 `§` 开头的行是指示该处该写什么的元文本（meta-instruction）。review 模式下不要把它当 AI 味问题来标记；rewrite 模式下不要翻译、润色或原样照搬它——它本来就不是给读者看的文字。除非用户明确要求按该指令补写正文，否则原样保留 `§` 行不动。

### 改写流程

1. 跑一遍 Triage Scan（见上）。
2. 按 writing-core.md 的判定标准（判定标准一节）诊断：思维模式指纹 → 重写该段论证逻辑；翻译腔 → 用自然中文重述而非打补丁；同段 2+ 句式/词汇指纹 → 重写整段；结构指纹 → 重构。
3. **在段落/章节层面改写，不要机械替换词语**，原始材料保持完整。
4. `而是` / `不是 X，而是 Y` 这类对比脚手架要整个拆掉重建为直接陈述、序列或证据，不是换同义词。

### 输出

改完后给出：修改过的文本 + 一段紧凑的改动说明（列出处理掉的主要 AI 味类别和遗留的证据缺口）。编辑文件时就地改写，避免生成并行版本，除非用户要对比方案。

---

## Safety Rules

**NEVER:**
- 把改写建议写得比原文更有 AI 味
- 对文章内容的观点做价值判断（只审写法，不审立场）
- 编造假案例作为改写示范

**ALWAYS:**
- 对每个标记给出具体改写建议
- 区分"必须改"和"可以更好"
- 审阅评论用中文撰写（匹配项目语言）
