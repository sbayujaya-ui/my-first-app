param(
    [ValidateSet("Audit")]
    [string]$Mode = "Audit"
)

$ErrorActionPreference = "Continue"

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $RepoRoot

$EvidenceDir = Join-Path $RepoRoot "scripts\phases\SEC-013\evidence"
New-Item -ItemType Directory -Force $EvidenceDir | Out-Null

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Report = Join-Path $EvidenceDir "sec013-master-audit-$Stamp.txt"

$Pass = 0
$Fail = 0
$Warn = 0
$Skip = 0

function Write-Report {
    param(
        [string]$Text,
        [ConsoleColor]$Color = [ConsoleColor]::Gray
    )

    $Text | Tee-Object -FilePath $Report -Append
    Write-Host $Text -ForegroundColor $Color
}

function PASS {
    param([string]$Message)
    $script:Pass++
    Write-Report "[PASS] $Message" Green
}

function FAIL {
    param([string]$Message)
    $script:Fail++
    Write-Report "[FAIL] $Message" Red
}

function WARN {
    param([string]$Message)
    $script:Warn++
    Write-Report "[WARN] $Message" Yellow
}

function SKIP {
    param([string]$Message)
    $script:Skip++
    Write-Report "[SKIP] $Message" DarkYellow
}

function Section {
    param([string]$Title)
    Write-Report ""
    Write-Report "============================================================" Cyan
    Write-Report $Title Cyan
    Write-Report "============================================================" Cyan
}

"" | Set-Content $Report

Write-Report "SEC-013 MASTER SECURITY AUDIT"
Write-Report "Project : Warung HRD"
Write-Report "Mode    : $Mode"
Write-Report "Time    : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Report "Root    : $RepoRoot"
Write-Report ""
Write-Report "IMPORTANT: This runner is READ-ONLY."
Write-Report "It does NOT modify Supabase, commit, push, or deploy."

Section "1. GIT BASELINE"

try {
    $Branch = git branch --show-current
    $Head = git rev-parse HEAD
    $RemoteHead = git rev-parse origin/main 2>$null

    Write-Report "Branch       : $Branch"
    Write-Report "HEAD         : $Head"
    Write-Report "origin/main  : $RemoteHead"

    if ($Branch -eq "main") {
        PASS "Git branch is main"
    } else {
        WARN "Current branch is '$Branch', expected main"
    }

    if ($RemoteHead -and $Head -eq $RemoteHead) {
        PASS "Local HEAD matches origin/main"
    } elseif ($RemoteHead) {
        WARN "Local HEAD differs from origin/main"
    } else {
        WARN "origin/main could not be resolved"
    }

    $GitStatus = @(git status --short)

    if ($GitStatus.Count -eq 0) {
        PASS "Working tree is clean"
    } else {
        WARN "Working tree contains $($GitStatus.Count) change(s)/untracked item(s)"
        $GitStatus | ForEach-Object { Write-Report "  $_" }
    }

    $DiffCheck = @(git diff --check 2>&1)

    if ($LASTEXITCODE -eq 0) {
        PASS "git diff --check"
    } else {
        FAIL "git diff --check reported problems"
        $DiffCheck | ForEach-Object { Write-Report "  $_" }
    }
}
catch {
    FAIL "Git audit failed: $($_.Exception.Message)"
}

Section "2. REQUIRED PROJECT FILES"

$RequiredFiles = @(
    "package.json",
    "tsconfig.json",
    "proxy.ts",
    "lib/auth/authService.ts",
    "lib/auth/permissions.ts",
    "lib/produk/produkService.ts",
    "lib/penjualan/keuntunganService.ts",
    "supabase/migrations/20260922110000_sec010_product_write_hardening.sql",
    "supabase/migrations/20260922150000_sec012_data_read_authorization.sql",
    "scripts/phases/SEC-012/sec012-final-test.ps1",
    "scripts/master/security-baseline.json"
)

foreach ($File in $RequiredFiles) {
    if (Test-Path $File) {
        PASS "Required file: $File"
    } else {
        FAIL "Missing required file: $File"
    }
}

Section "3. SEC-009 PROTECTED FILES"

$Protected = @(
    "scripts/phases/SEC-009/reporting-baseline.sql",
    "scripts/phases/SEC-009/reporting-code-audit.ps1",
    "scripts/phases/SEC-009/cross-report-reconciliation.sql",
    "scripts/phases/SEC-009/phase6-final-daily-monthly.sql",
    "scripts/phases/SEC-009/phase6-final-revenue.sql",
    "scripts/phases/SEC-009/phase6-final-profit.sql",
    "scripts/phases/SEC-009/phase6-profit-formula-hardening.sql",
    "scripts/phases/SEC-009/phase6-audit-e.sql"
)

foreach ($File in $Protected) {
    if (-not (Test-Path $File)) {
        FAIL "SEC-009 protected file missing: $File"
        continue
    }

    $Diff = @(git diff -- $File)
    $CachedDiff = @(git diff --cached -- $File)

    if ($Diff.Count -eq 0 -and $CachedDiff.Count -eq 0) {
        PASS "SEC-009 protected file unchanged: $File"
    } else {
        FAIL "SEC-009 protected file has uncommitted changes: $File"
    }
}

Section "4. SOURCE SECURITY AUDIT"

$SecurityFiles = @(
    "app",
    "lib",
    "supabase",
    "proxy.ts",
    "scripts"
)

$SourceFiles = @()

foreach ($Path in $SecurityFiles) {
    if (Test-Path $Path) {
        if ((Get-Item $Path).PSIsContainer) {
            $SourceFiles += Get-ChildItem $Path -Recurse -File -Include *.ts,*.tsx,*.sql,*.ps1 -ErrorAction SilentlyContinue
        } else {
            $SourceFiles += Get-Item $Path
        }
    }
}

$CostReadMatches = @(
    $SourceFiles |
        Select-String -Pattern '\.select\([^)]*harga_beli|\.select\([^)]*hargaBeli' -SimpleMatch:$false |
        Where-Object {
            $_.Path -notmatch '\\backup-' -and
            $_.Path -notmatch '\\evidence\\'
        }
)

if ($CostReadMatches.Count -eq 0) {
    PASS "No direct source SELECT requesting harga_beli/hargaBeli detected"
} else {
    FAIL "Potential direct cost-column read detected"
    $CostReadMatches | ForEach-Object {
        Write-Report "  $($_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }
}

Section "5. KASIR COST EXPOSURE"

$KasirFiles = @(
    "app/penjualan/PenjualanPageClient.tsx",
    "app/produk/penjualan/ProdukPenjualan.tsx"
)

foreach ($File in $KasirFiles) {
    if (-not (Test-Path $File)) {
        FAIL "Missing Kasir file: $File"
        continue
    }

    $Matches = @(Select-String -Path $File -Pattern 'harga_beli|hargaBeli' -AllMatches)

    if ($Matches.Count -eq 0) {
        PASS "Kasir file contains no cost field: $File"
    } else {
        FAIL "Kasir file contains cost field reference: $File"
        $Matches | ForEach-Object {
            Write-Report "  $($_.LineNumber): $($_.Line.Trim())"
        }
    }
}

Section "6. PROFIT SERVICE BOUNDARY"

$ProfitService = "lib/penjualan/keuntunganService.ts"

if (Test-Path $ProfitService) {
    $ProfitText = Get-Content $ProfitService -Raw

    if ($ProfitText -match 'ambil_detail_keuntungan_admin') {
        PASS "Profit service uses Admin RPC"
    } else {
        FAIL "Profit service does not reference Admin RPC"
    }

    if ($ProfitText -match '\.from\(["'']sales["'']\)') {
        FAIL "Direct sales read remains in keuntunganService"
    } else {
        PASS "No direct sales read in keuntunganService"
    }

    if ($ProfitText -match '\.from\(["'']sale_items["'']\)') {
        FAIL "Direct sale_items read remains in keuntunganService"
    } else {
        PASS "No direct sale_items read in keuntunganService"
    }

    $FormulaPatterns = @(
        'hargaBeli',
        'hargaJual',
        'jumlah',
        'omzet',
        'modal',
        'keuntungan',
        'marginPersen'
    )

    foreach ($Pattern in $FormulaPatterns) {
        if ($ProfitText -match $Pattern) {
            PASS "Profit formula component present: $Pattern"
        } else {
            FAIL "Profit formula component missing: $Pattern"
        }
    }
} else {
    FAIL "Profit service missing"
}

Section "7. ROUTE AUTHORIZATION"

$Routes = @{
    "app/page.tsx" = "dashboard"
    "app/produk/page.tsx" = "produk.view"
    "app/penjualan/page.tsx" = "penjualan"
    "app/scan/page.tsx" = "scan"
    "app/laporan/page.tsx" = "laporan.riwayat"
    "app/laporan/harian/page.tsx" = "laporan.harian"
    "app/laporan/bulanan/page.tsx" = "laporan.bulanan"
    "app/laporan/keuntungan/page.tsx" = "laporan.keuntungan"
}

foreach ($Entry in $Routes.GetEnumerator()) {
    $File = $Entry.Key
    $Permission = $Entry.Value

    if (-not (Test-Path $File)) {
        FAIL "Route wrapper missing: $File"
        continue
    }

    $Text = Get-Content $File -Raw

    if ($Text -match 'requirePermission') {
        if ($Text -match [regex]::Escape($Permission)) {
            PASS "Route guard: $File -> $Permission"
        } else {
            WARN "Route guard exists but permission text not directly detected: $File"
        }
    } else {
        FAIL "No requirePermission detected: $File"
    }
}

Section "8. MIGRATION AUDIT"

$Migrations = @(
    "supabase/migrations/20260922110000_sec010_product_write_hardening.sql",
    "supabase/migrations/20260922150000_sec012_data_read_authorization.sql"
)

foreach ($File in $Migrations) {
    if (-not (Test-Path $File)) {
        FAIL "Migration missing: $File"
        continue
    }

    $Text = Get-Content $File -Raw

    if ($Text -match 'SECURITY DEFINER') {
        PASS "$File contains SECURITY DEFINER protection"
    } else {
        WARN "$File does not contain SECURITY DEFINER"
    }

    if ($Text -match 'SET search_path TO [''"]?public') {
        PASS "$File controls search_path"
    } else {
        WARN "$File search_path hardening not detected"
    }

    if ($Text -match 'REVOKE') {
        PASS "$File contains privilege hardening"
    } else {
        WARN "$File contains no REVOKE statement"
    }

    if ($Text -match 'COMMIT;') {
        PASS "$File has explicit COMMIT"
    } else {
        WARN "$File has no explicit COMMIT"
    }
}

Section "9. SUPABASE LIVE INTEGRATION"

$SupabaseAvailable = $false

try {
    $SupabaseVersion = npx supabase --version 2>&1

    if ($LASTEXITCODE -eq 0 -and $SupabaseVersion) {
        $SupabaseAvailable = $true
        PASS "Supabase CLI available via npx: $SupabaseVersion"
    }
}
catch {
    $SupabaseAvailable = $false
}

if (-not $SupabaseAvailable) {
    SKIP "Supabase CLI is not available through npx"
}
else {
    $SupabaseProjects = npx supabase projects list 2>&1

    if ($LASTEXITCODE -eq 0) {
        PASS "Supabase projects list"

        $SupabaseRef = "hkegkpjbqkoiuuwrrvpp"

        if ($SupabaseProjects -match $SupabaseRef) {
            PASS "Supabase linked project detected: $SupabaseRef"
        }
        else {
            FAIL "Expected Supabase project reference not found: $SupabaseRef"
        }
    }
    else {
        FAIL "Supabase projects list failed"
    }

    $SupabaseMigrations = npx supabase migration list --linked 2>&1

    if ($LASTEXITCODE -eq 0) {
        PASS "Supabase migration list --linked"

        if ($SupabaseMigrations -match "20260922110000") {
            PASS "SEC-010 migration detected"
        }
        else {
            FAIL "SEC-010 migration not detected"
        }

        if ($SupabaseMigrations -match "20260922150000") {
            PASS "SEC-012 migration detected"
        }
        else {
            FAIL "SEC-012 migration not detected"
        }

    if ($SupabaseMigrations -match "20260922110000") {
        PASS "SEC-010 migration ID present in linked migration list"
    }
    else {
        WARN "SEC-010 migration ID not confirmed in linked migration list"
    }

    if ($SupabaseMigrations -match "20260922150000") {
        PASS "SEC-012 migration ID present in linked migration list"
    }
    else {
        WARN "SEC-012 migration ID not confirmed in linked migration list"
    }
    }
    else {
        FAIL "Supabase migration list --linked failed"
    }
}


Section "10. VERCEL LIVE INTEGRATION"

$VercelAvailable = $false

try {
    $VercelVersion = npx vercel --version 2>&1

    if ($LASTEXITCODE -eq 0 -and $VercelVersion) {
        $VercelAvailable = $true
        PASS "Vercel CLI available via npx: $VercelVersion"
    }
}
catch {
    $VercelAvailable = $false
}

if (-not $VercelAvailable) {
    SKIP "Vercel CLI is not available through npx"
}
else {
    $VercelWho = npx vercel whoami 2>&1

    if ($LASTEXITCODE -eq 0) {
        PASS "Vercel authentication"

        if ($VercelWho -match "sbayujaya-4745") {
            PASS "Expected Vercel account detected"
        }
        else {
            WARN "Expected Vercel account text not detected"
        }
    }
    else {
        FAIL "Vercel whoami failed"
    }

    $VercelProjects = npx vercel projects ls 2>&1

    if ($LASTEXITCODE -eq 0) {
        PASS "Vercel projects list"

        if ($VercelProjects -match "warunghrdgje") {
            PASS "Warung HRD Vercel project detected"
        }
        else {
            FAIL "Warung HRD Vercel project not detected"
        }
    }
    else {
        FAIL "Vercel projects list failed"
    }
}

Section "11. TYPESCRIPT"

if (Test-Path "package.json") {
    try {
        npx tsc --noEmit

        if ($LASTEXITCODE -eq 0) {
            PASS "TypeScript check"
        } else {
            FAIL "TypeScript check failed"
        }
    } catch {
        FAIL "TypeScript command failed: $($_.Exception.Message)"
    }
} else {
    FAIL "package.json missing"
}

Section "12. PRODUCTION BUILD"

if (Test-Path "package.json") {
    try {
        npm run build

        if ($LASTEXITCODE -eq 0) {
            PASS "Production build"
        } else {
            FAIL "Production build failed"
        }
    } catch {
        FAIL "Production build command failed: $($_.Exception.Message)"
    }
}

Section "13. GIT SECURITY FILE DISCOVERY"

$DangerousPatterns = @(
    '\.from\(["'']products["'']\)\s*\.select\(["'']\*["'']',
    '\.from\(["'']sale_items["'']\)\s*\.select\(["'']\*["'']',
    '\.from\(["'']stock_movements["'']\)\s*\.select\(["'']\*["'']',
    '\.from\(["'']profiles["'']\)\s*\.select\(["'']\*["'']'
)

foreach ($Pattern in $DangerousPatterns) {
    $Matches = @(
        $SourceFiles |
            Select-String -Pattern $Pattern -AllMatches |
            Where-Object {
                $_.Path -notmatch '\\backup-' -and
                $_.Path -notmatch '\\evidence\\'
            }
    )

    if ($Matches.Count -eq 0) {
        PASS "No broad direct read pattern: $Pattern"
    } else {
        WARN "Broad direct read pattern detected: $Pattern"
        $Matches | ForEach-Object {
            Write-Report "  $($_.Path):$($_.LineNumber): $($_.Line.Trim())"
        }
    }
}

Section "14. FINAL RESULT"

Write-Report ""
Write-Report "PASS : $Pass" Green
Write-Report "FAIL : $Fail" Red
Write-Report "WARN : $Warn" Yellow
Write-Report "SKIP : $Skip" DarkYellow
Write-Report ""
Write-Report "REPORT: $Report"

if ($Fail -eq 0) {
    Write-Report ""
    Write-Report "SEC-013 MASTER SECURITY AUDIT: PASS" Green
    exit 0
} else {
    Write-Report ""
    Write-Report "SEC-013 MASTER SECURITY AUDIT: FAIL" Red
    exit 1
}




