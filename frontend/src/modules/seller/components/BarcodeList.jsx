import React from 'react';
import BarcodeCard from './BarcodeCard';

const BarcodeList = ({ barcodes }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {barcodes.map((barcode, idx) => (
                <BarcodeCard key={idx} barcode={barcode} />
            ))}
        </div>
    );
};

export default BarcodeList;
