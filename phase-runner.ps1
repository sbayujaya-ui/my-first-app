$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================"
Write-Host " WARUNG HRD - MASTER PHASE RUNNER"
Write-Host "========================================"
Write-Host ""

$steps = @(
    @{
        Name = "STEP 01 - GIT STATUS"
        Command = { git status --short }
    },
    @{
        Name = "STEP 02 - PROJECT DOCTOR"
        Command = { npm run doctor }
    },
    @{
        Name = "STEP 03 - TYPESCRIPT"
        Command = { npx tsc --noEmit }
    },
    @{
        Name = "STEP 04 - QUALITY AND BUILD"
        Command = { node scripts/check-quality.mjs }
    },
    @{
        Name = "STEP 05 - INVENTORY AUDIT"
        Command = { npm run inventory:audit }
    }
)

$passed = 0

foreach ($step in $steps) {

    Write-Host ""
    Write-Host "----------------------------------------"
    Write-Host $step.Name
    Write-Host "----------------------------------------"

    try {
        & $step.Command

        if ($LASTEXITCODE -ne 0) {
            throw "Command gagal dengan exit code $LASTEXITCODE"
        }

        Write-Host ""
        Write-Host "STATUS: PASS"
        $passed++
    }
    catch {
        Write-Host ""
        Write-Host "STATUS: FAILED"
        Write-Host "ERROR: $($_.Exception.Message)"
        Write-Host ""
        Write-Host "========================================"
        Write-Host " PHASE STOPPED"
        Write-Host "========================================"
        Write-Host "Passed: $passed / $($steps.Count)"
        exit 1
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host " ALL PHASE CHECKS PASSED"
Write-Host "========================================"
Write-Host "Passed: $passed / $($steps.Count)"
Write-Host ""
