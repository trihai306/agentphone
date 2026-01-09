import React from 'react';
import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';

/**
 * Animated edge component with flowing particle effect for execution visualization
 */
function AnimatedEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}) {
    const executionState = data?.executionState || 'idle';
    const isDark = data?.isDark ?? true;

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Color based on execution state
    const getEdgeColor = () => {
        switch (executionState) {
            case 'running':
                return '#6366f1'; // Indigo
            case 'success':
                return '#10b981'; // Green
            case 'error':
                return '#ef4444'; // Red
            case 'pending':
                return isDark ? '#4b5563' : '#9ca3af'; // Gray
            default:
                return '#6366f1'; // Default indigo
        }
    };

    const edgeColor = getEdgeColor();
    const isAnimating = executionState === 'running';
    const isSuccess = executionState === 'success';
    const isError = executionState === 'error';

    return (
        <>
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

            {/* Edge label showing execution info */}
            {data?.showLabel && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        <div
                            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${isAnimating
                                    ? 'bg-indigo-500/20 text-indigo-400 animate-pulse'
                                    : isSuccess
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : isError
                                            ? 'bg-red-500/20 text-red-400'
                                            : isDark
                                                ? 'bg-gray-800/80 text-gray-400'
                                                : 'bg-white/80 text-gray-500'
                                }`}
                        >
                            {isAnimating && '⏳ Flowing...'}
                            {isSuccess && '✓ Done'}
                            {isError && '✗ Error'}
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}

export default AnimatedEdge;
