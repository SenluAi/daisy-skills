---
name: website-auto-update
description: 给已复刻或自建的静态网站做定时自动更新——抓原站新内容、只抓新增详情页、重建页面、本地校验、部署、线上校验，并注册 Windows 计划任务。用户说「让这个站自动更新」「每天/每两天自动同步原站」「网站内容自动抓取更新」「做个网站更新脚本」「改成每两天更新一次」时使用。
---

# Skill：网站自动更新

把「原站又发新内容了」这件事变成计划任务自动完成：原站上新 → 本地自动补抓 → 重建页面 → 校验通过才部署。

## 适用与前提

只适合**已经复刻/自建好的静态站**（列表页、详情页、标签页都在站内）。开工前先确认三件事，缺一件就先补：

1. 有一个能代表「全部条目」的本地数据文件（如 `details.json`），每一项有稳定的唯一标识（如 `full_name`）。
2. 有能从数据文件重新生成页面的构建脚本（如 `build-detail.js`、`build-tags.js`）。
3. 有可无人值守执行的部署命令（如 `npx wrangler deploy`、`vercel --prod`）和线上域名。

## 核心原则（这几条决定脚本好不好用）

- **只抓新增**：拿原站列表和本地数据文件比对，老条目直接跳过，缓存原始页面到 `raw/`，跑第二次就几乎不产生请求。
- **校验不过绝不部署**：首页死链 `href="#"` 必须为 0，站内链接指向的文件必须都存在。不合格就退出，把改动前的文件留在 `backup/时间戳/`，随时可回滚。宁可今天不更新，也不要上线一个坏页面。
- **新卡片生下来就是站内链接**：插入首页时直接写 `./repo/xxx.html` + `data-card="1"`，不要先放原站外链以后再改。
- **每次运行都写日志**：`update-log.txt` 记录列表条数、新增了哪些、校验数字、部署结果、线上抽查状态码。用户问「更新了吗」时靠它对账。
- **备份只留最近 7 份**，否则 `backup/` 会无限长大。

## 步骤

1. **读项目结构**：用 `list_directory` 看清数据文件、构建脚本、部署配置，确认线上域名。
2. **拷模板**：把本技能的 `assets/update-template.js` 复制到项目根目录，改名为 `update.js`，填顶部 `CONFIG`（列表接口、详情页 URL、构建脚本、部署命令、线上地址、校验规则）。
3. **试运行**：`node update.js --no-deploy`，确认没有新增时不报错、不会碰线上。
4. **模拟一次上新**（关键一步，别省）：备份数据文件后，从里面删掉最后 1～2 条，再跑 `node update.js --no-deploy`，看它能不能自动发现、补抓、重建、插入卡片。这一步能提前暴露九成问题。
5. **真跑一次**：`node update.js`，确认部署成功并按日志里的线上校验数字核对。
6. **注册计划任务**：
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File "<技能目录>\scripts\register-schedule.ps1" -ProjectPath "C:\path\to\project" -DaysInterval 2 -At 9am
   ```
   改频率时重跑同一条命令即可（脚本是"存在就改、不存在就建"）。改完用 `Get-ScheduledTaskInfo` 看 `NextRunTime` 核对。
7. **写 README**：项目里记下任务名、触发时间、手动更新命令、日志位置、回滚方式。
8. **收尾校验**：空跑一次应输出「新增 0，无需更新」；`backup/` 只留 7 份；`update-log.txt` 有完整一次记录。

## Windows 计划任务踩过的坑（照抄可避）

- 别把带空格的项目路径塞进 `schtasks /TR`，它会在空格处拆成 Execute/Arguments，任务报 `0x80070002 找不到指定的文件`。用 PowerShell 的 `New-ScheduledTaskAction -Execute '<node.exe 全路径>' -Argument '"<脚本路径>"' -WorkingDirectory <项目目录>`。
- 用 `New-ScheduledTaskSettingsSet -StartWhenAvailable`，这样错过了 9 点也会在开机后补跑。
- 批处理启动脚本必须 **CRLF** 行尾，否则 cmd 会拼错多行（典型报错 `'dp0"' 不是内部或外部命令`）。
- 让 node 自己写日志；批处理 stdout 重定向到**另一个**文件，重定向到同一个日志会 `EBUSY`。
- 写 `.ps1` 别用无 BOM 的 UTF-8 中文，PowerShell 5.1 按 ANSI 读会解析失败；优先输出英文。
- 计划任务只在用户已登录时跑，笔记本合盖/关机时段会跳过，靠 `-StartWhenAvailable` 兜底。

## 用到别的技能时

- 网站还没复刻：先走 `clone-website` 技能把站建好、链接站内化，再回来做自动更新。
- 要把这套流程沉淀/改技能：走 `skill-creator`。

## 文件

- `assets/update-template.js` — 通用更新脚本模板（含备份、只抓新增、校验、部署、线上校验、日志）。
- `scripts/register-schedule.ps1` — 注册/修改计划任务（`-DaysInterval 1|2|7`、`-At 9am`）。
- `evals/evals.json` — 触发用例。
- 真实完整样板：`%USERPROFILE%\Desktop\hellogithub-clone\update.js`（HelloGitHub 镜像站，含 60 条数据的实战版本），改别的站时对照它填 CONFIG 最省事。

