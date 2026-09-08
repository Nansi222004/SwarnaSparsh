import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, TrendingUp, CalendarDays } from 'lucide-react';
import AdminTable from '../../admin/components/AdminTable';
import AdminStatsCard from '../../admin/components/AdminStatsCard';
import { sellerAnalyticsService } from '../services/sellerAnalyticsService';
import toast from 'react-hot-toast';

const SellerAnalytics = () => {
  const [activeTab, setActiveTab] = useState('trend');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [trend, setTrend] = useState([]);
  const [performance, setPerformance] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [trendRes, perfRes] = await Promise.all([
          sellerAnalyticsService.getSalesTrend({ days }),
          sellerAnalyticsService.getProductPerformance()
        ]);
        if (!active) return;
        setTrend(trendRes || []);
        setPerformance(perfRes || []);
      } catch (_e) {
        toast.error('Failed to load analytics');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [days]);

  const trendTotals = useMemo(() => {
    const totalRevenue = (trend || []).reduce((sum, d) => sum + (Number(d.revenue) || 0), 0);
    const totalSold = (trend || []).reduce((sum, d) => sum + (Number(d.salesCount) || 0), 0);
    return {
      totalRevenue,
      totalSold,
      avgPerDay: trend.length ? Math.round(totalRevenue / trend.length) : 0
    };
  }, [trend]);

  const perfTotals = useMemo(() => {
    const top = performance?.[0] || null;
    return {
      totalRevenue: (performance || []).reduce((sum, p) => sum + (Number(p.totalRevenue) || 0), 0),
      totalSold: (performance || []).reduce((sum, p) => sum + (Number(p.totalSold) || 0), 0),
      topProduct: top?.name || '-'
    };
  }, [performance]);

  const trendColumns = [
    {
      header: 'DATE',
      className: 'w-[25%]',
      render: (row) => (
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
          {row._id ? new Date(row._id).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      header: 'REVENUE',
      className: 'w-[35%]',
      render: (row) => (
        <span className="text-[11px] font-black text-gray-900">₹{Number(row.revenue || 0).toLocaleString()}</span>
      )
    },
    {
      header: 'UNITS SOLD',
      className: 'w-[20%]',
      render: (row) => (
        <span className="text-[11px] font-black text-gray-900">{Number(row.salesCount || 0).toLocaleString()}</span>
      )
    }
  ];

  const perfColumns = [
    {
      header: 'PRODUCT',
      className: 'w-[55%]',
      render: (row) => (
        <span className="text-[11px] font-black text-gray-900 uppercase line-clamp-1">{row.name || 'Product'}</span>
      )
    },
    {
      header: 'UNITS SOLD',
      className: 'w-[20%]',
      render: (row) => (
        <span className="text-[11px] font-black text-gray-900">{Number(row.totalSold || 0).toLocaleString()}</span>
      )
    },
    {
      header: 'REVENUE',
      className: 'w-[25%] text-right',
      render: (row) => (
        <span className="text-[11px] font-black text-gray-900">₹{Number(row.totalRevenue || 0).toLocaleString()}</span>
      )
    }
  ];

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Analytics</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Seller-scoped sales intelligence</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex bg-gray-50 p-1 rounded-xl overflow-x-auto">
            {[
              { key: 'trend', label: 'Sales Trend' },
              { key: 'performance', label: 'Product Performance' }
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {activeTab === 'trend' && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <CalendarDays size={14} className="text-gray-400" />
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="text-[10px] font-black uppercase tracking-widest text-gray-700 bg-transparent outline-none"
              >
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'trend' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdminStatsCard label="Revenue" value={`₹${trendTotals.totalRevenue.toLocaleString()}`} icon={BarChart3} color="text-emerald-600" bgColor="bg-emerald-50" />
            <AdminStatsCard label="Units Sold" value={trendTotals.totalSold.toLocaleString()} icon={TrendingUp} color="text-blue-600" bgColor="bg-blue-50" />
            <AdminStatsCard label="Avg / Day" value={`₹${trendTotals.avgPerDay.toLocaleString()}`} icon={CalendarDays} color="text-amber-600" bgColor="bg-amber-50" />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[420px]">
            <AdminTable
              columns={trendColumns}
              data={trend}
              emptyMessage={loading ? 'Loading...' : 'No trend data'}
              minWidth="600px"
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdminStatsCard label="Revenue" value={`₹${perfTotals.totalRevenue.toLocaleString()}`} icon={BarChart3} color="text-emerald-600" bgColor="bg-emerald-50" />
            <AdminStatsCard label="Units Sold" value={perfTotals.totalSold.toLocaleString()} icon={TrendingUp} color="text-blue-600" bgColor="bg-blue-50" />
            <AdminStatsCard label="Top Product" value={perfTotals.topProduct} icon={TrendingUp} color="text-purple-600" bgColor="bg-purple-50" />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[420px]">
            <AdminTable
              columns={perfColumns}
              data={performance}
              emptyMessage={loading ? 'Loading...' : 'No performance data'}
              minWidth="600px"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SellerAnalytics;

