import Lenis from '@studio-freight/lenis';

let lenisInstance = null;
let rafId = null;

const startRafLoop = () => {
    const raf = (time) => {
        if (!lenisInstance) return;
        lenisInstance.raf(time);
        rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);
};

export const initLenis = () => {
    if (typeof window === 'undefined' || lenisInstance) {
        return lenisInstance;
    }

    lenisInstance = new Lenis({
        duration: 1.1,
        lerp: 0.09,
        smoothWheel: true,
        smoothTouch: false,
        wheelMultiplier: 1,
        touchMultiplier: 1,
    });

    startRafLoop();

    return lenisInstance;
};

export const getLenis = () => lenisInstance;

export const scrollToTop = () => {
    if (lenisInstance) {
        lenisInstance.scrollTo(0, { immediate: true });
        return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
};

export const destroyLenis = () => {
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }

    if (lenisInstance) {
        lenisInstance.destroy();
        lenisInstance = null;
    }
};
