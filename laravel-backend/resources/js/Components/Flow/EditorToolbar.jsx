/**
 * EditorToolbar - Top navigation bar for the Flow Editor
 * 
 * Extracted from Editor.jsx Phase 14 refactor.
 * Contains flow metadata, device selection, execution controls, and settings.
 */
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '@/i18n';
import { useTheme } from '@/Contexts/ThemeContext';
import ThemeToggle from '@/Components/ThemeToggle';
import DeviceSelectorDropdown from './DeviceSelectorDropdown';
import { deviceApi, flowApi } from '@/services/api';
import { MODAL_TYPES } from '@/hooks/useModalManager';

export default function EditorToolbar({
    // Flow metadata
    flow,
    flowName,
    editingName,
    setEditingName,
    setFlowName,
    handleUpdateName,
    handleManualSave,
    saving,
    lastSaved,

    // Device state
    selectedDevice,
    setSelectedDevice,
    devices,
    isPinging,
    pingError,

    // Modal controls
    modals,
    openModal,
    closeModal,

    // Execution state
    isRunning,
    isPaused,
    isCompleted,
    hasError,
    testRunning,
    setTestRunning,
    nodes,
    setNodes,

    // Execution actions
    startExecution,
    pauseExecution,
    stopExecution,
    resumeExecution,
    resetExecution,

    // Toast
    addToast,
}) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`h-14 flex items-center justify-between px-4 flex-shrink-0 border-b transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex items-center gap-3">
                {/* Back */}
                <Link
                    href="/flows"
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white border-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 border-gray-200'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>

                {/* Flow Name */}
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-white' : 'bg-gray-900'}`}>
                        <svg className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                    </div>
                    {editingName ? (
                        <input
                            type="text"
                            value={flowName}
                            onChange={(e) => setFlowName(e.target.value)}
                            onBlur={handleUpdateName}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                            autoFocus
                            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors ${isDark ? 'bg-[#1a1a1a] border-indigo-500 text-white' : 'bg-white border-indigo-500 text-gray-900'}`}
                        />
                    ) : (
                        <button
                            onClick={() => setEditingName(true)}
                            className={`text-base font-semibold transition-colors ${isDark ? 'text-white hover:text-indigo-400' : 'text-gray-900 hover:text-indigo-600'}`}
                        >
                            {flowName}
                        </button>
                    )}
                    <span className={`px-2 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider ${flow.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                        : isDark
                            ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                        {flow.status}
                    </span>
                </div>
            </div>

            {/* Right - Actions (compact layout) */}
            <div className="flex items-center gap-1.5">
                {/* Device Selector - Always show */}
                <>
                    <div className="relative device-selector-container">
                        {/* Enhanced Toolbar Button */}
                        <button
                            onClick={async () => {
                                if (modals.deviceSelector.isOpen) {
                                    closeModal(MODAL_TYPES.DEVICE_SELECTOR);
                                } else {
                                    openModal(MODAL_TYPES.DEVICE_SELECTOR);

                                    // Trigger accessibility check when opening selector
                                    if (selectedDevice?.device_id) {
                                        try {
                                            await deviceApi.checkAccessibility(selectedDevice.device_id);
                                            console.log('🔍 Device selector: Accessibility check triggered for:', selectedDevice.device_id);
                                        } catch (err) {
                                            console.warn('⚠️ Device selector: Accessibility check failed:', err);
                                        }
                                    }
                                }
                            }}
                            className={`h-9 px-3 flex items-center gap-2 text-sm font-medium rounded-lg transition-all duration-300 border backdrop-blur-sm ${selectedDevice
                                ? isDark
                                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/20'
                                    : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-700 shadow-lg shadow-emerald-200/50'
                                : isDark
                                    ? 'bg-[#1a1a1a]/80 border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#3a3a3a]'
                                    : 'bg-white/80 border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                }`}
                            title={selectedDevice ? `Connected: ${selectedDevice.name}` : `${devices.length} device(s) available`}
                            aria-label="Device selector"
                            aria-expanded={modals.deviceSelector.isOpen}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>

                            {/* Pulsing Connection Indicator */}
                            {selectedDevice && (
                                <div className="relative">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                                </div>
                            )}

                            {/* Device Name or Count Badge */}
                            {selectedDevice ? (
                                <span className="truncate max-w-[120px] font-semibold">{selectedDevice.name}</span>
                            ) : (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${devices.length > 0
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-gray-500/20 text-gray-500'
                                    }`}>
                                    {devices.length}
                                </span>
                            )}

                            <svg className={`w-3 h-3 transition-transform duration-200 ${modals.deviceSelector.isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Device Selector Dropdown */}
                        <DeviceSelectorDropdown
                            isOpen={modals.deviceSelector.isOpen}
                            devices={devices}
                            selectedDevice={selectedDevice}
                            onSelect={setSelectedDevice}
                            onDisconnect={() => setSelectedDevice(null)}
                            onClose={() => closeModal('deviceSelector')}
                            addToast={addToast}
                            isPinging={isPinging}
                            pingError={pingError}
                        />
                    </div>

                    {/* Divider */}
                    <div className={`w-px h-5 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />
                </>

                {/* Theme Toggle only */}
                <ThemeToggle />

                {/* Execution Controls */}
                {!isRunning && !isPaused && (
                    <button
                        onClick={async () => {
                            // If device selected, run on device
                            if (selectedDevice) {
                                setTestRunning(true);

                                // Run the workflow directly (no accessibility check needed)
                                try {
                                    console.log('🚀 Starting test-run...', {
                                        flowId: flow.id,
                                        deviceId: selectedDevice.id,
                                        deviceName: selectedDevice.name
                                    });
                                    // Set all action nodes to 'pending' state for visual feedback
                                    setNodes(currentNodes =>
                                        currentNodes.map(node => ({
                                            ...node,
                                            data: {
                                                ...node.data,
                                                executionState: ['start', 'end', 'input', 'output', 'condition'].includes(node.type)
                                                    ? node.data?.executionState
                                                    : 'pending',
                                            }
                                        }))
                                    );

                                    const result = await flowApi.testRun(flow.id, {
                                        device_id: selectedDevice.device_id,  // Use device_id UUID, not database id
                                    });
                                    if (result.success) {
                                        addToast(t('flows.editor.run.success', { device: selectedDevice.name, count: result.data.data?.actions_count }), 'success');
                                    }
                                } catch (error) {
                                    console.error('🚀 Test-run error:', error);
                                    addToast(t('flows.editor.run.failed', { error: error.message }), 'error');
                                } finally {
                                    setTestRunning(false);
                                }
                            } else {
                                // No device - run local simulation
                                startExecution();
                            }
                        }}
                        disabled={nodes.length === 0 || testRunning}
                        className={`h-8 px-2.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                    >
                        {testRunning ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span className="hidden sm:inline">{selectedDevice ? `${selectedDevice.name.substring(0, 8)}` : 'Run'}</span>
                    </button>
                )}

                {isRunning && (
                    <>
                        <button
                            onClick={pauseExecution}
                            className="h-9 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border border-amber-500/30"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Pause
                        </button>
                        <button
                            onClick={stopExecution}
                            className="h-9 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border border-red-500/30"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                            {t('flows.editor.toolbar.stop')}
                        </button>
                    </>
                )}

                {isPaused && (
                    <>
                        <button
                            onClick={resumeExecution}
                            className="h-9 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border border-emerald-500/30"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            {t('flows.editor.toolbar.resume')}
                        </button>
                        <button
                            onClick={stopExecution}
                            className="h-9 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border border-red-500/30"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                            {t('flows.editor.toolbar.stop')}
                        </button>
                    </>
                )}

                {(isCompleted || hasError) && (
                    <button
                        onClick={resetExecution}
                        className={`h-9 px-4 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border ${isCompleted
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {t('flows.editor.toolbar.reset')}
                    </button>
                )}

                {/* Preview Button */}
                <button
                    onClick={() => openModal('preview')}
                    disabled={nodes.filter(n => n.data?.screenshotUrl).length === 0}
                    className={`h-8 px-2.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 border ${nodes.filter(n => n.data?.screenshotUrl).length > 0
                        ? isDark
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                            : 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'
                        : isDark
                            ? 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-600 cursor-not-allowed'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    title="Preview recorded workflow as slideshow"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">{t('flows.editor.toolbar.preview')}</span>
                </button>

                {/* Divider */}
                <div className={`w-px h-5 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />

                {/* Save Button with status indicator */}
                <button
                    onClick={handleManualSave}
                    disabled={saving}
                    className={`h-8 px-3 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 border ${saving
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                        : lastSaved
                            ? isDark
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                            : isDark
                                ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 border-[#2a2a2a]'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                    title={saving ? 'Saving...' : lastSaved ? 'Saved' : 'Save workflow'}
                >
                    {saving ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : lastSaved ? (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                    )}
                    <span className="hidden sm:inline">{saving ? t('flows.editor.toolbar.saving') : lastSaved ? t('flows.editor.toolbar.saved') : t('flows.editor.toolbar.save')}</span>
                </button>

                {/* Deploy Button - compact */}
                <button className={`h-8 px-2.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">{t('flows.editor.toolbar.deploy')}</span>
                </button>

                {/* Language Switcher */}
                <div className="relative">
                    <button
                        onClick={() => modals.langDropdown.isOpen ? closeModal('langDropdown') : openModal('langDropdown')}
                        className={`h-8 px-2 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 border ${isDark
                            ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 border-[#2a2a2a] hover:border-[#3a3a3a]'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                            }`}
                        title="Change Language"
                    >
                        <span className="text-sm">{getCurrentLanguage() === 'vi' ? '🇻🇳' : '🇺🇸'}</span>
                        <span className="hidden sm:inline uppercase">{getCurrentLanguage()}</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Language Dropdown */}
                    {modals.langDropdown.isOpen && (
                        <div className={`absolute top-full right-0 mt-1 w-32 rounded-lg shadow-xl border overflow-hidden z-50 ${isDark
                            ? 'bg-[#1a1a1a] border-[#2a2a2a]'
                            : 'bg-white border-gray-200'
                            }`}>
                            <button
                                onClick={() => {
                                    changeLanguage('vi');
                                    closeModal('langDropdown');
                                }}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${getCurrentLanguage() === 'vi'
                                    ? isDark
                                        ? 'bg-cyan-500/20 text-cyan-400'
                                        : 'bg-cyan-50 text-cyan-600'
                                    : isDark
                                        ? 'hover:bg-[#252525] text-gray-300'
                                        : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                            >
                                <span>🇻🇳</span>
                                <span>Tiếng Việt</span>
                            </button>
                            <button
                                onClick={() => {
                                    changeLanguage('en');
                                    closeModal('langDropdown');
                                }}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${getCurrentLanguage() === 'en'
                                    ? isDark
                                        ? 'bg-cyan-500/20 text-cyan-400'
                                        : 'bg-cyan-50 text-cyan-600'
                                    : isDark
                                        ? 'hover:bg-[#252525] text-gray-300'
                                        : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                            >
                                <span>🇺🇸</span>
                                <span>English</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
