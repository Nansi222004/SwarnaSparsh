import React from 'react';
import Barcode from 'react-barcode';

const BarcodeCard = ({ barcode }) => {
    const getStatusStyles = (status) => {
        switch (status) {
            case 'AVAILABLE':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'SOLD ONLINE':
                return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'SOLD OFFLINE':
                return 'bg-purple-50 text-purple-600 border-purple-100';
            default:
                return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center gap-4 shadow-sm hover:shadow-md transition-all">
            <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#EFEBE9] w-full flex justify-center">
                <Barcode 
                    value={barcode.number} 
                    width={1.5} 
                    height={50} 
                    fontSize={12}
                    background="#FDFBF7"
                />
            </div>
            
            <div className="w-full space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Code</span>
                    <span className="text-sm font-black text-[#3E2723] tracking-tighter">{barcode.number}</span>
                </div>
                
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${getStatusStyles(barcode.status)}`}>
                        {barcode.status}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default BarcodeCard;
