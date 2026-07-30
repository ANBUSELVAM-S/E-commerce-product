# -----------------------------------------------------
# General
# -----------------------------------------------------
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "aws_profile" {
  description = "AWS CLI profile to use for Terraform. Leave empty to use the default credentials chain or AWS_* environment variables."
  type        = string
  default     = ""
}

variable "aws_shared_credentials_file" {
  description = "Optional path to an AWS shared credentials file. Leave empty to use the default AWS CLI location."
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "anbu-ecommerce"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# -----------------------------------------------------
# DynamoDB Table Names
# -----------------------------------------------------
variable "product_table_name" {
  description = "DynamoDB table name for products"
  type        = string
  default     = "anbu-product-service"
}

variable "inventory_table_name" {
  description = "DynamoDB table name for inventory"
  type        = string
  default     = "anbu-inventory-service"
}

variable "cart_table_name" {
  description = "DynamoDB table name for carts"
  type        = string
  default     = "anbu-cart-service"
}

variable "order_table_name" {
  description = "DynamoDB table name for orders"
  type        = string
  default     = "anbu-order-service"
}

variable "payment_table_name" {
  description = "DynamoDB table name for payments"
  type        = string
  default     = "anbu-payment-service"
}

variable "notification_table_name" {
  description = "DynamoDB table name for notifications"
  type        = string
  default     = "anbu-notification-service"
}

# -----------------------------------------------------
# Cognito
# -----------------------------------------------------
variable "cognito_user_pool_name" {
  description = "Cognito User Pool name"
  type        = string
  default     = "Anbu-userpool"
}

# -----------------------------------------------------
# Lambda
# -----------------------------------------------------
variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_memory" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_packages_dir" {
  description = "Directory containing Lambda zip packages"
  type        = string
  default     = "./lambda-packages"
}
