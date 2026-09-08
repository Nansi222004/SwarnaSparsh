import api from '../../../services/api';

export const adminShippingService = {
  /**
   * List all shipments with filters.
   */
  getAllShipments: async (params = {}) => {
    const res = await api.get('admin/shipping', { params });
    return {
      shipments: res.data?.data?.shipments || [],
      pagination: res.data?.pagination || { page: 1, limit: 20, totalItems: 0, totalPages: 1 },
    };
  },

  /**
   * Get single shipment detail.
   */
  getShipmentDetail: async (shipmentId) => {
    const res = await api.get(`admin/shipping/${shipmentId}`);
    return res.data?.data?.shipment || null;
  },

  /**
   * Track / sync shipment from courier.
   */
  trackShipment: async (shipmentId) => {
    const res = await api.post(`admin/shipping/${shipmentId}/track`);
    return res.data?.data?.shipment || null;
  },

  /**
   * Cancel a shipment.
   */
  cancelShipment: async (shipmentId) => {
    const res = await api.post(`admin/shipping/${shipmentId}/cancel`);
    return res.data?.data?.shipment || null;
  },

  /**
   * Override shipment status.
   */
  overrideStatus: async (shipmentId, { status, message }) => {
    const res = await api.patch(`admin/shipping/${shipmentId}/override-status`, { status, message });
    return res.data?.data?.shipment || null;
  },

  /**
   * Get shipping reports.
   */
  getReports: async (params = {}) => {
    const res = await api.get('admin/shipping/reports', { params });
    return res.data?.data || {};
  },
};
