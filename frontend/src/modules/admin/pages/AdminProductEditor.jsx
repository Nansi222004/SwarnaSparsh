import React, { useMemo } from 'react';
import SharedProductEditor from '../../shared/components/SharedProductEditor';
import { adminService } from '../services/adminService';

const AdminProductEditor = () => {
    const productApi = useMemo(() => ({
        getProduct: adminService.getProductById,
        createProduct: async (formData) => {
            const res = await adminService.createProduct(formData);
            if (res?.success === false) {
                throw new Error(res?.message || 'Failed to create product');
            }
            return res?.data?.product || res?.product || res?.data?.data?.product;
        },
        updateProduct: async (id, formData) => {
            const res = await adminService.updateProduct(id, formData);
            if (res?.success === false) {
                throw new Error(res?.message || 'Failed to update product');
            }
            return res;
        }
    }), []);

    const metalPricingApi = useMemo(() => ({
        getMetalPricing: async () => {
            const [metalPricing, taxSettings] = await Promise.all([
                adminService.getMetalPricing(),
                adminService.getTaxSettings()
            ]);

            return {
                ...metalPricing,
                gstRate: taxSettings?.gstRate ?? 0
            };
        }
    }), []);

    return (
        <SharedProductEditor
            productApi={productApi}
            metalPricingApi={metalPricingApi}
            categoryApi={adminService.getCategories}
            editorMode="admin"
            backPath="/admin/products"
        />
    );
};

export default AdminProductEditor;
