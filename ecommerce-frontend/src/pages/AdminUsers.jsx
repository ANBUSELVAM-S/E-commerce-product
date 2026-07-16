import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Modal, Tabs, Tab } from 'react-bootstrap';
import { getOrders } from '../services/orderService';
import { getPayments } from '../services/paymentService';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const [ordersData, paymentsData] = await Promise.all([
        getOrders(),
        getPayments()
      ]);

      setAllOrders(ordersData);
      setAllPayments(paymentsData);

      // Aggregate users
      const userMap = new Map();

      const processTransaction = (userId, type, amount) => {
        if (!userId) userId = 'Guest';
        if (!userMap.has(userId)) {
          userMap.set(userId, { userId, orderCount: 0, paymentCount: 0, totalSpend: 0 });
        }
        const userStat = userMap.get(userId);
        if (type === 'order') userStat.orderCount += 1;
        if (type === 'payment') {
          userStat.paymentCount += 1;
          userStat.totalSpend += Number(amount);
        }
      };

      ordersData.forEach(order => processTransaction(order.userId, 'order', 0));
      paymentsData.forEach(payment => processTransaction(payment.userId, 'payment', payment.amount));

      const aggregatedUsers = Array.from(userMap.values());
      // Sort by total spend descending
      aggregatedUsers.sort((a, b) => b.totalSpend - a.totalSpend);
      
      setUsers(aggregatedUsers);
    } catch (error) {
      toast.error('Failed to load users data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (userId) => {
    setSelectedUserId(userId);
    setShowModal(true);
  };

  if (loading) return <LoadingSpinner />;

  const userOrders = allOrders.filter(o => (o.userId || 'Guest') === selectedUserId);
  const userPayments = allPayments.filter(p => (p.userId || 'Guest') === selectedUserId);

  return (
    <Container className="py-5" style={{ maxWidth: '1000px' }}>
      <div className="text-center mb-5">
        <h2 className="mb-2">User Management</h2>
        <div className="script-font">View all active users and their histories</div>
      </div>

      <Card className="shadow-sm border-0 rounded-0">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light-grey text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px' }}>
              <tr>
                <th className="px-4 py-3 border-0">User ID / Email</th>
                <th className="py-3 border-0 text-center">Total Orders</th>
                <th className="py-3 border-0 text-center">Total Payments</th>
                <th className="py-3 border-0 text-end">Total Spend</th>
                <th className="px-4 py-3 border-0 text-end">Action</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '13px' }}>
              {users.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4">No user activity found.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.userId}>
                    <td className="px-4 py-3 font-monospace text-dark fw-bold">{user.userId}</td>
                    <td className="py-3 text-center text-muted">{user.orderCount}</td>
                    <td className="py-3 text-center text-muted">{user.paymentCount}</td>
                    <td className="py-3 text-end fw-bold text-success">${user.totalSpend.toFixed(2)}</td>
                    <td className="px-4 py-3 text-end">
                      <Button 
                        variant="outline-dark" 
                        size="sm" 
                        className="rounded-0 text-uppercase"
                        style={{ fontSize: '10px', letterSpacing: '1px' }}
                        onClick={() => handleViewHistory(user.userId)}
                      >
                        View History
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* User History Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '18px' }}>
            User History <span className="text-muted text-lowercase font-monospace ms-2" style={{fontSize: '12px'}}>{selectedUserId}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3 px-4 pb-4">
          <Tabs defaultActiveKey="orders" className="mb-4">
            <Tab eventKey="orders" title={<span className="fw-bold px-3">Orders ({userOrders.length})</span>}>
              {userOrders.length === 0 ? (
                <p className="text-muted text-center py-4">No orders found for this user.</p>
              ) : (
                <Table size="sm" responsive hover className="mb-0 align-middle">
                  <thead className="bg-light text-uppercase" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    <tr>
                      <th className="py-2 border-0">Order ID</th>
                      <th className="py-2 border-0">Date</th>
                      <th className="py-2 border-0 text-end">Amount</th>
                      <th className="py-2 border-0 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '12px' }}>
                    {userOrders.map(order => (
                      <tr key={order.orderId}>
                        <td className="py-2 font-monospace text-muted">{order.orderId.substring(0, 10)}...</td>
                        <td className="py-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 text-end fw-bold">${Number(order.totalAmount).toFixed(2)}</td>
                        <td className="py-2 text-center">
                          <Badge bg={order.status === 'confirmed' ? 'success' : order.status === 'pending' ? 'warning' : 'danger'}>
                            {order.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab>

            <Tab eventKey="payments" title={<span className="fw-bold px-3">Payments ({userPayments.length})</span>}>
              {userPayments.length === 0 ? (
                <p className="text-muted text-center py-4">No payments found for this user.</p>
              ) : (
                <Table size="sm" responsive hover className="mb-0 align-middle">
                  <thead className="bg-light text-uppercase" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    <tr>
                      <th className="py-2 border-0">Txn ID</th>
                      <th className="py-2 border-0">Method</th>
                      <th className="py-2 border-0 text-end">Amount</th>
                      <th className="py-2 border-0 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '12px' }}>
                    {userPayments.map(payment => (
                      <tr key={payment.transactionId}>
                        <td className="py-2 font-monospace text-muted">{payment.transactionId.substring(0, 10)}...</td>
                        <td className="py-2 text-uppercase">{payment.method}</td>
                        <td className="py-2 text-end fw-bold text-success">${Number(payment.amount).toFixed(2)}</td>
                        <td className="py-2 text-center">
                          <Badge bg={payment.status === 'success' ? 'success' : 'danger'}>
                            {payment.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab>
          </Tabs>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AdminUsers;
