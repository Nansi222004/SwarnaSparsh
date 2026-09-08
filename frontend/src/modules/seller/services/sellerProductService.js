import api from '../../../services/api';

const mapSerialStatusToLegacy = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'SOLD_OFFLINE') return 'SOLD OFFLINE';
  if (normalized === 'SOLD_ONLINE') return 'SOLD ONLINE';
  if (normalized === 'SOLD ONLINE') return 'SOLD ONLINE';
  if (normalized === 'SOLD OFFLINE') return 'SOLD OFFLINE';
  return 'AVAILABLE';
};

const normalizeProduct = (product) => {
  if (!product) return null;
  const variants = product.variants || [];
  const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  const totalSold = variants.reduce((sum, v) => sum + (Number(v.sold) || 0), 0);
  const firstCategory = Array.isArray(product.categories) ? product.categories[0] : null;
  const serialCodes = variants.flatMap((v) => Array.isArray(v.serialCodes) ? v.serialCodes : []);
  const barcodes = serialCodes
    .filter((c) => c && (c.code || c.number))
    .map((c) => ({
      number: String(c.code || c.number || '').trim(),
      status: mapSerialStatusToLegacy(c.status)
    }))
    .filter((c) => Boolean(c.number));

  return {
    id: product._id,
    name: product.name,
    image: product.images?.[0] || '',
    category: firstCategory?.name || 'Uncategorized',
    categoryId: firstCategory?._id || firstCategory || '',
    metalType: product.material || product.metal || product.metalType || '',
    quantity: totalStock,
    availableStock: totalStock,
    soldItems: totalSold,
    barcodes,
    raw: product
  };
};

export const sellerProductService = {
  getSellerProductsPaged: async (params = {}) => {
    try {
      const res = await api.get('seller/products', { params });
      const payload = res.data?.data || res.data || {};
      return {
        products: payload.products || [],
        pagination: payload.pagination || {
          page: Number(params.page || 1),
          limit: Number(params.limit || 10),
          totalItems: Array.isArray(payload.products) ? payload.products.length : 0,
          totalPages: 1
        }
      };
    } catch (err) {
      console.error("Failed to fetch seller products:", err);
      return {
        products: [],
        pagination: { page: 1, limit: Number(params.limit || 10), totalItems: 0, totalPages: 1 }
      };
    }
  },
  getSellerProducts: async () => {
    try {
      // Backward-compatible helper: fetch a single larger page to avoid silent truncation
      // now that the backend endpoint is paginated by default.
      const { products } = await sellerProductService.getSellerProductsPaged({ page: 1, limit: 100 });
      return (products || []).map(normalizeProduct).filter(Boolean);
    } catch (err) {
      console.error("Failed to fetch seller products:", err);
      return [];
    }
  },
  getSellerProductsRaw: async () => {
    try {
      // Backward-compatible helper: fetch a single larger page to avoid silent truncation.
      const { products } = await sellerProductService.getSellerProductsPaged({ page: 1, limit: 100 });
      return products || [];
    } catch (err) {
      console.error("Failed to fetch seller products:", err);
      return [];
    }
  },
  getSellerProductById: async (id) => {
    try {
      const res = await api.get(`seller/products/${id}`);
      const product = res.data?.data?.product || res.data?.product;
      return normalizeProduct(product);
    } catch (err) {
      console.error("Failed to fetch seller product:", err);
      return null;
    }
  },
  getSellerProductRaw: async (id) => {
    try {
      const res = await api.get(`seller/products/${id}`);
      return res.data?.data?.product || res.data?.product;
    } catch (err) {
      console.error("Failed to fetch seller product:", err);
      return null;
    }
  },
  addProduct: async (data) => {
    try {
      const isFormData = data instanceof FormData;
      const res = await api.post('/seller/products', data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
      });
      return res.data;
    } catch (err) {
      console.error("Failed to add product:", err);
      throw err;
    }
  },
  updateProduct: async (id, data) => {
    try {
      const isFormData = data instanceof FormData;
      const res = await api.put(`/seller/products/${id}`, data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
      });
      return res.data;
    } catch (err) {
      console.error("Failed to update product:", err);
      throw err;
    }
  },
  deleteProduct: async (id) => {
    try {
      const res = await api.delete(`/seller/products/${id}`);
      return res.data?.success === true;
    } catch (err) {
      console.error("Failed to delete product:", err);
      return false;
    }
  },
  updateBarcodeStatus: async (productId, barcodeNumber, status) => {
    try {
      const res = await api.patch(`/seller/products/${productId}/barcodes/${barcodeNumber}`, { status });
      return res.data.success;
    } catch (err) {
      console.error("Failed to update barcode status:", err);
      return false;
    }
  },
  sellByBarcode: async (barcodeNumber, isOnline = false) => {
    try {
      if (isOnline) {
         return { success: false, message: 'Online sales handled by storefront' };
      }
      const res = await api.post('/seller/products/scan', { productCode: String(barcodeNumber || '').trim() });
      const payload = res.data || {};
      return {
        success: payload.success === true,
        message: payload.message || (payload.success ? 'Product sold successfully' : 'Failed to sell product'),
        data: payload.data || null
      };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Serial code not found or already sold' 
      };
    }
  },
  scanProduct: async (productCode) => {
    try {
      // Assuming endpoint POST /api/seller/products/scan exists or as requested
      const res = await api.post('/seller/products/scan', { productCode });
      return res.data?.data || res.data;
    } catch (err) {
      console.error("Failed to scan product:", err);
      return { 
        success: false, 
        message: err.response?.data?.message || "Product not found or system error" 
      };
    }
  }
};
