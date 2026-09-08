import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus,
    Ticket,
    Calendar,
    Users,
    Activity,
    Clock,
    Percent,
    Edit2,
    Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import Pagination from '../components/Pagination';
import DataTable from '../components/common/DataTable';
import AdminStatsCard from '../components/AdminStatsCard';
import toast from 'react-hot-toast';

const CouponListPage = () => {
    const navigate = useNavigate();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Refresh coupons on mount to get full admin list
        const fetchAll = async () => {
            setLoading(true);
            const data = await adminService.getCoupons();
            setCoupons(data || []);
            setLoading(false);
        };
        fetchAll();
    }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const filteredCoupons = useMemo(() => {
        return (coupons || [])
            .filter(c => {
                const searchStr = searchTerm.toLowerCase();
                const desc = String(c.description || c.desc || '').toLowerCase();
                const code = String(c.code || '').toLowerCase();
                const valueStr = String(c.value !== undefined ? c.value : (c.amount || '')).toLowerCase();
                const typeStr = String(c.type || '').toLowerCase();
                return (
                    code.includes(searchStr) ||
                    desc.includes(searchStr) ||
                    valueStr.includes(searchStr) ||
                    typeStr.includes(searchStr)
                );
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [coupons, searchTerm]);

    const paginatedCoupons = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredCoupons.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCoupons, currentPage]);

    const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            const success = await adminService.deleteCoupon(id);
            if (success) {
                setCoupons(prev => prev.filter(c => (c._id || c.id) !== id));
                toast.success("Coupon deleted");
            } else {
                toast.error("Failed to delete coupon");
            }
        }
    };

    const handleToggle = async (id) => {
        const res = await adminService.toggleCoupon(id);
        if (res.success) {
            setCoupons(prev => prev.map(c => 
                (c._id || c.id) === id ? { ...c, active: !c.active } : c
            ));
            toast.success(res.message || "Coupon updated");
        } else {
            toast.error(res?.message || "Failed to update coupon");
        }
    };

    const getCouponStatus = (coupon) => {
        if (!coupon.active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-400 border-gray-200' };
        
        const now = new Date();
        if (coupon.validUntil && new Date(coupon.validUntil) < now) return { label: 'Expired', color: 'bg-red-50 text-red-600 border-red-100' };
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return { label: 'Limit Reached', color: 'bg-amber-50 text-amber-600 border-amber-100' };
        return { label: 'Active', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    };

    const columns = [
        {
            key: 'code',
            header: 'Coupon Code',
            render: (coupon) => (
                <div className="flex items-center gap-4 normal-case">
                    <div className="w-10 h-10 bg-[#3E2723]/5 text-[#3E2723] rounded-full flex items-center justify-center border border-[#3E2723]/10 shrink-0">
                        <Ticket size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm tracking-wide uppercase">{coupon.code}</p>
                        <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate normal-case">{coupon.description || coupon.desc}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'discount',
            header: 'Discount Value',
            render: (coupon) => {
                const amount = coupon.value !== undefined ? coupon.value : (coupon.amount || 0);
                const minOrder = coupon.minOrderValue !== undefined ? coupon.minOrderValue : (coupon.minOrder || 0);
                return (
                    <div className="normal-case">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                            {coupon.type === 'percentage' ? (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-100">
                                    {amount}% OFF
                                </span>
                            ) : coupon.type === 'flat' ? (
                                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">
                                    ₹{amount} OFF
                                </span>
                            ) : (
                                <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs border border-purple-100">
                                    FREE SHIPPING
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Min Order: <span className="text-gray-900">₹{minOrder}</span></p>
                    </div>
                );
            }
        },
        {
            key: 'validity',
            header: 'Validity Period',
            render: (coupon) => (
                <div className="space-y-1 normal-case">
                    <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        Ends {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Starts {coupon.validFrom ? new Date(coupon.validFrom).toLocaleDateString() : 'N/A'}
                    </p>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (coupon) => {
                const status = getCouponStatus(coupon);
                return (
                    <button 
                        onClick={() => handleToggle(coupon._id || coupon.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm transition-all hover:scale-105 active:scale-95 ${status.color}`}
                    >
                        {status.label}
                    </button>
                );
            }
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (coupon) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => navigate(`/admin/coupons/edit/${coupon._id || coupon.id}`)}
                        className="p-2 text-gray-500 hover:text-[#3E2723] hover:bg-[#3E2723]/5 rounded-lg transition-all"
                        title="Edit Coupon"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(coupon._id || coupon.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Coupon"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 text-left pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Marketing</h1>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Manage discount codes</p>
                </div>
                <button
                    onClick={() => navigate('/admin/coupons/add')}
                    className="bg-[#3E2723] text-white px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#5D4037] transition-all shadow-lg shadow-[#3E2723]/20"
                >
                    <Plus size={16} strokeWidth={3} /> Create Coupon
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <AdminStatsCard
                    label="Total Coupons"
                    value={(coupons || []).length}
                    icon={Ticket}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <AdminStatsCard
                    label="Active Campaigns"
                    value={(coupons || []).filter(c => {
                        if (!c.active) return false;
                        if (c.validUntil && new Date(c.validUntil) < new Date()) return false;
                        if (c.usageLimit && c.usageCount >= c.usageLimit) return false;
                        return true;
                    }).length}
                    icon={Activity}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                />
                <AdminStatsCard
                    label="Expiring Soon"
                    value={(coupons || []).filter(c => {
                        if (!c.validUntil) return false;
                        const daysLeft = (new Date(c.validUntil) - new Date()) / (1000 * 60 * 60 * 24);
                        return daysLeft > 0 && daysLeft < 7;
                    }).length}
                    icon={Clock}
                    color="text-amber-600"
                    bgColor="bg-amber-50"
                />
            </div>

            <DataTable
                columns={columns}
                data={paginatedCoupons}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchPlaceholder="Search by code or description..."
            />

            {!loading && (
                <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                totalItems={filteredCoupons.length}
                itemsPerPage={itemsPerPage}
                />
            )}
        </div>
    );
};

export default CouponListPage;
