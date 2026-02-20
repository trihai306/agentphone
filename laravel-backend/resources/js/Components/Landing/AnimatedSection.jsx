import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * AnimatedSection — Scroll-triggered animation wrapper
 * Uses Intersection Observer for performant scroll animations
 */
export default function AnimatedSection({
    children,
    className = '',
    animation = 'fadeUp', // fadeUp | fadeIn | fadeLeft | fadeRight | scaleUp | slideUp
    delay = 0,
    duration = 700,
    threshold = 0.15,
    once = true,
}) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (once) observer.unobserve(element);
                } else if (!once) {
                    setIsVisible(false);
                }
            },
            { threshold, rootMargin: '0px 0px -50px 0px' }
        );

        observer.observe(element);
        return () => observer.unobserve(element);
    }, [threshold, once]);

    const baseStyle = {
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}ms`,
    };

    const animations = {
        fadeUp: {
            hidden: { opacity: 0, transform: 'translateY(40px)' },
            visible: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
            hidden: { opacity: 0, transform: 'scale(0.98)' },
            visible: { opacity: 1, transform: 'scale(1)' },
        },
        fadeLeft: {
            hidden: { opacity: 0, transform: 'translateX(-40px)' },
            visible: { opacity: 1, transform: 'translateX(0)' },
        },
        fadeRight: {
            hidden: { opacity: 0, transform: 'translateX(40px)' },
            visible: { opacity: 1, transform: 'translateX(0)' },
        },
        scaleUp: {
            hidden: { opacity: 0, transform: 'scale(0.9)' },
            visible: { opacity: 1, transform: 'scale(1)' },
        },
        slideUp: {
            hidden: { opacity: 0, transform: 'translateY(60px)' },
            visible: { opacity: 1, transform: 'translateY(0)' },
        },
    };

    const anim = animations[animation] || animations.fadeUp;
    const currentState = isVisible ? anim.visible : anim.hidden;

    return (
        <div
            ref={ref}
            className={className}
            style={{ ...baseStyle, ...currentState }}
        >
            {children}
        </div>
    );
}

/**
 * Staggered children animation — wraps each child with delay
 */
export function StaggerChildren({
    children,
    className = '',
    animation = 'fadeUp',
    staggerDelay = 100,
    baseDelay = 0,
    threshold = 0.1,
}) {
    const childArray = Array.isArray(children) ? children : [children];

    return (
        <div className={className}>
            {childArray.map((child, index) => (
                <AnimatedSection
                    key={index}
                    animation={animation}
                    delay={baseDelay + index * staggerDelay}
                    threshold={threshold}
                >
                    {child}
                </AnimatedSection>
            ))}
        </div>
    );
}

/**
 * Animated counter — counts up when visible
 */
export function AnimatedCounter({ target, suffix = '', prefix = '', duration = 2000 }) {
    const ref = useRef(null);
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                    animateCount();
                    observer.unobserve(element);
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(element);
        return () => observer.unobserve(element);
    }, [hasAnimated]);

    const animateCount = useCallback(() => {
        const numericTarget = parseFloat(String(target).replace(/[^0-9.]/g, ''));
        if (isNaN(numericTarget)) {
            setCount(target);
            return;
        }

        const startTime = performance.now();
        const isFloat = String(target).includes('.');

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * numericTarget;

            setCount(isFloat ? current.toFixed(1) : Math.floor(current));

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }, [target, duration]);

    return (
        <span ref={ref}>
            {prefix}{count}{suffix}
        </span>
    );
}
