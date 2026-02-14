import { useTheme } from '@/Contexts/ThemeContext';

/**
 * MetricCard - Dashboard KPI display with trend and sparkline
 *
 * Usage:
 *   <MetricCard
 *     title="Total Revenue"
 *     value="$12,450"
 *     change={12.5}
 *     changeLabel="vs last month"
 *     icon={<CurrencyIcon />}
 *     color="green"
 *     sparkline={[20, 35, 25, 45, 30, 60, 50]}
 *   />
 */
export default function MetricCard({
    title,
    value,
    change,
    changeLabel,
    icon,
    color = 'purple',
    sparkline,
    suffix,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const isPositive = change > 0;
    const isNeutral = change === 0 || change === undefined;

    const colorConfig = {
        purple: {
            gradient: 'from-purple-500 to-indigo-500',
            iconBg: isDark ? 'bg-purple-500/15' : 'bg-purple-100',
            iconText: isDark ? 'text-purple-400' : 'text-purple-600',
            sparkColor: '#a855f7',
            sparkFill: isDark ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.08)',
        },
        blue: {
            gradient: 'from-blue-500 to-cyan-500',
            iconBg: isDark ? 'bg-blue-500/15' : 'bg-blue-100',
            iconText: isDark ? 'text-blue-400' : 'text-blue-600',
            sparkColor: '#3b82f6',
            sparkFill: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)',
        },
        green: {
            gradient: 'from-emerald-500 to-teal-500',
            iconBg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-100',
            iconText: isDark ? 'text-emerald-400' : 'text-emerald-600',
            sparkColor: '#10b981',
            sparkFill: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)',
        },
        orange: {
            gradient: 'from-orange-500 to-amber-500',
            iconBg: isDark ? 'bg-orange-500/15' : 'bg-orange-100',
            iconText: isDark ? 'text-orange-400' : 'text-orange-600',
            sparkColor: '#f97316',
            sparkFill: isDark ? 'rgba(249,115,22,0.1)' : 'rgba(249,115,22,0.08)',
        },
        pink: {
            gradient: 'from-pink-500 to-rose-500',
            iconBg: isDark ? 'bg-pink-500/15' : 'bg-pink-100',
            iconText: isDark ? 'text-pink-400' : 'text-pink-600',
            sparkColor: '#ec4899',
            sparkFill: isDark ? 'rgba(236,72,153,0.1)' : 'rgba(236,72,153,0.08)',
        },
    };

    const c = colorConfig[color] || colorConfig.purple;

    return (
        <div className={`
            relative overflow-hidden rounded-2xl p-5
            ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100 shadow-sm'}
            transition-all duration-300 hover:shadow-lg
            ${isDark ? 'hover:bg-white/[0.07]' : 'hover:shadow-xl'}
            ${className}
        `}>
            {/* Sparkline background */}
            {sparkline && sparkline.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-60">
                    <Sparkline data={sparkline} color={c.sparkColor} fill={c.sparkFill} />
                </div>
            )}

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {title}
                    </span>
                    {icon && (
                        <div className={`p-2 rounded-xl ${c.iconBg}`}>
                            <span className={c.iconText}>{icon}</span>
                        </div>
                    )}
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {value}
                    </span>
                    {suffix && (
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {suffix}
                        </span>
                    )}
                </div>

                {/* Change indicator */}
                {!isNeutral && (
                    <div className="flex items-center gap-1.5">
                        <span className={`
                            inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md
                            ${isPositive
                                ? isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                : isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'
                            }
                        `}>
                            <svg className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            {Math.abs(change)}%
                        </span>
                        {changeLabel && (
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {changeLabel}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Sparkline - Tiny area chart for MetricCard
 */
function Sparkline({ data, color, fill, height = 64 }) {
    if (!data || data.length < 2) return null;

    const width = 200;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const padding = 2;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - padding - ((value - min) / range) * (height - padding * 2);
        return `${x},${y}`;
    });

    const linePath = `M${points.join(' L')}`;
    const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <path d={areaPath} fill={fill} />
            <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/**
 * MetricCardGrid - Responsive grid for MetricCards
 */
export function MetricCardGrid({ children, className = '' }) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
            {children}
        </div>
    );
}
