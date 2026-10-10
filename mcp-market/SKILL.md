---
name: "MCP市场"
description: "查找并配置 MCP 服务器。用户说「MCP 市场」「挂个 MCP」「给我加工具」时用。"
---

# Skill：MCP 市场

## 触发场景
- 用户说「MCP 市场」「接个 MCP」「挂个 MCP 服务器」「给我加工具」时启用。
- 适用条件：为支持 MCP 的宿主程序（Claude Desktop、Codex、CC Switch 等）找并配置 MCP 服务器。
- 来源：2026-10 用户要求把 MCP 市场检索与配置固化成技能。

## 前置确认
- **自动获取（不要问用户）**：注册表条目、传输方式、依赖命令自己查。
- **需要问用户的情况**：写入 MCP 配置文件前确认一次，并先备份原文件。

## 执行步骤
1. 检索候选：官方 MCP Registry、Smithery、mcp.so、GitHub `awesome-mcp-servers`。
2. 每条给：名称 / 能力 / 传输方式（stdio、SSE、HTTP）/ 是否需要 API Key / 风险点。
3. 用户选定后写好启动命令（npx / uvx / docker）与 JSON 配置片段；改配置前备份。
4. 提示重启宿主程序生效，并回 `README.md` 索引补一行。

## 常见坑
- 需要密钥的一律让用户自己填，不要写进技能文件、配置示例或聊天记录。
- 宿主不支持 MCP 时配置无法生效，只能存着备用，别报成已完成。
