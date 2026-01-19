import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * WaitForElementNode - Chờ element xuất hiện với timeout
 * 
 * Options:
 * - resourceId: ID của element cần chờ
 * - text: Text của element cần chờ
 * - timeout: Thời gian chờ tối đa (ms)
 * - onTimeout: 'skip' | 'fail' - Hành động khi hết timeout
 */
function WaitForElementNode({ data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || 'idle';
    const progress = data?.progress || 0; // 0-100
    const timeout = data?.timeout || 5000;
    const onTimeout = data?.onTimeout || 'skip';

    const isRunning = executionState === 'running';
    const isSuccess = executionState === 'success';
    const isTimeout = executionState === 'timeout';
    const isError = executionState === 'error';

    const getStatusConfig = () => {
        if (isRunning) return {
            bg: 'rgba(99, 102, 241, 0.15)',
            headerBg: 'rgba(99, 102, 241, 0.1)',
            text: 'text-indigo-400',
            label: 'Đang chờ...',
            icon: '⏳'
        };
        if (isSuccess) return {
            bg: 'rgba(16, 185, 129, 0.15)',
            headerBg: 'rgba(16, 185, 129, 0.1)',
            text: 'text-emerald-400',
            label: 'Đã tìm thấy',
            icon: '✓'
        };
        if (isTimeout) return {
            bg: 'rgba(245, 158, 11, 0.15)',
            headerBg: 'rgba(245, 158, 11, 0.1)',
            text: 'text-amber-400',
            label: 'Hết thời gian',
            icon: '⏱'
        };
        if (isError) return {
            bg: 'rgba(239, 68, 68, 0.15)',
            headerBg: 'rgba(239, 68, 68, 0.1)',
            text: 'text-red-400',
            label: 'Lỗi',
            icon: '✗'
        };
        return {
            bg: 'rgba(59, 130, 246, 0.08)',
            headerBg: 'rgba(59, 130, 246, 0.08)',
            text: 'text-blue-400',
            label: 'Chờ Element',
            icon: '⏳'
        };
    };

    const status = getStatusConfig();

    return (
        <div className={`transition-all duration-300 ${selected ? 'scale-105' : ''}`}>
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !border-[3px] !-top-2"
                style={{
                    backgroundColor: '#3b82f6',
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                }}
            />

            <div
                className={`relative min-w-[200px] rounded-xl overflow-hidden transition-all duration-300
                    ${selected ? `ring-2 ring-blue-500 ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'}` : ''}`}
                style={{
                    background: isDark
                        ? 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)'
                        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                    boxShadow: isDark ? '0 4px 25px rgba(0,0,0,0.4)' : '0 4px 25px rgba(0,0,0,0.1)',
                    border: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`,
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2.5 px-3.5 py-3"
                    style={{ background: status.headerBg }}
                >
                    <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRunning ? 'animate-bounce' : ''}`}
                        style={{ background: 'rgba(59, 130, 246, 0.2)' }}
                    >
                        <span className="text-lg">{status.icon}</span>
                    </div>
                    <div className="flex-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${status.text}`}>
                            {status.label}
                        </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                        WAIT
                    </span>
                </div>

                {/* Progress Bar (when running) */}
                {isRunning && (
                    <div className={`h-1 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Body */}
                <div className={`px-3.5 py-3 ${!isRunning ? `border-t ${isDark ? 'border-[#252525]' : 'border-gray-100'}` : ''}`}>
                    {/* Label */}
                    <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {data?.label || 'Wait For Element'}
                    </p>

                    {/* Resource ID */}
                    {data?.resourceId && (
                        <div className={`text-xs font-mono px-2.5 py-1.5 rounded-lg mb-2 truncate ${isDark ? 'bg-[#0f0f0f] text-gray-500' : 'bg-gray-50 text-gray-500'}`}>
                            {data.resourceId}
                        </div>
                    )}

                    {/* Text to find */}
                    {data?.text && !data?.resourceId && (
                        <div className={`text-xs font-mono px-2.5 py-1.5 rounded-lg mb-2 truncate ${isDark ? 'bg-[#0f0f0f] text-gray-500' : 'bg-gray-50 text-gray-500'}`}>
                            "{data.text}"
                        </div>
                    )}

                    {/* Config row */}
                    <div className="flex items-center justify-between mt-2">
                        <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <span>⏱</span>
                            <span>{timeout / 1000}s</span>
                        </div>
                        <div className={`text-[10px] px-2 py-0.5 rounded ${onTimeout === 'skip'
                                ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                                : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                            }`}>
                            {onTimeout === 'skip' ? '→ Skip nếu hết' : '✗ Fail nếu hết'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3.5 !h-3.5 !border-[3px] !-bottom-2"
                style={{
                    backgroundColor: isSuccess ? '#10b981' : '#3b82f6',
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                }}
            />
        </div>
    );
}

export default memo(WaitForElementNode);
