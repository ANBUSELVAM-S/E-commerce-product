# Full-Stack Continuous Integration (CI) Pipeline

This project uses a fully isolated GitHub Actions CI pipeline to automatically validate both the frontend and backend services on every push and pull request.

**Important:** This pipeline only runs Continuous Integration (CI). It **does not** deploy anything to AWS, use Terraform, or require AWS credentials.

## 1. Repository Architecture

- **Frontend (`ecommerce-frontend/`)**: React + Vite application. Uses `vitest` for tests and `oxlint` for linting.
- **Backend (`ecommerce-backend/`)**: 8 Node.js/Express serverless microservices. Uses `jest` for testing.
  - `auth-service` (Handler: `index.handler`)
  - `cart-service` (Handler: `src/server.handler`)
  - `inventory-service` (Handler: `src/server.handler`)
  - `notification-service` (Handler: `src/server.handler`)
  - `notification-worker` (Handler: `src/server.handler`)
  - `order-service` (Handler: `src/server.handler`)
  - `payment-service` (Handler: `src/server.handler`)
  - `product-service` (Handler: `src/server.handler`)

## 2. CI Workflow Flow (`.github/workflows/ci.yml`)

The CI workflow triggers on:
- Pull Requests targeting `main`
- Pushes to `main`, `develop`, `feature/*`, and `fix/*` branches
- Manual trigger (`workflow_dispatch`)

It consists of four main jobs:

### A. Security Check
Runs `scripts/check-sensitive-files.sh` to fail the build if dangerous files (`.env`, `terraform.tfstate`, `.pem`, AWS credentials, `.zip`) are accidentally committed to Git.

### B. Frontend CI
- **Install:** Runs `npm ci` inside `ecommerce-frontend`.
- **Lint:** Runs `npm run lint`.
- **Test:** Runs `npm test -- --run`.
- **Coverage:** Runs `npm run test:coverage` and uploads results as a GitHub Artifact.
- **Build:** Runs `npm run build` and ensures the `dist` folder is created.

### C. Backend CI (Matrix)
Uses a matrix strategy to test all 8 backend services simultaneously.
- **Install:** Runs `npm ci` inside each service folder.
- **Lint:** Skipped (no lint scripts currently configured).
- **Test:** Runs `npm test -- --runInBand` (if valid script exists).
- **Handler Validation:** Runs `scripts/validate-lambda-handler.sh` to ensure `server.js` or `index.js` exists and correctly exports the Lambda handler.

### D. CI Summary
A final job that waits for all others to finish and reports overall Pass/Fail.

## 3. How to Test CI Locally

Before pushing to GitHub, you can validate your code locally using these commands:

### Frontend Validation
```bash
cd ecommerce-frontend
npm ci
npm run lint
npm test -- --run
npm run build
```

### Backend Validation (Example for Product Service)
```bash
cd ecommerce-backend/product-service
npm ci
npm test
```

### Script Validation
```bash
bash -n scripts/check-sensitive-files.sh
bash -n scripts/validate-lambda-handler.sh
```

## 4. Troubleshooting

- **`npm ci` fails**: Ensure your `package-lock.json` is committed and matches your `package.json`. If out of sync, run `npm install` locally and commit the updated `package-lock.json`.
- **Frontend Build Fails**: Check if you have syntax errors or missing dependencies in `ecommerce-frontend`.
- **Missing Lambda Handler Error**: Ensure `src/server.js` (or `index.js` for `auth-service`) exists and contains `module.exports.handler`.
- **Security Check Fails**: If you accidentally committed a `.env` file, remove it from git tracking without deleting it from your PC: `git rm --cached .env`, then commit the change.

## 5. Adding a New Backend Microservice
To add a new service to the CI:
1. Open `.github/workflows/ci.yml`
2. Add your new folder name under `jobs.backend-ci.strategy.matrix.service`.
3. If it uses a handler other than `src/server.handler`, update `scripts/validate-lambda-handler.sh`.
