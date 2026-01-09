import React from 'react';

/**
 * Skeleton - Animated skeleton loader component
 */
export function Skeleton({ className = '', variant = 'text' }) {
    const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]';

    const variants = {
        text: 'h-4 rounded',
        title: 'h-6 rounded',
        circle: 'rounded-full',
        rect: 'rounded-lg',
        card: 'rounded-2xl',
    };

    return (
        <div className={`${baseClasses} ${variants[variant]} ${className}`} />
    );
}

/**
 * SkeletonCard - Full card skeleton
 */
export function SkeletonCard({ className = '' }) {
    return (
        <div className={`p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 ${className}`}>
            <div className="flex items-center gap-3 mb-4">
                <Skeleton variant="circle" className="w-12 h-12" />
                <div className="flex-1">
                    <Skeleton variant="title" className="w-1/2 mb-2" />
                    <Skeleton variant="text" className="w-1/3" />
                </div>
            </div>
            <Skeleton variant="text" className="w-full mb-2" />
            <Skeleton variant="text" className="w-3/4 mb-4" />
            <div className="flex gap-2">
                <Skeleton variant="rect" className="w-24 h-10" />
                <Skeleton variant="rect" className="w-24 h-10" />
            </div>
        </div>
    );
}

/**
 * SkeletonTable - Table skeleton
 */
export function SkeletonTable({ rows = 5, cols = 4 }) {
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} variant="title" className="flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 py-2">
                    {Array.from({ length: cols }).map((_, j) => (
                        <Skeleton key={j} variant="text" className="flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

/**
 * SkeletonStats - Stats grid skeleton
 */
export function SkeletonStats({ count = 4 }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <Skeleton variant="text" className="w-20 mb-2" />
                    <Skeleton variant="title" className="w-16 mb-1" />
                    <Skeleton variant="text" className="w-12" />
                </div>
            ))}
        </div>
    );
}

export default Skeleton;
