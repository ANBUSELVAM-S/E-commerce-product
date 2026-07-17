const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Product\\ecommerce-backend';
const commonTestingDir = path.join(rootDir, 'testing');

if (!fs.existsSync(commonTestingDir)) {
  fs.mkdirSync(commonTestingDir);
}

const services = [
  "auth-service", 
  "cart-service", 
  "inventory-service", 
  "notification-service", 
  "order-service", 
  "payment-service", 
  "product-service"
];

services.forEach(service => {
  const serviceTestingDir = path.join(rootDir, service, 'testing');
  
  if (fs.existsSync(serviceTestingDir)) {
    const files = fs.readdirSync(serviceTestingDir);
    
    files.forEach(file => {
      if (file.endsWith('.test.js')) {
        const oldPath = path.join(serviceTestingDir, file);
        // Prefix the filename with the service name to avoid conflicts if they had the same name,
        // though they are uniquely named like authController.test.js, but let's keep original name.
        const newPath = path.join(commonTestingDir, file);
        
        let content = fs.readFileSync(oldPath, 'utf8');
        
        // Update relative paths. 
        // Old: "../src/..." 
        // New: "../<service>/src/..."
        content = content.replace(/\.\.\/src\//g, `../${service}/src/`);
        
        fs.writeFileSync(newPath, content);
        console.log(`Moved and updated ${file} from ${service}`);
        
        // Delete old file
        fs.unlinkSync(oldPath);
      }
    });
    
    // Delete old testing directory
    fs.rmdirSync(serviceTestingDir);
  }
});
