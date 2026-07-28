import React, { useState, useEffect } from 'react';
import { Card, Badge, Table, Container, Button, Modal, Row, Col } from 'react-bootstrap';
import { getPayments } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const PaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, [userId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await getPayments(userId);
      setPayments(data);
    } catch (error) {
      toast.error('Failed to load transaction history');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Container className="py-5" style={{ maxWidth: '1000px' }}>
      <div className="text-center mb-5">
        <h2 className="mb-2">Transaction History</h2>
        <div className="script-font">Your payments & receipts</div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-5">
          <h4 className="text-muted script-font">No transactions found.</h4>
        </div>
      ) : (
        <Card className="shadow-sm border-0 rounded-0">
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0 align-middle">
              <thead className="bg-light-grey text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                <tr>
                  <th className="px-4 py-3 border-0">Transaction ID</th>
                  <th className="py-3 border-0">Order ID</th>
                  <th className="py-3 border-0">Date</th>
                  <th className="py-3 border-0">Method</th>
                  <th className="py-3 border-0">Amount</th>
                  <th className="py-3 border-0 text-center">Status</th>
                  <th className="px-4 py-3 border-0 text-end">Action</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13px' }}>
                {payments.map((payment) => (
                  <tr key={payment.transactionId}>
                    <td className="px-4 py-3 font-monospace text-muted">{payment.transactionId.substring(0,13)}...</td>
                    <td className="py-3">{payment.orderId.substring(0,8)}...</td>
                    <td className="py-3 text-muted">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 text-uppercase font-weight-bold">{payment.method}</td>
                    <td className="py-3 text-success fw-bold">${Number(payment.amount).toFixed(2)}</td>
                    <td className="py-3 text-center">
                      <Badge 
                        bg={payment.status === 'success' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger'}
                        className="rounded-0 text-uppercase"
                        style={{ fontSize: '10px', padding: '5px 10px' }}
                      >
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button 
                        variant="outline-dark" 
                        size="sm" 
                        className="rounded-0 text-uppercase"
                        style={{ fontSize: '10px', letterSpacing: '1px' }}
                        onClick={() => handleViewDetails(payment)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Payment Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className="rounded-0">
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '18px' }}>
            Payment Receipt
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 pb-4 px-4">
          {selectedPayment && (
            <>
              <p className="text-muted small mb-4">Transaction ID: {selectedPayment.transactionId}</p>
              
              <Row>
                <Col md={6} className="mb-4">
                  <h6 className="fw-bold text-uppercase mb-3" style={{ fontSize: '13px', letterSpacing: '1px' }}>Transaction Info</h6>
                  <Card className="border-0 bg-light p-3 rounded-0 small text-muted h-100">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Order ID:</span>
                      <span className="font-monospace text-dark">{selectedPayment.orderId}</span>
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
                    <div className="d-flex justify-content-between mt-auto pt-2 border-top">
                      <span className="fw-bold">Total Amount:</span>
                      <span className="fw-bold text-success fs-6">${Number(selectedPayment.amount).toFixed(2)}</span>
                    </div>
                  </Card>
                </Col>
                
                <Col md={6} className="mb-4">
                  <h6 className="fw-bold text-uppercase mb-3" style={{ fontSize: '13px', letterSpacing: '1px' }}>Shipping Address</h6>
                  <Card className="border-0 bg-light p-3 rounded-0 small text-muted h-100">
                    {selectedPayment.shippingAddress ? (
                      <>
                        <span className="fw-bold text-dark d-block mb-1">{selectedPayment.shippingAddress.fullName}</span>
                        <span>{selectedPayment.shippingAddress.street}</span><br />
                        <span>{selectedPayment.shippingAddress.city}, {selectedPayment.shippingAddress.state} {selectedPayment.shippingAddress.zipCode}</span><br />
                        <span>{selectedPayment.shippingAddress.country}</span>
                      </>
                    ) : (
                      <span>No shipping details stored with this transaction.</span>
                    )}
                  </Card>
                </Col>
              </Row>
              
              <h6 className="fw-bold text-uppercase mt-2 mb-3" style={{ fontSize: '13px', letterSpacing: '1px' }}>Products Covered</h6>
              <Table responsive borderless className="mb-0 border border-light">
                <thead className="bg-light text-uppercase text-muted" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                  <tr>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-end">Price</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {selectedPayment.items?.map((item, idx) => (
                    <tr key={idx} className="border-bottom border-light">
                      <td className="py-3 px-3 fw-bold">{item.name}</td>
                      <td className="py-3 px-3 text-center text-muted">{item.quantity}</td>
                      <td className="py-3 px-3 text-end text-muted">${Number(item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                  {!selectedPayment.items && (
                    <tr><td colSpan="3" className="py-3 px-3 text-center text-muted">No items found for this transaction.</td></tr>
                  )}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PaymentsList;
