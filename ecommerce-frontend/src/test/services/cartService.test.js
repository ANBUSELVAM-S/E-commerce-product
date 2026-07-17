import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import {
  getCart,
  getCartSummary,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart
} from '../../services/cartService';

// Mock the api module
vi.mock('../../services/api', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    }
  };
});

describe('cartService', () => {
  const mockCartId = 'cart_123';
  const mockProductId = 'prod_456';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCart', () => {
    it('makes a GET request to the correct endpoint and returns data', async () => {
      const mockData = { items: [], total: 0 };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getCart(mockCartId);

      expect(api.get).toHaveBeenCalledWith(`api/cart/${mockCartId}`);
      expect(result).toEqual(mockData);
    });
  });

  describe('getCartSummary', () => {
    it('makes a GET request to the correct endpoint and returns data', async () => {
      const mockData = { totalItems: 2, subtotal: 50 };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getCartSummary(mockCartId);

      expect(api.get).toHaveBeenCalledWith(`api/cart/${mockCartId}/summary`);
      expect(result).toEqual(mockData);
    });
  });

  describe('addItemToCart', () => {
    it('makes a POST request with correct itemData and returns data', async () => {
      const mockItemData = { productId: 'prod_456', quantity: 2, price: 25 };
      const mockData = { items: [mockItemData], total: 50 };
      api.post.mockResolvedValueOnce({ data: mockData });

      const result = await addItemToCart(mockCartId, mockItemData);

      expect(api.post).toHaveBeenCalledWith(`api/cart/${mockCartId}/add`, mockItemData);
      expect(result).toEqual(mockData);
    });
  });

  describe('updateItemQuantity', () => {
    it('makes a PUT request with correct parameters and returns data', async () => {
      const quantity = 5;
      const mockData = { message: 'Updated' };
      api.put.mockResolvedValueOnce({ data: mockData });

      const result = await updateItemQuantity(mockCartId, mockProductId, quantity);

      expect(api.put).toHaveBeenCalledWith(`api/cart/${mockCartId}/update`, {
        productId: mockProductId,
        quantity
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('removeItemFromCart', () => {
    it('makes a DELETE request to the correct endpoint and returns data', async () => {
      const mockData = { message: 'Removed' };
      api.delete.mockResolvedValueOnce({ data: mockData });

      const result = await removeItemFromCart(mockCartId, mockProductId);

      expect(api.delete).toHaveBeenCalledWith(`api/cart/${mockCartId}/remove/${mockProductId}`);
      expect(result).toEqual(mockData);
    });
  });

  describe('clearCart', () => {
    it('makes a DELETE request to the correct endpoint and returns data', async () => {
      const mockData = { message: 'Cleared' };
      api.delete.mockResolvedValueOnce({ data: mockData });

      const result = await clearCart(mockCartId);

      expect(api.delete).toHaveBeenCalledWith(`api/cart/${mockCartId}/clear`);
      expect(result).toEqual(mockData);
    });
  });
});
