import { useState, useEffect } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { aiStudioApi } from '@/services/api';
import AppLayout from '@/Layouts/AppLayout';
import { useToast } from '@/Components/Layout/ToastProvider';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useTheme } from '@/Contexts/ThemeContext';
import { Icon } from '@/Components/UI';

/**
 * Scenarios Management Page
 * List all user scenarios with status, progress, and actions
 */
export default function Scenarios({ scenarios = {}, currentCredits = 0 }) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const { showConfirm } = useConfirm();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [scenarioList, setScenarioList] = useState(scenarios.data || []);
    const [deleting, setDeleting] = useState(null);

    // Poll for active scenarios
    useEffect(() => {
        const activeScenarios = scenarioList.filter(s => ['queued', 'generating'].includes(s.status));
        if (activeScenarios.length === 0) return;

        const pollInterval = setInterval(async () => {
            try {
                const updates = await Promise.all(
                    activeScenarios.map(s => aiStudioApi.getScenarioStatus(s.id))
                );

                setScenarioList(prev => {
                    const updated = [...prev];
                    updates.forEach(res => {
                        const scenario = res.scenario;
                        const idx = updated.findIndex(s => s.id === scenario.id);
                        if (idx !== -1) updated[idx] = scenario;
                    });
                    return updated;
                });
            } catch (e) {
                console.error('Polling error:', e);
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [scenarioList]);

    const handleDelete = async (scenario) => {
        const confirmed = await showConfirm({
            title: 'Xóa kịch bản',
            message: `Bạn có chắc muốn xóa kịch bản "${scenario.title || 'Không tiêu đề'}"?`,
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            type: 'danger',
            icon: 'delete',
        });
        if (!confirmed) return;

        setDeleting(scenario.id);
        try {
            await aiStudioApi.deleteScenario(scenario.id);
            setScenarioList(prev => prev.filter(s => s.id !== scenario.id));
            addToast('Đã xóa kịch bản', 'success');
        } catch (error) {
            addToast('Không thể xóa', 'error');
        } finally {
            setDeleting(null);
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            draft: { label: 'Bản nháp', color: 'slate', icon: 'edit' },
            parsed: { label: 'Đã phân tích', color: 'blue', icon: 'ai' },
            queued: { label: 'Đang chờ', color: 'purple', icon: 'clock' },
            generating: { label: 'Đang tạo', color: 'amber', icon: 'credits' },
            completed: { label: 'Hoàn thành', color: 'emerald', icon: 'checkCircle' },
            failed: { label: 'Thất bại', color: 'red', icon: 'xCircle' },
            partial: { label: 'Một phần', color: 'orange', icon: 'exclamation' },
        };
        return configs[status] || configs.draft;
    };

    // Styles
    const glassCard = isDark
        ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]'
        : 'bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-lg';

    return (
        <AppLayout title="Quản lý kịch bản">
            <div className={`min-h-screen ${isDark ? 'bg-[#050505]' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-violet-600/10' : 'bg-violet-200/40'}`} />
                    <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-200/30'}`} />
                </div>

                <div className="relative max-w-7xl mx-auto px-6 py-6">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/ai-studio/scenarios/create" className={`p-2.5 rounded-xl transition-all ${glassCard} hover:scale-105`}>
                                <svg className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    <Icon name="video" className="w-5 h-5 inline-block mr-1" /> Quản lý Kịch bản
                                </h1>
                                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                    {scenarioList.length} kịch bản
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl ${glassCard}`}>
                                <Icon name="ai" className="w-5 h-5" />
                                <div>
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Credits</p>
                                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {currentCredits.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/ai-studio/scenarios/create"
                                className="px-5 py-3 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                            >
                                + Tạo kịch bản mới
                            </Link>
                        </div>
                    </header>

                    {/* Scenarios Table */}
                    {scenarioList.length === 0 ? (
                        <div className={`text-center py-20 rounded-2xl ${glassCard}`}>
                            <div className="mb-4"><Icon name="video" className="w-14 h-14 mx-auto" /></div>
                            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Chưa có kịch bản nào
                            </h3>
                            <p className={`mb-6 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                Bắt đầu tạo video từ kịch bản của bạn
                            </p>
                            <Link
                                href="/ai-studio/scenarios/create"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                            >
                                <Icon name="ai" className="w-5 h-5 inline-block mr-1" /> Tạo kịch bản đầu tiên
                            </Link>
                        </div>
                    ) : (
                        <div className={`rounded-2xl ${glassCard} overflow-hidden`}>
                            {/* Table Header */}
                            <div className={`grid grid-cols-12 gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b ${isDark ? 'border-white/5 text-slate-500' : 'border-slate-200 text-slate-500'}`}>
                                <div className="col-span-4">Kịch bản</div>
                                <div className="col-span-2">Trạng thái</div>
                                <div className="col-span-2">Tiến độ</div>
                                <div className="col-span-2">Ngày tạo</div>
                                <div className="col-span-2 text-right">Thao tác</div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-white/5">
                                {scenarioList.map((scenario) => {
                                    const statusConfig = getStatusConfig(scenario.status);
                                    const isActive = ['queued', 'generating'].includes(scenario.status);

                                    return (
                                        <div
                                            key={scenario.id}
                                            className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                                                } ${isActive ? 'bg-gradient-to-r from-amber-500/5 to-transparent' : ''}`}
                                        >
                                            {/* Title & Info */}
                                            <div className="col-span-4">
                                                <Link
                                                    href={`/ai-studio/scenarios/${scenario.id}`}
                                                    className={`font-medium hover:underline ${isDark ? 'text-white' : 'text-slate-900'}`}
                                                >
                                                    {scenario.title || 'Kịch bản không tiêu đề'}
                                                </Link>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        <>{scenario.output_type === 'video' ? <Icon name="video" className="w-3.5 h-3.5 inline-block mr-0.5" /> : <Icon name="media" className="w-3.5 h-3.5 inline-block mr-0.5" />} {scenario.total_scenes} cảnh</>
                                                    </span>
                                                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        <Icon name="diamond" className="w-3.5 h-3.5 inline-block mr-0.5" /> {scenario.total_credits} credits
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-2">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${isDark
                                                    ? `bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400 border border-${statusConfig.color}-500/30`
                                                    : `bg-${statusConfig.color}-100 text-${statusConfig.color}-700`
                                                    } ${isActive ? 'animate-pulse' : ''}`}>
                                                    <Icon name={statusConfig.icon} className="w-3.5 h-3.5" />
                                                    <span>{statusConfig.label}</span>
                                                </span>
                                            </div>

                                            {/* Progress */}
                                            <div className="col-span-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                                                        <div
                                                            className={`h-full transition-all duration-500 ${scenario.status === 'completed'
                                                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                                                : scenario.status === 'failed'
                                                                    ? 'bg-gradient-to-r from-red-500 to-red-400'
                                                                    : 'bg-gradient-to-r from-amber-500 to-amber-400'
                                                                }`}
                                                            style={{ width: `${scenario.progress || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-medium min-w-[3rem] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {scenario.progress || 0}%
                                                    </span>
                                                </div>
                                                <p className={`text-xs mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    {scenario.completed_scenes || 0}/{scenario.total_scenes} cảnh
                                                </p>
                                            </div>

                                            {/* Date */}
                                            <div className="col-span-2">
                                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                    {new Date(scenario.created_at).toLocaleDateString('vi-VN')}
                                                </p>
                                                <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    {new Date(scenario.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-2 flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/ai-studio/scenarios/${scenario.id}`}
                                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                                                        }`}
                                                    title="Xem chi tiết"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(scenario)}
                                                    disabled={deleting === scenario.id}
                                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-100 text-slate-500 hover:text-red-600'
                                                        } disabled:opacity-50`}
                                                    title="Xóa"
                                                >
                                                    {deleting === scenario.id ? (
                                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {scenarios.last_page > 1 && (
                                <div className={`px-6 py-4 border-t ${isDark ? 'border-white/5' : 'border-slate-200'} flex items-center justify-between`}>
                                    <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Trang {scenarios.current_page} / {scenarios.last_page}
                                    </p>
                                    <div className="flex gap-2">
                                        {scenarios.prev_page_url && (
                                            <Link
                                                href={scenarios.prev_page_url}
                                                className={`px-4 py-2 rounded-lg text-sm ${glassCard}`}
                                            >
                                                ← Trước
                                            </Link>
                                        )}
                                        {scenarios.next_page_url && (
                                            <Link
                                                href={scenarios.next_page_url}
                                                className={`px-4 py-2 rounded-lg text-sm ${glassCard}`}
                                            >
                                                Sau →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
