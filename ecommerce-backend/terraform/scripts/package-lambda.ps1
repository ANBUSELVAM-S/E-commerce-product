$services = @(
    "auth-service",
    "product-service",
    "inventory-service",
    "cart-service",
    "order-service",
    "payment-service",
    "notification-service"
)

$baseDir = "c:\Product\ecommerce-backend"
$outDir = "$baseDir\terraform\lambda-packages"

# Create output directory if it doesn't exist
if (-not (Test-Path -Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

foreach ($service in $services) {
    Write-Host "Packaging $service..."
    $serviceDir = "$baseDir\$service"
    
    # 1. Install production dependencies
    Write-Host "  Installing production dependencies..."
    Set-Location -Path $serviceDir
    npm install --production --silent

    # 2. Create zip archive
    $zipPath = "$outDir\$service.zip"
    if (Test-Path -Path $zipPath) {
        Remove-Item -Path $zipPath
    }
    
    Write-Host "  Zipping to $zipPath..."
    # Zip everything except node_modules/.cache, testing, tests, etc (basic filter)
    Compress-Archive -Path ".\*" -DestinationPath $zipPath -Force
    
    Write-Host "  $service packaged successfully!"
}

Write-Host "All services packaged to $outDir"
Set-Location -Path "$baseDir\terraform"
