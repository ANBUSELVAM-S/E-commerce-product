#!/bin/bash

# Validate the Lambda handler for a backend service.

set -euo pipefail

SERVICE="${1:-}"

if [ -z "$SERVICE" ]; then
  echo "::error::Service name was not provided."
  exit 1
fi

SERVICE_PATH="ecommerce-backend/$SERVICE"

echo "Validating Lambda handler for $SERVICE..."
echo "Service path: $SERVICE_PATH"

if [ ! -d "$SERVICE_PATH" ]; then
  echo "::error::Service directory does not exist: $SERVICE_PATH"
  exit 1
fi

if [ ! -f "$SERVICE_PATH/package.json" ]; then
  echo "::error::package.json is missing in $SERVICE_PATH"
  exit 1
fi

# Check common Lambda handler file locations.
POSSIBLE_HANDLERS=(
  "$SERVICE_PATH/server.js"
  "$SERVICE_PATH/src/server.js"
  "$SERVICE_PATH/index.js"
  "$SERVICE_PATH/src/index.js"
  "$SERVICE_PATH/app.js"
  "$SERVICE_PATH/src/app.js"
  "$SERVICE_PATH/handler.js"
  "$SERVICE_PATH/src/handler.js"
  "$SERVICE_PATH/worker.js"
  "$SERVICE_PATH/src/worker.js"
)

HANDLER_FILE=""

for FILE in "${POSSIBLE_HANDLERS[@]}"; do
  if [ -f "$FILE" ]; then
    echo "Checking candidate: $FILE"

    if grep -Eq \
      "module\.exports\.handler|exports\.handler" \
      "$FILE"; then
      HANDLER_FILE="$FILE"
      break
    fi
  fi
done

if [ -z "$HANDLER_FILE" ]; then
  echo "::error::No valid Lambda handler export was found for $SERVICE."
  echo "Checked these possible locations:"

  for FILE in "${POSSIBLE_HANDLERS[@]}"; do
    echo "  - $FILE"
  done

  echo ""
  echo "Expected an export similar to:"
  echo "module.exports.handler = serverless(app);"

  exit 1
fi

echo "Lambda handler found: $HANDLER_FILE"
echo "Lambda handler validation passed for $SERVICE."
exit 0