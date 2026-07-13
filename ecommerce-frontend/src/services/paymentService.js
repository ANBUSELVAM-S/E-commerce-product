import api from './api';

export const initiatePayment = async (paymentData) => {
  const response = await api.post('api/payments/initiate', paymentData);
  return response.data;
};

export const confirmPayment = async (confirmData) => {
  const response = await api.post('api/payments/confirm', confirmData);
  return response.data;
};

export const getPayments = async () => {
  const response = await api.get('api/payments');
  return response.data;
};

export const getPaymentById = async (id) => {
  const response = await api.get(`api/payments/${id}`);
  return response.data;
};
