import api from '../../../services/api';

const unwrap = (res) => res?.data || { success: false };

const sellerPayoutService = {
    // ── Wallet overview ─────────────────────────────────────────────────
    getWallet: async () => {
        const res = await api.get('seller/payout/wallet');
        return unwrap(res);
    },

    // ── Transaction history ─────────────────────────────────────────────
    getTransactions: async (params = {}) => {
        const res = await api.get('seller/payout/transactions', { params });
        return unwrap(res);
    },

    // ── Payout requests ─────────────────────────────────────────────────
    getMyRequests: async (params = {}) => {
        const res = await api.get('seller/payout/requests', { params });
        return unwrap(res);
    },

    createRequest: async (data) => {
        const res = await api.post('seller/payout/request', data);
        return unwrap(res);
    },

    cancelRequest: async (id) => {
        const res = await api.delete(`seller/payout/request/${id}`);
        return unwrap(res);
    },
};

export default sellerPayoutService;
