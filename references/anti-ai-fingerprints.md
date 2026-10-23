# Anti-AI Writing Fingerprints

English-oriented companion to `writing-core.md`: the same anti-AI rules condensed into a quick review guide.

## Core Standard

Human-feeling prose is specific, asymmetric, and accountable. It does not explain its own structure, does not pad a point after it is clear, and does not use fake neutrality when the author has evidence for a position.

## Thinking Patterns

- **Fake balance**: automatic "on one hand / on the other hand" framing when the piece has a real conclusion.
- **Forced progression**: "not only X, but more importantly Y" or "not just X, but Y" used to simulate depth.
- **Conclusion before evidence**: announcing the answer first, then backfilling reasons.
- **Generic transitions**: "in this context", "based on this", "it is worth noting", "next we discuss".
- **Restatement loops**: "in other words", "that is to say", and summary paragraphs that repeat what the reader already understood.
- **Paragraph-end slogans**: final sentence adds a clever flourish but no new information.
- **Over-expansion**: one clear point keeps unfolding into implications the reader can infer.

Fix by rebuilding the paragraph around sequence, evidence, and consequence.

## Translationese

- Physical verbs for abstract work: "catch the idea", "sharpen the reconstruction", "break context", "punch through cognition".
- Evaluative labels before showing the thing: "a sharper rewrite:", "a cleaner verification:".
- Abstract noun subject plus vague adjective: "the engineering reality is uglier".
- Unnecessary English when natural Chinese exists: prefer `上下文`, `状态`, `缓存`, `断言` over `context/state/cache/claim` unless the English term is the field standard.

- Syntax-level translationese with no lexical tell: relative-clause word order ("一个……的人" for "one who…"), hard-translated noun pairs (outsider/insider → "外面的人/里面的人" with nothing for the position words to refer to), object-less verbs ("推了九个月" for "pushing it"), participle fragments as closers ("当场吵" for "arguing on the spot"), and strict parallelism carried over from English rhetoric.

Detect with the back-translation test: translate the Chinese sentence back into English word by word. Human Chinese loses something or has to be restructured; AI Chinese reconstructs into fluent English with nothing left over.

Fix by asking: how would a native speaker say this if they were not translating an English skeleton?

## Sentence Fingerprints

Flag and rewrite:

- "let's look at", "next, let's explore"
- "接上" or similar glue that merely resumes the previous point
- "the problem is..."
- "here is a real case/example" before telling the case
- "you might think X; actually Y"
- unnecessary comma or colon used only to impose structure
- bossy `要` in explanatory prose when a direct verb phrase works
- Any `而是` contrast scaffold, especially `不是 X，而是 Y`, `不只是 X，而是 Y`, or `不是...而是...`. Delete the structure cleanly and rebuild the sentence as direct observation, sequence, or evidence.
- "from X to Y, from A to B"
- "X is not rare; Y is what matters"
- "three people. two days. one conclusion."
- "fundamentally", "ultimately", "needless to say", "undeniably"
- repeated "not X, but Y" structures
- performative interjections such as "come on", "oh my god", or their Chinese equivalents

Fix by stating the observation directly. For `而是`, do not simply swap synonyms; remove the contrast frame itself.

Example:

- AI-styled: `这个阶段要验证散热仿真流程里每个关键环节的自动化状态：哪些环节可自动化，哪些环节不可自动化，哪些环节需要工程师参与判断。`
- Cleaner: `这个阶段看清散热仿真流程各关键环节的自动化状态，区分哪些可以交给系统，哪些还不能自动化，哪些需要工程师判断。`

## Vocabulary Fingerprints

Replace vague claims with content:

- "critical", "important", "significant": explain why.
- "as everyone knows", "obviously", "surprisingly": remove or source.
- "in fact" at paragraph start: usually remove.
- "in summary", "to conclude": use a concrete final claim instead.
- Corporate and internet jargon: empower, enable, align, unlock, deep collaboration, landing, closed loop, leverage, robust, seamless.

## Structure Fingerprints

- Bullets where natural paragraphs should carry the reasoning.
- Symmetric three-part or five-part structures without real difference in weight.
- Sections of nearly identical length.
- Opening summarizes the whole piece and ending repeats it.
- Every paragraph begins with bold mini-heading labels.
- Ending with a rhetorical question, exclamation, or slogan.

Fix by letting information weight determine shape.

## Evidence And Authenticity

- Do not fabricate data, examples, quotes, sources, company names, personal anecdotes, or "friend said" setups.
- If evidence is missing, write a visible placeholder such as `[needs real example: customer quote]`.
- Use numbers, named entities, concrete scenes, and source links where factual claims need support.
- Present the strongest fair version of the opposing view before disagreeing.

## Practical Rewrite Checklist

For each paragraph:

1. What new information does this paragraph add?
2. Which sentence would disappear without changing meaning?
3. Is the conclusion earned by evidence or just asserted?
4. Is this a natural sentence, or an English skeleton wearing Chinese words? Run the back-translation test: if it maps word for word into fluent English, it is the skeleton.
5. Is the paragraph's length proportional to its importance?
6. Are there unsupported claims that need a source or placeholder?
