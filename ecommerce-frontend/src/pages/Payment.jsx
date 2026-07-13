import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { getOrderById, payOrder } from '../services/orderService';
import { initiatePayment, confirmPayment } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';


const Payment = () => {
  const { orderId } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState('card');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (error) {
        toast.error('Failed to load order');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return <LoadingSpinner />;
  if (!order) return <h4 className="text-center mt-5">Order not found</h4>;

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      
      // Call payment service
      const paymentData = {
        orderId: order.orderId,
        userId: userId,
        amount: order.totalAmount,
        method: method
      };
      console.log(paymentData);
      // 1. Initiate the payment (status: pending)
      const paymentResult = await initiatePayment(paymentData);
      
      // 2. Confirm the payment (status: success + updates order to paid + sends sns)
      const confirmData = {
        transactionId: paymentResult.transactionId
      };
      const confirmedPayment = await confirmPayment(confirmData);
      
      
      navigate('/payment-success', { state: { payment: confirmedPayment, order: order } });
      toast.success('Payment successful!');
    } catch (error) {
      toast.error('Payment failed');
      console.error(error);
      setProcessing(false);
    }
  };

  return (
    <div className="d-flex justify-content-center">
      <Card className="shadow-sm w-100" style={{ maxWidth: '600px' }}>
        <Card.Header className="bg-white">
          <h4 className="fw-bold text-center mb-0">Secure Checkout</h4>
        </Card.Header>
        <Card.Body className="p-4">
          <Alert variant="info" className="mb-4">
            <div className="d-flex justify-content-between">
              <span>Order Total:</span>
              <span className="fw-bold">${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between small mt-1">
              <span>Order ID:</span>
              <span>{order.orderId}</span>
            </div>
          </Alert>

          <Form onSubmit={handlePayment}>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold mb-3">Select Payment Method</Form.Label>
              <div className="d-grid gap-3">
              <Form.Check
  type="radio"
  id="card"
  name="paymentMethod"
  label="Credit / Debit Card"
  checked={method === "card"}
  onChange={() => setMethod("card")}
  className="p-3 border rounded"
/>

<Form.Check
  type="radio"
  id="upi"
  name="paymentMethod"
  label="UPI"
  checked={method === "upi"}
  onChange={() => setMethod("upi")}
  className="p-3 border rounded mt-3"
/>

<Form.Check
  type="radio"
  id="netbanking"
  name="paymentMethod"
  label="Net Banking"
  checked={method === "netbanking"}
  onChange={() => setMethod("netbanking")}
  className="p-3 border rounded mt-3"
/>

<Form.Check
  type="radio"
  id="cod"
  name="paymentMethod"
  label="Cash on Delivery (COD)"
  checked={method === "cod"}
  onChange={() => setMethod("cod")}
  className="p-3 border rounded mt-3"
/>
              </div>
            </Form.Group>

            <Button 
              variant="dark" 
              size="lg" 
              type="submit" 
              className="w-100 fw-bold rounded-0 text-uppercase mt-4"
              style={{ fontSize: '14px', letterSpacing: '1px' }}
              disabled={processing}
            >
              {processing ? 'Processing...' : `Pay $${order.totalAmount.toFixed(2)}`}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Payment;
