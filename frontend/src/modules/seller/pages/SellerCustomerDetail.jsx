import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, ShoppingBag, IndianRupee, TrendingUp, Calendar } from 'lucide-react';
import { sellerCustomerService } from '../services/sellerCustomerService';
import AdminTable from '../../admin/components/AdminTable';

const SellerCustomerDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let active = true;
        const loadCustomer = async () => {
            setLoading(true);
            const data = await sellerCustomerService.getCustomerDetailsPaged(id, { page, limit: 10 });
            if (!active) return;
            setCustomer(data.customer);
            setOrders(data.orders || []);
            setPagination(data.pagination || null);
            setLoading(false);
        };
        loadCustomer();
        return () => { active = false; };
    }, [id, page]);

    if (!customer && !loading) return <div className="p-20 text-center text-gray-400 font-black uppercase tracking-widest">Client Not Found</div>;
    if (!customer && loading) return <div className="p-20 text-center text-gray-400 font-black uppercase tracking-widest">Loading...</div>;

    const stats = [
        { label: 'Total Acquisitions', value: customer.totalOrders || 0, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Lifetime Value', value: `Rs. ${Number(customer.totalSpend || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Average Order', value: `Rs. ${Number(customer.averageOrder || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' }
    ];

    const columns = [
        {
            header: 'TRANSACTION ID',
            accessor: 'id',
            className: 'w-[15%] font-black text-gray-900'
        },
        {
            header: 'DATE',
            className: 'w-[15%]',
            render: (row) => <span className="text-[10px] font-bold text-gray-400">{new Date(row.date).toLocaleDateString()}</span>
        },
        {
            header: 'MANIFEST ITEMS',
            className: 'w-[40%]',
            render: (row) => <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tight line-clamp-1">{row.items}</span>
        },
        {
            header: 'VALUATION',
            className: 'w-[15%]',
            render: (row) => <span className="text-[10px] font-black text-gray-900 tracking-tighter">Rs. {Number(row.amount || 0).toLocaleString()}</span>
        },
        {
            header: 'STATUS',
            className: 'w-[15%]',
            render: (row) => (
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    row.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                    {row.status}
                </span>
            )
        }
    ];

    const labelClasses = "text-[9px] font-black text-gray-400 uppercase tracking-widest";
    const valueClasses = "text-sm font-bold text-gray-900 mt-1 uppercase leading-relaxed";

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/seller/customers')}
                    className="p-2.5 hover:bg-white rounded-xl border border-gray-100 shadow-sm transition-all"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Client Credentials</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Deep-dive into individual acquisition metrics</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-[2rem] border border-gray-100 p-6 flex items-center gap-6 shadow-sm">
                        <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                            <p className="text-xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm h-full">
                        <div className="flex flex-col items-center text-center pb-8 border-b border-gray-50 mb-8">
                            <div className="w-24 h-24 bg-[#3E2723]/5 rounded-[2rem] border border-[#3E2723]/10 flex items-center justify-center mb-4">
                                <span className="text-3xl font-black text-[#3E2723]">{customer.name?.charAt(0) || 'C'}</span>
                            </div>
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{customer.name || 'Customer'}</h2>
                            <span className="mt-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">
                                ACTIVE ACCOUNT
                            </span>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-50 rounded-lg"><User size={14} className="text-gray-400" /></div>
                                <div>
                                    <p className={labelClasses}>Customer Name</p>
                                    <p className={valueClasses}>{customer.name || 'Customer'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-full">
                        <div className="p-8 border-b border-gray-50">
                            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Calendar size={14} className="text-[#3E2723]" /> Historic Acquisitions
                            </h3>
                        </div>
                        <AdminTable
                            columns={columns}
                            data={orders}
                            emptyMessage={loading ? "Loading orders..." : "No orders found"}
                            pagination={pagination ? {
                                ...pagination,
                                onPageChange: (nextPage) => setPage(nextPage)
                            } : undefined}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerCustomerDetail;
