# Snyk Security Integration

This project uses Snyk to automatically detect and monitor security vulnerabilities in:
1. Open-source dependencies (npm packages)
2. Application source code (Snyk Code SAST)
3. Infrastructure as Code (Terraform)

## Automated CI/CD Workflows

A dedicated GitHub Actions workflow (`.github/workflows/snyk-security.yml`) automatically runs on:
- Pull requests to `main`
- Pushes to `main` and other key branches
- A weekly schedule

**Note:** The existing `.github/workflows/ci.yml` and `.github/workflows/cd.yml` workflows remain completely unchanged. The Snyk workflow operates alongside them independently to provide security gating without interrupting normal development operations.

## Configuration Requirements

For the workflow to function, you must configure the following in your GitHub repository:

### Required Secrets
- `SNYK_TOKEN`: Your Snyk API token. 
  - **Where to add:** GitHub repository → Settings → Secrets and variables → Actions → New repository secret.

### Optional Variables
- `SNYK_ORG_ID`: Your Snyk Organization ID to tie results to a specific organization.
- `ENABLE_SNYK_CODE`: Set to `true` to enable Snyk Code SAST scanning.
  - **Where to add:** GitHub repository → Settings → Secrets and variables → Actions → Variables.

## Local Scanning

You can also run identical Snyk scans locally before pushing your code. 

### Prerequisites
1. Install the [Snyk CLI](https://docs.snyk.io/snyk-cli/install-the-snyk-cli).
2. Authenticate or export your token: `export SNYK_TOKEN="your-token-here"` (or `$env:SNYK_TOKEN = "your-token-here"` in PowerShell).

### Usage

**Bash (Linux/Mac/Git Bash):**
```bash
./scripts/run-snyk-scan.sh [severity]
# Example: ./scripts/run-snyk-scan.sh high
```

**PowerShell (Windows):**
```powershell
.\scripts\run-snyk-scan.ps1 -SeverityThreshold high
```

The scripts will generate SARIF reports in the `.gitignore`'d `security-reports/` directory.

## GitHub Code Scanning Integration

The workflow automatically uploads results (SARIF files) to GitHub Code Scanning. You can view identified vulnerabilities natively inside GitHub by navigating to your repository's **Security** tab, then clicking **Code scanning alerts**.

## Remediation

If Snyk identifies vulnerable dependencies, investigate them through the Snyk UI or GitHub Security tab. Fix them by updating the specific packages in your `package.json` files and running `npm install` to update the `package-lock.json`. Do not ignore high or critical vulnerabilities unless a documented `.snyk` policy with a strict expiry date is created and justified.
