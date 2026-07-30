# -----------------------------------------------------
# API Gateway HTTP API
# -----------------------------------------------------
resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["*"]
    allow_headers = ["*"]
  }
}

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# -----------------------------------------------------
# API Gateway Integration Defaults
# -----------------------------------------------------
# Helper function for setting up Lambda Integrations
# Note: In Terraform, you need to define integrations and routes separately.

# Auth Service
resource "aws_apigatewayv2_integration" "auth" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.auth_service.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Product Service
resource "aws_apigatewayv2_integration" "product" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.product_service.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Inventory Service
resource "aws_apigatewayv2_integration" "inventory" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.inventory_service.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Cart Service
resource "aws_apigatewayv2_integration" "cart" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.cart_service.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Order Service
resource "aws_apigatewayv2_integration" "order" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.order_service.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Payment Service
resource "aws_apigatewayv2_integration" "payment" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.payment_service.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Notification Service
resource "aws_apigatewayv2_integration" "notification" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.notification_service.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# -----------------------------------------------------
# API Gateway Routes
# -----------------------------------------------------

# Auth Service Routes
resource "aws_apigatewayv2_route" "auth_register" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/auth/register"
  target    = "integrations/${aws_apigatewayv2_integration.auth.id}"
}

resource "aws_apigatewayv2_route" "auth_login" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/auth/login"
  target    = "integrations/${aws_apigatewayv2_integration.auth.id}"
}

resource "aws_apigatewayv2_route" "auth_confirm" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/auth/confirm"
  target    = "integrations/${aws_apigatewayv2_integration.auth.id}"
}

resource "aws_apigatewayv2_route" "auth_logout" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/auth/logout"
  target    = "integrations/${aws_apigatewayv2_integration.auth.id}"
}

# Product Service Routes
resource "aws_apigatewayv2_route" "products_any" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/products"
  target    = "integrations/${aws_apigatewayv2_integration.product.id}"
}

resource "aws_apigatewayv2_route" "products_id" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/products/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.product.id}"
}

# Inventory Service Routes
resource "aws_apigatewayv2_route" "inventory_any" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/inventory"
  target    = "integrations/${aws_apigatewayv2_integration.inventory.id}"
}

resource "aws_apigatewayv2_route" "inventory_id" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/inventory/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.inventory.id}"
}

# Cart Service Routes
resource "aws_apigatewayv2_route" "cart_any" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/cart/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.cart.id}"
}

# Order Service Routes
resource "aws_apigatewayv2_route" "order_any" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/orders"
  target    = "integrations/${aws_apigatewayv2_integration.order.id}"
}

resource "aws_apigatewayv2_route" "order_id" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/orders/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.order.id}"
}

# Payment Service Routes
resource "aws_apigatewayv2_route" "payment_any" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/payments"
  target    = "integrations/${aws_apigatewayv2_integration.payment.id}"
}

resource "aws_apigatewayv2_route" "payment_id" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/payments/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.payment.id}"
}

# Notification Service Routes
resource "aws_apigatewayv2_route" "notification_any" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/notifications"
  target    = "integrations/${aws_apigatewayv2_integration.notification.id}"
}

resource "aws_apigatewayv2_route" "notification_id" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/notifications/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.notification.id}"
}

# -----------------------------------------------------
# Lambda Permissions for API Gateway
# -----------------------------------------------------
resource "aws_lambda_permission" "api_gw_auth" {
  statement_id  = "AllowExecutionFromAPIGatewayAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gw_product" {
  statement_id  = "AllowExecutionFromAPIGatewayProduct"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.product_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gw_inventory" {
  statement_id  = "AllowExecutionFromAPIGatewayInventory"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.inventory_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gw_cart" {
  statement_id  = "AllowExecutionFromAPIGatewayCart"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cart_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gw_order" {
  statement_id  = "AllowExecutionFromAPIGatewayOrder"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.order_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gw_payment" {
  statement_id  = "AllowExecutionFromAPIGatewayPayment"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gw_notification" {
  statement_id  = "AllowExecutionFromAPIGatewayNotification"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notification_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
