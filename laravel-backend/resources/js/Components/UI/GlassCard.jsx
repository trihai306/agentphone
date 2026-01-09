import React from 'react';

/**
 * GlassCard - Premium glassmorphic card component
 * Use for consistent, premium-looking cards across the app
 */
export default function GlassCard({
    children,
    className = '',
    gradient = 'purple', // purple, green, blue, orange, pink
    glow = true,
    hover = true,
    padding = 'p-6',
    ...props
}) {
    const gradients = {
        purple: 'from-purple-500/10 to-indigo-500/10',
        green: 'from-emerald-500/10 to-teal-500/10',
        blue: 'from-blue-500/10 to-cyan-500/10',
        orange: 'from-orange-500/10 to-amber-500/10',
        pink: 'from-pink-500/10 to-rose-500/10',
        gray: 'from-gray-500/5 to-slate-500/5',
    };

    const glowColors = {
        purple: 'hover:shadow-purple-500/20',
        green: 'hover:shadow-emerald-500/20',
        blue: 'hover:shadow-blue-500/20',
        orange: 'hover:shadow-orange-500/20',
        pink: 'hover:shadow-pink-500/20',
        gray: 'hover:shadow-gray-500/10',
    };

    const borderColors = {
        purple: 'border-purple-500/20',
        green: 'border-emerald-500/20',
        blue: 'border-blue-500/20',
        orange: 'border-orange-500/20',
        pink: 'border-pink-500/20',
        gray: 'border-gray-500/10',
    };

    return (
        <div
            className={`
                relative overflow-hidden rounded-2xl
                bg-gradient-to-br ${gradients[gradient]}
                backdrop-blur-xl
                border ${borderColors[gradient]}
                ${padding}
                ${hover ? `transition-all duration-300 ${glow ? `hover:shadow-xl ${glowColors[gradient]}` : ''} hover:scale-[1.02]` : ''}
                ${className}
            `}
            {...props}
        >
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

/**
 * GlassCardHeader - Header section for GlassCard
 */
export function GlassCardHeader({ icon, title, subtitle, action, iconGradient = 'from-purple-500 to-indigo-500' }) {
    return (
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${iconGradient} shadow-lg`}>
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                    {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
                </div>
            </div>
            {action}
        </div>
    );
}

/**
 * GlassCardStat - Stat display for GlassCard
 */
export function GlassCardStat({ value, label, trend, trendUp = true }) {
    return (
        <div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
                {trend && (
                    <span className={`text-sm font-medium ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
        </div>
    );
}
