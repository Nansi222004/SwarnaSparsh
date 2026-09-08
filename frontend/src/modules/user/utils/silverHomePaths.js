export const ensureSilverHomePath = (rawPath = '/shop') => {
    const path = String(rawPath || '/shop').trim();
    if (!path.startsWith('/')) return path;

    const [pathname, search = ''] = path.split('?');
    const params = new URLSearchParams(search);

    if (!params.get('metal')) {
        params.set('metal', 'silver');
    }

    const nextSearch = params.toString();
    return nextSearch ? `${pathname}?${nextSearch}` : pathname;
};
