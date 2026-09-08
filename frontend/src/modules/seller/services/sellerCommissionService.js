import api from '../../../services/api';

const unwrap = (res) => res?.data || { success: false };

const sellerCommissionService = {
    getSummary: async (params = {}) => {
        const res = await api.get('seller/commission/summary', { params });
        return unwrap(res);
    },

    getLedger: async (params = {}) => {
        const res = await api.get('seller/commission/ledger', { params });
        return unwrap(res);
    },

    getForOrder: async (orderId) => {
        const res = await api.get(`seller/commission/orders/${orderId}`);
        return unwrap(res);
    },
};

// ── Display helpers shared across seller commission UI ──────────────────

export const formatINR = (value) => {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return '₹0';
    return `₹${n.toLocaleString('en-IN')}`;
};

export const commissionStatusTone = (status) => {
    switch ((status || '').toLowerCase()) {
        case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        case 'pending':   return 'bg-amber-50 text-amber-700 border-amber-100';
        case 'reversed':  return 'bg-rose-50 text-rose-700 border-rose-100';
        case 'partial':   return 'bg-blue-50 text-blue-700 border-blue-100';
        default:          return 'bg-gray-50 text-gray-600 border-gray-100';
    }
};

export default sellerCommissionService;
