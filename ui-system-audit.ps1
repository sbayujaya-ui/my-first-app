$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " WARUNG HRD - UI SYSTEM AUDIT" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

$files = @(
    "app\components\AppShell.tsx",
    "app\page.tsx",
    "app\globals.css",
    "app\produk\page.tsx",
    "app\penjualan\page.tsx",
    "app\laporan\page.tsx",
    "app\laporan\harian\page.tsx",
    "app\laporan\bulanan\page.tsx",
    "app\laporan\keuntungan\page.tsx",
    "app\scan\page.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw

        Write-Host ""
        Write-Host "[FILE] $file" -ForegroundColor Yellow
        Write-Host "  Size : $($content.Length) chars"
        Write-Host "  Lines: $((Get-Content $file).Count)"

        $patterns = @(
            "emoji|ðŸ|â˜|Ã",
            "bg-slate",
            "bg-white",
            "rounded",
            "shadow",
            "p-6",
            "p-4",
            "text-3xl",
            "text-2xl",
            "grid-cols-",
            "max-w-",
            "w-full",
            "min-h-",
            "overflow-x"
        )

        foreach ($pattern in $patterns) {
            $matches = [regex]::Matches($content, $pattern, "IgnoreCase")

            if ($matches.Count -gt 0) {
                Write-Host "  $pattern : $($matches.Count)" -ForegroundColor DarkGray
            }
        }
    }
    else {
        Write-Host "[MISSING] $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " CHECK UTF / MOJIBAKE" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

$allFiles = Get-ChildItem app -Recurse -File |
    Where-Object {
        $_.Extension -in ".tsx", ".ts", ".css"
    }

foreach ($file in $allFiles) {
    $content = Get-Content $file.FullName -Raw

    if ($content -match "ðŸ|â˜|Ã") {
        Write-Host "[MOJIBAKE] $($file.FullName)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " CHECK DASHBOARD STRUCTURE" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

$dashboard = Get-Content "app\page.tsx" -Raw

$dashboardChecks = @(
    "Pusat Fitur",
    "Pusat Laporan",
    "Ringkasan Stok",
    "Ringkasan Hari Ini",
    "Produk",
    "Penjualan",
    "Keuangan",
    "WARUNG HRD"
)

foreach ($item in $dashboardChecks) {
    if ($dashboard.Contains($item)) {
        Write-Host "[FOUND] $item" -ForegroundColor Green
    }
    else {
        Write-Host "[MISSING] $item" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " CHECK APPSHELL" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

$shell = Get-Content "app\components\AppShell.tsx" -Raw

$shellChecks = @(
    "w-72",
    "lg:translate-x-0",
    "lg:pl-72",
    "lg:hidden",
    "createClient",
    "signOut",
    "/produk",
    "/penjualan",
    "/scan",
    "/laporan/keuntungan"
)

foreach ($item in $shellChecks) {
    if ($shell.Contains($item)) {
        Write-Host "[FOUND] $item" -ForegroundColor Green
    }
    else {
        Write-Host "[MISSING] $item" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " UI AUDIT SELESAI" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
