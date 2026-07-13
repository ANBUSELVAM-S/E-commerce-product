import axios from 'axios';

// Create an Axios instance pointing to the API Gateway
const api = axios.create({
  baseURL: 'https://4a6ean43yd.execute-api.ap-southeast-1.amazonaws.com', // Point to AWS API Gateway
  timeout: 10000,
});

export default api;
