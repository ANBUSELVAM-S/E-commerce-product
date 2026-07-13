import React, { useEffect } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { FiBell, FiCheck } from 'react-icons/fi';
import { useNotifications } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Notifications = () => {
  const { notifications, readNotification, readAllNotifications, fetchNotifications } = useNotifications();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const load = async () => {
      await fetchNotifications();
      setLoading(false);
    };
    load();
  }, [fetchNotifications]);

  if (loading) return <LoadingSpinner />;

  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-5">
        <FiBell size={60} className="text-muted mb-3 opacity-50" />
        <h4 className="text-muted">No notifications yet.</h4>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Notifications</h2>
        {unreadCount > 0 && (
          <Button variant="outline-primary" size="sm" onClick={readAllNotifications}>
            Mark All as Read
          </Button>
        )}
      </div>

      <div className="d-grid gap-3">
        {notifications.map((notif) => (
          <Card 
            key={notif._id || notif.notificationId} 
            className={`shadow-sm border-0 ${!notif.isRead ? 'border-start border-primary border-4' : ''}`}
            style={!notif.isRead ? { backgroundColor: '#f8fbff' } : {}}
          >
            <Card.Body className="d-flex justify-content-between align-items-center p-4">
              <div>
                <div className="d-flex align-items-center mb-2">
                  <Badge bg="secondary" className="me-2">{notif.type.replace('_', ' ').toUpperCase()}</Badge>
                  <small className="text-muted">{new Date(notif.createdAt).toLocaleString()}</small>
                  {!notif.isRead && <Badge bg="danger" className="ms-2">New</Badge>}
                </div>
                <h5 className="fw-bold mb-1">{notif.title}</h5>
                <p className="text-muted mb-0">{notif.message}</p>
              </div>
              
              {!notif.isRead && (
                <Button 
                  variant="light" 
                  className="rounded-circle p-2" 
                  onClick={() => readNotification(notif._id || notif.notificationId)}
                  title="Mark as read"
                >
                  <FiCheck className="text-primary" />
                </Button>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
