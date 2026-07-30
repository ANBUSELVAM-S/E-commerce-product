#!/bin/bash

# Validates that a lambda handler exists and is exported correctly for a given backend service.

set -e

SERVICE=$1

if [ -z "$SERVICE" ]; then
  echo "Error: Service name not provided."
  exit 1
fi

SERVICE_PATH="ecommerce-backend/$SERVICE"

echo "Validating Lambda handler for $SERVICE..."

if [ ! -d "$SERVICE_PATH" ]; then
  echo "Error: Service directory $SERVICE_PATH does not exist."
  exit 1
fi

if [ ! -f "$SERVICE_PATH/package.json" ]; then
  echo "Error: package.json missing in $SERVICE_PATH"
  exit 1
fi

HANDLER_FILE=""

# auth-service uses index.handler, others use src/server.handler based on our analysis
if [ "$SERVICE" == "auth-service" ]; then
  HANDLER_FILE="$SERVICE_PATH/index.js"
else
  HANDLER_FILE="$SERVICE_PATH/src/server.js"
fi

if [ ! -f "$HANDLER_FILE" ]; then
  echo "::error::Lambda handler validation failed for $SERVICE: $HANDLER_FILE is missing."
  exit 1
fi

# Check for export
if ! grep -q "module.exports.handler" "$HANDLER_FILE" && ! grep -q "exports.handler" "$HANDLER_FILE"; then
  echo "::error::Lambda handler validation failed for $SERVICE: module.exports.handler or exports.handler is missing in $HANDLER_FILE"
  exit 1
fi

echo "✅ Lambda handler validation passed for $SERVICE ($HANDLER_FILE)"
exit 0
