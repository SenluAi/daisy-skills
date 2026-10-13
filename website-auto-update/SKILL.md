---
name: website-auto-update
description: 给已复刻或自建的静态网站做定时自动更新——抓原站新内容、只抓新增详情页、重建页面、校验、部署、线上抽查；整站已完整复刻时也可走「整页快照」方案：Worker 侧直接跟着原站走，每两天把全部页面（含新增页面）全量刷新一遍，不重建、不依赖本地电脑开机。定时全部跑在云端：站点部署在 Cloudflare 就用 Cron Worker（构建型用部署挂钩，快照型用 KV 快照），部署在 GitHub 就用 GitHub Actions schedule。用户说「让这个站自动更新」「每天/每两天自动同步原站」「全部更新，新增的内容都要更新」「网站内容自动抓取更新」「做个网站更新脚本」「改成每两天更新一次」「不用开电脑也能自动更新」时使用。
---

# Skill：网站自动更新

把「原站又发新内容了」这件事变成云端定时任务自动完成：原站上新 → 自动补抓 → 重建页面 / 刷新快照 → 校验通过才生效。

## 适用与前提

只适合**已经复刻/自建好的静态站**（列表页、详情页、标签页都在站内）。开工前先确认三件事，缺一件就先补：

1. 有一个能代表「全部条目」的本地数据文件（如 `details.json`），每一项有稳定的唯一标识（如 `full_name`）。
2. 有能从数据文件重新生成页面的构建脚本（如 `build-detail.js`、`build-tags.js`）。
3. 站点已经部署在云端（Cloudflare 或 GitHub），能拿到部署凭据（部署挂钩 / Wrangler Token / `GITHUB_TOKEN`）和线上域名。

> 例外：整站已经完整复刻、页面**不需要重建**、只想让线上内容一直跟着原站走时，第 1、2 条可以省掉，直接走下面的「整页快照」方案。

## 先选路线：重建型 还是 快照型

| | 重建型（构建时抓增量） | 快照型（整页快照） |
| --- | --- | --- |
| 适用 | 数据靠接口、页面要重新生成；只要新条目 | 整站已复刻，页面结构不用动，只想内容跟原站同步 |
| 怎么更新 | 构建命令里跑 `update.js`：比对列表 → 抓新增 → 重建 → 校验 → 部署 | Worker 每两天回源原站，把**全部页面**的最新 HTML 存进 KV，访客拿 KV 快照 |
| 定时 | Cron Worker 敲门 / Actions schedule | Cron Worker 自己就是刷新器 |
| 模板 | `assets/update-template.js` + `assets/cron-worker.js`（或 `assets/workflow-update.yml`） | `assets/snapshot-worker.js` + `assets/build-pages-list.ps1` |

用户说「**全部都更新、新增的内容也都要更新**」时，优先快照型：它天然是全量（首页 + 清单里每一个页面），新增页面只要补进清单就会被一起刷。

## 定时跑在哪：按站点部署位置二选一

**不用本地电脑挂计划任务**——关机、合盖、没登录就断档，笔记本尤其靠不住。按站点托管在哪选：

| 站点部署在 | 定时方式 | 模板 |
| --- | --- | --- |
| **Cloudflare**（Pages / Workers + 静态资源 / R2） | Cron Worker 定时敲一次部署挂钩，抓取与构建放进云端构建流程 | `assets/cron-worker.js` + `assets/wrangler.toml` |
| **Cloudflare**（整站已复刻、快照型） | Cron Worker 每两天回源全量刷新 KV 快照，Worker 自己就是更新器 | `assets/snapshot-worker.js` + `assets/build-pages-list.ps1` |
| **GitHub**（Pages / 仓库里存站点源码） | GitHub Actions `schedule` 跑 `node update.js`，改动提交回仓库 | `assets/workflow-update.yml` |

三者都是「云端跑、电脑不用开」。确认用户站点实际部署在哪、要重建还是要快照，再选模板，别混用。Cloudflare 上还要再分一次：**Pages 项目**和 **Workers 项目（静态资源由 Workers Assets 托管，现在新建项目默认是这种）**，两者设置页长的不一样、命令写法也不同，动手前先认清（见下）。

## 核心原则（这几条决定脚本好不好用）

- **只抓新增**（重建型）：拿原站列表和本地数据文件比对，老条目直接跳过，缓存原始页面到 `raw/`，跑第二次就几乎不产生请求。
- **清单必须覆盖全部页面**（快照型）：Cron 全量回刷就是照 `pages.js` 这份清单刷的。清单漏掉的页面只能靠访客访问被动更新，等于长期发霉；复刻新增页面后必须重跑 `assets/build-pages-list.ps1` 再部署。
- **快照有效期和 cron 周期对齐**（快照型）：每两天一刷就把 `PAGE_TTL` 写 `172800` 秒。TTL 比周期短 → 快照还没到下次刷新就过期，退化成「每个访客都去回源」，等于没缓存；TTL 太长 → 页面发霉。
- **校验不过绝不部署**：首页死链 `href="#"` 必须为 0，站内链接指向的文件必须都存在。不合格就退出，把改动前的文件留在 `backup/时间戳/`，随时可回滚。宁可今天不更新，也不要上线一个坏页面。
- **新卡片生下来就是站内链接**：插入首页时直接写 `./repo/xxx.html` + `data-card="1"`，不要先放原站外链以后再改。
- **每个页面都要有兜底**：快照型里，回源失败（原站 404 / 风控 / 超时）必须回退到站内已有的复刻副本，宁可显示略旧的内容，也不能开天窗返回 404。
- **每次运行都写日志**：`update-log.txt` 记录列表条数、新增了哪些、校验数字、部署结果、线上抽查状态码。用户问「更新了吗」时靠它对账。
- **备份只留最近 7 份**，否则 `backup/` 会无限长大。
- **脚本与调度解耦**：`update.js` 里只做「抓→建→校验→部署」，跑在哪由外层调度决定（Cloudflare Cron 或 Actions schedule 都调同一个文件）。
- **路径只认 `__dirname`**：脚本里凡是文件路径，一律 `path.join(__dirname, ...)`。写死 `C:\Users\...` 这类本地绝对路径，本地跑得通、云端构建必挂。

## 步骤（重建型）

1. **读项目结构**：用 `list_directory` 看清数据文件、构建脚本、部署配置，确认站点部署在 Cloudflare 还是 GitHub（Cloudflare 再确认 Pages 还是 Workers）、以及线上域名。
2. **拷模板**：把本技能的 `assets/update-template.js` 复制到项目根目录，改名为 `update.js`，填顶部 `CONFIG`（列表接口、详情页 URL、构建脚本、部署命令、线上地址、校验规则）。
3. **试运行**：`node update.js --no-deploy`，确认没有新增时不报错、不会碰线上。
4. **模拟一次上新**（关键一步，别省）：备份数据文件后，从里面删掉最后 1～2 条，再跑 `node update.js --no-deploy`，看它能不能自动发现、补抓、重建、插入卡片。这一步能提前暴露九成问题。
5. **真跑一次**：`node update.js`，确认部署成功并按日志里的线上校验数字核对。
6. **接上云端定时**：部署在 Cloudflare → 看「Cloudflare 云端定时」；部署在 GitHub → 看「GitHub Actions 云端定时」。
7. **写 README**：项目里记下触发方式（Worker 名 + cron 表达式 / workflow 名）、时间、手动更新命令、日志位置（Workers 构建日志 / Pages 构建日志 / `update-log.txt`）、回滚方式（重新部署上一个成功构建 / 仓库 revert）。
8. **收尾校验**：空跑一次应输出「新增 0，无需更新」；`backup/` 只留 7 份；日志有完整一次记录。

## 步骤（快照型，每两天全量刷新）

1. **确认站的形态**：站点是 Workers 静态资源（`wrangler.jsonc` 里有 `assets`），页面全部在站内，只需要内容跟原站同步。
2. **生成页面清单**：`assets/build-pages-list.ps1 -SiteDir <项目>\site -Out <项目>\src\pages.js`，产出 `export const PAGES = [...]`。这条命令要覆盖**全部页面**（每个栏目、每个 tab、每一期、每个详情页）；复刻新增页面后重跑一次。
3. **拷 Worker 模板**：`assets/snapshot-worker.js` → `src/worker.js`，改顶部 `CONFIG`（`ORIGIN` 原站、`SELF` 本站、`PAGE_TTL` 与 cron 周期对齐）。
4. **建 KV**：`npx wrangler kv namespace create SNAPSHOT`，把返回的 id 填进 `wrangler.jsonc` 的 `kv_namespaces`。
5. **配 cron 与 Worker 入口**：`wrangler.jsonc` 里 `"main": "src/worker.js"`、`"assets": { "directory": "site", "binding": "ASSETS", "run_worker_first": ["/", "/*/*.html", ...] }`、`"triggers": { "crons": ["0 3 */2 * *"] }`（UTC，＝北京时间 11:00，两天一次）。
6. **部署**：`npx wrangler deploy`，输出里应看到 `schedule: 0 3 */2 * *`。
7. **验证三种状态**（用 `x-snapshot` 响应头对账，最直观）：
   - 首页 → `live-self`；已有快照的详情页 → `live-page-cached`；没缓存过的页面 → `live-page`；完全没有该头 → 走的是本地兜底。
   ```
   curl.exe -sI -o NUL -w "%{http_code} %{header_json}" https://本站域名/zh-cn/xxx.html
   ```
8. **手动全量回刷**（不想等两天时）：`npx wrangler secret put REFRESH_TOKEN`，然后访问 `https://本站域名/__refresh-all?token=xxx`，返回 `{"started":true,"total":88}`。
9. **写 README**：记下 cron 表达式、清单文件位置、`x-snapshot` 各值含义、手动刷新命令、加新页面后要重跑清单脚本。

## Cloudflare 云端定时（站点部署在 Cloudflare 时）

### 路线 0：整页快照（不重建，每两天全量刷新）

思路：**不做构建，Worker 自己就是更新器。** Cron 每两天把清单里所有页面回源一遍、写进 KV；访客读 KV 快照，命中就不打扰原站；回源失败回退站内复刻副本。

要点（都已在生产验证过）：
- **并发 + 间隔**：一次 Cron 要在 `waitUntil` 的 30 秒窗口内刷完全部页面，用 8 并发、每页间隔 150ms，88 个页面约十几秒跑完；串行 + 每页 1 秒必超时。
- **首页与详情页分开存**：首页固定键 `index.html`，详情页用 `p:/zh-cn/xxx.html`，都套 48 小时 TTL（`expirationTtl: 172800`）。
- **只改品牌域名**：`kaiyuanbang.cn` 之类换成 `SELF`，GitHub 等项目源码链接保持真实跳转。
- **原站已下线的页面**：回源 404 时不要报错，直接回退本地副本（本次实测 `/zh-hant/index.html` 原站就是 404，靠本地兜底照常可访问）。
- **排查靠响应头**：`x-snapshot: live-self` / `live-page-cached` / `live-page` / `live-asset`，一眼看出这一屏是快照、实时回源还是本地兜底。
- **频率听用户的**：说「不用太勤、两天一次就行」就写 `0 3 */2 * *`，同时把 `PAGE_TTL` 改成 `172800`；别顺手写成一小时一次，免费额度经不起。

### 先分清项目类型（认错会白折腾）

| | Pages 项目 | Workers 项目（静态资源 / Workers Assets） |
| --- | --- | --- |
| 面板位置 | Workers & Pages → Pages 标签 | Workers & Pages → Workers 标签 |
| 构建配置 | Settings → Builds & deployments：**构建命令** + **输出目录** | 设置 → 构建：**构建命令** + **部署命令** 两个字段 |
| 挂钩名字 | Deploy Hook（部署钩子） | 部署挂钩（同一页，点「添加」） |
| 钩子 URL | 面板生成，直接复制 | 面板生成，直接复制 |

判断方法：面板里能改「输出目录」的是 Pages；让你分别填「构建命令」和「部署命令」的是 Workers。

### 路线 A：Pages 项目（重建型）

1. **Pages 构建命令带上更新脚本**：Pages 项目 → Settings → Builds & deployments → Build command 改成 `node update.js --no-deploy`（模板里 `update.js` 会自己跑 `buildSteps`），Output directory 指向生成站点的目录（模板里是 `site`）。这样每次构建都先补抓新内容再生成页面。
2. **校验失败 = 构建失败 = 线上不换**：`update.js` 校验不过时退出码非 0，Pages 构建失败，线上保持上一个成功版本，天然满足「宁可今天不更新」。
3. **建 Deploy Hook**：同一页面的 Deploy hooks 里建一个（如 `cron-daily`），复制它的完整 URL。注意钩子只负责「触发一次构建」，它自己不会定时。
4. **建 Cron Worker**：把 `assets/cron-worker.js` 和 `assets/wrangler.toml` 拷到 Worker 项目目录，改 `name` 和 `[triggers] crons`，然后：
   ```
   npx wrangler secret put DEPLOY_HOOK_URL   # 粘贴第 3 步的钩子地址
   npx wrangler secret put ADMIN_KEY         # 可选：手动触发口令
   npx wrangler deploy
   ```
   Worker 常驻 Cloudflare，之后电脑关机、合盖、不登录都照跑。
5. **省构建次数（可选）**：站点条目多、原站改动少时，在 `wrangler.toml` 里配 `CHECK_URL` + KV 绑定，Worker 先比对原站列表指纹，没变化就不触发构建。
6. **核对**：`npx wrangler tail` 看下一次触发；或浏览器访问 `https://<worker>.<账号>.workers.dev/?key=<ADMIN_KEY>` 手动触发一次，去云端构建列表看是否出现新构建。

### 路线 B：Workers + 静态资源（Workers Builds，2026-10 实战验证）

新建的 Cloudflare 项目多半是这条：站点是 Workers 静态资源（`wrangler.jsonc` 里的 `assets`），构建与部署都由 **Workers Builds** 托管。

1. **连接 Git 仓库**：Workers 项目 → 设置 → 构建 → 连接 GitHub 仓库，填仓库、生产分支（`main`）；**非生产分支构建关掉**，否则开 PR 也上线。
2. **构建命令** 填 `node update.js --no-deploy`，**部署命令** 填 `npx wrangler deploy`（仓库里放好 `wrangler.jsonc`，`assets` 指向站点目录；`wrangler` 写进 `devDependencies`）。
3. **建部署挂钩**：同一页 → 部署挂钩 → 添加（如 `cron-daily`，选 `main` 分支），复制面板给出的完整 URL，不要手工拼。
4. **Cron Worker**：同路线 A 第 4 步，`DEPLOY_HOOK_URL` 填第 3 步的地址，`[triggers] crons` 按 UTC 写。
5. **校验失败就不换线上**：构建命令非 0 退出 → 本次构建失败 → 线上保持上一个成功构建。
6. **核对**：面板构建列表看每次构建的完整日志；「push 自动构建成功 + Cron 触发的构建成功」两条都绿才算通。

#### 路线 B 实测踩过的坑（照抄可避）

- **脚本里写死本地路径是头号杀手**：`C:\Users\...\Desktop\站点` 在云端根本不存在，构建目录是临时克隆目录，第一轮构建直接失败。全部改成 `path.join(__dirname, ...)`。
- **构建命令别自己部署**：用 `--no-deploy`，否则和「部署命令」`npx wrangler deploy` 重复上线甚至互相打架。
- **接了 Git 集成的 Workers 项目，push 到生产分支会自动构建部署**，改脚本时推送即上线——先在本地 `node update.js --no-deploy` 试跑，再推。
- 部署挂钩只触发「构建」，不会帮你抓数据；抓取必须在构建命令里。
- 站点明明是 Workers，却在 Pages 标签里找 Deploy hooks，会一直找不到——先按上面的表认清项目类型。
- 免费版构建次数/时长有限额，cron 别设成几分钟一次；出网是数据中心 IP，原站风控可能 403，先手动触发一次试跑。

cron 一律 **UTC**：北京 09:00 写 `0 1 * * *`，每两天一次写 `0 3 */2 * *`，每周一次写 `0 1 * * 1`。改频率就改这一行再 `npx wrangler deploy`；快照型记得同步 `PAGE_TTL`。

### Cloudflare 通用踩坑（照抄可避）

- cron 是 UTC，别按本地时间写；整点拥挤时 Cloudflare 可能延迟几分钟触发，别当准点闹钟。
- 部署挂钩（Pages 的 Deploy Hook、Workers 的部署挂钩）只触发「重新构建」，不会帮你抓数据——所以抓取步骤必须写在云端构建命令里，否则每次都只是重建旧内容。
- 密钥（部署挂钩 URL、Token、`REFRESH_TOKEN`）用 `wrangler secret put` 或面板环境变量，不要写进 `wrangler.toml` 的明文 `vars`；`vars` 对账号里有读权限的人都可见。
- Worker 没有持久文件系统：`update-log.txt`、`raw/`、`backup/` 这些本地概念只在构建过程里成立；想在 Worker 侧留状态就写 KV/D1/R2。
- Worker 的 CPU 时间和子请求数有硬限制（免费额度很紧），别在 Worker 里跑页面重建或大批量抓取，重活留给构建；快照型要控制并发与总时长。
- `waitUntil` 只保 30 秒左右：快照型一次刷不完就分批轮转，或调低单页间隔、提高并发，别指望它在后台跑十分钟。
- 免费版构建次数有限，别把 cron 设成几分钟一次。
- 云端出网是数据中心 IP，原站风控可能 403 或弹验证码。先手动触发一次试跑，被拦就用 Cloudflare Browser Rendering（`@cloudflare/puppeteer` + `[browser]` 绑定）走真浏览器，或改用能通过风控的方案。
- 站点源码同时在 GitHub 里、又想统一在 Cloudflare 触发：让 Worker 调 GitHub API 的 `repository_dispatch` 触发仓库 workflow 也可以，但那就不是纯 Cloudflare 了，二选一别重复跑。

## GitHub Actions 云端定时（站点部署在 GitHub 时）

首选 GitHub Actions schedule，前提是站点源码已在 GitHub 仓库里。

1. 新建 `.github/workflows/update.yml`：`on: schedule`（cron，**UTC 时间**，北京时间 9 点写 `0 1 * * *`；每两天同步写 `0 3 */2 * *`）+ 一个 `workflow_dispatch` 方便手动试跑。可直接拷 `assets/workflow-update.yml`。
2. 关键配置：`permissions: contents: write`（要提交回仓库时）、`actions/checkout`、`actions/setup-node`，然后 `node update.js`；需要改数据文件回仓库的话，用 `GITHUB_TOKEN` 提交推送。
3. **密钥走 Secrets**，绝不出现在仓库里：`CLOUDFLARE_API_TOKEN`、`VERCEL_TOKEN` 等存进 Settings → Secrets，工作时通过环境变量注入，`update.js` 从 `process.env` 读，本地没设置时回退到本地配置。
4. 部署命令换成云端可见的写法，例如 `npx wrangler deploy`（用 `CLOUDFLARE_API_TOKEN` + 账号 ID 环境变量），别依赖本地的 `wrangler login` 状态。
5. **失败可感知**：Actions 里任务失败会发邮件，也可以在最后一步 `if: failure()` 里加提示；`update-log.txt` 作为日志或 artifact 上传。
6. 备选：Cloudflare Workers Cron Triggers / Vercel Cron。只适合**纯 fetch 抓取 + 接口部署**的站，没有本地文件系统和构建脚本这一层，数据得放 KV/D1 或每次从仓库拉；JS 渲染页面靠 Cloudflare Browser Rendering API。

### GitHub Actions 踩过的坑（照抄可避）

- cron 一律 UTC，且 GitHub 定时任务高峰期可能延迟几分钟到半小时，别拿它当准点闹钟。
- 公开仓库 60 天无提交活动，schedule 会被自动停用；`workflow_dispatch` 手动跑一次即可唤醒，或让 workflow 定期自己提交日志保活。
- 云端是数据中心 IP，原站风控可能直接 403 或弹验证码。先在 Actions 里 `workflow_dispatch` 试跑一次，被拦就说明这站得换方案。
- 需要浏览器渲染时用仓库的 `npx playwright install --with-deps chromium`（ubuntu-latest），不要指望云上有本地 Chrome。
- 跑完只改了 workflow 工作区的话，站点是直接部署的没问题；但如果页面文件要留在仓库里，记得把改动提交回仓库，否则下次运行又是旧的。

## 用到别的技能时

- 网站还没复刻：先走 `clone-website` 技能把站建好、链接站内化，再回来做自动更新。
- 要把这套流程沉淀/改技能：走 `skill-creator`。

## 文件

- `assets/update-template.js` — 通用更新脚本模板（含备份、只抓新增、校验、部署、线上校验、日志）；云端定时下用 `--no-deploy`，只抓取+构建+校验。
- `assets/snapshot-worker.js` — **整页快照 Worker 模板**：访客读 KV 快照、未命中实时回源、每两天 Cron 全量回刷清单里全部页面、回源失败回退本地副本，带 `x-snapshot` 响应头便于排查。
- `assets/build-pages-list.ps1` — **快照型页面清单生成脚本**：扫站点目录生成 `src/pages.js`，新增页面后重跑即纳入全量刷新。
- `assets/cron-worker.js` — Cloudflare Cron Worker 模板：定时 POST 部署挂钩，可选先比对原站指纹（需 KV）再决定是否重建。
- `assets/wrangler.toml` — Cloudflare Cron 配置模板（UTC cron 表达式 + vars/secret 约定）。
- `assets/workflow-update.yml` — GitHub Actions 云端定时模板（schedule + workflow_dispatch + Secrets + 可选提交回仓库）。
- `evals/evals.json` — 触发用例。
- 真实完整样板：`<桌面>\hellogithub-clone\update.js`（HelloGitHub 镜像站，重建型，60 条数据实战版）；`<桌面>\kaiyuanbang-clone\src\worker.js` + `src\pages.js`（开源榜镜像站，快照型，88 个页面、每两天全量回刷实战版）。改别的站时对照它们填 CONFIG 最省事。
