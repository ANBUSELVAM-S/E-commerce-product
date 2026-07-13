import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Row, Col, Container } from 'react-bootstrap';
import { getOrders, cancelOrder } from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load orders');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await cancelOrder(orderId);
        toast.success('Order cancelled');
        fetchOrders(); // Refresh
      } catch (error) {
        toast.error('Failed to cancel order');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Container className="py-5" style={{ maxWidth: '800px' }}>
      <div className="text-center mb-5">
        <h2 className="mb-2">Your Orders</h2>
        <div className="script-font">Track your orders and purchases</div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-5">
          <h4 className="text-muted script-font">You have no orders yet.</h4>
        </div>
      ) : (
        <div className="d-grid gap-4">
          {orders.map((order) => (
            <Card key={order.orderId} className="border rounded-0 shadow-sm">
              <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <span className="text-muted small me-3">ORDER ID: {order.orderId}</span>
                  <span className="text-muted small">DATE: {new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="d-flex gap-2">
                  <Badge 
                    bg={order.status === 'pending' ? 'warning' : order.status === 'cancelled' ? 'danger' : 'success'} 
                    className="rounded-0 text-uppercase"
                    style={{ fontSize: '10px' }}
                  >
                    {order.status}
                  </Badge>
                  <Badge 
                    bg={order.paymentStatus === 'paid' ? 'success' : 'secondary'}
                    className="rounded-0 text-uppercase"
                    style={{ fontSize: '10px' }}
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>  
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col md={8}>
                    <div className="text-uppercase mb-2 text-muted fw-bold" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                      Items Ordered
                    </div>
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                        <div className="d-flex align-items-center">
                          <span className="fw-bold me-3 text-muted">{item.quantity}x</span>
                          <span className="text-dark" style={{ fontSize: '14px' }}>{item.name}</span>
                        </div>
                        <span className="text-muted small">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </Col>
                  <Col md={4} className="text-md-end mt-4 mt-md-0 border-start-md ps-md-4">
                    <div className="text-muted small text-uppercase fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                      Total Amount
                    </div>
                    <h3 className="fw-bold text-success mb-3">${Number(order.totalAmount).toFixed(2)}</h3>
                    
                    {order.status === 'pending' && (
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="rounded-0 text-uppercase w-100"
                        style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px' }}
                        onClick={() => handleCancel(order.orderId)}
                      >
                        Cancel Order
                      </Button>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default Orders;
