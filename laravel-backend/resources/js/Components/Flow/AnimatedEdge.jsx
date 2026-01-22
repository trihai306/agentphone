import React from 'react';
import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';

/**
 * Animated edge component with flowing particle effect for execution visualization
 * Supports branch types (true/false) for conditional coloring
 * Supports delay configuration with label display
 */
function AnimatedEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    sourceHandleId,
    style = {},
    markerEnd,
    data,
}) {
    const executionState = data?.executionState || 'idle';
    const isDark = data?.isDark ?? true;
    const branchType = data?.branchType || sourceHandleId; // 'true', 'false', or default
    const delay = data?.delay; // { mode, fixedSeconds, minSeconds, maxSeconds }
    const onEdgeClick = data?.onEdgeClick; // callback for edge click

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Color based on execution state AND branch type
    const getEdgeColor = () => {
        // Priority 1: Execution state colors
        switch (executionState) {
            case 'running':
                return '#6366f1'; // Indigo
            case 'success':
                return '#10b981'; // Green
            case 'error':
                return '#ef4444'; // Red
            case 'pending':
                return isDark ? '#4b5563' : '#9ca3af'; // Gray
        }

        // Priority 2: Branch type colors (for idle state)
        switch (branchType) {
            case 'true':
            case 'success':
                return '#22c55e'; // Green for TRUE path
            case 'false':
            case 'error':
                return '#f87171'; // Red for FALSE path
            default:
                return '#6366f1'; // Default indigo
        }
    };

    const edgeColor = getEdgeColor();
    const isAnimating = executionState === 'running';
    const isSuccess = executionState === 'success';
    const isError = executionState === 'error';

    // Generate delay label text
    const getDelayLabel = () => {
        if (!delay || delay.mode === 'none') return null;
        if (delay.mode === 'fixed') return `⏱️ ${delay.fixedSeconds}s`;
        if (delay.mode === 'random') return `⏱️ ${delay.minSeconds}-${delay.maxSeconds}s`;
        return null;
    };

    const delayLabel = getDelayLabel();
    const hasDelay = delay && delay.mode !== 'none';

    // Handle edge click for delay configuration
    const handleEdgeClick = (e) => {
        e.stopPropagation();
        if (onEdgeClick) {
            onEdgeClick(id, { x: labelX, y: labelY }, delay);
        }
    };

    return (
        <>
            {/* Invisible wider path for easier clicking */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ cursor: 'pointer' }}
                onClick={handleEdgeClick}
            />

            {/* Background edge (thicker, for depth) */}
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: edgeColor,
                    strokeWidth: 2,
                    strokeOpacity: executionState === 'pending' ? 0.3 : 0.6,
                    transition: 'stroke 0.3s ease, stroke-opacity 0.3s ease',
                }}
            />

            {/* Main edge */}
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: edgeColor,
                    strokeWidth: 2,
                    filter: isAnimating ? `drop-shadow(0 0 4px ${edgeColor})` : 'none',
                    transition: 'stroke 0.3s ease, filter 0.3s ease',
                }}
            />

            {/* Animated particles when running */}
            {isAnimating && (
                <>
                    <circle r="4" fill={edgeColor} filter={`drop-shadow(0 0 4px ${edgeColor})`}>
                        <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
                    </circle>
                    <circle r="4" fill={edgeColor} filter={`drop-shadow(0 0 4px ${edgeColor})`}>
                        <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} begin="0.5s" />
                    </circle>
                    <circle r="4" fill={edgeColor} filter={`drop-shadow(0 0 4px ${edgeColor})`}>
                        <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} begin="1s" />
                    </circle>
                </>
            )}

            {/* Success particles (burst effect) */}
            {isSuccess && (
                <circle r="6" fill={edgeColor} opacity="0">
                    <animateMotion dur="0.5s" path={edgePath} fill="freeze" />
                    <animate attributeName="opacity" values="1;0" dur="0.5s" fill="freeze" />
                    <animate attributeName="r" values="4;8" dur="0.5s" fill="freeze" />
                </circle>
            )}

            {/* Delay label - always show if configured */}
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                        cursor: 'pointer',
                    }}
                    className="nodrag nopan"
                    onClick={handleEdgeClick}
                >
                    {/* Delay label badge */}
                    {delayLabel ? (
                        <div
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all border ${isAnimating
                                    ? 'bg-indigo-500/30 text-indigo-300 border-indigo-500/50 animate-pulse'
                                    : 'bg-gray-800/90 text-gray-300 border-gray-600 hover:border-indigo-500 hover:bg-indigo-500/20'
                                }`}
                            title="Click to configure delay"
                        >
                            {delayLabel}
                        </div>
                    ) : (
                        /* Show hint dot when no delay set */
                        <div
                            className="w-4 h-4 rounded-full bg-gray-700/50 border border-gray-600 hover:bg-indigo-500/30 hover:border-indigo-500 transition-all flex items-center justify-center"
                            title="Click to add delay"
                        >
                            <span className="text-[8px] text-gray-400">+</span>
                        </div>
                    )}

                    {/* Execution state label */}
                    {data?.showLabel && (
                        <div
                            className={`mt-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${isAnimating
                                ? 'bg-indigo-500/20 text-indigo-400 animate-pulse'
                                : isSuccess
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : isError
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'hidden'
                                }`}
                        >
                            {isAnimating && '⏳ Flowing...'}
                            {isSuccess && '✓ Done'}
                            {isError && '✗ Error'}
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

export default AnimatedEdge;

