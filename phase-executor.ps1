$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================"
Write-Host " WARUNG HRD - PHASE EXECUTOR"
Write-Host "========================================"
Write-Host ""

$phase = $args[0]

if ([string]::IsNullOrWhiteSpace($phase)) {
    Write-Host "ERROR: Nama phase belum diberikan."
    Write-Host ""
    Write-Host "Contoh:"
    Write-Host "  .\phase-executor.ps1 SEC-008"
    return
}

$phase = $phase.TrimEnd('\','/',' ')

if ($phase -notmatch '^[A-Za-z0-9_-]+$') {
    Write-Host "ERROR: Nama phase tidak valid: $phase"
    return
}

$phaseDir = Join-Path ".\scripts\phases" $phase
$implementationScript = Join-Path $phaseDir "implementation.ps1"
$testScript = Join-Path $phaseDir "test.ps1"

Write-Host "PHASE: $phase"
Write-Host "PHASE DIR: $phaseDir"
Write-Host ""

$steps = @(
    @{
        Name = "STEP 01 - PRE-CHECK"
        Command = {
            git status --short
            npm run doctor

            if ($LASTEXITCODE -ne 0) {
                throw "Project Doctor gagal."
            }

            npx tsc --noEmit

            if ($LASTEXITCODE -ne 0) {
                throw "TypeScript check gagal."
            }
        }
    },
    @{
        Name = "STEP 02 - IMPLEMENTATION"
        Command = {
            if (-not (Test-Path $implementationScript)) {
                Write-Host "Implementation script belum tersedia:"
                Write-Host "  $implementationScript"
                Write-Host ""
                Write-Host "STATUS: SKIPPED"
                return
            }

            Write-Host "Menjalankan:"
            Write-Host "  $implementationScript"
            Write-Host ""

            & $implementationScript

            if ($LASTEXITCODE -ne 0) {
                throw "Implementation phase gagal."
            }
        }
    },
    @{
        Name = "STEP 03 - TEST"
        Command = {
            if (Test-Path $testScript) {
                Write-Host "Menjalankan:"
                Write-Host "  $testScript"
                Write-Host ""

                & $testScript

                if ($LASTEXITCODE -ne 0) {
                    throw "Test phase gagal."
                }
            } else {
                Write-Host "Test script belum tersedia."
                Write-Host "Menjalankan TypeScript sebagai baseline test."

                npx tsc --noEmit

                if ($LASTEXITCODE -ne 0) {
                    throw "Baseline TypeScript test gagal."
                }
            }
        }
    },
    @{
        Name = "STEP 04 - AUDIT"
        Command = {
            npm run inventory:audit

            if ($LASTEXITCODE -ne 0) {
                throw "Inventory audit gagal."
            }
        }
    },
    @{
        Name = "STEP 05 - BUILD"
        Command = {
            npm run build

            if ($LASTEXITCODE -ne 0) {
                throw "Production build gagal."
            }
        }
    },
    @{
        Name = "STEP 06 - GIT GATE"
        Command = {
            git diff --check

            if ($LASTEXITCODE -ne 0) {
                throw "Git diff check gagal."
            }

            git status --short
        }
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
    return
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host " PHASE READY FOR REVIEW"
Write-Host "========================================"
Write-Host "Phase : $phase"
Write-Host "Passed: $passed / $($steps.Count)"
Write-Host ""
Write-Host "COMMIT/PUSH belum dilakukan otomatis."
Write-Host ""
