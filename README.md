# Writer

用 Claude Code 驱动的 AI 写作助手框架。定义一次写作人格，全流程（构思、大纲、初稿、审阅、转换、发布）自动执行。

目前支持微信公众号、小红书、知乎三个平台的格式转换和发布。

## 这个项目给谁用

给想搭建自己 AI 写作助手的写作者。系统提供：

- **人格架构** -- 定义一次写作声音，brainstorm/outline/draft/review 全链路执行
- **反 AI 写作规则** -- 12 类 AI 指纹（句式、结构、翻译腔、思维模式），每条带具体改写示例
- **平台流水线** -- 一篇文章进去，四种格式出来（微信 HTML、小红书、知乎、英文）
- **数据真实性** -- 系统拒绝编造案例、引用、统计数据，缺数据就留占位符

可以直接用，也可以 fork 之后只取你需要的部分。

## 快速开始

```bash
pip install -r requirements.txt
cd personas/hushi
mkdir -p articles/my-article && cd articles/my-article

/brainstorm [topic]    # 搜索素材
/outline               # 生成大纲
/draft                 # 写初稿
/review                # 对照风格指南审阅
/convert               # 微信 HTML + 小红书 + 知乎 + 英文 + 配图
/publish               # 发布到各平台
```

每个命令会沿目录树向上查找 `.persona` 文件，自动加载对应人格的 `style_guide.md`。

## 目录结构

```
writer/
├── .claude/commands/          # 7 个斜杠命令（写作流水线）
├── personas/                  # 每个写作人格一个目录
│   └── hushi/                 # 内置参考人格
│       ├── .persona           # "hushi" -- 人格标识
│       ├── style_guide.md     # 声音定义 + 审阅清单
│       └── articles/          # 文章工作目录
├── writing/
│   ├── writing-guide.md       # 反 AI 写作规则（所有人格共享）
│   └── templates/
│       ├── article-structures/ # 5 种文章结构 + 通用原则
│       ├── platform-adapters/  # 小红书、知乎格式规则
│       ├── wechat_styles.css   # 微信排版样式
│       └── wechat_template.html
├── scripts/writing/           # Python 转换和配图工具
└── requirements.txt
```

## 扩展框架

### 添加新人格

一个人格就是一个目录加两个文件：

```bash
mkdir -p personas/zhangsan/articles
echo "zhangsan" > personas/zhangsan/.persona
```

然后写 `personas/zhangsan/style_guide.md`。这个文件才是核心 -- 所有命令都读它来决定输出风格。用 `personas/hushi/style_guide.md` 做模板起步。

**风格指南必须定义的内容：**

| 板块 | 控制什么 | hushi 中的例子 |
|------|---------|---------------|
| **Tone & Voice** | `/draft` 怎么写 | "分析型，有分寸，不干巴。不用讽刺。" |
| **Structure Patterns** | `/outline` 怎么搭框架 | 标题规则、开头钩子、正文节奏、结尾风格 |
| **Language Patterns** | 用什么句式、避什么句式 | 用："数据显示..." 避："所谓专家们" |
| **Content Elements** | `/draft` 必须包含什么 | "每篇至少引用一个理论框架" |
| **Checklist** | `/review` 打分依据 | 证据、分析、语气、结构，逐项勾选 |

命令不硬编码任何人格逻辑。它们读 `.persona` 指向的目录，加载那个人格的 `style_guide.md`，然后适配。写好风格指南的那一刻，新人格就能用了。

**写好风格指南的要点：**

- **声音要具体，不要抽象。** "对话感但严肃"太泛。"像一个经验丰富的工程师在你面前思考问题 -- 频繁用'我'，敢说'这一点我还不确定'"才给 AI 足够的抓手。
- **给出句式示例。** 该用的和该避的都要写。AI 从句式示例校准语气的效果，远好于抽象描述。
- **定义开头风格。** 这是人格差异最明显的地方。分析型用悖论开头，挑衅型用冲突开头，叙事型用场景开头。
- **写审阅清单。** `/review` 拿它当评分标准。每项要二元判定（过/不过），具体到可以客观评估。
- **示例比规则有用。** 好标题 vs 坏标题，好开头 vs 坏开头。AI 从示例学到的比从规则学到的多。

### 添加新文章结构

文章结构在 `writing/templates/article-structures/`，每个是一个 markdown 文件，描述一种可复用的论证模式。

内置 5 种：
1. **驳斥** -- 大家相信 X，X 其实是错的，现实是这样
2. **提出问题** -- 重新定义概念，挑战既有假设
3. **案例与产品研究** -- 发生了什么，揭示了什么
4. **探索与假说** -- 问题、实验、框架
5. **趋势预测** -- 现状、驱动力、未来走向

要加新结构，在子目录里创建 `.md` 文件即可。`/outline` 生成大纲时会把所有可用结构展示给用户选择。

`PRINCIPLES.md` 中的通用原则适用于所有结构和所有人格，定义的是"不管什么声音、什么格式，一篇好文章必须做到什么"。

### 添加新平台

平台适配器在 `writing/templates/platform-adapters/`，每个定义格式限制、长度上限、语气调整和标签策略。

添加新平台：
1. 创建 `writing/templates/platform-adapters/your-platform-adapter.md`
2. 在 `.claude/commands/convert.md` 里加一个转换步骤
3. 在 `.claude/commands/publish.md` 里加一个发布步骤

### 定制反 AI 规则

`writing/writing-guide.md` 定义了 AI 生成中文的指纹，分四个层次：

1. **思维模式** -- 假平衡、递进公式、先结论后原因、过度展开
2. **翻译腔** -- 英文骨架套中文词（用物理动词描述抽象思维）
3. **句式** -- 21 个具体句式，出现即改写
4. **结构** -- 列表病、对称病、均匀病

每条规则都带 "Don't / Do" 的具体示例，展示问题和修复方式。`/draft`（写作时）和 `/review`（审阅时）都会加载这些规则。

定制建议：结构层面的规则保留（它们抓的是真正的 AI 痕迹），但把 "Do" 示例替换成你自己发表过的文章片段。示例才是校准 AI 输出的关键 -- 通用规则只能产出通用文章。

## 凭证配置

| 用途 | 位置 | 使用者 |
|------|------|--------|
| Google Imagen 4 API key | `~/.credentials/google.ai.txt` | `/convert`（配图生成） |
| 微信公众号 session | `~/.credentials/wechat-session.json` | `/publish`（微信发布） |

配图生成和微信发布是可选的。核心写作流程（brainstorm 到 review）不需要任何凭证。

## 核心规则

- **绝不编造数据** -- 所有案例、引用、统计必须真实有来源。缺数据就留占位符，不造假。
- **零 emoji** -- 所有人格的发布文章都不用 emoji
- **文章长度**：2500-3500 字（中文）
