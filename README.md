# Daisy 个人技能集合（daisy-skills）

> Daisy 语音助手的个人技能库：**19 个开箱即用的 Agent 技能**，每个技能一个目录、一份 `SKILL.md` 加配套脚本／模板。复制到 Daisy 技能目录即可启用，覆盖网站自动化、自我纠错、技能开发、内容沉淀与日常工作流。

`SKILL.md` 的写法遵循同一套约定：`description` 里写清「用户说什么话时必须触发」，正文只写必要步骤和硬性约束，能交给脚本的就不写成长篇说明——这样模型更容易被正确触发，也更省上下文。

## 技能一览

| 分类 | 技能 | 作用 |
| --- | --- | --- |
| 网站自动化 | website-auto-update | 给已复刻或自建的静态站做定时自动更新：抓原站新内容、只抓新增详情页、重建页面、本地校验、部署、线上校验，定时可选云端 GitHub Actions 或本地 Windows 计划任务 |
| 网站复刻 | clone-website | 全站复刻：首页之外的每个栏目、每个 tab（月度／年度／周榜、精选／全部）、榜单、月刊每一期、文章列表与正文、标签页、分页全部在站内成页，页内零外链，所有链接一律指向站内 |
| 自我改进 | AI 错题本 | 把真实踩过的坑记成「错因 ＋ 纠正路径」，下次不再重复犯错；只记已验证有效、能省步骤的经验，弯路不入账；随技能附带 `_错题本.md` 记录文件（已并入 proactive-self-improving-agent，本机停用）|
| 自我进化（含错题本） | proactive-self-improving-agent | 自动捕获经验并安全进化：命令失败、被纠正、缺少能力、外部工具报错、知识过时分别记入 ERRORS / LEARNINGS / FEATURE_REQUESTS；已并入原「AI错题本」的开工前必读最近 10 条、一行式「错因→纠正路径」速查表、同坑标 ×2 不新开行、本机绝对路径与提前确认约定 |
| 技能开发 | skill-creator | 创建新技能、修改和优化已有技能、检验技能好不好用，并打磨 `description` 让它更容易被正确触发 |
| 技能发现 | find-skills | 在 skills.sh / `npx skills` 开放生态里查找并安装 Agent 技能 |
| 技能发现 | plugin-market（安装插件） | 查找并安装社区技能或插件 |
| 技能发现 | mcp-market（MCP 市场） | 查找并配置 MCP 服务器，扩展工具能力 |
| 技能发现 | pending-install-list（待装清单） | 维护插件接口上线后要装的插件与技能清单 |
| 文档写作 | docs-for-agents | 写任何给 AI 看的文档：技能、索引、`AGENTS.md` |
| 文档写作 | writing-for-agents | 写给 AI 代理看的文档（技能文档或 `AGENTS.md`）的规范与范例 |
| 需求澄清 | clarify-requirements | 需求含糊时先把需求问透再动手，避免返工 |
| 需求澄清 | explain-again | 用户没听懂时停下来，用大白话重讲上一条 |
| 压力测试 | grill-me / grilling | 不留情面的追问式访谈，用来打磨、检验计划、设计或决定 |
| 教学 | teach | 跨多次会话教用户学会一个新技能或概念 |
| 教学 | multi-session-teaching | 把学一个主题当成跨会话的长期工程，用文件保存进度 |
| 交接 | handoff / session-handoff | 把当前对话压缩成交接文档，方便下一个代理接手继续 |
| 备份 | backup-source-to-github | 把源码备份到 GitHub 或去掉仓库的 fork 标记（脱钩）：建仓、提交、推送、Leave fork network 一条龙 |

## 目录结构

```
daisy-skills/
├── README.md
├── <skill-name>/
│   ├── SKILL.md          # 技能正文：触发条件 + 步骤 + 约束
│   ├── scripts/          # 可选：可执行脚本（PowerShell / Python / JS）
│   ├── assets/           # 可选：模板、配置样例
│   └── evals/            # 可选：技能自测用例
└── ...
```

## 怎么用

1. 克隆或下载本仓库（`git clone https://github.com/SenluAi/daisy-skills.git`）。
2. 把需要的技能目录复制到 Daisy 的技能目录：
   - Windows：`%APPDATA%\Daisy\extensions\skills\`
   - macOS：`~/.config/Daisy/extensions/skills/`（以实际安装位置为准）
3. 打开 Daisy 设置的技能列表，启用对应技能，之后按 `description` 里写的话术说出来即可触发。

## 隐私与说明

- 为保护隐私，上传版本把 Windows 用户名路径统一替换成了 `%USERPROFILE%` / `%USERNAME%` 占位符；本地原始技能文件未做任何改动，可按需改回。
- 未收录 `legado-book-source-tamer`（第三方大型技能，请见其上游仓库）。
- 技能多为个人使用场景沉淀，欢迎参考，按自己的环境调整路径与话术。
