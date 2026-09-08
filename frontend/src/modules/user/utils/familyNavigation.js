const FAMILY_RECIPIENTS = new Set(['all', 'mother', 'father', 'brother', 'sister', 'husband', 'wife']);
const FAMILY_COLLECTIONS = new Set([
    'under-2999',
    'premium-gifts',
    'under-4999',
    'classics',
    'astra',
    'signature',
    'boho',
    'bridal',
    'gifts',
    'mother-picks',
    'father-picks',
    'brother-picks',
    'sister-picks',
    'spouse-picks',
    'daughter-picks',
    'baby-picks',
    'grandmother-picks',
    'grandfather-picks',
    'couple-picks',
    'matching-sets',
    'heirloom-pieces',
    'mom-and-me',
    'generations',
    'everyday-wear',
    'festive-joy',
    'minimalist-luxe',
    'statement-picks',
    'traditional',
    'modern-staples'
]);

export const normalizeFamilyRecipient = (value) => {
    const recipient = String(value || '').trim().toLowerCase();
    return FAMILY_RECIPIENTS.has(recipient) ? recipient : 'all';
};

export const getFamilyRecipientFromSearch = (search = '') => {
    const params = new URLSearchParams(search);
    return normalizeFamilyRecipient(params.get('recipient'));
};

export const buildFamilyShopPath = (options = {}) => {
    const normalizedRecipient = normalizeFamilyRecipient(options.recipient);
    return normalizedRecipient === 'all'
        ? '/category/family'
        : `/category/family/${normalizedRecipient}`;
};

export const normalizeFamilyCollection = (value) => {
    const collection = String(value || '').trim().toLowerCase();
    return FAMILY_COLLECTIONS.has(collection) ? collection : 'under-2999';
};

export const buildFamilyCollectionPath = (collectionId = 'under-2999') => {
    return `/category/family/collection/${normalizeFamilyCollection(collectionId)}`;
};
