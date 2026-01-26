import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';

/**
 * Jobs Queue Panel - Shows active generations and scenarios
 * Displays on the right side of AI Studio across all tabs
 */
export default function JobsQueuePanel({
    activeGenerations: initialGenerations = [],
    activeScenarios: initialScenarios = [],
    isDark = false,
}) {
    const [generations, setGenerations] = useState(initialGenerations);
    const [scenarios, setScenarios] = useState(initialScenarios);

    const totalJobs = generations.length + scenarios.length;

    // Poll for updates
    useEffect(() => {
        if (totalJobs === 0) return;

        const poll = setInterval(async () => {
            try {
                // Poll generations
                if (generations.length > 0) {
                    const genUpdates = await Promise.all(
                        generations.map(g => axios.get(`/ai-studio/generations/${g.id}/status`).catch(() => null))
                    );
                    const updatedGens = genUpdates
                        .filter(r => r?.data?.generation)
                        .map(r => r.data.generation);
                    const stillActiveGens = updatedGens.filter(g => ['pending', 'processing'].includes(g.status));
                    setGenerations(stillActiveGens);
                }

                // Poll scenarios
                if (scenarios.length > 0) {
                    const scenarioUpdates = await Promise.all(
                        scenarios.map(s => axios.get(`/ai-studio/scenarios/${s.id}/status`).catch(() => null))
                    );
                    const updatedScenarios = scenarioUpdates
                        .filter(r => r?.data?.scenario)
                        .map(r => r.data.scenario);
                    const stillActiveScenarios = updatedScenarios.filter(s => ['queued', 'generating'].includes(s.status));
                    setScenarios(stillActiveScenarios);
                }
            } catch (e) {
                console.error('Jobs polling error:', e);
            }
        }, 5000);

        return () => clearInterval(poll);
    }, [generations.length, scenarios.length]);

    if (totalJobs === 0) {
        return (
            <div className={`p-4 rounded-2xl text-center ${isDark ? 'bg-white/[0.03] border border-white/[0.08]' : 'bg-white border border-slate-200'}`}>
                <div className="text-3xl mb-2">📭</div>
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Không có job đang chạy
                </p>
            </div>
        );
    }

    const glassCard = isDark
        ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]'
        : 'bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-sm';

    return (
        <div className={`rounded-2xl ${glassCard} overflow-hidden`}>
            {/* Header */}
            <div className={`px-4 py-3 border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Đang xử lý ({totalJobs})
                        </h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
                        Auto 5s
                    </span>
                </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
                {/* Scenarios */}
                {scenarios.length > 0 && (
                    <div className={`px-3 py-2 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                        <p className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            🎬 Kịch bản ({scenarios.length})
                        </p>
                        <div className="space-y-2">
                            {scenarios.map(s => (
                                <Link
                                    key={s.id}
                                    href={`/ai-studio/scenarios/${s.id}`}
                                    className={`block p-3 rounded-xl transition-colors ${isDark ? 'bg-black/20 hover:bg-black/30' : 'bg-slate-50 hover:bg-slate-100'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {s.title || 'Kịch bản mới'}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${s.status === 'queued'
                                                ? isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                                                : isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {s.status === 'queued' ? 'Chờ' : 'Đang tạo'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                                                style={{ width: `${s.progress || 0}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs min-w-[3rem] text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {s.progress || 0}%
                                        </span>
                                    </div>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                        {s.completed_scenes || 0}/{s.total_scenes} cảnh
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Generations */}
                {generations.length > 0 && (
                    <div className="px-3 py-2">
                        <p className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {generations[0]?.type === 'video' ? '🎥' : '🖼️'} Generations ({generations.length})
                        </p>
                        <div className="space-y-2">
                            {generations.map(g => (
                                <div
                                    key={g.id}
                                    className={`p-3 rounded-xl ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-medium text-sm truncate max-w-[150px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {g.prompt?.substring(0, 30) || 'Generation'}...
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${g.status === 'pending'
                                                ? isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                                                : isDark ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {g.status === 'pending' ? 'Chờ' : 'Đang tạo'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                                            <div className={`h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all ${g.status === 'processing' ? 'w-1/2 animate-pulse' : 'w-0'}`} />
                                        </div>
                                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {g.type === 'video' ? '🎥' : '🖼️'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
