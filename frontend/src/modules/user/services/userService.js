import api from '../../../services/api';

export const userService = {
  // Category Management
  getCategories: async () => {
    try {
      const res = await api.get('public/categories');
      return res.data.data.categories || [];
    } catch (err) {
      console.error("Fetch categories failed:", err);
      return [];
    }
  },

  getCategoryBySlug: async (slug) => {
    try {
      const res = await api.get(`public/categories/${slug}`);
      return res.data.data.category;
    } catch (err) {
      console.error("Fetch category details failed:", err);
      throw err;
    }
  },

  // Product Management
  getProducts: async (params = {}) => {
    try {
      const res = await api.get('public/products', { params });
      return res.data.data;
    } catch (err) {
      console.error("Fetch products failed:", err);
      return { products: [], pagination: {} };
    }
  },

  getProductBySlug: async (slug) => {
    try {
      const res = await api.get(`public/products/${slug}`);
      return res.data.data.product;
    } catch (err) {
      console.error("Fetch product details failed:", err);
      throw err;
    }
  }
};
