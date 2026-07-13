import axios from 'axios';

const AUTH_URL = 'https://4a6ean43yd.execute-api.ap-southeast-1.amazonaws.com/api/auth';

export const registerUser = async (email, password, role) => {
  const response = await axios.post(`${AUTH_URL}/register`, { email, password, role });
  return response.data;
};

export const confirmUser = async (email, code) => {
  const response = await axios.post(`${AUTH_URL}/confirm`, { email, code });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await axios.post(`${AUTH_URL}/login`, { email, password });
  return response.data;
};
