import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

/**
 * MouseDragProvider - Custom mouse-based drag system to replace unreliable HTML5 Drag API
 * 
 * This provides a reliable cross-browser drag and drop implementation using
 * mousedown/mousemove/mouseup events instead of the native drag API.
 */

const MouseDragContext = createContext(null);

export function useMouseDrag() {
    const context = useContext(MouseDragContext);
    if (!context) {
        throw new Error('useMouseDrag must be used within a MouseDragProvider');
    }
    return context;
}

export function MouseDragProvider({ children, onDropInCanvas, isDark = false }) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragData, setDragData] = useState(null);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const dragPreviewRef = useRef(null);

    // Use refs to always have the latest values in event handlers (avoids stale closure)
    const dragDataRef = useRef(null);
    const onDropInCanvasRef = useRef(onDropInCanvas);

    // Keep refs updated
    useEffect(() => {
        dragDataRef.current = dragData;
    }, [dragData]);

    useEffect(() => {
        onDropInCanvasRef.current = onDropInCanvas;
    }, [onDropInCanvas]);

    // Start dragging
    const startDrag = useCallback((nodeType, nodeLabel, nodeColor, bgColor) => {
        const data = { type: nodeType, label: nodeLabel, color: nodeColor, bgColor };
        dragDataRef.current = data; // Set ref immediately for synchronous access
        setDragData(data);
        setIsDragging(true);
    }, []);

    // Stop dragging
    const stopDrag = useCallback(() => {
        setIsDragging(false);
        setDragData(null);
        dragDataRef.current = null;
    }, []);

    // Handle global mouse move and mouse up
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            setCursorPosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseUp = (e) => {
            // Use refs to get the latest values (avoids stale closure)
            const currentDragData = dragDataRef.current;
            const currentOnDrop = onDropInCanvasRef.current;

            console.log('[MouseDrag] mouseup at', e.clientX, e.clientY, 'dragData:', currentDragData);

            // Use elementFromPoint to reliably detect what's under the cursor
            const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
            console.log('[MouseDrag] elementAtPoint:', elementAtPoint?.className);

            // Check if we're still in the sidebar (if so, don't drop)
            const isInSidebar = elementAtPoint?.closest('.flow-editor-sidebar');

            // Check if we dropped on the canvas (react-flow area)
            let reactFlowPane = elementAtPoint?.closest('.react-flow__pane') ||
                elementAtPoint?.closest('.react-flow__renderer') ||
                elementAtPoint?.closest('.react-flow');

            // Fallback: if not detected directly but we're not in sidebar, find any react-flow
            if (!reactFlowPane && !isInSidebar) {
                reactFlowPane = document.querySelector('.react-flow');
                console.log('[MouseDrag] Using fallback react-flow detection');
            }

            console.log('[MouseDrag] reactFlowPane found:', !!reactFlowPane, 'isInSidebar:', !!isInSidebar);

            if (reactFlowPane && currentDragData && currentOnDrop && !isInSidebar) {
                // Get the position relative to the react-flow container
                const container = reactFlowPane.closest('.react-flow') || reactFlowPane;
                const rect = container.getBoundingClientRect();
                console.log('[MouseDrag] Dropping node at', e.clientX - rect.left, e.clientY - rect.top);
                currentOnDrop({
                    type: currentDragData.type,
                    label: currentDragData.label,
                    clientX: e.clientX,
                    clientY: e.clientY,
                    offsetX: e.clientX - rect.left,
                    offsetY: e.clientY - rect.top,
                });
            }

            stopDrag();
        };

        // Prevent text selection while dragging
        const handleSelectStart = (e) => {
            e.preventDefault();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('selectstart', handleSelectStart);
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('selectstart', handleSelectStart);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, stopDrag]);

    const value = {
        isDragging,
        dragData,
        cursorPosition,
        startDrag,
        stopDrag,
    };

    return (
        <MouseDragContext.Provider value={value}>
            {children}

            {/* Drag Preview - follows cursor */}
            {isDragging && dragData && (
                <div
                    ref={dragPreviewRef}
                    className="fixed pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                        left: cursorPosition.x,
                        top: cursorPosition.y,
                    }}
                >
                    <div
                        className={`px-3 py-2 rounded-lg border-2 shadow-lg flex items-center gap-2 ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'
                            }`}
                        style={{
                            borderColor: dragData.color,
                            boxShadow: `0 8px 32px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'}`,
                        }}
                    >
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: dragData.color }}
                        />
                        <span
                            className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                            style={{ color: dragData.color }}
                        >
                            {dragData.label}
                        </span>
                    </div>
                </div>
            )}
        </MouseDragContext.Provider>
    );
}

/**
 * DraggableNode - Wrapper component for nodes that can be dragged
 */
export function DraggableNode({ children, nodeType, nodeLabel, nodeColor, nodeBgColor, className = '', ...props }) {
    const { startDrag, isDragging } = useMouseDrag();

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        startDrag(nodeType, nodeLabel, nodeColor, nodeBgColor);
    }, [startDrag, nodeType, nodeLabel, nodeColor, nodeBgColor]);

    return (
        <div
            onMouseDown={handleMouseDown}
            className={`${className} ${isDragging ? 'opacity-50' : ''}`}
            style={{ cursor: 'grab' }}
            {...props}
        >
            {children}
        </div>
    );
}
