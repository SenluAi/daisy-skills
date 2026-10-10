---
name: "备份源码到GitHub"
description: "把本地源码备份到 GitHub。用户说「备份源码」「传到 GitHub」「推仓库」「备份这个项目」时用。"
---

# Skill：把本地源码备份到 GitHub

## 触发场景
- 用户说「备份源码」「把源码传到 GitHub」「推到那个仓库」「备份一下这个项目」。
- 已有本地源码/下载的源码目录，需要在 GitHub 上留一份可回溯的备份。
- 来源：为用户完成 Daisy-Voice-Agent 源码备份/推送这件事的实操经验。

## 前置确认（自动完成，不要问用户）
- **用户已授权全自动执行**：仓库地址、项目名、分支都用本地 `git remote -v` 和末尾「默认仓库」自动确定，不再向用户确认。
- 路径：自动探测源码目录（本次选中项 > 用户目录/桌面/下载等常见位置，用 `list_directory` 确认真实结果），不凭记忆猜。
- 只在「完全定位不到源码目录」或「发现疑似密钥/超大文件」这类真实风险时，才打断用户一次说明。
- 全程不中途提问，执行完统一汇报一次。

## 执行步骤
1. **定位源码（自动）**：`list_directory` 确认目录与体积；确认是源码目录而不是安装包。
2. **看现状**：`run_shell_command` 执行 `git -C "<路径>" status` 与 `git -C "<路径>" remote -v`。
   - 已有 remote → 直接用该仓库。
   - 已是仓库 → 直接跳到第 5 步。
3. **初始化（仅当不是仓库）**：`git -C "<路径>" init`，默认分支用 `main`。
4. **写 .gitignore（关键，必须在 add 之前生效）**：至少排除
   `node_modules/`、`dist/`、`build/`、`out/`、`.venv/`、`__pycache__/`、
   `*.dmg`、`*.zip`、`*.exe`、`*.log`、`*.env`、`daisy.env`、`cred*.txt`、`api*.txt`、`*.key`。
   GitHub 单文件上限 100MB，超过的必须排除或走 Git LFS。
5. **README 与介绍中文化（必做，在提交之前）**：
   - 检查范围：`README.md`、`README*.md`、`docs/` 下的介绍类文档、仓库页面的标题/简介（About/description）、发布说明。
   - 凡是英文（含只有英文的正式介绍、使用说明、功能介绍），一律改写成**中文**：保留代码块、命令、专有名词和 API 名称原样，不改技术含义，不删信息。
   - 写法务实：中文流畅、结构沿用原标题层级；不要机翻腔，也不要只把标题翻译了正文留英文。
   - 若原本有 `README_EN.md` 之类英文版，可保留作对照，主 `README.md` 用中文；只有英文版的直接改写为中文。
   - 顺带核对 About/仓库简介，是英文就改成中文。
6. **提交**：`git add -A` → `git commit -m "backup: <YYYY-MM-DD> <一句话说明>"`。
7. **推送**：`git fetch origin` 先看远端是否领先；`git pull --rebase` 后 `git push origin main`。**绝不用 `--force` 强推**。
8. **校验（必做）**：`git log --oneline -1`、`git status` 显示 clean，`git ls-remote origin` 与本地 HEAD 的 commit 一致。
   涉及网页确认时用 open_url 打开仓库首页核对最新提交与 README 是否为中文。
9. **汇报**：给出仓库地址、分支、commit 号、被 .gitignore 排除的内容、哪些文件做了中文化，以及第 10 步删掉了什么，一两句话说完。
10. **清理本地副本（第 8 步校验通过后才做，默认执行，用户已授权）**：
   - 删除范围：本次任务为备份而用的 `git clone` 克隆目录、下载的源码包（zip/dmg 等）、临时上传脚本与日志。
   - 依据本次工具返回的真实路径操作，只删确认为副本的对象；路径不确定时先列清单再处理。
   - 不要删远端仓库，也不要把用户原本的项目/工作目录当副本删掉；删前若同一路径还要用，先留着。

## 常见坑
- 源码目录里混着密钥（api.txt / cred2.txt / daisy.env）→ 若误提交过，删文件不能解决，必须换密钥并立即告知用户。
- 大安装包（如 *.dmg）不要放进仓库，改用 Release 附件。
- 网络失败时读 error.code，可重试的按 correction 换方法（如 https 失败换 ssh 或重试一次）。

## 默认仓库（`git remote -v` 没有结果时依次使用）
- github.com/SenluAi/
