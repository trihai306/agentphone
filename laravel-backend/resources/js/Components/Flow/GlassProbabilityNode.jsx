import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * GlassProbabilityNode - Random branching node with weighted probability
 * 
 * Features:
 * - Multiple weighted output paths (2-4 branches)
 * - Glass morphism design
 * - Visual dice icon with probability distribution
 * - Configurable weights for each path
 */
function GlassProbabilityNode({ data, selected, id }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Execution state
    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    // Probability paths - default 2 paths with 50/50
    const paths = data?.paths || [
        { label: 'Path A', weight: 50 },
        { label: 'Path B', weight: 50 }
    ];

    // Calculate total weight
    const totalWeight = paths.reduce((sum, path) => sum + path.weight, 0);

    // Normalize weights to percentages
    const normalizedPaths = paths.map(path => ({
        ...path,
        percentage: totalWeight > 0 ? Math.round((path.weight / totalWeight) * 100) : 0
    }));

    return (
        <div className={`relative ${isRunning ? 'animate-pulse' : ''}`}>
            {/* Input Handle - Top center */}
            <Handle
                type="target"
                position={Position.Top}
                id="input"
                className="!w-3 !h-3 !border-2 !rounded-full"
                style={{
                    backgroundColor: isDark ? '#1f1f1f' : '#fff',
                    borderColor: isDark ? '#525252' : '#d1d5db',
                    top: '-6px',
                }}
            />

            {/* Main Glass Card */}
            <div
                className={`
                    relative px-5 py-4 rounded-2xl backdrop-blur-xl
                    border transition-all duration-200
                    min-w-[240px] max-w-[280px]
                    ${selected ? 'ring-2 ring-orange-500 ring-offset-2' : ''}
                `}
                style={{
                    backgroundColor: isDark
                        ? 'rgba(31, 31, 31, 0.8)'
                        : 'rgba(255, 255, 255, 0.9)',
                    borderColor: selected
                        ? '#f97316'
                        : isDark ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)',
                    boxShadow: selected
                        ? '0 8px 32px rgba(249, 115, 22, 0.4)'
                        : isDark
                            ? '0 8px 24px rgba(0, 0, 0, 0.6)'
                            : '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
            >
                {/* Header with Icon */}
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl backdrop-blur-sm"
                        style={{
                            backgroundColor: 'rgba(249, 115, 22, 0.2)',
                            border: '1px solid rgba(249, 115, 22, 0.3)'
                        }}
                    >
                        {isRunning ? (
                            <svg className="w-6 h-6 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : isSuccess ? (
                            <span className="text-emerald-500">✓</span>
                        ) : isError ? (
                            <span className="text-red-500">✗</span>
                        ) : (
                            <span>🎲</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {data?.label || 'Probability'}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Random Branch
                        </div>
                    </div>
                </div>

                {/* Probability Distribution */}
                <div className="space-y-2">
                    {normalizedPaths.map((path, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'
                                }`}
                        >
                            <div className="flex-1">
                                <div className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {path.label}
                                </div>
                                {/* Progress bar */}
                                <div className={`mt-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
                                        style={{ width: `${path.percentage}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-xs font-bold text-orange-500 min-w-[40px] text-right">
                                {path.percentage}%
                            </div>
                        </div>
                    ))}
                </div>

                {/* Helper text */}
                <div className={`mt-3 text-[10px] text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Randomly selects one path
                </div>
            </div>

            {/* Output Handles - Right side, evenly spaced */}
            {normalizedPaths.map((path, index) => {
                const handleCount = normalizedPaths.length;
                const spacing = handleCount > 1 ? 100 / (handleCount + 1) : 50;
                const topPosition = `${spacing * (index + 1)}%`;

                return (
                    <Handle
                        key={index}
                        type="source"
                        position={Position.Right}
                        id={`path-${index}`}
                        className="!w-3 !h-3 !border-2 !rounded-full transition-transform hover:!scale-125"
                        style={{
                            backgroundColor: isDark ? '#f97316' : '#fed7aa',
                            borderColor: '#f97316',
                            right: '-6px',
                            top: topPosition,
                        }}
                    />
                );
            })}
        </div>
    );
}

export default memo(GlassProbabilityNode);
