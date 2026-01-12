import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * FileInputNode - Allows selecting files from user's media library
 */
function FileInputNode({ data, selected, id }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [showMediaBrowser, setShowMediaBrowser] = useState(false);

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    const fileType = data?.fileType || 'any'; // any, image, video, document
    const fileName = data?.fileName || null;
    const filePath = data?.filePath || null;
    const fileSize = data?.fileSize || '';

    const handleBrowseClick = (e) => {
        e.stopPropagation();
        // Open media browser modal
        if (data?.onBrowseMedia) {
            data.onBrowseMedia(id);
        }
        setShowMediaBrowser(true);
    };

    const getFileIcon = () => {
        switch (fileType) {
            case 'image':
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                );
            case 'video':
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                );
            case 'document':
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                );
            default:
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                );
        }
    };

    return (
        <div className={`transition-all duration-300 ${selected ? 'scale-105' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            <Handle
                type="target"
                position={Position.Top}
                className={`!w-3 !h-3 !border-0 !-top-1.5`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : '#06b6d4',
                    boxShadow: '0 0 8px rgba(6, 182, 212, 0.5)'
                }}
            />

            <div
                className={`relative min-w-[200px] rounded-xl overflow-hidden transition-all duration-300
                    ${selected ? `ring-2 ring-cyan-500 ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'}` : ''}`}
                style={{
                    background: isDark
                        ? 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)'
                        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
                    border: `1px solid ${isDark ? '#252525' : '#e5e7eb'}`,
                }}
            >
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: isRunning ? 'rgba(99, 102, 241, 0.15)' : 'rgba(6, 182, 212, 0.1)' }}
                >
                    <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center`}
                        style={{ background: isRunning ? 'rgba(99, 102, 241, 0.3)' : 'rgba(6, 182, 212, 0.2)' }}
                    >
                        <svg className={`w-4 h-4 ${isRunning ? 'text-indigo-400' : 'text-cyan-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            {getFileIcon()}
                        </svg>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isRunning ? 'text-indigo-400' : 'text-cyan-500'}`}>
                        {isSuccess ? 'File Selected' : isRunning ? 'Loading...' : 'Media Library'}
                    </span>
                </div>

                <div className={`px-3 py-3 border-t ${isDark ? 'border-[#252525] bg-[#141414]' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {data?.label || 'Select File'}
                    </p>

                    {fileName && filePath ? (
                        <div className={`mt-2 space-y-2`}>
                            {/* File Preview */}
                            {fileType === 'image' && filePath && (
                                <div className={`rounded-lg overflow-hidden border ${isDark ? 'border-[#252525]' : 'border-gray-200'}`}>
                                    <img
                                        src={filePath}
                                        alt={fileName}
                                        className="w-full h-24 object-cover"
                                    />
                                </div>
                            )}

                            <div className={`px-2 py-1.5 rounded text-xs font-mono ${isDark ? 'bg-[#0f0f0f] text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="truncate">{fileName}</span>
                                </div>
                                {fileSize && (
                                    <div className={`mt-1 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {fileSize}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleBrowseClick}
                                className={`w-full px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all ${isDark ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-600 border border-cyan-200'}`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Change File
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleBrowseClick}
                            className={`mt-2 w-full px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${isDark ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-600 border border-cyan-200'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            Browse Media Library
                        </button>
                    )}

                    <div className={`mt-2 flex items-center gap-1.5 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Select from your media library</span>
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className={`!w-3 !h-3 !border-0 !-bottom-1.5`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : '#06b6d4',
                    boxShadow: '0 0 8px rgba(6, 182, 212, 0.5)'
                }}
            />
        </div>
    );
}

export default memo(FileInputNode);
