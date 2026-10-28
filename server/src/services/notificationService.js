const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async ({
  userId,
  title,
  message,
  type = 'system',
  relatedEntityType = 'none',
  relatedEntityId = null,
}) => {
  try {
    return await Notification.create({
      userId,
      title,
      message,
      type,
      relatedEntityType,
      relatedEntityId,
    });
  } catch (err) {
    console.error('[Notification] Error creating notification:', err.message);
  }
};

const notifyRoleUsers = async ({
  roles = ['health_worker', 'admin'],
  village = null,
  title,
  message,
  type = 'system',
  relatedEntityType = 'none',
  relatedEntityId = null,
}) => {
  try {
    const query = { role: { $in: roles }, accountStatus: 'active' };
    if (village) {
      // Either users in that village or admins
      query.$or = [{ village }, { role: 'admin' }];
    }
    const users = await User.find(query).select('_id');
    const docs = users.map((u) => ({
      userId: u._id,
      title,
      message,
      type,
      relatedEntityType,
      relatedEntityId,
    }));

    if (docs.length > 0) {
      await Notification.insertMany(docs);
    }
  } catch (err) {
    console.error('[Notification] Error broadcasting notification to roles:', err.message);
  }
};

module.exports = {
  createNotification,
  notifyRoleUsers,
};

