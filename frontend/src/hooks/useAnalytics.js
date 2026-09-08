import { useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../services/analytics';

/**
 * Hook to automatically track page views on route changes
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    analytics.track('page_view', {
      title: document.title,
      search: location.search
    });
  }, [location]);
};

/**
 * Hook for manual event tracking
 */
export const useAnalytics = () => {
  const track = useCallback((type, metadata) => {
    analytics.track(type, metadata);
  }, []);

  const captureLead = useCallback((data) => {
    analytics.captureLead(data);
  }, []);

  return useMemo(() => ({
    track,
    captureLead
  }), [track, captureLead]);
};
