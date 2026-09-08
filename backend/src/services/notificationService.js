const Notification = require("../models/Notification");
const { sendNotificationToRecipient } = require("../utils/pushNotificationHelper");
const { sendPushNotification } = require("./firebaseAdmin");

/**
 * Create a notification document in DB
 * @param {Object} params - { userId, title, message, type, link }
 * userId = null means it is a global/admin broadcast
 */
const createNotification = async ({ userId = null, title, message, type = "GENERAL", link = "" }) => {
  try {
    const notification = await Notification.create({ userId, title, message, type, link });
    
    // Send push notification if userId is provided
    if (userId) {
      await sendNotificationToRecipient(userId, "user", {
        title,
        body: message,
        data: { type, link }
      });
    }

    return notification;
  } catch (err) {
    console.error("[Notification] Failed to create:", err.message);
  }
};

/**
 * Broadcast a notification to all users (insert one doc per user)
 * For large user bases, replace with a queue-based approach.
 */
const broadcastNotification = async (title, message, type = "GENERAL", link = "") => {
  try {
    const User = require("../models/User");
    const users = await User.find({ isBlocked: false }).select("_id fcmTokens fcmTokenMobile");
    
    // DB notifications
    const docs = users.map((u) => ({ userId: u._id, title, message, type, link }));
    await Notification.insertMany(docs);

    // Push notifications
    const allTokens = users.reduce((acc, user) => {
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        acc.push(...user.fcmTokens);
      }
      if (user.fcmTokenMobile && user.fcmTokenMobile.length > 0) {
        acc.push(...user.fcmTokenMobile);
      }
      return acc;
    }, []);

    const uniqueTokens = [...new Set(allTokens)].filter(t => t);
    
    if (uniqueTokens.length > 0) {
      // FCM allows up to 500 tokens per multicast message
      // For very large user bases, this should be chunked
      for (let i = 0; i < uniqueTokens.length; i += 500) {
        const chunk = uniqueTokens.slice(i, i + 500);
        await sendPushNotification(chunk, {
          title,
          body: message,
          data: { type, link }
        });
      }
    }

    return true;
  } catch (err) {
    console.error("[Notification] Broadcast failed:", err.message);
  }
};

module.exports = { createNotification, broadcastNotification };
