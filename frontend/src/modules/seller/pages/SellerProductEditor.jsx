import React, { useMemo } from 'react';
import SharedProductEditor from '../../shared/components/SharedProductEditor';
import { sellerProductService } from '../services/sellerProductService';
import { sellerService } from '../services/sellerService';
import api from '../../../services/api';

const SellerProductEditor = () => {
    const productApi = useMemo(() => ({
        getProduct: sellerProductService.getSellerProductRaw,
        createProduct: async (formData) => {
            const res = await sellerProductService.addProduct(formData);
            if (res?.success === false) {
                throw new Error(res?.message || 'Failed to create product');
            }
            return res?.data?.product || res?.product || res;
        },
        updateProduct: async (id, formData) => {
            const res = await sellerProductService.updateProduct(id, formData);
            if (res?.success === false) {
                throw new Error(res?.message || 'Failed to update product');
            }
            return res;
        }
    }), []);

    const metalPricingApi = useMemo(() => ({
        getMetalPricing: sellerService.getMetalPricing
    }), []);

    const categoryApi = useMemo(() => async () => {
        const res = await api.get('public/categories', { params: { scope: 'all' } });
        const categories = res.data?.data?.categories || res.data?.categories || [];
        return [...categories]
            .filter((category) => category?.isActive !== false)
            .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0)
                || String(a?.name || '').localeCompare(String(b?.name || '')));
    }, []);

    return (
        <SharedProductEditor
            productApi={productApi}
            metalPricingApi={metalPricingApi}
            categoryApi={categoryApi}
            editorMode="seller"
            backPath="/seller/products"
        />
    );
};

export default SellerProductEditor;
