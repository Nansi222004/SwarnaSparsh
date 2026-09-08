export const buildMenShopPath = (options = {}) => {
    const {
        category,
        filter = 'men',
        search,
        sort,
        priceMax,
        metal,
        silverType
    } = options;

    const params = new URLSearchParams();
    params.set('source', 'men');

    if (filter) params.set('filter', filter);
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    if (priceMax) params.set('price_max', String(priceMax));
    if (metal) params.set('metal', metal);
    if (silverType) params.set('silver_type', silverType);

    return `/shop?${params.toString()}`;
};

export const getMenLoginRedirect = () => {
    const redirectPath = `${window.location.pathname}${window.location.search}`;
    return `/login?redirect=${encodeURIComponent(redirectPath)}`;
};

export const storeMenPendingCartItem = (product) => {
    if (!product) return;
    window.localStorage.setItem('men_pending_cart_item', JSON.stringify(product));
};

export const readMenPendingCartItem = () => {
    try {
        const raw = window.localStorage.getItem('men_pending_cart_item');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const clearMenPendingCartItem = () => {
    window.localStorage.removeItem('men_pending_cart_item');
};
