import api from './api';

export const createOrder = async (orderData) => {
  const response = await api.post('api/orders', orderData);
  return response.data;
};

export const getOrders = async () => {
  const response = await api.get('api/orders');
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`api/orders/${id}`);
  return response.data;
};

export const cancelOrder = async (id) => {
  const response = await api.put(`api/orders/${id}/cancel`);
  return response.data;
};

// Internal API used by Payment Service, but here if needed.
export const payOrder = async (orderId) => {
  const response = await api.patch(`api/orders/${orderId}/pay`);
  return response.data;
};
