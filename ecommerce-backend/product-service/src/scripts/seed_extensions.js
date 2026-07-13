const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const PRODUCT_URI = process.env.PRODUCT_MONGO_URI || 'mongodb://localhost:27017/product_db';
const INVENTORY_URI = process.env.INVENTORY_MONGO_URI || 'mongodb://localhost:27017/inventory_db';
const NOTIFICATION_URI = process.env.NOTIFICATION_MONGO_URI || 'mongodb://localhost:27017/notification_db';
const SEARCH_URI = process.env.SEARCH_MONGO_URI || 'mongodb://localhost:27017/search_db';

// Import Models using relative paths or dynamic schema definition
const ProductSchema = new mongoose.Schema({
  name: String,
  stock: Number
});

const InventorySchema = new mongoose.Schema({
  productId: String,
  productName: String,
  currentStock: Number,
  reservedStock: { type: Number, default: 0 },
  availableStock: Number,
  lowStockThreshold: { type: Number, default: 10 },
  movements: Array,
  updatedAt: Date
});
InventorySchema.pre('save', function(next) {
  this.availableStock = this.currentStock - this.reservedStock;
  this.updatedAt = Date.now();
  next();
});

const NotificationSchema = new mongoose.Schema({
  notificationId: String,
  userId: String,
  type: String,
  title: String,
  message: String,
  isRead: { type: Boolean, default: false },
  metadata: Object,
  createdAt: { type: Date, default: Date.now }
});

const SearchLogSchema = new mongoose.Schema({
  query: String,
  resultsCount: Number,
  filters: Object,
  createdAt: { type: Date, default: Date.now }
});

const seedExtensions = async () => {
  let productConn, inventoryConn, notificationConn, searchConn;
  try {
    console.log('Connecting to databases...');
    
    // Connect to Product Database to fetch existing products
    productConn = await mongoose.createConnection(PRODUCT_URI).asPromise();
    const Product = productConn.model('Product', ProductSchema);
    const products = await Product.find({});
    
    if (products.length === 0) {
      console.log('No products found in product_db. Please run the product seed script first: node src/scripts/seed.js');
      productConn.close();
      process.exit(1);
    }
    console.log(`Found ${products.length} products to map to inventory.`);

    // Connect to Inventory Database
    inventoryConn = await mongoose.createConnection(INVENTORY_URI).asPromise();
    const Inventory = inventoryConn.model('Inventory', InventorySchema);
    await Inventory.deleteMany({});
    
    const inventoryItems = products.map(product => ({
      productId: product._id.toString(),
      productName: product.name,
      currentStock: product.stock || 50,
      reservedStock: 0,
      lowStockThreshold: 10,
      movements: [{
        type: 'addition',
        quantity: product.stock || 50,
        reason: 'Initial database seeding',
        date: new Date()
      }]
    }));

    // Save inventory items individually to trigger pre-save hook
    for (const item of inventoryItems) {
      const inv = new Inventory(item);
      await inv.save();
    }
    console.log(`Seeded ${inventoryItems.length} inventory records matching product database.`);

    // Connect to Notification Database
    notificationConn = await mongoose.createConnection(NOTIFICATION_URI).asPromise();
    const Notification = notificationConn.model('Notification', NotificationSchema);
    await Notification.deleteMany({});

    const mockNotifications = [
      {
        notificationId: 'NOTIF-1',
        userId: 'user_123',
        type: 'order_placed',
        title: 'Order Placed successfully',
        message: 'Your order for Gaming Laptop Pro has been received.',
        metadata: { orderId: 'ORD-12345' }
      },
      {
        notificationId: 'NOTIF-2',
        userId: 'user_123',
        type: 'payment_success',
        title: 'Payment Successful',
        message: 'Payment of $1999.99 was successfully processed.',
        metadata: { transactionId: 'TXN-98765' }
      },
      {
        notificationId: 'NOTIF-3',
        userId: 'admin_user',
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: 'The stock level for Fitness Smartwatch is below the threshold of 10 items.',
        metadata: { productId: products[3]?._id ? products[3]._id.toString() : 'mock_id' }
      }
    ];
    await Notification.insertMany(mockNotifications);
    console.log('Seeded 3 sample notifications.');

    // Connect to Search Database
    searchConn = await mongoose.createConnection(SEARCH_URI).asPromise();
    const SearchLog = searchConn.model('SearchLog', SearchLogSchema);
    await SearchLog.deleteMany({});

    const mockSearchLogs = [
      { query: 'laptop', resultsCount: 1, filters: { category: 'Electronics' } },
      { query: 'shoes', resultsCount: 1, filters: { category: 'Clothing' } },
      { query: 'javascript', resultsCount: 1, filters: { category: 'Books' } },
      { query: 'iphone', resultsCount: 0, filters: {} }
    ];
    await SearchLog.insertMany(mockSearchLogs);
    console.log('Seeded 4 sample search logs.');

    console.log('All services successfully seeded!');
  } catch (error) {
    console.error('Error seeding extension services:', error);
  } finally {
    if (productConn) await productConn.close();
    if (inventoryConn) await inventoryConn.close();
    if (notificationConn) await notificationConn.close();
    if (searchConn) await searchConn.close();
    process.exit(0);
  }
};

seedExtensions();
