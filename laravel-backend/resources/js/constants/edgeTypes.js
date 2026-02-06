/**
 * Edge Types and Default Options for Flow Editor
 */
import { MarkerType } from 'reactflow';
import AnimatedEdge from '@/Components/Flow/AnimatedEdge';

export const edgeTypes = {
    animated: AnimatedEdge,
};

export const defaultEdgeOptions = {
    type: 'animated',
    animated: true,
    style: { strokeWidth: 2, stroke: '#6366f1' },
    markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6366f1',
        width: 20,
        height: 20,
    },
    // Default delay of 2 seconds between nodes
    // Format matches EdgeDelayPopover: { mode, fixedMs, minMs, maxMs }
    data: {
        delay: {
            mode: 'fixed',
            fixedMs: 2000,  // 2 seconds default
            minMs: 1000,
            maxMs: 3000,
        },
    },
};

export default { edgeTypes, defaultEdgeOptions };
