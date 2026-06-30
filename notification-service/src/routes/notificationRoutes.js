const express = require('express');
const router = express.Router();
const {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markAsRead,
  markAllAsRead,
  getNotificationsByUser,
  getUnreadCount
} = require('../controllers/notificationController');

// Specific routes first
router.patch('/read-all', markAllAsRead);
router.get('/user/:userId', getNotificationsByUser);
router.get('/user/:userId/unread-count', getUnreadCount);

// Generic CRUD and ID-based routes
router.route('/')
  .post(createNotification)
  .get(getAllNotifications);

router.route('/:id')
  .get(getNotificationById)
  .put(updateNotification)
  .delete(deleteNotification);

router.patch('/:id/read', markAsRead);

module.exports = router;
