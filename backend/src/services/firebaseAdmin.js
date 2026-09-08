const admin = require('firebase-admin');

// Dummy credentials for now
const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_PROJECT_ID || "dummy-project-id",
  "private_key": (process.env.FIREBASE_PRIVATE_KEY || "")
    .replace(/^["']|["']$/g, '') // Remove accidental quotes
    .replace(/\\n/g, '\n')       // Replace literal \n with newlines
    .replace(/\\/g, '\n')        // Replace any stray backslashes with newlines
    .trim() || "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-dummy@dummy-project-id.iam.gserviceaccount.com",
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized successfully');
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
