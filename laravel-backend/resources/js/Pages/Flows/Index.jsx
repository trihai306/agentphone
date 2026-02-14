import { useState, useEffect } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useTheme } from '@/Contexts/ThemeContext';
import { Modal, ModalFooter, Input, Textarea, Button, SearchInput } from '@/Components/UI';

export default function Index({ flows = { data: [] } }) {
    const { t } = useTranslation();
    const { showConfirm } = useConfirm();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFlowName, setNewFlowName] = useState('');
    const [newFlowDescription, setNewFlowDescription] = useState('');
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [filterStatus, setFilterStatus] = useState('all');
    const [hoveredCard, setHoveredCard] = useState(null);

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                setShowCreateModal(true);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    const handleCreate = (e) => {
        e.preventDefault();
        setCreating(true);
        router.post('/flows', { name: newFlowName, description: newFlowDescription }, {
            onFinish: () => {
                setCreating(false);
                setShowCreateModal(false);
                setNewFlowName('');
                setNewFlowDescription('');
            }
        });
    };

    const handleDelete = async (flowId, e) => {
        e.preventDefault();
        e.stopPropagation();
        const confirmed = await showConfirm({
            title: 'Delete Workflow',
            message: 'This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });
        if (confirmed) router.delete(`/flows/${flowId}`);
    };

    const handleDuplicate = (flowId, e) => {
        e.preventDefault();
        e.stopPropagation();
        router.post(`/flows/${flowId}/duplicate`);
    };

    const handleToggleStatus = (flowId, currentStatus, e) => {
        e.preventDefault();
        e.stopPropagation();
        router.put(`/flows/${flowId}`, { status: currentStatus === 'active' ? 'draft' : 'active' });
    };

    const filteredFlows = flows.data
        .filter(flow => filterStatus === 'all' || flow.status === filterStatus)
        .filter(flow => flow.name.toLowerCase().includes(searchQuery.toLowerCase()) || flow.description?.toLowerCase().includes(searchQuery.toLowerCase()));

    const stats = {
        total: flows.data.length,
        active: flows.data.filter(f => f.status === 'active').length,
        draft: flows.data.filter(f => f.status === 'draft').length,
    };

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    const flowColors = [
        { from: 'from-violet-500', to: 'to-purple-600', bg: 'bg-violet-500/10', text: 'text-violet-400' },
        { from: 'from-blue-500', to: 'to-cyan-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
        { from: 'from-emerald-500', to: 'to-teal-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
        { from: 'from-orange-500', to: 'to-amber-500', bg: 'bg-orange-500/10', text: 'text-orange-400' },
        { from: 'from-pink-500', to: 'to-rose-500', bg: 'bg-pink-500/10', text: 'text-pink-400' },
    ];

    const getFlowColor = (index) => flowColors[index % flowColors.length];

    return (
        <AppLayout title="Workflows">
            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background decoration */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-violet-900/20' : 'bg-violet-200/50'}`} />
                    <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-blue-900/20' : 'bg-blue-200/40'}`} />
                    <div className={`absolute -bottom-40 right-1/3 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-emerald-900/10' : 'bg-emerald-200/30'}`} />
                </div>

                <div className="relative max-w-[1400px] mx-auto px-6 py-8">
                    {/* Hero Header */}
                    <div className="flex items-start justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-4">
                                <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25`}>
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                    </svg>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#09090b]" />
                                </div>
                                <div>
                                    <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        Workflows
                                    </h1>
                                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        Build powerful automations with visual flow editor
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="gradient"
                            onClick={() => setShowCreateModal(true)}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            }
                        >
                            New Workflow
                            <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded bg-white/20 ml-1">N</kbd>
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-5 mb-8">
                        {[
                            { label: 'Total Workflows', value: stats.total, icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
                            { label: 'Active', value: stats.active, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
                            { label: 'Draft', value: stats.draft, icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`relative overflow-hidden p-5 rounded-2xl backdrop-blur-xl border transition-all hover:scale-[1.02] ${isDark
                                    ? 'bg-white/5 border-white/10 hover:border-white/20'
                                    : 'bg-white/80 border-gray-200/50 hover:border-gray-300 shadow-lg shadow-gray-200/50'
                                    }`}
                            >
                                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br ${stat.gradient} opacity-20`} />
                                <div className="relative flex items-center justify-between">
                                    <div>
                                        <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {stat.label}
                                        </p>
                                        <p className={`text-4xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.gradient} ${stat.shadow} shadow-lg`}>
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl backdrop-blur-xl border mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg shadow-gray-200/30'
                        }`}>
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                placeholder="Search workflows..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Status Filter Pills */}
                            <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                {['all', 'active', 'draft'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-4 py-2 text-xs font-medium rounded-lg capitalize transition-all ${filterStatus === status
                                            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                                            : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            {/* View Toggle */}
                            <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                {[{ mode: 'grid', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' }, { mode: 'list', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' }].map(({ mode, icon }) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`p-2.5 rounded-lg transition-all ${viewMode === mode
                                            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                                            : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Workflows Grid */}
                    {filteredFlows.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredFlows.map((flow, index) => {
                                    const color = getFlowColor(index);
                                    return (
                                        <Link
                                            key={flow.id}
                                            href={`/flows/${flow.id}/edit`}
                                            onMouseEnter={() => setHoveredCard(flow.id)}
                                            onMouseLeave={() => setHoveredCard(null)}
                                            className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300 ${isDark
                                                ? 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                                : 'bg-white/80 border-gray-200/50 hover:border-gray-300 hover:shadow-xl shadow-lg shadow-gray-200/30'
                                                } ${hoveredCard === flow.id ? 'scale-[1.02]' : ''}`}
                                        >
                                            {/* Gradient Header */}
                                            <div className={`relative h-28 bg-gradient-to-br ${color.from} ${color.to} p-4`}>
                                                {/* Decorative nodes */}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                                    <svg className="w-full h-full" viewBox="0 0 200 100">
                                                        <circle cx="30" cy="50" r="8" fill="white" />
                                                        <line x1="40" y1="50" x2="80" y2="50" stroke="white" strokeWidth="2" />
                                                        <rect x="82" y="38" width="36" height="24" rx="4" fill="white" />
                                                        <line x1="120" y1="50" x2="160" y2="50" stroke="white" strokeWidth="2" />
                                                        <circle cx="170" cy="50" r="8" fill="white" />
                                                    </svg>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="absolute top-3 right-3">
                                                    <button
                                                        onClick={(e) => handleToggleStatus(flow.id, flow.status, e)}
                                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md transition-all ${flow.status === 'active'
                                                            ? 'bg-emerald-500/20 text-white border border-emerald-400/30'
                                                            : 'bg-black/20 text-white/80 border border-white/20'
                                                            }`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${flow.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-white/50'}`} />
                                                        {flow.status === 'active' ? 'Active' : 'Draft'}
                                                    </button>
                                                </div>

                                                {/* Node count */}
                                                <div className="absolute bottom-3 left-3">
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-black/20 text-white backdrop-blur-md border border-white/10">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                        </svg>
                                                        {flow.nodes_count || 0} nodes
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5">
                                                <h3 className={`font-semibold text-lg truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {flow.name}
                                                </h3>
                                                <p className={`text-sm mt-1.5 line-clamp-2 h-10 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    {flow.description || 'No description provided'}
                                                </p>

                                                {/* Footer */}
                                                <div className={`flex items-center justify-between mt-5 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${color.from} ${color.to} flex items-center justify-center`}>
                                                            <span className="text-[10px] font-bold text-white">{flow.name.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            Updated {getTimeAgo(flow.updated_at)}
                                                        </span>
                                                    </div>

                                                    <div className={`flex items-center gap-1 transition-opacity ${hoveredCard === flow.id ? 'opacity-100' : 'opacity-0'}`}>
                                                        <Link
                                                            href={`/flows/${flow.id}/run`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400' : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-600'}`}
                                                            title="Run"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </Link>
                                                        <button
                                                            onClick={(e) => handleDuplicate(flow.id, e)}
                                                            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
                                                            title="Duplicate"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDelete(flow.id, e)}
                                                            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                                                            title="Delete"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            /* List View */
                            <div className={`rounded-2xl overflow-hidden backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                {filteredFlows.map((flow, index) => {
                                    const color = getFlowColor(index);
                                    return (
                                        <Link
                                            key={flow.id}
                                            href={`/flows/${flow.id}/edit`}
                                            className={`flex items-center gap-4 p-5 border-b last:border-b-0 transition-all ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${color.from} ${color.to} shadow-lg ${color.shadow}`}>
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{flow.name}</h3>
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${flow.status === 'active'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                        : isDark ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${flow.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                                        {flow.status}
                                                    </span>
                                                </div>
                                                <p className={`text-sm truncate mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{flow.description || 'No description'}</p>
                                            </div>
                                            <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{flow.nodes_count || 0} nodes</div>
                                            <div className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{getTimeAgo(flow.updated_at)}</div>
                                            <div className="flex items-center gap-1">
                                                <Link href={`/flows/${flow.id}/run`} onClick={(e) => e.stopPropagation()} className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-emerald-500/20 text-gray-500 hover:text-emerald-400' : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-600'}`} title="Run">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </Link>
                                                <button onClick={(e) => handleDuplicate(flow.id, e)} className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-gray-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                </button>
                                                <button onClick={(e) => handleDelete(flow.id, e)} className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        /* Empty State */
                        <div className={`relative overflow-hidden rounded-2xl p-16 text-center backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-violet-500 to-purple-600`} />
                            <div className="relative">
                                <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 mb-6">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                    </svg>
                                </div>
                                <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {searchQuery ? 'No workflows found' : 'Create your first workflow'}
                                </h3>
                                <p className={`text-sm mb-8 max-w-md mx-auto ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {searchQuery ? `No results for "${searchQuery}"` : 'Build powerful automations to control your devices with our visual flow editor'}
                                </p>
                                {!searchQuery && (
                                    <Button
                                        variant="gradient"
                                        onClick={() => setShowCreateModal(true)}
                                        icon={
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        }
                                    >
                                        Create Workflow
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {flows.last_page > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            {flows.prev_page_url && (
                                <Link href={flows.prev_page_url} className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                                    ← Previous
                                </Link>
                            )}
                            <span className={`px-4 py-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Page {flows.current_page} of {flows.last_page}
                            </span>
                            {flows.next_page_url && (
                                <Link href={flows.next_page_url} className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                                    Next →
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Create New Workflow"
                    size="md"
                    footer={
                        <ModalFooter
                            cancelText="Cancel"
                            confirmText={creating ? 'Creating...' : 'Create Workflow'}
                            onCancel={() => setShowCreateModal(false)}
                            onConfirm={handleCreate}
                            isLoading={creating}
                        />
                    }
                >
                    <form onSubmit={handleCreate} className="space-y-5">
                        <Input
                            label="Workflow Name *"
                            value={newFlowName}
                            onChange={(e) => setNewFlowName(e.target.value)}
                            required
                            autoFocus
                            placeholder="e.g., Morning Routine"
                        />
                        <Textarea
                            label="Description"
                            value={newFlowDescription}
                            onChange={(e) => setNewFlowDescription(e.target.value)}
                            rows={3}
                            resize="none"
                            placeholder="What does this workflow do?"
                        />
                    </form>
                </Modal>
            </div>
        </AppLayout>
    );
}
