import api from './api';

export const getNotifications = async (userId) => {
  const response = await api.get(`api/notifications/user/${userId}`);
  return response.data;
};

export const getAllNotifications = async (params) => {
  const response = await api.get('api/notifications', { params });
  return response.data;
};

export const getUnreadCount = async (userId) => {
  const response = await api.get(`api/notifications/user/${userId}/unread-count`);
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await api.patch(`api/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async (userId) => {
  const response = await api.patch('api/notifications/read-all', { userId });
  return response.data;
};
