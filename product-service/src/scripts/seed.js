const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');

// Load env vars from product-service root
dotenv.config({ path: __dirname + '/../../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/product_db';

const products = [
  // Electronics
  {
    name: 'Gaming Laptop Pro',
    description: 'High performance gaming laptop with 32GB RAM and RTX 4080.',
    price: 1999.99,
    category: 'Electronics',
    stock: 50,
    imageUrl: 'https://via.placeholder.com/400x300?text=Gaming+Laptop'
  },
  {
    name: 'Smartphone Ultra',
    description: 'Latest 5G smartphone with 120Hz display and excellent camera.',
    price: 899.99,
    category: 'Electronics',
    stock: 100,
    imageUrl: 'https://via.placeholder.com/400x300?text=Smartphone'
  },
  {
    name: 'Noise Cancelling Headphones',
    description: 'Over-ear wireless headphones with active noise cancellation.',
    price: 249.99,
    category: 'Electronics',
    stock: 75,
    imageUrl: 'https://via.placeholder.com/400x300?text=Headphones'
  },
  {
    name: 'Fitness Smartwatch',
    description: 'Water-resistant smartwatch with heart rate monitor.',
    price: 149.99,
    category: 'Electronics',
    stock: 120,
    imageUrl: 'https://via.placeholder.com/400x300?text=Smartwatch'
  },
  
  // Clothing
  {
    name: 'Classic Cotton T-Shirt',
    description: 'Comfortable 100% cotton crew neck t-shirt.',
    price: 19.99,
    category: 'Clothing',
    stock: 200,
    imageUrl: 'https://via.placeholder.com/400x300?text=T-Shirt'
  },
  {
    name: 'Winter Puffer Jacket',
    description: 'Warm and lightweight winter jacket.',
    price: 89.99,
    category: 'Clothing',
    stock: 40,
    imageUrl: 'https://via.placeholder.com/400x300?text=Jacket'
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight breathable mesh running shoes.',
    price: 69.99,
    category: 'Clothing',
    stock: 80,
    imageUrl: 'https://via.placeholder.com/400x300?text=Shoes'
  },
  
  // Books
  {
    name: 'Science Fiction Epic',
    description: 'A thrilling journey through the galaxy.',
    price: 14.99,
    category: 'Books',
    stock: 60,
    imageUrl: 'https://via.placeholder.com/400x300?text=Fiction+Book'
  },
  {
    name: 'The Quantum Universe',
    description: 'An easy-to-understand guide to quantum physics.',
    price: 24.99,
    category: 'Books',
    stock: 35,
    imageUrl: 'https://via.placeholder.com/400x300?text=Science+Book'
  },
  {
    name: 'Mastering JavaScript',
    description: 'Advanced programming guide for modern web development.',
    price: 39.99,
    category: 'Books',
    stock: 45,
    imageUrl: 'https://via.placeholder.com/400x300?text=Programming+Book'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB: ${MONGO_URI}`);

    await Product.deleteMany({});
    console.log('Cleared existing products.');

    await Product.insertMany(products);
    console.log('Successfully inserted 10 sample products.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDB();
