import React from 'react';
import { Container, Nav, Navbar, Badge, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiSearch, FiUser } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const NavigationBar = () => {
  const { cartItemCount } = useCart();
  const { user, logout } = useAuth();

  return (
    <Navbar expand="lg" className="dream-nav sticky-top shadow-sm">
      <Container>
        {/* Brand */}
        <Navbar.Brand as={Link} to="/" className="dream-brand">
          DREAM CENTER
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Centered Links */}
          <Nav className="mx-auto">
            <Nav.Link as={Link} to="/" className="dream-nav-link">Home</Nav.Link>
            {user?.role !== 'admin' && (
              <>
                <Nav.Link as={Link} to="/orders" className="dream-nav-link">Order</Nav.Link>
                <Nav.Link as={Link} to="/payments" className="dream-nav-link">Payment</Nav.Link>
              </>
            )}
            <Nav.Link as={Link} to="/footer" className="dream-nav-link">Contact</Nav.Link>
            {user?.role === 'admin' && (
              <>
                <Nav.Link as={Link} to="/admin/add-product" className="dream-nav-link fw-bold text-success">
                  Add Product
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/dashboard" className="dream-nav-link fw-bold text-danger">
                  Admin Dashboard
                </Nav.Link>
              </>
            )}
          </Nav>

          {/* Right Icons */}
          <Nav className="align-items-center gap-4">
            {!user ? (
              <div className="d-flex align-items-center gap-3">
                <Link to="/login" className="text-dark text-decoration-none" style={{ fontSize: '13px', fontWeight: 600 }}>
                  LOG IN
                </Link>
                <Link to="/signup" className="text-dark text-decoration-none" style={{ fontSize: '13px', fontWeight: 600 }}>
                  SIGN UP
                </Link>
              </div>
            ) : (
              <div className="d-flex align-items-center">
                <FiUser size={22} className="me-1" />
                <NavDropdown 
                  title={<span style={{ fontSize: '13px', fontWeight: 600 }}>{user.email || 'Profile'}</span>} 
                  id="user-nav-dropdown" 
                  align="end"
                >
                  <NavDropdown.ItemText className="text-muted small">Role: {user.role}</NavDropdown.ItemText>
                  <NavDropdown.Divider />
                  <NavDropdown.Item 
                    onClick={logout} 
                    className="text-danger" 
                    style={{ fontSize: '13px', fontWeight: 600 }}
                  >
                    LOG OUT
                  </NavDropdown.Item>
                </NavDropdown>
              </div>
            )}
            {/* <Nav.Link href="#" className="text-dark">
              <FiSearch size={20} />
            </Nav.Link> */}
            <Nav.Link as={Link} to="/cart" className="text-dark position-relative">
              <FiShoppingCart size={20} />
              {cartItemCount > 0 && (
                <Badge 
                  bg="dark" 
                  pill 
                  className="position-absolute" 
                  style={{ top: '0', right: '-5px', fontSize: '10px' }}
                >
                  {cartItemCount}
                </Badge>
              )}
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
