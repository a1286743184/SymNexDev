Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScanIntervalSeconds = 10

$scriptDir = $PSScriptRoot

$vaultRoot = $null
$cur = $scriptDir
for ($i = 0; $i -lt 12; $i++) {
  if (Test-Path -LiteralPath (Join-Path $cur ".obsidian")) { $vaultRoot = $cur; break }
  $parent = Split-Path -Parent $cur
  if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $cur) { break }
  $cur = $parent
}
if ([string]::IsNullOrWhiteSpace($vaultRoot)) { $vaultRoot = (Get-Location).Path }

$mainScript = Join-Path $scriptDir "task-reminder.ps1"
$configRel = "08-科技树系统/01-OB_LifeOS_Build/00-通用模块库/task-reminder/task-reminder.config.json"

function Append-RunLogLine([string]$absLogPath, [string]$line) {
  $dir = Split-Path -Parent $absLogPath
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [System.IO.File]::AppendAllText($absLogPath, $line + "`r`n", [System.Text.Encoding]::UTF8)
}

$logDir = Join-Path $scriptDir "log"
$lastSignature = $null
$lastYmd = ""

function Get-LogPathByDay([string]$baseDir, [DateTime]$dt) {
  $ymd = $dt.ToString("yyyyMMdd")
  return [ordered]@{
    ymd = $ymd
    path = (Join-Path $baseDir ("task-reminder{0}.log" -f $ymd))
  }
}

function Read-LastSignature([string]$absLogPath) {
  if (-not (Test-Path -LiteralPath $absLogPath)) { return $null }
  $tail = Get-Content -LiteralPath $absLogPath -Tail 80 -ErrorAction SilentlyContinue
  if ($null -eq $tail) { return $null }
  $lines = @($tail | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($lines.Count -eq 0) { return $null }
  $last = [string]$lines[$lines.Count - 1]
  $idx = $last.IndexOf(" | ")
  if ($idx -lt 0) { return $null }
  return $last.Substring($idx + 3).Trim()
}

while ($true) {
  $loopStart = Get-Date
  try {
    $result = & $mainScript -VaultRoot $vaultRoot -ConfigPath $configRel
    $scan = $null
    if ($null -ne $result) {
      $arr = @($result)
      $scan = ($arr | Where-Object { $_ -and $_.kind -eq "task_reminder_scan" } | Select-Object -Last 1)
    }
    if ($null -ne $scan) {
      $logInfo = Get-LogPathByDay $logDir $loopStart
      $ymd = [string]$logInfo.ymd
      $runLogPath = [string]$logInfo.path

      if ($ymd -ne $lastYmd) {
        $lastYmd = $ymd
        $lastSignature = Read-LastSignature $runLogPath
      }

      $foldersShort = ""
      $filesShort = ""
      try { $foldersShort = (@($scan.folders) -join "; ") } catch { $foldersShort = "" }
      try { $filesShort = (@($scan.files) -join "; ") } catch { $filesShort = "" }

      $signature = ("folders=[{0}] | files=[{1}] | open={2} | open_sent={3}" -f $foldersShort, $filesShort, $scan.open_tasks, $scan.open_tasks_already_sent)
      if ($signature -ne $lastSignature) {
        $line = ("{0} | {1}" -f $scan.ts_local, $signature)
        Append-RunLogLine $runLogPath $line
        $lastSignature = $signature
      }
    } else {
      $logInfo2 = Get-LogPathByDay $logDir $loopStart
      $runLogPath2 = [string]$logInfo2.path
      $sig2 = "scan_no_summary"
      if ($sig2 -ne $lastSignature) {
        Append-RunLogLine $runLogPath2 ("{0} | {1}" -f $loopStart.ToString("s"), $sig2)
        $lastSignature = $sig2
      }
    }
  } catch {
    $logInfo3 = Get-LogPathByDay $logDir $loopStart
    $runLogPath3 = [string]$logInfo3.path
    $sig3 = ("scan_error | {0}" -f $_.Exception.Message)
    if ($sig3 -ne $lastSignature) {
      Append-RunLogLine $runLogPath3 ("{0} | {1}" -f $loopStart.ToString("s"), $sig3)
      $lastSignature = $sig3
    }
  }
  Start-Sleep -Seconds $ScanIntervalSeconds
}
