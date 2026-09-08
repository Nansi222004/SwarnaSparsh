import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

const ProductDetailPage = () => {
    const { id } = useParams();
    return <Navigate to={id ? `/product/${id}` : '/shop'} replace />;
};

export default ProductDetailPage;
