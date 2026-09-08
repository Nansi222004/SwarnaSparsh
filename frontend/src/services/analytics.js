import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/';

/**
 * Analytics Service for tracking visitor events
 */
class AnalyticsService {
  constructor() {
    this.visitorId = this.getOrGenerateId('visitor_id');
    this.sessionId = this.getOrGenerateId('session_id', true); // Reset session if expired
    this.queue = [];
    this.isProcessing = false;
  }

  getOrGenerateId(key, isSession = false) {
    let id = localStorage.getItem(key);
    const lastActive = localStorage.getItem(key + '_time');
    const now = Date.now();

    // Session expires after 30 mins of inactivity
    if (isSession && lastActive && now - parseInt(lastActive) > 30 * 60 * 1000) {
      id = null;
    }

    if (!id) {
      id = 'v-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(key, id);
    }
    
    localStorage.setItem(key + '_time', now.toString());
    return id;
  }

  getVisitorInfo() {
    return {
      browser: {
        name: this.getBrowserName(),
        version: navigator.appVersion
      },
      os: {
        name: this.getOSName(),
        version: ''
      },
      resolution: {
        width: window.screen.width,
        height: window.screen.height
      },
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer,
      landingPage: window.location.pathname
    };
  }

  getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('MSIE') || ua.includes('Trident')) return 'IE';
    return 'Other';
  }

  getOSName() {
    const p = navigator.platform;
    if (p.includes('Win')) return 'Windows';
    if (p.includes('Mac')) return 'MacOS';
    if (p.includes('Linux')) return 'Linux';
    if (p.includes('iPhone') || p.includes('iPad')) return 'iOS';
    if (p.includes('Android')) return 'Android';
    return 'Other';
  }

  async track(type, metadata = {}) {
    const event = {
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      type,
      path: window.location.pathname,
      metadata,
      visitorInfo: this.queue.length === 0 ? this.getVisitorInfo() : undefined, // Only send info once per batch/session
      timestamp: new Date()
    };

    // Use sendBeacon if available for non-blocking tracking, especially on exit
    const endpoint = `${API_URL.endsWith('/') ? API_URL : API_URL + '/'}analytics/track`;
    
    if (type === 'exit' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
      return;
    }

    // Push to queue for batching (optional, simple for now)
    try {
      await axios.post(endpoint, event);
    } catch (err) {
      console.warn('Analytics tracking failed', err);
    }
  }

  async captureLead(data) {
    try {
      const endpoint = `${API_URL.endsWith('/') ? API_URL : API_URL + '/'}analytics/leads/capture`;
      await axios.post(endpoint, {
        visitorId: this.visitorId,
        ...data
      });
    } catch (err) {
      console.warn('Lead capture failed', err);
    }
  }
}

export const analytics = new AnalyticsService();
