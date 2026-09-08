/**
 * Utility functions and constants for Product Editor
 */

export const ENHANCEMENT_PROMPT = "Enhance this product image for eCommerce use. Improve lighting, sharpness, remove background noise, make it look professional, high resolution, clean white or premium background, realistic colors, suitable for online store listing.";

export const roundCurrency = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const IMAGE_PREVIEW_RE = /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i;

export const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link'],
        ['clean']
    ],
};

export const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'link'
];

export const normalizeSerialCodes = (codes) => {
    if (!Array.isArray(codes)) return [];
    return codes
        .map(code => {
            if (typeof code === 'string') return { code, status: 'AVAILABLE' };
            if (code && typeof code === 'object' && code.code) {
                return { code: String(code.code), status: code.status || 'AVAILABLE' };
            }
            return null;
        })
        .filter(Boolean);
};

export const getAvailableSerialCodes = (variant) =>
    (variant.serialCodes || []).filter(code => (code.status || 'AVAILABLE') === 'AVAILABLE');

export const normalizeString = (value = '') => String(value || '').trim().toLowerCase();

export const getTenGramRate = (formData, metalRates) => {
    const material = normalizeString(formData.material);
    if (material === 'gold') {
        const goldCategory = normalizeString(formData.goldCategory);
        const gold10g = metalRates.gold10g || {};
        const fallback = Number(metalRates.goldPerGram || 0) * 10;

        if (goldCategory === '14') return Number(gold10g.k14) || fallback;
        if (goldCategory === '18') return Number(gold10g.k18) || fallback;
        if (goldCategory === '22') return Number(gold10g.k22) || fallback;
        if (goldCategory === '24') return Number(gold10g.k24) || fallback;

        return Number(gold10g.k18) || Number(gold10g.k22) || Number(gold10g.k14) || Number(gold10g.k24) || fallback;
    }

    if (material === 'silver') {
        const silverCategory = normalizeString(formData.silverCategory);
        const silver10g = metalRates.silver10g || {};
        const fallback = Number(metalRates.silverPerGram || 0) * 10;
        const isSterling = silverCategory === '925 sterling silver';

        if (isSterling) return Number(silver10g.sterling925) || fallback;
        return Number(silver10g.silverOther) || fallback;
    }

    return 0;
};

export const getMetalRate = (variant, formData, metalRates) => {
    const unit = String(variant?.weightUnit || formData.weightUnit || 'Grams').toLowerCase();
    const perTenGram = Number(getTenGramRate(formData, metalRates)) || 0;
    const perGram = perTenGram / 10;
    const perMilligram = perGram / 1000;
    if (unit === 'milligrams' || unit === 'milligram') {
        return perMilligram;
    }
    return perGram;
};

export const getMetalPrice = (variant, formData, metalRates) => {
    const variantWeight = variant?.weight !== undefined && variant?.weight !== null && variant?.weight !== ""
        ? Number(variant.weight) || 0
        : Number(formData.weight) || 0;
    return roundCurrency(variantWeight * getMetalRate(variant, formData, metalRates));
};

export const getPaymentGatewayChargePercent = (formData) => (
    String(formData.paymentGatewayChargeBearer || 'seller').toLowerCase() === 'user' ? 2 : 0
);

export const getPricingForVariant = (variant, formData, metalRates, gstRate) => {
    const metalPrice = getMetalPrice(variant, formData, metalRates);
    const makingCharge = Number(variant.makingCharge) || 0;
    const diamondPrice = Number(variant.diamondPrice) || 0;
    const hallmarkingCharge = Number(variant.hallmarkingCharge) || 0;
    const diamondCertificateCharge = Number(variant.diamondCertificateCharge) || 0;
    const additionalCharge = Number(variant.additionalCharge) || 0;
    const hiddenCharge = roundCurrency(hallmarkingCharge + diamondCertificateCharge + additionalCharge);
    const subtotalBeforeTax = roundCurrency(metalPrice + makingCharge + diamondPrice + hiddenCharge);
    const gstValue = roundCurrency((subtotalBeforeTax * (Number(gstRate) || 0)) / 100);
    const priceAfterTax = roundCurrency(subtotalBeforeTax + gstValue);
    const pgChargePercent = getPaymentGatewayChargePercent(formData);
    const pgChargeAmount = roundCurrency((priceAfterTax * pgChargePercent) / 100);
    const finalPrice = roundCurrency(priceAfterTax + pgChargeAmount);
    return {
        metalPrice,
        makingCharge,
        diamondPrice,
        hallmarkingCharge,
        diamondCertificateCharge,
        additionalCharge,
        hiddenCharge,
        subtotalBeforeTax,
        gstValue,
        priceAfterTax,
        pgChargePercent,
        pgChargeAmount,
        finalPrice
    };
};

export const generateSerialCode = (existingSet, variantIndex, prefix) => {
    let attempt = 0;
    while (attempt < 50) {
        const suffix = `${String(variantIndex + 1).padStart(2, '0')}${Date.now().toString().slice(-4)}${String(Math.floor(Math.random() * 900)).padStart(3, '0')}`;
        const code = `${prefix}${suffix}`;
        if (!existingSet.has(code)) return code;
        attempt += 1;
    }
    return `${prefix}${Date.now().toString().slice(-10)}`;
};

export const syncVariantSerialQuantity = (variant, variantIndex, desiredCount, prefix) => {
    const normalized = normalizeSerialCodes(variant.serialCodes || []);
    const available = normalized.filter(code => (code.status || 'AVAILABLE') === 'AVAILABLE');
    const sold = normalized.filter(code => (code.status || 'AVAILABLE') !== 'AVAILABLE');
    const existingSet = new Set(normalized.map(code => code.code));

    let updatedAvailable = [...available];
    if (desiredCount > available.length) {
        const toAdd = desiredCount - available.length;
        for (let i = 0; i < toAdd; i += 1) {
            const code = generateSerialCode(existingSet, variantIndex, prefix);
            existingSet.add(code);
            updatedAvailable.push({ code, status: 'AVAILABLE' });
        }
    } else if (desiredCount < available.length) {
        updatedAvailable = available.slice(0, desiredCount);
    }

    return {
        ...variant,
        serialCodes: [...sold, ...updatedAvailable],
        stock: desiredCount
    };
};
