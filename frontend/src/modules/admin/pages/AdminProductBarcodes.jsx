import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, Barcode as BarcodeIcon, Printer, Search, CheckCircle, Tag, Loader2 } from 'lucide-react';
import Barcode from 'react-barcode';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const mapSerialStatus = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'SOLD_OFFLINE' || normalized === 'SOLD OFFLINE') return 'SOLD OFFLINE';
  if (normalized === 'SOLD_ONLINE' || normalized === 'SOLD ONLINE') return 'SOLD ONLINE';
  return 'AVAILABLE';
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'SOLD ONLINE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'SOLD OFFLINE':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const AdminProductBarcodes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [barcodes, setBarcodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`admin/products/${id}`);
        const prod = res.data?.data?.product || res.data?.product;
        if (prod) {
          setProduct(prod);
          const variants = Array.isArray(prod.variants) ? prod.variants : [];
          const serialCodes = variants.flatMap((v) =>
            (Array.isArray(v.serialCodes) ? v.serialCodes : []).map((codeObj) => ({
              ...codeObj,
              variantName: v.title || v.size || v.name || 'Standard',
            }))
          );

          const list = serialCodes
            .filter((c) => c && (c.code || c.number))
            .map((c) => ({
              number: String(c.code || c.number || '').trim(),
              status: mapSerialStatus(c.status),
              variantName: c.variantName,
            }))
            .filter((c) => Boolean(c.number));

          setBarcodes(list);
        }
      } catch (err) {
        toast.error('Failed to load product barcodes');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const filteredBarcodes = barcodes.filter((b) => {
    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const matchesSearch = !searchTerm || b.number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 className="w-8 h-8 text-[#8D6E63] animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#3E2723]">Loading Serial Manifest...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-red-100 text-center space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Product Not Found</h2>
        <button
          onClick={() => navigate('/admin/products')}
          className="px-5 py-2.5 rounded-xl bg-[#3E2723] text-white text-xs font-bold"
        >
          Back to Products
        </button>
      </div>
    );
  }

  const availableCount = barcodes.filter((b) => b.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Print-specific style */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #barcode-grid, #barcode-grid * { visibility: visible !important; }
          #barcode-grid {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            box-shadow: none !important;
            border: 0 !important;
          }
          .barcode-no-print { display: none !important; }
          .barcode-card-print {
            page-break-inside: avoid;
            margin-bottom: 12px;
          }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      {/* Header Bar */}
      <div className="barcode-no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/products')}
            className="p-2 hover:bg-white rounded-xl border border-gray-200 shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#8D6E63] uppercase tracking-widest">
              <BarcodeIcon className="w-4 h-4" /> Serial Unit Manifest
            </div>
            <h1 className="text-2xl font-black text-[#3E2723] uppercase tracking-tight">
              {product.name}
            </h1>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#3E2723] hover:bg-[#2e1d1a] text-white text-xs font-bold shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" /> Print Barcode Sheet
        </button>
      </div>

      {/* Product Overview Card */}
      <div className="barcode-no-print bg-white rounded-3xl border border-[#EFEBE9] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#FDFBF7] rounded-2xl flex items-center justify-center border border-[#EFEBE9] flex-shrink-0">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <Box className="w-8 h-8 text-[#8D6E63]" />
            )}
          </div>
          <div>
            <h2 className="text-base font-black text-[#3E2723] uppercase tracking-tight">{product.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
              <span>Code: <strong className="font-mono text-gray-800">{product.productCode || 'N/A'}</strong></span>
              <span>•</span>
              <span>Metal: <strong className="text-gray-800">{product.material || product.metalType || 'Gold/Silver'}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Serial Units</p>
            <p className="text-lg font-black text-gray-900">{barcodes.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available in Stock</p>
            <p className="text-lg font-black text-emerald-600">{availableCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="barcode-no-print bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search serial / barcode number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'AVAILABLE', 'SOLD ONLINE', 'SOLD OFFLINE'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-[#3E2723] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Barcode Grid */}
      <div id="barcode-grid">
        {filteredBarcodes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest shadow-sm">
            No serialized barcode units found matching criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredBarcodes.map((item, idx) => (
              <div
                key={idx}
                className="barcode-card-print bg-white rounded-2xl border border-gray-200 p-5 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all text-center"
              >
                <div className="bg-[#FDFBF7] p-3 rounded-xl border border-[#EFEBE9] w-full flex justify-center overflow-hidden">
                  <Barcode
                    value={item.number}
                    width={1.4}
                    height={45}
                    fontSize={11}
                    background="#FDFBF7"
                  />
                </div>

                <div className="w-full space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Serial Unit</span>
                    <span className="font-mono font-black text-[#3E2723]">{item.number}</span>
                  </div>

                  {item.variantName && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Variant</span>
                      <span className="font-semibold text-gray-700 truncate max-w-[120px]">{item.variantName}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductBarcodes;
