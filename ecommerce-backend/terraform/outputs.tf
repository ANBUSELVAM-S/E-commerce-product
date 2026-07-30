output "api_gateway_url" {
  description = "Base URL for the API Gateway"
  value       = aws_apigatewayv2_stage.default_stage.invoke_url
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.pool.id
}

output "cognito_client_id" {
  description = "ID of the Cognito App Client"
  value       = aws_cognito_user_pool_client.client.id
}

output "sns_topic_arn" {
  description = "ARN of the Payment Success SNS Topic"
  value       = aws_sns_topic.payment_success.arn
}

output "sqs_queue_url" {
  description = "URL of the Notification SQS Queue"
  value       = aws_sqs_queue.notification_queue.url
}

output "dynamodb_tables" {
  description = "Names of created DynamoDB tables"
  value = {
    products      = aws_dynamodb_table.products.name
    inventory     = aws_dynamodb_table.inventory.name
    carts         = aws_dynamodb_table.carts.name
    orders        = aws_dynamodb_table.orders.name
    payments      = aws_dynamodb_table.payments.name
    notifications = aws_dynamodb_table.notifications.name
  }
}
