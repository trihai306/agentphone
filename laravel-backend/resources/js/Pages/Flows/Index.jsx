import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function Index({ flows = { data: [] } }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFlowName, setNewFlowName] = useState('');
    const [newFlowDescription, setNewFlowDescription] = useState('');
    const [creating, setCreating] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');

    const handleCreate = (e) => {
        e.preventDefault();
        setCreating(true);
        router.post('/flows', {
            name: newFlowName,
            description: newFlowDescription,
        }, {
            onFinish: () => {
                setCreating(false);
                setShowCreateModal(false);
                setNewFlowName('');
                setNewFlowDescription('');
            }
        });
    };

    const handleDelete = (flowId, flowName) => {
        if (confirm(`Bạn có chắc chắn muốn xóa "${flowName}"?`)) {
            router.delete(`/flows/${flowId}`);
        }
    };

    const handleDuplicate = (flowId) => {
        router.post(`/flows/${flowId}/duplicate`);
    };

    const getStatusConfig = (status) => {
        const configs = {
            draft: {
                label: 'Nháp',
                color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                dot: 'bg-slate-400',
            },
            active: {
                label: 'Hoạt động',
                color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
                dot: 'bg-emerald-500',
            },
            archived: {
                label: 'Lưu trữ',
                color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
                dot: 'bg-amber-500',
            },
        };
        return configs[status] || configs.draft;
    };

    const filteredFlows = flows.data.filter(flow =>
        flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flow.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: flows.data.length,
        active: flows.data.filter(f => f.status === 'active').length,
        draft: flows.data.filter(f => f.status === 'draft').length,
        totalNodes: flows.data.reduce((sum, f) => sum + (f.nodes_count || 0), 0),
    };

    return (
        <AppLayout title="Flow Builder">
            {/* Hero Header */}
            <div className="relative mb-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-fuchsia-600/10 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-fuchsia-900/20 rounded-3xl"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5MzljOTkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>

                <div className="relative px-8 py-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-start gap-5">
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                    </svg>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-900">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                                    Flow Builder
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 max-w-lg">
                                    Xây dựng workflow automation với visual node editor. Kéo thả, kết nối và tự động hóa quy trình.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="group relative inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <svg className="w-5 h-5 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="relative">Tạo Flow mới</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Tổng Flows', value: stats.total, icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', gradient: 'from-violet-500 to-purple-600' },
                    { label: 'Đang hoạt động', value: stats.active, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-emerald-500 to-teal-600' },
                    { label: 'Bản nháp', value: stats.draft, icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', gradient: 'from-slate-500 to-gray-600' },
                    { label: 'Tổng Nodes', value: stats.totalNodes, icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z', gradient: 'from-amber-500 to-orange-600' },
                ].map((stat, index) => (
                    <div key={index} className="group relative bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none transition-all duration-300">
                        <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Tìm kiếm flows..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Flows Grid/List */}
            {filteredFlows.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredFlows.map((flow) => {
                            const status = getStatusConfig(flow.status);
                            return (
                                <div
                                    key={flow.id}
                                    className="group relative bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 dark:hover:shadow-purple-500/5 transition-all duration-500 hover:-translate-y-1"
                                >
                                    {/* Preview Header */}
                                    <div className="relative h-40 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
                                        <div className="absolute inset-0 p-4">
                                            <div className="relative w-full h-full">
                                                {flow.nodes_count > 0 ? (
                                                    <>
                                                        <div className="absolute top-2 left-4 w-16 h-8 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                        </div>
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-10 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                        </div>
                                                        <div className="absolute bottom-2 right-4 w-16 h-8 bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                                        </div>
                                                        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                                                            <path d="M 44 26 Q 80 50 90 65" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-gray-300 dark:text-gray-600" strokeDasharray="4 2" />
                                                            <path d="M 110 75 Q 140 90 160 105" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-gray-300 dark:text-gray-600" strokeDasharray="4 2" />
                                                        </svg>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
                                                        <div className="text-center">
                                                            <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                            </svg>
                                                            <p className="text-xs">Chưa có node</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="absolute top-3 right-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
                                            <Link
                                                href={`/flows/${flow.id}/edit`}
                                                className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                                            >
                                                Mở Editor
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                                            {flow.name}
                                        </h3>
                                        {flow.description && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                                                {flow.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                                                    </svg>
                                                    {flow.nodes_count}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                                    </svg>
                                                    {flow.edges_count}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {new Date(flow.updated_at).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="px-5 pb-5 pt-0 flex items-center gap-2">
                                        <Link
                                            href={`/flows/${flow.id}/edit`}
                                            className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-center font-semibold rounded-xl transition-all"
                                        >
                                            Chỉnh sửa
                                        </Link>
                                        <button
                                            onClick={() => handleDuplicate(flow.id)}
                                            className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                            title="Nhân bản"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(flow.id, flow.name)}
                                            className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                            title="Xóa"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Flow</th>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                                        <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nodes</th>
                                        <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Edges</th>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cập nhật</th>
                                        <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredFlows.map((flow) => {
                                        const status = getStatusConfig(flow.status);
                                        return (
                                            <tr key={flow.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{flow.name}</p>
                                                            {flow.description && (
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{flow.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="font-semibold text-gray-900 dark:text-white">{flow.nodes_count}</span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="font-semibold text-gray-900 dark:text-white">{flow.edges_count}</span>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(flow.updated_at).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={`/flows/${flow.id}/edit`}
                                                            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition-all"
                                                        >
                                                            Mở
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDuplicate(flow.id)}
                                                            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(flow.id, flow.name)}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : (
                <div className="relative bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 p-16 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10"></div>
                    <div className="relative">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/30">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            {searchQuery ? 'Không tìm thấy Flow' : 'Bắt đầu với Flow đầu tiên'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            {searchQuery
                                ? `Không có flow nào khớp với "${searchQuery}".`
                                : 'Tạo workflow automation đầu tiên. Kéo thả nodes, kết nối và tự động hóa.'
                            }
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/30 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                Tạo Flow đầu tiên
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Pagination */}
            {flows.last_page > 1 && (
                <div className="mt-8 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Trang <span className="font-semibold text-gray-900 dark:text-white">{flows.current_page}</span> / {flows.last_page}
                    </p>
                    <div className="flex items-center gap-2">
                        {flows.prev_page_url && (
                            <Link href={flows.prev_page_url} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                Trước
                            </Link>
                        )}
                        {flows.next_page_url && (
                            <Link href={flows.next_page_url} className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors">
                                Sau
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="relative px-6 py-8 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Tạo Flow mới</h2>
                            <p className="text-white/80 mt-1">Bắt đầu xây dựng workflow automation</p>
                        </div>

                        <form onSubmit={handleCreate} className="p-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Tên Flow <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newFlowName}
                                        onChange={(e) => setNewFlowName(e.target.value)}
                                        required
                                        autoFocus
                                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                                        placeholder="Ví dụ: Email Marketing Automation"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mô tả</label>
                                    <textarea
                                        value={newFlowDescription}
                                        onChange={(e) => setNewFlowDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 resize-none transition-all"
                                        placeholder="Mô tả ngắn về workflow này..."
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newFlowName}
                                    className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {creating ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Tạo Flow
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
