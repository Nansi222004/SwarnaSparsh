import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';

// Local assets — no broken Unsplash URLs
import edgeBanner from '@assets/men_edge_banner.png';
import classicsBanner from '@assets/men_classics_banner.png';
import boldBanner from '@assets/men_bold_look_banner.png';
import prodRing from '@assets/men_prod_ring.png';
import prodChain from '@assets/men_prod_chain.png';
import prodBracelet from '@assets/men_prod_bracelet.png';
import prodPendant from '@assets/men_prod_pendant.png';
import prodStud from '@assets/men_prod_stud.png';

const collections = [
    {
        id: 'edge',
        title: 'EDGE',
        subtitle: 'Sleek, silver, and made to turn heads',
        titleStyle: 'italic font-black text-5xl md:text-6xl tracking-tight',
        textColor: 'text-white',
        bgClass: 'bg-gradient-to-r from-[#071022] to-[#12213D]',
        image: edgeBanner,
        products: [
            { id: 'e1', img: prodRing,     name: 'Ring' },
            { id: 'e2', img: prodChain,    name: 'Chain' },
            { id: 'e3', img: prodBracelet, name: 'Band' },
        ],
    },
    {
        id: 'classics',
        title: 'THE CLASSICS',
        subtitle: 'Because classics never go out of style',
        titleStyle: 'font-serif text-3xl md:text-5xl font-medium tracking-wide',
        textColor: 'text-[#E5D3BD]',
        bgClass: 'bg-gradient-to-r from-[#1A1008] to-[#2C1A0E]',
        image: classicsBanner,
        products: [
            { id: 'c1', img: prodStud,    name: 'Studs' },
            { id: 'c2', img: prodPendant, name: 'Pendant' },
            { id: 'c3', img: prodChain,   name: 'Link' },
        ],
    },
    {
        id: 'bold',
        title: 'BOLD & RAW',
        subtitle: 'For the man who commands attention',
        titleStyle: 'font-sans font-black text-4xl md:text-6xl tracking-tighter uppercase',
        textColor: 'text-[#F0EBE3]',
        bgClass: 'bg-gradient-to-r from-[#1C0A0A] to-[#2D1515]',
        image: boldBanner,
        products: [
            { id: 'b1', img: prodBracelet, name: 'Cuff' },
            { id: 'b2', img: prodRing,     name: 'Statement Ring' },
            { id: 'b3', img: prodPendant,  name: 'Pendant' },
        ],
    },
];

const CARD_GAP = 40; // px gap between cards

const ShopTheLook = () => {
    const trackRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    const animFrameRef = useRef(null);
    const posRef = useRef(0);

    // Auto-scroll: smooth continuous right-to-left scroll, loops seamlessly
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        const speed = 0.6; // px per frame

        const step = () => {
            if (!isPaused && track) {
                posRef.current += speed;
                // Reset when scrolled past half (seamless loop with duplicated items)
                const halfWidth = track.scrollWidth / 2;
                if (posRef.current >= halfWidth) {
                    posRef.current = 0;
                }
                track.style.transform = `translateX(-${posRef.current}px)`;
            }
            animFrameRef.current = requestAnimationFrame(step);
        };

        animFrameRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [isPaused]);

    const scrollBy = (dir) => {
        const track = trackRef.current;
        if (!track) return;
        const cardWidth = track.children[0]?.offsetWidth || 800;
        posRef.current = Math.max(0, posRef.current + dir * (cardWidth + CARD_GAP));
        track.style.transform = `translateX(-${posRef.current}px)`;
    };

    // Duplicate collections for seamless loop
    const loopedCollections = [...collections, ...collections];

    return (
        <section className="py-4 md:py-16 bg-[#FDF7F4] overflow-hidden">
            <div className="max-w-[1500px] mx-auto px-4 md:px-8">

                {/* Header */}
                <div className="text-center mb-4 md:mb-10">
                    <h2 className="text-2xl md:text-4xl font-bold text-[#111] uppercase tracking-wide">
                        Explore Collections
                    </h2>
                    <p className="text-sm text-gray-400 mt-2 tracking-wide">Scroll to explore · Hover to pause</p>
                </div>

                {/* Scroll Controls */}
                <div className="flex justify-end gap-3 mb-6 pr-2">
                    <button
                        onClick={() => scrollBy(-1)}
                        className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                        onClick={() => scrollBy(1)}
                        className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors"
                        aria-label="Next"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                </div>

                {/* Auto-scroll Track */}
                <div
                    className="overflow-hidden"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                >
                    <div
                        ref={trackRef}
                        className="flex will-change-transform"
                        style={{ gap: `${CARD_GAP}px` }}
                    >
                        {loopedCollections.map((collection, index) => (
                            <div
                                key={`${collection.id}-${index}`}
                                className="flex-shrink-0 relative"
                                style={{ width: 'min(85vw, 820px)' }}
                            >
                                {/* ── Main Banner Card ── */}
                                <div
                                    className={`w-full h-[300px] md:h-[420px] rounded-3xl overflow-hidden relative shadow-xl ${collection.bgClass} flex`}
                                >
                                    {/* Photo */}
                                    <div
                                        className="absolute top-0 right-0 h-full w-[62%]"
                                        style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 35%)', maskImage: 'linear-gradient(to right, transparent 0%, black 35%)' }}
                                    >
                                        <img
                                            src={collection.image}
                                            alt={collection.title}
                                            className="w-full h-full object-cover object-center"
                                            loading="lazy"
                                        />
                                    </div>

                                    {/* Left gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent pointer-events-none" />

                                    {/* Text */}
                                    <div className="relative z-10 p-8 md:p-14 flex flex-col justify-center w-[65%]">
                                        <h3
                                            className={`${collection.titleStyle} ${collection.textColor} mb-3 leading-none`}
                                            style={{ fontFamily: collection.id === 'edge' ? "'Arial Black', sans-serif" : undefined }}
                                        >
                                            {collection.title}
                                        </h3>
                                        <p className="text-white/75 text-sm md:text-base font-sans mt-2 leading-relaxed">
                                            {collection.subtitle}
                                        </p>
                                        <Link
                                            to="/shop?category=men"
                                            className="mt-6 w-fit inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 border-b border-white/40 pb-0.5 hover:border-white hover:text-white transition-all"
                                        >
                                            Shop Now <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>

                                {/* ── Product Tiles below card ── */}
                                <div className="flex gap-3 md:gap-5 mt-4 justify-center px-4">
                                    {collection.products.map((prod) => (
                                        <Link
                                            to="/shop?category=men"
                                            key={prod.id}
                                            className="group flex-shrink-0 flex flex-col items-center gap-2"
                                        >
                                            <div className="w-[90px] h-[90px] md:w-[130px] md:h-[130px] bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl">
                                                <img
                                                    src={prod.img}
                                                    alt={prod.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <span className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-widest group-hover:text-gray-800 transition-colors">
                                                {prod.name}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default ShopTheLook;

