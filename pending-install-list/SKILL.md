---
name: "待装清单"
description: "Daisy 插件接口上线后要装的插件与技能清单。用户说「待装清单」「插件清单」「接口好了」时用。"
---

# 待装清单（等 Daisy 插件接口上线后执行）

> 背景：2026-10-09 确认 Daisy 本体目前没有外部插件加载接口，只认 `Daisy-Skills` 里的纯文本技能和 `%APPDATA%\Daisy\tools` 内置工具。
> 接口上线后：按本清单逐条安装，先装 1 条验证，再批量；每条装完回 `README.md` 补一行。

## 一、先验证接口状态
1. 检查 Daisy 版本与更新（`daisy-updater`），确认是否已支持插件目录或 MCP 客户端。
2. 若支持，找出插件目录；**没有目录就不要硬塞文件**，直接告诉用户「接口还没到位」。

## 二、技能类（纯文本，接口一通即可用）
| 名称 | 仓库 | 安装方式 | 密钥 |
|---|---|---|---|
| Anthropic 官方技能 | `anthropics/skills` | `/plugin marketplace add anthropics/skills` | 不需要 |
| superpowers | `obra/superpowers` | 市场添加后按 README 装 | 不需要 |
| 安全筛选技能集 | `trailofbits/skills-curated` | 市场添加 | 不需要 |
| Microsoft 技能集 | `microsoft/skills` | `npx skills add` 挑选 | 不需要 |
| 中文精选导航 | `laolaoshiren/claude-code-skills-zh` | 仅作检索参考 | 不需要 |

## 三、MCP 类（需要宿主支持 MCP）
| 名称 | 仓库 | 用途 | 密钥 |
|---|---|---|---|
| PowerShell MCP | `yotsuda/PowerShell.MCP` | Windows 自动化，调用 10000+ PowerShell 模块 | 不需要（本地执行，权限大，谨慎） |
| mcp-use | `mcp-use/mcp-use` | 自建 MCP Server 的 SDK | 视服务而定 |
| LangChain 插件 | `langchain-ai/langchain-plugins` | 文档检索 / API Reference | 部分需 OAuth |
| OCR MCP（Tesseract / PaddleOCR 类封装） | 候选：`PaddlePaddle/PaddleOCR` 的 MCP 封装、社区 `tesseract` OCR MCP —— **装前必须核实仓库真实性** | 从本地图片、截图、扫描件、发票提取文字 | 不需要（本地）或见服务说明 |
| **视觉/多模态 MCP（首选，用户已定）** | **`zai-mcp-server`（智谱「视觉理解 MCP」，官方文档：docs.bigmodel.cn/cn/coding-plan/mcp/vision-mcp-server）** | 直接"看懂"本地图片/视频内容：画面、场景、界面、报错；8 个工具含 `video_analysis` | 用户自定义 Key：`Z_AI_API_KEY` 填自己的智谱 GLM Coding Plan 套餐 Key（个人版/团队版，**普通开放平台 Key 不通用**）+ `Z_AI_MODE` 二选一（`ZHIPU`=国内 bigmodel / `ZAI`=海外 z.ai）；包无开源仓库，两个变量之外无自定义 baseURL |
| 视觉/多模态 MCP（备选 A） | `JochenYang/luma-mcp` | 多模型聚合，单工具 `image_understand`，**无视频能力**；可挂 GLM-4.6V / Qwen3-VL / DeepSeek-OCR / 豆包 / 混元 | 对应厂商 Key |
| 视觉/多模态 MCP（备选 B） | `ironsheep/image_tools_mcp` | 注意定位：**不做语义理解**，只输出数值信息（尺寸、色值、形状坐标、OCR 文字），适合照图重画 / 量 UI 尺寸 / 读小字；Windows 上 OCR 需另装 Tesseract；7 星小项目 | 不需要 |
| 本地零 API 视觉路线 | Ollama + Qwen2.5-VL 等开源视觉模型 + 本地 MCP | 全离线、不花钱，代价是吃显存、慢 | 不需要 |
| 文件系统 MCP | 官方 `filesystem` server | 读写本地图片/文档目录 | 不需要 |
| 视频理解 MCP（国内优先） | `jackdark425/aigroup-video-mcp` | 阿里云 DashScope（可挂通义 Qwen-VL）驱动，本地路径或 URL 分析视频，5 个工具（分析 / 摘要 / 场景 / 自定义提示词 / 源校验） | `DASHSCOPE_API_KEY` |
| 视频理解 MCP（Gemini 路线） | `ugarchance/mcp-gemini-video-understanding`（npm：`@ugarchance/mcp-gemini-video-understanding`） | 本地视频 + YouTube 链接，4 个专用工具（Bug 复现 / 设计稿 / 教程 / 响应式问题），支持缓存 | `GEMINI_API_KEY` |
| 视频理解 MCP（Gemini 路线 2） | `samihalawa/video-analysis-mcp` | 本地文件 + URL 视频分析、质量与节奏评估 | `GOOGLE_API_KEY`（或 Gemini Key） |
| **在线视频：TwelveLabs MCP Server（唯一成体系的云端视频索引）** | TwelveLabs 官方 MCP（见 twelvelabs.io/blog/twelve-labs-mcp-server） | 把在线视频**索引进云端**后做自然语言搜索、分析、摘要、跨视频检索；最接近"真正理解在线视频" | TwelveLabs API Key（按索引小时计费） |
| 在线视频：YouTube 专用 | `Aditya Bawankule` 的 YouTube Analysis MCP（yt-mcp-server） | 直接吃 YouTube URL 做内容分析 | 视项目 README（多为自建 Key） |
| 在线视频：B 站信息类 | `bilibili-video-info-mcp`（mcp.so 收录） | **只取字幕、弹幕、评论文本**，不解析画面 | 不需要 |
| 在线视频：YouTube 数据类 | Stophy（YouTube 数据 MCP） | 搜索视频、获取转录、读评论、看频道与播放列表 | 视服务说明 |
| 图+视频一起做 | `rentapad/image-mcp-server-gemini` | 图片与视频共用一套 Gemini 2.0 Flash 管线 | Gemini Key |
| 企业级视频分析 | NVIDIA `VSS` 的 Video-Analytics-MCP | 大规模视频检索/摘要，**需先自部署 VSS**，家用过重 | 见 NVIDIA 文档 |
| 商业视频解析 | mcpmarket 上的 `Video Parser` | 视觉 + NLP 检索，偏商业授权 | 见服务说明 |
| 自建路线 | 百炼 / DashScope 视频理解接口 + `mcp-use` 薄封装 | 完全自定义（抽帧 fps、模型、提示词都自己控），无第三方依赖风险 | `DASHSCOPE_API_KEY` |

### 用户已确认的选择（2026-10-09）
- 视觉类 MCP **首选智谱 `zai-mcp-server`**，接口到位后第一个装它并做真机验证。
- 2026-10-09 追加确认：就用智谱这一个，**Key 走用户自定义**（用户自己在配置里填 `Z_AI_API_KEY` + `Z_AI_MODE`，Daisy 不接触 Key 本身）；智谱包不支持自定义厂商/baseURL，如需换厂商才退回 luma-mcp。
- 视频理解只有智谱这套有（`video_analysis`，MP4/MOV/M4V，本地视频限 8MB）；luma-mcp 无视频能力。

### 视频理解类候选核实结果（2026-10-09 检索）
- **结论：没有大厂官方 MCP**，能查到的都是社区小项目，星数普遍 0~3，装前必须逐条核实仓库真实性、权限与 Key 用法。
- **`aigroup-video-mcp`（国内首选备选）**：MIT；Python 3.8+，`pip install aigroup-video-mcp`，`python -m aigroup_video_mcp.main serve`；支持 MP4/AVI/MOV/MKV/WebM/FLV；默认上限 **100MB / 1 小时时长**，可调（`VIDEO__MAX_FILE_SIZE`、`VIDEO__MAX_DURATION`）；带域名白名单、限流等安全项；缺点是仅 3 星、最后更新 2025-08。
  - 优势：国内网络、走百炼，上传体积比智谱 8MB 宽松十几倍 → 长视频可直接送，不必先切片。
  - 风险：小项目、维护可能停更；依赖 DashScope Key 与网络连通。
- **`@ugarchance/mcp-gemini-video-understanding`**：已发 npm，TS 项目，工具带 `output_file` 缓存（重复分析不重复计费）；支持 9 种格式；**超过 20MB 自动走 Gemini File API**，耗时更长；限制：YouTube 仅公开视频、受 Google API 速率限制。
  - 风险：需 Google API Key、国内需可访问 Google；仓库 0 星、文件路径对 Unicode 做过多轮修补（说明踩过坑）。
- **NVIDIA VSS Video-Analytics-MCP**：企业级方案，必须部署 VSS 本体，本机使用过重，暂不列为候选安装项，仅登记。
- **与智谱的分工建议**：小体积（≤8MB）短视频直接用智谱 `video_analysis`；超过 8MB 的长视频，走 `aigroup-video-mcp` 或先用 ffmpeg 切片再喂智谱。

### 在线视频（URL）支持情况复核（2026-10-09，用户提出"没有理解在线视频的 MCP"）
- 复核结论：**有，但不是能直接"看懂任意网页视频"的那种**，实际分三档——
  1. **真能直接吃链接**：Gemini API 原生支持把 YouTube 网址当 `video` 传（`uri` 字段，支持按 `start_offset/end_offset` 只看某一段），所以凡走 Gemini 的 MCP（`mcp-gemini-video-understanding` 等）都能直接分析 YouTube 公开视频，**无需先下载**；TwelveLabs 则把在线视频索引进自家云端后做检索与摘要，覆盖面更广但按索引时长计费。
  2. **只吃"直链"**：`aigroup-video-mcp` 支持 URL，但走域名白名单、本质是可直接下载的 mp4 直链，网页播放页地址通常不是直链。
  3. **只取文本、不看画面**：`bilibili-video-info-mcp`（B 站字幕/弹幕/评论）、Stophy（YouTube 转录/评论/频道）——属于"信息抓取"，不是视频画面理解。
- **中文平台（B 站 / 抖音 / 西瓜等）目前没有能直接理解画面的 MCP**：这些站点的页面链接需要解析后才能取流。
- **因此本项目通用解法**：Daisy 本体已有 `download_media`（yt-dlp，支持 YouTube、Bilibili、抖音等数千站点），**先下载到本地 → 用 `trim_video`/`convert_video` 切片转码 → 再送支持视频的服务**。这条路不依赖任何新插件，现在就能跑通；接口到位后可再加一个"链接直送"型 MCP 省掉下载步骤。
- 尚不覆盖的场景：直播流、需登录/会员才能看的视频、DRM 加密内容——这三类暂无可用的 MCP 方案。

### B 站实测：不下载能不能"看"？（2026-10-09 真机验证）
测试对象：B 站《18 万 star 的 AI 编程 skill，我重度用了一个月》`BV1A7gf6AEfk`（时长 954 秒）。
- 方法：取该视频真实直链（`upos-sz-mirrorcos.bilivideo.com/.../40334983714-1-192.mp4`），再模拟云端服务抓取。
- 结果：**无 Referer 抓取 → HTTP 403；补上 `Referer: https://www.bilibili.com/` → HTTP 200**。同一链接两种结果，说明 B 站是防盗链拦截，不是链接失效。
- 附加事实：直链带 `deadline` 签名参数，约 1 小时后过期，不可长期复用。
- **结论：云端视频模型（智谱 / 通义 / Gemini 等）服务器端默认不带 B 站 Referer，直接送 B 站链接一定取不到画面；而 Gemini 又只认 YouTube 网址，不认 B 站 → "不下载直接看 B 站视频"目前走不通。**
- 可行替代：① `download_media` 下载后分析（画面+语音都能看，1080P/大会员清晰度需浏览器 Cookie）；② 只取字幕/弹幕文本回答"讲了什么"（看不到画面）；③ 自己搭中转代理转发 B 站流再送模型（技术上可行，但属自建服务，不在 MCP 生态内）。
- 本机环境记录：`yt-dlp` 未安装（不在 PATH，`%APPDATA%\Daisy` 下也无副本），实际下载走 `download_media` 自动拉取。

### 备注：不依赖插件的替代路线（现在就能用）
- 屏幕上的画面：`screen_snapshot` + 截图识别，已实测可读出图片内容与界面文字。
- 本地图片零配置：用系统看图工具打开该图，再截图识别。
- 在线视频：`download_media`（yt-dlp）先落地到本地，再分析；长视频先 `trim_video` 切片。
- 本地视频现在能做：`trim_video` / `convert_video`（ffmpeg，首次自动下载）切片转码，再送支持视频的服务。
- Windows 本机 OCR：`Windows.Media.Ocr`（PowerShell 调用）可离线识别图片文字，属临时方案，接口就位后仍优先用 OCR MCP。

## 四、安装纪律
- 每条装前：确认来源可信、看过 README 的权限说明；仓库名对不上就停下问用户，不许凭记忆瞎装。
- 需要密钥的：只让用户自己在配置里填，绝不写进技能文件或聊天记录。
- 装完必须真跑一次验证（OCR 用一张真图、视觉用一张真照片、视频用一段真视频），再报告「已完成」，不许只下载就报完成。
- 装失败或接口缺失：如实说明障碍，不要重复原样重试。

## 五、变更记录
- 2026-10-09：按用户要求补入 OCR 与视觉/多模态 MCP 两类，并写明与「截图识别」「Windows 本机 OCR」的取舍。
- 2026-10-09：视觉类定为三级优先（智谱 zai-mcp-server 首选 / luma-mcp 备选 / image_tools_mcp 仅作测量工具），记录用户已确认选择。
- 2026-10-09：补记智谱方案的 Key 规则（只认 GLM Coding Plan 套餐 Key、`Z_AI_MODE` 二选一、无自定义 baseURL）与 luma-mcp 无视频能力；确认智谱为最终选择。
- 2026-10-09：按用户要求补入「视频理解类 MCP 候选」共 7 项（含自建路线）与核实结果，记录国内首选备选 `aigroup-video-mcp`、Gemini 路线两条、VSS 仅登记不安装，并补充分工建议与本地视频先用 ffmpeg 的替代路线。
- 2026-10-09：用户指出清单缺「在线视频」项，复核后补入 `TwelveLabs MCP`、YouTube Analysis MCP、`bilibili-video-info-mcp`、Stophy 四条登记，并写明三档支持程度（Gemini 直吃 YouTube 链接 / 仅直链 / 仅文本）、中文平台无画面理解方案、以及「yt-dlp 先下载再分析」的现有通用路线与直播/会员/DRM 三类空白。
- 2026-10-09：对 `BV1A7gf6AEfk` 做真机验证，实测出「无 Referer 403 / 带 Referer 200 + 直链 1 小时过期」，据此确认"不下载直接看 B 站"当前不可行，并记录三条替代路线与本机 yt-dlp 未安装的事实。
