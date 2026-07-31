#!/bin/bash

set -e

echo "Starting backend Lambda packaging..."

TARGET_SERVICE=${1:-all}

# Define directories
ROOT_DIR=$(pwd)
BACKEND_DIR="$ROOT_DIR/ecommerce-backend"
OUTPUT_DIR="$ROOT_DIR/deployment/lambda-packages"

# Ensure clean output directory
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Define the exact services we discovered
SERVICES=(
  "auth-service"
  "cart-service"
  "inventory-service"
  "notification-service"
  "notification-worker"
  "order-service"
  "payment-service"
  "product-service"
)

for SERVICE in "${SERVICES[@]}"; do
  if [ "$TARGET_SERVICE" != "all" ]; then
    if [[ ",$TARGET_SERVICE," != *",$SERVICE,"* ]]; then
      continue
    fi
  fi

  echo "----------------------------------------"
  echo "Packaging $SERVICE..."
  
  SERVICE_DIR="$BACKEND_DIR/$SERVICE"
  if [ ! -d "$SERVICE_DIR" ]; then
    echo "::error::Directory $SERVICE_DIR does not exist!"
    exit 1
  fi
  
  # Create a clean temporary build directory for this service
  TEMP_BUILD_DIR=$(mktemp -d)
  
  # Copy service contents (excluding development/unnecessary files)
  echo "Copying source files to temp directory..."
  rsync -av --exclude='node_modules' \
            --exclude='tests' \
            --exclude='__tests__' \
            --exclude='coverage' \
            --exclude='.git' \
            --exclude='.github' \
            --exclude='.env*' \
            --exclude='README.md' \
            --exclude='*.log' \
            --exclude='*.zip' \
            "$SERVICE_DIR/" "$TEMP_BUILD_DIR/"
            
  cd "$TEMP_BUILD_DIR"
  
  # Install production dependencies only
  echo "Installing production dependencies..."
  if [ -f "package-lock.json" ]; then
    npm ci --omit=dev
  else
    echo "::error::package-lock.json missing in $SERVICE. It is required for reproducible builds."
    exit 1
  fi
  
  # Create ZIP archive
  ZIP_PATH="$OUTPUT_DIR/$SERVICE.zip"
  echo "Creating ZIP archive at $ZIP_PATH..."
  zip -q -r "$ZIP_PATH" .
  
  # Validate ZIP creation
  if [ ! -f "$ZIP_PATH" ]; then
    echo "::error::ZIP file creation failed for $SERVICE"
    exit 1
  fi
  
  ZIP_SIZE=$(stat -c%s "$ZIP_PATH")
  if [ "$ZIP_SIZE" -lt 100 ]; then
    echo "::error::ZIP file for $SERVICE is suspiciously small ($ZIP_SIZE bytes)"
    exit 1
  fi
  
  # Validate package.json exists at root of ZIP
  if ! unzip -l "$ZIP_PATH" | grep -q " package.json$"; then
    echo "::error::package.json is missing from the root of $SERVICE.zip"
    exit 1
  fi
  
  # Validate Lambda handler exists at correct path in ZIP
  if [ "$SERVICE" == "auth-service" ]; then
    HANDLER_PATH="index.js"
  else
    HANDLER_PATH="src/server.js"
  fi
  
  if ! unzip -l "$ZIP_PATH" | grep -q " $HANDLER_PATH$"; then
    echo "::error::Lambda handler ($HANDLER_PATH) is missing from $SERVICE.zip"
    exit 1
  fi
  
  # Cleanup temp directory
  cd "$ROOT_DIR"
  rm -rf "$TEMP_BUILD_DIR"
  echo "✅ Successfully packaged $SERVICE"
done

echo "----------------------------------------"
echo "All backend services packaged successfully into $OUTPUT_DIR/"
exit 0
