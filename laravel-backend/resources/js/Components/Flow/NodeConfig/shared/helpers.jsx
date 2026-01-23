/**
 * Helper functions and components for node configuration
 */

/**
 * Get human-readable name for node type
 */
export function getNodeTypeName(type) {
    const names = {
        text_data: 'Text Input',
        loop: 'Loop',
        condition: 'Condition',
        http: 'HTTP Request',
        ai_process: 'AI Process',
        data_source: 'Data Source',
        wait: 'Wait/Delay',
        input: 'Start',
        output: 'End',
        click: 'Click Action',
        scroll: 'Scroll',
        swipe: 'Swipe',
    };
    return names[type] || type;
}

/**
 * Visual icon for node type with color coding
 */
export function NodeTypeIcon({ type }) {
    const colors = {
        text_data: '#a855f7',
        loop: '#6366f1',
        condition: '#f97316',
        http: '#f97316',
        ai_process: '#ec4899',
        data_source: '#f59e0b',
        wait: '#6b7280',
        input: '#10b981',
        output: '#ef4444',
    };

    return (
        <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: `${colors[type] || '#6b7280'}20` }}
        >
            <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors[type] || '#6b7280' }}
            />
        </div>
    );
}
