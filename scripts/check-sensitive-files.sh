#!/bin/bash

# Security script to check for accidentally committed sensitive files.

set -e

echo "Starting sensitive file check..."

# List all tracked files in git
TRACKED_FILES=$(git ls-files || echo "")

if [ -z "$TRACKED_FILES" ]; then
  echo "No git repository found or no files tracked. Skipping security check."
  exit 0
fi

FAILED=0

# Define dangerous patterns
PATTERNS=(
  "\.env$"
  "\.env\.local$"
  "\.env\.production$"
  "\.aws/credentials"
  "\.pem$"
  "\.key$"
  "terraform\.tfstate$"
  "terraform\.tfstate\.backup$"
  "\.zip$"
)

for file in $TRACKED_FILES; do
  # Skip obvious false positives
  if [[ "$file" == *"package-lock.json"* ]] || [[ "$file" == *"README"* ]] || [[ "$file" == *".github/workflows/"* ]]; then
    continue
  fi

  for pattern in "${PATTERNS[@]}"; do
    if echo "$file" | grep -Eq "$pattern"; then
      echo "::error::🚨 DANGEROUS FILE DETECTED: $file matches $pattern"
      echo "Remediation: Remove this file from git tracking using 'git rm --cached $file' and add it to your .gitignore"
      FAILED=1
    fi
  done
done

if [ $FAILED -eq 1 ]; then
  echo "Security check failed! Sensitive files are tracked in version control."
  exit 1
fi

echo "✅ No sensitive tracked files found."
exit 0
