$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SEC-012 AUTOMATED SECURITY TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$Root = (Get-Location).Path
$Pass = 0
$Fail = 0

function Test-Pass {
    param([string]$Message)
    $script:Pass++
    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Test-Fail {
    param([string]$Message)
    $script:Fail++
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Test-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Yellow
}

# ============================================================
# 1. REQUIRED FILES
# ============================================================

Write-Host ""
Write-Host "[1] REQUIRED FILES" -ForegroundColor Cyan

$requiredFiles = @(
    "lib\produk\produkService.ts",
    "lib\penjualan\penjualanService.ts",
    "lib\penjualan\keuntunganService.ts",
    "app\produk\ProdukPageClient.tsx",
    "app\produk\penjualan\ProdukPenjualan.tsx",
    "app\laporan\harian\LaporanHarianPageClient.tsx"
)

foreach ($file in $requiredFiles) {
    if (Test-Path (Join-Path $Root $file)) {
        Test-Pass $file
    }
    else {
        Test-Fail "$file missing"
    }
}

# ============================================================
# 2. TYPESCRIPT
# ============================================================

Write-Host ""
Write-Host "[2] TYPESCRIPT" -ForegroundColor Cyan

npx tsc --noEmit

if ($LASTEXITCODE -eq 0) {
    Test-Pass "TypeScript compilation"
}
else {
    Test-Fail "TypeScript compilation"
}

# ============================================================
# 3. PRODUCTION BUILD
# ============================================================

Write-Host ""
Write-Host "[3] PRODUCTION BUILD" -ForegroundColor Cyan

npm run build

if ($LASTEXITCODE -eq 0) {
    Test-Pass "Production build"
}
else {
    Test-Fail "Production build"
}

# ============================================================
# 4. KASIR COST EXPOSURE
# ============================================================

Write-Host ""
Write-Host "[4] KASIR COST EXPOSURE AUDIT" -ForegroundColor Cyan

$kasirFiles = @(
    "app\penjualan\PenjualanPageClient.tsx",
    "app\produk\penjualan\ProdukPenjualan.tsx"
)

$costFound = $false

foreach ($file in $kasirFiles) {

    $path = Join-Path $Root $file

    if (-not (Test-Path $path)) {
        Test-Fail "$file missing"
        continue
    }

    $matches = Select-String `
        -Path $path `
        -Pattern "harga_beli" `
        -SimpleMatch `
        -ErrorAction SilentlyContinue

    if ($matches) {

        $costFound = $true

        Write-Host ""
        Write-Host "harga_beli found in $file" -ForegroundColor Red

        $matches | ForEach-Object {
            Write-Host "  Line $($_.LineNumber): $($_.Line)"
        }
    }
}

if (-not $costFound) {
    Test-Pass "Kasir components contain no harga_beli"
}
else {
    Test-Fail "Kasir components still contain harga_beli"
}

# ============================================================
# 5. DIRECT PRODUCTS READ - COST EXPOSURE AUDIT
# ============================================================

Write-Host ""
Write-Host "[5] DIRECT PRODUCTS COST EXPOSURE AUDIT" -ForegroundColor Cyan

$productMatches = Get-ChildItem ".\app",".\lib" `
    -Recurse `
    -File `
    -Include *.ts,*.tsx |
    Select-String -Pattern '\.from\("products"\)' `
    -ErrorAction SilentlyContinue

$productCostExposure = $false

foreach ($match in $productMatches) {

    $line = $match.Line

    if (
        $line -match "harga_beli" -or
        $line -match "hargaBeli"
    ) {
        $productCostExposure = $true

        Write-Host ""
        Write-Host "Potential cost exposure:" -ForegroundColor Red
        Write-Host "  $($match.Path):$($match.LineNumber): $line"
    }
}

if (-not $productCostExposure) {
    Test-Pass "Direct products reads do not request harga_beli"
}
else {
    Test-Fail "Direct products read may expose harga_beli"
}

# ============================================================
# 6. DIRECT SALE_ITEMS READ - COST EXPOSURE AUDIT
# ============================================================

Write-Host ""
Write-Host "[6] DIRECT SALE_ITEMS COST EXPOSURE AUDIT" -ForegroundColor Cyan

$saleItemMatches = Get-ChildItem ".\app",".\lib" `
    -Recurse `
    -File `
    -Include *.ts,*.tsx |
    Select-String -Pattern '\.from\("sale_items"\)' `
    -ErrorAction SilentlyContinue

$saleItemCostExposure = $false

foreach ($match in $saleItemMatches) {

    $line = $match.Line

    if (
        $line -match "harga_beli" -or
        $line -match "hargaBeli"
    ) {
        $saleItemCostExposure = $true

        Write-Host ""
        Write-Host "Potential cost exposure:" -ForegroundColor Red
        Write-Host "  $($match.Path):$($match.LineNumber): $line"
    }
}

if (-not $saleItemCostExposure) {
    Test-Pass "Direct sale_items reads do not request harga_beli"
}
else {
    Test-Fail "Direct sale_items read may expose harga_beli"
}
# ============================================================
# 8. PROFIT ADMIN RPC
# ============================================================

Write-Host ""
Write-Host "[8] PROFIT ADMIN RPC" -ForegroundColor Cyan

$profitServicePath = Join-Path $Root "lib\penjualan\keuntunganService.ts"
$profitContent = Get-Content $profitServicePath -Raw

if ($profitContent -match "ambil_detail_keuntungan_admin") {
    Test-Pass "Profit service uses Admin RPC"
}
else {
    Test-Fail "Profit Admin RPC not found"
}

# ============================================================
# 9. NO DIRECT SALES / SALE_ITEMS IN PROFIT SERVICE
# ============================================================

Write-Host ""
Write-Host "[9] PROFIT SERVICE DIRECT READ AUDIT" -ForegroundColor Cyan

if ($profitContent -match '\.from\("sales"\)') {
    Test-Fail "Direct sales read remains in keuntunganService"
}
else {
    Test-Pass "No direct sales read in keuntunganService"
}

if ($profitContent -match '\.from\("sale_items"\)') {
    Test-Fail "Direct sale_items read remains in keuntunganService"
}
else {
    Test-Pass "No direct sale_items read in keuntunganService"
}

# ============================================================
# 10. PROFIT FORMULA INTEGRITY
# ============================================================

Write-Host ""
Write-Host "[10] PROFIT FORMULA INTEGRITY" -ForegroundColor Cyan

$formulaPatterns = @(
    "hargaBeli",
    "hargaJual",
    "jumlah",
    "omzet",
    "modal",
    "keuntungan",
    "marginPersen"
)

$missingFormula = @()

foreach ($pattern in $formulaPatterns) {

    if ($profitContent -notmatch [regex]::Escape($pattern)) {
        $missingFormula += $pattern
    }
}

if ($missingFormula.Count -eq 0) {
    Test-Pass "Profit formula variables preserved"
}
else {
    Test-Fail "Missing formula variables: $($missingFormula -join ', ')"
}

# ============================================================
# 11. ACTIVE HARGA_BELI AUDIT
# ============================================================

Write-Host ""
Write-Host "[11] ACTIVE APP/LIB HARGA_BELI AUDIT" -ForegroundColor Cyan

$hargaBeliMatches = Get-ChildItem ".\app",".\lib" `
    -Recurse `
    -File `
    -Include *.ts,*.tsx |
    Select-String -Pattern "harga_beli|hargaBeli" `
    -ErrorAction SilentlyContinue

if ($hargaBeliMatches) {

    $hargaBeliMatches | ForEach-Object {
        Write-Host "  $($_.Path):$($_.LineNumber): $($_.Line)"
    }

    Test-Info "harga_beli/hargaBeli references exist; review whether they are Admin-only or formula-related"
}
else {
    Test-Pass "No harga_beli/hargaBeli references found"
}

# ============================================================
# 12. SEC-009 PROTECTED FILES
# ============================================================

Write-Host ""
Write-Host "[12] SEC-009 PROTECTED FILE AUDIT" -ForegroundColor Cyan

$protectedFiles = @(
    "scripts\phases\SEC-009\reporting-baseline.sql",
    "scripts\phases\SEC-009\reporting-code-audit.ps1",
    "scripts\phases\SEC-009\cross-report-reconciliation.sql",
    "scripts\phases\SEC-009\phase6-final-daily-monthly.sql",
    "scripts\phases\SEC-009\phase6-final-revenue.sql",
    "scripts\phases\SEC-009\phase6-final-profit.sql",
    "scripts\phases\SEC-009\phase6-profit-formula-hardening.sql",
    "scripts\phases\SEC-009\phase6-audit-e.sql"
)

foreach ($file in $protectedFiles) {

    if (Test-Path (Join-Path $Root $file)) {
        Test-Pass "Protected file exists: $file"
    }
    else {
        Test-Fail "Protected file missing: $file"
    }
}

# ============================================================
# 13. GIT STATUS
# ============================================================

Write-Host ""
Write-Host "[13] GIT STATUS" -ForegroundColor Cyan

git status --short

if ($LASTEXITCODE -eq 0) {
    Test-Pass "Git status readable"
}
else {
    Test-Fail "Git status failed"
}

# ============================================================
# FINAL RESULT
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SEC-012 AUTOMATED TEST RESULT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "PASS : $Pass" -ForegroundColor Green
Write-Host "FAIL : $Fail" -ForegroundColor Red
Write-Host ""

if ($Fail -eq 0) {
    Write-Host "SEC-012 AUTOMATED TEST: PASS" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "SEC-012 AUTOMATED TEST: REVIEW REQUIRED" -ForegroundColor Red
    exit 1
}
