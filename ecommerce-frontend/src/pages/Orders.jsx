import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Row, Col, Container, Modal, Table, Spinner } from 'react-bootstrap';
import { getOrders, cancelOrder } from '../services/orderService';
import { getPaymentsByOrder } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();
  const navigate = useNavigate();
  
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders(userId);
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
        fetchOrders();
      } catch (error) {
        toast.error('Failed to cancel order');
      }
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setSelectedPayment(null);
    setPaymentLoading(true);
    setShowModal(true);
    
    // Fetch payment details for this order
    try {
      const payments = await getPaymentsByOrder(order.orderId);
      console.log('Payment data for order:', order.orderId, payments);
      if (payments && payments.length > 0) {
        setSelectedPayment(payments[0]);
      } else {
        setSelectedPayment(null);
      }
    } catch (err) {
      console.error('Failed to fetch payment details', err);
      setSelectedPayment(null);
    } finally {
      setPaymentLoading(false);
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
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                              className="me-3"
                            />
                          )}
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
                    
                    <div className="d-flex flex-column gap-2">
                      {order.status === 'pending' && order.paymentStatus === 'unpaid' && (
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="rounded-0 text-uppercase w-100 fw-bold"
                          style={{ fontSize: '11px', letterSpacing: '1px' }}
                          onClick={() => navigate(`/payment/${order.orderId}`)}
                        >
                          Pay Now
                        </Button>
                      )}
                      <Button 
                        variant="dark" 
                        size="sm" 
                        className="rounded-0 text-uppercase w-100"
                        style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px' }}
                        onClick={() => handleViewDetails(order)}
                      >
                        View Details
                      </Button>
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
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '18px' }}>
            Order Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 pb-4 px-4">
          {selectedOrder && (
            <>
              <p className="text-muted small mb-4">Order ID: {selectedOrder.orderId}</p>
              
              <Row>
                <Col md={6} className="mb-4">
                  <h6 className="fw-bold text-uppercase mb-3" style={{ fontSize: '13px', letterSpacing: '1px' }}>Shipping Address</h6>
                  <Card className="border-0 bg-light p-3 rounded-0 small text-muted">
                    {selectedOrder.shippingAddress ? (
                      <>
                        <span className="fw-bold text-dark d-block mb-1">{selectedOrder.shippingAddress.fullName}</span>
                        <span>{selectedOrder.shippingAddress.street}</span><br />
                        <span>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</span><br />
                        <span>{selectedOrder.shippingAddress.country}</span>
                      </>
                    ) : (
                      <span>No shipping details provided.</span>
                    )}
                  </Card>
                </Col>
                <Col md={6} className="mb-4">
                  <h6 className="fw-bold text-uppercase mb-3" style={{ fontSize: '13px', letterSpacing: '1px' }}>Payment Details</h6>
                  <Card className="border-0 bg-light p-3 rounded-0 small text-muted h-100">
                    {paymentLoading ? (
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <Spinner animation="border" size="sm" className="me-2" /> Loading payment...
                      </div>
                    ) : selectedPayment ? (
                      <>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Transaction ID:</span>
                          <span className="font-monospace text-dark" style={{ fontSize: '11px' }}>{selectedPayment.transactionId.substring(0,14)}...</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Method:</span>
                          <span className="text-uppercase fw-bold text-dark">{selectedPayment.method}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Status:</span>
                          <Badge bg={selectedPayment.status === 'success' ? 'success' : selectedPayment.status === 'pending' ? 'warning' : 'danger'} className="rounded-0 text-uppercase" style={{fontSize: '9px'}}>
                            {selectedPayment.status}
                          </Badge>
                        </div>
                        {selectedPayment.paidAt && (
                          <div className="d-flex justify-content-between mb-2">
                            <span>Paid At:</span>
                            <span className="text-dark">{new Date(selectedPayment.paidAt).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="d-flex justify-content-between mt-auto pt-2 border-top">
                          <span className="fw-bold">Amount Paid:</span>
                          <span className="fw-bold text-success">${Number(selectedPayment.amount).toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <span className="my-auto text-center">No payment record found for this order.</span>
                    )}
                  </Card>
                </Col>
              </Row>
              
              <h6 className="fw-bold text-uppercase mt-2 mb-3" style={{ fontSize: '13px', letterSpacing: '1px' }}>Product Items</h6>
              <Table responsive borderless className="mb-0 border border-light">
                <thead className="bg-light text-uppercase text-muted" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                  <tr>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-end">Price</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx} className="border-bottom border-light">
                      <td className="py-3 px-3">
                        <div className="d-flex align-items-center">
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }}
                              className="me-2"
                            />
                          )}
                          <span className="fw-bold">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-muted align-middle">{item.quantity}</td>
                      <td className="py-3 px-3 text-end text-muted align-middle">${Number(item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="2" className="py-3 px-3 text-end text-muted">Subtotal</td>
                    <td className="py-3 px-3 text-end text-muted">${Number(selectedOrder.subtotal).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="2" className="pb-3 px-3 text-end text-muted">Shipping</td>
                    <td className="pb-3 px-3 text-end text-muted">${Number(selectedOrder.shippingCharge).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="2" className="pb-3 px-3 text-end fw-bold">Total</td>
                    <td className="pb-3 px-3 text-end fw-bold text-success fs-5">${Number(selectedOrder.totalAmount).toFixed(2)}</td>
                  </tr>
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        {selectedOrder && selectedOrder.status === 'pending' && (
          <Modal.Footer className="border-top-0 pt-0 px-4 pb-4 d-flex flex-column gap-2">
            {selectedOrder.paymentStatus === 'unpaid' && (
              <Button
                variant="success"
                className="rounded-0 text-uppercase w-100 fw-bold m-0"
                style={{ fontSize: '12px', letterSpacing: '1px' }}
                onClick={() => {
                  setShowModal(false);
                  navigate(`/payment/${selectedOrder.orderId}`);
                }}
              >
                Pay Now
              </Button>
            )}
            <Button
              variant="outline-danger"
              className="rounded-0 text-uppercase w-100 m-0"
              style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1px' }}
              onClick={() => {
                setShowModal(false);
                handleCancel(selectedOrder.orderId);
              }}
            >
              Cancel This Order
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </Container>
  );
};

export default Orders;
