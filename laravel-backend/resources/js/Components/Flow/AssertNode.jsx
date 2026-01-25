import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * AssertNode - Verifies element exists, has value, or condition is met
 * Layout: Horizontal (Input Left → Outputs Right)
 */
function AssertNode({ data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    const assertType = data?.assertType || 'exists';
    const color = '#22c55e'; // Green

    const getAssertLabel = () => {
        const labels = {
            'exists': 'Element Exists',
            'text': 'Text Equals',
            'visible': 'Is Visible',
            'enabled': 'Is Enabled',
            'contains': 'Contains Text',
        };
        return labels[assertType] || 'Assert';
    };

    return (
        <div className={`group transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            {/* Input Handle - Left */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-4 !h-4 !border-[3px] !-left-2 transition-all duration-300 group-hover:!scale-110"
                style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : color,
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: `0 0 15px ${color}60`,
                }}
            />

            {/* Main Card */}
            <div
                className={`relative min-w-[200px] rounded-2xl overflow-hidden ${selected ? 'ring-2 ring-offset-2' : ''}`}
                style={{
                    background: isDark
                        ? `linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)`
                        : `linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)`,
                    backdropFilter: 'blur(20px)',
                    boxShadow: selected
                        ? `0 0 40px ${color}25, 0 8px 32px rgba(0, 0, 0, ${isDark ? '0.5' : '0.15'})`
                        : `0 8px 32px rgba(0, 0, 0, ${isDark ? '0.4' : '0.1'})`,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                    ringColor: isError ? '#ef4444' : isSuccess ? '#10b981' : color,
                    ringOffsetColor: isDark ? '#0a0a0a' : '#ffffff',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                        background: isError ? 'rgba(239, 68, 68, 0.15)' :
                            isSuccess ? 'rgba(16, 185, 129, 0.15)' :
                                isRunning ? 'rgba(99, 102, 241, 0.15)' :
                                    `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`
                    }}
                >
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRunning ? 'animate-spin' : ''}`}
                        style={{
                            background: isError ? 'rgba(239, 68, 68, 0.3)' :
                                isSuccess ? 'rgba(16, 185, 129, 0.3)' :
                                    isRunning ? 'rgba(99, 102, 241, 0.3)' :
                                        `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
                            boxShadow: `0 4px 12px ${color}30`,
                        }}
                    >
                        {isSuccess ? (
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : isError ? (
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className={`w-5 h-5`} fill="none" stroke={isRunning ? '#818cf8' : color} viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold" style={{
                            color: isError ? '#ef4444' : isSuccess ? '#10b981' : isRunning ? '#818cf8' : color
                        }}>
                            {isError ? '❌ Failed' : isSuccess ? '✓ Passed' : isRunning ? '🔍 Checking...' : '✓ Assert'}
                        </h3>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {data?.label || 'Kiểm Tra'}
                        </p>
                    </div>
                </div>

                {/* Body - only show if has resourceId or expectedValue */}
                {(data?.resourceId || data?.expectedValue) && (
                    <div className={`px-4 py-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                        {data?.resourceId && (
                            <div className={`text-xs font-mono px-2 py-1.5 rounded-lg ${isDark ? 'bg-black/30 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                                {data.resourceId}
                            </div>
                        )}
                        {data?.expectedValue && (
                            <div className={`flex items-center gap-1.5 mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span>=</span>
                                <span className="font-mono">"{data.expectedValue}"</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Success Handle - Right Top */}
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                className="!w-4 !h-4 !border-[3px] !-right-2 transition-transform hover:!scale-125"
                style={{
                    top: '35%',
                    backgroundColor: '#10b981',
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)',
                }}
            />

            {/* Error Handle - Right Bottom */}
            <Handle
                type="source"
                position={Position.Right}
                id="false"
                className="!w-4 !h-4 !border-[3px] !-right-2 transition-transform hover:!scale-125"
                style={{
                    top: '65%',
                    backgroundColor: '#ef4444',
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)',
                }}
            />
        </div>
    );
}

export default memo(AssertNode);
