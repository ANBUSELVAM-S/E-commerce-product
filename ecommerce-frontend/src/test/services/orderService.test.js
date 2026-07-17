import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  payOrder
} from '../../services/orderService';

// Mock api
vi.mock('../../services/api', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    }
  };
});

describe('orderService', () => {
  const mockOrderId = 'order_123';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    it('makes a POST request to api/orders', async () => {
      const mockData = { orderId: mockOrderId };
      const orderData = { items: [] };
      api.post.mockResolvedValueOnce({ data: mockData });

      const result = await createOrder(orderData);

      expect(api.post).toHaveBeenCalledWith('api/orders', orderData);
      expect(result).toEqual(mockData);
    });
  });

  describe('getOrders', () => {
    it('makes a GET request with userId query if provided', async () => {
      const mockData = [{ orderId: mockOrderId }];
      api.get.mockResolvedValueOnce({ data: mockData });

      const userId = 'user_123';
      const result = await getOrders(userId);

      expect(api.get).toHaveBeenCalledWith(`api/orders?userId=${userId}`);
      expect(result).toEqual(mockData);
    });

    it('makes a GET request without userId query if not provided', async () => {
      const mockData = [{ orderId: mockOrderId }];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getOrders();

      expect(api.get).toHaveBeenCalledWith(`api/orders`);
      expect(result).toEqual(mockData);
    });
  });

  describe('getOrderById', () => {
    it('makes a GET request for a specific order', async () => {
      const mockData = { orderId: mockOrderId };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getOrderById(mockOrderId);

      expect(api.get).toHaveBeenCalledWith(`api/orders/${mockOrderId}`);
      expect(result).toEqual(mockData);
    });
  });

  describe('cancelOrder', () => {
    it('makes a PUT request to cancel the order', async () => {
      const mockData = { message: 'Order cancelled' };
      api.put.mockResolvedValueOnce({ data: mockData });

      const result = await cancelOrder(mockOrderId);

      expect(api.put).toHaveBeenCalledWith(`api/orders/${mockOrderId}/cancel`);
      expect(result).toEqual(mockData);
    });
  });

  describe('payOrder', () => {
    it('makes a PATCH request to pay the order', async () => {
      const mockData = { message: 'Order paid' };
      api.patch.mockResolvedValueOnce({ data: mockData });

      const result = await payOrder(mockOrderId);

      expect(api.patch).toHaveBeenCalledWith(`api/orders/${mockOrderId}/pay`);
      expect(result).toEqual(mockData);
    });
  });
});
