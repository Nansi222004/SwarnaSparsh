import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

const toProductPayload = (res) => {
  const payload = res?.data?.data || res?.data || {};
  const products = payload?.products;
  const pagination = payload?.pagination;
  return {
    products: Array.isArray(products) ? products : [],
    pagination: pagination || { total: 0, page: 1, limit: 20, pages: 1 },
  };
};

const stableParamString = (params) => {
  const entries = Object.entries(params || {})
    .filter(([, v]) => v !== undefined && v !== null && String(v) !== '')
    .map(([k, v]) => [k, String(v)]);
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const usePublicProductsQuery = (params, options = {}) => {
  const key = stableParamString(params);
  return useQuery({
    queryKey: ['public-products', key],
    enabled: options?.enabled !== false,
    queryFn: async () => api.get('public/products', { params }),
    select: toProductPayload,
    staleTime: 30 * 1000,
    retry: 1,
  });
};
