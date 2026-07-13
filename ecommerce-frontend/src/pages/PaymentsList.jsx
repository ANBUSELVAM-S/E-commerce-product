import React, { useState, useEffect } from 'react';
import { Card, Badge, Table, Container } from 'react-bootstrap';
import { getPayments } from '../services/paymentService';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const PaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await getPayments();
      setPayments(data);
    } catch (error) {
      toast.error('Failed to load transaction history');
      console.error(error);
    } finally {
      setLoading(false);
    }
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
                  <th className="px-4 py-3 border-0 text-end">Status</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13px' }}>
                {payments.map((payment) => (
                  <tr key={payment.transactionId}>
                    <td className="px-4 py-3 font-monospace text-muted">{payment.transactionId}</td>
                    <td className="py-3">{payment.orderId}</td>
                    <td className="py-3 text-muted">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 text-uppercase font-weight-bold">{payment.method}</td>
                    <td className="py-3 text-success fw-bold">${Number(payment.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-end">
                      <Badge 
                        bg={payment.status === 'success' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger'}
                        className="rounded-0 text-uppercase"
                        style={{ fontSize: '10px', padding: '5px 10px' }}
                      >
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default PaymentsList;
