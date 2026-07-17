import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import {
  initiatePayment,
  confirmPayment,
  getPayments,
  getPaymentById,
  getPaymentsByOrder
} from '../../services/paymentService';

// Mock api
vi.mock('../../services/api', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
    }
  };
});

describe('paymentService', () => {
  const mockPaymentId = 'pay_123';
  const mockOrderId = 'order_456';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initiatePayment', () => {
    it('makes a POST request to initiate payment', async () => {
      const mockData = { transactionId: 'txn_123' };
      const paymentData = { amount: 100 };
      api.post.mockResolvedValueOnce({ data: mockData });

      const result = await initiatePayment(paymentData);

      expect(api.post).toHaveBeenCalledWith('api/payments/initiate', paymentData);
      expect(result).toEqual(mockData);
    });
  });

  describe('confirmPayment', () => {
    it('makes a POST request to confirm payment', async () => {
      const mockData = { status: 'success' };
      const confirmData = { transactionId: 'txn_123' };
      api.post.mockResolvedValueOnce({ data: mockData });

      const result = await confirmPayment(confirmData);

      expect(api.post).toHaveBeenCalledWith('api/payments/confirm', confirmData);
      expect(result).toEqual(mockData);
    });
  });

  describe('getPayments', () => {
    it('makes a GET request with userId query if provided', async () => {
      const mockData = [{ paymentId: mockPaymentId }];
      api.get.mockResolvedValueOnce({ data: mockData });

      const userId = 'user_123';
      const result = await getPayments(userId);

      expect(api.get).toHaveBeenCalledWith(`api/payments?userId=${userId}`);
      expect(result).toEqual(mockData);
    });

    it('makes a GET request without userId query if not provided', async () => {
      const mockData = [{ paymentId: mockPaymentId }];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getPayments();

      expect(api.get).toHaveBeenCalledWith(`api/payments`);
      expect(result).toEqual(mockData);
    });
  });

  describe('getPaymentById', () => {
    it('makes a GET request for a specific payment', async () => {
      const mockData = { paymentId: mockPaymentId };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getPaymentById(mockPaymentId);

      expect(api.get).toHaveBeenCalledWith(`api/payments/${mockPaymentId}`);
      expect(result).toEqual(mockData);
    });
  });

  describe('getPaymentsByOrder', () => {
    it('makes a GET request for payments of a specific order', async () => {
      const mockData = [{ paymentId: mockPaymentId }];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getPaymentsByOrder(mockOrderId);

      expect(api.get).toHaveBeenCalledWith(`api/payments/order/${mockOrderId}`);
      expect(result).toEqual(mockData);
    });
  });
});
