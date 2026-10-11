---
name: skill-creator
description: 创建新技能、修改和优化已有技能、检验技能好不好用。用户说「做个技能」「创建技能」「帮我写个技能」「把这个流程沉淀成技能」「优化这个技能」「改一下这个技能」「这个技能不太行」时使用；也用于打磨技能描述，让它更容易被正确触发。
---

# Skill Creator（Daisy 版）

目标：帮用户从零做一个技能，或把已有技能迭代到好用。核心循环只有四步——**起草 → 真跑一遍 → 用户看结果给反馈 → 改进重来**。这个循环比任何"完美初稿"都重要，别写完就走。

本技能改写自 Anthropic 官方 skill-creator，已按 Daisy 的实际能力裁剪。原版留档在 `SKILL.upstream.md`，需要时再参考。

## Daisy 环境里能做什么、不能做什么

能：读写文件、跑 PowerShell / Python 3.12、截图、点界面、打开文件给用户看。
不能：开子代理并行跑测试、用内置浏览器看评测页面、自动批量跑 description 优化循环。

所以官方流程里的这几件事直接跳过，别硬凑：

- **不并行 spawn 测试用例，不跑 baseline 对照**，也不统计 pass_rate / token。测试用例由你自己在 Daisy 里**顺序真做一遍**：读技能正文，按它的指示把任务实际执行完，把产物存盘。
- **不做量化 benchmark**，改为定性反馈：产物给用户看，用户说好不好、哪里别扭。
- **description 自动优化（run_loop.py）**。
- 环境是 **Windows + PowerShell**，路径用反斜杠，别写 `open` / `nohup` / `/tmp`。

技能目录固定为：
`C:\Users\Mr Li\AppData\Roaming\Daisy\extensions\skills\<skill-name>\SKILL.md`

## 流程

### 1. 先问清意图

讨论里的对话本身就是素材——用户常说"就照刚才那样"。从历史里先捞出：用了哪些工具、步骤顺序、用户纠正过什么、输入输出长什么样。然后补齐这四点：

1. 这个技能要让 Daisy 能做什么？
2. 什么时候该触发？（用户可能说的原话）
3. 输出成什么样？
4. 要不要准备测试用例？产物可客观验证（文件转换、数据提取、固定流程）就值得准备；输出偏主观（文风、审美）就用眼看，别硬套断言。

含糊就先追问，别猜着写。有个现成技能可参考时，读一下同类已装技能的写法。

### 2. 起草 SKILL.md

结构：

```
skill-name/
├── SKILL.md          必需：frontmatter(name, description) + 正文
├── scripts/          可复用脚本，让模型直接跑，不用每次重写
├── references/       按需读取的长文档
└── assets/           模板、图标、字体等产物素材
```

正文写作要点：

- **description 是唯一的触发开关**，要写清楚"做什么 + 什么场景用 + 用户会怎么说"。模型倾向于少触发技能，所以描述可以稍微"主动"一点，把口语说法、同义说法都写进去。
- 用祈使句，**解释"为什么"而不是堆大写 MUST/ALWAYS**。今天的模型很聪明，讲清道理它比死记规则做得更好。出现全大写硬规则就是黄灯，回头改成说明原因。
- 正文控制在 500 行内；超了就把细节拆到 `references/`，并在正文写清"什么时候去读哪个文件"。长参考文件（>300 行）加目录。
- 技能按领域分多个变体时，用 `references/aws.md`、`references/gcp.md` 这种按需读的写法，不要全塞正文。
- 输出格式要求可以直接给模板；有代表性的例子比抽象描述管用。
- 不许写恶意或有安全隐患的内容。技能行为不该让用户意外。

### 3. 备几个真实测试用例

想 2-3 个**用户真会这么说**的句子（不是"格式化数据"这种空话，要有文件路径、上下文、具体诉求）。写给用户看一眼："我想试这几个，够吗？"再动手。

存到技能目录的 `evals/evals.json`：

```json
{
  "skill_name": "example-skill",
  "evals": [
    { "id": 1, "prompt": "用户会说的话", "expected_output": "期望结果", "files": [] }
  ]
}
```

### 4. 顺序实测

产物放在技能目录同级的 `<skill-name>-workspace\iteration-1\` 下，每个用例一个 `eval-0\`、`eval-1\` 目录。目录按需创建，不要一次性铺满。

每个用例：读一遍技能正文 → 照它做 → 产物存盘 → 记下哪里卡、哪里要翻别的文件、哪里你不得不"猜"。

### 5. 把结果交给用户

产物要能直接看：文档/图片/视频用对应应用打开，或把文件夹在资源管理器里打开给用户指路。产物是文档类就顺手转成易读格式。如果确实需要一个汇总页面，可以用：

```powershell
python "C:\Users\Mr Li\AppData\Roaming\Daisy\extensions\skills\skill-creator\eval-viewer\generate_review.py" <workspace>\iteration-1 --skill-name <name> --static <workspace>\iteration-1\review.html
```

然后用浏览器打开那个 HTML 文件。别自己手写一套页面。

### 6. 按反馈改进

- **从反馈里归纳通用规律**，不要只针对这几个例子打补丁。技能要能应对成千上万次不同问法，过拟合等于没用。
- **保持精简**：不干活的部分删掉。看的是执行过程，不只是最终产物——如果技能让模型白忙半天，就是该删的信号。
- **找重复劳动**：如果每个用例里你都写了差不多的辅助脚本，那就是该把脚本放进 `scripts/` 的信号，写一次，以后大家都用。
- 遇到改不动的老问题，换个比喻、换个做法，往往比加一句硬规定有效。

### 7. 循环

改完重跑全部用例，放进 `iteration-2\`，再给用户看。直到用户满意、或反馈为空、或再怎么改都没进展为止。

### 8. 收尾

```powershell
python "C:\Users\Mr Li\AppData\Roaming\Daisy\extensions\skills\skill-creator\scripts\quick_validate.py" "<技能目录>"
```

校验通过后告诉用户技能装在哪、怎么用。需要分发或备份时可用：

```powershell
python "C:\Users\Mr Li\AppData\Roaming\Daisy\extensions\skills\skill-creator\scripts\package_skill.py" "<技能目录>"
```

## 本技能自带的参考文件

相对本技能目录（`...\skills\skill-creator\`）：

- `scripts/quick_validate.py` — 校验技能结构与 frontmatter，每次收尾必跑
- `scripts/package_skill.py` — 打包成 `.skill` 文件
- `references/schemas.md` — evals.json、grading.json 等数据结构
- `agents/grader.md` — 怎么按断言给产物打分（要自评时读）
- `agents/analyzer.md` — 怎么分析评测结果、找无用断言
- `agents/comparator.md` — 两个版本盲评对比
- `scripts/aggregate_benchmark.py`、`run_eval.py`、`run_loop.py`、`improve_description.py` — 依赖 claude CLI 与批量调用，Daisy 里默认不用；用户明确要求且环境可用时再考虑
- `SKILL.upstream.md` — 官方原版全文，仅作参考
