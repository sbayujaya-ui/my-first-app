$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================"
Write-Host " SEC-009 REPORTING CODE AUDIT"
Write-Host "========================================"
Write-Host ""

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path

$targetFiles = @(
    "lib\penjualan\dashboardService.ts",
    "lib\penjualan\penjualanService.ts",
    "lib\penjualan\keuntunganService.ts",
    "app\laporan\page.tsx",
    "app\laporan\harian\page.tsx",
    "app\laporan\bulanan\page.tsx",
    "app\laporan\bulanan\LaporanBulananPageClient.tsx",
    "app\laporan\keuntungan\page.tsx",
    "app\laporan\keuntungan\KeuntunganPageClient.tsx"
)

Write-Host ">>> TARGET FILES"
Write-Host ""

foreach ($relativePath in $targetFiles) {

    $fullPath = Join-Path $projectRoot $relativePath

    if (Test-Path $fullPath) {
        Write-Host "FOUND - $relativePath"
    }

    if (-not (Test-Path $fullPath)) {
        Write-Host "MISSING - $relativePath"
    }
}

Write-Host ""
Write-Host ">>> SEARCH REPORTING DATA SOURCES"
Write-Host ""

$searchTerms = @(
    "from('sales')",
    "from(`"sales`")",
    "from('sale_items')",
    "from(`"sale_items`")",
    "harga_beli",
    "subtotal",
    "jumlah",
    "created_at",
    "tanggal",
    "date_trunc",
    "startDate",
    "endDate",
    "total",
    "keuntungan",
    "profit",
    "laba"
)

foreach ($term in $searchTerms) {

    Write-Host ""
    Write-Host "----- SEARCH: $term -----"

    foreach ($relativePath in $targetFiles) {

        $fullPath = Join-Path $projectRoot $relativePath

        if (Test-Path $fullPath) {

            $matches = Select-String `
                -Path $fullPath `
                -Pattern $term `
                -SimpleMatch `
                -ErrorAction SilentlyContinue

            foreach ($match in $matches) {
                Write-Host "$relativePath : $($match.LineNumber)"
                Write-Host "  $($match.Line.Trim())"
            }
        }
    }
}

Write-Host ""
Write-Host ">>> SOURCE FILE CONTENT SUMMARY"
Write-Host ""

foreach ($relativePath in $targetFiles) {

    $fullPath = Join-Path $projectRoot $relativePath

    if (Test-Path $fullPath) {

        $lines = (Get-Content $fullPath).Count

        Write-Host "$relativePath"
        Write-Host "  Lines: $lines"
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host " REPORTING CODE AUDIT COMPLETE"
Write-Host "========================================"
