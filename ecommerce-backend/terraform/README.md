# Terraform Deployment Guide

This guide explains how to package and deploy your e-commerce microservices using Terraform on AWS Academy.

## 1. Package Your Services
Before deploying, you need to compress your Node.js code into `.zip` files so AWS Lambda can use them.

**To package ALL services at once:**
```powershell
cd c:\Product\ecommerce-backend\terraform\scripts
.\package-remaining.ps1
```

*(Note: If Terraform complains about missing files, make sure all 7 zip files exist in `terraform\lambda-packages`. You can duplicate an existing zip file to bypass this check if you are only deploying a specific service).*

---

## 2. Deploy Services
Because of AWS Academy restrictions, you must **first manually create the Lambda function in the AWS Console** (using the `aws-anbu` role) and **import it** into Terraform before deploying.

### 📦 Product Service
```powershell
cd c:\Product\ecommerce-backend\terraform
# 1. Import (if not done yet)
terraform import aws_lambda_function.product_service anbu-product-service

# 2. Deploy ONLY Product Service
terraform apply -target="aws_lambda_function.product_service" -target="aws_apigatewayv2_integration.product" -target="aws_apigatewayv2_route.products_any" -target="aws_apigatewayv2_route.products_id" -target="aws_lambda_permission.api_gw_product"
```

### 🔒 Auth Service
```powershell
cd c:\Product\ecommerce-backend\terraform
# 1. Import (if not done yet)
terraform import aws_lambda_function.auth_service anbu-auth-service

# 2. Deploy ONLY Auth Service
terraform apply -target="aws_lambda_function.auth_service" -target="aws_apigatewayv2_integration.auth" -target="aws_apigatewayv2_route.auth_register" -target="aws_apigatewayv2_route.auth_login" -target="aws_apigatewayv2_route.auth_confirm" -target="aws_apigatewayv2_route.auth_logout" -target="aws_lambda_permission.api_gw_auth"
```

### 📋 Inventory Service
```powershell
cd c:\Product\ecommerce-backend\terraform
# 1. Import (if not done yet)
terraform import aws_lambda_function.inventory_service anbu-inventory-service

# 2. Deploy ONLY Inventory Service
terraform apply -target="aws_lambda_function.inventory_service" -target="aws_apigatewayv2_integration.inventory" -target="aws_apigatewayv2_route.inventory_any" -target="aws_apigatewayv2_route.inventory_id" -target="aws_lambda_permission.api_gw_inventory"
```

### 🛒 Cart Service
```powershell
cd c:\Product\ecommerce-backend\terraform
# 1. Import (if not done yet)
terraform import aws_lambda_function.cart_service anbu-cart-service

# 2. Deploy ONLY Cart Service
terraform apply -target="aws_lambda_function.cart_service" -target="aws_apigatewayv2_integration.cart" -target="aws_apigatewayv2_route.cart_any" -target="aws_lambda_permission.api_gw_cart"
```

### 📦 Order Service
```powershell
cd c:\Product\ecommerce-backend\terraform
# 1. Import (if not done yet)
terraform import aws_lambda_function.order_service anbu-order-service

# 2. Deploy ONLY Order Service
terraform apply -target="aws_lambda_function.order_service" -target="aws_apigatewayv2_integration.order" -target="aws_apigatewayv2_route.order_any" -target="aws_apigatewayv2_route.order_id" -target="aws_lambda_permission.api_gw_order"
```

### 💳 Payment Service
```powershell
cd c:\Product\ecommerce-backend\terraform
# 1. Import (if not done yet)
terraform import aws_lambda_function.payment_service anbu-payment-service

# 2. Deploy ONLY Payment Service
terraform apply -target="aws_lambda_function.payment_service" -target="aws_apigatewayv2_integration.payment" -target="aws_apigatewayv2_route.payment_any" -target="aws_apigatewayv2_route.payment_id" -target="aws_lambda_permission.api_gw_payment"
```

### 🔔 Notification Service
```powershell
cd c:\Product\ecommerce-backend\terraform
# 1. Import (if not done yet)
terraform import aws_lambda_function.notification_service anbu-notification-service

# 2. Deploy ONLY Notification Service
terraform apply -target="aws_lambda_function.notification_service" -target="aws_apigatewayv2_integration.notification" -target="aws_apigatewayv2_route.notification_any" -target="aws_apigatewayv2_route.notification_id" -target="aws_lambda_permission.api_gw_notification"
```

---

## 3. Deploy EVERYTHING At Once
If all 7 of your Lambda functions are already created in AWS and imported into Terraform, you can simply run:

```powershell
cd c:\Product\ecommerce-backend\terraform
terraform apply
```
This will automatically figure out what changed and deploy everything simultaneously!
