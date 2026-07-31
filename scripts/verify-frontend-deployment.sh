#!/bin/bash

# Verifies the frontend deployment by checking the CloudFront URL.

set -e

FRONTEND_URL=$1

if [ -z "$FRONTEND_URL" ]; then
  echo "::error::CloudFront URL not provided for frontend verification."
  exit 1
fi

# Ensure URL has http/https prefix
if [[ ! "$FRONTEND_URL" =~ ^https?:// ]]; then
  FRONTEND_URL="https://$FRONTEND_URL"
fi

echo "Verifying frontend deployment at $FRONTEND_URL..."

MAX_RETRIES=5
RETRY_DELAY=15
ATTEMPT=1

while [ $ATTEMPT -le $MAX_RETRIES ]; do
  echo "Attempt $ATTEMPT of $MAX_RETRIES..."
  
  # Fetch HTTP status code only, avoiding printing body content
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/index.html" || echo "curl_failed")
  
  if [ "$HTTP_STATUS" == "200" ]; then
    echo "✅ Frontend deployment verified! (index.html returned HTTP 200)"
    exit 0
  fi
  
  echo "Verification failed (HTTP Status: $HTTP_STATUS). Retrying in $RETRY_DELAY seconds (waiting for CloudFront cache invalidation)..."
  sleep $RETRY_DELAY
  ((ATTEMPT++))
done

echo "::error::Frontend verification failed after $MAX_RETRIES attempts."
exit 1
