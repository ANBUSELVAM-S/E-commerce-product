param (
    [string]$SeverityThreshold = "high"
)

Write-Host "========================================="
Write-Host "Snyk Local Security Scan"
Write-Host "Severity Threshold: $SeverityThreshold"
Write-Host "========================================="

if (!(Get-Command snyk -ErrorAction SilentlyContinue)) {
    Write-Error "Snyk CLI is not installed. Please install it first."
    exit 1
}

if ([string]::IsNullOrWhiteSpace($env:SNYK_TOKEN)) {
    Write-Error "SNYK_TOKEN is not configured. Export it locally before running."
    exit 1
}

$RootDir = Get-Location
$SecurityReportsDir = Join-Path $RootDir "security-reports"
if (!(Test-Path $SecurityReportsDir)) {
    New-Item -ItemType Directory -Force -Path $SecurityReportsDir | Out-Null
}

$ExitCode = 0

$Projects = @(
    "ecommerce-frontend",
    "ecommerce-backend",
    "ecommerce-backend/auth-service",
    "ecommerce-backend/cart-service",
    "ecommerce-backend/inventory-service",
    "ecommerce-backend/notification-service",
    "ecommerce-backend/notification-worker",
    "ecommerce-backend/order-service",
    "ecommerce-backend/payment-service",
    "ecommerce-backend/product-service"
)

foreach ($Proj in $Projects) {
    $ProjPath = Join-Path $RootDir $Proj
    $PackageJsonPath = Join-Path $ProjPath "package.json"
    
    if (Test-Path $PackageJsonPath) {
        Write-Host "Scanning dependencies in $Proj..."
        Set-Location $ProjPath
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "snyk"
        $processInfo.Arguments = "test --file=package.json --package-manager=npm --dev --severity-threshold=$SeverityThreshold --strict-out-of-sync=true --sarif-file-output=snyk-open-source.sarif"
        $processInfo.UseShellExecute = $false
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        $process.WaitForExit()
        $ScanExit = $process.ExitCode
        
        if ($ScanExit -ne 0 -and $ScanExit -ne 1) {
            Write-Error "Snyk encountered a fatal error scanning $Proj"
            $ExitCode = 1
        } elseif ($ScanExit -eq 1) {
            Write-Warning "Vulnerabilities found in $Proj"
            $ExitCode = 1
        }
        
        if (Test-Path "snyk-open-source.sarif") {
            $ReportName = $Proj -replace '/', '-'
            Move-Item "snyk-open-source.sarif" (Join-Path $SecurityReportsDir "snyk-open-source-$ReportName.sarif") -Force
        }
        
        Set-Location $RootDir
    }
}

$TfDir = Join-Path $RootDir "ecommerce-backend/terraform"
if (Test-Path $TfDir) {
    Write-Host "Scanning Terraform..."
    Set-Location $RootDir
    
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "snyk"
    $processInfo.Arguments = "iac test ecommerce-backend/terraform --severity-threshold=$SeverityThreshold --sarif-file-output=$SecurityReportsDir/snyk-iac.sarif"
    $processInfo.UseShellExecute = $false
    
    $process = [System.Diagnostics.Process]::Start($processInfo)
    $process.WaitForExit()
    $ScanExit = $process.ExitCode
    
    if ($ScanExit -ne 0 -and $ScanExit -ne 1) {
        Write-Error "Snyk encountered a fatal error scanning terraform"
        $ExitCode = 1
    } elseif ($ScanExit -eq 1) {
        Write-Warning "Vulnerabilities found in Terraform"
        $ExitCode = 1
    }
}

if ($ExitCode -ne 0) {
    Write-Host "========================================="
    Write-Host "Security issues were found. Check security-reports/ for details." -ForegroundColor Red
    exit 1
} else {
    Write-Host "========================================="
    Write-Host "✅ No high or critical issues found!" -ForegroundColor Green
    exit 0
}
