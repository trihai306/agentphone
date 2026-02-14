import { useTheme } from '@/Contexts/ThemeContext';

/**
 * Stepper - Multi-step progress indicator
 * Supports horizontal and vertical orientation
 *
 * Usage:
 *   <Stepper currentStep={1} steps={[
 *     { label: 'Account', description: 'Create account' },
 *     { label: 'Profile', description: 'Set up profile' },
 *     { label: 'Complete', description: 'All done!' },
 *   ]} />
 */
export default function Stepper({
    steps = [],
    currentStep = 0,
    orientation = 'horizontal',
    size = 'md',
    color = 'purple',
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const isHorizontal = orientation === 'horizontal';

    const stepSizes = {
        sm: { dot: 'w-7 h-7', text: 'text-xs', icon: 'w-3.5 h-3.5' },
        md: { dot: 'w-9 h-9', text: 'text-sm', icon: 'w-4 h-4' },
        lg: { dot: 'w-11 h-11', text: 'text-base', icon: 'w-5 h-5' },
    };

    const gradients = {
        purple: 'from-purple-500 to-indigo-500',
        blue: 'from-blue-500 to-cyan-500',
        green: 'from-emerald-500 to-teal-500',
        orange: 'from-orange-500 to-amber-500',
        pink: 'from-pink-500 to-rose-500',
    };

    const s = stepSizes[size];

    return (
        <div className={`
            ${isHorizontal ? 'flex items-start' : 'flex flex-col'}
            ${className}
        `}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;
                const isLast = index === steps.length - 1;

                return (
                    <div
                        key={index}
                        className={`
                            ${isHorizontal ? 'flex-1 flex items-start' : 'flex items-start'}
                            ${!isLast && !isHorizontal ? 'pb-8' : ''}
                        `}
                    >
                        <div className={`
                            flex ${isHorizontal ? 'flex-col items-center' : 'items-start gap-4'}
                            ${isHorizontal ? 'w-full' : ''}
                        `}>
                            {/* Step indicator row */}
                            <div className={`
                                flex items-center
                                ${isHorizontal ? 'w-full' : 'flex-col'}
                            `}>
                                {/* Dot */}
                                <div className={`
                                    relative flex-shrink-0 flex items-center justify-center rounded-full
                                    font-semibold transition-all duration-300
                                    ${s.dot} ${s.text}
                                    ${isCompleted
                                        ? `bg-gradient-to-br ${gradients[color]} text-white shadow-lg`
                                        : isActive
                                            ? `bg-gradient-to-br ${gradients[color]} text-white shadow-lg ring-4 ${isDark ? 'ring-purple-500/20' : 'ring-purple-100'}`
                                            : isDark
                                                ? 'bg-white/10 text-gray-500 border border-white/10'
                                                : 'bg-gray-100 text-gray-400 border border-gray-200'
                                    }
                                `}>
                                    {isCompleted ? (
                                        <svg className={s.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>

                                {/* Connector line */}
                                {!isLast && (
                                    <div className={`
                                        ${isHorizontal ? 'flex-1 h-[2px] mx-2' : 'w-[2px] flex-1 my-2 ml-[18px]'}
                                        rounded-full overflow-hidden
                                        ${isDark ? 'bg-white/10' : 'bg-gray-200'}
                                    `}>
                                        <div
                                            className={`
                                                ${isHorizontal ? 'h-full' : 'w-full'}
                                                bg-gradient-to-r ${gradients[color]}
                                                transition-all duration-500
                                            `}
                                            style={{
                                                [isHorizontal ? 'width' : 'height']: isCompleted ? '100%' : '0%',
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Labels */}
                            <div className={`
                                ${isHorizontal ? 'mt-3 text-center' : ''}
                                min-w-0
                            `}>
                                <p className={`
                                    ${s.text} font-semibold leading-tight
                                    ${isActive || isCompleted
                                        ? isDark ? 'text-white' : 'text-gray-900'
                                        : isDark ? 'text-gray-500' : 'text-gray-400'
                                    }
                                `}>
                                    {step.label}
                                </p>
                                {step.description && (
                                    <p className={`
                                        text-xs mt-0.5
                                        ${isActive
                                            ? isDark ? 'text-gray-400' : 'text-gray-500'
                                            : isDark ? 'text-gray-600' : 'text-gray-400'
                                        }
                                    `}>
                                        {step.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
