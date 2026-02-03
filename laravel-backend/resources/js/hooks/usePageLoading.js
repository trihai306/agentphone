import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

/**
 * Hook to track Inertia.js page navigation loading state
 * Useful for showing global loading indicators during page transitions
 * 
 * @returns {boolean} loading - true when navigating between pages
 * 
 * @example
 * const loading = usePageLoading();
 * if (loading) return <LoadingSpinner />;
 */
export function usePageLoading() {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleStart = () => setLoading(true);
        const handleFinish = () => setLoading(false);

        // Listen to Inertia router events
        const removeStart = router.on('start', handleStart);
        const removeFinish = router.on('finish', handleFinish);

        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    return loading;
}

/**
 * Hook to track loading with progress percentage
 * 
 * @returns {{ loading: boolean, progress: number }} 
 * 
 * @example
 * const { loading, progress } = usePageProgress();
 * if (loading) return <ProgressBar value={progress} />;
 */
export function usePageProgress() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleStart = () => {
            setLoading(true);
            setProgress(0);
        };

        const handleProgress = (event) => {
            if (event.detail.progress) {
                setProgress(event.detail.progress.percentage || 0);
            }
        };

        const handleFinish = () => {
            setProgress(100);
            // Small delay before hiding to show completion
            setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 150);
        };

        const removeStart = router.on('start', handleStart);
        const removeProgress = router.on('progress', handleProgress);
        const removeFinish = router.on('finish', handleFinish);

        return () => {
            removeStart();
            removeProgress();
            removeFinish();
        };
    }, []);

    return { loading, progress };
}

export default usePageLoading;
