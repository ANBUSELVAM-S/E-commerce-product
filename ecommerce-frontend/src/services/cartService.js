import api from './api';

export const getCart = async (cartId) => {
  const response = await api.get(`api/cart/${cartId}`);
  return response.data;
};



export const getCartSummary = async (cartId) => {
  const response = await api.get(`api/cart/${cartId}/summary`);
  return response.data;
};

export const addItemToCart = async (cartId, itemData) => {
  const response = await api.post(`api/cart/${cartId}/add`, itemData);
  return response.data;
};

export const updateItemQuantity = async (cartId, productId, quantity) => {
  const response = await api.put(`api/cart/${cartId}/update`, {
    productId,
    quantity
  });
  return response.data;
};

export const removeItemFromCart = async (cartId, productId) => {
  const response = await api.delete(`api/cart/${cartId}/remove/${productId}`);
  return response.data;
};

export const clearCart = async (cartId) => {
  const response = await api.delete(`api/cart/${cartId}/clear`);
  return response.data;
};
