import React, { useEffect, useMemo, useState } from 'react';
import { Search, FileText, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sellerDirectSaleService } from '../services/sellerDirectSaleService';
import { useNavigate } from 'react-router-dom';

const SellerDirectSales = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await sellerDirectSaleService.list({
        page,
        limit,
        ...(status !== 'all' ? { status } : {}),
        ...(searchTerm ? { search: searchTerm } : {})
      });
      setItems(res.directSales || []);
      setPagination(res.pagination || null);
    } catch (_e) {
      toast.error('Failed to load direct sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [status, searchTerm]);

  const rows = useMemo(() => (items || []).map((s) => ({
    id: s._id,
    createdAt: s.createdAt,
    serialCode: s.serialCode,
    productName: s.productName,
    variantName: s.variantName,
    amount: s.amount,
    paymentMethod: s.paymentMethod,
    status: s.status,
    customerName: s.customerName,
    customerPhone: s.customerPhone
  })), [items]);

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Direct Sales</h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Offline transactions history</p>
        </div>
        <button
          onClick={() => navigate('/seller/offline-sale')}
          className="px-5 py-2 bg-[#0f172a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-gray-200 transition-all flex items-center gap-2"
        >
          <FileText size={14} /> New Sale
        </button>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full ml-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
          <input
            type="text"
            placeholder="Search by serial, product, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-none text-xs font-bold text-gray-900 focus:ring-0 placeholder:text-gray-400"
          />
        </div>
        <div className="flex bg-gray-50 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'completed', label: 'Completed' },
            { key: 'voided', label: 'Voided' }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                status === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F8FAFC] border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Serial</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No direct sales found</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-gray-900 font-mono">{new Date(r.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] font-bold text-gray-400">{new Date(r.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-gray-900 font-mono">{r.serialCode}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{r.paymentMethod}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-gray-900 line-clamp-1">{r.productName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{r.variantName}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-black text-gray-900">₹{Number(r.amount || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                        r.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-gray-50 text-gray-600 border-gray-100'
                      }`}>
                        {r.status === 'completed' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/seller/direct-sales/${r.id}`)}
                        className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination?.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} sales)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages || loading}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDirectSales;

