/**
 * DebugEventPanel - Developer debug panel for APK events
 * Shows raw events captured from recording sessions
 * 
 * @param {Object} props
 * @param {Array} props.events - Array of debug events
 * @param {boolean} props.isOpen - Whether panel is visible
 * @param {Function} props.onClose - Close panel callback
 * @param {Function} props.onClear - Clear events callback
 * @param {boolean} props.hasConfigPanel - Whether config panel is open (for positioning)
 */
export default function DebugEventPanel({
    events = [],
    isOpen,
    onToggle,
    onClose,
    onClear,
    hasConfigPanel = false,
}) {
    return (
        <>
            {/* Debug Panel Overlay */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '10px',
                        right: hasConfigPanel ? '340px' : '10px',
                        width: '500px',
                        maxHeight: '300px',
                        background: 'rgba(15, 23, 42, 0.95)',
                        borderRadius: '12px',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: '#fff',
                        zIndex: 50,
                        overflow: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        transition: 'right 0.3s ease',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '8px 16px',
                        background: 'rgba(139, 92, 246, 0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1
                    }}>
                        <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>
                            🔍 APK Event Debug ({events.length} events)
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={onClear}
                                style={{
                                    padding: '4px 8px',
                                    background: 'rgba(239, 68, 68, 0.3)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '10px'
                                }}
                            >
                                Clear
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '4px 8px',
                                    background: 'rgba(100, 116, 139, 0.3)',
                                    color: '#94a3b8',
                                    border: '1px solid rgba(100, 116, 139, 0.5)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '10px'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    {/* Event List */}
                    <div style={{ padding: '8px' }}>
                        {events.length === 0 && (
                            <div style={{
                                color: '#64748b',
                                textAlign: 'center',
                                padding: '40px',
                                fontStyle: 'italic'
                            }}>
                                Waiting for APK events... Start recording to see data here.
                            </div>
                        )}
                        {events.slice().reverse().map((event, idx) => (
                            <div
                                key={event.id}
                                style={{
                                    marginBottom: '12px',
                                    padding: '8px',
                                    background: 'rgba(30, 41, 59, 0.8)',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(71, 85, 105, 0.3)'
                                }}
                            >
                                <div style={{
                                    color: '#22c55e',
                                    fontWeight: 'bold',
                                    marginBottom: '4px'
                                }}>
                                    #{events.length - idx}: {event.raw?.event_type || 'unknown'}
                                    <span style={{ color: '#64748b', fontWeight: 'normal', marginLeft: '8px' }}>
                                        {event.receivedAt}
                                    </span>
                                </div>
                                <table style={{ width: '100%', color: '#e2e8f0' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ color: '#f472b6', width: '120px' }}>package_name:</td>
                                            <td>{event.raw?.package_name || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#f472b6' }}>class_name:</td>
                                            <td style={{ wordBreak: 'break-all' }}>{event.raw?.class_name || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#60a5fa' }}>resource_id:</td>
                                            <td style={{
                                                wordBreak: 'break-all',
                                                color: event.raw?.resource_id ? '#4ade80' : '#64748b'
                                            }}>
                                                {event.raw?.resource_id || '(empty)'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#fbbf24' }}>text:</td>
                                            <td style={{
                                                color: event.raw?.text ? '#fde047' : '#64748b'
                                            }}>
                                                {event.raw?.text || '(empty)'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#c084fc' }}>content_desc:</td>
                                            <td>{event.raw?.content_description || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#2dd4bf' }}>bounds:</td>
                                            <td>{typeof event.raw?.bounds === 'object' && event.raw?.bounds ? `${event.raw.bounds.width ?? 0}×${event.raw.bounds.height ?? 0}` : (event.raw?.bounds || '-')}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#fb923c' }}>x, y:</td>
                                            <td>{event.raw?.x ?? '-'}, {event.raw?.y ?? '-'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#94a3b8' }}>flags:</td>
                                            <td>
                                                {event.raw?.is_clickable && <span style={{ color: '#22c55e', marginRight: '4px' }}>clickable</span>}
                                                {event.raw?.is_editable && <span style={{ color: '#3b82f6', marginRight: '4px' }}>editable</span>}
                                                {event.raw?.is_scrollable && <span style={{ color: '#a855f7' }}>scrollable</span>}
                                            </td>
                                        </tr>
                                        {event.raw?.action_data && (
                                            <tr>
                                                <td style={{ color: '#818cf8' }}>action_data:</td>
                                                <td style={{ color: '#c7d2fe', wordBreak: 'break-all' }}>
                                                    {JSON.stringify(event.raw.action_data)}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={onToggle}
                style={{
                    position: 'fixed',
                    bottom: isOpen ? '310px' : '10px',
                    right: hasConfigPanel ? '340px' : '10px',
                    padding: '8px 12px',
                    background: isOpen ? 'rgba(139, 92, 246, 0.8)' : 'rgba(30, 41, 59, 0.9)',
                    color: isOpen ? '#fff' : '#a78bfa',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    zIndex: 55,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'right 0.3s ease, bottom 0.3s ease'
                }}
            >
                🔍 Debug {events.length > 0 && `(${events.length})`}
            </button>
        </>
    );
}
