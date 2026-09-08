import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Eye, EyeOff, Box, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import AdminStatsCard from '../../components/AdminStatsCard';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const CategoryPage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await adminService.getCategories();
                setCategories(data);
            } catch (err) {
                toast.error("Failed to load categories");
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            const success = await adminService.deleteCategory(id);
            if (success) {
                setCategories(prev => prev.filter(cat => cat._id !== id));
                toast.success("Category deleted");
            } else {
                toast.error("Delete failed");
            }
        }
    };

    const toggleVisibility = async (id, field) => {
        // Optimistic Update
        const originalCategories = [...categories];
        setCategories(categories.map(cat =>
            cat._id === id ? { ...cat, [field]: !cat[field] } : cat
        ));

        const res = await adminService.updateCategory(id, { [field]: !categories.find(c => c._id === id)[field] });
        if (res.success) {
            toast.success("Updated visibility");
        } else {
            setCategories(originalCategories); // Rollback
            toast.error(res.message || "Update failed");
        }
    };

    const columns = [
        {
            header: 'Category',
            render: (item) => (
                    <div className="flex items-center gap-4 text-gray-700">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                            <img src={item.image || 'https://placehold.co/100'} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">{item.name}</p>
                            <p className="text-[10px] text-gray-400">{item.productCount || 0} Products</p>
                        </div>
                    </div>
                )
            },
        {
            header: 'In Collection',
            render: (item) => (
                <button
                    onClick={() => toggleVisibility(item._id, 'showInCollection')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${item.showInCollection !== false ? 'bg-[#8D6E63]/10 text-[#8D6E63]' : 'bg-gray-50 text-gray-400'}`}
                >
                    {item.showInCollection !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {item.showInCollection !== false ? 'Shown' : 'Hidden'}
                </button>
            )
        },
        {
            header: 'In Navbar',
            render: (item) => (
                <button
                    onClick={() => toggleVisibility(item._id, 'showInNavbar')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${item.showInNavbar !== false ? 'bg-[#8D6E63]/10 text-[#8D6E63]' : 'bg-gray-50 text-gray-400'}`}
                >
                    {item.showInNavbar !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {item.showInNavbar !== false ? 'Shown' : 'Hidden'}
                </button>
            )
        },
        {
            header: 'Status',
            render: (item) => (
                <button
                    onClick={() => toggleVisibility(item._id, 'isActive')}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${item.isActive !== false
                        ? 'bg-green-50 text-green-700 border border-green-100 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                        }`}
                >
                    {item.isActive !== false ? 'Active' : 'Inactive'}
                </button>
            )
        },
        {
            header: 'Actions',
            align: 'right',
            render: (item) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => navigate(`/admin/categories/edit/${item._id}`)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    const filters = [
        {
            options: [
                { label: 'All Status', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Hidden', value: 'hidden' }
            ],
            onChange: (val) => setStatusFilter(val)
        }
    ];

    const baseList = categories;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredData = baseList.filter(cat => {
        const matchesSearch = !normalizedSearch || cat.name?.toLowerCase().includes(normalizedSearch);
        const isActive = cat.isActive !== false;
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive);
        return matchesSearch && matchesStatus;
    });

    const stats = [
        {
            label: 'Total Categories',
            value: categories.length,
            icon: Box,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            label: 'Active Categories',
            value: categories.filter(c => c.isActive !== false).length,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            label: 'Hidden Categories',
            value: categories.filter(c => c.isActive === false).length,
            icon: EyeOff,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
        }
    ];

    if (loading) return <div className="p-20 text-center font-bold text-gray-400 animate-pulse tracking-widest uppercase">Initializing Category Vault...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="Category Management"
                subtitle="Manage shared categories across all collections."
                action={{
                    label: "Add New Category",
                    onClick: () => navigate(`/admin/categories/new`)
                }}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <AdminStatsCard
                        key={index}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        bgColor={stat.bgColor}
                    />
                ))}
            </div>

            <DataTable
                columns={columns}
                data={filteredData}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchPlaceholder="Search categories..."
                filters={filters}
            />
        </div>
    );
};

export default CategoryPage;
