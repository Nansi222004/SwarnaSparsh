import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const OFFICIAL_SETTINGS_DEFAULTS = {
  storeName: 'Swarna Sparsh',
  tagline: 'Swarna Sparsh – Where Luxury Meets Identity',
  phone: '+919921128662',
  contactPhone: '+919921128662',
  email: 'support@swarnasparsh.com',
  contactEmail: 'support@swarnasparsh.com',
  address: 'Swarna Sparsh, Sarafa Lane Gandhi Chowk Wani, 445304, Dist - Yavatmal, Maharashtra',
  logo: '/logo.webp',
  footerTagline: 'Timeless Elegance,',
  footerSubTagline: 'Handcrafted for You.',
  footerDescription:
    "Every piece at Swarna Sparsh tells a story of heritage and modern grace. Join our community of silver lovers and celebrate life's most precious moments.",
  footerCopyrightText: 'Swarna Sparsh. All Rights Reserved.',
  footerDeliveryText: 'Safe & Insured Express Worldwide Delivery',
  socialLinks: {
    facebook: '#',
    twitter: '#',
    instagram: '#',
    youtube: '#',
  },
};

const SettingsContext = createContext({
  settings: OFFICIAL_SETTINGS_DEFAULTS,
  loading: false,
  refreshSettings: async () => {},
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('siteSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...OFFICIAL_SETTINGS_DEFAULTS,
          ...parsed,
          socialLinks: {
            ...OFFICIAL_SETTINGS_DEFAULTS.socialLinks,
            ...(parsed.socialLinks || {}),
          },
        };
      }
    } catch {
      // ignore
    }
    return OFFICIAL_SETTINGS_DEFAULTS;
  });

  const [loading, setLoading] = useState(false);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('public/settings');
      if (res.data?.success && res.data?.data?.settings) {
        const fetched = res.data.data.settings;
        setSettings((prev) => {
          const merged = {
            ...OFFICIAL_SETTINGS_DEFAULTS,
            ...prev,
            ...fetched,
            socialLinks: {
              ...OFFICIAL_SETTINGS_DEFAULTS.socialLinks,
              ...(prev.socialLinks || {}),
              ...(fetched.socialLinks || {}),
            },
          };
          try {
            localStorage.setItem('siteSettings', JSON.stringify(merged));
          } catch {
            // ignore
          }
          return merged;
        });
      }
    } catch (err) {
      console.warn('Failed to fetch public settings, using fallback/stored settings:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();

    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('siteSettings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings((prev) => ({
            ...OFFICIAL_SETTINGS_DEFAULTS,
            ...prev,
            ...parsed,
            socialLinks: {
              ...OFFICIAL_SETTINGS_DEFAULTS.socialLinks,
              ...(prev.socialLinks || {}),
              ...(parsed.socialLinks || {}),
            },
          }));
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
