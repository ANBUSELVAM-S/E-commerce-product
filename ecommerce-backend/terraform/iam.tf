# -----------------------------------------------------
# AWS Academy: Use EXISTING IAM Role
# (Academy accounts cannot create new IAM roles/policies)
# -----------------------------------------------------

variable "existing_lambda_role_name" {
  description = "Name of the existing IAM role for Lambda (e.g., LabRole)"
  type        = string
  default     = "aws-anbu"
}

# Look up the existing role instead of creating a new one
data "aws_iam_role" "lambda_execution_role" {
  name = var.existing_lambda_role_name
}
