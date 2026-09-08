import api from '../../../services/api';

export const pickupLocationService = {
  /** List all pickup locations for the authenticated seller. */
  list: async () => {
    const res = await api.get('seller/pickup-locations');
    return res.data?.data?.locations || [];
  },

  /** Get a single pickup location. */
  get: async (locationId) => {
    const res = await api.get(`seller/pickup-locations/${locationId}`);
    return res.data?.data?.location || null;
  },

  /** Create a new pickup location. */
  create: async (payload) => {
    const res = await api.post('seller/pickup-locations', payload);
    return res.data?.data?.location || null;
  },

  /** Update an existing pickup location. */
  update: async (locationId, payload) => {
    const res = await api.put(`seller/pickup-locations/${locationId}`, payload);
    return res.data?.data?.location || null;
  },

  /** Soft-delete a pickup location. */
  delete: async (locationId) => {
    const res = await api.delete(`seller/pickup-locations/${locationId}`);
    return res.data;
  },

  /** Set a location as the default pickup. */
  setDefault: async (locationId) => {
    const res = await api.patch(`seller/pickup-locations/${locationId}/set-default`);
    return res.data?.data?.location || null;
  },

  /** Manually trigger Shiprocket sync for a location. */
  syncWithShiprocket: async (locationId) => {
    const res = await api.post(`seller/pickup-locations/${locationId}/sync`);
    return res.data?.data?.location || null;
  },
};
