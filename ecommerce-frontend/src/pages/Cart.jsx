import React from 'react';
import { Row, Col, Card, Button, ListGroup, Image } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Cart = () => {
  const { cart, loading, updateQuantity, removeFromCart, emptyCart } = useCart();
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner />;

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="text-center py-5">
        <h2 className="text-muted mb-4">Your Cart is Empty</h2>
        <Button as={Link} to="/" variant="warning" size="lg">
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Shopping Cart</h2>
        <Button variant="outline-danger" size="sm" onClick={emptyCart}>
          Empty Cart
        </Button>
      </div>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="shadow-sm">
            <ListGroup variant="flush">
              {cart.items.map((item) => (
                <ListGroup.Item key={item.productId} className="p-3">
                  <Row className="align-items-center">
                    <Col xs={3} md={2}>
                      <Image 
                        src={item.imageUrl || `https://via.placeholder.com/300x400/f5f5f5/333333?text=${encodeURIComponent(item.name)}`} 
                        
                        rounded 
                        fluid 
                      />
                    </Col>
                    <Col xs={9} md={4}>
                      <h6 className="fw-bold mb-1">{item.name}</h6>
                      <div className="text-success fw-bold">${item.price.toFixed(2)}</div>
                    </Col>
                    <Col xs={7} md={4} className="mt-3 mt-md-0">
                      <div className="input-group input-group-sm" style={{ maxWidth: '120px' }}>
                        <Button variant="outline-secondary" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                          <FiMinus />
                        </Button>
                        <input type="text" className="form-control text-center" value={item.quantity} readOnly />
                        <Button variant="outline-secondary" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                          <FiPlus />
                        </Button>
                      </div>
                    </Col>
                    <Col xs={5} md={2} className="text-end mt-3 mt-md-0">
                      <div className="fw-bold mb-2">${(item.price * item.quantity).toFixed(2)}</div>
                      <Button variant="outline-danger" size="sm" onClick={() => removeFromCart(item.productId)}>
                        <FiTrash2 /> Remove
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm bg-light">
            <Card.Body>
              <h4 className="fw-bold mb-4">Order Summary</h4>
              <div className="d-flex justify-content-between mb-3">
                <span>Subtotal ({cart.items.length} items)</span>
                <span className="fw-bold">${cart.totalPrice?.toFixed(2) || '50.00'}</span>
              </div>
              <div className="d-flex justify-content-between mb-3 text-muted">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <span className="fw-bold fs-5">Estimated Total</span>
                <span className="fw-bold fs-5 text-success">${cart.totalPrice?.toFixed(2) || '50.00'}</span>
              </div>
              <div className="d-grid">
                <Button 
                  variant="dark" 
                  size="lg" 
                  className="rounded-0 text-uppercase mt-3"
                  style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '1px' }}
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Cart;
