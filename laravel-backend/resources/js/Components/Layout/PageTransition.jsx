import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

/**
 * PageTransition - Provides smooth page transition animations
 * Wraps the entire app to animate between page changes
 */
export default function PageTransition({ children }) {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [displayChildren, setDisplayChildren] = useState(children);

    // Listen for Inertia navigation events
    useEffect(() => {
        const handleStart = () => {
            setIsTransitioning(true);
        };

        const handleFinish = () => {
            // Small delay to allow exit animation to complete
            setTimeout(() => {
                setDisplayChildren(children);
                setIsTransitioning(false);
            }, 150);
        };

        // Register Inertia event listeners
        const removeStart = router.on('start', handleStart);
        const removeFinish = router.on('finish', handleFinish);

        return () => {
            removeStart();
            removeFinish();
        };
    }, [children]);

    // Update display children when not transitioning
    useEffect(() => {
        if (!isTransitioning) {
            setDisplayChildren(children);
        }
    }, [children, isTransitioning]);

    return (
        <>
            {/* Page content with transition */}
            <div
                className={`page-transition ${isTransitioning ? 'page-exit' : 'page-enter'}`}
                style={{
                    '--transition-duration': '200ms',
                }}
            >
                {displayChildren}
            </div>

            {/* Transition overlay loading indicator */}
            {isTransitioning && (
                <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
                    <div className="transition-loader">
                        <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                </div>
            )}

            <style>{`
                .page-transition {
                    transition: opacity var(--transition-duration) ease-out,
                                transform var(--transition-duration) ease-out;
                }
                
                .page-enter {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .page-exit {
                    opacity: 0.6;
                    transform: translateY(4px);
                }

                .transition-loader {
                    animation: fadeIn 100ms ease-out 100ms both;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </>
    );
}

