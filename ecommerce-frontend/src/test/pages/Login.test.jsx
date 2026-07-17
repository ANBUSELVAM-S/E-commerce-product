import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import * as authService from '../../services/authService';
import * as AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';

// Mock dependencies
vi.mock('../../services/authService');
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Page', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    AuthContext.useAuth.mockReturnValue({ login: mockLogin });
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  it('renders login form correctly', () => {
    renderLogin();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const user = userEvent.setup();
    const mockUserData = { userId: '123', email: 'test@test.com', role: 'user' };
    const mockTokens = { accessToken: 'abc' };
    
    authService.loginUser.mockResolvedValueOnce({ 
      user: mockUserData, 
      tokens: mockTokens 
    });

    renderLogin();

    await user.type(screen.getByLabelText(/Email Address/i), 'test@test.com');
    await user.type(screen.getByLabelText(/Password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(authService.loginUser).toHaveBeenCalledWith('test@test.com', 'password123');
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(mockUserData, mockTokens);
      expect(toast.success).toHaveBeenCalledWith('Successfully logged in!');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles login failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';
    
    authService.loginUser.mockRejectedValueOnce({ 
      response: { data: { message: errorMessage } } 
    });

    renderLogin();

    await user.type(screen.getByLabelText(/Email Address/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/Password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
