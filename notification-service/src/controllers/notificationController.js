const Notification = require('../models/Notification');

const createNotification = async (req, res) => {
  try {
    const notification = new Notification(req.body);
    const savedNotification = await notification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const { userId, type, isRead } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNotificationById = async (req, res) => {
  try {
    let query = { $or: [{ _id: req.params.id }, { notificationId: req.params.id }] };
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        query = { notificationId: req.params.id };
    }
    const notification = await Notification.findOne(query);
    
    if (notification) {
      res.json(notification);
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateNotification = async (req, res) => {
  try {
    let query = { $or: [{ _id: req.params.id }, { notificationId: req.params.id }] };
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        query = { notificationId: req.params.id };
    }

    const notification = await Notification.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    
    if (notification) {
      res.json(notification);
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    let query = { $or: [{ _id: req.params.id }, { notificationId: req.params.id }] };
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        query = { notificationId: req.params.id };
    }

    const notification = await Notification.findOneAndDelete(query);
    
    if (notification) {
      res.json({ message: 'Notification deleted successfully' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    let query = { $or: [{ _id: req.params.id }, { notificationId: req.params.id }] };
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        query = { notificationId: req.params.id };
    }

    const notification = await Notification.findOneAndUpdate(query, { isRead: true }, { new: true });
    
    if (notification) {
      res.json(notification);
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required in body' });
    }

    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNotificationsByUser = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ userId: req.params.userId, isRead: false });
    res.json({ userId: req.params.userId, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markAsRead,
  markAllAsRead,
  getNotificationsByUser,
  getUnreadCount
};
