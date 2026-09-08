import api from '../../../services/api';

export const sellerAnalyticsService = {
  getSalesTrend: async (params = {}) => {
    try {
      const res = await api.get('/seller/analytics/sales-trend', { params });
      const payload = res.data?.data || res.data || {};
      return payload.trend || [];
    } catch (err) {
      console.error('Failed to fetch seller sales trend:', err);
      return [];
    }
  },
  getProductPerformance: async (params = {}) => {
    try {
      const res = await api.get('/seller/analytics/product-performance', { params });
      const payload = res.data?.data || res.data || {};
      return payload.performance || [];
    } catch (err) {
      console.error('Failed to fetch seller product performance:', err);
      return [];
    }
  }
};

