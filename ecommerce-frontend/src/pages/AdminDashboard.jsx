import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Tabs, Tab } from 'react-bootstrap';
import { getOrders } from '../services/orderService';
import { getPayments } from '../services/paymentService';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetching without userId returns all orders and payments (Admin only)
      const [ordersData, paymentsData] = await Promise.all([
        getOrders(),
        getPayments()
      ]);
      setOrders(ordersData);
      setPayments(paymentsData);
    } catch (error) {
      toast.error('Failed to load admin data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Container className="py-5" style={{ maxWidth: '1200px' }}>
      <div className="text-center mb-5">
        <h2 className="mb-2">Admin Dashboard</h2>
        <div className="script-font">Manage all store activity</div>
      </div>

      <Tabs defaultActiveKey="orders" className="mb-4">
        <Tab eventKey="orders" title={<span className="fw-bold px-3">ALL ORDERS</span>}>
          <Card className="shadow-sm border-0 rounded-0">
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light-grey text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Order ID</th>
                    <th className="py-3 border-0">User ID</th>
                    <th className="py-3 border-0">Date</th>
                    <th className="py-3 border-0">Amount</th>
                    <th className="py-3 border-0 text-center">Status</th>
                    <th className="px-4 py-3 border-0 text-end">Payment</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '13px' }}>
                  {orders.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-4">No orders found.</td></tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.orderId}>
                        <td className="px-4 py-3 font-monospace text-muted">{order.orderId.substring(0, 13)}...</td>
                        <td className="py-3 font-monospace">{order.userId || 'Guest'}</td>
                        <td className="py-3 text-muted">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-dark fw-bold">${Number(order.totalAmount).toFixed(2)}</td>
                        <td className="py-3 text-center">
                          <Badge 
                            bg={order.status === 'success' || order.status === 'confirmed' ? 'success' : order.status === 'pending' ? 'warning' : 'danger'}
                            className="rounded-0 text-uppercase"
                            style={{ fontSize: '10px', padding: '5px 10px' }}
                          >
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <Badge 
                            bg={order.paymentStatus === 'paid' ? 'success' : 'secondary'}
                            className="rounded-0 text-uppercase"
                            style={{ fontSize: '10px', padding: '5px 10px' }}
                          >
                            {order.paymentStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="payments" title={<span className="fw-bold px-3">ALL PAYMENTS</span>}>
          <Card className="shadow-sm border-0 rounded-0">
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light-grey text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Txn ID</th>
                    <th className="py-3 border-0">Order ID</th>
                    <th className="py-3 border-0">User ID</th>
                    <th className="py-3 border-0">Method</th>
                    <th className="py-3 border-0 text-end">Amount</th>
                    <th className="px-4 py-3 border-0 text-center">Status</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '13px' }}>
                  {payments.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-4">No payments found.</td></tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.transactionId}>
                        <td className="px-4 py-3 font-monospace text-muted">{payment.transactionId.substring(0, 10)}...</td>
                        <td className="py-3 font-monospace">{payment.orderId.substring(0, 10)}...</td>
                        <td className="py-3 font-monospace">{payment.userId || 'Guest'}</td>
                        <td className="py-3 text-uppercase">{payment.method}</td>
                        <td className="py-3 text-end fw-bold text-success">${Number(payment.amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge 
                            bg={payment.status === 'success' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger'}
                            className="rounded-0 text-uppercase"
                            style={{ fontSize: '10px', padding: '5px 10px' }}
                          >
                            {payment.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminDashboard;
