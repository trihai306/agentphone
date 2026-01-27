import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';

const EXECUTION_MODES = [
    { value: 'once', icon: '🟢', label: 'Chạy 1 lần', color: 'emerald' },
    { value: 'repeat', icon: '🔵', label: 'Lặp lại', color: 'blue' },
    { value: 'conditional', icon: '🟣', label: 'Điều kiện', color: 'purple', disabled: true },
];

export default function WorkflowConfigPanel({ workflow, config, onChange, onClose }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [localConfig, setLocalConfig] = useState(config);

    const updateConfig = (key, value) => {
        const newConfig = { ...localConfig, [key]: value };
        setLocalConfig(newConfig);
        onChange(newConfig);
    };

    const handleSave = () => {
        onClose();
    };

    return (
        <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4`}>
            <div
                className={`w-full max-w-md rounded-2xl shadow-2xl border ${isDark
                        ? 'bg-gray-900/95 border-gray-700'
                        : 'bg-white/95 border-gray-200'
                    }`}
            >
                {/* Header */}
                <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                🔧 Cấu hình Workflow
                            </h3>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {workflow.name}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${isDark
                                    ? 'hover:bg-gray-800 text-gray-400'
                                    : 'hover:bg-gray-100 text-gray-600'
                                }`}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-6">
                    {/* Execution Mode */}
                    <div>
                        <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            🔄 Chế độ thực thi
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {EXECUTION_MODES.map(mode => (
                                <button
                                    key={mode.value}
                                    disabled={mode.disabled}
                                    onClick={() => updateConfig('execution_mode', mode.value)}
                                    className={`
                                        relative px-4 py-3 rounded-xl border-2 transition-all text-left
                                        ${localConfig.execution_mode === mode.value
                                            ? `border-${mode.color}-500 bg-${mode.color}-500/10`
                                            : `border-transparent ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-50 hover:bg-gray-100'}`
                                        }
                                        ${mode.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{mode.icon}</span>
                                            <div>
                                                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                    {mode.label}
                                                    {mode.disabled && (
                                                        <span className={`ml-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'
                                                            }`}>
                                                            (Sắp ra mắt)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {localConfig.execution_mode === mode.value && (
                                            <div className={`w-5 h-5 rounded-full bg-${mode.color}-500 flex items-center justify-center`}>
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Repeat Configuration (visible only when mode = repeat) */}
                    {localConfig.execution_mode === 'repeat' && (
                        <div className="space-y-4 animate-fadeIn">
                            {/* Repeat Count */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                    🔢 Số lần lặp
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min="1"
                                        max="1000"
                                        value={localConfig.repeat_count || 1}
                                        onChange={(e) => updateConfig('repeat_count', parseInt(e.target.value) || 1)}
                                        className={`flex-1 px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all ${isDark
                                                ? 'bg-gray-800 border-gray-700 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                    />
                                    <span className={`text-sm whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        lần/tài khoản
                                    </span>
                                </div>
                            </div>

                            {/* Delay Between Repeats */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                    ⏱️ Thời gian nghỉ (tùy chọn)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min="0"
                                        max="3600"
                                        placeholder="0"
                                        value={localConfig.delay_between_repeats || ''}
                                        onChange={(e) => updateConfig('delay_between_repeats', parseInt(e.target.value) || null)}
                                        className={`flex-1 px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all ${isDark
                                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                            }`}
                                    />
                                    <span className={`text-sm whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        giây
                                    </span>
                                </div>
                                <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Thời gian chờ giữa các lần lặp (để giống người thật)
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t flex items-center justify-end gap-3 ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                    }`}>
                    <button
                        onClick={onClose}
                        className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${isDark
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                    >
                        ✓ Lưu
                    </button>
                </div>
            </div>
        </div>
    );
}
