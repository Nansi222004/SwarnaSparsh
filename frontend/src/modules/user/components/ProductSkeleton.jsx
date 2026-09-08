import React from 'react';

const ProductSkeleton = () => {
    return (
        <div className="w-full h-full flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
            {/* Image Container Skeleton */}
            <div className="relative aspect-square md:aspect-[5/4] bg-gray-200"></div>

            <div className="p-3 text-left flex flex-col flex-1 pb-2 space-y-2 mt-2">
                {/* Price Skeleton */}
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                {/* Title Skeleton */}
                <div className="h-5 bg-gray-200 rounded w-full"></div>
                <div className="h-5 bg-gray-200 rounded w-2/3"></div>
            </div>

            {/* Button Skeleton */}
            <div className="h-10 md:h-12 bg-gray-200 w-full mt-auto"></div>
        </div>
    );
};

export default ProductSkeleton;
