import { useEffect, useState } from 'react';
import { aiStudioApi } from '@/services/api';

export default function CostEstimator({ type, model, params, className = '' }) {
    const [cost, setCost] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!model) {
            setCost(null);
            return;
        }

        const fetchCost = async () => {
            setLoading(true);
            try {
                const result = await aiStudioApi.estimateCost({
                    type,
                    model,
                    params: params || {},
                });
                if (result.success) {
                    setCost(result.data.cost);
                }
            } catch (error) {
                console.error('Failed to estimate cost:', error);
                setCost(null);
            } finally {
                setLoading(false);
            }
        };

        // Debounce
        const timer = setTimeout(fetchCost, 300);
        return () => clearTimeout(timer);

    }, [type, model, params]);

    if (!model) {
        return null;
    }

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <span className="text-sm text-gray-600 dark:text-gray-400">
                Chi phí ước tính:
            </span>
            {loading ? (
                <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            ) : cost !== null ? (
                <span className="font-bold text-purple-600 dark:text-purple-400">
                    {cost} credits
                </span>
            ) : (
                <span className="text-gray-400">-</span>
            )}
        </div>
    );
}
