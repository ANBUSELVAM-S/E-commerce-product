import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import {
  getInventory,
  getInventoryByProductId,
  getLowStock,
  adjustStock,
  updateInventory
} from '../../services/inventoryService';

// Mock api
vi.mock('../../services/api', () => {
  return {
    default: {
      get: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
    }
  };
});

describe('inventoryService', () => {
  const mockProductId = 'prod_123';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInventory', () => {
    it('makes a GET request to api/inventory with params', async () => {
      const mockData = [{ productId: mockProductId, stock: 10 }];
      const params = { page: 1 };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getInventory(params);

      expect(api.get).toHaveBeenCalledWith('api/inventory', { params });
      expect(result).toEqual(mockData);
    });
  });

  describe('getInventoryByProductId', () => {
    it('makes a GET request to the specific product endpoint', async () => {
      const mockData = { productId: mockProductId, stock: 10 };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getInventoryByProductId(mockProductId);

      expect(api.get).toHaveBeenCalledWith(`api/inventory/product/${mockProductId}`);
      expect(result).toEqual(mockData);
    });
  });

  describe('getLowStock', () => {
    it('makes a GET request to the low-stock endpoint', async () => {
      const mockData = [{ productId: mockProductId, stock: 2 }];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getLowStock();

      expect(api.get).toHaveBeenCalledWith('api/inventory/low-stock');
      expect(result).toEqual(mockData);
    });
  });

  describe('adjustStock', () => {
    it('makes a PATCH request to adjust stock', async () => {
      const mockData = { message: 'Stock adjusted' };
      const data = { quantity: -5 };
      api.patch.mockResolvedValueOnce({ data: mockData });

      const result = await adjustStock(mockProductId, data);

      expect(api.patch).toHaveBeenCalledWith(`api/inventory/${mockProductId}/adjust`, data);
      expect(result).toEqual(mockData);
    });
  });

  describe('updateInventory', () => {
    it('makes a PUT request to update inventory', async () => {
      const mockData = { message: 'Inventory updated' };
      const data = { stock: 50 };
      api.put.mockResolvedValueOnce({ data: mockData });

      const result = await updateInventory(mockProductId, data);

      expect(api.put).toHaveBeenCalledWith(`api/inventory/${mockProductId}`, data);
      expect(result).toEqual(mockData);
    });
  });
});
