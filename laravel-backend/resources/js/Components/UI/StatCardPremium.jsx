import React from 'react';
import GlassCard, { GlassCardHeader, GlassCardStat } from './GlassCard';
import MiniChart, { TrendIndicator, ProgressRing } from './MiniChart';

/**
 * StatCardPremium - Enhanced stat card with chart and trends
 */
export default function StatCardPremium({
    title,
    subtitle,
    value,
    previousValue,
    trend,
    trendLabel,
    icon,
    iconGradient = 'from-purple-500 to-indigo-500',
    chartData = [],
    chartColor = 'emerald',
    gradient = 'purple',
    href,
    className = '',
}) {
    const Content = (
        <GlassCard gradient={gradient} className={className}>
            <div className="flex items-start justify-between mb-4">
                {icon && (
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${iconGradient} shadow-lg`}>
                        {icon}
                    </div>
                )}
                {trend !== undefined && (
                    <TrendIndicator value={trend} />
                )}
            </div>

            <div className="mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    {value}
                </p>
                {subtitle && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
                )}
            </div>

            {chartData.length > 0 && (
                <div className="mt-4">
                    <MiniChart data={chartData} color={chartColor} height={32} />
                </div>
            )}

            {trendLabel && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {trendLabel}
                </p>
            )}
        </GlassCard>
    );

    if (href) {
        return (
            <a href={href} className="block hover:no-underline">
                {Content}
            </a>
        );
    }

    return Content;
}

/**
 * StatCardCompact - Smaller stat card for dashboard grids
 */
export function StatCardCompact({
    icon,
    title,
    value,
    trend,
    color = 'purple',
    className = ''
}) {
    const colors = {
        purple: 'from-purple-500 to-indigo-500',
        green: 'from-emerald-500 to-teal-500',
        blue: 'from-blue-500 to-cyan-500',
        orange: 'from-orange-500 to-amber-500',
    };

    return (
        <GlassCard gradient={color} padding="p-4" className={className}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${colors[color]} shadow-md`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{value}</span>
                        {trend !== undefined && <TrendIndicator value={trend} />}
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}

/**
 * StatCardProgress - Stat card with circular progress
 */
export function StatCardProgress({
    title,
    value,
    total,
    unit,
    color = 'emerald',
    className = '',
}) {
    const progress = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <GlassCard gradient="gray" padding="p-4" className={className}>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <ProgressRing progress={progress} size={56} color={color} />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white">
                        {progress}%
                    </span>
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {value}/{total} {unit}
                    </p>
                </div>
            </div>
        </GlassCard>
    );
}
