# remove-ai-taste

审阅或改写中英文文字，去掉 AI 腔。数字、日期、专名、引文、URL 原样保留，作者的观点和声音不动。

它以 Claude Code skill 的形式运行，由一个 skill、一个扫描器、一个本地审阅界面和两个校验脚本组成。一篇长文从诊断到落盘走下面这条流程：

1. **扫描**。`scripts/scan_ai_taste.py` 按文体档位初筛，跳过代码块、链接、引文，同类问题成簇出现才报。
2. **诊断**。Claude 按 `references/writing-core.md` 的判定标准复核扫描结果，补上扫描器抓不到的逻辑和结构问题，每条给出原文和改写。
3. **成批**。`scripts/write_batch.mjs` 把诊断结果写成一个审阅批次。
4. **作者裁决**。`bash app/start.sh` 在 127.0.0.1 开一个界面，作者逐条批准、改写、打回重写或保留原文。打回的条目回到 Claude 重写后再审。
5. **应用**。`scripts/apply_decisions.mjs` 按原文文本匹配，把批准的改动写回草稿。草稿在裁决期间被改过的条目会报出来，不强行覆盖。
6. **核对**。`scripts/verify_preservation.py` 对比改前改后，确认数字、专名、引文没有被改动。

条目少，或者没有显示器，就跳过第 3 到第 5 步，Claude 直接在对话里给审阅报告或改好的全文。

## 安装

```bash
git clone https://github.com/Agents-Zone/remove-ai-taste.git ~/.claude/skills/remove-ai-taste
```

需要 Python 3 和 Node，都只用标准库，不用装依赖。

## 用法

在 Claude Code 里：

```
/remove-ai-taste draft.md          # 审阅，只出报告，不改原文
帮我把 draft.md 去一下 AI 味         # 改写，就地修改
/remove-ai-taste 123               # 审阅 PR #123 里的 .md 改动
```

单独用脚本：

```bash
python3 scripts/scan_ai_taste.py draft.md --profile article     # article / professional / marketing / translation / short-message
python3 scripts/verify_preservation.py original.md revised.md
python3 -m unittest discover -s tests -q
```

## 规则

`references/rules.md` 是七条总则，`references/writing-core.md` 逐条展开，英文稿另看 `references/anti-ai-fingerprints.md`。文体口径（哪类话要来源、结尾能不能带口号）留给各项目自己的 `AGENTS.md` 或风格指南，skill 会去读。评审意见这一文体的口径在 `references/genre-review.md`。

界面和交接文件的设计见 `APP-IN-SKILL-DESIGN.md`。
