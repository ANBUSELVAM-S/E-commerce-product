import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';


/**
 * Custom render that wraps the component with all required providers.
 */
export const renderWithProviders = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * Mock user objects for testing.
 */
export const mockAdminUser = {
  userId: 'admin-123',
  email: 'admin@test.com',
  role: 'admin',
};

export const mockRegularUser = {
  userId: 'user-456',
  email: 'user@test.com',
  role: 'user',
};

export const mockProduct = {
  productId: 'prod-001',
  name: 'Test Product',
  price: 29.99,
  description: 'A great test product',
  category: 'Electronics',
  stock: 10,
  imageUrl: 'https://example.com/image.jpg',
};

export const mockOrder = {
  orderId: 'order-001',
  userId: 'user-456',
  items: [
    { productId: 'prod-001', name: 'Test Product', price: 29.99, quantity: 2, imageUrl: 'https://example.com/image.jpg' }
  ],
  subtotal: 59.98,
  shippingCharge: 50,
  totalAmount: 109.98,
  status: 'pending',
  paymentStatus: 'unpaid',
  createdAt: '2026-07-14T10:00:00Z',
  shippingAddress: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'US'
  }
};

export const mockPayment = {
  transactionId: 'txn-001',
  orderId: 'order-001',
  userId: 'user-456',
  amount: 109.98,
  method: 'credit_card',
  status: 'success',
  createdAt: '2026-07-14T10:05:00Z',
};
