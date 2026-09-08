import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import giftMother from '@assets/gift_mother_silver.png';
import giftFather from '@assets/gift_husband_silver.png';
import giftBrother from '@assets/gift_brother_silver.png';
import giftSister from '@assets/gift_sister_silver.png';
import giftHusband from '@assets/gift_husband_silver.png';
import giftWife from '@assets/gift_wife_silver.png';
import { buildFamilyShopPath, normalizeFamilyRecipient } from '../../utils/familyNavigation';
import { resolveLegacyCmsAsset } from '../../utils/legacyCmsAssets';

const relationSlots = [
    { id: 'all', title: 'ALL', image: giftMother, subtitle: 'Every loved one' },
    { id: 'mother', title: 'MOTHER', image: giftMother, subtitle: 'Graceful keepsakes' },
    { id: 'father', title: 'FATHER', image: giftFather, subtitle: 'Classic silver picks' },
    { id: 'brother', title: 'BROTHER', image: giftBrother, subtitle: 'Bold everyday styles' },
    { id: 'sister', title: 'SISTER', image: giftSister, subtitle: 'Delicate favourites' },
    { id: 'husband', title: 'HUSBAND', image: giftHusband, subtitle: 'Signature essentials' },
    { id: 'wife', title: 'WIFE', image: giftWife, subtitle: 'Elegant gifting edits' }
];

const resolveRelationKey = (item = {}) => {
    const candidates = [
        item.relationKey,
        item.recipient,
        item.bondKey,
        item.id,
        item.itemId
    ];
    for (const value of candidates) {
        const raw = String(value || '').trim().toLowerCase();
        const direct = normalizeFamilyRecipient(raw);
        if (direct !== 'all' || raw === 'all') {
            return direct;
        }
        const relationSuffix = raw.match(/(?:^|-)relation-(all|mother|father|brother|sister|husband|wife)$/)?.[1];
        if (relationSuffix) {
            return normalizeFamilyRecipient(relationSuffix);
        }
        const relationTail = raw.match(/(?:^|[^a-z])(all|mother|father|brother|sister|husband|wife)$/)?.[1];
        if (relationTail) {
            return normalizeFamilyRecipient(relationTail);
        }
        if (raw.includes('/family')) {
            return 'all';
        }
    }
    return '';
};

const FamilyRecipientCategories = ({ selectedRecipient = 'all', onSelectRecipient, sectionData }) => {
    const navigate = useNavigate();
    const settings = sectionData?.settings || {};
    const rawTitle = String(settings.title || 'SHOP BY RELATION').trim();
    const hasRelationWord = /relation/i.test(rawTitle);
    const titlePrefix = hasRelationWord ? (rawTitle.replace(/relation/ig, '').trim() || 'SHOP BY') : rawTitle;
    const titleHighlight = hasRelationWord ? 'RELATION' : '';
    const eyebrow = String(settings.eyebrow || 'Family Edit').trim() || 'Family Edit';
    const recipients = useMemo(() => {
        const sourceItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const byRelation = new Map();
        sourceItems.forEach((item) => {
            const relationKey = resolveRelationKey(item);
            if (relationKey && !byRelation.has(relationKey)) byRelation.set(relationKey, item);
        });

        return relationSlots.map((slot) => {
            const configured = byRelation.get(slot.id) || {};
            const resolvedTitle = String(configured.name || configured.label || slot.title).trim() || slot.title;
            const resolvedSubtitle = String(configured.subtitle || configured.description || slot.subtitle).trim() || slot.subtitle;
            return {
                id: slot.id,
                title: resolvedTitle,
                subtitle: resolvedSubtitle,
                image: resolveLegacyCmsAsset(configured.image, slot.image)
            };
        });
    }, [sectionData]);

    const handleClick = (recipientId) => {
        const normalizedRecipient = normalizeFamilyRecipient(recipientId);
        onSelectRecipient?.(normalizedRecipient);
        navigate(buildFamilyShopPath({ recipient: normalizedRecipient }));
    };

    return (
        <section className="py-6 md:py-8 px-4 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-6 space-y-2">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center"
                    >
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-[#C59B27] mb-2 bg-[#FAF8F5] border border-[#C59B27]/30 px-3 py-1 rounded-full">{eyebrow}</span>
                        <h2 className="text-2xl md:text-4xl font-serif text-[#141211] tracking-tight flex flex-col md:flex-row items-center gap-2">
                            {titlePrefix}
                            {titleHighlight && <span className="italic font-light text-[#C59B27]">{titleHighlight}</span>}
                        </h2>
                        <p className="max-w-xl text-[10px] md:text-xs text-stone-500 mt-2">
                            {settings.subtitle || 'Explore curated gifting jewellery designed for every bond.'}
                        </p>
                        <div className="w-10 h-[1px] bg-[#C59B27]/40 mt-4" />
                    </motion.div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 md:gap-5">
                    {recipients.map((recipient, index) => {
                        const isActive = selectedRecipient === recipient.id;

                        return (
                            <motion.button
                                key={recipient.id}
                                type="button"
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                viewport={{ once: true }}
                                onClick={() => handleClick(recipient.id)}
                                className={`group relative block aspect-square rounded-2xl overflow-hidden text-left transition-all duration-500 ${
                                    isActive
                                        ? 'ring-2 ring-[#C59B27] shadow-lg'
                                        : 'shadow-md hover:-translate-y-1 hover:shadow-xl'
                                }`}
                            >
                                <img
                                    src={recipient.image}
                                    alt={recipient.title}
                                    className="w-full h-full object-cover transition-transform duration-[1.8s] ease-out group-hover:scale-110"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                                <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                                    <span className="block text-white text-xs md:text-sm font-black tracking-[0.12em]">
                                        {recipient.title}
                                    </span>
                                    <span className="block mt-0.5 text-[9px] md:text-[10px] text-white/75 tracking-[0.08em] uppercase">
                                        {recipient.subtitle}
                                    </span>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FamilyRecipientCategories;

