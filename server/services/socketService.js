const Notification = require('../models/Notification');

let io;

exports.initSocket = (socketIo) => {
  io = socketIo;

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join admin room
    socket.on('join_admin', () => {
      socket.join('admin_room');
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

/**
 * Create a notification and emit it via socket
 */
exports.createNotification = async ({ userId, title, message, type, complaintId, link }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type: type || 'system',
      complaint: complaintId || null,
      link: link || '',
    });

    // Emit to user in real-time
    if (io) {
      io.to(`user_${userId}`).emit('notification:new', notification);
    }

    return notification;
  } catch (err) {
    console.error('Notification create error:', err.message);
  }
};

/**
 * Emit complaint status update to subscribers
 */
exports.emitStatusUpdate = (complaintId, data) => {
  if (io) {
    io.emit(`complaint:${complaintId}`, data);
  }
};

/**
 * Alert admin room of a new complaint
 */
exports.alertAdmin = (data) => {
  if (io) {
    io.to('admin_room').emit('admin:newComplaint', data);
  }
};
