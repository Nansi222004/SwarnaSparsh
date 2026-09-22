export const isUnrelatedProduct = (product = {}) => {
    const cat = String(product?.categorySlug || product?.category || '').toLowerCase();
    const name = String(product?.name || '').toLowerCase();
    const material = String(product?.material || '').toLowerCase();
    return (
        /^(hand-bags|clutches|potli-bag|sling-bag)$/.test(cat) ||
        /\b(bag|clutch|potli|sling)\b/i.test(cat) ||
        /\b(bag|clutch|potli|sling)\b/i.test(name) ||
        // Plated, alloy, antique finish imitation, and oxidised products are not genuine gold/silver/diamond
        material.includes('plated') ||
        material.includes('alloy') ||
        material.includes('antique finish') ||
        name.includes('oxydis') ||
        material.includes('oxydis') ||
        name.includes('oxidi') ||
        material.includes('oxidi')
    );
};

export const isDiamondProduct = (product = {}) => {
    if (isUnrelatedProduct(product)) return false;

    // 1. Explicit verified diamondType at product or variant level
    const dType = String(product?.diamondType || '').trim().toLowerCase();
    if (dType === 'lab_grown' || dType === 'natural') return true;

    const variants = Array.isArray(product?.variants) ? product.variants : [];
    const hasVariantDiamond = variants.some((v) => {
        const vType = String(v?.diamondType || '').trim().toLowerCase();
        const vPrice = Number(v?.diamondPrice || 0);
        const hasCarat = Boolean(v?.diamondSpecs?.carat);
        return (vType === 'lab_grown' || vType === 'natural') || (vPrice > 0 && hasCarat);
    });
    if (hasVariantDiamond) return true;

    // 2. Explicit verified "Diamond" material or metal (do NOT match "AD" alone)
    const material = String(product?.material || '').trim().toLowerCase();
    const metal = String(product?.metal || '').trim().toLowerCase();
    if (material === 'diamond' || metal === 'diamond') {
        return true;
    }

    // 3. Category explicitly classified as diamond
    const cat = String(product?.categorySlug || product?.category?.slug || product?.category?.name || product?.category || '').toLowerCase();
    if (cat === 'diamond' || cat === 'diamonds' || cat.startsWith('diamond-')) {
        return true;
    }

    return false;
};

export const isGoldProduct = (product = {}) => {
    if (isUnrelatedProduct(product) || isDiamondProduct(product)) return false;

    const material = String(product?.material || product?.metal || '').trim().toLowerCase();
    const goldCategory = String(product?.goldCategory || '').trim();
    const settingMetal = String(product?.settingMetal || '').trim().toLowerCase();

    // Must have genuine gold attributes and not be plated or alloy
    const hasGoldCategory = ['14', '18', '22', '24'].includes(goldCategory);
    const hasGoldSetting = ['gold', 'white gold', 'rose gold'].includes(settingMetal);
    const isGenuineGoldMaterial = [
        'gold',
        '14k gold',
        '18k gold',
        '22k gold',
        '24k gold',
        'solid gold',
        'yellow gold',
        'white gold',
        'rose gold'
    ].includes(material);

    return hasGoldCategory || hasGoldSetting || isGenuineGoldMaterial;
};

export const isSilverProduct = (product = {}) => {
    if (isUnrelatedProduct(product) || isDiamondProduct(product) || isGoldProduct(product)) return false;

    const material = String(product?.material || product?.metal || '').trim().toLowerCase();
    const silverCategory = String(product?.silverCategory || '').trim().toLowerCase();
    const settingMetal = String(product?.settingMetal || '').trim().toLowerCase();

    const hasSilverCategory = ['800', '835', '925', '925 sterling silver', '958', '970', '990', '999', 'fine', 'sterling'].includes(silverCategory);
    const hasSilverSetting = settingMetal === 'silver';
    const isGenuineSilverMaterial = ['silver', 'sterling silver', '925 silver', 'fine silver', '925 sterling silver'].includes(material);

    return hasSilverCategory || hasSilverSetting || isGenuineSilverMaterial;
};

export const is925SilverProduct = (product = {}) => {
    if (!isSilverProduct(product)) return false;
    const silverCategory = String(product?.silverCategory || '').trim().toLowerCase();
    const material = String(product?.material || product?.metal || '').trim().toLowerCase();
    const has925Category = ['925', '925 sterling silver', 'sterling'].includes(silverCategory) || silverCategory.startsWith('925');
    const has925Material = ['925 silver', 'sterling silver', '925 sterling silver'].includes(material);
    return has925Category || has925Material;
};

export const matchesGoldTone = (product = {}, tone = '') => {
    if (!isGoldProduct(product)) return false;

    const normalizedTone = String(tone || '').trim().toLowerCase();
    if (!normalizedTone) return true;

    const settingMetal = String(product?.settingMetal || '').trim().toLowerCase();
    const material = String(product?.material || '').trim().toLowerCase();

    if (normalizedTone === 'white-gold' || normalizedTone === 'white' || normalizedTone === 'white gold') {
        return settingMetal === 'white gold' || settingMetal === 'white-gold' || material === 'white gold' || material.includes('white gold');
    }

    if (normalizedTone === 'rose-gold' || normalizedTone === 'rose' || normalizedTone === 'rose gold') {
        return settingMetal === 'rose gold' || settingMetal === 'rose-gold' || material === 'rose gold' || material.includes('rose gold');
    }

    if (normalizedTone === 'gold' || normalizedTone === 'yellow-gold' || normalizedTone === 'yellow' || normalizedTone === 'yellow gold') {
        const isWhite = settingMetal === 'white gold' || settingMetal === 'white-gold' || material.includes('white gold');
        const isRose = settingMetal === 'rose gold' || settingMetal === 'rose-gold' || material.includes('rose gold');
        return !isWhite && !isRose;
    }

    return true;
};

export const getNormalizedProductMetal = (product = {}) => {
    if (isDiamondProduct(product)) return 'diamond';
    if (isGoldProduct(product)) return 'gold';
    if (isSilverProduct(product)) return 'silver';
    return 'other';
};

export const matchesRequestedMetal = (product = {}, requestedMetal = '') => {
    if (isUnrelatedProduct(product)) return false;

    const normalizedRequest = String(requestedMetal || '').trim().toLowerCase();
    if (!normalizedRequest || normalizedRequest === 'all') return true;

    if (normalizedRequest === 'diamond') return isDiamondProduct(product);
    if (normalizedRequest === 'gold') return isGoldProduct(product);
    if (normalizedRequest === 'silver') return isSilverProduct(product);

    return true;
};

export const isNaturalDiamondProduct = (product = {}) => {
    if (!isDiamondProduct(product)) return false;
    const dType = String(product?.diamondType || '').trim().toLowerCase();
    if (dType === 'natural') return true;
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    return variants.some((v) => String(v?.diamondType || '').trim().toLowerCase() === 'natural');
};

export const isLabGrownDiamondProduct = (product = {}) => {
    if (!isDiamondProduct(product)) return false;
    const dType = String(product?.diamondType || '').trim().toLowerCase();
    if (dType === 'lab_grown') return true;
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    return variants.some((v) => String(v?.diamondType || '').trim().toLowerCase() === 'lab_grown');
};

export const matchesDiamondType = (product = {}, type = '') => {
    const norm = String(type || '').trim().toLowerCase();
    if (!norm || norm === 'all') return isDiamondProduct(product);
    if (norm === 'natural') return isNaturalDiamondProduct(product);
    if (norm === 'lab_grown' || norm === 'lab-grown' || norm === 'labgrown') return isLabGrownDiamondProduct(product);
    return false;
};

export const filterProductVariantsByDiamondType = (product = {}, targetType = '') => {
    if (!product || !targetType) return product;
    const norm = String(targetType).trim().toLowerCase();
    if (norm !== 'natural' && norm !== 'lab_grown') return product;

    const variants = Array.isArray(product.variants) ? product.variants : [];
    const matchingVariants = variants.filter((v) => {
        const vType = String(v?.diamondType || '').trim().toLowerCase();
        if (vType === norm) return true;
        if (!vType || vType === 'none') {
            return String(product?.diamondType || '').trim().toLowerCase() === norm;
        }
        return false;
    });

    return {
        ...product,
        variants: matchingVariants
    };
};
