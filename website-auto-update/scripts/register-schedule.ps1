# Register (or update) a scheduled task that runs a website update script.
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File register-schedule.ps1 `
#     -ProjectPath "C:\path\to\project" -DaysInterval 2 -At 9am
# Notes:
#   - If the task exists, its action/trigger are updated in place (no duplicates).
#   - Never put spaced paths into schtasks /TR: it splits on spaces and fails with 0x80070002.
#   - Output is English on purpose (PowerShell 5.1 misreads BOM-less UTF-8 Chinese).
#   - Wrap -Argument values containing '+' in parentheses, otherwise PowerShell
#     parses the expression as extra positional arguments.
param(
  [Parameter(Mandatory = $true)][string]$ProjectPath,
  [string]$Script = 'update.js',
  [string]$TaskName = '',
  [int]$DaysInterval = 1,
  [string]$At = '9am'
)
$ErrorActionPreference = 'Stop'

$ProjectPath = (Resolve-Path -LiteralPath $ProjectPath).Path
$scriptPath = Join-Path $ProjectPath $Script
if (-not (Test-Path -LiteralPath $scriptPath)) { throw "Script not found: $scriptPath" }
if (-not $TaskName) { $TaskName = (Split-Path $ProjectPath -Leaf) + '-Auto-Update' }

$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = 'C:\Program Files\nodejs\node.exe' }
if (-not (Test-Path -LiteralPath $node)) { throw "node.exe not found" }

$argLine = '"' + $scriptPath + '"'
$action = New-ScheduledTaskAction -Execute $node -Argument $argLine -WorkingDirectory $ProjectPath
$trigger = New-ScheduledTaskTrigger -Daily -DaysInterval $DaysInterval -At $At
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 2)

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
  Set-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings | Out-Null
  $mode = 'updated'
} else {
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description ("Auto sync website content: " + $ProjectPath) | Out-Null
  $mode = 'created'
}

$info = Get-ScheduledTask -TaskName $TaskName | Get-ScheduledTaskInfo
Write-Output ("Task " + $mode + ": " + $TaskName)
Write-Output ("  script   : " + $scriptPath)
Write-Output ("  every    : " + $DaysInterval + " day(s) at " + $At)
Write-Output ("  next run : " + $info.NextRunTime)
Write-Output ("  start when available: yes")
