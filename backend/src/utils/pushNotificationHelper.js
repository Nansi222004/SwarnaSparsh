const { sendPushNotification } = require('../services/firebaseAdmin');
const User = require('../models/User');
const Seller = require('../models/Seller');

/**
 * Send push notification to a user or seller
 * @param {string} recipientId - User or Seller ID
 * @param {string} recipientType - 'user' or 'seller'
 * @param {object} payload - { title, body, data }
 */
async function sendNotificationToRecipient(recipientId, recipientType, payload) {
  try {
    let recipient;
    if (recipientType === 'user') {
      recipient = await User.findById(recipientId);
    } else if (recipientType === 'seller') {
      recipient = await Seller.findById(recipientId);
    }

    if (!recipient) {
      console.log(`${recipientType} not found for ID: ${recipientId}`);
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
      console.log(`No FCM tokens found for ${recipientType}: ${recipientId}`);
      return;
    }
    
    // Send notification
    await sendPushNotification(uniqueTokens, payload);
  } catch (error) {
    console.error(`Error sending notification to ${recipientType}:`, error);
  }
}

module.exports = { sendNotificationToRecipient };
