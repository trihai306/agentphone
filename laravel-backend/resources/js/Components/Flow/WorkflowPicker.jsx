import { useState } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * WorkflowPicker - Select and order multiple workflows for a job
 * Supports drag-drop reordering
 */
export default function WorkflowPicker({
    workflows = [],
    selectedWorkflows = [],
    onChange,
    maxSelections = 10,
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [draggedIndex, setDraggedIndex] = useState(null);

    const handleToggle = (workflow) => {
        const exists = selectedWorkflows.find(w => w.id === workflow.id);
        if (exists) {
            onChange(selectedWorkflows.filter(w => w.id !== workflow.id));
        } else if (selectedWorkflows.length < maxSelections) {
            onChange([...selectedWorkflows, workflow]);
        }
    };

    const handleRemove = (workflowId) => {
        onChange(selectedWorkflows.filter(w => w.id !== workflowId));
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newList = [...selectedWorkflows];
        const [draggedItem] = newList.splice(draggedIndex, 1);
        newList.splice(index, 0, draggedItem);

        setDraggedIndex(index);
        onChange(newList);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <div className="space-y-4">
            {/* Selected Workflows (Ordered) */}
            {selectedWorkflows.length > 0 && (
                <div>
                    <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        WORKFLOW CHAIN ({selectedWorkflows.length})
                    </label>
                    <div className={`rounded-xl border p-2 space-y-1 ${isDark ? 'bg-[#0a0a0a] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
                        {selectedWorkflows.map((workflow, index) => (
                            <div
                                key={workflow.id}
                                draggable
                                onDragStart={e => handleDragStart(e, index)}
                                onDragOver={e => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-move transition-all
                                    ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                                    ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525]' : 'bg-white hover:bg-gray-100'}`}
                            >
                                {/* Sequence Number */}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                                    ${isDark ? 'bg-violet-500/30 text-violet-300' : 'bg-violet-100 text-violet-600'}`}>
                                    {index + 1}
                                </div>

                                {/* Drag Handle */}
                                <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>⠿</span>

                                {/* Workflow Name */}
                                <span className={`flex-1 text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {workflow.name}
                                </span>

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemove(workflow.id)}
                                    className={`w-6 h-6 rounded flex items-center justify-center text-xs
                                        ${isDark ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                    <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        Drag to reorder • Workflows run in sequence
                    </p>
                </div>
            )}

            {/* Available Workflows */}
            <div>
                <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    AVAILABLE WORKFLOWS
                </label>
                <div className={`rounded-xl border overflow-hidden max-h-48 overflow-y-auto ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                    {workflows.filter(w => !selectedWorkflows.find(s => s.id === w.id)).length === 0 ? (
                        <div className={`p-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {workflows.length === 0 ? 'No workflows available' : 'All workflows selected'}
                        </div>
                    ) : (
                        workflows
                            .filter(w => !selectedWorkflows.find(s => s.id === w.id))
                            .map(workflow => (
                                <button
                                    key={workflow.id}
                                    onClick={() => handleToggle(workflow)}
                                    disabled={selectedWorkflows.length >= maxSelections}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                                        ${isDark ? 'hover:bg-[#1a1a1a] border-b border-[#1a1a1a] last:border-0' : 'hover:bg-gray-50 border-b border-gray-100 last:border-0'}
                                        ${selectedWorkflows.length >= maxSelections ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                        ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                        📋
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {workflow.name}
                                        </p>
                                        {workflow.description && (
                                            <p className={`text-[11px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {workflow.description}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`text-lg ${isDark ? 'text-violet-400' : 'text-violet-500'}`}>+</span>
                                </button>
                            ))
                    )}
                </div>
            </div>
        </div>
    );
}
