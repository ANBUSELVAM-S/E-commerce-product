# -----------------------------------------------------
# Local variables for API Gateway URL
# -----------------------------------------------------
locals {
  api_url = aws_apigatewayv2_stage.default_stage.invoke_url
}

# -----------------------------------------------------
# Lambda: Auth Service
# -----------------------------------------------------
resource "aws_lambda_function" "auth_service" {
  filename         = "${var.lambda_packages_dir}/auth-service.zip"
  function_name    = "Anbu-auth-service"
  role             = data.aws_iam_role.lambda_execution_role.arn
  handler          = "index.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory
  timeout          = var.lambda_timeout
  source_code_hash = fileexists("${var.lambda_packages_dir}/auth-service.zip") ? filebase64sha256("${var.lambda_packages_dir}/auth-service.zip") : null

  environment {
    variables = {
      COGNITO_USER_POOL_ID = aws_cognito_user_pool.pool.id
      COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.client.id
    }
  }
}

# -----------------------------------------------------
# Lambda: Product Service
# -----------------------------------------------------
resource "aws_lambda_function" "product_service" {
  filename         = "${var.lambda_packages_dir}/product-service.zip"
  function_name    = "Anbu-product-service"
  role             = data.aws_iam_role.lambda_execution_role.arn
  handler          = "src/server.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory
  timeout          = var.lambda_timeout
  source_code_hash = fileexists("${var.lambda_packages_dir}/product-service.zip") ? filebase64sha256("${var.lambda_packages_dir}/product-service.zip") : null

  environment {
    variables = {
      PRODUCT_TABLE         = aws_dynamodb_table.products.name
      INVENTORY_SERVICE_URL = local.api_url
    }
  }
}

# -----------------------------------------------------
# Lambda: Inventory Service
# -----------------------------------------------------
resource "aws_lambda_function" "inventory_service" {
  filename         = "${var.lambda_packages_dir}/inventory-service.zip"
  function_name    = "Anbu-inventory-service"
  role             = data.aws_iam_role.lambda_execution_role.arn
  handler          = "src/server.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory
  timeout          = var.lambda_timeout
  source_code_hash = fileexists("${var.lambda_packages_dir}/inventory-service.zip") ? filebase64sha256("${var.lambda_packages_dir}/inventory-service.zip") : null

  environment {
    variables = {
      INVENTORY_TABLE = aws_dynamodb_table.inventory.name
    }
  }
}

# -----------------------------------------------------
# Lambda: Cart Service
# -----------------------------------------------------
resource "aws_lambda_function" "cart_service" {
  filename         = "${var.lambda_packages_dir}/cart-service.zip"
  function_name    = "Anbu-cart-service"
  role             = data.aws_iam_role.lambda_execution_role.arn
  handler          = "src/server.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory
  timeout          = var.lambda_timeout
  source_code_hash = fileexists("${var.lambda_packages_dir}/cart-service.zip") ? filebase64sha256("${var.lambda_packages_dir}/cart-service.zip") : null

  environment {
    variables = {
      CART_TABLE          = aws_dynamodb_table.carts.name
      PRODUCT_SERVICE_URL = local.api_url
    }
  }
}

# -----------------------------------------------------
# Lambda: Order Service
# -----------------------------------------------------
resource "aws_lambda_function" "order_service" {
  filename         = "${var.lambda_packages_dir}/order-service.zip"
  function_name    = "Anbu-order-service"
  role             = data.aws_iam_role.lambda_execution_role.arn
  handler          = "src/server.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory
  timeout          = var.lambda_timeout
  source_code_hash = fileexists("${var.lambda_packages_dir}/order-service.zip") ? filebase64sha256("${var.lambda_packages_dir}/order-service.zip") : null

  environment {
    variables = {
      ORDER_TABLE           = aws_dynamodb_table.orders.name
      CART_SERVICE_URL      = local.api_url
      PRODUCT_SERVICE_URL   = local.api_url
      INVENTORY_SERVICE_URL = local.api_url
    }
  }
}

# -----------------------------------------------------
# Lambda: Payment Service
# -----------------------------------------------------
resource "aws_lambda_function" "payment_service" {
  filename         = "${var.lambda_packages_dir}/payment-service.zip"
  function_name    = "Anbu-payment-service"
  role             = data.aws_iam_role.lambda_execution_role.arn
  handler          = "src/server.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory
  timeout          = var.lambda_timeout
  source_code_hash = fileexists("${var.lambda_packages_dir}/payment-service.zip") ? filebase64sha256("${var.lambda_packages_dir}/payment-service.zip") : null

  environment {
    variables = {
      PAYMENT_TABLE     = aws_dynamodb_table.payments.name
      ORDER_SERVICE_URL = local.api_url
      SNS_TOPIC_ARN     = aws_sns_topic.payment_success.arn
    }
  }
}

# -----------------------------------------------------
# Lambda: Notification Service
# -----------------------------------------------------
resource "aws_lambda_function" "notification_service" {
  filename         = "${var.lambda_packages_dir}/notification-service.zip"
  function_name    = "Anbu-notification-service"
  role             = data.aws_iam_role.lambda_execution_role.arn
  handler          = "src/server.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory
  timeout          = var.lambda_timeout
  source_code_hash = fileexists("${var.lambda_packages_dir}/notification-service.zip") ? filebase64sha256("${var.lambda_packages_dir}/notification-service.zip") : null

  environment {
    variables = {
      NOTIFICATION_TABLE = aws_dynamodb_table.notifications.name
      SQS_QUEUE_URL      = aws_sqs_queue.notification_queue.url
    }
  }
}
