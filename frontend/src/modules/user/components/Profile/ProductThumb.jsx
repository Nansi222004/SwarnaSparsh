import React from 'react';
import { Package } from 'lucide-react';

export const resolveImageSrc = (...values) => values.find((value) => typeof value === 'string' && value.trim()) || null;

export const ProductThumb = ({ src, alt = '', className, fallbackClassName = '', fallbackIconClassName = 'w-4 h-4' }) => {
    const imageSrc = resolveImageSrc(src);

    if (!imageSrc) {
        return (
            <div className={`${className} ${fallbackClassName} bg-[#FAFAFA] text-[#8D6E63] flex items-center justify-center`}>
                <Package className={fallbackIconClassName} />
            </div>
        );
    }

    return <img src={imageSrc} alt={alt} className={className} />;
};
