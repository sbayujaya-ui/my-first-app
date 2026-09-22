$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================"
Write-Host "SEC-014 PHASE 5 - MASTER SECURITY REGRESSION"
Write-Host "============================================"
Write-Host ""

$Failed = $false

# --------------------------------------------------
# 1. SEC-013 MASTER RUNNER
# --------------------------------------------------

Write-Host "1. SEC-013 MASTER RUNNER"
Write-Host "--------------------------------------------"

powershell -ExecutionPolicy Bypass -File ".\scripts\master\security-runner.ps1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] SEC-013 Master Security Runner"
}
else {
    Write-Host "[FAIL] SEC-013 Master Security Runner"
    exit 1
}

# --------------------------------------------------
# 2. EXPLICIT SELECT REGRESSION
# --------------------------------------------------

Write-Host ""
Write-Host "2. EXPLICIT SELECT REGRESSION"
Write-Host "--------------------------------------------"

$File = ".\lib\penjualan\penjualanService.ts"

if (-not (Test-Path $File)) {
    Write-Host "[FAIL] File not found: $File"
    exit 1
}

$Source = Get-Content $File -Raw

if ($Source -match '\.from\("sales"\)(\s*)\.select\("id,tanggal,total,pembayaran,kembalian,created_at"\)') {
    Write-Host "[PASS] sales explicit SELECT preserved"
}
else {
    Write-Host "[FAIL] sales explicit SELECT missing"
    exit 1
}

if ($Source -match '\.from\("sale_items"\)(\s*)\.select\("id,sale_id,product_id,harga,jumlah,subtotal"\)') {
    Write-Host "[PASS] sale_items explicit SELECT preserved"
}
else {
    Write-Host "[FAIL] sale_items explicit SELECT missing"
    exit 1
}

# --------------------------------------------------
# 3. SENSITIVE FIELD REGRESSION
# --------------------------------------------------

Write-Host ""
Write-Host "3. SENSITIVE FIELD REGRESSION"
Write-Host "--------------------------------------------"

$KasirFiles = @(
    ".\app\penjualan\PenjualanPageClient.tsx",
    ".\app\produk\penjualan\ProdukPenjualan.tsx"
)

foreach ($FilePath in $KasirFiles) {

    if (-not (Test-Path $FilePath)) {
        Write-Host "[FAIL] File not found: $FilePath"
        exit 1
    }

    $Content = Get-Content $FilePath -Raw

    if ($Content -match "harga_beli|hargaBeli") {
        Write-Host "[FAIL] Sensitive cost reference found: $FilePath"
        exit 1
    }
    else {
        Write-Host "[PASS] No cost reference: $FilePath"
    }
}

# --------------------------------------------------
# 4. ROUTE AUTHORIZATION REGRESSION
# --------------------------------------------------

Write-Host ""
Write-Host "4. ROUTE AUTHORIZATION REGRESSION"
Write-Host "--------------------------------------------"

$RouteChecks = @{
    ".\app\page.tsx" = 'requirePermission\("dashboard"\)'
    ".\app\produk\page.tsx" = 'requirePermission\("produk\.view"\)'
    ".\app\penjualan\page.tsx" = 'requirePermission\("penjualan"\)'
    ".\app\scan\page.tsx" = 'requirePermission\("scan"\)'
    ".\app\laporan\page.tsx" = 'requirePermission\("laporan\.riwayat"\)'
    ".\app\laporan\harian\page.tsx" = 'requirePermission\("laporan\.harian"\)'
    ".\app\laporan\bulanan\page.tsx" = 'requirePermission\("laporan\.bulanan"\)'
    ".\app\laporan\keuntungan\page.tsx" = 'requirePermission\("laporan\.keuntungan"\)'
}

foreach ($Entry in $RouteChecks.GetEnumerator()) {

    $RouteFile = $Entry.Key
    $Pattern = $Entry.Value

    if (-not (Test-Path $RouteFile)) {
        Write-Host "[FAIL] Route file missing: $RouteFile"
        exit 1
    }

    $Content = Get-Content $RouteFile -Raw

    if ($Content -match $Pattern) {
        Write-Host "[PASS] $RouteFile"
    }
    else {
        Write-Host "[FAIL] $RouteFile"
        exit 1
    }
}

# --------------------------------------------------
# 5. PROFIT SERVICE REGRESSION
# --------------------------------------------------

Write-Host ""
Write-Host "5. PROFIT SERVICE REGRESSION"
Write-Host "--------------------------------------------"

$ProfitFile = ".\lib\penjualan\keuntunganService.ts"

if (-not (Test-Path $ProfitFile)) {
    Write-Host "[FAIL] Profit service file missing"
    exit 1
}

$ProfitSource = Get-Content $ProfitFile -Raw

if ($ProfitSource -match 'rpc\("ambil_detail_keuntungan_admin"') {
    Write-Host "[PASS] Profit service still uses Admin RPC"
}
else {
    Write-Host "[FAIL] Profit Admin RPC missing"
    exit 1
}

if ($ProfitSource -match 'hargaBeli|harga_beli') {
    Write-Host "[PASS] Profit cost formula references preserved"
}
else {
    Write-Host "[FAIL] Profit cost formula references missing"
    exit 1
}

if ($ProfitSource -match '\.from\("sales"\)') {
    Write-Host "[FAIL] Direct sales read returned to profit service"
    exit 1
}
else {
    Write-Host "[PASS] No direct sales read in profit service"
}

if ($ProfitSource -match '\.from\("sale_items"\)') {
    Write-Host "[FAIL] Direct sale_items read returned to profit service"
    exit 1
}
else {
    Write-Host "[PASS] No direct sale_items read in profit service"
}

# --------------------------------------------------
# FINAL RESULT
# --------------------------------------------------

Write-Host ""
Write-Host "============================================"
Write-Host "SEC-014 PHASE 5 COMPLETE"
Write-Host "============================================"
Write-Host ""

Write-Host "Master Runner       : PASS"
Write-Host "Explicit SELECT     : PASS"
Write-Host "Kasir cost boundary : PASS"
Write-Host "Route authorization : PASS"
Write-Host "Profit boundary     : PASS"
Write-Host ""
Write-Host "Database            : NO"
Write-Host "Migration           : NO"
Write-Host "Commit              : NO"
Write-Host "Push                : NO"
Write-Host "Deployment          : NO"
Write-Host ""
