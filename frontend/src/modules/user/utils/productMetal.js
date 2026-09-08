export const getNormalizedProductMetal = (product = {}) => {
    const explicitMetal = String(product?.metal || product?.material || '').trim().toLowerCase();
    if (explicitMetal) return explicitMetal;
    if (product?.goldCategory) return 'gold';
    return 'silver';
};

export const matchesRequestedMetal = (product = {}, requestedMetal = '') => {
    const normalizedRequest = String(requestedMetal || '').trim().toLowerCase();
    if (!normalizedRequest) return true;

    const productMetal = getNormalizedProductMetal(product);

    if (normalizedRequest === 'silver') {
        return productMetal !== 'gold';
    }

    return productMetal === normalizedRequest;
};
