import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';

const PaymentSuccess = () => {
  const location = useLocation();
  const { payment, order } = location.state || {};

  if (!payment) {
    return <Navigate to="/" />;
  }

  return (
    <div className="d-flex justify-content-center">
      <Card className="shadow-sm w-100 text-center" style={{ maxWidth: '600px' }}>
        <Card.Body className="p-5">
          <FiCheckCircle className="text-success mb-4" size={80} />
          <h2 className="fw-bold mb-3">Payment Successful!</h2>
          <p className="text-muted mb-5">Thank you for your purchase. Your order has been placed and is being processed.</p>
          
          <div className="bg-light p-4 rounded text-start mb-5">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Transaction ID:</span>
              <span className="fw-bold">{payment.transactionId}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Order ID:</span>
              <span className="fw-bold">{order.orderId}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Amount Paid:</span>
              <span className="fw-bold text-success">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="d-grid gap-3">
            <Button as={Link} to="/payments" variant="outline-dark" size="lg" className="rounded-0 text-uppercase" style={{ fontSize: '13px', fontWeight: 600 }}>
              View Payment History
            </Button>
            <Button as={Link} to="/" variant="dark" size="lg" className="rounded-0 text-uppercase" style={{ fontSize: '13px', fontWeight: 600 }}>
              Continue Shopping
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
