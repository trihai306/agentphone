import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { deviceApi } from '@/services/api';

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
    elementType = 'all', // 'clickable' | 'editable' | 'scrollable' | 'all'
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // State for elements (accessibility + OCR unified)
    const [elements, setElements] = useState([]);
    const [textElements, setTextElements] = useState([]); // OCR detected text
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [packageName, setPackageName] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [hoveredElement, setHoveredElement] = useState(null);

    // Map elementType to category: clickable -> 'clickable' (Buttons tab)
    const defaultCategory = elementType === 'clickable' ? 'clickable'
        : elementType === 'editable' ? 'editable'
            : elementType === 'scrollable' ? 'scrollable'
                : 'smart';
    const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
    const [screenshotData, setScreenshotData] = useState(null);
    const [screenDimensions, setScreenDimensions] = useState({ width: 1080, height: 2400 });
    const [imageNaturalDimensions, setImageNaturalDimensions] = useState(null);
    const [statusBarHeight, setStatusBarHeight] = useState(0);
    const [ocrProcessingTime, setOcrProcessingTime] = useState(0);
    const [selectedElement, setSelectedElement] = useState(null); // For showing detail panel
    const [selectorStrategy, setSelectorStrategy] = useState('smart'); // smart | id | text | coordinates
    const scanTimeoutRef = useRef(null); // Timeout ID for scan timeout

    // Chunk streaming state
    const [chunkProgress, setChunkProgress] = useState({ current: 0, total: 0 });
    const [isChunking, setIsChunking] = useState(false);

    // Calculate selector confidence score for an element
    const getConfidenceScore = useCallback((el) => {
        if (!el) return { score: 0, level: 'low', reason: 'No element' };

        // High confidence: unique resourceId
        if (el.resourceId && el.resourceId.includes(':id/')) {
            return { score: 95, level: 'high', reason: 'Unique Resource ID' };
        }

        // High confidence: unique text that's not generic
        const genericTexts = ['OK', 'Cancel', 'Yes', 'No', 'Submit', 'Back', 'Next', 'Done', '...'];
        if (el.text && el.text.length > 2 && !genericTexts.includes(el.text)) {
            return { score: 85, level: 'high', reason: 'Descriptive text content' };
        }

        // Medium confidence: contentDescription
        if (el.contentDescription) {
            return { score: 75, level: 'medium', reason: 'Content Description available' };
        }

        // Medium confidence: generic text
        if (el.text) {
            return { score: 60, level: 'medium', reason: 'Generic text (may match multiple)' };
        }

        // Low confidence: only coordinates
        if (el.bounds) {
            return { score: 40, level: 'low', reason: 'Coordinates only (may break on different screens)' };
        }

        return { score: 20, level: 'low', reason: 'No reliable selector' };
    }, []);

    // Generate UiSelector string for Android automation
    const generateUiSelector = useCallback((el, strategy = 'smart') => {
        if (!el) return null;

        const selectors = [];

        // Based on strategy priority
        if (strategy === 'smart' || strategy === 'id') {
            if (el.resourceId) {
                selectors.push({
                    type: 'resourceId',
                    uiSelector: `UiSelector().resourceId("${el.resourceId}")`,
                    xpath: `//*[@resource-id="${el.resourceId}"]`,
                    priority: 1,
                    confidence: 95
                });
            }
        }

        if (strategy === 'smart' || strategy === 'text') {
            if (el.text) {
                selectors.push({
                    type: 'text',
                    uiSelector: `UiSelector().text("${el.text}")`,
                    xpath: `//*[@text="${el.text}"]`,
                    priority: 2,
                    confidence: 85
                });
            }
            if (el.contentDescription) {
                selectors.push({
                    type: 'contentDescription',
                    uiSelector: `UiSelector().description("${el.contentDescription}")`,
                    xpath: `//*[@content-desc="${el.contentDescription}"]`,
                    priority: 3,
                    confidence: 75
                });
            }
        }

        // Icon template matching - use cropped icon image to find element
        if (strategy === 'smart' || strategy === 'icon') {
            if (el.image) {
                selectors.push({
                    type: 'icon',
                    uiSelector: null,  // Not a UiSelector - uses template matching
                    xpath: null,
                    template: el.image,  // Base64 icon image
                    priority: 2.5,  // Between text and coordinates
                    confidence: 80,
                    description: 'Visual icon matching'
                });
            }
        }

        if (strategy === 'smart' || strategy === 'coordinates') {
            if (el.bounds) {
                const centerX = Math.round(el.bounds.left + el.bounds.width / 2);
                const centerY = Math.round(el.bounds.top + el.bounds.height / 2);
                selectors.push({
                    type: 'coordinates',
                    uiSelector: `click(${centerX}, ${centerY})`,
                    xpath: null,
                    priority: 4,
                    confidence: 40
                });
            }
        }

        // Sort by priority
        selectors.sort((a, b) => a.priority - b.priority);

        return selectors;
    }, []);

    // Build multi-selector output for onSelect
    const buildSelectorOutput = useCallback((el) => {
        if (!el) return null;

        const selectors = generateUiSelector(el, selectorStrategy);
        const confidence = getConfidenceScore(el);

        return {
            // Original element data
            ...el,
            // Enhanced selector data
            _selectors: {
                primary: selectors[0] || null,
                secondary: selectors[1] || null,
                fallback: selectors[selectors.length - 1] || null,
                all: selectors
            },
            _confidence: confidence,
            _strategy: selectorStrategy
        };
    }, [generateUiSelector, getConfidenceScore, selectorStrategy]);

    // Categorize elements
    const categories = useMemo(() => {
        // Helper to check if element looks like a button based on className or other attributes
        const looksLikeButton = (el) => {
            // Must have actual clickable/interactive property
            if (el.isClickable && !el.isEditable && !el.isCheckable) return true;
            if (el.isLongClickable) return true;

            // Only consider className patterns if element is also focusable or has contentDescription
            // This prevents including non-interactive CardView, ImageView, etc.
            const className = (el.className || '').toLowerCase();
            const interactivePatterns = ['button', 'fab', 'chip', 'tab', 'menuitem'];

            // Strong button patterns - always include
            if (interactivePatterns.some(p => className.includes(p))) return true;

            // Weak patterns (image, icon, card, item) - only if focusable or has contentDescription
            const weakPatterns = ['image', 'icon', 'card', 'item', 'cell'];
            if (weakPatterns.some(p => className.includes(p))) {
                // Must have evidence of interactivity
                if (el.isFocusable && el.contentDescription) return true;
            }

            return false;
        };

        // Count clickable elements for smart view
        const clickableCount = elements.filter(el => el.isClickable || el.isEditable || looksLikeButton(el)).length;

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
            // Use enhanced button detection
            if (looksLikeButton(el)) cats.clickable.count++;
            if (el.isEditable) cats.editable.count++;
            if (el.text && !looksLikeButton(el) && !el.isEditable) cats.text.count++;
            if (el.isScrollable) cats.scrollable.count++;
            if (el.isCheckable) cats.checkable.count++;
        });

        return cats;
    }, [elements]);

    // Listen for inspect results from socket (Accessibility mode)
    useEffect(() => {
        if (!isOpen || !userId) return;

        const handleResult = (data) => {
            console.log('🎯 handleResult CALLED with data:', {
                device_id: data.device_id,
                success: data.success,
                element_count: data.element_count || data.elements?.length,
                ocr_count: data.text_elements?.length,
                has_screenshot: data.has_screenshot,
                screenshot_key: data.screenshot_key
            });

            // Clear the scan timeout since we received the response
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
                scanTimeoutRef.current = null;
                console.log('✅ Cleared scan timeout - event arrived in time');
            }

            setLoading(false);

            if (data.success) {
                setElements(data.elements || []);
                setPackageName(data.package_name || '');
                setError(null);

                // Handle screenshot - fetch from API if screenshot_key provided
                // (screenshot is stripped from WebSocket to fit Soketi 100KB limit)
                if (data.screenshot_key && data.has_screenshot) {
                    console.log('📷 Fetching screenshot from cache via API:', data.screenshot_key);
                    fetch(`/api/inspect-screenshot/${encodeURIComponent(data.screenshot_key)}`, {
                        credentials: 'include'  // Send session cookies for auth
                    })
                        .then(res => res.json())
                        .then(response => {
                            if (response.screenshot) {
                                console.log('✅ Screenshot fetched successfully');
                                setScreenshotData(response.screenshot);
                            } else {
                                console.warn('⚠️ Screenshot not found in cache');
                            }
                        })
                        .catch(err => {
                            console.error('❌ Failed to fetch screenshot:', err);
                        });
                } else if (data.screenshot) {
                    // Legacy: screenshot included directly in WebSocket payload
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

                // ========== UNIFIED: Handle OCR text elements from same response ==========
                // APK now sends text_elements in the same inspect:result response
                if (data.text_elements && Array.isArray(data.text_elements)) {
                    setTextElements(data.text_elements);
                    if (data.ocr_count !== undefined) {
                        console.log(`📝 OCR detected ${data.ocr_count} text elements`);
                    }
                }
            } else {
                setError(data.error || 'Inspection failed');
                setElements([]);
            }
        };

        // Listen for OCR + Object Detection results (visual:result event)
        const handleVisualResult = (data) => {
            // Don't set loading false here - let inspect:result control it
            // setLoading(false);

            if (data.success) {
                // Use all_elements (combined text + objects) if available, fallback to text_elements
                const allVisualElements = data.all_elements || data.text_elements || [];
                setTextElements(allVisualElements);
                setOcrProcessingTime(data.processing_time_ms || 0);
                // Don't clear error here - let inspect:result control it

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
                // OCR failed - just log, don't show error if accessibility elements work
                console.warn('OCR failed:', data.error);
                // DON'T set error here - accessibility scan is primary
                // setError(data.error || 'OCR failed');
                setTextElements([]);
            }
        };

        if (window.Echo) {
            // Subscribe to standard Laravel Echo user channel (use user.{userId} to match backend)
            const channel = window.Echo.private(`user.${userId}`);
            console.log(`🔌 ElementPicker: Subscribing to private-user.${userId}`);

            // Handler for legacy single-payload results
            channel.listen('.inspect.result', (data) => {
                console.log('📥 Received inspect.result event:', data);
                handleResult(data);
            });

            // Handler for chunked streaming (new approach)
            channel.listen('.inspect.chunk', (data) => {
                console.log(`📦 Received chunk ${data.chunk_index}/${data.total_chunks}:`, {
                    elements: data.elements?.length || 0,
                    text_elements: data.text_elements?.length || 0,
                    is_complete: data.is_complete
                });

                // Clear timeout on any chunk received
                if (scanTimeoutRef.current) {
                    clearTimeout(scanTimeoutRef.current);
                    scanTimeoutRef.current = null;
                }

                // Update chunk progress
                setChunkProgress({ current: data.chunk_index, total: data.total_chunks });
                setIsChunking(true);

                // First chunk: reset state and set metadata
                if (data.chunk_index === 1) {
                    setElements([]);
                    setTextElements([]);
                    setPackageName(data.package_name || '');
                    setError(null);

                    if (data.screenshot) {
                        setScreenshotData(data.screenshot);
                    }
                    if (data.screen_width && data.screen_height) {
                        setScreenDimensions({ width: data.screen_width, height: data.screen_height });
                    }
                    if (data.screenshot_width && data.screenshot_height) {
                        setImageNaturalDimensions({ width: data.screenshot_width, height: data.screenshot_height });
                    }
                    if (data.status_bar_height !== undefined) {
                        setStatusBarHeight(data.status_bar_height);
                    }
                }

                // Accumulate elements from each chunk
                if (data.elements && data.elements.length > 0) {
                    setElements(prev => [...prev, ...data.elements]);
                }
                if (data.text_elements && data.text_elements.length > 0) {
                    setTextElements(prev => [...prev, ...data.text_elements]);
                }

                // Final chunk: stop loading
                if (data.is_complete === true) {
                    console.log(`✅ Final chunk received (is_complete=true), stopping loading...`);
                    setLoading(false);
                    setIsChunking(false);
                    setChunkProgress({ current: data.total_chunks, total: data.total_chunks });
                    console.log(`✅ All ${data.total_chunks} chunks received, total: ${data.total_element_count || 0} elements, ${data.total_ocr_count || 0} OCR`);
                }
            });

            channel.listen('.visual.result', (data) => {
                console.log('📥 Received visual.result event:', data);
                handleVisualResult(data);
            });

            return () => {
                console.log(`🔌 ElementPicker: Unsubscribing from private-user.${userId}`);
                channel.stopListening('.inspect.result');
                channel.stopListening('.inspect.chunk');
                channel.stopListening('.visual.result');
            };
        } else {
            console.error('❌ ElementPicker: window.Echo not available!');
        }
    }, [isOpen, userId]);

    // Auto-scan on open with small delay to ensure channel subscription is complete
    useEffect(() => {
        if (isOpen && deviceId && elements.length === 0 && textElements.length === 0) {
            // Small delay to allow channel subscription to complete
            const timer = setTimeout(() => {
                requestElements();
            }, 500);
            return () => clearTimeout(timer);
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

        // Clear any existing timeout
        if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
        }

        // Safety timeout - if socket doesn't respond within 20s, stop loading
        // (inspect:result payload can be 100KB+ with element icons)        
        scanTimeoutRef.current = setTimeout(() => {
            setLoading(false);
            console.warn('⏱️ Element scan timeout - socket did not respond in time');
            scanTimeoutRef.current = null;
        }, 20000);

        try {
            console.log('📤 Sending inspect request for device:', deviceId);
            // SINGLE API call for element detection
            // Accessibility scan provides: elements + screenshot + element properties
            // No need for separate OCR call - reduces complexity and prevents screenshot conflicts
            const response = await deviceApi.inspect(deviceId);

            if (!response?.success) {
                setError('Không thể scan thiết bị');
                setLoading(false);
                if (scanTimeoutRef.current) {
                    clearTimeout(scanTimeoutRef.current);
                    scanTimeoutRef.current = null;
                }
            } else {
                console.log('📥 API response success - waiting for socket event...');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Không thể kết nối đến server';
            setError(message);
            setLoading(false);
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
                scanTimeoutRef.current = null;
            }
        }
    }, [deviceId]);

    // No longer need mode-change re-scan since we call both endpoints together

    // Combine accessibility elements and OCR text elements
    const allElements = useMemo(() => {
        // Mark OCR elements with a flag for display purposes
        // Note: OCR elements are NOT automatically clickable - they're just detected text
        const ocrWithFlag = textElements.map(el => ({
            ...el,
            _source: 'ocr',
            isClickable: el.isClickable ?? false, // Preserve original value or default to false
            text: el.text || el.detectedText
        }));

        // Mark accessibility elements
        const accessWithFlag = elements.map(el => ({
            ...el,
            _source: 'accessibility'
        }));

        return [...accessWithFlag, ...ocrWithFlag];
    }, [elements, textElements]);

    // Filter elements
    const filteredElements = useMemo(() => {
        return allElements.filter(el => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                (el.text?.toLowerCase().includes(searchLower)) ||
                (el.contentDescription?.toLowerCase().includes(searchLower)) ||
                (el.resourceId?.toLowerCase().includes(searchLower)) ||
                (el.className?.toLowerCase().includes(searchLower));

            // Helper for enhanced button detection (same as in categories)
            const looksLikeButton = () => {
                // Must have actual clickable/interactive property
                if (el.isClickable && !el.isEditable && !el.isCheckable) return true;
                if (el.isLongClickable) return true;

                const className = (el.className || '').toLowerCase();
                const interactivePatterns = ['button', 'fab', 'chip', 'tab', 'menuitem'];
                if (interactivePatterns.some(p => className.includes(p))) return true;

                // Weak patterns - only if focusable AND has contentDescription
                const weakPatterns = ['image', 'icon', 'card', 'item', 'cell'];
                if (weakPatterns.some(p => className.includes(p))) {
                    if (el.isFocusable && el.contentDescription) return true;
                }
                return false;
            };

            // Category filter
            let matchesCategory = selectedCategory === 'all';
            if (selectedCategory === 'clickable') matchesCategory = looksLikeButton();
            if (selectedCategory === 'editable') matchesCategory = el.isEditable;
            if (selectedCategory === 'text') matchesCategory = el.text && !looksLikeButton() && !el.isEditable;
            if (selectedCategory === 'scrollable') matchesCategory = el.isScrollable;
            if (selectedCategory === 'checkable') matchesCategory = el.isCheckable;
            if (selectedCategory === 'smart') matchesCategory = true; // Smart shows all for grouping

            return matchesSearch && matchesCategory;
        });
    }, [allElements, searchQuery, selectedCategory]);

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
        const clickableElements = allElements.filter(el => el.isClickable || el.isEditable);

        // For each clickable, find children with text/description
        const grouped = clickableElements.map(parent => {
            const children = allElements.filter(child => {
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
    }, [allElements]);

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

        return allElements.filter(child => {
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
    }, [allElements]);

    // Find clickable parent for non-clickable element
    const findClickableParent = useCallback((el) => {
        if (el.isClickable || el.isEditable) return el;
        if (!el.bounds) return null;

        const c = el.bounds;
        // Find smallest clickable parent that contains this element
        const parents = allElements.filter(parent => {
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
    }, [allElements]);

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
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
                <div
                    className={`w-full max-w-6xl h-full max-h-[90vh] rounded-2xl overflow-hidden flex flex-col pointer-events-auto transition-all ${isDark ? 'bg-[#111113] ring-1 ring-white/[0.08]' : 'bg-white ring-1 ring-black/[0.08]'}`}
                    style={{ boxShadow: isDark ? '0 25px 80px rgba(0,0,0,0.7)' : '0 25px 80px rgba(0,0,0,0.15)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`px-5 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-100'} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-violet-500/15' : 'bg-violet-50'}`}>
                                <svg className={`w-[18px] h-[18px] ${isDark ? 'text-violet-400' : 'text-violet-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Element Inspector</h2>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {isChunking
                                        ? `Loading… ${elements.length + textElements.length} elements (${chunkProgress.current}/${chunkProgress.total})`
                                        : `${elements.length + textElements.length} elements${packageName ? ` · ${packageName}` : ''}`
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={requestElements}
                                disabled={loading}
                                className={`h-9 px-4 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${loading
                                    ? isDark ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-violet-600 text-white hover:bg-violet-500 active:scale-[0.97]'
                                    }`}
                            >
                                {loading ? (
                                    <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Scanning…</>
                                ) : (
                                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Scan</>
                                )}
                            </button>
                            <button onClick={onClose} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Main Content - Split View */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left: Device Preview */}
                        <div className={`w-[340px] flex-shrink-0 border-r ${isDark ? 'border-white/[0.06] bg-[#0c0c0e]' : 'border-gray-100 bg-gray-50/50'} p-4 flex flex-col`}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Device Preview</h3>
                                {screenshotData && <span className={`text-[10px] font-mono ${isDark ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>{screenDimensions.width}×{screenDimensions.height}</span>}
                            </div>

                            {/* Device Frame */}
                            <div className="flex-1 flex items-center justify-center">
                                <div
                                    className={`relative rounded-[24px] overflow-hidden ${isDark ? 'bg-[#1a1a1c]' : 'bg-white'}`}
                                    style={{ width: '280px', height: '580px', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)' : '0 8px 40px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.06)' }}
                                >
                                    {/* Dynamic Island */}
                                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[72px] h-[22px] rounded-full bg-black z-20" />

                                    {/* Screen Content */}
                                    <div className="absolute rounded-[20px] overflow-hidden" style={{ left: '3px', right: '3px', top: '26px', bottom: '20px' }}>
                                        {/* Real Screenshot */}
                                        {screenshotData ? (() => {
                                            const containerWidth = 274;
                                            const containerHeight = 534;

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
                                                        {filteredElements.map((el, idx) => {
                                                            if (!el.bounds) return null;
                                                            const b = el.bounds;
                                                            const isHovered = hoveredElement === idx;
                                                            const colors = getElementColor(el);

                                                            // Use percentage bounds if available (more accurate)
                                                            // Otherwise fallback to pixel-based calculation
                                                            let elLeft, elTop, elWidth, elHeight;

                                                            if (b.leftPercent !== undefined && b.topPercent !== undefined) {
                                                                // Use normalized percentage values - directly map to container
                                                                elLeft = b.leftPercent * containerWidth;
                                                                // Adjust for status bar (percentage of screen that status bar takes)
                                                                const statusBarPercent = statusBarHeight / (screenDimensions.height || 2400);
                                                                elTop = Math.max(0, (b.topPercent - statusBarPercent)) * containerHeight / (1 - statusBarPercent);
                                                                elWidth = b.widthPercent * containerWidth;
                                                                elHeight = b.heightPercent * containerHeight;
                                                            } else {
                                                                // Fallback to pixel-based calculation
                                                                const adjustedTop = Math.max(0, b.top - statusBarHeight);
                                                                elLeft = b.left * scaleX;
                                                                elTop = adjustedTop * scaleY;
                                                                elWidth = b.width * scaleX;
                                                                elHeight = b.height * scaleY;
                                                            }

                                                            const dotColor = el.isEditable ? '#3b82f6' : el.isCheckable ? '#22c55e' : el.isScrollable ? '#f59e0b' : '#8b5cf6';
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="absolute cursor-pointer z-10 group/dot"
                                                                    style={{ left: `${elLeft + elWidth / 2 - 5}px`, top: `${elTop + elHeight / 2 - 5}px` }}
                                                                    onMouseEnter={() => setHoveredElement(idx)}
                                                                    onMouseLeave={() => setHoveredElement(null)}
                                                                    onClick={() => onSelect(el)}
                                                                >
                                                                    {/* Dot marker */}
                                                                    <div className="relative w-[10px] h-[10px]">
                                                                        <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: dotColor }} />
                                                                        <div className={`relative w-full h-full rounded-full ring-1 ring-white/80 shadow-sm transition-transform ${isHovered ? 'scale-[2]' : ''}`} style={{ backgroundColor: dotColor }} />
                                                                    </div>
                                                                    {/* Hover tooltip */}
                                                                    {isHovered && (
                                                                        <>
                                                                            {/* Bounding box */}
                                                                            <div className="absolute pointer-events-none" style={{ left: `${-elLeft - elWidth / 2 + 5 + elLeft}px`, top: `${-elTop - elHeight / 2 + 5 + elTop}px`, width: `${elWidth}px`, height: `${elHeight}px`, border: `1.5px solid ${dotColor}`, borderRadius: '4px', backgroundColor: `${dotColor}15` }} />
                                                                            <div className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[9px] font-medium whitespace-nowrap shadow-lg z-40 ${isDark ? 'bg-gray-900 text-white ring-1 ring-white/10' : 'bg-white text-gray-900 ring-1 ring-black/10'}`}>
                                                                                {getElementName(el).substring(0, 30)}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 to-gray-950">
                                                {loading ? (
                                                    <div className="text-center"><div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-3 mx-auto" /><p className="text-[11px] text-gray-500">Capturing…</p></div>
                                                ) : (
                                                    <div className="text-center">
                                                        <svg className="w-10 h-10 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                        <p className="text-[11px] text-gray-500">Click Scan để bắt đầu</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {/* Home Indicator */}
                                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full bg-gray-600" />
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="mt-3 flex items-center justify-center gap-4">
                                {[{ c: 'bg-violet-500', l: 'Clickable' }, { c: 'bg-blue-500', l: 'Input' }, { c: 'bg-emerald-500', l: 'Check' }, { c: 'bg-amber-500', l: 'Scroll' }].map(i => <div key={i.l} className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${i.c}`} /><span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{i.l}</span></div>)}
                            </div>
                        </div>

                        {/* Right: Element List */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Search + Categories */}
                            <div className={`px-4 py-2.5 border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                                {/* Search */}
                                <div className="relative mb-2.5">
                                    <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input
                                        type="text"
                                        placeholder="Tìm element…"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={`w-full pl-9 pr-12 py-2 rounded-lg text-xs ${isDark ? 'bg-white/[0.04] text-white placeholder-gray-600 ring-1 ring-white/[0.06] focus:ring-violet-500/50' : 'bg-gray-50 text-gray-900 placeholder-gray-400 ring-1 ring-gray-200 focus:ring-violet-500/50'} focus:outline-none transition-all`}
                                    />
                                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{filteredElements.length}</span>
                                </div>
                                {/* Categories */}
                                <div className="flex items-center gap-1 overflow-x-auto">
                                    {Object.entries(categories).map(([key, cat]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedCategory(key)}
                                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${selectedCategory === key
                                                ? 'bg-violet-600 text-white'
                                                : isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <span>{cat.label}</span>
                                            <span className={`text-[9px] tabular-nums ${selectedCategory === key ? 'text-white/60' : isDark ? 'text-gray-600' : 'text-gray-400'}`}>{cat.count}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Element List */}
                            <div className="flex-1 overflow-y-auto p-3">
                                {error && (
                                    <div className={`p-3 rounded-lg mb-3 flex items-center gap-2.5 text-sm ${isDark ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20' : 'bg-red-50 text-red-600 ring-1 ring-red-200'}`}>
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        <span>{error}</span>
                                    </div>
                                )}

                                {loading && (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4" />
                                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Đang scan thiết bị…</p>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Vui lòng đợi trong giây lát</p>
                                    </div>
                                )}

                                {!loading && allElements.length === 0 && !error && (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <svg className={`w-12 h-12 mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                                        <p className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Chưa có dữ liệu</p>
                                        <p className={`text-xs text-center max-w-[200px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Click "Scan" để scan màn hình thiết bị</p>
                                    </div>
                                )}

                                {/* Smart View - Hierarchical Display */}
                                {selectedCategory === 'smart' && (
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
                                                            ? 'bg-violet-500/15 ring-1 ring-violet-500/30'
                                                            : isHovered
                                                                ? 'bg-violet-500/8'
                                                                : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold ${parent.isEditable
                                                                ? 'bg-blue-500/15 text-blue-400'
                                                                : 'bg-violet-500/15 text-violet-400'
                                                                }`}>
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                        {getElementName(parent)}
                                                                    </p>
                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${parent.isEditable ? 'bg-blue-500/15 text-blue-400' : 'bg-violet-500/15 text-violet-300'}`}>
                                                                        {parent.isEditable ? 'INPUT' : 'TAP'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className={`text-[10px] font-mono ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                        {parent.className}
                                                                    </span>
                                                                    {parent.bounds && (
                                                                        <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                                                                            {parent.bounds.width}×{parent.bounds.height}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <svg className={`w-3 h-3 ${isHovered ? 'text-violet-400' : isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </button>

                                                    {/* Children with text (for identification) */}
                                                    {children.length > 0 && (
                                                        <div className={`border-t ${isDark ? 'border-white/[0.04] bg-white/[0.02]' : 'border-gray-100 bg-gray-50'} px-3 py-2`}>
                                                            <p className={`text-[9px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                Child Text
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

                                {/* Elements Grid (non-smart categories) */}
                                {selectedCategory !== 'smart' && (
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
                                                    className={`w-full p-3 rounded-lg text-left transition-all ${selectedElement === el
                                                        ? `ring-1 ring-violet-500 ${isDark ? 'bg-violet-500/10' : 'bg-violet-50'}`
                                                        : isHovered
                                                            ? isDark ? 'bg-white/[0.04]' : 'bg-gray-50'
                                                            : isDark ? 'bg-transparent hover:bg-white/[0.03]' : 'bg-transparent hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-2.5">
                                                        {/* Index dot */}
                                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${el.isEditable
                                                            ? 'bg-blue-500/15 text-blue-400'
                                                            : el.isCheckable ? 'bg-emerald-500/15 text-emerald-400'
                                                                : el.isScrollable ? 'bg-amber-500/15 text-amber-400'
                                                                    : 'bg-violet-500/15 text-violet-400'
                                                            }`}>
                                                            {idx + 1}
                                                        </div>
                                                        {el.image ? (
                                                            <img
                                                                src={`data:image/png;base64,${el.image}`}
                                                                alt={el.label || 'Icon'}
                                                                className="w-8 h-8 rounded-md object-contain flex-shrink-0 bg-black/20"
                                                            />
                                                        ) : null}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {getElementName(el)}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                {el.type === 'object' && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-emerald-500/15 text-emerald-400">{el.label || 'Object'}</span>
                                                                )}
                                                                {el.type === 'text' && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-teal-500/15 text-teal-400">OCR</span>
                                                                )}
                                                                {el._source === 'ocr' && el.type !== 'object' && el.type !== 'text' && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-cyan-500/15 text-cyan-400">Visual</span>
                                                                )}
                                                                {el.isClickable && <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-violet-500/15 text-violet-400">Tap</span>}
                                                                {el.isEditable && <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-blue-500/15 text-blue-400">Input</span>}
                                                                {el.isScrollable && <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-amber-500/15 text-amber-400">Scroll</span>}
                                                                <span className={`text-[9px] font-mono ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{el.className}</span>
                                                                {el.bounds && <span className={`text-[9px] font-mono ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>{el.bounds.width}×{el.bounds.height}</span>}
                                                                {(el.xPercent !== undefined && el.yPercent !== undefined) && (
                                                                    <span className={`text-[9px] font-mono ${isDark ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>{el.xPercent.toFixed(1)}%,{el.yPercent.toFixed(1)}%</span>
                                                                )}
                                                            </div>
                                                            {el.contentDescription && (
                                                                <p className={`text-[10px] mt-1 truncate italic ${isDark ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>
                                                                    "{el.contentDescription}"
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
                                                                    <div className="flex flex-wrap gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
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
                                                        <svg className={`w-3 h-3 flex-shrink-0 ${isHovered ? 'text-violet-400' : isDark ? 'text-gray-700' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedElement && (
                            <div className={`w-72 flex-shrink-0 border-l ${isDark ? 'border-white/[0.06] bg-[#0c0c0e]' : 'border-gray-100 bg-gray-50/50'} flex flex-col overflow-y-auto`}>
                                {/* Detail Header */}
                                <div className={`px-3 py-2.5 border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-100'} flex items-center justify-between`}>
                                    <h3 className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Details</h3>
                                    <button onClick={() => setSelectedElement(null)} className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-200'}`}>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                {/* Detail Content */}
                                <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                                    {/* Element Name */}
                                    <div>
                                        <label className={`text-[9px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Element</label>
                                        <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{getElementName(selectedElement)}</p>
                                    </div>

                                    {/* Selector Strategy */}
                                    {(() => {
                                        const confidence = getConfidenceScore(selectedElement);
                                        const selectors = generateUiSelector(selectedElement, selectorStrategy);
                                        return (
                                            <div className={`p-2.5 rounded-lg ${isDark ? 'bg-white/[0.03] ring-1 ring-white/[0.06]' : 'bg-white ring-1 ring-gray-200'}`}>
                                                {/* Confidence */}
                                                <div className="flex items-center justify-between mb-2.5">
                                                    <span className={`text-[9px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Confidence</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${confidence.level === 'high' ? 'bg-emerald-500' : confidence.level === 'medium' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                        <span className={`text-[10px] font-bold ${confidence.level === 'high' ? 'text-emerald-400' : confidence.level === 'medium' ? 'text-amber-400' : 'text-red-400'}`}>{confidence.score}%</span>
                                                    </div>
                                                </div>
                                                <p className={`text-[9px] mb-2.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{confidence.reason}</p>

                                                {/* Strategy */}
                                                <div className="flex gap-1 mb-2.5">
                                                    {[
                                                        { value: 'smart', label: 'Smart' },
                                                        { value: 'id', label: 'ID' },
                                                        { value: 'text', label: 'Text' },
                                                        { value: 'icon', label: 'Icon' },
                                                    ].map(opt => (
                                                        <button
                                                            key={opt.value}
                                                            onClick={() => setSelectorStrategy(opt.value)}
                                                            className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-all ${selectorStrategy === opt.value
                                                                ? 'bg-violet-600 text-white'
                                                                : isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Generated Selectors */}
                                                {selectors && selectors.length > 0 && (
                                                    <div>
                                                        <label className={`text-[9px] font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Selectors</label>
                                                        <div className="space-y-1">
                                                            {selectors.slice(0, 3).map((sel, idx) => (
                                                                <div key={idx} className={`p-1.5 rounded-md text-[9px] font-mono ${idx === 0
                                                                    ? isDark ? 'bg-emerald-500/8 ring-1 ring-emerald-500/15 text-emerald-400' : 'bg-emerald-50 ring-1 ring-emerald-200 text-emerald-600'
                                                                    : isDark ? 'bg-white/[0.02] text-gray-500' : 'bg-white text-gray-500'
                                                                    }`}>
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <span className={`text-[8px] uppercase font-bold ${idx === 0 ? (isDark ? 'text-emerald-500' : 'text-emerald-600') : isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                            {idx === 0 ? 'PRIMARY' : `FALLBACK ${idx}`} · {sel.type}
                                                                        </span>
                                                                        <span className={`text-[8px] font-bold ${sel.confidence >= 80 ? 'text-emerald-400' : sel.confidence >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{sel.confidence}%</span>
                                                                    </div>
                                                                    <code className="block break-all leading-relaxed">{sel.uiSelector}</code>
                                                                    {sel.xpath && <code className={`block break-all mt-0.5 text-[8px] ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>XPath: {sel.xpath}</code>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* Resource ID */}
                                    {selectedElement.resourceId && (
                                        <div>
                                            <label className={`text-[9px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Resource ID</label>
                                            <p className={`text-[10px] font-mono mt-0.5 p-1.5 rounded-md break-all ${isDark ? 'bg-white/[0.03] text-violet-400' : 'bg-violet-50 text-violet-600'}`}>{selectedElement.resourceId}</p>
                                        </div>
                                    )}

                                    {/* Text Content */}
                                    {selectedElement.text && (
                                        <div>
                                            <label className={`text-[9px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Text</label>
                                            <p className={`text-xs mt-0.5 p-1.5 rounded-md ${isDark ? 'bg-white/[0.03] text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>"{selectedElement.text}"</p>
                                        </div>
                                    )}

                                    {/* Content Description */}
                                    {selectedElement.contentDescription && (
                                        <div>
                                            <label className={`text-[9px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Description</label>
                                            <p className={`text-xs mt-0.5 p-1.5 rounded-md ${isDark ? 'bg-white/[0.03] text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{selectedElement.contentDescription}</p>
                                        </div>
                                    )}

                                    {/* Class Name */}
                                    <div>
                                        <label className={`text-[9px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Class</label>
                                        <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{selectedElement.className || 'Unknown'}</p>
                                    </div>

                                    {/* Bounds */}
                                    {selectedElement.bounds && (
                                        <div>
                                            <label className={`text-[9px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Bounds</label>
                                            <div className={`mt-0.5 grid grid-cols-4 gap-1 text-[10px] font-mono`}>
                                                {[{ l: 'L', v: selectedElement.bounds.left }, { l: 'T', v: selectedElement.bounds.top }, { l: 'W', v: selectedElement.bounds.width }, { l: 'H', v: selectedElement.bounds.height }].map(b => <div key={b.l} className={`p-1 rounded text-center ${isDark ? 'bg-white/[0.03]' : 'bg-gray-100'}`}><span className={isDark ? 'text-gray-600' : 'text-gray-400'}>{b.l}</span> <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>{b.v}</span></div>)}
                                            </div>
                                            <p className={`text-[9px] font-mono mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                Center: <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>({Math.round(selectedElement.bounds.left + selectedElement.bounds.width / 2)}, {Math.round(selectedElement.bounds.top + selectedElement.bounds.height / 2)})</span>
                                            </p>
                                        </div>
                                    )}

                                    {/* Properties */}
                                    <div>
                                        <label className={`text-[9px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Properties</label>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {selectedElement.isClickable && <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-violet-500/15 text-violet-400">Clickable</span>}
                                            {selectedElement.isEditable && <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-blue-500/15 text-blue-400">Editable</span>}
                                            {selectedElement.isScrollable && <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-amber-500/15 text-amber-400">Scrollable</span>}
                                            {selectedElement.isCheckable && <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-emerald-500/15 text-emerald-400">Checkable{selectedElement.isChecked ? ' ✓' : ''}</span>}
                                            {selectedElement.isFocusable && <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-pink-500/15 text-pink-400">Focusable</span>}
                                            {selectedElement.isEnabled === false && <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-red-500/15 text-red-400">Disabled</span>}
                                            {!selectedElement.isClickable && !selectedElement.isEditable && !selectedElement.isScrollable && !selectedElement.isCheckable && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${isDark ? 'bg-white/[0.04] text-gray-500' : 'bg-gray-100 text-gray-500'}`}>Static</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Package */}
                                    {packageName && (
                                        <div>
                                            <label className={`text-[9px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Package</label>
                                            <p className={`text-[9px] font-mono mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{packageName}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Select Button */}
                                <div className={`p-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                                    {(() => {
                                        const conf = getConfidenceScore(selectedElement);
                                        return (
                                            <button
                                                onClick={() => { onSelect(buildSelectorOutput(selectedElement)); setSelectedElement(null); }}
                                                className="w-full py-2.5 rounded-lg font-semibold text-xs bg-violet-600 text-white hover:bg-violet-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                                                Chọn Element
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${conf.level === 'high' ? 'bg-emerald-500/30' : conf.level === 'medium' ? 'bg-amber-500/30' : 'bg-red-500/30'}`}>{conf.score}%</span>
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`px-5 py-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                            <svg className={`w-3.5 h-3.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className={`text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Hover để highlight, click để chọn</span>
                        </div>
                        <button onClick={onClose} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDark ? 'text-gray-500 hover:bg-white/[0.04]' : 'text-gray-400 hover:bg-gray-100'}`}>Đóng</button>
                    </div>
                </div>
            </div>
        </>
    );
}
