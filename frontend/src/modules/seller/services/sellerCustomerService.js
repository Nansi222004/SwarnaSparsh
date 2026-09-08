import api from '../../../services/api';

const normalizeCustomer = (customer) => {
    if (!customer) return null;
    return {
        id: customer.id || customer._id,
        name: customer.name || 'Customer',
        email: customer.email || '',
        totalOrders: Number(customer.totalOrders || 0),
        totalSpend: Number(customer.totalSpend || 0),
        lastOrderDate: customer.lastOrderDate || null
    };
};

export const sellerCustomerService = {
    getCustomers: async () => {
        try {
            // Backward compatible: fetch the first page with a higher limit to avoid large payloads.
            const res = await api.get('seller/customers', { params: { page: 1, limit: 100 } });
            const customers = res.data?.data?.customers || res.data?.customers || [];
            return customers.map(normalizeCustomer).filter(Boolean);
        } catch (err) {
            console.error("Failed to fetch seller customers:", err);
            return [];
        }
    },
    getCustomersPaged: async (params = {}) => {
        try {
            const res = await api.get('seller/customers', { params });
            const payload = res.data?.data || res.data || {};
            return {
                customers: (payload.customers || []).map(normalizeCustomer).filter(Boolean),
                pagination: payload.pagination || null
            };
        } catch (err) {
            console.error("Failed to fetch seller customers (paged):", err);
            return { customers: [], pagination: null };
        }
    },

    getCustomerDetails: async (id) => {
        try {
            const res = await api.get(`seller/customers/${id}`, { params: { page: 1, limit: 20 } });
            const payload = res.data?.data || res.data || {};
            const customer = payload.customer || null;
            const orders = payload.orders || [];
            return { customer, orders };
        } catch (err) {
            console.error("Failed to fetch seller customer details:", err);
            return { customer: null, orders: [] };
        }
    },
    getCustomerDetailsPaged: async (id, params = {}) => {
        try {
            const res = await api.get(`seller/customers/${id}`, { params });
            const payload = res.data?.data || res.data || {};
            return {
                customer: payload.customer || null,
                orders: payload.orders || [],
                pagination: payload.pagination || null
            };
        } catch (err) {
            console.error("Failed to fetch seller customer details (paged):", err);
            return { customer: null, orders: [], pagination: null };
        }
    },

    updateCustomerStatus: async () => {
        return { success: false, message: "Not available for sellers" };
    }
};
