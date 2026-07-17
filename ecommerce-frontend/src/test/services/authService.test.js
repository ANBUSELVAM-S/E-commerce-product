import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  registerUser,
  confirmUser,
  loginUser
} from '../../services/authService';

// Mock axios
vi.mock('axios');

describe('authService', () => {
  const AUTH_URL = 'https://4a6ean43yd.execute-api.ap-southeast-1.amazonaws.com/api/auth';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('makes a POST request to register endpoint with correct data', async () => {
      const mockData = { message: 'Registered successfully' };
      axios.post.mockResolvedValueOnce({ data: mockData });

      const email = 'test@test.com';
      const password = 'password123';
      const role = 'user';

      const result = await registerUser(email, password, role);

      expect(axios.post).toHaveBeenCalledWith(`${AUTH_URL}/register`, { email, password, role });
      expect(result).toEqual(mockData);
    });
  });

  describe('confirmUser', () => {
    it('makes a POST request to confirm endpoint with correct data', async () => {
      const mockData = { message: 'Confirmed successfully' };
      axios.post.mockResolvedValueOnce({ data: mockData });

      const email = 'test@test.com';
      const code = '123456';

      const result = await confirmUser(email, code);

      expect(axios.post).toHaveBeenCalledWith(`${AUTH_URL}/confirm`, { email, code });
      expect(result).toEqual(mockData);
    });
  });

  describe('loginUser', () => {
    it('makes a POST request to login endpoint with correct data', async () => {
      const mockData = { token: 'abc', user: { id: 1 } };
      axios.post.mockResolvedValueOnce({ data: mockData });

      const email = 'test@test.com';
      const password = 'password123';

      const result = await loginUser(email, password);

      expect(axios.post).toHaveBeenCalledWith(`${AUTH_URL}/login`, { email, password });
      expect(result).toEqual(mockData);
    });
  });
});
