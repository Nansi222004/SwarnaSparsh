import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Dummy configuration for now
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

let messagingInstance = null;
let isMessagingChecked = false;

export const getMessagingInstance = async () => {
  if (isMessagingChecked) return messagingInstance;
  
  try {
    const supported = await isSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
    } else {
      console.log('FCM Messaging is not supported on this browser/environment.');
    }
  } catch (err) {
    console.error('Failed to initialize Firebase Messaging:', err);
  }
  
  isMessagingChecked = true;
  return messagingInstance;
};

export { getToken, onMessage };

