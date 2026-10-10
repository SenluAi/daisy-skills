# daisy-skills

Daisy 语音助手的个人技能集合：每个子目录一个技能，核心文件为 `SKILL.md`。

## 包含的技能

| 技能 | 作用 |
| --- | --- |
| website-auto-update | 给已复刻/自建静态站做定时自动更新：抓新内容、重建、校验、部署 |
| self-improving-agent | AI 错题本：把真实踩过的坑记成错因＋纠正路径 |
| skill-creator | 创建、修改、优化技能，打磨技能描述 |
| clone-website | 把网站完整复刻成可离线/可部署的静态站 |
| backup-source-to-github | 把本地源码备份到 GitHub |
| find-skills / plugin-market / mcp-market / pending-install-list | 查找并安装技能、插件与 MCP |
| docs-for-agents / writing-for-agents | 写给 AI 看的文档（技能、AGENTS.md） |
| clarify-requirements / explain-again | 需求澄清与重讲 |
| grill-me / grilling | 追问式访谈，压力测试计划 |
| teach / multi-session-teaching | 跨会话教学 |
| handoff / session-handoff | 会话交接 |

未收录：`legado-book-source-tamer`（第三方大型技能，请见上游仓库）。

## 怎么用

把需要的技能目录复制到 Daisy 的技能目录：

- Windows：`%APPDATA%\Daisy\extensions\skills\`
- macOS：`~/.config/Daisy/extensions/skills/`（以实际安装位置为准）

复制后在 Daisy 设置的技能列表里启用即可。

> 说明：为保护隐私，上传版本把 Windows 用户名路径替换为 `%USERPROFILE%` / `%USERNAME%` 占位符；本地原始技能文件未改动，可按需改回。
