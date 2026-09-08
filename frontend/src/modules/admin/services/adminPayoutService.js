import api from '../../../services/api';

const unwrap = (res) => res?.data || { success: false };

const adminPayoutService = {
    // ── Admin earnings ───────────────────────────────────────────────────
    getAdminEarnings: async () => {
        const res = await api.get('admin/payout/earnings');
        return unwrap(res);
    },

    // ── Payout request management ───────────────────────────────────────
    getRequests: async (params = {}) => {
        const res = await api.get('admin/payout/requests', { params });
        return unwrap(res);
    },

    getRequest: async (id) => {
        const res = await api.get(`admin/payout/requests/${id}`);
        return unwrap(res);
    },

    processRequest: async (id, data = {}) => {
        const res = await api.patch(`admin/payout/requests/${id}/process`, data);
        return unwrap(res);
    },

    approveRequest: async (id, data = {}) => {
        const res = await api.patch(`admin/payout/requests/${id}/approve`, data);
        return unwrap(res);
    },

    rejectRequest: async (id, data = {}) => {
        const res = await api.patch(`admin/payout/requests/${id}/reject`, data);
        return unwrap(res);
    },
};

export default adminPayoutService;
