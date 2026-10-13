---
name: 安装插件
description: 查找并安装社区技能或插件。用户说「找插件」「装插件」「插件市场」「技能市场」时用。
---

# Skill：插件市场

## 触发场景
- 用户说「找个插件」「装插件」「插件市场看看」「技能市场」时启用。
- 适用条件：要为 Daisy / Claude Code / Codex 等代理找外部技能或插件。
- 来源：2026-10 用户要求把插件市场能力固化成本地技能。

## 前置确认
- **自动获取（不要问用户）**：市场页面、候选清单、star 与更新时间全部自己查。
- **需要问用户的情况**：只有准备写入宿主配置目录（如 `~/.claude`、`~/.codex`）或覆盖已有文件时，打断一次。

## 通用市场（与宿主无关，首选）
| 市场 | 入口 | 说明 |
| --- | --- | --- |
| skills.sh | `npx skills` / skills.sh | Vercel 维护，npm 式技能包管理器，约 2000 个技能，社区提交、无审核 |
| SkillsMP | skillsmp.com | 抓取公开 GitHub 仓库，80 万+ 技能，只收 2 star 以上项目 |
| LobeHub | lobehub.com/skills | 16 万+ 抓取技能，带分类和搜索 |
| ClaudeSkills.info | claudeskills.info | 600+ 免费技能，含 Anthropic 官方技能（PDF/DOCX/XLSX、前端设计、MCP builder） |
| MCP Market | mcpmarket.com | 以 MCP 服务器目录为主，兼收技能 |
| Agensi | agensi.io/skills | 人工策展，带安全扫描和创作者分成 |

## MCP 服务器注册表
- 官方 MCP Registry：registry.modelcontextprotocol.io —— 找 MCP 服务器用它，配置流程走「MCP市场」技能。

## 宿主专用市场（只在该宿主里生效）
- Anthropic 官方：github.com/anthropics/knowledge-work-plugins（插件）、github.com/anthropics/skills（技能）
- Cursor Marketplace：cursor.com/marketplace
- 社区列表：GitHub topic `agent-skills-marketplace`、各种 `awesome-*skills*` 仓库

## 执行步骤
1. 用 `web_search` / `scrape_url` 在**通用市场**里检索（上表优先，宿主专用市场当补充）。
2. 列 3～5 个候选，每条给：名称 / 作用 / 安装方式 / 最近更新 / 风险点。
3. 用户选定后，把技能 `.md` 下载到 `%APPDATA%\Daisy\extensions\skills\`，命名用中文短名或者英文名。
4. 回 `README.md` 索引补一行，并标明哪些是纯文本可用、哪些需要宿主支持接口。

## 常见坑
- 通用市场基本无审核：SkillsMP / LobeHub 是抓取来的，可能有过期甚至恶意技能，装前先通读一遍 `SKILL.md`。
- 插件运行时（连接器、宿主命令、hook）我装不上，只有纯文本技能能直接调用；下载 ≠ 已安装。
- 市场页面常改版，下载前先确认目标文件真实存在，别凭旧链接猜。
