import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * FileInputNode - Premium file/folder selector node for workflow automation
 * Supports:
 * - Single file selection (fixed file path)
 * - Folder selection (random file from folder at runtime)
 */
function FileInputNode({ data, selected, id }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isHovered, setIsHovered] = useState(false);

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    // Selection type: 'file' or 'folder'
    const selectionType = data?.selectionType || 'file';
    const fileName = data?.fileName || null;
    const filePath = data?.filePath || null;
    const folderName = data?.folderName || null;
    const folderPath = data?.folderPath || null;
    const fileType = data?.fileType || 'any';
    const fileSize = data?.fileSize || '';

    const hasSelection = (selectionType === 'file' && fileName) ||
        (selectionType === 'folder' && folderName);

    const handleBrowseClick = (e) => {
        e.stopPropagation();
        if (data?.onBrowseMedia) {
            data.onBrowseMedia(id);
        }
    };

    // Get status color
    const getStatusColor = () => {
        if (isRunning) return { primary: '#8b5cf6', secondary: 'rgba(139, 92, 246, 0.15)' };
        if (isSuccess) return { primary: '#10b981', secondary: 'rgba(16, 185, 129, 0.15)' };
        if (isError) return { primary: '#ef4444', secondary: 'rgba(239, 68, 68, 0.15)' };
        if (selectionType === 'folder') return { primary: '#f59e0b', secondary: 'rgba(245, 158, 11, 0.1)' };
        return { primary: '#8b5cf6', secondary: 'rgba(139, 92, 246, 0.1)' };
    };

    const statusColor = getStatusColor();

    // Detect file type from path
    const getDetectedFileType = () => {
        if (selectionType === 'folder') return 'folder';
        if (fileType !== 'any') return fileType;
        if (!filePath) return 'any';
        const ext = filePath.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
        if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
        if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(ext)) return 'document';
        return 'any';
    };

    const detectedType = getDetectedFileType();

    // Format file size
    const formatSize = (size) => {
        if (!size) return '';
        if (typeof size === 'string') return size;
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div
            className={`transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isRunning ? 'animate-pulse' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !border-2 !-top-1.5"
                style={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderColor: statusColor.primary,
                    boxShadow: `0 0 8px ${statusColor.primary}40`
                }}
            />

            {/* Main Card */}
            <div
                className={`relative min-w-[240px] max-w-[280px] rounded-2xl overflow-hidden transition-all duration-300
                    ${selected ? `ring-2 ring-offset-2 ${isDark ? 'ring-violet-500 ring-offset-[#0a0a0a]' : 'ring-violet-500 ring-offset-white'}` : ''}
                    ${isHovered && !selected ? isDark ? 'ring-1 ring-white/10' : 'ring-1 ring-violet-200' : ''}`}
                style={{
                    background: isDark
                        ? 'linear-gradient(135deg, #1f1f23 0%, #18181b 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    boxShadow: isDark
                        ? `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`
                        : `0 8px 32px rgba(139, 92, 246, 0.08), 0 2px 8px rgba(0,0,0,0.04)`,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(139, 92, 246, 0.1)'}`,
                }}
            >
                {/* Header */}
                <div
                    className="relative px-4 py-3"
                    style={{
                        background: `linear-gradient(135deg, ${statusColor.secondary} 0%, transparent 100%)`,
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(139, 92, 246, 0.08)'}`
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{
                                    background: `linear-gradient(135deg, ${statusColor.primary}20 0%, ${statusColor.primary}30 100%)`,
                                    boxShadow: `0 2px 8px ${statusColor.primary}20`
                                }}
                            >
                                {selectionType === 'folder' ? (
                                    <svg className="w-5 h-5" style={{ color: statusColor.primary }} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M10 4H2v16h20V6H12l-2-2z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4.5 h-4.5" style={{ color: statusColor.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <span className={`text-xs font-semibold uppercase tracking-wide`} style={{ color: statusColor.primary }}>
                                    {selectionType === 'folder' ? 'Folder (Random)' : 'Media File'}
                                </span>
                                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {isRunning ? 'Đang xử lý...' : isSuccess ? 'Đã load' : hasSelection ? 'Đã chọn' : 'Chưa chọn'}
                                </p>
                            </div>
                        </div>

                        {/* Status/Random Badge */}
                        {selectionType === 'folder' && hasSelection && (
                            <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                                🎲 Random
                            </span>
                        )}

                        {(isRunning || isSuccess || isError) && (
                            <div
                                className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'animate-pulse' : ''}`}
                                style={{
                                    backgroundColor: statusColor.primary,
                                    boxShadow: `0 0 8px ${statusColor.primary}`
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className={`px-4 py-4 ${isDark ? 'bg-[#18181b]' : 'bg-white'}`}>
                    {hasSelection ? (
                        /* Selection Preview */
                        <div className="space-y-3">
                            {selectionType === 'folder' ? (
                                /* Folder Selection Display */
                                <div
                                    className={`relative rounded-xl overflow-hidden group cursor-pointer p-4 text-center`}
                                    style={{
                                        background: isDark ? '#0f0f12' : '#fffbeb',
                                        border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.3)'}`
                                    }}
                                    onClick={handleBrowseClick}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-14 h-14 flex items-center justify-center">
                                            <svg className="w-10 h-10 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M10 4H2v16h20V6H12l-2-2z" />
                                            </svg>
                                        </div>
                                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {folderName}
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                            Random file mỗi lần chạy
                                        </p>
                                    </div>

                                    {/* Hover overlay */}
                                    <div className={`absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl`}>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Đổi folder
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* File Selection Display */
                                <div
                                    className={`relative rounded-xl overflow-hidden group cursor-pointer`}
                                    style={{
                                        background: isDark ? '#0f0f12' : '#f8fafc',
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
                                    }}
                                    onClick={handleBrowseClick}
                                >
                                    {/* Image Preview */}
                                    {detectedType === 'image' && filePath && (
                                        <div className="relative aspect-video">
                                            <img
                                                src={filePath}
                                                alt={fileName}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className={`absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    Đổi file
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Video Preview */}
                                    {detectedType === 'video' && (
                                        <div className="relative aspect-video flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className={`absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                                                    Đổi file
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Document/Other Preview */}
                                    {(detectedType === 'document' || detectedType === 'any') && !filePath?.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov)$/i) && (
                                        <div className="p-4 flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-violet-500/20' : 'bg-violet-50'}`}>
                                                <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {fileName}
                                                </p>
                                                {fileSize && (
                                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {formatSize(fileSize)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* File Info Bar */}
                            {selectionType === 'file' && (
                                <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className={`text-xs font-medium truncate max-w-[140px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                            {fileName}
                                        </span>
                                    </div>
                                    {fileSize && (
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                            {formatSize(fileSize)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Empty State - Dropzone */
                        <button
                            onClick={handleBrowseClick}
                            className={`w-full group rounded-xl border-2 border-dashed transition-all duration-300 ${isDark
                                ? 'border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5'
                                : 'border-gray-200 hover:border-violet-400 hover:bg-violet-50/50'
                                }`}
                        >
                            <div className="py-6 px-4 flex flex-col items-center">
                                <div
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${isDark
                                        ? 'bg-violet-500/10 group-hover:bg-violet-500/20'
                                        : 'bg-violet-50 group-hover:bg-violet-100'
                                        }`}
                                >
                                    <svg className={`w-7 h-7 transition-colors ${isDark ? 'text-violet-400' : 'text-violet-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                    </svg>
                                </div>

                                <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Chọn File hoặc Folder
                                </p>
                                <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    File cố định hoặc Folder để random
                                </p>

                                <div className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${isDark
                                    ? 'bg-violet-500/20 text-violet-400 group-hover:bg-violet-500/30'
                                    : 'bg-violet-100 text-violet-600 group-hover:bg-violet-200'
                                    }`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Mở Media Library
                                </div>
                            </div>
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div
                    className={`px-4 py-2.5 flex items-center gap-2 text-[10px]`}
                    style={{
                        background: isDark ? '#0f0f12' : '#f8fafc',
                        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`
                    }}
                >
                    <svg className={`w-3.5 h-3.5 ${isDark ? 'text-violet-400' : 'text-violet-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <code className={`font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {`{{${data?.outputVariable || 'filePath'}}}`}
                    </code>
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !border-2 !-bottom-1.5"
                style={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderColor: statusColor.primary,
                    boxShadow: `0 0 8px ${statusColor.primary}40`
                }}
            />
        </div>
    );
}

export default memo(FileInputNode);
