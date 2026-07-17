const fs = require('fs');
const path = require('path');

const services = [
  "auth-service", 
  "cart-service", 
  "inventory-service", 
  "notification-service", 
  "order-service", 
  "payment-service", 
  "product-service"
];

const basePath = 'c:\\Product\\ecommerce-backend';

services.forEach(service => {
  const pkgPath = path.join(basePath, service, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.test = 'jest';
    
    // Add basic jest config for node environment
    pkg.jest = {
      testEnvironment: 'node',
      clearMocks: true,
      coverageDirectory: 'coverage'
    };
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log(`Updated ${service}/package.json`);
  }
});
