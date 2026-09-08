import { useEffect } from 'react';

/**
 * Custom hook to reset scroll position to top on mount
 * Fixes bugs: "Page auto-scrolls to bottom after refresh", "After banner close redirects to middle", etc.
 */
export const useResetScroll = (deps = []) => {
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'instant'
        });
        // Also set body scroll if needed
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, deps);
};

/**
 * Custom hook to preserve scroll position when navigating
 */
export const usePreserveScroll = () => {
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem('scrollPos', window.scrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const savedPos = sessionStorage.getItem('scrollPos');
        if (savedPos) {
            window.scrollTo(0, parseInt(savedPos));
        }
    }, []);
};

export default useResetScroll;
