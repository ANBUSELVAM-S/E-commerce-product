$ErrorActionPreference = "Stop"

$services = @(
    "product-service"
    # "inventory-service",
    # "cart-service",
    # "order-service",
    # "payment-service",
    
)

$baseDir = "c:\Product\ecommerce-backend"
$outDir = "$baseDir\terraform\lambda-packages"

foreach ($service in $services) {
    Write-Host "=== Packaging $service ===" -ForegroundColor Cyan
    $serviceDir = "$baseDir\$service"
    
    Set-Location -Path $serviceDir
    Write-Host "  Installing dependencies..."
    npm install --production --silent 2>&1 | Out-Null

    $zipPath = "$outDir\$service.zip"
    if (Test-Path -Path $zipPath) {
        Remove-Item -Path $zipPath -Force
    }
    
    Write-Host "  Creating zip..."
    Compress-Archive -Path "$serviceDir\*" -DestinationPath $zipPath -Force
    
    $size = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Host "  Done! ($size MB)" -ForegroundColor Green
}

Write-Host "`nAll services packaged!" -ForegroundColor Green
Set-Location -Path "$baseDir\terraform"
