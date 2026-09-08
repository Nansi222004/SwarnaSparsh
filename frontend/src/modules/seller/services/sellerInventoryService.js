import api from '../../../services/api';

export const sellerInventoryService = {
  getInventory: async (params = {}) => {
    try {
      const res = await api.get('seller/inventory', { params });
      return res.data.data?.inventory || res.data.inventory || [];
    } catch (err) {
      console.error("Seller fetch inventory failed:", err);
      return [];
    }
  },
  getInventoryPaged: async (params = {}) => {
    try {
      const res = await api.get('seller/inventory', { params });
      const payload = res.data?.data || res.data || {};
      return {
        inventory: payload.inventory || [],
        pagination: payload.pagination || null
      };
    } catch (err) {
      console.error("Seller fetch inventory (paged) failed:", err);
      return { inventory: [], pagination: null };
    }
  },
  adjustStock: async (payload) => {
    try {
      const res = await api.post('seller/inventory/adjust', payload);
      return res.data;
    } catch (err) {
      console.error("Seller adjust stock failed:", err);
      return { success: false, message: err.response?.data?.message || "Failed to adjust stock" };
    }
  },
  getStockHistory: async (params = {}) => {
    try {
      const res = await api.get('seller/inventory/history', { params });
      return res.data.data?.logs || res.data.logs || [];
    } catch (err) {
      console.error("Seller fetch stock history failed:", err);
      return [];
    }
  },
  getStockHistoryPaged: async (params = {}) => {
    try {
      const res = await api.get('seller/inventory/history', { params });
      const payload = res.data?.data || res.data || {};
      return {
        logs: payload.logs || [],
        pagination: payload.pagination || null
      };
    } catch (err) {
      console.error("Seller fetch stock history (paged) failed:", err);
      return { logs: [], pagination: null };
    }
  },
  getLowStockAlerts: async (params = {}) => {
    try {
      const res = await api.get('seller/inventory/alerts', { params });
      return res.data.data?.alerts || res.data.alerts || [];
    } catch (err) {
      console.error("Seller fetch low stock alerts failed:", err);
      return [];
    }
  },
  getLowStockAlertsPaged: async (params = {}) => {
    try {
      const res = await api.get('seller/inventory/alerts', { params });
      const payload = res.data?.data || res.data || {};
      return {
        alerts: payload.alerts || [],
        pagination: payload.pagination || null
      };
    } catch (err) {
      console.error("Seller fetch low stock alerts (paged) failed:", err);
      return { alerts: [], pagination: null };
    }
  },
  serializeStock: async (payload) => {
    try {
      const res = await api.post('seller/inventory/serialize-stock', payload);
      return res.data;
    } catch (err) {
      console.error("Seller serialize stock failed:", err);
      throw err;
    }
  }
};
