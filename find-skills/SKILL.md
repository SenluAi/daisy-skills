---
name: find-skills
description: 查找并安装开放生态里的 Agent 技能（skills.sh / npx skills）。用户说「find skill」「找个技能」「有没有技能能做 X」「怎么装技能」时用。
---

# Skill：查找技能（find-skills）

帮助用户发现并安装开放 Agent 技能生态里的技能。来源：vercel-labs/skills。

## 触发场景

- 用户问「怎么做 X」，而 X 可能是已有技能能覆盖的常见任务
- 用户说「find skill」「找个技能」「有没有技能能做 X」「怎么装技能」
- 用户想扩展代理能力、找工具/模板/工作流
- 用户提到希望在某领域（设计、测试、部署等）有帮手

## Skills CLI

`npx skills` 是开放 Agent 技能生态的包管理器。

**常用命令：**

- `npx skills find [query] [--owner <owner>]` — 交互式或按关键词搜索技能，可限定 GitHub owner
- `npx skills add <package>` — 从 GitHub 等来源安装技能
- `npx skills update` — 更新全部已安装技能

**浏览技能：** https://skills.sh/

## 执行步骤

### 1. 弄清需求

识别领域（React、测试、设计、部署）、具体任务（写测试、做动画、审查 PR），以及这是否是常见到已有技能存在的任务。

### 2. 先看排行榜

在跑 CLI 搜索前，先看 https://skills.sh/ 排行榜（按安装量排序），常有现成的成熟选择。例如：

- `vercel-labs/agent-skills` — React、Next.js、web design
- `anthropics/skills` — 前端设计、文档处理

### 3. 搜索技能

```bash
npx skills find [query] [--owner <owner>]
```

例：「怎么让 React 应用更快」→ `npx skills find react performance`。

### 4. 推荐前先校验质量

不要只凭搜索结果就推荐：

1. **安装量** — 优先 1K+，低于 100 要谨慎
2. **来源信誉** — `vercel-labs`、`anthropics`、`microsoft` 等官方来源更可信
3. **GitHub star** — 源仓库 <100 star 要警惕

### 5. 把选项摆给用户

每条给出：技能名与作用 / 安装量与来源 / 安装命令 / skills.sh 详情链接。

### 6. 用户同意后代为安装

```bash
npx skills add <owner/repo@skill> -g -y
```

`-g` 全局（用户级）安装，`-y` 跳过确认。

## 常见技能分类

| 分类 | 示例查询 |
| --- | --- |
| Web 开发 | react, nextjs, typescript, css, tailwind |
| 测试 | testing, jest, playwright, e2e |
| DevOps | deploy, docker, kubernetes, ci-cd |
| 文档 | docs, readme, changelog, api-docs |
| 代码质量 | review, lint, refactor, best-practices |
| 设计 | ui, ux, design-system, accessibility |
| 效率 | workflow, automation, git |

## 搜索技巧

1. **用具体词**：「react testing」比「testing」好
2. **换同义词**：「deploy」不行就试「deployment」「ci-cd」
3. **优先热门来源**：`vercel-labs/agent-skills`、`ComposioHQ/awesome-claude-skills`

## 找不到技能时

1. 直说没找到现成技能
2. 提出用自己的通用能力直接帮忙
3. 建议用户用 `npx skills init` 自建技能

## 常见坑（Daisy 环境）

- `npx skills add -g` 默认装到 `~/.claude/skills` 等宿主目录，Daisy 读不到；要真正启用需把 SKILL.md 放到 `C:\Users\Mr Li\AppData\Roaming\Daisy\extensions\skills\<技能名>\SKILL.md`。
- 带运行时代码/hook 的技能装上也跑不起来，只有纯文本技能可直接调用；下载 ≠ 可用。
- 安装前先确认目标文件真实存在，别凭旧链接猜。
