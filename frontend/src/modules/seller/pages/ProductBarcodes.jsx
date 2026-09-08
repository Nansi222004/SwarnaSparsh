import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, Barcode as BarcodeIcon } from 'lucide-react';
import BarcodeList from '../components/BarcodeList';
import { sellerProductService } from '../services/sellerProductService';

const ProductBarcodes = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);

    useEffect(() => {
        const loadProduct = async () => {
            const found = await sellerProductService.getSellerProductById(id);
            setProduct(found);
        };
        loadProduct();
    }, [id]);

    if (!product) return <div className="p-8 text-center text-gray-500">Loading Product...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/seller/products')}
                    className="p-2 hover:bg-white rounded-xl border border-gray-100 shadow-sm transition-all"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">SERIAL MANIFEST</h1>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">UNIQUE IDENTIFIERS FOR {product.name}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                        <Box className="w-8 h-8 text-[#8D6E63]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">{product.name}</h2>
                        <div className="flex gap-4 mt-1">
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inventory: {product.quantity}</span>
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Material: {product.metalType || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end text-emerald-600">
                        <BarcodeIcon className="w-4 h-4" />
                        <span className="text-sm font-black uppercase tracking-[0.1em]">{product.barcodes?.length || 0} ALLOCATED</span>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Individual unit tracking via precision serials</p>
                </div>
            </div>

            {product.barcodes && product.barcodes.length > 0 ? (
                <BarcodeList barcodes={product.barcodes || []} />
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    No barcodes generated for this product yet.
                </div>
            )}
        </div>
    );
};

export default ProductBarcodes;
