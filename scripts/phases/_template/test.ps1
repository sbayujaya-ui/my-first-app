$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "SEC-008 TEST"
Write-Host "============="

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path

Write-Host "Project root:"
Write-Host "  $projectRoot"
Write-Host ""

$requiredFiles = @(
    "phase-executor.ps1",
    "project-doctor.mjs",
    "package.json"
)

foreach ($file in $requiredFiles) {

    $path = Join-Path $projectRoot $file

    if (Test-Path $path) {
        Write-Host "PASS - $file"
    } else {
        Write-Host "FAILED - $file"
        exit 1
    }
}

Write-Host ""
Write-Host "SEC-008 scaffold test PASS"

exit 0
