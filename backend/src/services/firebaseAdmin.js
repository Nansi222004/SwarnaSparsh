const admin = require('firebase-admin');

const fs = require('fs');
const path = require('path');

let credential = null;

// Option 1: serviceAccountKey.json if present in backend/
const keyPath = path.join(__dirname, '../../serviceAccountKey.json');
if (fs.existsSync(keyPath)) {
  try {
    const serviceAccountJson = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    credential = admin.credential.cert(serviceAccountJson);
  } catch (err) {
    console.warn('Failed to parse serviceAccountKey.json:', err.message);
  }
}

// Option 2: environment variables
if (!credential && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "swarnasparsh-fc86a",
    private_key: (process.env.FIREBASE_PRIVATE_KEY || "")
      .replace(/^["']|["']$/g, '') // Remove accidental quotes
      .replace(/\\n/g, '\n')       // Replace literal \n with newlines
      .replace(/\\/g, '\n')        // Replace any stray backslashes with newlines
      .trim(),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };
  try {
    credential = admin.credential.cert(serviceAccount);
  } catch (err) {
    console.warn('Failed to build credential from env:', err.message);
  }
}

try {
  if (credential && admin.apps.length === 0) {
    admin.initializeApp({ credential });
    console.log('Firebase Admin initialized successfully');
  } else if (admin.apps.length === 0) {
    console.warn('Firebase Admin credentials not found, skipping initialization');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

// Function to send notification
async function sendPushNotification(tokens, payload) {
  if (!tokens || tokens.length === 0) return;
  
  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      tokens: tokens, // Array of FCM tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent: ${response.successCount} messages`);
    console.log(`Failed: ${response.failureCount} messages`);
    
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    // throw error; // Don't throw to prevent breaking main flow
  }
}

module.exports = { admin, sendPushNotification };
