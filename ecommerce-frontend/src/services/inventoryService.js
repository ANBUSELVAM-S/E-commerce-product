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

export const adjustStock = async (productId, data) => {
  const response = await api.patch(`api/inventory/${productId}/adjust`, data);
  return response.data;
};

export const updateInventory = async (productId, data) => {
  const response = await api.put(`api/inventory/${productId}`, data);
  return response.data;
};

export const deleteInventory = async (productId) => {
  const response = await api.delete(`api/inventory/${productId}`);
  return response.data;
};
