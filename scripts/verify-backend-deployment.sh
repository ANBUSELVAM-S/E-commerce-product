#!/bin/bash

# Verifies the backend deployment by pinging the public health check URL.

set -e

HEALTH_URL=$1

if [ -z "$HEALTH_URL" ]; then
  echo "Backend Health Check URL not provided."
  echo "Assuming no public health check endpoint exists. Skipping verification."
  exit 0
fi

echo "Verifying backend deployment at $HEALTH_URL..."

MAX_RETRIES=5
RETRY_DELAY=10
ATTEMPT=1

while [ $ATTEMPT -le $MAX_RETRIES ]; do
  echo "Attempt $ATTEMPT of $MAX_RETRIES..."
  
  # Fetch HTTP status code only, avoiding printing any body content that might contain sensitive info
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "curl_failed")
  
  if [ "$HTTP_STATUS" == "200" ]; then
    echo "✅ Backend health check passed! (HTTP 200)"
    exit 0
  fi
  
  echo "Health check failed (HTTP Status: $HTTP_STATUS). Retrying in $RETRY_DELAY seconds (waiting for Lambda cold starts or API Gateway propagation)..."
  sleep $RETRY_DELAY
  ((ATTEMPT++))
done

echo "::error::Backend health check failed after $MAX_RETRIES attempts."
exit 1
