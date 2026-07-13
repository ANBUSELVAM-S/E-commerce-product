import api from './api';

export const getInventory = async (params) => {
  const response = await api.get('api/inventory', { params });
  return response.data;
};

export const getInventoryByProductId = async (productId) => {
  const response = await api.get(`api/inventory/product/${productId}`);
  return response.data;
};

export const getLowStock = async () => {
  const response = await api.get('api/inventory/low-stock');
  return response.data;
};
