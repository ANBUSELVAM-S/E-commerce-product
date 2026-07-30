# -----------------------------------------------------
# SQS Queue: Notification Queue
# -----------------------------------------------------
resource "aws_sqs_queue" "notification_queue" {
  name = "anbu-payment-notification-queue"
}

# -----------------------------------------------------
# SQS Queue Policy (Allow SNS to publish to SQS)
# -----------------------------------------------------
resource "aws_sqs_queue_policy" "notification_queue_policy" {
  queue_url = aws_sqs_queue.notification_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.notification_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.payment_success.arn
          }
        }
      }
    ]
  })
}

# -----------------------------------------------------
# SNS to SQS Subscription
# -----------------------------------------------------
resource "aws_sns_topic_subscription" "sns_to_sqs" {
  topic_arn = aws_sns_topic.payment_success.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.notification_queue.arn
}
