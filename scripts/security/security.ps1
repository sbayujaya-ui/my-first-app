param(
    [ValidateSet("Audit","Full","Resume","Retry","Release")]
    [string]$Mode = "Audit",
    [switch]$ApproveRelease
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $RepoRoot

$ConfigPath = Join-Path $RepoRoot "scripts\security\security-control.json"
$Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
$StateDir = Join-Path $RepoRoot $Config.stateDir
$EvidenceDir = Join-Path $RepoRoot $Config.evidenceDir
$StatePath = Join-Path $RepoRoot $Config.stateFile
New-Item -ItemType Directory -Force $StateDir,$EvidenceDir | Out-Null

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Report = Join-Path $EvidenceDir "security-control-$Stamp.txt"
$State = [ordered]@{
    status = "RUNNING"
    mode = $Mode
    phase = "START"
    startedAt = (Get-Date).ToString("o")
    completedAt = $null
    report = $Report
    lastError = $null
}

function Save-State {
    $State | ConvertTo-Json -Depth 10 | Set-Content -Path $StatePath -Encoding UTF8
}
function Log($Text) {
    $Text | Tee-Object -FilePath $Report -Append
}
function Pass($Text) { Log "[PASS] $Text" }
function Warn($Text) { Log "[WARN] $Text" }
function Fail($Text) { Log "[FAIL] $Text" }
function Assert($Condition, $Message) {
    if (-not $Condition) { throw $Message }
}
function Run-Phase($Name, [scriptblock]$Action) {
    $State.phase = $Name
    Save-State
    Log ""
    Log "===== $Name ====="
    try {
        & $Action
        Pass "$Name"
        return $true
    }
    catch {
        $State.status = "FAIL"
        $State.lastError = $_.Exception.Message
        Save-State
        Fail "$Name :: $($_.Exception.Message)"
        return $false
    }
}

if ($Mode -eq "Resume" -or $Mode -eq "Retry") {
    Assert (Test-Path $StatePath) "No checkpoint exists at $StatePath"
    $Saved = Get-Content $StatePath -Raw | ConvertFrom-Json
    $start = if ($Mode -eq "Retry") { [string]$Saved.phase } else { [string]$Saved.nextPhase }
    if (-not $start) { $start = "GIT" }
    Log "[INFO] Resuming from checkpoint: $start"
}

if ($Mode -eq "Release") {
    Assert $ApproveRelease "Release mode requires -ApproveRelease."
}

"WARUNG HRD SECURITY CONTROL CENTER" | Set-Content $Report -Encoding UTF8
Log "Mode: $Mode"
Log "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Log "Root: $RepoRoot"

$Phases = [ordered]@{
    GIT = {
        $branch = (git branch --show-current).Trim()
        Assert ($branch -eq "main") "Current branch is '$branch', expected main."
        $head = (git rev-parse HEAD).Trim()
        $remote = (git rev-parse origin/main 2>$null).Trim()
        Assert ($remote -and $head -eq $remote) "Local HEAD does not match origin/main."
        git diff --check
        Assert ($LASTEXITCODE -eq 0) "git diff --check failed."
        Log "HEAD: $head"
        Log "origin/main: $remote"
    }
    FILES = {
        foreach ($f in $Config.requiredFiles) {
            Assert (Test-Path $f) "Missing required file: $f"
        }
        foreach ($f in $Config.protectedFiles) {
            Assert (Test-Path $f) "Missing protected file: $f"
            git diff --quiet -- $f
            Assert ($LASTEXITCODE -eq 0) "Protected file changed: $f"
            git diff --cached --quiet -- $f
            Assert ($LASTEXITCODE -eq 0) "Protected file staged: $f"
        }
    }
    AUTH = {
        foreach ($r in $Config.routeChecks.PSObject.Properties) {
            $file = $r.Name
            $perm = [string]$r.Value
            $text = Get-Content $file -Raw
            Assert ($text -match 'requirePermission') "No route guard in $file"
            Assert ($text -match [regex]::Escape($perm)) "Expected permission '$perm' missing in $file"
        }
    }
    READS = {
        $files = Get-ChildItem app,lib,proxy.ts -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Extension -in '.ts','.tsx' }
        foreach ($pattern in $Config.forbiddenSelectPatterns) {
            $hits = @($files | Select-String -Pattern $pattern)
            Assert ($hits.Count -eq 0) "Broad direct read detected: $pattern"
        }
        foreach ($f in $Config.kasirFiles) {
            $text = Get-Content $f -Raw
            Assert ($text -notmatch 'harga_beli|hargaBeli') "Cost field exposed in $f"
        }
        $profit = Get-Content $Config.profitService -Raw
        Assert ($profit -match 'ambil_detail_keuntungan_admin') "Profit Admin RPC missing"
        Assert ($profit -notmatch '\.from\(["'']sales["'']\)') "Direct sales read in profit service"
        Assert ($profit -notmatch '\.from\(["'']sale_items["'']\)') "Direct sale_items read in profit service"
    }
    BUILD = {
        npx tsc --noEmit
        Assert ($LASTEXITCODE -eq 0) "TypeScript check failed."
        npm run build
        Assert ($LASTEXITCODE -eq 0) "Production build failed."
    }
    SUPABASE = {
        npx supabase --version
        Assert ($LASTEXITCODE -eq 0) "Supabase CLI unavailable."
        $m = npx supabase migration list --linked 2>&1
        Assert ($LASTEXITCODE -eq 0) "Supabase migration list failed."
        foreach ($id in $Config.requiredMigrations) {
            Assert ($m -match $id) "Required migration missing: $id"
        }
    }
    FINAL = {
        $status = @(git status --short)
        Log "Working tree entries: $($status.Count)"
        if ($status.Count -gt 0) {
            Warn "Working tree is not clean; no automatic release will be attempted in Audit/Full/Resume."
        }
        if ($Mode -eq "Release") {
            foreach ($f in $Config.releaseFiles) { git add -- $f }
            $staged = @(git diff --cached --name-only)
            Assert ($staged.Count -eq $Config.releaseFiles.Count) "Unexpected staged file count."
            foreach ($f in $Config.releaseFiles) {
                Assert ($staged -contains $f) "Missing staged release file: $f"
            }
            git diff --cached --check
            Assert ($LASTEXITCODE -eq 0) "Staged diff check failed."
            git commit -m $Config.releaseMessage
            Assert ($LASTEXITCODE -eq 0) "Commit failed."
            git push origin main
            Assert ($LASTEXITCODE -eq 0) "Push failed."
        }
    }
}

$names = @($Phases.Keys)
$startIndex = 0
if ($Mode -in @("Resume","Retry")) {
    $Saved = Get-Content $StatePath -Raw | ConvertFrom-Json
    $startName = if ($Mode -eq "Retry") { [string]$Saved.phase } else { [string]$Saved.nextPhase }
    if ($startName) {
        $startIndex = [array]::IndexOf($names, $startName)
        if ($startIndex -lt 0) { $startIndex = 0 }
    }
}

for ($i = $startIndex; $i -lt $names.Count; $i++) {
    $name = $names[$i]
    $ok = Run-Phase $name $Phases[$name]
    if (-not $ok) {
        $State.nextPhase = $name
        Save-State
        Log "STOPPED. Fix the failure, then run: .\scripts\security\security.ps1 -Mode Retry"
        exit 1
    }
    $State.nextPhase = if ($i + 1 -lt $names.Count) { $names[$i + 1] } else { $null }
    Save-State
}

$State.status = "PASS"
$State.completedAt = (Get-Date).ToString("o")
$State.lastError = $null
Save-State
Log ""
Log "SECURITY CONTROL CENTER: PASS"
Log "Checkpoint: COMPLETE"
Log "Report: $Report"
exit 0
