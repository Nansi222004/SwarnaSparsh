import api from '../../../services/api';

export const sellerDirectSaleService = {
  preview: async ({ serialCode }) => {
    const code = String(serialCode || '').trim();
    if (!code) return { success: false, message: 'Serial code is required' };
    try {
      const res = await api.post('/seller/direct-sales/preview', { serialCode: code });
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to preview direct sale'
      };
    }
  },
  confirm: async ({ serialCode, paymentMethod, customerName, customerPhone, note }) => {
    const code = String(serialCode || '').trim();
    if (!code) return { success: false, message: 'Serial code is required' };
    try {
      const res = await api.post('/seller/direct-sales/confirm', {
        serialCode: code,
        paymentMethod,
        customerName,
        customerPhone,
        note
      });
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to record direct sale'
      };
    }
  },
  list: async (params = {}) => {
    try {
      const res = await api.get('/seller/direct-sales', { params });
      const payload = res.data?.data || res.data || {};
      return {
        directSales: payload.directSales || [],
        pagination: payload.pagination || null
      };
    } catch (err) {
      return { directSales: [], pagination: null };
    }
  },
  detail: async (id) => {
    try {
      const res = await api.get(`/seller/direct-sales/${id}`);
      return res.data;
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to load direct sale' };
    }
  },
  voidSale: async (id, reason) => {
    try {
      const res = await api.patch(`/seller/direct-sales/${id}/void`, { reason });
      return res.data;
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to void sale' };
    }
  }
};
