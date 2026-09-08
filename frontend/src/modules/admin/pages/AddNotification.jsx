import React, { useState } from 'react';
import { Send, Bell } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { adminService } from '../services/adminService';
import toast from 'react-hot-toast';

const AddNotification = () => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'GENERAL',
        priority: 'Medium',
        link: ''
    });
    const [submitting, setSubmitting] = useState(false);
    
    // Link Builder State
    const [linkType, setLinkType] = useState('CUSTOM');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const handleSearchProducts = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await adminService.getProducts({ search: searchQuery, limit: 10 });
            setSearchResults(res.products || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to search products");
        } finally {
            setSearching(false);
        }
    };

    const handleSearchSellers = async () => {
        setSearching(true);
        try {
            const res = await adminService.getSellers({ search: searchQuery });
            setSearchResults(res || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to search sellers");
        } finally {
            setSearching(false);
        }
    };

    const handleSearchBlogs = async () => {
        setSearching(true);
        try {
            const res = await adminService.getAdminBlogs();
            const filtered = (res || []).filter(b => 
                b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                b.slug?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchResults(filtered);
        } catch (err) {
            console.error(err);
            toast.error("Failed to search blogs");
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const response = await adminService.broadcastAdminNotification({
            title: formData.title,
            message: formData.message,
            type: formData.type,
            priority: formData.priority,
            link: formData.link
        });
        setSubmitting(false);

        if (response?.success) {
            toast.success(response.message || 'Notification blast sent successfully!');
            setFormData({
                title: '',
                message: '',
                type: 'GENERAL',
                priority: 'Medium',
                link: ''
            });
            setLinkType('CUSTOM');
            setSearchQuery('');
            setSearchResults([]);
            return;
        }

        toast.error(response?.message || 'Failed to send notification');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8 font-sans">
            <div className="max-w-[700px] mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
                <PageHeader
                    title="Send Notification"
                    subtitle="Create and send alerts to your users"
                />

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-sm font-black text-black flex items-center gap-2 uppercase tracking-wide">
                            <Send className="w-4 h-4" />
                            Compose Message
                        </h3>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Title Field */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Flash Sale"
                                className="w-full p-3 bg-white border-2 border-gray-100 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:border-black transition-all placeholder:text-gray-300 placeholder:font-medium"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        {/* Message Field */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Message</label>
                            <textarea
                                placeholder="Type your message here..."
                                className="w-full p-3 bg-white border-2 border-gray-100 rounded-lg text-sm font-medium text-gray-900 h-24 resize-none focus:outline-none focus:border-black transition-all placeholder:text-gray-300 leading-relaxed"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                required
                            />
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Type</label>
                                <select
                                    className="w-full p-3 bg-white border-2 border-gray-100 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:border-black transition-all"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="GENERAL">General</option>
                                    <option value="ORDER">Order</option>
                                    <option value="RETURN">Return</option>
                                    <option value="REPLACEMENT">Replacement</option>
                                    <option value="COUPON">Coupon</option>
                                    <option value="SELLER_REQUEST">Seller Request</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Priority</label>
                                <select
                                    className="w-full p-3 bg-white border-2 border-gray-100 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:border-black transition-all"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        {/* Link Selector / Builder */}
                        <div className="space-y-3 bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Link Builder</label>
                                <span className="text-[10px] font-serif italic text-gray-400">Helper to generate correct URLs</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Link Type</label>
                                    <select
                                        className="w-full p-2.5 bg-white border-2 border-gray-100 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:border-black transition-all"
                                        value={linkType}
                                        onChange={(e) => {
                                            const type = e.target.value;
                                            setLinkType(type);
                                            setSearchQuery('');
                                            setSearchResults([]);
                                            if (type === 'CUSTOM') {
                                                setFormData(prev => ({ ...prev, link: '' }));
                                            } else if (type === 'GENERAL') {
                                                setFormData(prev => ({ ...prev, link: '/' }));
                                            } else if (type === 'CATEGORY') {
                                                setFormData(prev => ({ ...prev, link: '/gold-collection' }));
                                            }
                                        }}
                                    >
                                        <option value="CUSTOM">Custom Link (Type manually)</option>
                                        <option value="GENERAL">General Pages</option>
                                        <option value="CATEGORY">Category / Shop Filters</option>
                                        <option value="PRODUCT">Specific Product</option>
                                        <option value="SELLER">Specific Seller</option>
                                        <option value="BLOG">Specific Blog Post</option>
                                    </select>
                                </div>

                                {linkType === 'GENERAL' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Select Page</label>
                                        <select
                                            className="w-full p-2.5 bg-white border-2 border-gray-100 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:border-black transition-all"
                                            value={formData.link}
                                            onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                        >
                                            <option value="/">Home Page</option>
                                            <option value="/shop">Shop All Products</option>
                                            <option value="/cart">Shopping Cart</option>
                                            <option value="/help">Help Center</option>
                                            <option value="/gift-cards">Gift Cards</option>
                                            <option value="/blogs">Blogs list</option>
                                        </select>
                                    </div>
                                )}

                                {linkType === 'CATEGORY' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Select Category</label>
                                        <select
                                            className="w-full p-2.5 bg-white border-2 border-gray-100 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:border-black transition-all"
                                            value={formData.link}
                                            onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                        >
                                            <option value="/gold-collection">Gold Collection</option>
                                            <option value="/shop?metal=silver">Silver Collection</option>
                                            <option value="/category/men">Men's Collection</option>
                                            <option value="/category/women">Women's Collection</option>
                                            <option value="/category/family">Family Collection</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Search-based builders: Product, Seller, Blog */}
                            {(linkType === 'PRODUCT' || linkType === 'SELLER' || linkType === 'BLOG') && (
                                <div className="space-y-3 pt-2 border-t border-gray-200/50">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder={`Search ${linkType.toLowerCase()}s...`}
                                            className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:outline-none focus:border-black placeholder:text-gray-300"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (linkType === 'PRODUCT') handleSearchProducts();
                                                    if (linkType === 'SELLER') handleSearchSellers();
                                                    if (linkType === 'BLOG') handleSearchBlogs();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (linkType === 'PRODUCT') handleSearchProducts();
                                                if (linkType === 'SELLER') handleSearchSellers();
                                                if (linkType === 'BLOG') handleSearchBlogs();
                                            }}
                                            disabled={searching}
                                            className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                                        >
                                            {searching ? '...' : 'Search'}
                                        </button>
                                    </div>

                                    {searchResults.length > 0 ? (
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Select Results</label>
                                            <select
                                                className="w-full p-2.5 bg-white border-2 border-gray-100 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:border-black transition-all"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (!val) return;
                                                    if (linkType === 'PRODUCT') {
                                                        setFormData(prev => ({ ...prev, link: `/product/${val}` }));
                                                    } else if (linkType === 'SELLER') {
                                                        setFormData(prev => ({ ...prev, link: `/admin/seller-details/${val}` }));
                                                    } else if (linkType === 'BLOG') {
                                                        setFormData(prev => ({ ...prev, link: `/blogs/${val}` }));
                                                    }
                                                }}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>-- Choose one from search results --</option>
                                                {searchResults.map((item) => {
                                                    if (linkType === 'PRODUCT') {
                                                        return <option key={item._id} value={item._id}>{item.name} ({item.category?.name || 'Gold/Silver'})</option>;
                                                    } else if (linkType === 'SELLER') {
                                                        return <option key={item._id} value={item._id}>{item.businessName || item.name} - {item.phone}</option>;
                                                    } else if (linkType === 'BLOG') {
                                                        return <option key={item.slug} value={item.slug}>{item.title}</option>;
                                                    }
                                                    return null;
                                                })}
                                            </select>
                                        </div>
                                    ) : searchQuery && !searching && (
                                        <p className="text-[11px] text-gray-400 italic">No matches found. Try searching again.</p>
                                    )}
                                </div>
                            )}

                            {/* Current Generated/Link Input Field */}
                            <div className="space-y-1.5 pt-2 border-t border-gray-200/50">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-1">Selected URL / Path</label>
                                <input
                                    type="text"
                                    placeholder="/shop or /product/... (auto-generated or typed)"
                                    className="w-full p-3 bg-gray-100 border-2 border-gray-100 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:border-black transition-all"
                                    value={formData.link}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, link: e.target.value }));
                                        if (linkType !== 'CUSTOM') setLinkType('CUSTOM');
                                    }}
                                    readOnly={linkType !== 'CUSTOM'}
                                />
                                <p className="text-[10px] text-gray-400 px-1 leading-snug">
                                    {linkType === 'CUSTOM' 
                                        ? "Manual input mode: verify the route is valid (e.g. starts with `/`)." 
                                        : "Link Builder mode: path is locked. Switch type to custom if you need to edit it."
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Preview Box - Optional Visual Aid */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0">
                                <Bell className="w-4 h-4 text-white" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-900">
                                    {formData.title || "Notification Title"}
                                </p>
                                <p className="text-[11px] text-gray-500 leading-snug">
                                    {formData.message || "Message preview will appear here..."}
                                </p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full text-white py-3.5 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800 active:scale-[0.99]'}`}
                        >
                            <Send className="w-3.5 h-3.5" />
                            {submitting ? 'Sending...' : 'Send Notification'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddNotification;
