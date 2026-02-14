import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/UI';

/**
 * RecordingPreview - Professional animated slideshow of recorded workflow actions
 * Shows step-by-step execution with tap/swipe indicators
 * Enhanced to show ALL actions with fallback for missing screenshots
 */
function RecordingPreview({ nodes = [], autoPlay = true, loop = true, interval = 2000 }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { t } = useTranslation();
    const containerRef = useRef(null);

    // Filter action nodes (exclude start/end/control nodes)
    const actionNodes = nodes.filter(n => {
        const type = n.type || n.data?.eventType;
        const excludeTypes = ['input', 'output', 'start', 'end', 'condition', 'loop', 'data_source'];
        return !excludeTypes.includes(type);
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Auto-advance slides with smooth transitions
    useEffect(() => {
        if (!isPlaying || actionNodes.length <= 1) return;

        const timer = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex(prev => {
                    const next = prev + 1;
                    if (next >= actionNodes.length) {
                        if (loop) return 0;
                        setIsPlaying(false);
                        return prev;
                    }
                    return next;
                });
                setIsTransitioning(false);
            }, 200);
        }, interval / playbackSpeed);

        return () => clearInterval(timer);
    }, [isPlaying, actionNodes.length, interval, playbackSpeed, loop]);

    // Scroll thumbnail into view
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const thumbnail = container.querySelector(`[data-index="${currentIndex}"]`);
        if (thumbnail) {
            thumbnail.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [currentIndex]);

    const currentNode = actionNodes[currentIndex] || null;

    const goToNext = useCallback(() => {
        if (currentIndex < actionNodes.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else if (loop) {
            setCurrentIndex(0);
        }
    }, [currentIndex, actionNodes.length, loop]);

    const goToPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else if (loop) {
            setCurrentIndex(actionNodes.length - 1);
        }
    }, [currentIndex, actionNodes.length, loop]);

    const togglePlayback = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    const cycleSpeed = useCallback(() => {
        setPlaybackSpeed(prev => {
            if (prev === 0.5) return 1;
            if (prev === 1) return 2;
            return 0.5;
        });
    }, []);

    if (actionNodes.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center h-64 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <svg className={`w-12 h-12 mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No actions recorded</p>
            </div>
        );
    }

    const eventType = currentNode?.data?.eventType || currentNode?.type || 'action';
    const hasScreenshot = !!currentNode?.data?.screenshotUrl;

    return (
        <div className="relative">
            {/* Main Display Container */}
            <div
                className={`relative overflow-hidden rounded-2xl transition-opacity duration-200 ${isTransitioning ? 'opacity-70' : 'opacity-100'}`}
                style={{
                    aspectRatio: hasScreenshot ? '9/16' : '16/9',
                    maxHeight: hasScreenshot ? '500px' : '300px',
                    background: isDark
                        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                }}
            >
                {/* Screenshot or Action Card */}
                {hasScreenshot ? (
                    <img
                        src={currentNode.data.screenshotUrl}
                        alt={`Step ${currentIndex + 1}`}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <ActionCard node={currentNode} index={currentIndex} total={actionNodes.length} isDark={isDark} />
                )}

                {/* Tap Indicator Overlay (only for screenshots) */}
                {hasScreenshot && currentNode?.data?.coordinates && (
                    <TapIndicator
                        x={currentNode.data.coordinates.x}
                        y={currentNode.data.coordinates.y}
                        type={eventType}
                        bounds={currentNode.data.bounds}
                    />
                )}

                {/* Top Overlay - Step Badge & Action Type */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
                        <span className="text-xs font-bold text-white">
                            Step {currentIndex + 1}/{actionNodes.length}
                        </span>
                    </div>

                    <div
                        className="px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5"
                        style={{ background: getActionColor(eventType) }}
                    >
                        <span className="text-sm">{getActionIcon(eventType)}</span>
                        <span className="text-xs font-bold text-white">
                            {getActionLabel(eventType)}
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${((currentIndex + 1) / actionNodes.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Controls */}
            <div className={`flex items-center justify-center gap-3 mt-4 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                {/* Previous Button */}
                <Button variant="secondary" size="icon-sm" onClick={goToPrev} className="rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Button>

                {/* Play/Pause Button */}
                <Button variant="gradient" size="icon-sm" onClick={togglePlayback} className="!w-14 !h-14 rounded-full">
                    {isPlaying ? (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </Button>

                {/* Next Button */}
                <Button variant="secondary" size="icon-sm" onClick={goToNext} className="rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Button>

                {/* Divider */}
                <div className={`w-px h-6 ${isDark ? 'bg-white/10' : 'bg-gray-300'}`} />

                {/* Speed Button */}
                <Button variant="secondary" size="sm" onClick={cycleSpeed}>
                    {playbackSpeed}x
                </Button>
            </div>

            {/* Thumbnails - Horizontal Scroll */}
            <div ref={containerRef} className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin">
                {actionNodes.map((node, idx) => {
                    const nodeType = node.data?.eventType || node.type;
                    const nodeHasScreenshot = !!node.data?.screenshotUrl;

                    return (
                        <button
                            key={node.id}
                            data-index={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`flex-shrink-0 w-14 h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === currentIndex
                                ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105'
                                : isDark ? 'border-white/10 hover:border-white/30' : 'border-gray-200 hover:border-gray-400'
                                }`}
                        >
                            {nodeHasScreenshot ? (
                                <img
                                    src={node.data?.screenshotUrl}
                                    alt={`Step ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex flex-col items-center justify-center"
                                    style={{ background: getActionColor(nodeType) }}
                                >
                                    <span className="text-lg">{getActionIcon(nodeType)}</span>
                                    <span className="text-[8px] text-white font-bold mt-0.5">{idx + 1}</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * ActionCard - Professional card display for actions without screenshots
 */
function ActionCard({ node, index, total, isDark }) {
    const eventType = node?.data?.eventType || node?.type || 'action';
    const label = node?.data?.label || getActionLabel(eventType);
    const text = node?.data?.text || node?.data?.inputText || '';
    const packageName = node?.data?.packageName || '';
    const coordinates = node?.data?.coordinates;

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            {/* Large Icon */}
            <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
                style={{
                    background: getActionColor(eventType),
                    boxShadow: `0 20px 40px ${getActionColor(eventType).replace('0.8', '0.3')}`,
                }}
            >
                <span className="text-5xl">{getActionIcon(eventType)}</span>
            </div>

            {/* Action Label */}
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {label}
            </h3>

            {/* Details */}
            <div className={`text-center space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {text && (
                    <p className="text-sm max-w-xs truncate">
                        "{text.length > 30 ? text.substring(0, 30) + '...' : text}"
                    </p>
                )}
                {packageName && (
                    <p className="text-xs opacity-60">
                        {packageName.split('.').pop()}
                    </p>
                )}
                {coordinates && (
                    <p className="text-xs opacity-40">
                        ({Math.round(coordinates.x)}, {Math.round(coordinates.y)})
                    </p>
                )}
            </div>

            {/* Step Indicator */}
            <div className={`mt-6 flex items-center gap-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${i === index % 10
                            ? 'bg-indigo-500 w-4'
                            : isDark ? 'bg-white/20' : 'bg-gray-300'
                            }`}
                    />
                ))}
                {total > 10 && <span className="text-xs ml-1">+{total - 10}</span>}
            </div>
        </div>
    );
}

/**
 * TapIndicator - Shows tap/swipe position on screenshot
 */
function TapIndicator({ x, y, type, bounds }) {
    const screenWidth = 1080;
    const screenHeight = 2400;

    const leftPercent = (x / screenWidth) * 100;
    const topPercent = (y / screenHeight) * 100;

    const isSwipe = type?.includes('swipe') || type?.includes('scroll');

    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
            }}
        >
            {isSwipe ? (
                <div className="relative">
                    <div className="w-8 h-8 rounded-full border-4 border-cyan-400 animate-ping" />
                    <div className="absolute inset-0 w-8 h-8 rounded-full bg-cyan-500/50 backdrop-blur-sm" />
                    <svg className="absolute inset-0 w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={getSwipePath(type)} />
                    </svg>
                </div>
            ) : (
                <div className="relative">
                    <div className="w-10 h-10 rounded-full border-4 border-red-400 animate-ping" />
                    <div className="absolute inset-1 w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-lg" />
                </div>
            )}
        </div>
    );
}

// Helper functions
function getActionColor(type) {
    const colors = {
        tap: 'rgba(239, 68, 68, 0.8)',
        click: 'rgba(239, 68, 68, 0.8)',
        text_input: 'rgba(168, 85, 247, 0.8)',
        set_text: 'rgba(168, 85, 247, 0.8)',
        scroll: 'rgba(245, 158, 11, 0.8)',
        scroll_up: 'rgba(245, 158, 11, 0.8)',
        scroll_down: 'rgba(245, 158, 11, 0.8)',
        swipe: 'rgba(6, 182, 212, 0.8)',
        swipe_left: 'rgba(6, 182, 212, 0.8)',
        swipe_right: 'rgba(6, 182, 212, 0.8)',
        swipe_up: 'rgba(6, 182, 212, 0.8)',
        swipe_down: 'rgba(6, 182, 212, 0.8)',
        long_press: 'rgba(236, 72, 153, 0.8)',
        long_tap: 'rgba(236, 72, 153, 0.8)',
        double_tap: 'rgba(249, 115, 22, 0.8)',
        open_app: 'rgba(34, 197, 94, 0.8)',
        back: 'rgba(107, 114, 128, 0.8)',
        home: 'rgba(107, 114, 128, 0.8)',
        key_event: 'rgba(107, 114, 128, 0.8)',
    };
    return colors[type] || 'rgba(99, 102, 241, 0.8)';
}

function getActionIcon(type) {
    const icons = {
        tap: '👆',
        click: '👆',
        text_input: '⌨️',
        set_text: '⌨️',
        scroll: '📜',
        scroll_up: '⬆️',
        scroll_down: '⬇️',
        swipe: '👋',
        swipe_left: '👈',
        swipe_right: '👉',
        swipe_up: '👆',
        swipe_down: '👇',
        long_press: '👇',
        long_tap: '👇',
        double_tap: '✌️',
        open_app: '📱',
        back: '◀️',
        home: '🏠',
        key_event: '⌨️',
    };
    return icons[type] || '⚡';
}

function getActionLabel(type) {
    const labels = {
        tap: 'Tap',
        click: 'Click',
        text_input: 'Type Text',
        set_text: 'Type Text',
        scroll: 'Scroll',
        scroll_up: 'Scroll Up',
        scroll_down: 'Scroll Down',
        swipe: 'Swipe',
        swipe_left: 'Swipe Left',
        swipe_right: 'Swipe Right',
        swipe_up: 'Swipe Up',
        swipe_down: 'Swipe Down',
        long_press: 'Long Press',
        long_tap: 'Long Press',
        double_tap: 'Double Tap',
        open_app: 'Open App',
        back: 'Back',
        home: 'Home',
        key_event: 'Key Press',
    };
    return labels[type] || (type ? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Action');
}

function getSwipePath(type) {
    if (type?.includes('up')) return 'M12 19V5m0 0l-4 4m4-4l4 4';
    if (type?.includes('down')) return 'M12 5v14m0 0l4-4m-4 4l-4-4';
    if (type?.includes('left')) return 'M19 12H5m0 0l4-4m-4 4l4 4';
    if (type?.includes('right')) return 'M5 12h14m0 0l-4-4m4 4l-4 4';
    return 'M12 19V5m0 0l-4 4m4-4l4 4';
}

export default memo(RecordingPreview);
