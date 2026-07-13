import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const notifs = await getNotifications(userId);
      setNotifications(notifs);
      
      const { unreadCount } = await getUnreadCount(userId);
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    // Simple polling every 30 seconds for mock real-time updates
    const intervalId = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  const readNotification = async (id) => {
    try {
      await markAsRead(id);
      await fetchNotifications(); // Refresh
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const readAllNotifications = async () => {
    try {
      await markAllAsRead(userId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, readNotification, readAllNotifications, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
