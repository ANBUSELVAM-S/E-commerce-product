import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import {
  getProducts,
  getProductById,
  createProduct
} from '../../services/productService';

// Mock api
vi.mock('../../services/api', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
    }
  };
});

describe('productService', () => {
  const mockProductId = 'prod_123';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('makes a GET request to api/products with params', async () => {
      const mockData = [{ productId: mockProductId }];
      const params = { category: 'electronics' };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getProducts(params);

      expect(api.get).toHaveBeenCalledWith('/api/products', { params });
      expect(result).toEqual(mockData);
    });
  });

  describe('getProductById', () => {
    it('makes a GET request for a specific product', async () => {
      const mockData = { productId: mockProductId };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getProductById(mockProductId);

      expect(api.get).toHaveBeenCalledWith(`/api/products/${mockProductId}`);
      expect(result).toEqual(mockData);
    });
  });

  describe('createProduct', () => {
    it('makes a POST request to create a product', async () => {
      const mockData = { productId: mockProductId };
      const productData = { name: 'New Product' };
      api.post.mockResolvedValueOnce({ data: mockData });

      const result = await createProduct(productData);

      expect(api.post).toHaveBeenCalledWith('/api/products', productData);
      expect(result).toEqual(mockData);
    });
  });
});
