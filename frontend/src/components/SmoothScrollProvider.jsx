import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { destroyLenis, initLenis } from '../lib/lenis';

const SmoothScrollProvider = () => {
    const location = useLocation();

    // Disable Lenis on admin/seller routes — those layouts use h-screen overflow-hidden
    // and Lenis's `html { height: auto }` CSS rule would break the fixed header/sidebar.
    const isAppShell = location.pathname.startsWith('/admin') || location.pathname.startsWith('/seller');

    useEffect(() => {
        // Always clean up Lenis classes when entering admin/seller routes
        if (isAppShell) {
            destroyLenis();
            document.documentElement.classList.remove('lenis');
            document.documentElement.classList.remove('lenis-smooth');
            // Restore normal scroll behaviour for the window
            document.documentElement.style.removeProperty('height');
            document.body.style.removeProperty('height');
            return undefined;
        }

        // Disable on mobile — native scroll is faster and Lenis adds CPU overhead
        const isMobile = window.innerWidth < 768;
        if (isMobile) return undefined;

        if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
            return undefined;
        }

        const lenis = initLenis();

        if (!lenis) return undefined;

        document.documentElement.classList.add('lenis');
        document.documentElement.classList.add('lenis-smooth');

        return () => {
            destroyLenis();
            document.documentElement.classList.remove('lenis');
            document.documentElement.classList.remove('lenis-smooth');
        };
    }, [isAppShell]);

    return null;
};

export default SmoothScrollProvider;
