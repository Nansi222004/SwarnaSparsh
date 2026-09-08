import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { analytics } from '../services/analytics';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
    const { user, logout: authLogout } = useAuth();
    const isUserRole = user?.role === 'user';
    const hasAuthToken = () => Boolean(localStorage.getItem('sands_token'));

    const [wishlist, setWishlist] = useState(() => {
        const saved = localStorage.getItem('guestWishlist') || localStorage.getItem('wishlist');
        return saved ? JSON.parse(saved) : [];
    });

    // ── Sync on login ────────────────────────────────────────────────────────
    const syncGuestWishlist = useCallback(async () => {
        if (!isUserRole || !hasAuthToken()) return;
        const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
        if (guestWishlist.length > 0) {
            try {
                const guestIds = guestWishlist.map(item => item.id || item._id).filter(Boolean);
                await api.post('user/wishlist/sync', { guestItems: guestIds });
                localStorage.removeItem('guestWishlist');
            } catch (err) { console.error('Sync wishlist failed', err); }
        }
        fetchWishlist();
    }, [isUserRole]);

    // ── fetchWishlist ────────────────────────────────────────────────────────
    const fetchWishlist = useCallback(async () => {
        if (!isUserRole || !hasAuthToken()) return;
        try {
            const res = await api.get('user/wishlist');
            if (res.data.success) {
                const list = res.data.data?.wishlist || res.data.wishlist || res.data.products || [];
                const normalized = (list || []).map((item) => {
                    const variants = item.variants || [];
                    const firstVariant = variants[0] || {};
                    const rawCategory = Array.isArray(item.categories) ? item.categories[0] : null;
                    const categoryName = typeof rawCategory === 'string' ? rawCategory : (rawCategory?.name || item.category || '');
                    const categoryId = rawCategory?._id || rawCategory?.id || item.categoryId || '';
                    const categorySlug = rawCategory?.slug || item.categorySlug || '';
                    return {
                        ...item,
                        id: item._id || item.id,
                        price: item.price ?? item.finalPrice ?? firstVariant.price ?? firstVariant.finalPrice ?? 0,
                        originalPrice: item.originalPrice ?? item.mrp ?? firstVariant.mrp ?? firstVariant.price ?? 0,
                        image: item.image || item.images?.[0] || firstVariant.image || '',
                        images: item.images || (item.image ? [item.image] : []),
                        rating: item.rating || 0,
                        reviews: item.reviewCount || item.reviews || 0,
                        category: categoryName,
                        categoryId,
                        categorySlug,
                        metal: item.metal || item.material || '',
                        variants: variants.map(v => ({
                            ...v,
                            id: v._id || v.id,
                            image: v.image || item.image || item.images?.[0] || '',
                            price: Number(v.price ?? v.finalPrice) || 0,
                            mrp: Number(v.mrp ?? v.price ?? v.finalPrice) || 0
                        }))
                    };
                });
                setWishlist(normalized);
                // Persist locally for instant loads
                if (!user) localStorage.setItem('guestWishlist', JSON.stringify(normalized));
                else localStorage.setItem(`user_wishlist_${user.id || user._id}`, JSON.stringify(normalized));
            }
        } catch (err) {
            const status = err?.response?.status;
            if (status === 401 || status === 403) { authLogout({ silent: true }); return; }
            console.error('Fetch wishlist failed', err);
        }
    }, [isUserRole, user]);

    // ── addToWishlist ────────────────────────────────────────────────────────
    const addToWishlist = useCallback(async (product) => {
        analytics.track('wishlist_add', { productId: product._id || product.id, name: product.name });
        if (!user) {
            setWishlist(prev => {
                const exists = prev.some(item => (item.id || item._id) === (product.id || product._id));
                if (exists) return prev;
                return [...prev, product];
            });
            toast.success('Added to wishlist');
            return;
        }
        try {
            const res = await api.post('user/wishlist', { productId: product.id || product._id });
            if (res.data.success) {
                fetchWishlist();
                toast.success('Wishlist updated');
            }
        } catch (err) { toast.error('Failed to update wishlist'); }
    }, [user, fetchWishlist]);

    // ── removeFromWishlist ───────────────────────────────────────────────────
    const removeFromWishlist = useCallback(async (productId) => {
        if (!user) {
            setWishlist(prev => prev.filter(item => (item.id || item._id) !== productId));
            toast.success('Removed from wishlist');
            return;
        }
        try {
            const res = await api.delete(`user/wishlist/${productId}`);
            if (res.data.success) {
                fetchWishlist();
                toast.success('Removed from wishlist');
            }
        } catch (err) { toast.error('Failed to remove item'); }
    }, [user, fetchWishlist]);

    // ── toggleWishlist (convenient helper) ──────────────────────────────────
    const toggleWishlist = useCallback(async (product) => {
        const id = product.id || product._id;
        const isInWishlist = wishlist.some(item => (item.id || item._id) === id);
        if (isInWishlist) {
            await removeFromWishlist(id);
        } else {
            await addToWishlist(product);
        }
    }, [wishlist, addToWishlist, removeFromWishlist]);

    // ── clearOnDelete ────────────────────────────────────────────────────────
    const clearWishlistOnDelete = useCallback(() => {
        setWishlist([]);
        localStorage.removeItem('wishlist');
        localStorage.removeItem('guestWishlist');
    }, []);

    const value = {
        wishlist, setWishlist,
        addToWishlist, removeFromWishlist, toggleWishlist,
        fetchWishlist, syncGuestWishlist,
        clearWishlistOnDelete,
    };

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
    return ctx;
};

export default WishlistContext;
