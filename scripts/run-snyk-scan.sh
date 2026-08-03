#!/bin/bash
set -e

SEVERITY=${1:-high}

echo "========================================="
echo "Snyk Local Security Scan"
echo "Severity Threshold: $SEVERITY"
echo "========================================="

if ! command -v snyk &> /dev/null; then
  echo "::error::Snyk CLI is not installed. Please install it first."
  exit 1
fi

if [ -z "$SNYK_TOKEN" ]; then
  echo "::error::SNYK_TOKEN is not configured. Export it locally before running."
  exit 1
fi

ROOT_DIR=$(pwd)
mkdir -p "$ROOT_DIR/security-reports"

EXIT_CODE=0

PROJECTS=(
  "ecommerce-frontend"
  "ecommerce-backend"
  "ecommerce-backend/auth-service"
  "ecommerce-backend/cart-service"
  "ecommerce-backend/inventory-service"
  "ecommerce-backend/notification-service"
  "ecommerce-backend/notification-worker"
  "ecommerce-backend/order-service"
  "ecommerce-backend/payment-service"
  "ecommerce-backend/product-service"
)

for PROJ in "${PROJECTS[@]}"; do
  if [ -f "$ROOT_DIR/$PROJ/package.json" ]; then
    echo "Scanning dependencies in $PROJ..."
    cd "$ROOT_DIR/$PROJ"
    
    set +e
    snyk test --file=package.json --package-manager=npm --dev --severity-threshold=$SEVERITY --strict-out-of-sync=true --sarif-file-output=snyk-open-source.sarif
    SCAN_EXIT=$?
    set -e
    
    if [ $SCAN_EXIT -ne 0 ] && [ $SCAN_EXIT -ne 1 ]; then
      echo "::error::Snyk encountered a fatal error scanning $PROJ"
      EXIT_CODE=1
    elif [ $SCAN_EXIT -eq 1 ]; then
      echo "::warning::Vulnerabilities found in $PROJ"
      EXIT_CODE=1
    fi
    
    if [ -f "snyk-open-source.sarif" ]; then
      REPORT_NAME=$(echo "$PROJ" | tr '/' '-')
      mv snyk-open-source.sarif "$ROOT_DIR/security-reports/snyk-open-source-$REPORT_NAME.sarif"
    fi
    
    cd "$ROOT_DIR"
  fi
done

if [ -d "$ROOT_DIR/ecommerce-backend/terraform" ]; then
  echo "Scanning Terraform..."
  cd "$ROOT_DIR"
  set +e
  snyk iac test ecommerce-backend/terraform --severity-threshold=$SEVERITY --sarif-file-output=security-reports/snyk-iac.sarif
  SCAN_EXIT=$?
  set -e
  if [ $SCAN_EXIT -ne 0 ] && [ $SCAN_EXIT -ne 1 ]; then
      echo "::error::Snyk encountered a fatal error scanning terraform"
      EXIT_CODE=1
  elif [ $SCAN_EXIT -eq 1 ]; then
      echo "::warning::Vulnerabilities found in Terraform"
      EXIT_CODE=1
  fi
fi

if [ $EXIT_CODE -ne 0 ]; then
  echo "========================================="
  echo "Security issues were found. Check security-reports/ for details."
  exit 1
else
  echo "========================================="
  echo "✅ No high or critical issues found!"
fi
