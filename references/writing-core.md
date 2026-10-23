# 去 AI 味 · 通用核心

适用于任何文体，市场材料、客户提案、纪要、报告、PPT、课件、合同、评审意见都按这份查 AI 腔。每次会话常驻的七条总则在 `~/.claude/CLAUDE.md` 写作规范，本文件是它的展开。哪类话要来源、哪类话可以直说、结尾能不能带口号，本文件不管，由 SKILL.md Step 0 按文体路由到各工作区的口径规则。

AI 生成的中文在词汇、句式、思维方式、结构四个层面都有稳定的指纹。最深层的问题是 AI 组织思考的方式，用词只是表面。

---

## 1. 思维模式指纹 — 最难察觉，最需警惕

**假平衡。** AI 默认给出"一方面...另一方面..."的两面论述，即使作者有明确立场。真人写作敢下判断，不在每个观点后面加 hedge。如果你有观点，直接说，不要假装客观。

> Don't: "一方面，AI确实提高了效率；另一方面，我们也要看到它带来的风险。"
>
> Do: "恕我直言，AI一定会取代人类成为SDLC的主力，人会被边缘化。"
>
> Do: "我的观察是：这个建议的方向没错，但结论过于乐观。"

**递进公式。** "不仅...更..." / "不仅仅是...而是..." / "X，但更重要的是 Y"。AI 把每个论点都包装成递进关系，制造深度的假象。真正的深度来自具体分析，不是句式。

> Don't: "这不仅是技术问题，更是组织问题。"
>
> Do: "很不幸的，在过去若干年来，我们发现基础架构部在两点上得分越来越低。"
>
> Do: "壁垒是真的，但壁垒围住的可能是一片盐碱地。"

**万能过渡。** "值得注意的是"、"在这个背景下"、"在此基础上"。这些词删掉后上下文意思完整，说明它们不携带信息，只是 AI 用来连接段落的胶水。

> Don't: "值得注意的是，广联达的净利率仅有4%。"
>
> Do: "2024年广联达营收62.03亿元，同比下降4.93%；净利润2.50亿元，净利率4.03%。"（直接给数据）

**元描述过渡。** "本文将从三个方面讨论"、"接下来我们分别来看"、"下面结合案例分析"。这类句子描述的是文章的结构而非内容，删掉后上下文完整衔接。直接写内容，不要解说自己在写什么。

> Don't: "下面我们结合一个实际案例来分析这个问题。一位嘉宾在香港做了一个项目..."
>
> Do: "我们论坛第20期，一位嘉宾分享了他在香港做的一个项目：给连锁生鲜门店做了一个AI店长助理。"（直接进入案例）

**假设读者跟不上。** AI 总在重复已经说过的话，用"换句话说"再说一遍，用"总而言之"把全文重复一遍。信任读者的理解力。说一遍就够了。

> Don't: "AI在这里面就是个翻译官。换句话说，它把人话翻译成机器话。也就是说，AI只负责理解自然语言并转化为API调用。"
>
> Do: "AI在这里面的角色就是个翻译官——把人话翻译成机器话。数据存储、业务逻辑、权限控制，全部是传统软件在干。AI只管听懂人话。"（说一遍，往前走）

**段末升华病。** 道理已经说完了，AI 还要在段尾加一句比喻或金句来"点睛"。如果删掉最后一句不丢失信息，那就该删。信任读者自己能得出结论。

> Don't: "AI领域确实有些东西十年二十年不会变。但你作为初学者，分辨不出哪些会变哪些不会。如果你分辨得出来，你就不是初学者了。拿着有限的时间去赌一个你看不懂的赛道，这不是勤奋，是赌博。"（最后一句是多余的升华）
>
> Do: "AI领域确实有些东西十年二十年不会变。但你作为初学者，分辨不出哪些会变哪些不会。如果你分辨得出来，你就不是初学者了。"（道理说完，停。）

**过度展开。** 一个观点说清楚后，AI 会继续罗列它的含义、推论、启示。读者能推导的东西不需要你替他说。说一遍，往前走。

> Don't: "你脑子里装了多少知识，不再决定你的上限。决定上限的是两个能力：AI说的对不对，你能不能判断；一个模糊的目标，你能不能拆成AI能执行的步骤。这两个能力，坐在教室里学不出来。"
>
> Do: "你脑子里装了多少知识，不再决定你的上限。"（点到即止）

---

## 1b. 翻译腔指纹 — 英文骨架套中文词

AI 中文最深层的问题之一是翻译腔：用英文的思维结构和物理动词，套上中文词汇。不是"AI味"那么简单，而是整个句子的骨架是英文的。

**用物理动作描述思考过程。** AI 把英文物理动词直译进中文，用身体动作描述抽象思维。

> Don't: "我都接住"（catch）、"更锋利的重构"（sharp）、"context不崩"（break）、"成本不爆"（blow up）、"击穿认知"、"拆解问题"
>
> Do: "我都收到了"、"更准确的讲法"、"上下文能恢复"、"成本可控"

**形容词后接冒号，抢先下判断。** 在展示内容之前用形容词告诉读者该怎么评价，抢走读者自主判断的机会。

> Don't: "一个更锋利的重构："、"验证得比我预期的更干净："
>
> Do: 删掉形容词，直接展示内容。让读者自己判断是否"锋利"或"干净"。

**抽象名词做主语 + 形容词作结论。** X 的 Y 比 Z 更 W——主语虚浮，结论模糊，读者不知道具体发生了什么。

> Don't: "工程上的现实比这些数字难看"
>
> Do: "真往下看各家怎么接，早就对不齐了"（具体主语 + 具体动作）

**有中文译法的英文词不翻译。** context、state、cache、claim 这些词有现成中文——上下文、状态、缓存、断言。保留英文是因为 AI 训练语料中英夹杂。例外：prompt、embedding 等中文圈尚无统一译法的词可保留。

> Don't: "context不崩、state可恢复、cache命中率高"
>
> Do: "上下文不丢、状态可恢复、缓存命中率高"

**句法级翻译腔：词全是中文，骨架是英文。** 上面四条都能从词面上认出来。还有一类一个词汇指纹都不命中，问题全在句子结构上。样本：「一个从外面进过现场的人，一个在里面推了九个月的人，当场吵」，倒推回去就是 one who has been on the ground from the outside, one who has been pushing it from the inside for nine months, arguing on the spot。

- 关系从句体。「一个……的人，一个……的人」是 one who… 的语序，长定语堆在名词前面。中文把身份放前面当称呼：「外面来的」「里面干了大半年的」。
- 硬译的成对名词。outsider / insider、newcomer / veteran 这类英文现成的名词对，中文没有对应词，译出来就成了「外面的人」「里面的人」，方位词没有指代对象。看到没有着落的「外面」「里面」「前端」「后端」，先怀疑是哪对英文词。
- 省略宾语的动词。「推了九个月」的推来自 pushing it，英文动词可以不带宾语，中文读者会问推什么。
- 分词短语收尾。「当场吵」是 arguing on the spot，英文用分词收尾很自然，中文句子少了主语和完整谓语，读起来是标题体的碎片。人会说「俩人当面吵起来」。
- 严格对仗。one who…, one who… 在英文是 parallelism，译成中文就是骈文腔。它和第 5 节的「对称病」是同一个东西的两种归类，看到一个就去找另一个。

> Don't: "一个从外面进过现场的人，一个在里面推了九个月的人，当场吵"
>
> Do: "一个是去客户现场看过的，一个是在公司里推了大半年的，两个人当面吵"

**检查方法一，回译测试。** 试着把这句中文逐词翻回英文。人写的中文翻回去会丢东西，或者要重组句子才成句；AI 写的能一个词对一个词还原成通顺的英文，一处不剩。能无损回译的句子就是英文骨架。

**检查方法二，重述。** 读完原文后，用中文里本来会怎么说这件事，重新说一遍。不是在原句上修补，而是抛开原文重述。

---

## 1c. 假轻松腔 — 正式文档里装口语

AI 在正式文档里有一个和翻译腔相反的毛病：为了显得"像人写的"，把本该完整、准确的句子改成口语短句和俏皮话。句子变短了，谓语省了，名词换成了代词和方位词，读起来像在聊天，放在给总经理看的评估报告里就是轻浮。这一条只在 professional 档位查，文章和市场文案另有口径。

识别特征：

- 省略谓语或宾语的判断句。「是齐的」「是顺的」「她是瞎的」「功能点有，代码没有」。
- 用「路子」「弄对」「装上它」「再做一遍」这类口语动词代替正式动词。
- 把英文 own / owner 直译成「有主人」「各有主人」，方位词和代词没有着落。
- 为了节奏把一句话劈成两三个短句，每句缺主语。
- 标题用感叹式或俏皮式收尾，信息量低于一句平铺直叙。

改法是把每句话补成有主语、有完整谓语、名词准确的陈述，用正式词替换口语词，不加修饰。

> Don't: "学习主链本身是齐的，这些原样留下"
>
> Do: "学习主链本身完整，以下部分原样保留"

> Don't: "灰色的 37 个，公司里都已经有别的系统在做。装上它，等于把这些再做一遍。"
>
> Do: "灰色的 37 项与企业现有的 HR、OA、会议和文件系统功能重叠。部署这套系统后，这些数据和流程会在企业内存在两份。"

> Don't: "这三样公司里各有主人，这里再建一份，从第一天起就不一致。"
>
> Do: "这三样本来分别归行政、资产和采购管，这里再建一份，从第一天起就对不上。"

> Don't: "正确的路子是削减功能，增加集成" / "先把人弄对" / "这一步是顺的"
>
> Do: "正确的方向是削减功能，增加集成" / "首先核对人员" / "这一步没有障碍"

> Don't: "走招标的，功能点有，代码没有。"
>
> Do: "走招标的客户，功能点在应答中以集成方案覆盖，不需要自行开发。"

判断方法：把这句话念给一位不熟的总经理听，他会不会觉得你在跟他套近乎。会，就改成正式陈述。

---

## 2. 句式指纹 — 出现即改写

- "让我们来看看" / "接下来我们来探讨" — 模拟口语的假亲切
- "X 不稀奇，Y 才值得写" — 假精练的平行结构
- "三个人。两天。一个结论。" — 堆砌短句制造节奏感
- "从 X 到 Y，从 A 到 B" — 排比铺陈，装气势
- "本质上" / "归根结底" / "说到底" — 装深刻的万能词
- "毋庸置疑" / "不可否认" — 跳过论证的权威词
- "问题出在哪？" / "问题是什么？" — AI 设问过渡，假装带读者思考
- "说个真实的案例。" / "举个真实的例子。" — AI 预告式过渡，真人直接讲案例不会先通知读者
- "不是X，是Y" / "改变的不是X，是Y" — 否定-修正结构。一篇文章里最多出现一次，相邻段落出现两次就是指纹
- "你以为X？其实Y" — 设问式过渡，假装跟读者互动。直接陈述事实
- "同样的道理" — 比喻说完后用这个短语重复解释，说明不信任比喻本身的表达力。比喻说完往前走
- "拜托"、"天哪"、"我的天" — 表演式语气词。真有态度的人直接说事，不需要语气词帮忙
- 说明性文字里用"要"发号施令 — "这个阶段要看清……"改成"这个阶段看清……"，直接用动词
- 英文同类：not only / but also、on the one hand / on the other hand、let's look at、in conclusion、it's worth noting
- "X，一个Y：A，B，C。" — 冒号堆叠列举。一句话里出现两个冒号，或用冒号引出逗号分隔的列举，是 AI 的信息打包方式。改成自然句子，用"已举办 X 期……积累了 Y 篇"这类流动句式代替"X：A，B，C"

> Don't: "问题出在哪？问题出在这些公司根本没有核心竞争力。说个真实的案例。某建筑公司..."
>
> Do: "这技术含量还不如农贸市场卖豆腐的。买豆腐的要讲清楚水豆腐，油豆腐和攸县香干的区别；要提供客家酿豆腐菜谱；还要发明西汉淮南王制豆腐的故事。"（直接攻击，直接举例，不预告）
>
> Do: "三家公司有两个共同点：第一，没有一家的核心业务是施工日志；第二，没有一家是AI公司。"（直接陈述发现）

---

## 3. 词汇指纹 — 用具体内容替代

- "至关重要" → 说重要在哪里，给理由
- "众所周知" → 删掉，或给来源
- "显而易见" → 如果真显而易见就不用说
- "令人惊讶的是" → 直接陈述事实
- "事实上" 做段落开头 → 删掉
- "综上所述" / "总而言之" → 用具体结论代替
- "赋能" / "使能" / "加持" — 营销词
- "落地"(非物理) / "打通" / "拉通" / "对齐" / "抓手" — 互联网黑话
- "深度"做形容词 / "一文读懂" / "万字长文" / "硬核" — 自媒体标题党
- 英文商业套话 — seamless / robust / leverage / unlock / empower / align / enable / closed loop。中英文都要警惕，写英文时尤甚，命中即换成具体动作或结果
- 不必要的英文技术词 — context / state / cache / claim 等有自然中文对应时用中文（上下文 / 状态 / 缓存 / 断言），除非该英文是行业标准术语

> Don't: "AI对于企业数字化转型至关重要，它能有效赋能业务团队，打通数据链路，实现深度协同。"
>
> Do: "大模型用DeepSeek或者千问，一个月API费用百来块。加上云主机，总共不到300块。传统进销存系统一年几万到几十万，员工不用，就是摆设。"
>
> Do: "2024年广联达营收62.03亿元，同比下降4.93%；净利润2.50亿元，净利率4.03%。同样是赚建筑行业的钱，海螺水泥净利率约8.5%，三一重工约7.6%。"

---

## 4. 结构指纹 — 命中即重写

- **列表病**: 大量 bullet point 代替自然段落。真人用段落讲道理，不是列清单
- **对称病**: 并列三项或五项，每项结构完全对称。真人论述有轻重缓急
- **均匀病**: 每一节长度几乎一样。真人写作有详有略
- **呼应病**: 开头总结全文 + 结尾重复总结
- **mini 标题病**: 每段开头都用加粗词做 mini 标题
- **点睛病**: 段落末尾带感叹号或反问句做"升华"

> Don't (列表病):
> - **数据问题**：库存数据靠猜
> - **人员问题**：店长不会用Excel
> - **成本问题**：传统系统太贵
>
> Do: "生鲜门店不太先进，除了一个收银系统，啥都没有。没有库存管理，没有损耗追踪，没有进货计划。一头猪进去，出来的是排骨、五花肉、肉丝，计量单位对不上，收银数据根本还原不了库存。"（自然段落，有节奏轻重）

> Don't (对称病):
> - 建文云：做工程管理，不是施工日志AI
> - 墨斗科技：做劳务实名制，不是施工日志AI
> - 华建通：做政府平台，不是施工日志AI
>
> Do: 建文云花两句话写背景和业务，墨斗科技一句话带过融资和核心产品，华建通重点写国资背景——三家详略不同，最后一句收："三家公司有两个共同点：第一，没有一家的核心业务是施工日志；第二，没有一家是AI公司。"

---

## 6. 核心原则

**具体胜过抽象。** 不说"这很重要"，说重要在哪里。不说"很多公司"，说哪些公司。不说"显著提升"，说提升了多少。

> Don't: "很多建筑科技公司最终都失败了。"
>
> Do: "全球范围内，53%的建筑科技创业公司会失败，73.4%撑不过十年。"
>
> Do: "我从事软件开发20年，从来没见过一个软件开发项目是因为Demo写不出来而失败的。"

**信任读者。** 不重复，不铺垫，不解释读者能自己推导的东西。说一遍，说清楚，往前走。

> Don't: "无需多言，这几个假设都不成立。让我们来逐一分析为什么它们不成立。首先..."
>
> Do: "无需多言，这几个假设都不成立。"（信任读者，停。）

---

## 7. 判定标准

- 思维模式指纹（第1节）命中任意一项 → 重写该段的论证逻辑
- 翻译腔指纹（第1b节，含句法级）命中 → 抛开原句用自然中文重述，不在原句上打补丁；回译测试通过即算命中
- 同一段落出现 2+ 个句式/词汇指纹 → 重写该段落
- 结构指纹任意一项命中 → 重组该段结构
- 全文 AI 模式密度超过每 500 字 3 处 → 全文需要改写

---

## 8. 术语严谨性

- 专业术语首次出现必须有定义或上下文能让读者理解
- 同一概念全文用同一个术语，不能一会儿叫"规约"一会儿叫"规范"
- 不能用 A 定义 B 又用 B 定义 A

> Do: "工程师要参与整个软件开发生命周期，西人所云Software Development Life Cycle者。用大白话说就是投资人管杀不管埋，工程师管杀也管埋，有时候还要擦屁股。"（术语+白话解释）
>
> Do: "经济学中的锁定效应（lock-in effect）研究早就指出：高转换成本市场的典型特征是增长极慢、客户获取成本极高。"（首次出现用中英双语+定义）

---

## 10. 信息密度

每句话都应该给读者新信息。测试方法：删掉这句话，上下文的意思是否完整？如果完整，这句话多余。

常见低密度写法：
- 重复前一句话的意思，换个说法再说一遍
- 用一整段来说一句话就能表达的内容
- 过渡句只起连接作用，本身不携带信息

> Don't: "把它归为做施工日志AI的小公司是不准确的。这种归类忽略了公司的主营业务。简单来说，这家公司的核心能力并不在施工日志上。"（三句话说同一件事）
>
> Do: "把它归为'做施工日志AI的小公司'，相当于因为微信有朋友圈就说腾讯是社交媒体公司。"（一个比喻，一句话，信息量更大）

---

逐段自问四句：哪一句删掉不丢意思？哪个细节能让主张可核？作者观察到的事是什么，而不是他对这件事的评论？真人在这个场合会不会这样说？

---

## 12. 语言风格

- 自然段落为主，不滥用 bullet points
- 用数据和逻辑说话，不靠形容词
- 中英文之间加空格
- 技术术语首次出现用中英双语，之后用中文
- 中文语境用中文标点（，。；：""），英文术语和代码内用英文标点
- 零 emoji

---

## 编辑档位（Editing Profiles）

Choose a profile before reviewing. Follow the user's named genre or platform when it differs from these defaults.

- **Article/public prose**: check all pattern families and allow paragraph-level restructuring.
- **Professional document**: preserve terminology, required headings, procedural language, and functional lists. Rewrite conservatively.
- **Translation**: preserve claims, examples, order, emphasis, and uncertainty. Fix target-language syntax without silently editing the source argument.
- **Short message**: remove only obvious assistant residue, canned transitions, and unnecessary formality. Do not impose article rhythm on chat.
- **Marketing**: 海报、推文、直播稿、campaign 文案、deck 愿景页。只查短语级 AI 腔和黑话，不查结构与格式。结论先行、口号、行动召唤、以公司名义直说的判断都是这个文体的正常写法，不当问题报。事实口径按项目自己的市场材料规则。

扫描器用 `--profile` 对应这五档：`article` / `professional` / `translation` / `short-message` / `marketing`。

---

## 受保护片段（Protected Spans）

Before rewriting, mark text that must remain exact:

- Names and official organization, product, company, and publication names
- Numbers, dates, percentages, amounts, measurements, versions, and identifiers
- URLs, citations, footnotes, case numbers, clause numbers, and source titles
- Direct quotations, attributed statements, code, commands, API fields, and filenames
- Legally or technically fixed wording
- Any additional string the user identifies as immutable

Do not rewrite inside a protected span. If a protected span itself appears awkward, flag it for review. After editing a local file, compare the original and revised versions and verify that every protected span remains unchanged.

改完本地文件后用 `scripts/verify_preservation.py` 核对受保护片段是否原样保留。

---

## 问题分类（Finding Taxonomy）

Assign one primary category to each finding. Add a secondary cause only when it changes the fix.

- **Posture**: self-congratulation, reader flattery, fake neutrality, or commentary about the writing itself.
- **Template**: stock transitions, staged contrasts, canned openings, and conclusions that organize prose in place of reasoning.
- **Semantic dilution**: vague frequency, inflated importance, stacked modifiers, restatement, and claims without accountable objects or consequences.
- **Rhythm**: repeated sentence openings, parallel question series, serial short paragraphs, uniform section shape, and forced symmetry.
- **Jargon**: corporate language, fashionable metaphors, abstract terminology used to create importance, and generic constraint language that avoids naming the actual relationship.
- **Process leak**: assistant chatter, research disclaimers, drafting notes, and collaboration residue left in reader-facing prose.
- **Format**: bold-label lists, decorative blockquotes, excessive headings, and formatting used instead of sentences.

---

## 空泛的边界语（Generic Constraint Language）

- In professional and customer-facing prose, treat `边界` / `boundary` as a review lead, not default language. Retain it only for a concrete, enforceable limit that cannot be described more directly.
- Name the relationship instead: `问题边界` → `问题重点` or `问题定义`; `业务／服务边界` → `业务／服务范围`; `责任边界` → `责任分工`; `权限／授权边界` → `权限范围` or `审批要求`; `人工决策边界` → `人工决策事项`; `质量边界` → `质量控制` or `验收标准`; a boundary between levels → `区别`.
- Do not apply mechanical substitution. Choose the replacement from the sentence's actual claim, and preserve fixed legal or technical wording.

---

## 声音校准（Voice Pass）

- If the user supplied approved samples, extract only stable voice traits.
- Check sentence-length distribution, vocabulary level, paragraph openings, punctuation, transitions, claim density, and tone.
- Do not copy distinctive phrases, titles, metaphors, personal facts, or private details from a sample.
- Do not claim that the result was written by the sampled author.
- Treat occasional sample quirks as exceptions, not style rules.

---

## 交付闸门（Delivery Gate）

Do not use a subjective numeric score. Pass the revised text only when each applicable check succeeds:

- Facts, claims, examples, scope, recommendations, and information architecture remain unchanged unless the user authorized material edits.
- Protected spans remain exact.
- No new anecdote, source, number, scene, or attribution was introduced.
- Lexical and structural review passes are both complete for article and professional-document profiles.
- Changes rebuild weak sentences or paragraphs; they are not synonym-only replacements.
- The result still matches the author's voice, audience, platform, and editing profile.
- Remaining evidence gaps are visible and clearly separated from style findings.
