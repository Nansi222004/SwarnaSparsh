import api from '../../../services/api';

const unwrap = (res) => res?.data || { success: false };

const adminCommissionService = {
    // ── Tier configuration ──────────────────────────────────────────────
    getTiers: async () => {
        const res = await api.get('admin/commission/tiers');
        return unwrap(res);
    },

    updateTiers: async (tiers) => {
        const res = await api.put('admin/commission/tiers', { tiers });
        return unwrap(res);
    },

    toggleEnabled: async (enabled) => {
        const res = await api.patch('admin/commission/toggle', { enabled: !!enabled });
        return unwrap(res);
    },

    restoreDefaults: async () => {
        const res = await api.post('admin/commission/tiers/restore-defaults');
        return unwrap(res);
    },

    // ── Reports ─────────────────────────────────────────────────────────
    getSummary: async (params = {}) => {
        const res = await api.get('admin/commission/summary', { params });
        return unwrap(res);
    },

    getLedger: async (params = {}) => {
        const res = await api.get('admin/commission/ledger', { params });
        return unwrap(res);
    },

    // ── Per-entity detail ───────────────────────────────────────────────
    getForOrder: async (orderId) => {
        const res = await api.get(`admin/commission/orders/${orderId}`);
        return unwrap(res);
    },

    getForSeller: async (sellerId, params = {}) => {
        const res = await api.get(`admin/commission/sellers/${sellerId}`, { params });
        return unwrap(res);
    },
};

// ── Helpers (shared by pages/components) ────────────────────────────────

export const formatINR = (value) => {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return '₹0';
    return `₹${n.toLocaleString('en-IN')}`;
};

export const formatTierLabel = (tier) => {
    if (!tier) return '';
    if (tier.maxAmount === null || tier.maxAmount === undefined) return `₹${Number(tier.minAmount).toLocaleString('en-IN')}+`;
    return `₹${Number(tier.minAmount).toLocaleString('en-IN')} – ₹${Number(tier.maxAmount).toLocaleString('en-IN')}`;
};

// Pure local helper that mirrors the backend pickTier() — used for live previews.
export const pickTierLocal = (amount, tiers) => {
    const a = Number(amount) || 0;
    if (a <= 0) return null;
    if (!Array.isArray(tiers) || tiers.length === 0) return null;
    for (const t of tiers) {
        const min = Number(t.minAmount);
        const max = (t.maxAmount === null || t.maxAmount === undefined || t.maxAmount === '') ? null : Number(t.maxAmount);
        if (a >= min && (max === null || a <= max)) return t;
    }
    return null;
};

export default adminCommissionService;
