import React from 'react';

/**
 * MiniChart - Simple sparkline chart component
 * Lightweight chart for inline stat displays
 */
export default function MiniChart({
    data = [],
    color = 'emerald',
    height = 40,
    showFill = true,
    className = ''
}) {
    if (!data.length) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const width = 100;
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 8) - 4;
        return `${x},${y}`;
    }).join(' ');

    const fillPoints = `0,${height} ${points} ${width},${height}`;

    const colors = {
        emerald: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.1)' },
        blue: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)' },
        purple: { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.1)' },
        orange: { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.1)' },
        pink: { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.1)' },
        red: { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.1)' },
    };

    const { stroke, fill } = colors[color] || colors.emerald;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={`w-full ${className}`}
            style={{ height: `${height}px` }}
        >
            {showFill && (
                <polygon
                    points={fillPoints}
                    fill={fill}
                />
            )}
            <polyline
                points={points}
                fill="none"
                stroke={stroke}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* End dot */}
            <circle
                cx={width}
                cy={height - ((data[data.length - 1] - min) / range) * (height - 8) - 4}
                r="3"
                fill={stroke}
            />
        </svg>
    );
}

/**
 * TrendIndicator - Show trend with arrow and percentage
 */
export function TrendIndicator({ value, suffix = '%', positive = true }) {
    const isUp = value >= 0;
    const display = Math.abs(value);

    return (
        <span className={`inline-flex items-center text-sm font-medium ${isUp ? 'text-emerald-500' : 'text-red-500'
            }`}>
            <svg
                className={`w-4 h-4 mr-0.5 ${isUp ? '' : 'rotate-180'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {display}{suffix}
        </span>
    );
}

/**
 * ProgressRing - Circular progress indicator
 */
export function ProgressRing({ progress = 0, size = 60, strokeWidth = 4, color = 'emerald' }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    const colors = {
        emerald: '#10b981',
        blue: '#3b82f6',
        purple: '#8b5cf6',
        orange: '#f97316',
        pink: '#ec4899',
    };

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={colors[color] || colors.emerald}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
        </svg>
    );
}
