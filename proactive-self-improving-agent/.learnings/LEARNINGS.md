# Learnings

> 准入标准：只写**已验证有效、能省步骤或避免重犯**的经验；弯路只以「负面结论 + 纠正路径」一行存在，不记摸索过程；没验证的不写。

经验、纠正、知识空白、最佳实践、任务回顾。

**Categories**: correction | knowledge_gap | best_practice | task_review
**Areas**: research | infra | tools | docs | config
**Statuses**: pending | resolved | promoted | promoted_to_skill

## 速查表（一行一条：错在哪 → 纠正路径）

| 日期 | 任务 | 错在哪（真实报错） | 纠正路径 |
|---|---|---|---|
| 2026-10-10 | 关闭 QQ 窗口 | `quit_application` 返回「已找到 QQ，但无法安全确定其进程名称」，原样重试两次均无变化 | 改用 `desktop_click` 点窗口右上角关闭按钮，一次成功 |
| 2026-10-10 | 视觉点击 | 截图坐标换算偏差，出现点空、需二次修正 | 每轮动作前以最新附带截图的坐标为准，动作后看验证截图 |
| 2026-10-10 | 技能加载 | 文件放在 `<用户目录>\Daisy-Skills\productivity\AI错题本.md`，Daisy 技能列表里始终没有，`read_skill` 报技能不存在或未启用 | Daisy 从 `<%APPDATA%>\Daisy\extensions\skills\<英文名>\SKILL.md` 加载，frontmatter 用 `name`/`description`，写好立即生效 |

---

## [LRN-20261010-001] correction

**Priority**: high  **Status**: resolved  **Area**: tools  **Pattern-Key**: close-qq-window

### 内容
quit_application 对 QQ 返回「已找到 QQ，但无法安全确定其进程名称」，原样重试两次均无变化。

### 建议修复
关闭 QQ 窗口改用 desktop_click 点窗口右上角关闭按钮。

### 元数据
- Source: error

---

## [LRN-20261010-002] best_practice

**Priority**: medium  **Status**: resolved  **Area**: tools

### 内容
视觉点击时按旧截图或心算坐标会点空，需二次修正。

### 建议修复
每轮动作前以最新附带截图的坐标为唯一依据，动作后依据验证截图决定下一步。

### 元数据
- Source: task_review

---

## [LRN-20261010-003] correction

**Priority**: high  **Status**: resolved  **Area**: config

### 内容
技能文件放在 <用户目录>\Daisy-Skills\productivity\AI错题本.md 时 Daisy 技能列表里始终没有，
ead_skill 报技能不存在或未启用。

### 建议修复
技能必须放在 <%APPDATA%>\Daisy\extensions\skills\<英文名>\SKILL.md，frontmatter 用 
ame/description，写好立即生效无需重启；停用改同目录 disabled.json。

### 元数据
- Source: error

---
