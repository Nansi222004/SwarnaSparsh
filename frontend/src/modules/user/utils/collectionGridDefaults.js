import goldRingsGreen from '@assets/categories/gold_rings_green.png';
import goldEarringsGreen from '@assets/categories/gold_earrings_green.png';
import goldPendantsGreen from '@assets/categories/gold_pendants_green.png';
import goldBraceletsGreen from '@assets/categories/gold_bracelets_green.png';
import goldBanglesGreen from '@assets/categories/gold_bangles_green.png';
import goldMangalsutraGreen from '@assets/categories/gold_mangalsutra_green.png';
import goldSetsGreen from '@assets/categories/gold_sets_green.png';
import goldNewArrivalsGreen from '@assets/categories/gold_new_arrivals_green.png';

import ringsImg from '@assets/categories/rings.png';
import earringsImg from '@assets/categories/earrings.png';
import silverchainsImg from '@assets/categories/silverchains.png';
import ankletsImg from '@assets/categories/anklets.png';
import braceletsImg from '@assets/categories/bracelets.png';
import pendantsImg from '@assets/categories/pendants.png';
import bangleImg from '@assets/categories/bangle.png';
import mensilverImg from '@assets/categories/mensilver.png';

import diamondRingImg from '@assets/diamond_ring.png';
import catWeddingDiamondImg from '@assets/cat_wedding_diamond.png';
import eternalDiamondBrillianceImg from '@assets/hero/eternal_diamond_brilliance.png';
import diamondEleganceCampaignImg from '@assets/hero/diamond_elegance_campaign.png';
import diamondLuxuryImg from '@assets/hero/diamond_luxury.png';

export const goldCollectionGridDefaults = [
    {
        id: 'gold-rings',
        name: 'Gold Rings',
        label: 'Gold Rings',
        image: goldRingsGreen,
        path: '/shop?metal=gold&category=finger-ring',
        badge: 'Signature'
    },
    {
        id: 'gold-earrings',
        name: 'Gold Earrings',
        label: 'Gold Earrings',
        image: goldEarringsGreen,
        path: '/shop?metal=gold&category=earrings'
    },
    {
        id: 'gold-necklaces',
        name: 'Gold Necklaces',
        label: 'Gold Necklaces',
        image: goldSetsGreen,
        path: '/shop?metal=gold&category=necklace'
    },
    {
        id: 'gold-bangles',
        name: 'Gold Bangles',
        label: 'Gold Bangles',
        image: goldBanglesGreen,
        path: '/shop?metal=gold&category=bangles'
    },
    {
        id: 'gold-bracelets',
        name: 'Gold Bracelets',
        label: 'Gold Bracelets',
        image: goldBraceletsGreen,
        path: '/shop?metal=gold&category=bracelet'
    },
    {
        id: 'gold-pendants',
        name: 'Gold Pendants',
        label: 'Gold Pendants',
        image: goldPendantsGreen,
        path: '/shop?metal=gold&category=chain-pendent'
    },
    {
        id: 'gold-mangalsutra',
        name: 'Gold Mangalsutra',
        label: 'Gold Mangalsutra',
        image: goldMangalsutraGreen,
        path: '/shop?metal=gold&category=mangalsutra'
    },
    {
        id: 'gold-new-arrivals',
        name: 'Gold New Arrivals',
        label: 'Gold New Arrivals',
        image: goldNewArrivalsGreen,
        path: '/shop?metal=gold&sort=latest',
        badge: 'Fresh Drops'
    }
];

export const silverCollectionGridDefaults = [
    {
        id: 'silver-rings',
        name: 'Silver Rings',
        label: 'Silver Rings',
        image: ringsImg,
        path: '/shop?metal=silver&category=finger-ring',
        badge: 'Sterling 925'
    },
    {
        id: 'silver-earrings',
        name: 'Silver Earrings',
        label: 'Silver Earrings',
        image: earringsImg,
        path: '/shop?metal=silver&category=earrings'
    },
    {
        id: 'silver-chains',
        name: 'Silver Chains',
        label: 'Silver Chains',
        image: silverchainsImg,
        path: '/shop?metal=silver&category=mens-chain'
    },
    {
        id: 'silver-anklets',
        name: 'Silver Anklets',
        label: 'Silver Anklets',
        image: ankletsImg,
        path: '/shop?metal=silver&category=anklets'
    },
    {
        id: 'silver-bracelets',
        name: 'Silver Bracelets',
        label: 'Silver Bracelets',
        image: braceletsImg,
        path: '/shop?metal=silver&category=bracelet'
    },
    {
        id: 'silver-pendants',
        name: 'Silver Pendants',
        label: 'Silver Pendants',
        image: pendantsImg,
        path: '/shop?metal=silver&category=chain-pendent'
    },
    {
        id: 'silver-bangles',
        name: 'Silver Bangles',
        label: 'Silver Bangles',
        image: bangleImg,
        path: '/shop?metal=silver&category=bangles'
    },
    {
        id: 'men-in-silver',
        name: 'Men in Silver',
        label: 'Men in Silver',
        image: mensilverImg,
        path: '/shop?metal=silver&category=mens-jewellery',
        badge: 'Refined'
    }
];

export const diamondCollectionGridDefaults = [
    {
        id: 'diamond-rings',
        name: 'Diamond Rings',
        label: 'Diamond Rings',
        image: diamondRingImg,
        path: '/shop?metal=diamond&category=finger-ring',
        badge: 'Solitaires'
    },
    {
        id: 'diamond-earrings',
        name: 'Diamond Earrings',
        label: 'Diamond Earrings',
        image: catWeddingDiamondImg,
        path: '/shop?metal=diamond&category=earrings'
    },
    {
        id: 'diamond-necklaces',
        name: 'Diamond Necklaces',
        label: 'Diamond Necklaces',
        image: eternalDiamondBrillianceImg,
        path: '/shop?metal=diamond&category=necklace'
    },
    {
        id: 'diamond-pendants',
        name: 'Diamond Pendants',
        label: 'Diamond Pendants',
        image: diamondEleganceCampaignImg,
        path: '/shop?metal=diamond&category=chain-pendent'
    },
    {
        id: 'diamond-bracelets',
        name: 'Diamond Bracelets',
        label: 'Diamond Bracelets',
        image: diamondLuxuryImg,
        path: '/shop?metal=diamond&category=bracelet'
    }
];
