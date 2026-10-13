# 生成「页面清单」脚本 —— 由技能 website-auto-update 提供
# 用途：整页快照方案里，Cron 全量回刷就是照这份清单刷的。
#       清单必须覆盖全部页面（每个栏目、每个 tab、每一期、每个详情页）；
#       复刻/新增了页面后，重跑本脚本，新页面才会被 Cron 主动更新。
#
# 用法（PowerShell）：
#   .\build-pages-list.ps1 -SiteDir "C:\path\to\项目\site" -Out "C:\path\to\项目\src\pages.js"
#
# 生成结果形如：
#   export const PAGES = [
#     '/zh-cn/about.html',
#     ...
#   ];
# worker 里 import { PAGES } from './pages.js'; 即可（wrangler 打包会内联）。

param(
  [Parameter(Mandatory = $true)][string]$SiteDir,
  [string]$Out = ''
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $SiteDir)) { throw "站点目录不存在：$SiteDir" }
if ([string]::IsNullOrWhiteSpace($Out)) { $Out = Join-Path (Split-Path -Parent $SiteDir) 'src\pages.js' }

$root = (Resolve-Path -LiteralPath $SiteDir).Path.TrimEnd('\')
$prefix = $root.Length + 1

$list = Get-ChildItem -LiteralPath $root -Recurse -File -Filter *.html |
  ForEach-Object {
    $rel = '/' + $_.FullName.Substring($prefix).Replace('\', '/')
    if ($rel -ne '/index.html') { $rel } # 首页另有快照键，不进详情页清单
  } |
  Sort-Object -Unique

$line = [Environment]::NewLine
$body = 'export const PAGES = [' + $line + (($list | ForEach-Object { "  '$_'," }) -join $line) + $line + '];' + $line

$outDir = Split-Path -Parent $Out
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
Set-Content -LiteralPath $Out -Value $body -Encoding UTF8

Write-Output ("页面清单已生成：$Out")
Write-Output ("详情页数量：$($list.Count)（不含首页）")
$list | Select-Object -First 3
Write-Output '...'
$list | Select-Object -Last 3
Write-Output '注意：复刻或新增页面后要重跑本脚本，再 npx wrangler deploy，新页面才会进入每两天的全量回刷。'
