import React, { useState, useEffect, useRef } from 'react';

const LazySection = ({ children, minHeight = '200px' }) => {
    const [inView, setInView] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '500px', // Pre-load elements 500px before they scroll into view
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div ref={ref} style={{ minHeight: inView ? 'auto' : minHeight }}>
            {inView ? children : null}
        </div>
    );
};

export default LazySection;
