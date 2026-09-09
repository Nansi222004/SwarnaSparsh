const { sendPushNotification } = require('../services/firebaseAdmin');
const User = require('../models/User');

/**
 * Send push notification to a user
 * @param {string} recipientId - User ID
 * @param {string} recipientType - 'user'
 * @param {object} payload - { title, body, data }
 */
async function sendNotificationToRecipient(recipientId, recipientType, payload) {
  try {
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      console.log(`User not found for ID: ${recipientId}`);
      return;
    }

    // Collect tokens from both web and mobile
    const tokens = [
      ...(recipient.fcmTokens || []),
      ...(recipient.fcmTokenMobile || [])
    ];
    
    // Remove duplicates and empty tokens
    const uniqueTokens = [...new Set(tokens)].filter(t => t);
    
    if (uniqueTokens.length === 0) {
      console.log(`No FCM tokens found for user: ${recipientId}`);
      return;
    }
    
    // Send notification
    await sendPushNotification(uniqueTokens, payload);
  } catch (error) {
    console.error(`Error sending notification to user:`, error);
  }
}

module.exports = { sendNotificationToRecipient };
