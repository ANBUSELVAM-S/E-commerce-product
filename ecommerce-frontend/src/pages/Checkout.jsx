import React, { useState } from 'react';
import { Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/orderService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const Checkout = () => {
  const { cartId } = useAuth();
  const { cart, loading: cartLoading, fetchCart } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  if (cartLoading) return <LoadingSpinner />;
  
  if (!cart || !cart.items || cart.items.length === 0) {
    if (!orderPlaced) {
      return <Navigate to="/cart" replace />;
    }
    // If order is placed, cart might be emptied before navigation finishes. Just show spinner.
    return <LoadingSpinner />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setOrderPlaced(true);
      
      const orderData = {
        cartId,
        shippingAddress: formData
      };
      
      const newOrder = await createOrder(orderData);
      toast.success('Order placed successfully!');
      
      // Cart is cleared by backend, fetch to update state
      await fetchCart();
      
      // Redirect to payment
      navigate(`/payment/${newOrder.orderId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
      console.error(error);
      setLoading(false);
      setOrderPlaced(false);
    }
  };

  const subtotal = cart.totalPrice || 0;
  const shippingCharge = 50;
  const totalAmount = subtotal + shippingCharge;

  return (
    <Row className="g-4">
      <Col lg={8}>
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white">
            <h4 className="fw-bold mb-0">Shipping Details</h4>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control type="text" name="fullName" required onChange={handleChange} />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Street Address</Form.Label>
                <Form.Control type="text" name="street" required onChange={handleChange} />
              </Form.Group>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Control type="text" name="city" required onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>State</Form.Label>
                    <Form.Control type="text" name="state" required onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Zip Code</Form.Label>
                    <Form.Control type="text" name="zipCode" required onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Country</Form.Label>
                    <Form.Control type="text" name="country" required onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>
              
              <div className="d-flex justify-content-end mt-4">
                <Button variant="dark" size="lg" type="submit" disabled={loading} className="rounded-0 text-uppercase" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '1px' }}>
                  {loading ? 'Processing...' : 'Place Order & Continue to Payment'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
      
      <Col lg={4}>
        <Card className="shadow-sm bg-light">
          <Card.Body>
            <h4 className="fw-bold mb-4">Order Summary</h4>
            {cart.items.map(item => (
              <div key={item.productId} className="d-flex justify-content-between mb-2 small">
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <hr />
            <div className="d-flex justify-content-between mb-2 text-muted">
              <span>Subtotal</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-3 text-muted">
              <span>Shipping Charge</span>
              <span>${shippingCharge.toFixed(2)}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between mb-0">
              <span className="fw-bold fs-5">Total</span>
              <span className="fw-bold fs-5 text-success">${totalAmount.toFixed(2)}</span>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default Checkout;
