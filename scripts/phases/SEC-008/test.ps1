$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================"
Write-Host " SEC-008 TEST"
Write-Host "========================================"
Write-Host ""

$requiredFiles = @(
    "implementation.ps1",
    "test.ps1",
    "sec008-audit.sql"
)

$failed = $false

foreach ($file in $requiredFiles) {

    $path = Join-Path $PSScriptRoot $file

    if (Test-Path $path) {
        Write-Host "PASS - $file"
    }

    if (-not (Test-Path $path)) {
        Write-Host "FAILED - $file"
        $failed = $true
    }
}

if ($failed) {
    Write-Host "SEC-008 TEST: FAILED"
    throw "SEC-008 required file test failed."
}

Write-Host ""
Write-Host "SEC-008 TEST: PASS"
