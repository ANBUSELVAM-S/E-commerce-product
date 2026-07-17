import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import * as AuthContext from '../../context/AuthContext';
import * as CartContext from '../../context/CartContext';
import { mockAdminUser, mockRegularUser } from '../testUtils';

// Mock contexts
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/CartContext', () => ({
  useCart: vi.fn(),
}));

describe('Navbar', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    CartContext.useCart.mockReturnValue({ cartItemCount: 2 });
  });

  const renderNavbar = () => {
    return render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  };

  it('renders guest links when no user is logged in', () => {
    AuthContext.useAuth.mockReturnValue({ user: null, logout: mockLogout });
    renderNavbar();

    expect(screen.getByText('LOG IN')).toBeInTheDocument();
    expect(screen.getByText('SIGN UP')).toBeInTheDocument();
    expect(screen.queryByText('Order')).not.toBeInTheDocument();
  });

  it('renders user links when a regular user is logged in', () => {
    AuthContext.useAuth.mockReturnValue({ user: mockRegularUser, logout: mockLogout });
    renderNavbar();

    expect(screen.getByText('Order')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('user@test.com')).toBeInTheDocument();
    expect(screen.queryByText('LOG IN')).not.toBeInTheDocument();
  });

  it('renders admin links when an admin is logged in', () => {
    AuthContext.useAuth.mockReturnValue({ user: mockAdminUser, logout: mockLogout });
    renderNavbar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('AddProduct')).toBeInTheDocument();
    
    // Admins shouldn't see regular Order/Payment links
    expect(screen.queryByText('Order')).not.toBeInTheDocument();
    expect(screen.queryByText('Payment')).not.toBeInTheDocument();
  });

  it('displays the cart item count badge', () => {
    AuthContext.useAuth.mockReturnValue({ user: null, logout: mockLogout });
    renderNavbar();
    
    // We mocked cartItemCount to be 2
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls logout when the logout button is clicked', async () => {
    AuthContext.useAuth.mockReturnValue({ user: mockRegularUser, logout: mockLogout });
    renderNavbar();
    
    const user = userEvent.setup();
    
    // Click dropdown toggle
    await user.click(screen.getByText('user@test.com'));
    
    // Click logout
    const logoutBtn = screen.getByText('LOG OUT');
    await user.click(logoutBtn);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
