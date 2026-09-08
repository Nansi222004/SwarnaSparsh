export const buildWomenShopPath = (options = {}) => {
    const {
        category,
        filter,
        gifts,
        search,
        sort,
        priceMax,
        metal,
        silverType,
        occasion,
        products,
        limit
    } = options;

    const params = new URLSearchParams();
    params.set('source', 'women');

    if (filter) params.set('filter', filter);
    if (gifts) params.set('gifts', gifts);
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    if (priceMax) params.set('price_max', String(priceMax));
    if (metal) params.set('metal', metal);
    if (silverType) params.set('silver_type', silverType);
    if (occasion) params.set('occasion', occasion);
    if (products) params.set('products', products);
    if (limit) params.set('limit', String(limit));

    return `/shop?${params.toString()}`;
};

export const getWomenLoginRedirect = () => {
    const redirectPath = `${window.location.pathname}${window.location.search}`;
    return `/login?redirect=${encodeURIComponent(redirectPath)}`;
};

export const storeWomenPendingCartItem = (product) => {
    if (!product) return;
    window.localStorage.setItem('women_pending_cart_item', JSON.stringify(product));
};

export const readWomenPendingCartItem = () => {
    try {
        const raw = window.localStorage.getItem('women_pending_cart_item');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const clearWomenPendingCartItem = () => {
    window.localStorage.removeItem('women_pending_cart_item');
};
