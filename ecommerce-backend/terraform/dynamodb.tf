# -----------------------------------------------------
# DynamoDB Table: Products
# -----------------------------------------------------
resource "aws_dynamodb_table" "products" {
  name         = var.product_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "productId"

  attribute {
    name = "productId"
    type = "S"
  }

  tags = {
    Name = var.product_table_name
  }
}

# -----------------------------------------------------
# DynamoDB Table: Inventory
# -----------------------------------------------------
resource "aws_dynamodb_table" "inventory" {
  name         = var.inventory_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "productId"

  attribute {
    name = "productId"
    type = "S"
  }

  tags = {
    Name = var.inventory_table_name
  }
}

# -----------------------------------------------------
# DynamoDB Table: Carts
# -----------------------------------------------------
resource "aws_dynamodb_table" "carts" {
  name         = var.cart_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "cartId"

  attribute {
    name = "cartId"
    type = "S"
  }

  tags = {
    Name = var.cart_table_name
  }
}

# -----------------------------------------------------
# DynamoDB Table: Orders
# -----------------------------------------------------
resource "aws_dynamodb_table" "orders" {
  name         = var.order_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "orderId"

  attribute {
    name = "orderId"
    type = "S"
  }

  tags = {
    Name = var.order_table_name
  }
}

# -----------------------------------------------------
# DynamoDB Table: Payments
# -----------------------------------------------------
resource "aws_dynamodb_table" "payments" {
  name         = var.payment_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transactionId"

  attribute {
    name = "transactionId"
    type = "S"
  }

  tags = {
    Name = var.payment_table_name
  }
}

# -----------------------------------------------------
# DynamoDB Table: Notifications
# -----------------------------------------------------
resource "aws_dynamodb_table" "notifications" {
  name         = var.notification_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "notificationId"

  attribute {
    name = "notificationId"
    type = "S"
  }

  tags = {
    Name = var.notification_table_name
  }
}
