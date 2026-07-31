# Full-Stack Continuous Deployment (CD) Pipeline

This document describes the Continuous Deployment (CD) architecture for the E-commerce Full-Stack application.

> **Note:** This CD pipeline integrates with your existing `Full-Stack CI Pipeline` without modifying it. It **does not** use Terraform, Docker, or permanent AWS access keys. It deploys exclusively to existing AWS resources.

---

## 1. CI-to-CD Architecture

### Existing CI Workflow Analysis
Your existing CI (`.github/workflows/ci.yml`) validates the code using `security-check`, `frontend-ci`, and `backend-ci` (matrix) jobs.

### CI-to-CD Connection
The new CD pipeline (`.github/workflows/cd.yml`) uses `workflow_run` to trigger *only* when the `Full-Stack CI Pipeline` completes successfully.

### Automatic Deployment Flow
1. **Trigger:** `Full-Stack CI Pipeline` succeeds on the `main` branch.
2. **Checkout:** Checks out the *exact* commit that passed CI (`github.event.workflow_run.head_sha`), preventing race conditions where another commit is pushed during the CI run.
3. **Backend Deploy:** Packages all 8 Lambda functions, updates their code via AWS CLI, and runs a health check.
4. **Frontend Deploy:** Builds the Vite application, uploads to S3, and invalidates the CloudFront cache.
5. **Summary:** Reports overall deployment status.

### Manual Deployment Flow
You can trigger the CD pipeline manually via the GitHub Actions `workflow_dispatch` event.
- By default, manual runs target `product-service` only.
- To deploy all backend services and the frontend, set `target_service` to `all`.
You can optionally provide a specific Commit SHA to deploy.

---

## 2. GitHub Configuration & OIDC

### GitHub Environments
This pipeline uses the GitHub Environment named **`production`**. 
- **Production Branch Restrictions:** Configure the `production` environment in your repository settings to only allow deployments from the `main` branch.
- **Required Reviewers:** Optionally add required reviewers in the `production` environment settings.
- **Concurrency:** The workflow uses `group: fullstack-production-deployment` to guarantee only one deployment runs at a time.

### GitHub Variables Required
Add these variables to your `production` environment:
- `AWS_REGION` (e.g., `ap-southeast-1`)
- `AWS_ROLE_ARN` (Your OIDC IAM Role)
- `BACKEND_HEALTH_CHECK_URL` (Public endpoint to verify backend)
- `FRONTEND_BUCKET` (S3 bucket name)
- `CLOUDFRONT_DISTRIBUTION_ID`
- `CLOUDFRONT_URL`
- `VITE_API_BASE_URL`
- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_CLIENT_ID`
- Lambda names: `AUTH_LAMBDA_NAME`, `CART_LAMBDA_NAME`, `INVENTORY_LAMBDA_NAME`, `NOTIFICATION_LAMBDA_NAME`, `NOTIFICATION_WORKER_LAMBDA_NAME`, `ORDER_LAMBDA_NAME`, `PAYMENT_LAMBDA_NAME`, `PRODUCT_LAMBDA_NAME`

---

## 3. AWS Configuration

### OIDC Trust Policy
Because the pipeline uses the `production` environment, your AWS IAM Role must have the following trust policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:ANBUSELVAM-S/E-commerce-product:environment:production"
        }
      }
    }
  ]
}
```

### Least-Privilege IAM Deployment Policy
The IAM role assumed by GitHub Actions needs only these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:UpdateFunctionCode",
        "lambda:PublishVersion",
        "lambda:ListVersionsByFunction"
      ],
      "Resource": "arn:aws:lambda:ap-southeast-1:YOUR_ACCOUNT_ID:function:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::YOUR_FRONTEND_BUCKET"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_FRONTEND_BUCKET/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:GetDistribution"
      ],
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
    }
  ]
}
```

---

## 4. Deployment Steps

### Backend Packaging & Deployment
- **Packaging:** `scripts/package-backend-lambdas.sh` creates clean build directories, installs production dependencies (`npm ci --omit=dev`), and zips the Lambda code.
- **Deployment:** The workflow maps each service to its `*_LAMBDA_NAME` variable and runs `aws lambda update-function-code`.
- **Verification:** `scripts/verify-backend-deployment.sh` pings the `BACKEND_HEALTH_CHECK_URL`.

### Frontend Build & S3 Upload
- **Build:** Runs `npm run build` using the safe `VITE_*` environment variables.
- **S3 Upload:** Syncs assets to S3 with a 1-year cache. Uploads `index.html` with `no-cache`.
- **CloudFront Invalidation:** Runs `aws cloudfront create-invalidation` for `/*` and waits for completion.
- **Verification:** `scripts/verify-frontend-deployment.sh` checks the CloudFront URL.

---

## 5. Troubleshooting & Operations

### Failure Troubleshooting
If backend deployment fails, the pipeline immediately halts, and the frontend is not deployed. Check the GitHub Actions logs to see which specific Lambda failed.

### Lambda CloudWatch Troubleshooting
If a Lambda updates successfully but errors in production, check Amazon CloudWatch Logs for the specific function to identify runtime exceptions (e.g., missing dependencies).

### S3 and CloudFront Verification
If the frontend looks stale:
1. Verify the S3 bucket contents contain the latest hash in the filename.
2. Verify the CloudFront invalidation completed in the AWS Console.

### Safe Rollback Procedures
If a bad commit reaches production:
1. Identify the last known good commit SHA.
2. Navigate to GitHub Actions -> `Full-Stack CD Pipeline`.
3. Click **Run workflow** and paste the good Commit SHA.
4. The pipeline will checkout that old code, rebuild it, and safely overwrite the bad deployment.

### How to Add a New Service
1. Add the service folder to `scripts/package-backend-lambdas.sh` (under the `SERVICES` array).
2. Add the service to the `cd.yml` backend deployment loop.
3. Create the corresponding `YOUR_SERVICE_LAMBDA_NAME` variable in GitHub Environments.
