import { getMessagingInstance, getToken, onMessage } from '../firebase';
import api from './api';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Register service worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const params = new URLSearchParams();
      if (import.meta.env.VITE_FIREBASE_API_KEY) params.set('apiKey', import.meta.env.VITE_FIREBASE_API_KEY);
      if (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) params.set('authDomain', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
      if (import.meta.env.VITE_FIREBASE_PROJECT_ID) params.set('projectId', import.meta.env.VITE_FIREBASE_PROJECT_ID);
      if (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) params.set('storageBucket', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
      if (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) params.set('messagingSenderId', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
      if (import.meta.env.VITE_FIREBASE_APP_ID) params.set('appId', import.meta.env.VITE_FIREBASE_APP_ID);
      if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) params.set('measurementId', import.meta.env.VITE_FIREBASE_MEASUREMENT_ID);

      const swUrl = params.toString() ? `/firebase-messaging-sw.js?${params.toString()}` : '/firebase-messaging-sw.js';
      const registration = await navigator.serviceWorker.register(swUrl);
      console.log('✅ Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      throw error;
    }
  } else {
    throw new Error('Service Workers are not supported');
  }
}

// Request notification permission
async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    } else {
      console.log('❌ Notification permission denied');
      return false;
    }
  }
  return false;
}

// Get FCM token
async function getFCMToken() {
  try {
    const registration = await registerServiceWorker();
    await registration.update(); // Update service worker
    
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.log('FCM Messaging is not supported, skipping token retrieval');
      return null;
    }
    
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (token) {
      console.log('✅ FCM Token obtained:', token);
      return token;
    } else {
      console.log('❌ No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    // Don't throw to prevent breaking main app flow
    return null;
  }
}

// Register FCM token with backend
async function registerFCMToken(forceUpdate = false) {
  try {
    // Check if user is logged in
    const authToken = localStorage.getItem('sands_token');
    if (!authToken) return null;

    // Check if already registered
    const savedToken = localStorage.getItem('fcm_token_web');
    if (savedToken && !forceUpdate) {
      console.log('FCM token already registered locally');
      return savedToken;
    }
    
    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return null;
    }
    
    // Get token
    const token = await getFCMToken();
    if (!token) {
      console.log('Failed to get FCM token');
      return null;
    }
    
    // Save to backend
    const response = await api.post(
      'user/notifications/fcm-token',
      {
        token: token,
        platform: 'web'
      },
      { skipUnauthorizedLogout: true }
    );
    
    if (response.data.success) {
      localStorage.setItem('fcm_token_web', token);
      console.log('✅ FCM token registered with backend');
      return token;
    } else {
      console.log('❌ Failed to register token with backend');
      return null;
    }
  } catch (error) {
    console.error('❌ Error registering FCM token:', error);
    return null;
  }
}

// Setup foreground notification handler
async function setupForegroundNotificationHandler(handler) {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.log('FCM Messaging is not supported, skipping foreground handler setup');
      return;
    }
    
    onMessage(messaging, (payload) => {
      console.log('📬 Foreground message received:', payload);
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
          body: payload.notification.body,
          icon: payload.notification.icon || '/favicon.png',
          data: payload.data
        };
        
        new Notification(notificationTitle, notificationOptions);
      }
      
      // Call custom handler (e.g., to update UI or show a toast)
      if (handler) {
        handler(payload);
      }
    });
  } catch (error) {
    console.error('Error setting up foreground notification handler:', error);
  }
}

// Initialize push notifications
async function initializePushNotifications({ registerToken = false } = {}) {
  try {
    if ('serviceWorker' in navigator) {
      await registerServiceWorker();
      // Token registration should happen only after AuthContext has verified the session.
      if (registerToken) {
        await registerFCMToken();
      }
    }
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
}

export {
  initializePushNotifications,
  registerFCMToken,
  setupForegroundNotificationHandler,
  requestNotificationPermission
};
