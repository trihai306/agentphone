import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@inertiajs/react';
import axios from 'axios';

/**
 * Jobs Queue Panel - Shows active generations, scenarios, and recent history
 * Displays on the right side of AI Studio across all tabs
 */
export default function JobsQueuePanel({
    activeGenerations: initialGenerations = [],
    activeScenarios: initialScenarios = [],
    recentGenerations = [],
    isDark = false,
}) {
    const [generations, setGenerations] = useState(initialGenerations);
    const [scenarios, setScenarios] = useState(initialScenarios);
    const [selectedMedia, setSelectedMedia] = useState(null);

    const totalJobs = generations.length + scenarios.length;

    // Always poll for active jobs (to detect new jobs created after page load)
    useEffect(() => {
        const fetchActiveJobs = async () => {
            try {
                const response = await axios.get('/ai-studio/active-jobs');
                if (response.data) {
                    setGenerations(response.data.activeGenerations || []);
                    setScenarios(response.data.activeScenarios || []);
                }
            } catch (e) {
                console.error('Failed to fetch active jobs:', e);
            }
        };

        // Initial fetch after 2 seconds (give time for job to be created)
        const initialTimeout = setTimeout(fetchActiveJobs, 2000);

        // Then poll every 5 seconds
        const poll = setInterval(fetchActiveJobs, 5000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(poll);
        };
    }, []);

    const glassCard = isDark
        ? 'bg-white/[0.02] border border-white/[0.05]'
        : 'bg-white border border-slate-200';

    const handleMediaClick = (generation) => {
        if (generation.result_url && generation.status === 'completed') {
            setSelectedMedia(generation);
        }
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Active Jobs Section */}
            {totalJobs > 0 && (
                <div className={`rounded-2xl ${glassCard} overflow-hidden`}>
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
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

                    <div className="max-h-[300px] overflow-y-auto">
                        {/* Active Scenarios */}
                        {scenarios.map(s => (
                            <Link
                                key={s.id}
                                href={`/ai-studio/scenarios/${s.id}`}
                                className={`block px-4 py-3 border-b last:border-b-0 transition-colors ${isDark ? 'border-white/5 hover:bg-white/[0.02]' : 'border-slate-50 hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        🎬 {s.title || 'Kịch bản mới'}
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
                                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {s.progress || 0}%
                                    </span>
                                </div>
                            </Link>
                        ))}

                        {/* Active Generations */}
                        {generations.map(g => (
                            <div
                                key={g.id}
                                className={`px-4 py-3 border-b last:border-b-0 ${isDark ? 'border-white/5' : 'border-slate-50'}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`font-medium text-sm truncate max-w-[180px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {g.type === 'video' ? '🎥' : '🖼️'} {g.prompt?.substring(0, 25) || 'Generation'}...
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded animate-pulse ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                                        {g.status === 'pending' ? 'Chờ' : 'Đang tạo'}
                                    </span>
                                </div>
                                <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                                    <div className={`h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all ${g.status === 'processing' ? 'w-1/2 animate-pulse' : 'w-0'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State when no active jobs */}
            {totalJobs === 0 && (
                <div className={`p-4 rounded-2xl text-center ${glassCard}`}>
                    <div className="text-2xl mb-2">✨</div>
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Sẵn sàng tạo
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        Nhập prompt và click Generate
                    </p>
                </div>
            )}

            {/* Recent History Section */}
            {recentGenerations.length > 0 && (
                <div className={`rounded-2xl ${glassCard} overflow-hidden`}>
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                        <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            📜 Gần đây
                        </h3>
                    </div>
                    <div className="max-h-[250px] overflow-y-auto">
                        {recentGenerations.map(g => (
                            <div
                                key={g.id}
                                onClick={() => handleMediaClick(g)}
                                className={`px-4 py-3 border-b last:border-b-0 transition-colors ${g.result_url && g.status === 'completed' ? 'cursor-pointer' : 'cursor-default'
                                    } ${isDark ? 'border-white/5 hover:bg-white/[0.02]' : 'border-slate-50 hover:bg-slate-50'}`}
                            >
                                <div className="flex items-start gap-3">
                                    {g.result_url ? (
                                        <div className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                            {g.type === 'video' ? (
                                                <video src={g.result_url} className="w-full h-full object-cover" muted />
                                            ) : (
                                                <img src={g.result_url} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                    ) : (
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                            {g.status === 'failed' ? '❌' : g.type === 'video' ? '🎥' : '🖼️'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {g.prompt?.substring(0, 30) || 'Generation'}...
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded ${g.status === 'completed'
                                                ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                                : g.status === 'failed'
                                                    ? isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                                                    : isDark ? 'bg-slate-500/20 text-slate-400' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {g.status === 'completed' ? '✓' : g.status === 'failed' ? '✗' : g.status}
                                            </span>
                                            <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                {g.type === 'video' ? '🎥' : '🖼️'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link
                        href="/ai-studio/generations"
                        className={`block px-4 py-3 text-center text-sm font-medium transition-colors ${isDark ? 'text-violet-400 hover:bg-white/[0.02]' : 'text-violet-600 hover:bg-slate-50'}`}
                    >
                        Xem tất cả →
                    </Link>
                </div>
            )}

            {/* Media Preview Modal - Portal to escape z-index stacking context */}
            {selectedMedia && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                    onClick={() => setSelectedMedia(null)}
                >
                    <div
                        className={`relative max-w-4xl w-full rounded-2xl overflow-hidden border ${isDark
                            ? 'bg-[#1a1a1a] border-[#2a2a2a]'
                            : 'bg-white border-slate-200'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedMedia(null)}
                            className={`absolute top-4 right-4 z-10 p-2 rounded-xl transition-all ${isDark
                                ? 'bg-black/50 text-white hover:bg-black/70'
                                : 'bg-white/90 text-slate-600 hover:bg-white shadow-lg'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Media */}
                        <div className={`flex items-center justify-center min-h-[400px] max-h-[60vh] ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                            {selectedMedia.type === 'video' ? (
                                <video
                                    src={selectedMedia.result_url}
                                    className="max-h-[60vh] w-auto"
                                    controls
                                    autoPlay
                                />
                            ) : (
                                <img
                                    src={selectedMedia.result_url}
                                    alt={selectedMedia.prompt}
                                    className="max-h-[60vh] w-auto"
                                />
                            )}
                        </div>

                        {/* Info Panel */}
                        <div className="p-6">
                            <p className={`text-base mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {selectedMedia.prompt}
                            </p>

                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${selectedMedia.type === 'video'
                                    ? isDark
                                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                                        : 'bg-violet-50 text-violet-600 border-violet-200'
                                    : isDark
                                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                        : 'bg-sky-50 text-sky-600 border-sky-200'
                                    }`}>
                                    {selectedMedia.type === 'video' ? '🎬 Video' : '🖼️ Hình ảnh'}
                                </span>

                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${isDark
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                    }`}>
                                    ✓ Hoàn thành
                                </span>

                                {selectedMedia.model_name && (
                                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {selectedMedia.model_name}
                                    </span>
                                )}

                                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {new Date(selectedMedia.created_at).toLocaleDateString('vi-VN', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

