param(
  [string]$VaultRoot = "",
  [string]$ConfigPath = "",
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

<# 
电脑端本地通知：当前不启用（脚本只负责推送到 NTFY，由手机端接收通知）。
未来如需开启“电脑弹窗/Toast”类通知，可在此处新增开关并实现对应通知发送逻辑；为避免引入额外依赖，目前不启用。
#>

function Resolve-AbsPath([string]$vaultRootAbs, [string]$relOrAbs) {
  if ([string]::IsNullOrWhiteSpace($relOrAbs)) { return "" }
  if ([System.IO.Path]::IsPathRooted($relOrAbs)) { return $relOrAbs }
  return (Join-Path $vaultRootAbs $relOrAbs)
}

function Load-JsonFile([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { return $null }
  $raw = Get-Content -LiteralPath $path -Raw -ErrorAction Stop
  try { return ($raw | ConvertFrom-Json -ErrorAction Stop) } catch { return $null }
}

function Save-JsonFile([string]$path, $obj) {
  $json = [string]($obj | ConvertTo-Json -Depth 15)
  $dir = Split-Path -Parent $path
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [System.IO.File]::WriteAllText($path, $json, [System.Text.Encoding]::UTF8)
}

function Write-TextAtomicUtf8([string]$path, [string]$content) {
  $dir = Split-Path -Parent $path
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $tmp = Join-Path $dir (".tmp.task-reminder." + [Guid]::NewGuid().ToString("n") + ".txt")
  $bak = $path + ".task-reminder.bak"
  [System.IO.File]::WriteAllText($tmp, $content, [System.Text.Encoding]::UTF8)
  if (Test-Path -LiteralPath $path) {
    [System.IO.File]::Replace($tmp, $path, $bak, $true) | Out-Null
  } else {
    Move-Item -LiteralPath $tmp -Destination $path -Force
  }
}

function Get-LocalISODate([DateTime]$dt) { return $dt.ToString("yyyy-MM-dd") }
function Get-UtcUnix([DateTime]$dt) { return [int][DateTimeOffset]::new($dt.ToUniversalTime()).ToUnixTimeSeconds() }

function Get-Sha1Hex([string]$s) {
  $sha1 = [System.Security.Cryptography.SHA1]::Create()
  try {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($s)
    $hash = $sha1.ComputeHash($bytes)
    return ($hash | ForEach-Object { $_.ToString("x2") }) -join ""
  } finally { $sha1.Dispose() }
}

function Get-AuthHeaders($auth) {
  $headers = @{}
  if ($null -eq $auth) { return $headers }
  $t = [string]$auth.type
  if ($t -eq "bearer" -and -not [string]::IsNullOrWhiteSpace($auth.token)) {
    $headers["Authorization"] = "Bearer $($auth.token)"
  } elseif ($t -eq "basic" -and -not [string]::IsNullOrWhiteSpace($auth.username)) {
    $pair = "$($auth.username):$($auth.password)"
    $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair))
    $headers["Authorization"] = "Basic $b64"
  }
  return $headers
}

function Invoke-NtfyPublish([string]$server, [string]$topic, $authHeaders, $payload) {
  $base = $server.TrimEnd("/")
  $uriBase = "$base/$topic"

  $title = ""
  $message = ""
  $priority = ""
  $tags = @()
  $actions = ""

  if ($payload -is [System.Collections.IDictionary]) {
    if ($payload.Contains("title")) { $title = [string]$payload["title"] }
    if ($payload.Contains("message")) { $message = [string]$payload["message"] }
    if ($payload.Contains("priority")) { $priority = [string]$payload["priority"] }
    if ($payload.Contains("tags")) { $tags = @($payload["tags"]) }
    if ($payload.Contains("actions")) { $actions = [string]$payload["actions"] }
  } else {
    if ($null -ne $payload.title) { $title = [string]$payload.title }
    if ($null -ne $payload.message) { $message = [string]$payload.message }
    if ($null -ne $payload.priority) { $priority = [string]$payload.priority }
    if ($null -ne $payload.tags) { $tags = @($payload.tags) }
    if ($null -ne $payload.actions) { $actions = [string]$payload.actions }
  }

  $qp = New-Object System.Collections.Generic.List[string]
  if (-not [string]::IsNullOrWhiteSpace($title)) { $qp.Add("title=$([System.Web.HttpUtility]::UrlEncode($title))") }
  if (-not [string]::IsNullOrWhiteSpace($priority)) { $qp.Add("priority=$([System.Web.HttpUtility]::UrlEncode($priority))") }
  $tagsClean = @($tags | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($tagsClean.Count -gt 0) { $qp.Add("tags=$([System.Web.HttpUtility]::UrlEncode(($tagsClean -join ',')))") }
  if (-not [string]::IsNullOrWhiteSpace($actions)) { $qp.Add("actions=$([System.Web.HttpUtility]::UrlEncode($actions))") }
  $uri = if ($qp.Count -gt 0) { $uriBase + "?" + ($qp -join "&") } else { $uriBase }

  $headers = @{}
  foreach ($k in $authHeaders.Keys) { $headers[$k] = $authHeaders[$k] }

  if ($DryRun) {
    Write-Host "[DryRun] Publish to $uri title=$title"
    return
  }

  $client = [System.Net.Http.HttpClient]::new()
  try {
    $req = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post, $uri)
    foreach ($k in $headers.Keys) { $req.Headers.TryAddWithoutValidation($k, [string]$headers[$k]) | Out-Null }
    $req.Content = [System.Net.Http.StringContent]::new($message, [System.Text.Encoding]::UTF8, "text/plain")
    $resp = $client.Send($req)
    if (-not $resp.IsSuccessStatusCode) {
      $txt = ""
      try { $txt = $resp.Content.ReadAsStringAsync().Result } catch {}
      throw "ntfy_publish_failed:$([int]$resp.StatusCode):$txt"
    }
  } finally {
    $client.Dispose()
  }
}

function Invoke-NtfyPollActions([string]$server, [string]$actionsTopic, [string]$since, $authHeaders) {
  $base = $server.TrimEnd("/")
  $u = "$base/$actionsTopic/json?poll=1"
  $useSince = ""
  if (-not [string]::IsNullOrWhiteSpace($since)) {
    if ($since -match "^\d+$") { $useSince = $since }
    elseif ($since -match "^\d+[smhdw]$") { $useSince = $since }
  }
  if (-not [string]::IsNullOrWhiteSpace($useSince)) {
    $u = "$u&since=$([System.Web.HttpUtility]::UrlEncode($useSince))"
  } else {
    $u = "$u&since=10m"
  }
  $headers = @{}
  foreach ($k in $authHeaders.Keys) { $headers[$k] = $authHeaders[$k] }
  $resp = Invoke-WebRequest -Method Get -Uri $u -Headers $headers -UseBasicParsing
  if (-not $resp) { return @() }
  $contentText = ""
  if ($resp.Content -is [byte[]]) {
    $contentText = [System.Text.Encoding]::UTF8.GetString([byte[]]$resp.Content)
  } else {
    $contentText = [string]$resp.Content
  }
  if ([string]::IsNullOrWhiteSpace($contentText)) { return @() }
  $lines = $contentText -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
  $items = @()
  foreach ($line in $lines) {
    try {
      $obj = $line | ConvertFrom-Json -ErrorAction Stop
      $items += $obj
    } catch {}
  }
  return $items
}

function Get-TimeContext {
  $now = Get-Date
  $naturalToday = (Get-Date -Hour 0 -Minute 0 -Second 0 -Millisecond 0)
  $logicalToday = if ($now.Hour -lt 3) { $naturalToday.AddDays(-1) } else { $naturalToday }
  $logicalTomorrow = $logicalToday.AddDays(1)
  return [ordered]@{
    now = $now
    naturalToday = $naturalToday
    today = $logicalToday
    todayISO = (Get-LocalISODate $logicalToday)
    tomorrow = $logicalTomorrow
  }
}

function Parse-DateISO([string]$dateStr) {
  $parts = $dateStr.Split("-")
  if ($parts.Count -ne 3) { return $null }
  $y = [int]$parts[0]
  $m = [int]$parts[1]
  $d = [int]$parts[2]
  return Get-Date -Year $y -Month $m -Day $d -Hour 0 -Minute 0 -Second 0 -Millisecond 0
}

function Parse-Clock([string]$clockStr) {
  if ($clockStr -notmatch "^\d{1,2}:\d{2}$") { return $null }
  $p = $clockStr.Split(":")
  $h = [int]$p[0]
  $m = [int]$p[1]
  if ($h -eq 24 -and $m -eq 0) { return [TimeSpan]::FromMinutes(24 * 60) }
  if ($h -lt 0 -or $h -gt 23 -or $m -lt 0 -or $m -gt 59) { return $null }
  return [TimeSpan]::FromMinutes(($h * 60) + $m)
}

function Extract-DateFromText([string]$text) {
  $m = [regex]::Match($text, "📅\s*(\d{4}-\d{1,2}-\d{1,2})")
  if (-not $m.Success) { return $null }
  return [string]$m.Groups[1].Value
}

function Extract-TimeTokenFromText([string]$text) {
  $s = [string]$text
  if ([string]::IsNullOrWhiteSpace($s)) { return $null }
  $matches = [regex]::Matches($s, "\[(\d{1,2}:\d{2}|[^\[\]\s]{1,12})\]")
  if ($null -eq $matches -or $matches.Count -le 0) { return $null }

  foreach ($m in $matches) {
    if ($null -eq $m -or -not $m.Success) { continue }
    $raw = [string]$m.Groups[1].Value
    $raw = $raw.Trim()
    if ([string]::IsNullOrWhiteSpace($raw)) { continue }
    if ($raw -match "^[xX]$") { continue }
    if ($raw -eq "学" -or $raw -eq "练") { continue }

    $norm = Normalize-TimeToken $raw $timePeriodsIndex
    if ([string]::IsNullOrWhiteSpace($norm)) { continue }
    if ($null -ne (Parse-Clock $norm)) { return $norm }
    try {
      if ($null -ne $timePeriodsIndex -and $timePeriodsIndex.tokenToPeriod.ContainsKey($norm)) { return $norm }
    } catch {}
    try {
      if ($null -ne $timeTokenMap -and $timeTokenMap.PSObject.Properties.Name -contains $norm) { return $norm }
    } catch {}
  }

  return $null
}

function Extract-TagsFromText([string]$text) {
  $re = [regex]"#([\w\u4e00-\u9fa5\-\/]+)"
  $matches = $re.Matches($text)
  $tags = @()
  foreach ($m in $matches) { $tags += [string]$m.Groups[1].Value }
  return ($tags | Select-Object -Unique)
}

function Extract-CompletionDateISO([string]$text) {
  $m = [regex]::Match($text, "✅\s*(\d{4}-\d{1,2}-\d{1,2})")
  if (-not $m.Success) { return $null }
  $raw = [string]$m.Groups[1].Value
  $dt = Parse-DateISO $raw
  if ($null -eq $dt) { return $null }
  return (Get-LocalISODate $dt)
}

function Get-TaskSourcesFromReminderPathConfigMd([string]$absConfigMd) {
  if (-not (Test-Path -LiteralPath $absConfigMd)) { throw "reminder_paths_config_not_found:$absConfigMd" }
  $raw = Get-Content -LiteralPath $absConfigMd -Raw -ErrorAction Stop
  $lines = $raw -split "\r?\n"

  $section = ""
  $folders = [System.Collections.Generic.List[string]]::new()
  $files = [System.Collections.Generic.List[string]]::new()

  foreach ($line in $lines) {
    $s = [string]$line
    if ($null -eq $s) { continue }
    $t = $s.Trim()
    if ([string]::IsNullOrWhiteSpace($t)) { continue }
    if ($t.StartsWith(">")) { continue }

    if ($t -match "^(?i)folders\s*:\s*$") { $section = "folders"; continue }
    if ($t -match "^(?i)files\s*:\s*$") { $section = "files"; continue }
    if ($t -match "^[^:]+:\s*$") { $section = ""; continue }
    if ([string]::IsNullOrWhiteSpace($section)) { continue }

    $p = $t
    $p = [regex]::Replace($p, "^\s*[-*]\s+", "")
    $p = $p.Trim()
    if ([string]::IsNullOrWhiteSpace($p)) { continue }

    if ($section -eq "folders") { $folders.Add($p) }
    elseif ($section -eq "files") { $files.Add($p) }
  }

  return [ordered]@{
    folders = @($folders | Select-Object -Unique)
    extraFiles = @($files | Select-Object -Unique)
    excludePathIncludes = @()
  }
}

function Ensure-Hashtable($obj) {
  if ($obj -is [System.Collections.IDictionary]) { return $obj }
  $h = @{}
  if ($null -eq $obj) { return $h }
  foreach ($p in $obj.PSObject.Properties) { $h[$p.Name] = $p.Value }
  return $h
}

function Get-SourceFiles([string]$vaultRootAbs, $sources, [int]$maxFiles) {
  $files = [System.Collections.Generic.List[string]]::new()
  $exclude = @()
  if ($null -ne $sources -and $null -ne $sources.excludePathIncludes) {
    $exclude = @($sources.excludePathIncludes)
  }

  $shouldExclude = {
    param([string]$rel)
    $relNorm = $rel -replace '\\', '/'
    foreach ($p in $exclude) {
      if ([string]::IsNullOrWhiteSpace($p)) { continue }
      $pNorm = ([string]$p) -replace '\\', '/'
      if ($relNorm -like "*$pNorm*") { return $true }
    }
    return $false
  }

  $folders = @()
  $extraFiles = @()
  if ($null -ne $sources) {
    $folders = @($sources.folders)
    $extraFiles = @($sources.extraFiles)
  }

  foreach ($folder in $folders) {
    if ([string]::IsNullOrWhiteSpace($folder)) { continue }
    $absFolder = Join-Path $vaultRootAbs $folder
    if (-not (Test-Path -LiteralPath $absFolder)) { continue }
    $items = Get-ChildItem -LiteralPath $absFolder -Recurse -File -Filter "*.md" -ErrorAction SilentlyContinue
    foreach ($it in $items) {
      $rel = [System.IO.Path]::GetRelativePath($vaultRootAbs, $it.FullName)
      if (& $shouldExclude $rel) { continue }
      $files.Add($it.FullName)
      if ($files.Count -ge $maxFiles) { break }
    }
    if ($files.Count -ge $maxFiles) { break }
  }

  foreach ($f in $extraFiles) {
    if ([string]::IsNullOrWhiteSpace($f)) { continue }
    $absFile = Join-Path $vaultRootAbs $f
    if (-not (Test-Path -LiteralPath $absFile)) { continue }
    $rel = [System.IO.Path]::GetRelativePath($vaultRootAbs, $absFile)
    if (& $shouldExclude $rel) { continue }
    $files.Add($absFile)
    if ($files.Count -ge $maxFiles) { break }
  }

  return @($files | Select-Object -Unique)
}

function Read-FileWithNewlineStyle([string]$absPath) {
  $bytes = [System.IO.File]::ReadAllBytes($absPath)
  $text = [System.Text.Encoding]::UTF8.GetString($bytes)
  $hasTrailingNewline = $false
  if ($bytes.Length -ge 2 -and $bytes[$bytes.Length - 2] -eq 13 -and $bytes[$bytes.Length - 1] -eq 10) { $hasTrailingNewline = $true }
  elseif ($bytes.Length -ge 1 -and ($bytes[$bytes.Length - 1] -eq 10 -or $bytes[$bytes.Length - 1] -eq 13)) { $hasTrailingNewline = $true }

  $newline = "`n"
  for ($i = 0; $i -lt $bytes.Length - 1; $i++) {
    if ($bytes[$i] -eq 13 -and $bytes[$i + 1] -eq 10) { $newline = "`r`n"; break }
    if ($bytes[$i] -eq 10) { $newline = "`n"; break }
    if ($bytes[$i] -eq 13) { $newline = "`r"; break }
  }

  return [ordered]@{ text = $text; newline = $newline; trailing = $hasTrailingNewline }
}

function Split-LinesWithStyle([string]$text, [string]$newline) {
  if ($newline -eq "`r`n") { return $text.Split(@("`r`n"), [System.StringSplitOptions]::None) }
  if ($newline -eq "`r") { return $text.Split(@("`r"), [System.StringSplitOptions]::None) }
  return $text.Split(@("`n"), [System.StringSplitOptions]::None)
}

function Join-LinesWithStyle([string[]]$lines, [string]$newline, [bool]$trailing) {
  $out = ($lines -join $newline)
  if ($trailing -and -not $out.EndsWith($newline)) { $out += $newline }
  return $out
}

function Parse-TasksFromFile([string]$absPath, [string]$vaultRootAbs) {
  $info = Read-FileWithNewlineStyle $absPath
  $newline = [string]$info["newline"]
  if ([string]::IsNullOrEmpty($newline)) { $newline = "`n" }
  $lines = Split-LinesWithStyle ([string]$info["text"]) $newline
  $tasks = [System.Collections.Generic.List[object]]::new()

  for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    $m = [regex]::Match($line, "^\s*[-*]\s+\[(?<st>[ xX])\]\s+(?<body>.*)$")
    if (-not $m.Success) { continue }
    $st = [string]$m.Groups["st"].Value
    $isCompleted = ($st -ne " ")
    $body = [string]$m.Groups["body"].Value

    $rel = [System.IO.Path]::GetRelativePath($vaultRootAbs, $absPath)
    $dateIsoRaw = Extract-DateFromText $body
    $timeToken = Extract-TimeTokenFromText $body
    $tags = Extract-TagsFromText $body
    $compISO = Extract-CompletionDateISO $body

    $tasks.Add([ordered]@{
      path = $rel
      absPath = $absPath
      lineNo = $i
      lineText = $line
      completed = $isCompleted
      dueDateRaw = $dateIsoRaw
      timeToken = $timeToken
      tags = $tags
      completionISO = $compISO
      newline = $newline
      trailing = [bool]$info["trailing"]
    })
  }

  return $tasks.ToArray()
}

function Update-TaskLineInFile([string]$vaultRootAbs, [string]$taskPathRel, [int]$lineNo, [string]$expectedLine, [scriptblock]$transformLine) {
  $abs = Join-Path $vaultRootAbs $taskPathRel
  if (-not (Test-Path -LiteralPath $abs)) { throw "file_not_found:$taskPathRel" }

  $raw = [System.IO.File]::ReadAllText($abs, [System.Text.Encoding]::UTF8)
  $hasTrailingNewline = $false
  if ($raw -match "(\r\n|\n|\r)$") { $hasTrailingNewline = $true }
  $lines = [regex]::Split($raw, "\r\n|\n|\r", [System.Text.RegularExpressions.RegexOptions]::None)

  $targetIndex = $lineNo
  $lineOk = ($targetIndex -ge 0 -and $targetIndex -lt $lines.Length -and $lines[$targetIndex].TrimEnd() -eq $expectedLine.TrimEnd())
  if (-not $lineOk) {
    $found = -1
    for ($i = 0; $i -lt $lines.Length; $i++) {
      if ($lines[$i].TrimEnd() -eq $expectedLine.TrimEnd()) { $found = $i; break }
    }
    if ($found -ge 0) { $targetIndex = $found } else { throw "task_line_not_found:$taskPathRel" }
  }

  $oldLine = $lines[$targetIndex]
  $newLine = & $transformLine $oldLine
  $lines[$targetIndex] = $newLine

  if ($DryRun) {
    Write-Host "[DryRun] Would update ${taskPathRel}:${targetIndex}"
    return
  }
  $out = ($lines -join "`n")
  if ($hasTrailingNewline -and -not $out.EndsWith("`n")) { $out += "`n" }
  Write-TextAtomicUtf8 $abs $out
}

function Get-TaskDisplayText([string]$lineText) {
  $s = [string]$lineText
  $s = [regex]::Replace($s, "^\s*[-*]\s+\[[ xX]\]\s+", "")
  $s = [regex]::Replace($s, "\s*✅\s*\d{4}-\d{1,2}-\d{1,2}.*$", "")
  $s = [regex]::Replace($s, "\s*📅\s*\d{4}-\d{1,2}-\d{1,2}", "")
  $s = [regex]::Replace($s, "\s*🔁\s*.*$", "")
  $s = [regex]::Replace($s, "\s*\[(\d{1,2}:\d{2}|[^\[\]\s]{1,12})\]\s*", " ")
  $s = [regex]::Replace($s, "\s*#([\w\u4e00-\u9fa5\-\/]+)", "")
  $s = [regex]::Replace($s, "\s+", " ").Trim()
  return $s
}

function Build-TaskReminderMessage($task, [DateTime]$deadline) {
  $taskText = Get-TaskDisplayText ([string]$task.lineText)
  return $taskText
}

function Parse-TimeTokenToClock([string]$token, $timeTokenMap) {
  if ([string]::IsNullOrWhiteSpace($token)) { return $null }
  $clock = Parse-Clock $token
  if ($null -ne $clock) { return $clock }
  if ($null -ne $timeTokenMap -and $timeTokenMap.PSObject.Properties.Name -contains $token) {
    $mapped = [string]$timeTokenMap.$token
    return (Parse-Clock $mapped)
  }
  return $null
}

function New-TimePeriodsIndex($timePeriods) {
  $idx = [ordered]@{
    tokenToPeriod = @{}
    aliasToToken = @{}
  }
  if ($null -eq $timePeriods) { return $idx }
  $arr = @($timePeriods)
  foreach ($p in $arr) {
    if ($null -eq $p) { continue }
    $token = [string]$p.token
    if ([string]::IsNullOrWhiteSpace($token)) { continue }
    $idx.tokenToPeriod[$token] = $p
    $aliases = @()
    try { $aliases = @($p.aliases) } catch { $aliases = @() }
    foreach ($a in $aliases) {
      $alias = [string]$a
      if ([string]::IsNullOrWhiteSpace($alias)) { continue }
      if (-not $idx.aliasToToken.ContainsKey($alias)) { $idx.aliasToToken[$alias] = $token }
    }
  }
  return $idx
}

function Normalize-TimeToken([string]$token, $timePeriodsIndex) {
  if ([string]::IsNullOrWhiteSpace($token)) { return $null }
  $t = $token.Trim()
  if ($t -match "^[xX]$") { return $null }
  if ($t -match "^\d{1,2}:\d{2}$") { return $t }
  if ($null -ne $timePeriodsIndex) {
    try {
      if ($timePeriodsIndex.aliasToToken.ContainsKey($t)) { return [string]$timePeriodsIndex.aliasToToken[$t] }
      if ($timePeriodsIndex.tokenToPeriod.ContainsKey($t)) { return $t }
    } catch {}
  }
  return $t
}

function Get-TaskTimeModel([string]$dateIsoRaw, [string]$timeTokenRaw, $timePeriodsIndex, $timeTokenMap) {
  if ([string]::IsNullOrWhiteSpace($dateIsoRaw)) { return $null }
  $date = Parse-DateISO $dateIsoRaw
  if ($null -eq $date) { return $null }
  $normalized = Normalize-TimeToken $timeTokenRaw $timePeriodsIndex
  if ([string]::IsNullOrWhiteSpace($normalized)) { return $null }

  $explicit = Parse-Clock $normalized
  if ($null -ne $explicit) {
    $eventAt = $date.Add($explicit)
    return [ordered]@{ kind="clock"; token=$normalized; eventAt=$eventAt; overdueAt=$eventAt }
  }

  if ($null -ne $timePeriodsIndex) {
    try {
      if ($timePeriodsIndex.tokenToPeriod.ContainsKey($normalized)) {
        $p = $timePeriodsIndex.tokenToPeriod[$normalized]
        $startClock = Parse-Clock ([string]$p.start)
        $endClock = Parse-Clock ([string]$p.end)
        if ($null -ne $startClock -and $null -ne $endClock) {
          $eventAt = $date.Add($startClock)
          $overdueAt = $date.Add($endClock)
          return [ordered]@{ kind="period"; token=$normalized; eventAt=$eventAt; overdueAt=$overdueAt }
        }
      }
    } catch {}
  }

  $deadlineClock = Parse-TimeTokenToClock $normalized $timeTokenMap
  if ($null -ne $deadlineClock) {
    $deadline = $date.Add($deadlineClock)
    return [ordered]@{ kind="mapped"; token=$normalized; eventAt=$deadline; overdueAt=$deadline }
  }

  return $null
}

function Parse-SlotIndexByToken([string]$token, $slots, $timeTokenMap, $timePeriodsIndex = $null) {
  if ([string]::IsNullOrWhiteSpace($token)) { return -1 }
  $norm = Normalize-TimeToken $token $timePeriodsIndex
  if ([string]::IsNullOrWhiteSpace($norm)) { return -1 }
  $slotArr = @($slots)
  for ($i = 0; $i -lt $slotArr.Count; $i++) {
    $s = $slotArr[$i]
    if ($null -eq $s) { continue }
    if ([string]$s.label -eq $norm) { return $i }
  }
  $clock = Parse-TimeTokenToClock $norm $timeTokenMap
  if ($null -eq $clock) { return -1 }
  for ($i = 0; $i -lt $slotArr.Count; $i++) {
    $s = $slotArr[$i]
    if ($null -eq $s) { continue }
    $c = Parse-Clock ([string]$s.time)
    if ($null -eq $c) { continue }
    if ($c.TotalMinutes -eq $clock.TotalMinutes) { return $i }
  }
  return -1
}

function Apply-CompleteTask([string]$vaultRootAbs, $timeCtx, $action) {
  $todayISO = [string]$timeCtx.todayISO
  $task = $action.task
  $path = [string]$task.path
  $lineNo = [int]$task.lineNo
  $expected = [string]$task.lineText

  function Parse-RecurrenceRule([string]$line) {
    $m = [regex]::Match($line, "(?:🔁|recurrence:)\s*([a-zA-Z0-9\s]+)")
    if (-not $m.Success) { return $null }
    $rule = ([string]$m.Groups[1].Value).Trim()
    if ([string]::IsNullOrWhiteSpace($rule)) { return $null }

    $isWhenDone = $rule.ToLowerInvariant().Contains("when done")
    $clean = $rule -replace "(?i)\bwhen done\b", ""
    $clean = $clean.Trim()
    if ([string]::IsNullOrWhiteSpace($clean)) { return $null }

    $parts = $clean -split "\s+"
    $interval = 1
    $unit = "day"
    if ($parts.Count -ge 2 -and $parts[0].ToLowerInvariant() -eq "every") {
      $n = 0
      if ($parts.Count -ge 3 -and [int]::TryParse($parts[1], [ref]$n)) {
        $interval = $n
        $unit = $parts[2]
      } else {
        $unit = $parts[1]
      }
    } else {
      $unit = $parts[0]
    }
    $unit = $unit.ToLowerInvariant()
    if ($unit.StartsWith("day")) { $unit = "day" }
    elseif ($unit.StartsWith("week")) { $unit = "week" }
    elseif ($unit.StartsWith("month")) { $unit = "month" }
    elseif ($unit.StartsWith("year")) { $unit = "year" }
    else { $unit = "day" }

    if ($interval -lt 1) { $interval = 1 }
    return [ordered]@{ raw=$rule; isWhenDone=$isWhenDone; interval=[int]$interval; unit=$unit }
  }

  function Add-Interval([DateTime]$baseDate, $ruleObj) {
    $interval = [int]$ruleObj.interval
    $unit = [string]$ruleObj.unit
    if ($unit -eq "week") { return $baseDate.AddDays(7 * $interval) }
    if ($unit -eq "month") { return $baseDate.AddMonths($interval) }
    if ($unit -eq "year") { return $baseDate.AddYears($interval) }
    return $baseDate.AddDays($interval)
  }

  function Shift-DateTokens([string]$text, [DateTime]$oldDue, [DateTime]$nextDue) {
    $shift = {
      param($m)
      $dateStr = [string]$m.Groups[1].Value
      $oldOther = Parse-DateISO $dateStr
      if ($null -eq $oldOther) { return $m.Value }
      $diff = $oldDue - $oldOther
      $newOther = $nextDue - $diff
      $newISO = Get-LocalISODate $newOther
      return ($m.Value -replace [regex]::Escape($dateStr), $newISO)
    }
    $out = [regex]::Replace($text, "🛫\s*(\d{4}-\d{1,2}-\d{1,2})", $shift)
    $out = [regex]::Replace($out, "⏳\s*(\d{4}-\d{1,2}-\d{1,2})", $shift)
    return $out
  }

  function Compute-RecurrenceInsertIndex([string[]]$lines, [int]$parentIndex) {
    if ($parentIndex -lt 0 -or $parentIndex -ge $lines.Length) { return ($parentIndex + 1) }
    $parentLine = [string]$lines[$parentIndex]
    $parentIndentMatch = [regex]::Match($parentLine, "^\s*")
    $parentIndent = if ($parentIndentMatch.Success) { [string]$parentIndentMatch.Value } else { "" }

    $i = $parentIndex + 1
    while ($i -lt $lines.Length) {
      $cur = [string]$lines[$i]
      if ($cur.Trim().Length -eq 0) {
        $j = $i + 1
        while ($j -lt $lines.Length -and [string]$lines[$j].Trim() -eq "") { $j++ }
        if ($j -ge $lines.Length) { break }
        $next = [string]$lines[$j]
        $nextIndentMatch = [regex]::Match($next, "^\s*")
        $nextIndent = if ($nextIndentMatch.Success) { [string]$nextIndentMatch.Value } else { "" }
        if ($nextIndent.StartsWith($parentIndent) -and $nextIndent.Length -gt $parentIndent.Length) { $i++; continue }
        break
      }

      $curIndentMatch = [regex]::Match($cur, "^\s*")
      $curIndent = if ($curIndentMatch.Success) { [string]$curIndentMatch.Value } else { "" }
      if ($curIndent.StartsWith($parentIndent) -and $curIndent.Length -gt $parentIndent.Length) { $i++; continue }
      break
    }
    return $i
  }

  function Update-CompleteAndRecurrence([string]$vaultRootAbs, [string]$taskPathRel, [int]$lineNo, [string]$expectedLine, [string]$todayISO) {
    $abs = Join-Path $vaultRootAbs $taskPathRel
    if (-not (Test-Path -LiteralPath $abs)) { throw "file_not_found:$taskPathRel" }

    $raw = [System.IO.File]::ReadAllText($abs, [System.Text.Encoding]::UTF8)
    $hasTrailingNewline = $false
    if ($raw -match "(\r\n|\n|\r)$") { $hasTrailingNewline = $true }
    $lines = [regex]::Split($raw, "\r\n|\n|\r", [System.Text.RegularExpressions.RegexOptions]::None)

    $targetIndex = $lineNo
    $lineOk = ($targetIndex -ge 0 -and $targetIndex -lt $lines.Length -and $lines[$targetIndex].TrimEnd() -eq $expectedLine.TrimEnd())
    if (-not $lineOk) {
      $found = -1
      for ($i = 0; $i -lt $lines.Length; $i++) {
        if ($lines[$i].TrimEnd() -eq $expectedLine.TrimEnd()) { $found = $i; break }
      }
      if ($found -ge 0) { $targetIndex = $found } else { throw "task_line_not_found:$taskPathRel" }
    }

    $oldLine = [string]$lines[$targetIndex]
    if ($oldLine -notmatch "\[ \]") { return }

    $updated = $oldLine -replace "\[ \]", "[x]"
    if ($updated -notmatch "✅\s*\d{4}-\d{1,2}-\d{1,2}") { $updated = "$updated ✅ $todayISO" }
    $lines[$targetIndex] = $updated

    $ruleObj = Parse-RecurrenceRule $oldLine
    if ($null -ne $ruleObj) {
      $dueMatch = [regex]::Match($oldLine, "📅\s*(\d{4}-\d{1,2}-\d{1,2})")
      $oldDue = $null
      if ($dueMatch.Success) { $oldDue = Parse-DateISO ([string]$dueMatch.Groups[1].Value) }

      $baseDate = $null
      if ([bool]$ruleObj.isWhenDone) { $baseDate = Parse-DateISO $todayISO }
      elseif ($null -ne $oldDue) { $baseDate = $oldDue }
      else { $baseDate = Parse-DateISO $todayISO }

      if ($null -ne $baseDate) {
        $nextDue = Add-Interval $baseDate $ruleObj
        $nextDueISO = Get-LocalISODate $nextDue

        $newTaskLine = $oldLine
        if ($null -ne $oldDue) {
          $newTaskLine = Shift-DateTokens $newTaskLine $oldDue $nextDue
          $newTaskLine = [regex]::Replace($newTaskLine, "📅\s*\d{4}-\d{1,2}-\d{1,2}", "📅 $nextDueISO")
        } else {
          $newTaskLine = "$newTaskLine 📅 $nextDueISO"
        }

        $insertAt = Compute-RecurrenceInsertIndex $lines $targetIndex
        $list = [System.Collections.Generic.List[string]]::new()
        foreach ($l in $lines) { $list.Add([string]$l) }
        $list.Insert($insertAt, $newTaskLine)
        $lines = $list.ToArray()
      }
    }

    if ($DryRun) {
      Write-Host "[DryRun] Would update ${taskPathRel}:${targetIndex}"
      return
    }
    $out = ($lines -join "`n")
    if ($hasTrailingNewline -and -not $out.EndsWith("`n")) { $out += "`n" }
    Write-TextAtomicUtf8 $abs $out
  }

  Update-CompleteAndRecurrence $vaultRootAbs $path $lineNo $expected $todayISO
}

function Apply-SnoozeTask([string]$vaultRootAbs, $timeCtx, $action, $timeTokenMap, $slots) {
  $task = $action.task
  $path = [string]$task.path
  $lineNo = [int]$task.lineNo
  $expected = [string]$task.lineText
  $mins = [int]$action.snoozeMinutes

  Update-TaskLineInFile $vaultRootAbs $path $lineNo $expected {
    param([string]$line)
    $dateRaw = Extract-DateFromText $line
    if ([string]::IsNullOrWhiteSpace($dateRaw)) { return $line }
    $date = Parse-DateISO $dateRaw
    if ($null -eq $date) { return $line }

    $token = Extract-TimeTokenFromText $line
    $clock = Parse-TimeTokenToClock $token $timeTokenMap
    $explicitClock = ($null -ne (Parse-Clock $token))

    $deadline = $null
    if (-not $explicitClock) {
      $idx = Parse-SlotIndexByToken $token $slots $timeTokenMap
      if ($idx -ge 0) {
        $slotArr = @($slots)
        $nextIdx = $idx + 1
        $baseDate = $date
        if ($nextIdx -ge $slotArr.Count) { $nextIdx = 0; $baseDate = $baseDate.AddDays(1) }
        $nextClock = Parse-Clock ([string]$slotArr[$nextIdx].time)
        if ($null -ne $nextClock) {
          $deadline = $baseDate.Add($nextClock)
          $newToken = [string]$slotArr[$nextIdx].label
          $newDateISO = Get-LocalISODate $deadline
          $newTime = $deadline.ToString("HH:mm")
          $updated = $line
          $updated = [regex]::Replace($updated, "📅\s*\d{4}-\d{1,2}-\d{1,2}", "📅 $newDateISO")
          if ($updated -match "\[(早上|上午|下午|晚上|凌晨|中午|早|中|下|晚|凌|\d{1,2}:\d{2})\]") {
            $updated = [regex]::Replace($updated, "\[(早上|上午|下午|晚上|凌晨|中午|早|中|下|晚|凌|\d{1,2}:\d{2})\]", "[$newToken]")
          } else {
            $updated = [regex]::Replace($updated, "(📅\s*$newDateISO)", "[$newToken] `$1")
          }
          return $updated
        }
      }
    }

    if ($null -eq $clock) {
      $clock = [TimeSpan]::FromMinutes(12 * 60)
    }
    $deadline = $date.Add($clock).AddMinutes($mins)
    $newDateISO2 = Get-LocalISODate $deadline
    $newTime2 = $deadline.ToString("HH:mm")

    $updated2 = $line
    $updated2 = [regex]::Replace($updated2, "📅\s*\d{4}-\d{1,2}-\d{1,2}", "📅 $newDateISO2")
    if ($updated2 -match "\[(早上|上午|下午|晚上|凌晨|中午|早|中|下|晚|凌|\d{1,2}:\d{2})\]") {
      $updated2 = [regex]::Replace($updated2, "\[(早上|上午|下午|晚上|凌晨|中午|早|中|下|晚|凌|\d{1,2}:\d{2})\]", "[$newTime2]")
    } else {
      $updated2 = [regex]::Replace($updated2, "(📅\s*$newDateISO2)", "[$newTime2] `$1")
    }
    return $updated2
  }
}

function Get-ActiveTaskDeadline([string]$dateIsoRaw, [string]$timeToken, $timeTokenMap, [string]$todayISO) {
  if ([string]::IsNullOrWhiteSpace($dateIsoRaw)) { return $null }
  $date = Parse-DateISO $dateIsoRaw
  if ($null -eq $date) { return $null }
  $clock = Parse-TimeTokenToClock $timeToken $timeTokenMap
  if ($null -eq $clock) {
    if (-not [string]::IsNullOrWhiteSpace($todayISO) -and $dateIsoRaw -eq $todayISO) {
      return $date.AddHours(6)
    }
    return $null
  }
  return $date.Add($clock)
}

function Compute-Summary($tasks, $timeCtx, $timeTokenMap, $timePeriodsIndex = $null) {
  $today = [DateTime]$timeCtx.today
  $todayISO = [string]$timeCtx.todayISO
  $now = [DateTime]$timeCtx.now

  $overdue = 0
  $todo = 0
  $done = 0
  $overdueTitles = [System.Collections.Generic.List[string]]::new()

  foreach ($t in $tasks) {
    if ($t.completed) {
      $comp = [string]$t.completionISO
      if ($comp -eq $todayISO -or $comp -eq (Get-LocalISODate $timeCtx.naturalToday)) { $done++ }
      continue
    }

    $dateRaw = [string]$t.dueDateRaw
    if ([string]::IsNullOrWhiteSpace($dateRaw)) { continue }
    $date = Parse-DateISO $dateRaw
    if ($null -eq $date) { continue }

    if ($date -lt $today) {
      $overdue++
      $overdueTitles.Add((Get-TaskDisplayText ([string]$t.lineText)))
      continue
    }

    if ($date -eq $today) {
      $token = [string]$t.timeToken
      if (-not [string]::IsNullOrWhiteSpace($token)) {
        $model = Get-TaskTimeModel $dateRaw $token $timePeriodsIndex $timeTokenMap
        if ($null -ne $model -and $null -ne $model.overdueAt) {
          if ($now -ge ([DateTime]$model.overdueAt)) {
            $overdue++
            $overdueTitles.Add((Get-TaskDisplayText ([string]$t.lineText)))
          } else { $todo++ }
        } else { $todo++ }
      } else { $todo++ }
    }
  }

  return [ordered]@{
    overdue = $overdue
    todo = $todo
    done = $done
    topOverdue = @($overdueTitles | Select-Object -First 5)
  }
}

function Build-SlotReportMessage($slotLabel, $summary) {
  $lines = @()
  $lines += "已逾期: $($summary.overdue)"
  $lines += "待完成: $($summary.todo)"
  $lines += "已完成: $($summary.done)"
  if ($summary.topOverdue.Count -gt 0) {
    $lines += ""
    $lines += "逾期Top:"
    foreach ($t in $summary.topOverdue) { $lines += "- $t" }
  }
  return ($lines -join "`n")
}

if ([string]::IsNullOrWhiteSpace($VaultRoot)) {
  $VaultRoot = (Get-Location).Path
} else {
  $VaultRoot = (Resolve-Path -LiteralPath $VaultRoot).Path
}

if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
  $ConfigPath = "08-科技树系统/01-OB_LifeOS_Build/00-通用模块库/task-reminder/task-reminder.config.json"
}

$configAbs = Resolve-AbsPath $VaultRoot $ConfigPath
$config = Load-JsonFile $configAbs
if ($null -eq $config) { throw "config_not_found_or_invalid:$configAbs" }

$stateAbs = [System.IO.Path]::ChangeExtension($configAbs, "state.json")
$state = Load-JsonFile $stateAbs
if ($null -eq $state) {
  $state = [ordered]@{ version = 1; sent = @{}; lastActionSince = "" }
}
$state.sent = Ensure-Hashtable $state.sent
if ([string]$state.lastActionSince -notmatch "^\d+$") {
  $state.lastActionSince = [string](Get-UtcUnix (Get-Date))
}

$ntfyServer = [string]$config.ntfy.server
$ntfyTopic = [string]$config.ntfy.topic
$actionsTopic = [string]$config.ntfy.actionsTopic
if ([string]::IsNullOrWhiteSpace($ntfyServer) -or [string]::IsNullOrWhiteSpace($ntfyTopic) -or [string]::IsNullOrWhiteSpace($actionsTopic)) {
  throw "ntfy_config_incomplete"
}
$authHeaders = Get-AuthHeaders $config.ntfy.auth

$timeCtx = Get-TimeContext
$timeTokenMap = $config.reminder.timeTokenMap
$leadMinutes = [int]$config.reminder.leadMinutes
$periodLeadMinutes = $leadMinutes
$timeLeadMinutes = $leadMinutes
try { $periodLeadMinutes = [int]$config.reminder.periodLeadMinutes } catch {}
try { $timeLeadMinutes = [int]$config.reminder.timeLeadMinutes } catch {}
$timePeriodsIndex = $null
try {
  $timePeriodsIndex = New-TimePeriodsIndex $config.reminder.timePeriods
} catch {
  $timePeriodsIndex = New-TimePeriodsIndex $null
}
$writebackEnabled = $true
try { $writebackEnabled = [bool]$config.writeback.enabled } catch { $writebackEnabled = $true }

if ($writebackEnabled) {
  $actions = Invoke-NtfyPollActions $ntfyServer $actionsTopic ([string]$state.lastActionSince) $authHeaders
  $maxActionTime = 0
  foreach ($a in $actions) {
    if ($null -eq $a) { continue }
    $hasEvent = $false
    try { $hasEvent = ($a.PSObject.Properties.Match("event").Count -gt 0) } catch { $hasEvent = $false }
    if (-not $hasEvent) { continue }
    if ($a.event -ne "message") { continue }
    if ($a.PSObject.Properties.Match("time").Count -gt 0) {
      try { $maxActionTime = [Math]::Max($maxActionTime, [int]$a.time) } catch {}
    }
    $msg = [string]$a.message
    if ([string]::IsNullOrWhiteSpace($msg)) { continue }
    $payload = $null
    try {
      $payload = $msg | ConvertFrom-Json -ErrorAction Stop
    } catch {
      $msg2 = $msg
      $msg2 = $msg2 -replace '\\\\\"', '"'
      $msg2 = $msg2 -replace '\\\\\\\\', '\\'
      try { $payload = $msg2 | ConvertFrom-Json -ErrorAction Stop } catch { continue }
    }
    if ($null -eq $payload -or $payload.kind -ne "lifeos_task_action") { continue }
    try {
      $op = [string]$payload.op
      if ($op -eq "complete") {
        Apply-CompleteTask $VaultRoot $timeCtx $payload
      }
    } catch {}
  }
  if ($maxActionTime -gt 0) { $state.lastActionSince = [string]($maxActionTime + 1) }
} else {
  $state.lastActionSince = [string](Get-UtcUnix (Get-Date))
}

$reminderPathConfigRel = "01-经纬矩阵系统/03-备忘提醒模块/备忘提醒路径配置.md"
$reminderPathConfigAbs = Resolve-AbsPath $VaultRoot $reminderPathConfigRel
$sources = Get-TaskSourcesFromReminderPathConfigMd $reminderPathConfigAbs
$maxFiles = [int]$config.scan.maxFiles
if ($maxFiles -le 0) { $maxFiles = 5000 }
$sourceFiles = Get-SourceFiles $VaultRoot $sources $maxFiles
$configuredFolders = @()
$configuredFiles = @()
try { $configuredFolders = @($sources.folders) } catch { $configuredFolders = @() }
try { $configuredFiles = @($sources.extraFiles) } catch { $configuredFiles = @() }
$configuredFolders = @($configuredFolders | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
$configuredFiles = @($configuredFiles | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$allTasks = [System.Collections.Generic.List[object]]::new()
$parseErrors = 0
$filesWithTasks = [System.Collections.Generic.List[string]]::new()
foreach ($f in $sourceFiles) {
  try {
    $parsed = @(Parse-TasksFromFile $f $VaultRoot)
    if ($parsed.Count -gt 0) {
      $rel = [System.IO.Path]::GetRelativePath($VaultRoot, $f)
      $filesWithTasks.Add("$rel ($($parsed.Count))")
    }
    foreach ($t in $parsed) { $allTasks.Add($t) }
  } catch { $parseErrors++ }
}
$sw.Stop()

$now = [DateTime]$timeCtx.now
$todayISO = [string]$timeCtx.todayISO
$sent = $state.sent
if ($null -eq $sent) { $sent = @{}; $state.sent = $sent }

$openTasksCount = 0
$openTasksAlreadySentCount = 0
foreach ($t in $allTasks) {
  if ($t.completed) { continue }
  $openTasksCount++
  if ([string]$t.dueDateRaw -ne $todayISO) { continue }
  $eventAtTmp = $null
  if (-not [string]::IsNullOrWhiteSpace([string]$t.timeToken)) {
    $modelTmp = Get-TaskTimeModel ([string]$t.dueDateRaw) ([string]$t.timeToken) $timePeriodsIndex $timeTokenMap
    if ($null -eq $modelTmp -or $null -eq $modelTmp.eventAt) { continue }
    $eventAtTmp = [DateTime]$modelTmp.eventAt
  } else {
    $fallbackDeadlineTmp = Get-ActiveTaskDeadline ([string]$t.dueDateRaw) $null $timeTokenMap $todayISO
    if ($null -eq $fallbackDeadlineTmp) { continue }
    $eventAtTmp = [DateTime]$fallbackDeadlineTmp
  }
  if ((Get-LocalISODate $eventAtTmp) -ne $todayISO) { continue }
  $eventKeyTmp = "task|$($t.path)|$($t.lineNo)|$($eventAtTmp.ToString("o"))"
  $eventIdTmp = Get-Sha1Hex $eventKeyTmp
  if ($sent.ContainsKey($eventIdTmp)) { $openTasksAlreadySentCount++ }
}

foreach ($t in $allTasks) {
  if ($t.completed) { continue }
  if ([string]$t.dueDateRaw -ne $todayISO) { continue }
  $tokenRaw = [string]$t.timeToken
  $hasTimeToken = (-not [string]::IsNullOrWhiteSpace($tokenRaw))

  $eventAt = $null
  if ($hasTimeToken) {
    $model = Get-TaskTimeModel ([string]$t.dueDateRaw) $tokenRaw $timePeriodsIndex $timeTokenMap
    if ($null -eq $model -or $null -eq $model.eventAt) { continue }
    $eventAt = [DateTime]$model.eventAt
    if ((Get-LocalISODate $eventAt) -ne $todayISO) { continue }

    $leadMins = $timeLeadMinutes
    if ($model.kind -eq "period") { $leadMins = $periodLeadMinutes }
    $leadAt = $eventAt.AddMinutes(-$leadMins)
    if ($now -lt $leadAt -or $now -ge $eventAt) { continue }
  } else {
    $fallbackDeadline = Get-ActiveTaskDeadline ([string]$t.dueDateRaw) $null $timeTokenMap $todayISO
    if ($null -eq $fallbackDeadline) { continue }
    if ((Get-LocalISODate $fallbackDeadline) -ne $todayISO) { continue }
    $windowEnd = $fallbackDeadline.AddMinutes($leadMinutes)
    if ($now -lt $fallbackDeadline -or $now -ge $windowEnd) { continue }
    $eventAt = [DateTime]$fallbackDeadline
  }

  $eventKey = "task|$($t.path)|$($t.lineNo)|$($eventAt.ToString("o"))"
  $eventId = Get-Sha1Hex $eventKey
  if ($sent.ContainsKey($eventId)) { continue }

  $payloadActionBase = [ordered]@{
    kind = "lifeos_task_action"
    task = [ordered]@{ path = [string]$t.path; lineNo = [int]$t.lineNo; lineText = [string]$t.lineText }
  }
  $completeBody = ([ordered]@{ kind="lifeos_task_action"; op="complete"; task=$payloadActionBase.task } | ConvertTo-Json -Depth 6 -Compress)
  $actionUrl = "$($ntfyServer.TrimEnd('/'))/$actionsTopic"
  $completeBodyEsc = $completeBody -replace "'", "''"
  $actionsHeader = "http, 已完成, $actionUrl, method=POST, body='$completeBodyEsc', clear=true"

  $timeStr = $eventAt.ToString("HH:mm")
  $title = "任务提醒 · $timeStr"
  $tagParts = @()
  try { $tagParts = @($t.tags) } catch { $tagParts = @() }
  $tagParts = @($tagParts | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
  if ($tagParts.Count -gt 0) {
    $tagStr = ($tagParts | ForEach-Object { "#" + $_ }) -join " "
    $title = "$title $tagStr"
  }
  $message = Build-TaskReminderMessage $t $eventAt

  Invoke-NtfyPublish $ntfyServer $ntfyTopic $authHeaders ([ordered]@{
    title = $title
    message = $message
    priority = "high"
    actions = $actionsHeader
  })

  $sent[$eventId] = (Get-UtcUnix $now)
}

$state | Add-Member -NotePropertyName savedAt -NotePropertyValue (Get-UtcUnix (Get-Date)) -Force
if (-not $DryRun) { Save-JsonFile $stateAbs $state }

Write-Host ("[TaskReminder] files={0} tasks={1} parseMs={2} parseErrors={3} now={4}" -f $sourceFiles.Count, $allTasks.Count, $sw.ElapsedMilliseconds, $parseErrors, $now.ToString("s"))
Write-Output ([ordered]@{
  kind = "task_reminder_scan"
  ts_local = $now.ToString("s")
  folders = $configuredFolders
  files = $configuredFiles
  open_tasks = [int]$openTasksCount
  open_tasks_already_sent = [int]$openTasksAlreadySentCount
})
