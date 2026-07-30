# -----------------------------------------------------
# SNS Topic: Payment Success
# -----------------------------------------------------
resource "aws_sns_topic" "payment_success" {
  name = "payment-success-anbu"

  tags = {
    Name = "Payment Success Topic"
  }
}
