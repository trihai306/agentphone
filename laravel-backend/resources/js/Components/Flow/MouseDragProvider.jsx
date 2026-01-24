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

    // Start dragging
    const startDrag = useCallback((nodeType, nodeLabel, nodeColor, bgColor) => {
        setIsDragging(true);
        setDragData({ type: nodeType, label: nodeLabel, color: nodeColor, bgColor });
    }, []);

    // Stop dragging
    const stopDrag = useCallback(() => {
        setIsDragging(false);
        setDragData(null);
    }, []);

    // Handle global mouse move
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            setCursorPosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseUp = (e) => {
            // Check if we dropped on the canvas (react-flow area)
            const target = e.target;
            const reactFlowPane = target.closest('.react-flow__pane') ||
                target.closest('.react-flow__renderer') ||
                target.closest('.react-flow');

            if (reactFlowPane && dragData && onDropInCanvas) {
                // Get the position relative to the react-flow container
                const container = reactFlowPane.closest('.react-flow');
                if (container) {
                    const rect = container.getBoundingClientRect();
                    onDropInCanvas({
                        type: dragData.type,
                        label: dragData.label,
                        clientX: e.clientX,
                        clientY: e.clientY,
                        offsetX: e.clientX - rect.left,
                        offsetY: e.clientY - rect.top,
                    });
                }
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
    }, [isDragging, dragData, onDropInCanvas, stopDrag]);

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
