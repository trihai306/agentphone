import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * ElementPickerModal - Professional UI for selecting elements from device
 * 
 * Features:
 * - Split view: Screenshot on left, Element list on right
 * - Visual element highlighting on screenshot
 * - Smart categorization (Buttons, Inputs, Text, etc.)
 * - Search and filter
 * - Real-time scanning
 * - OCR Mode: Detect text on screen using ML Kit OCR
 */
export default function ElementPickerModal({
    isOpen,
    onClose,
    onSelect,
    deviceId,
    userId,
    elementType = 'all', // 'clickable' | 'editable' | 'all'
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Mode: 'accessibility' (default) or 'ocr' (text detection)
    const [inspectMode, setInspectMode] = useState('accessibility');

    const [elements, setElements] = useState([]);
    const [textElements, setTextElements] = useState([]); // OCR detected text
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [packageName, setPackageName] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [hoveredElement, setHoveredElement] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(elementType || 'smart');
    const [screenshotData, setScreenshotData] = useState(null);
    const [screenDimensions, setScreenDimensions] = useState({ width: 1080, height: 2400 });
    const [imageNaturalDimensions, setImageNaturalDimensions] = useState(null);
    const [statusBarHeight, setStatusBarHeight] = useState(0);
    const [ocrProcessingTime, setOcrProcessingTime] = useState(0);
    const [selectedElement, setSelectedElement] = useState(null); // For showing detail panel

    // Categorize elements
    const categories = useMemo(() => {
        // Count clickable elements for smart view
        const clickableCount = elements.filter(el => el.isClickable || el.isEditable).length;

        const cats = {
            smart: { label: 'Smart', icon: '🧠', count: clickableCount },
            all: { label: 'Tất cả', icon: '📋', count: elements.length },
            clickable: { label: 'Buttons', icon: '👆', count: 0 },
            editable: { label: 'Inputs', icon: '✏️', count: 0 },
            text: { label: 'Text', icon: '📝', count: 0 },
            scrollable: { label: 'Scrollable', icon: '📜', count: 0 },
            checkable: { label: 'Checkboxes', icon: '☑️', count: 0 },
        };

        elements.forEach(el => {
            if (el.isClickable && !el.isEditable && !el.isCheckable) cats.clickable.count++;
            if (el.isEditable) cats.editable.count++;
            if (el.text && !el.isClickable && !el.isEditable) cats.text.count++;
            if (el.isScrollable) cats.scrollable.count++;
            if (el.isCheckable) cats.checkable.count++;
        });

        return cats;
    }, [elements]);

    // Listen for inspect results from socket (Accessibility mode)
    useEffect(() => {
        if (!isOpen || !userId) return;

        const handleResult = (data) => {
            console.log('📥 Element inspection result:', data);
            setLoading(false);

            if (data.success) {
                setElements(data.elements || []);
                setPackageName(data.package_name || '');
                setError(null);

                // Handle screenshot base64 data
                if (data.screenshot) {
                    setScreenshotData(data.screenshot);
                }

                // Handle screen dimensions (for element bounds)
                if (data.screen_width && data.screen_height) {
                    setScreenDimensions({
                        width: data.screen_width,
                        height: data.screen_height
                    });
                }

                // Handle screenshot dimensions (actual image size after scaling)
                if (data.screenshot_width && data.screenshot_height) {
                    setImageNaturalDimensions({
                        width: data.screenshot_width,
                        height: data.screenshot_height
                    });
                }

                // Handle status bar height
                if (data.status_bar_height !== undefined) {
                    setStatusBarHeight(data.status_bar_height);
                }
            } else {
                setError(data.error || 'Inspection failed');
                setElements([]);
            }
        };

        // Listen for OCR results (visual:result event)
        const handleVisualResult = (data) => {
            console.log('👁️ Visual inspection (OCR) result:', data);
            setLoading(false);

            if (data.success) {
                setTextElements(data.text_elements || []);
                setOcrProcessingTime(data.processing_time_ms || 0);
                setError(null);

                if (data.screenshot) {
                    setScreenshotData(data.screenshot);
                }

                if (data.screenshot_width && data.screenshot_height) {
                    setImageNaturalDimensions({
                        width: data.screenshot_width,
                        height: data.screenshot_height
                    });
                }

                if (data.screen_width && data.screen_height) {
                    setScreenDimensions({
                        width: data.screen_width,
                        height: data.screen_height
                    });
                }

                if (data.status_bar_height !== undefined) {
                    setStatusBarHeight(data.status_bar_height);
                }
            } else {
                setError(data.error || 'OCR failed');
                setTextElements([]);
            }
        };

        if (window.Echo) {
            const channel = window.Echo.private(`user.${userId}`);
            channel.listen('.inspect:result', handleResult);
            channel.listen('.visual:result', handleVisualResult);

            return () => {
                channel.stopListening('.inspect:result');
                channel.stopListening('.visual:result');
            };
        }
    }, [isOpen, userId]);

    // Auto-scan on open
    useEffect(() => {
        if (isOpen && deviceId && elements.length === 0 && textElements.length === 0) {
            requestElements();
        }
    }, [isOpen, deviceId]);

    // Request elements from device (Accessibility or OCR mode)
    const requestElements = useCallback(async () => {
        if (!deviceId) {
            setError('Chưa chọn thiết bị');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Call different endpoints based on mode
            const endpoint = inspectMode === 'ocr'
                ? '/devices/visual-inspect'
                : '/devices/inspect';

            const response = await window.axios.post(endpoint, {
                device_id: deviceId
            });

            if (!response.data.success) {
                setError(response.data.message);
                setLoading(false);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Không thể kết nối đến server';
            setError(message);
            setLoading(false);
        }
    }, [deviceId, inspectMode]);

    // Re-scan when mode changes
    useEffect(() => {
        if (isOpen && deviceId) {
            // Clear previous data
            if (inspectMode === 'ocr') {
                setElements([]);
            } else {
                setTextElements([]);
            }
            requestElements();
        }
    }, [inspectMode]);

    // Filter elements
    const filteredElements = useMemo(() => {
        return elements.filter(el => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                (el.text?.toLowerCase().includes(searchLower)) ||
                (el.contentDescription?.toLowerCase().includes(searchLower)) ||
                (el.resourceId?.toLowerCase().includes(searchLower)) ||
                (el.className?.toLowerCase().includes(searchLower));

            // Category filter
            let matchesCategory = selectedCategory === 'all';
            if (selectedCategory === 'clickable') matchesCategory = el.isClickable && !el.isEditable && !el.isCheckable;
            if (selectedCategory === 'editable') matchesCategory = el.isEditable;
            if (selectedCategory === 'text') matchesCategory = el.text && !el.isClickable && !el.isEditable;
            if (selectedCategory === 'scrollable') matchesCategory = el.isScrollable;
            if (selectedCategory === 'checkable') matchesCategory = el.isCheckable;

            return matchesSearch && matchesCategory;
        });
    }, [elements, searchQuery, selectedCategory]);

    // Smart grouped elements: group clickable parents with their children
    const smartGroupedElements = useMemo(() => {
        // Helper: check if child bounds are inside parent bounds
        const isChildOf = (child, parent) => {
            if (!child.bounds || !parent.bounds) return false;
            const c = child.bounds;
            const p = parent.bounds;
            return c.left >= p.left && c.top >= p.top &&
                (c.left + c.width) <= (p.left + p.width) &&
                (c.top + c.height) <= (p.top + p.height) &&
                // Exclude exact same bounds (same element)
                !(c.left === p.left && c.top === p.top && c.width === p.width && c.height === p.height);
        };

        // Get all clickable elements first
        const clickableElements = elements.filter(el => el.isClickable || el.isEditable);

        // For each clickable, find children with text/description
        const grouped = clickableElements.map(parent => {
            const children = elements.filter(child => {
                if (child === parent) return false;
                if (!isChildOf(child, parent)) return false;
                // Only include children with text or contentDescription
                return child.text || child.contentDescription;
            });
            return { parent, children };
        });

        // Sort by vertical position (top to bottom)
        grouped.sort((a, b) => (a.parent.bounds?.top || 0) - (b.parent.bounds?.top || 0));

        return grouped;
    }, [elements]);

    // Get element display name
    const getElementName = (el) => {
        if (el.text) return el.text.substring(0, 40) + (el.text.length > 40 ? '...' : '');
        if (el.contentDescription) return el.contentDescription.substring(0, 40);
        if (el.resourceId) return el.resourceId.split('/').pop();
        return el.className || 'Unknown Element';
    };

    // Get children with text for a clickable element (used in all views)
    const getChildrenWithText = useCallback((parent) => {
        if (!parent.bounds) return [];
        const p = parent.bounds;

        return elements.filter(child => {
            if (child === parent) return false;
            if (!child.bounds) return false;
            if (!(child.text || child.contentDescription)) return false;

            const c = child.bounds;
            // Check if child is inside parent
            return c.left >= p.left && c.top >= p.top &&
                (c.left + c.width) <= (p.left + p.width) &&
                (c.top + c.height) <= (p.top + p.height) &&
                !(c.left === p.left && c.top === p.top && c.width === p.width && c.height === p.height);
        }).slice(0, 3); // Max 3 children
    }, [elements]);

    // Find clickable parent for non-clickable element
    const findClickableParent = useCallback((el) => {
        if (el.isClickable || el.isEditable) return el;
        if (!el.bounds) return null;

        const c = el.bounds;
        // Find smallest clickable parent that contains this element
        const parents = elements.filter(parent => {
            if (!parent.isClickable && !parent.isEditable) return false;
            if (parent === el) return false;
            if (!parent.bounds) return false;

            const p = parent.bounds;
            return c.left >= p.left && c.top >= p.top &&
                (c.left + c.width) <= (p.left + p.width) &&
                (c.top + c.height) <= (p.top + p.height);
        });

        // Return the smallest parent (most specific)
        if (parents.length === 0) return null;
        parents.sort((a, b) => (a.bounds.width * a.bounds.height) - (b.bounds.width * b.bounds.height));
        return parents[0];
    }, [elements]);

    // Get element type icon
    const getElementIcon = (el) => {
        if (el.isEditable) return '✏️';
        if (el.isCheckable) return el.isChecked ? '☑️' : '⬜';
        if (el.isClickable) return '👆';
        if (el.isScrollable) return '📜';
        if (el.text) return '📝';
        return '📦';
    };

    // Get element type color
    const getElementColor = (el) => {
        if (el.isEditable) return { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' };
        if (el.isCheckable) return { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400' };
        if (el.isClickable) return { bg: 'bg-violet-500/20', border: 'border-violet-500/30', text: 'text-violet-400' };
        if (el.isScrollable) return { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400' };
        return { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400' };
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-4 z-[100] flex items-center justify-center">
                <div
                    className={`w-full max-w-6xl h-full max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col ${isDark ? 'bg-[#0f0f0f]' : 'bg-white'}`}
                    style={{
                        boxShadow: '0 25px 100px rgba(0, 0, 0, 0.5)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${inspectMode === 'ocr'
                                    ? (isDark ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/30' : 'bg-gradient-to-br from-emerald-100 to-teal-100')
                                    : (isDark ? 'bg-gradient-to-br from-violet-500/30 to-purple-500/30' : 'bg-gradient-to-br from-violet-100 to-purple-100')
                                    }`}>
                                    <span className="text-2xl">{inspectMode === 'ocr' ? '👁️' : '🔍'}</span>
                                </div>
                                <div>
                                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {inspectMode === 'ocr' ? 'OCR Text Detection' : 'Element Inspector'}
                                    </h2>
                                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {inspectMode === 'ocr'
                                            ? `${textElements.length} text elements detected ${ocrProcessingTime > 0 ? `(${ocrProcessingTime}ms)` : ''}`
                                            : (packageName || 'Đang chờ kết nối thiết bị...')
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Mode Toggle */}
                            <div className={`flex items-center p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                <button
                                    onClick={() => setInspectMode('accessibility')}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${inspectMode === 'accessibility'
                                        ? 'bg-violet-500 text-white shadow-lg'
                                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <span>🔍</span>
                                    Accessibility
                                </button>
                                <button
                                    onClick={() => setInspectMode('ocr')}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${inspectMode === 'ocr'
                                        ? 'bg-emerald-500 text-white shadow-lg'
                                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <span>👁️</span>
                                    OCR Text
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={requestElements}
                                    disabled={loading}
                                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${loading
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105'
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            Scanning...
                                        </>
                                    ) : (
                                        <>
                                            <span>🔄</span>
                                            Refresh
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={onClose}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Split View */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left: Device Preview */}
                        <div className={`w-80 flex-shrink-0 border-r ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'} p-4 flex flex-col`}>
                            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                📱 Device Preview
                            </h3>

                            {/* Device Frame with Screenshot */}
                            <div className="flex-1 flex items-center justify-center">
                                <div
                                    className={`relative rounded-3xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
                                    style={{
                                        width: '240px',
                                        height: '520px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                                        border: `3px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`
                                    }}
                                >
                                    {/* Notch */}
                                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-2xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-900'} z-20`} />

                                    {/* Screen Content - Full area for screenshot */}
                                    <div
                                        className="absolute rounded-2xl overflow-hidden"
                                        style={{
                                            left: '4px',
                                            right: '4px',
                                            top: '24px',
                                            bottom: '24px',
                                        }}
                                    >
                                        {/* Real Screenshot */}
                                        {screenshotData ? (() => {
                                            // Container display dimensions
                                            const containerWidth = 232;
                                            const containerHeight = 472;

                                            // Handle image load to get actual dimensions
                                            const handleImageLoad = (e) => {
                                                const img = e.target;
                                                if (img.naturalWidth && img.naturalHeight) {
                                                    setImageNaturalDimensions({
                                                        width: img.naturalWidth,
                                                        height: img.naturalHeight
                                                    });
                                                }
                                            };

                                            // Calculate the ratio between APK screen and actual screenshot
                                            // APK sends coordinates based on screenDimensions (e.g., 1080x2214)
                                            // Screenshot might be at different resolution (e.g., 540x1140)
                                            const imgWidth = imageNaturalDimensions?.width || screenDimensions.width || 1080;
                                            const imgHeight = imageNaturalDimensions?.height || screenDimensions.height || 2400;
                                            const scrWidth = screenDimensions.width || 1080;
                                            const scrHeight = screenDimensions.height || 2400;

                                            // Scale from APK coordinates -> actual image -> display container
                                            // Add safety to avoid division by zero
                                            const apkToImgX = scrWidth > 0 ? imgWidth / scrWidth : 1;
                                            const apkToImgY = scrHeight > 0 ? imgHeight / scrHeight : 1;
                                            const imgToDisplayX = imgWidth > 0 ? containerWidth / imgWidth : 1;
                                            const imgToDisplayY = imgHeight > 0 ? containerHeight / imgHeight : 1;

                                            // Combined scale: APK -> Display
                                            const scaleX = apkToImgX * imgToDisplayX;
                                            const scaleY = apkToImgY * imgToDisplayY;

                                            return (
                                                <div
                                                    className="relative w-full h-full"
                                                    style={{
                                                        width: `${containerWidth}px`,
                                                        height: `${containerHeight}px`,
                                                    }}
                                                >
                                                    {/* Screenshot fills the container */}
                                                    <img
                                                        src={`data:image/jpeg;base64,${screenshotData}`}
                                                        alt="Device Screenshot"
                                                        className="absolute inset-0 w-full h-full"
                                                        style={{ objectFit: 'fill' }}
                                                        onLoad={handleImageLoad}
                                                    />

                                                    {/* Element Bounds Overlay */}
                                                    <div className="absolute inset-0 overflow-visible">
                                                        {filteredElements.slice(0, 25).map((el, idx) => {
                                                            if (!el.bounds) return null;
                                                            const b = el.bounds;
                                                            const isHovered = hoveredElement === idx;
                                                            const colors = getElementColor(el);

                                                            // Adjust bounds.top for status bar offset
                                                            // Element bounds include status bar, but screenshot may not
                                                            const adjustedTop = Math.max(0, b.top - statusBarHeight);

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={`absolute border-2 rounded cursor-pointer transition-all ${isHovered ? 'z-30 scale-105' : 'z-10'} ${colors.border} ${isHovered ? colors.bg + ' shadow-lg' : 'bg-transparent hover:bg-white/10'}`}
                                                                    style={{
                                                                        left: `${b.left * scaleX}px`,
                                                                        top: `${adjustedTop * scaleY}px`,
                                                                        width: `${Math.max(b.width * scaleX, 4)}px`,
                                                                        height: `${Math.max(b.height * scaleY, 4)}px`,
                                                                    }}
                                                                    onMouseEnter={() => setHoveredElement(idx)}
                                                                    onMouseLeave={() => setHoveredElement(null)}
                                                                    onClick={() => onSelect(el)}
                                                                >
                                                                    {/* Index Badge - Inside element bounds */}
                                                                    <div
                                                                        className={`absolute top-0 left-0 min-w-[16px] h-[16px] rounded-sm flex items-center justify-center text-[8px] font-bold z-20 ${el.isEditable
                                                                            ? 'bg-blue-500 text-white'
                                                                            : el.isClickable
                                                                                ? 'bg-violet-500 text-white'
                                                                                : el.isScrollable
                                                                                    ? 'bg-amber-500 text-white'
                                                                                    : 'bg-gray-600 text-white'
                                                                            }`}
                                                                    >
                                                                        {idx + 1}
                                                                    </div>
                                                                    {isHovered && (
                                                                        <div className={`absolute -top-6 left-4 px-1.5 py-0.5 rounded text-[8px] font-medium whitespace-nowrap shadow-lg ${isDark ? 'bg-black/90 text-white' : 'bg-white/95 text-gray-900'}`}>
                                                                            {getElementName(el).substring(0, 20)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            // Placeholder when no screenshot
                                            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-800 to-gray-900">
                                                {loading ? (
                                                    <div className="text-center">
                                                        <div className="w-12 h-12 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-3 mx-auto" style={{ borderWidth: '3px' }} />
                                                        <p className="text-xs text-gray-400">Capturing...</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-gray-500">
                                                        <span className="text-4xl block mb-2">📱</span>
                                                        <p className="text-xs">Click Refresh để scan</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Home Indicator */}
                                    <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-400'}`} />
                                </div>
                            </div>

                            {/* Screenshot Info */}
                            {screenshotData && (
                                <div className={`mt-3 px-3 py-2 rounded-xl text-center ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                                    <span className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        ✅ Screenshot • {screenDimensions.width}×{screenDimensions.height}
                                    </span>
                                </div>
                            )}

                            {/* Legend */}
                            <div className={`mt-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Legend
                                </p>
                                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded border-2 border-violet-500/50 bg-violet-500/20" />
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Clickable</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded border-2 border-blue-500/50 bg-blue-500/20" />
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Editable</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded border-2 border-green-500/50 bg-green-500/20" />
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Checkable</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded border-2 border-amber-500/50 bg-amber-500/20" />
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Scrollable</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Element List */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Toolbar */}
                            <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'} flex items-center gap-3`}>
                                {/* Search */}
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm element..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm ${isDark ? 'bg-[#1a1a1a] text-white placeholder-gray-600 border-white/10' : 'bg-gray-50 text-gray-900 placeholder-gray-400 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                                    />
                                </div>

                                {/* Stats */}
                                <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {filteredElements.length}
                                    </span>
                                    <span className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        elements
                                    </span>
                                </div>
                            </div>

                            {/* Categories */}
                            <div className={`px-4 py-2 border-b ${isDark ? 'border-white/10' : 'border-gray-100'} flex items-center gap-2 overflow-x-auto`}>
                                {Object.entries(categories).map(([key, cat]) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedCategory(key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${selectedCategory === key
                                            ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                                            : isDark
                                                ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${selectedCategory === key
                                            ? 'bg-white/20'
                                            : isDark ? 'bg-white/10' : 'bg-gray-200'
                                            }`}>
                                            {cat.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Element List */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {error && (
                                    <div className={`p-4 rounded-xl mb-4 flex items-center gap-3 ${isDark ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                        <span className="text-xl">⚠️</span>
                                        <div>
                                            <p className="font-medium">Lỗi</p>
                                            <p className="text-sm opacity-80">{error}</p>
                                        </div>
                                    </div>
                                )}

                                {loading && (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-pulse ${inspectMode === 'ocr'
                                            ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
                                            : 'bg-gradient-to-br from-violet-500/20 to-purple-500/20'
                                            }`}>
                                            <span className="text-3xl animate-bounce">{inspectMode === 'ocr' ? '👁️' : '📱'}</span>
                                        </div>
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {inspectMode === 'ocr' ? 'Đang phân tích text (OCR)...' : 'Đang scan thiết bị...'}
                                        </p>
                                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Vui lòng đợi trong giây lát
                                        </p>
                                    </div>
                                )}

                                {!loading && ((inspectMode === 'ocr' ? textElements.length : elements.length) === 0) && !error && (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 ${inspectMode === 'ocr'
                                            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5'
                                            : 'bg-gradient-to-br from-gray-500/10 to-gray-500/5'
                                            }`}>
                                            <span className="text-4xl">{inspectMode === 'ocr' ? '👁️' : '📱'}</span>
                                        </div>
                                        <p className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {inspectMode === 'ocr' ? 'Chưa có text được phát hiện' : 'Chưa có dữ liệu'}
                                        </p>
                                        <p className={`text-sm text-center max-w-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {inspectMode === 'ocr'
                                                ? 'Click "Refresh" để scan và phát hiện text trên màn hình'
                                                : 'Click "Refresh" để scan màn hình thiết bị và hiển thị các elements'
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Smart View - Hierarchical Display */}
                                {inspectMode === 'accessibility' && selectedCategory === 'smart' && (
                                    <div className="space-y-3">
                                        {smartGroupedElements.length === 0 && (
                                            <div className="text-center py-8">
                                                <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                                                    Không có clickable elements. Click "Refresh" để scan lại.
                                                </p>
                                            </div>
                                        )}
                                        {smartGroupedElements.map((group, idx) => {
                                            const { parent, children } = group;
                                            const colors = getElementColor(parent);
                                            const isHovered = hoveredElement === `parent-${idx}`;

                                            return (
                                                <div key={idx} className={`rounded-xl border ${isDark ? 'border-white/10 bg-[#0d0d0d]' : 'border-gray-200 bg-white'} overflow-hidden`}>
                                                    {/* Parent Element (Clickable) */}
                                                    <button
                                                        onClick={() => setSelectedElement(parent)}
                                                        onMouseEnter={() => setHoveredElement(`parent-${idx}`)}
                                                        onMouseLeave={() => setHoveredElement(null)}
                                                        className={`w-full p-3 text-left transition-all ${selectedElement === parent
                                                            ? 'bg-violet-500/20 ring-2 ring-violet-500'
                                                            : isHovered
                                                                ? 'bg-violet-500/10'
                                                                : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {/* Index number instead of emoji */}
                                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${parent.isEditable
                                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                                : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                                                }`}>
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                        {getElementName(parent)}
                                                                    </p>
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/30 text-violet-300 font-bold">
                                                                        CLICKABLE
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                        {parent.className}
                                                                    </span>
                                                                    {parent.bounds && (
                                                                        <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                                                                            {parent.bounds.width}×{parent.bounds.height}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isHovered ? 'bg-violet-500 text-white' : isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {/* Children with text (for identification) */}
                                                    {children.length > 0 && (
                                                        <div className={`border-t ${isDark ? 'border-white/5 bg-[#0a0a0a]' : 'border-gray-100 bg-gray-50'} px-3 py-2`}>
                                                            <p className={`text-[9px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                📝 Child Text (for identification)
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {children.slice(0, 5).map((child, cidx) => {
                                                                    const childText = child.text || child.contentDescription;
                                                                    return (
                                                                        <button
                                                                            key={cidx}
                                                                            onClick={() => setSelectedElement({
                                                                                ...parent,
                                                                                text: childText, // Copy child text!
                                                                                _childText: childText,
                                                                                _smartMatch: true,
                                                                            })}
                                                                            className={`text-[11px] px-2 py-1 rounded-lg transition-all ${isDark
                                                                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                                }`}
                                                                        >
                                                                            "{childText}"
                                                                        </button>
                                                                    );
                                                                })}
                                                                {children.length > 5 && (
                                                                    <span className={`text-[10px] px-2 py-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                        +{children.length - 5} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Elements Grid - Accessibility Mode (non-smart categories) */}
                                {inspectMode === 'accessibility' && selectedCategory !== 'smart' && (
                                    <div className="grid gap-2">
                                        {filteredElements.map((el, idx) => {
                                            const colors = getElementColor(el);
                                            const isHovered = hoveredElement === idx;

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedElement(el)}
                                                    onMouseEnter={() => setHoveredElement(idx)}
                                                    onMouseLeave={() => setHoveredElement(null)}
                                                    className={`w-full p-4 rounded-xl text-left transition-all border ${selectedElement === el
                                                        ? `ring-2 ring-violet-500 ${colors.bg} ${colors.border}`
                                                        : isHovered
                                                            ? `${colors.bg} ${colors.border} scale-[1.02] shadow-lg`
                                                            : isDark
                                                                ? 'bg-[#1a1a1a] border-white/5 hover:border-white/10'
                                                                : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                                                            <span className="text-lg">{getElementIcon(el)}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {getElementName(el)}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                {/* Clickable/Editable/Scrollable badges */}
                                                                {el.isClickable && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-violet-500/20 text-violet-400">
                                                                        👆 Clickable
                                                                    </span>
                                                                )}
                                                                {el.isEditable && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-blue-500/20 text-blue-400">
                                                                        ✏️ Editable
                                                                    </span>
                                                                )}
                                                                {el.isScrollable && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-amber-500/20 text-amber-400">
                                                                        📜 Scrollable
                                                                    </span>
                                                                )}
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                                                                    {el.className}
                                                                </span>
                                                                {el.bounds && (
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                                                                        {el.bounds.width}×{el.bounds.height}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* Show contentDescription if available (helps identify elements) */}
                                                            {el.contentDescription && (
                                                                <p className={`text-[11px] mt-1.5 truncate ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                                    💬 "{el.contentDescription}"
                                                                </p>
                                                            )}
                                                            {el.resourceId && (
                                                                <p className={`text-[10px] mt-1.5 font-mono truncate ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                    {el.resourceId}
                                                                </p>
                                                            )}
                                                            {/* Show child text for clickable elements without text */}
                                                            {(el.isClickable || el.isEditable) && !el.text && !el.contentDescription && (() => {
                                                                const children = getChildrenWithText(el);
                                                                if (children.length === 0) return null;
                                                                return (
                                                                    <div className="flex flex-wrap gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                                                                        <span className={`text-[9px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>📝</span>
                                                                        {children.map((child, cidx) => (
                                                                            <button
                                                                                key={cidx}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    // Select parent but COPY child text to text field
                                                                                    const childText = child.text || child.contentDescription;
                                                                                    setSelectedElement({
                                                                                        ...el,
                                                                                        text: childText, // Copy child text to parent's text field!
                                                                                        _childText: childText,
                                                                                        _smartMatch: true,
                                                                                    });
                                                                                }}
                                                                                className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-all hover:scale-105 ${isDark ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                                                            >
                                                                                "{(child.text || child.contentDescription)?.substring(0, 20)}"
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isHovered ? 'bg-violet-500 text-white' : isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Text Elements Grid - OCR Mode */}
                                {inspectMode === 'ocr' && (
                                    <div className="grid gap-2">
                                        {textElements
                                            .filter(el => !searchQuery || el.text?.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((el, idx) => {
                                                const isHovered = hoveredElement === idx;

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => onSelect({
                                                            text: el.text,
                                                            bounds: el.bounds,
                                                            center: el.center,
                                                            isOcrElement: true,
                                                            confidence: el.confidence,
                                                        })}
                                                        onMouseEnter={() => setHoveredElement(idx)}
                                                        onMouseLeave={() => setHoveredElement(null)}
                                                        className={`w-full p-4 rounded-xl text-left transition-all border ${isHovered
                                                            ? 'bg-emerald-500/20 border-emerald-500/30 scale-[1.02] shadow-lg'
                                                            : isDark
                                                                ? 'bg-[#1a1a1a] border-white/5 hover:border-emerald-500/20'
                                                                : 'bg-gray-50 border-gray-100 hover:border-emerald-200'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {/* OCR Icon */}
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isHovered ? 'bg-emerald-500/30' : 'bg-emerald-500/10'}`}>
                                                                <span className="text-lg">📝</span>
                                                            </div>

                                                            {/* Text Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                    "{el.text}"
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium bg-emerald-500/20 text-emerald-400`}>
                                                                        OCR Text
                                                                    </span>
                                                                    {el.bounds && (
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded-md ${isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                                                                            {el.bounds.width}×{el.bounds.height}
                                                                        </span>
                                                                    )}
                                                                    {el.confidence && (
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded-md ${isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                                                                            {Math.round(el.confidence * 100)}% conf
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {el.center && (
                                                                    <p className={`text-[10px] mt-1.5 font-mono ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                        Center: ({el.center.x}, {el.center.y})
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Select Icon */}
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isHovered ? 'bg-emerald-500 text-white' : isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Element Detail Panel (when element selected) */}
                        {selectedElement && (
                            <div className={`w-80 flex-shrink-0 border-l ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'} flex flex-col overflow-y-auto`}>
                                {/* Detail Header */}
                                <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between`}>
                                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        📋 Element Details
                                    </h3>
                                    <button
                                        onClick={() => setSelectedElement(null)}
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Detail Content */}
                                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                                    {/* Element Name */}
                                    <div>
                                        <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Element Name
                                        </label>
                                        <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {getElementName(selectedElement)}
                                        </p>
                                    </div>

                                    {/* Resource ID */}
                                    {selectedElement.resourceId && (
                                        <div>
                                            <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                Resource ID
                                            </label>
                                            <p className={`text-xs font-mono mt-1 p-2 rounded-lg break-all ${isDark ? 'bg-white/5 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                                                {selectedElement.resourceId}
                                            </p>
                                        </div>
                                    )}

                                    {/* Text Content */}
                                    {selectedElement.text && (
                                        <div>
                                            <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                Text Content
                                            </label>
                                            <p className={`text-sm mt-1 p-2 rounded-lg ${isDark ? 'bg-white/5 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                                "{selectedElement.text}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Content Description */}
                                    {selectedElement.contentDescription && (
                                        <div>
                                            <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                Content Description
                                            </label>
                                            <p className={`text-xs mt-1 p-2 rounded-lg ${isDark ? 'bg-white/5 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                                {selectedElement.contentDescription}
                                            </p>
                                        </div>
                                    )}

                                    {/* Class Name */}
                                    <div>
                                        <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Class Name
                                        </label>
                                        <p className={`text-xs font-mono mt-1 p-2 rounded-lg ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                            {selectedElement.className || 'Unknown'}
                                        </p>
                                    </div>

                                    {/* Bounds / Coordinates */}
                                    {selectedElement.bounds && (
                                        <div>
                                            <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                Bounds & Coordinates
                                            </label>
                                            <div className={`mt-1 p-3 rounded-lg space-y-2 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Left:</span>
                                                        <span className={`ml-1 font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{selectedElement.bounds.left}</span>
                                                    </div>
                                                    <div>
                                                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Top:</span>
                                                        <span className={`ml-1 font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{selectedElement.bounds.top}</span>
                                                    </div>
                                                    <div>
                                                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Width:</span>
                                                        <span className={`ml-1 font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{selectedElement.bounds.width}</span>
                                                    </div>
                                                    <div>
                                                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Height:</span>
                                                        <span className={`ml-1 font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{selectedElement.bounds.height}</span>
                                                    </div>
                                                </div>
                                                <div className={`pt-2 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Center: </span>
                                                    <span className={`text-xs font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                                        ({Math.round(selectedElement.bounds.left + selectedElement.bounds.width / 2)}, {Math.round(selectedElement.bounds.top + selectedElement.bounds.height / 2)})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Properties */}
                                    <div>
                                        <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Properties
                                        </label>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {selectedElement.isClickable && (
                                                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30">
                                                    👆 Clickable
                                                </span>
                                            )}
                                            {selectedElement.isEditable && (
                                                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                                    ✏️ Editable
                                                </span>
                                            )}
                                            {selectedElement.isScrollable && (
                                                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                    📜 Scrollable
                                                </span>
                                            )}
                                            {selectedElement.isCheckable && (
                                                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                                    ☑️ Checkable {selectedElement.isChecked ? '(Checked)' : ''}
                                                </span>
                                            )}
                                            {selectedElement.isFocusable && (
                                                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-pink-500/20 text-pink-400 border border-pink-500/30">
                                                    🎯 Focusable
                                                </span>
                                            )}
                                            {selectedElement.isEnabled === false && (
                                                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                                    🚫 Disabled
                                                </span>
                                            )}
                                            {!selectedElement.isClickable && !selectedElement.isEditable && !selectedElement.isScrollable && !selectedElement.isCheckable && (
                                                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                                    📦 Static
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Package Name */}
                                    {packageName && (
                                        <div>
                                            <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                Package
                                            </label>
                                            <p className={`text-[10px] font-mono mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {packageName}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Select Button */}
                                <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                    <button
                                        onClick={() => {
                                            onSelect(selectedElement);
                                            setSelectedElement(null);
                                        }}
                                        className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/30 hover:scale-[1.02] transition-all"
                                    >
                                        ✓ Chọn Element này
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`px-6 py-3 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">💡</span>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Hover vào element để highlight, click để chọn
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className={`px-5 py-2 rounded-xl text-sm font-medium ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
