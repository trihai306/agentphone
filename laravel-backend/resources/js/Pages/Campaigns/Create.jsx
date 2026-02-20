import { useState, useMemo, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import WorkflowConfigPanel from '@/Components/Campaigns/WorkflowConfigPanel';
import { Button, Icon } from '@/Components/UI';
import { campaignApi } from '@/services/api';

// Quick Start Templates
const TEMPLATES = [
    {
        id: 'facebook-farming',
        icon: 'seed',
        name: 'Nuôi Facebook Daily',
        description: 'Đăng bài, like, comment tự động mỗi ngày',
        tags: ['facebook', 'social'],
        color: 'from-blue-500 to-blue-600'
    },
    {
        id: 'tiktok-farming',
        icon: 'music',
        name: 'Nuôi TikTok',
        description: 'Xem video, like, follow tự động',
        tags: ['tiktok', 'video'],
        color: 'from-pink-500 to-rose-600'
    },
    {
        id: 'lead-generation',
        icon: 'target',
        name: 'Lead Generation',
        description: 'Thu thập leads từ các nền tảng',
        tags: ['leads', 'marketing'],
        color: 'from-emerald-500 to-teal-600'
    },
    {
        id: 'custom',
        icon: 'settings',
        name: 'Tùy chỉnh',
        description: 'Cấu hình theo ý muốn',
        tags: [],
        color: 'from-gray-500 to-gray-600'
    }
];

export default function Create({ dataCollections = [], workflows = [], devices = [] }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [showTemplates, setShowTemplates] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedWorkflows, setSelectedWorkflows] = useState([]);
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [repeatPerRecord, setRepeatPerRecord] = useState(1);
    const [searchWF, setSearchWF] = useState('');

    // NEW: Per-workflow configuration
    const [workflowConfigs, setWorkflowConfigs] = useState([]);
    // Structure: [{ flow_id, sequence, repeat_count, execution_mode, delay_between_repeats }]
    const [configPanelWorkflow, setConfigPanelWorkflow] = useState(null);

    // Data selection state
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [dataMode, setDataMode] = useState('all'); // 'all' | 'limit' | 'select'
    const [recordLimit, setRecordLimit] = useState(100);
    const [selectedRecordIds, setSelectedRecordIds] = useState([]);
    const [showRecordPicker, setShowRecordPicker] = useState(false);
    const [records, setRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(false);

    // Smart Data Config - Data Pools for in-job loops
    const [dataPools, setDataPools] = useState([]);
    // Pool structure: { id, variable, collection_id, field, count, mode }
    const [recordsPerDevice, setRecordsPerDevice] = useState('');

    // Device Record Assignment - Manual mode
    const [assignmentMode, setAssignmentMode] = useState('auto'); // 'auto' | 'manual'
    const [deviceRecordAssignments, setDeviceRecordAssignments] = useState({}); // { deviceId: [recordId, ...] }
    const [activeDeviceForPicker, setActiveDeviceForPicker] = useState(null);

    // NEW: Per-device data collection assignment
    const [deviceCollectionAssignments, setDeviceCollectionAssignments] = useState({}); // { deviceId: collectionId }

    // UX Improvements: Simplified mode
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [quickPreset, setQuickPreset] = useState('auto'); // 'auto' | 'all_devices' | 'custom'


    const onlineDevices = devices.filter(d => d.socket_connected || d.status === 'online');

    // Load records when collection is selected and picker is opened
    useEffect(() => {
        if (showRecordPicker && selectedCollection && records.length === 0) {
            loadRecords();
        }
    }, [showRecordPicker, selectedCollection]);

    const loadRecords = async () => {
        if (!selectedCollection) return;
        setLoadingRecords(true);
        try {
            const result = await campaignApi.getCollectionRecords(selectedCollection.id);
            setRecords(result.data?.data || []);
        } catch (error) {
            console.error('Failed to load records:', error);
        }
        setLoadingRecords(false);
    };

    const toggleRecord = (recordId) => {
        if (selectedRecordIds.includes(recordId)) {
            setSelectedRecordIds(selectedRecordIds.filter(id => id !== recordId));
        } else {
            setSelectedRecordIds([...selectedRecordIds, recordId]);
        }
    };

    const selectAllRecords = () => {
        setSelectedRecordIds(records.map(r => r.id));
    };

    const clearSelection = () => {
        setSelectedRecordIds([]);
    };

    // Device record assignment helpers
    const toggleRecordForDevice = (deviceId, recordId) => {
        setDeviceRecordAssignments(prev => {
            const current = prev[deviceId] || [];
            const updated = current.includes(recordId)
                ? current.filter(id => id !== recordId)
                : [...current, recordId];
            return { ...prev, [deviceId]: updated };
        });
    };

    const getAssignedRecordCount = (deviceId) => {
        return (deviceRecordAssignments[deviceId] || []).length;
    };

    const getTotalAssignedRecords = () => {
        return Object.values(deviceRecordAssignments).reduce((sum, arr) => sum + arr.length, 0);
    };

    // Filter workflows (exclude selected)
    const availableWorkflows = useMemo(() => {
        const selected = new Set(selectedWorkflows.map(w => w.id));
        let result = workflows.filter(w => !selected.has(w.id));
        if (searchWF.trim()) {
            result = result.filter(w => w.name.toLowerCase().includes(searchWF.toLowerCase()));
        }
        return result;
    }, [workflows, selectedWorkflows, searchWF]);

    const addWorkflow = (wf) => {
        const newWorkflows = [...selectedWorkflows, wf];
        setSelectedWorkflows(newWorkflows);

        // Initialize config for new workflow
        const newConfig = {
            flow_id: wf.id,
            sequence: newWorkflows.length - 1,
            repeat_count: 1,
            execution_mode: 'once',
            delay_between_repeats: null,
        };
        setWorkflowConfigs([...workflowConfigs, newConfig]);
        setSearchWF('');
    };

    const removeWorkflow = (id) => {
        const newWorkflows = selectedWorkflows.filter(w => w.id !== id);
        setSelectedWorkflows(newWorkflows);

        // Remove config for removed workflow
        const newConfigs = workflowConfigs.filter(c => c.flow_id !== id);
        // Update sequences
        const updatedConfigs = newConfigs.map((c, index) => ({ ...c, sequence: index }));
        setWorkflowConfigs(updatedConfigs);
    };

    const moveWorkflow = (index, direction) => {
        const newList = [...selectedWorkflows];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= newList.length) return;
        [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
        setSelectedWorkflows(newList);

        // Update sequences in configs
        const updatedConfigs = workflowConfigs.map(config => {
            const wfIndex = newList.findIndex(w => w.id === config.flow_id);
            return { ...config, sequence: wfIndex };
        });
        setWorkflowConfigs(updatedConfigs);
    };

    // NEW: Workflow config helpers
    const getWorkflowConfig = (flowId) => {
        return workflowConfigs.find(c => c.flow_id === flowId) || {
            flow_id: flowId,
            sequence: 0,
            repeat_count: 1,
            execution_mode: 'once',
            delay_between_repeats: null,
        };
    };

    const updateWorkflowConfig = (flowId, updates) => {
        const configIndex = workflowConfigs.findIndex(c => c.flow_id === flowId);
        if (configIndex >= 0) {
            const newConfigs = [...workflowConfigs];
            newConfigs[configIndex] = { ...newConfigs[configIndex], ...updates };
            setWorkflowConfigs(newConfigs);
        }
    };

    const openConfigPanel = (workflow) => {
        setConfigPanelWorkflow(workflow);
    };

    const closeConfigPanel = () => {
        setConfigPanelWorkflow(null);
    };

    const toggleDevice = (device) => {
        const exists = selectedDevices.find(d => d.id === device.id);
        if (exists) {
            setSelectedDevices(selectedDevices.filter(d => d.id !== device.id));
        } else {
            setSelectedDevices([...selectedDevices, device]);
        }
    };

    const selectAllDevices = () => {
        setSelectedDevices([...devices]);
    };

    const clearDevices = () => {
        setSelectedDevices([]);
    };

    // Data Pool management functions
    const addDataPool = () => {
        const newPool = {
            id: Date.now(),
            variable: '',
            collection_id: null,
            field: '',
            count: 5,
            mode: 'random'
        };
        setDataPools([...dataPools, newPool]);
    };

    const updateDataPool = (poolId, updates) => {
        setDataPools(dataPools.map(p => p.id === poolId ? { ...p, ...updates } : p));
    };

    const removeDataPool = (poolId) => {
        setDataPools(dataPools.filter(p => p.id !== poolId));
    };

    // Get collection schema fields for dropdown
    const getCollectionFields = (collectionId) => {
        const collection = dataCollections.find(dc => dc.id === collectionId);
        if (!collection?.schema) return [];
        return collection.schema.map(s => s.name || s.key).filter(Boolean);
    };

    // Calculate effective record count
    const effectiveRecordCount = useMemo(() => {
        if (!selectedCollection) return 0;
        const total = selectedCollection.records_count || 0;
        if (dataMode === 'all') return total;
        if (dataMode === 'limit') return Math.min(recordLimit, total);
        if (dataMode === 'select') return selectedRecordIds.length;
        return total;
    }, [selectedCollection, dataMode, recordLimit, selectedRecordIds]);

    // 4 steps: 1-Name & Workflows, 2-Devices, 3-Config, 4-Confirm
    const canProceed = () => {
        if (step === 1) return name.trim() && selectedWorkflows.length > 0;
        if (step === 2) return selectedDevices.length > 0;
        return true;
    };

    const getValidationHint = () => {
        if (step === 1) {
            if (!name.trim()) return 'Nhập tên campaign';
            if (selectedWorkflows.length === 0) return 'Thêm ít nhất 1 kịch bản';
        }
        if (step === 2 && selectedDevices.length === 0) {
            return 'Chọn ít nhất 1 thiết bị';
        }
        return null;
    };

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        if (template.id !== 'custom') {
            setName(template.name);
        }
        setShowTemplates(false);
    };

    const handleSubmit = () => {
        if (!canProceed()) return;

        setIsSubmitting(true);

        // Build record filter based on data mode
        let recordFilter = null;
        if (selectedCollection) {
            if (dataMode === 'limit') {
                recordFilter = { type: 'limit', value: recordLimit };
            } else if (dataMode === 'select') {
                recordFilter = { type: 'ids', value: selectedRecordIds };
            }
        }

        // Build data_config structure
        let dataConfig = null;
        if (selectedCollection || dataPools.length > 0) {
            dataConfig = {
                primary: selectedCollection ? {
                    collection_id: selectedCollection.id,
                    mapping: {} // Auto-map fields by name
                } : null,
                pools: dataPools
                    .filter(p => p.variable && p.collection_id)
                    .map(p => ({
                        variable: p.variable,
                        collection_id: p.collection_id,
                        field: p.field || null,
                        count: p.count || 5,
                        mode: p.mode || 'random'
                    }))
            };
        }

        router.post('/campaigns', {
            name,
            description,
            data_collection_id: selectedCollection?.id || null,
            // NEW: Send workflow configs instead of plain IDs
            workflow_configs: workflowConfigs.map(config => ({
                flow_id: config.flow_id,
                sequence: config.sequence,
                repeat_count: config.repeat_count,
                execution_mode: config.execution_mode,
                delay_between_repeats: config.delay_between_repeats,
                variable_source_collection_id: config.variable_source_collection_id,
                iteration_strategy: config.iteration_strategy,
            })),
            device_ids: selectedDevices.map(d => d.id),
            repeat_per_record: repeatPerRecord,
            record_filter: recordFilter,
            data_config: dataConfig,
            records_per_device: assignmentMode === 'auto' && recordsPerDevice ? parseInt(recordsPerDevice) : null,
            device_record_assignments: assignmentMode === 'manual' ? deviceRecordAssignments : null,
            device_collection_assignments: deviceCollectionAssignments, // NEW: Per-device collection mapping
        }, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Template Selection Screen
    if (showTemplates) {
        return (
            <AppLayout title="Tạo Campaign">
                <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gray-50'}`}>
                    <div className="max-w-5xl mx-auto px-6 py-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg mb-4">
                                <Icon name="rocket" className="w-8 h-8" />
                            </div>
                            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Tạo Campaign Mới
                            </h1>
                            <p className={`text-sm mt-2 max-w-lg mx-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Campaign tự động chạy kịch bản trên nhiều thiết bị
                            </p>
                        </div>

                        {/* How It Works - Simplified */}
                        <div className={`rounded-2xl p-6 mb-8 ${isDark ? 'bg-white/5' : 'bg-white shadow-lg'}`}>
                            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <Icon name="book" className="w-4 h-4 inline-block mr-1" /> Cách thức hoạt động
                            </h2>
                            <div className="flex items-center justify-center gap-4">
                                {[
                                    { icon: 'credits', title: 'Kịch bản', desc: 'Chọn workflow' },
                                    { icon: '→', isArrow: true },
                                    { icon: 'device', title: 'Thiết bị', desc: 'Chọn điện thoại' },
                                    { icon: '→', isArrow: true },
                                    { icon: 'database', title: 'Dữ liệu', desc: 'Chọn records chạy' },
                                    { icon: '→', isArrow: true },
                                    { icon: 'target', title: 'Kết quả', desc: 'Jobs tự động tạo' },
                                ].map((item, i) => (
                                    item.isArrow ? (
                                        <span key={i} className={`text-2xl ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>→</span>
                                    ) : (
                                        <div key={i} className="text-center flex-1 max-w-[120px]">
                                            <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                <span className="text-lg">{item.icon}</span>
                                            </div>
                                            <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.desc}</p>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {/* Templates */}
                        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <Icon name="credits" className="w-4 h-4 inline-block mr-1" /> Bắt đầu nhanh
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => handleSelectTemplate(template)}
                                    className={`p-5 rounded-2xl text-left transition-all hover:scale-[1.02] border
                                        ${isDark
                                            ? 'bg-white/5 border-white/10 hover:border-white/20'
                                            : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${template.color}`}>
                                        <span className="text-2xl">{template.icon}</span>
                                    </div>
                                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {template.name}
                                    </h3>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {template.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Tạo Campaign">
            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gray-50'}`}>
                <div className="max-w-4xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg mb-4 bg-gradient-to-br ${selectedTemplate?.color || 'from-emerald-500 to-teal-600'}`}>
                            {selectedTemplate?.icon ? <span className="text-3xl">{selectedTemplate.icon}</span> : <Icon name="seed" className="w-8 h-8" />}
                        </div>
                        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Tạo Campaign
                        </h1>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Thiết lập quy trình chạy tự động
                        </p>
                    </div>

                    {/* Step Indicators - 4 steps */}
                    <div className="flex items-center justify-center mb-10">
                        {[
                            { num: 1, label: 'Kịch bản', icon: 'credits' },
                            { num: 2, label: 'Thiết bị', icon: 'device' },
                            { num: 3, label: 'Cấu hình', icon: 'settings' },
                            { num: 4, label: 'Xác nhận', icon: 'checkCircle' },
                        ].map((s, idx, arr) => (
                            <div key={s.num} className="flex items-center">
                                <button
                                    onClick={() => s.num < step && setStep(s.num)}
                                    className={`relative flex flex-col items-center transition-all duration-300
                                        ${s.num < step ? 'cursor-pointer' : ''}`}
                                >
                                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300
                                        ${s.num === step
                                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 scale-110'
                                            : s.num < step
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : isDark ? 'bg-white/5 text-gray-600 border border-white/10' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                                    >
                                        {s.num < step ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : s.num === step ? (
                                            <span className="text-lg">{s.icon}</span>
                                        ) : (
                                            <span className="text-base">{s.num}</span>
                                        )}
                                    </div>
                                    <span className={`mt-2 text-xs font-medium transition-all duration-300
                                        ${s.num === step
                                            ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                                            : s.num < step
                                                ? (isDark ? 'text-emerald-400/70' : 'text-emerald-500')
                                                : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>
                                        {s.label}
                                    </span>
                                </button>
                                {idx < arr.length - 1 && (
                                    <div className={`w-10 h-0.5 mx-3 rounded-full transition-all duration-500 mt-[-20px]
                                        ${s.num < step
                                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                            : isDark ? 'bg-white/10' : 'bg-gray-200'}`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className={`rounded-2xl p-6 ${isDark ? 'bg-white/5' : 'bg-white shadow-lg'}`}>
                        {/* Step 1: Name & Workflows */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Tên Campaign *
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="VD: Nuôi FB hàng ngày"
                                        className={`w-full px-4 py-3 rounded-xl border ${isDark
                                            ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600'
                                            : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Selected Workflows (Order) */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <Icon name="credits" className="w-4 h-4 inline-block mr-1" /> Thứ Tự Chạy ({selectedWorkflows.length})
                                        </label>
                                        <div className="space-y-2 min-h-40">
                                            {selectedWorkflows.length > 0 ? selectedWorkflows.map((wf, index) => {
                                                const config = getWorkflowConfig(wf.id);
                                                const modeBadge = config.execution_mode === 'repeat'
                                                    ? { icon: 'refresh', text: `${config.repeat_count}×`, color: 'blue' }
                                                    : config.execution_mode === 'conditional'
                                                        ? { icon: 'target', text: 'If', color: 'purple' }
                                                        : { icon: 'check', text: '1×', color: 'emerald' };

                                                return (
                                                    <div key={wf.id} className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? 'bg-violet-500/10 border border-violet-500/30' : 'bg-violet-50 border border-violet-200'}`}>
                                                        <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center font-bold">{index + 1}</span>
                                                        <div className="flex-1 flex items-center gap-2">
                                                            <span className={`truncate text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{wf.name}</span>
                                                            <span
                                                                className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${isDark ? `bg-${modeBadge.color}-500/20 text-${modeBadge.color}-300` : `bg-${modeBadge.color}-100 text-${modeBadge.color}-700`
                                                                    }`}
                                                                title={`Execution mode: ${config.execution_mode}`}
                                                            >
                                                                <span>{modeBadge.icon}</span>
                                                                <span className="font-medium">{modeBadge.text}</span>
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => openConfigPanel(wf)}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${isDark ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                                }`}
                                                            title="Cấu hình workflow"
                                                        >
                                                            <Icon name="settings" className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => moveWorkflow(index, -1)} disabled={index === 0} className={`w-6 h-6 rounded text-xs ${index === 0 ? 'opacity-30' : 'hover:bg-white/20'}`}>↑</button>
                                                        <button onClick={() => moveWorkflow(index, 1)} disabled={index === selectedWorkflows.length - 1} className={`w-6 h-6 rounded text-xs ${index === selectedWorkflows.length - 1 ? 'opacity-30' : 'hover:bg-white/20'}`}>↓</button>
                                                        <button onClick={() => removeWorkflow(wf.id)} className="w-6 h-6 rounded text-xs text-red-400 hover:bg-red-500/20">✕</button>
                                                    </div>
                                                );
                                            }) : (
                                                <div className={`flex items-center justify-center h-40 border-2 border-dashed rounded-xl ${isDark ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                                                    Chọn kịch bản →
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Available Workflows */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Kịch Bản Có Sẵn
                                        </label>
                                        <input
                                            type="text"
                                            value={searchWF}
                                            onChange={e => setSearchWF(e.target.value)}
                                            placeholder="Tìm..."
                                            className={`w-full px-3 py-2 rounded-xl border mb-3 text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none`}
                                        />
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {availableWorkflows.length > 0 ? availableWorkflows.map(wf => (
                                                <button
                                                    key={wf.id}
                                                    onClick={() => addWorkflow(wf)}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
                                                >
                                                    <Icon name="credits" className="w-5 h-5" />
                                                    <span className={`flex-1 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{wf.name}</span>
                                                    <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>+ Thêm</span>
                                                </button>
                                            )) : (
                                                <div className={`text-center py-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    <a href="/flows" className="text-emerald-400 hover:underline">Tạo Workflow mới →</a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Devices */}
                        {step === 2 && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <Icon name="device" className="w-4 h-4 inline-block mr-1" /> Chọn Thiết Bị ({selectedDevices.length}/{devices.length} thiết bị)
                                    </label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="xs"
                                            onClick={selectAllDevices}
                                            className={isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}
                                        >
                                            ✓ Chọn tất cả
                                        </Button>
                                        {selectedDevices.length > 0 && (
                                            <Button
                                                variant="secondary"
                                                size="xs"
                                                onClick={clearDevices}
                                            >
                                                Bỏ chọn
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {devices.map(device => {
                                        const isSelected = selectedDevices.find(d => d.id === device.id);
                                        const isOnline = device.socket_connected || device.status === 'online';
                                        const assignedCollection = deviceCollectionAssignments[device.id];
                                        const collectionName = assignedCollection
                                            ? dataCollections.find(dc => dc.id === assignedCollection)?.name
                                            : null;

                                        return (
                                            <div key={device.id} className="space-y-2">
                                                <button
                                                    onClick={() => toggleDevice(device)}
                                                    className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all
                                                        ${isSelected
                                                            ? 'bg-emerald-500/10 border-emerald-500'
                                                            : isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                                                >
                                                    <div className="relative">
                                                        <Icon name="device" className="w-6 h-6" />
                                                        <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{device.name}</p>
                                                        <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            {device.model} • {isOnline ? <span className="text-green-500">Online</span> : <span className="text-gray-400">Offline</span>}
                                                        </p>
                                                    </div>
                                                    {isSelected && <span className="text-emerald-500">✓</span>}
                                                </button>

                                                {/* Per-Device Collection Selector (visible only when device selected) */}
                                                {isSelected && (
                                                    <div className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                                        <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            <Icon name="database" className="w-3.5 h-3.5 inline-block mr-0.5" /> Data collection (tuỳ chọn):
                                                        </label>
                                                        <select
                                                            value={deviceCollectionAssignments[device.id] || ''}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                setDeviceCollectionAssignments({
                                                                    ...deviceCollectionAssignments,
                                                                    [device.id]: e.target.value ? parseInt(e.target.value) : null
                                                                });
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark
                                                                ? 'bg-white/10 border-white/20 text-white'
                                                                : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                                        >
                                                            <option value="">Dùng collection chính</option>
                                                            {dataCollections.map(col => (
                                                                <option key={col.id} value={col.id}>
                                                                    {col.name} ({col.records_count || 0} records)
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {collectionName && (
                                                            <p className={`text-xs mt-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                                ✓ Sử dụng: {collectionName}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {devices.length === 0 && (
                                    <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <Icon name="noDevice" className="w-10 h-10 mx-auto mb-3" />
                                        <p>Chưa có thiết bị nào</p>
                                        <a href="/devices" className="text-emerald-400 hover:underline text-sm">Thêm thiết bị →</a>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Config + Data Selection */}
                        {step === 3 && (
                            <div className="space-y-5">
                                {/* Data Collection Selection */}
                                <div className={`p-5 rounded-xl ${isDark ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-cyan-50'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Icon name="database" className="w-6 h-6" />
                                            <div>
                                                <p className={`font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>Chọn Dữ Liệu Chạy</p>
                                                <p className={`text-xs ${isDark ? 'text-cyan-400/70' : 'text-cyan-600'}`}>Bộ sưu tập tài khoản sẽ dùng</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Collection Picker */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        {dataCollections.slice(0, 4).map(dc => (
                                            <button
                                                key={dc.id}
                                                onClick={() => {
                                                    setSelectedCollection(dc);
                                                    setRecords([]); // Reset records when collection changes
                                                    setSelectedRecordIds([]);
                                                }}
                                                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                                                    ${selectedCollection?.id === dc.id
                                                        ? 'bg-cyan-500/20 border-cyan-500'
                                                        : isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                            >
                                                {dc.icon ? <span className="text-xl">{dc.icon}</span> : <Icon name="clipboard" className="w-5 h-5" />}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{dc.name}</p>
                                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{dc.records_count || 0} records</p>
                                                </div>
                                                {selectedCollection?.id === dc.id && <span className="text-cyan-400">✓</span>}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Data Mode Selection */}
                                    {selectedCollection && (
                                        <div className="space-y-3">
                                            <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Chế độ chạy:</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setDataMode('all')}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                                                        ${dataMode === 'all'
                                                            ? 'bg-cyan-500 text-white'
                                                            : isDark ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                >
                                                    Tất cả ({selectedCollection.records_count})
                                                </button>
                                                <button
                                                    onClick={() => setDataMode('limit')}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                                                        ${dataMode === 'limit'
                                                            ? 'bg-cyan-500 text-white'
                                                            : isDark ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                >
                                                    Giới hạn
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setDataMode('select');
                                                        setShowRecordPicker(true);
                                                    }}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                                                        ${dataMode === 'select'
                                                            ? 'bg-cyan-500 text-white'
                                                            : isDark ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                >
                                                    Chọn records
                                                </button>
                                            </div>

                                            {/* Limit Input */}
                                            {dataMode === 'limit' && (
                                                <div className="flex items-center gap-3 mt-3">
                                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Chạy</span>
                                                    <input
                                                        type="number"
                                                        value={recordLimit}
                                                        onChange={e => setRecordLimit(Math.max(1, Math.min(selectedCollection.records_count, parseInt(e.target.value) || 1)))}
                                                        className={`w-24 px-3 py-2 rounded-lg border text-center ${isDark
                                                            ? 'bg-white/10 border-white/20 text-white'
                                                            : 'bg-white border-gray-300 text-gray-900'} focus:outline-none`}
                                                    />
                                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>record đầu tiên</span>
                                                </div>
                                            )}

                                            {/* Selected Records Count */}
                                            {dataMode === 'select' && (
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Đã chọn: <span className="font-bold text-cyan-400">{selectedRecordIds.length}</span> records
                                                    </span>
                                                    <button
                                                        onClick={() => setShowRecordPicker(true)}
                                                        className={`text-sm px-3 py-1 rounded-lg ${isDark ? 'bg-white/10 text-cyan-400 hover:bg-white/15' : 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200'}`}
                                                    >
                                                        Chọn records →
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Advanced Options Toggle */}
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon name="settings" className="w-5 h-5" />
                                        <div className="text-left">
                                            <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tuỳ chỉnh nâng cao</p>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Data Pools, phân chia records thủ công</p>
                                        </div>
                                    </div>
                                    <span className={`text-lg transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
                                </button>

                                {/* Advanced Options Content - Collapsible */}
                                {showAdvanced && (
                                    <div className="space-y-5 pl-4 border-l-2 border-violet-500/30">
                                        {/* Data Pools - For In-Job Loops */}
                                        <div className={`p-5 rounded-xl ${isDark ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50'}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Icon name="refresh" className="w-6 h-6" />
                                                    <div>
                                                        <p className={`font-medium ${isDark ? 'text-violet-300' : 'text-violet-800'}`}>Dữ Liệu Cho Vòng Lặp (Pool)</p>
                                                        <p className={`text-xs ${isDark ? 'text-violet-400/70' : 'text-violet-600'}`}>Comments, media, v.v. dùng lặp trong mỗi job</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="xs"
                                                    onClick={addDataPool}
                                                    className={isDark ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30' : 'bg-violet-100 text-violet-600 hover:bg-violet-200'}
                                                >
                                                    + Thêm Pool
                                                </Button>
                                            </div>

                                            {dataPools.length === 0 ? (
                                                <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    Chưa có pool nào. Thêm nếu workflow cần loop qua nhiều comments/media.
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {dataPools.map((pool, index) => (
                                                        <div key={pool.id} className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                                                            <div className="flex items-start gap-3">
                                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-violet-500/30 text-violet-300' : 'bg-violet-100 text-violet-600'}`}>
                                                                    {index + 1}
                                                                </span>
                                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tên biến</label>
                                                                        <input
                                                                            type="text"
                                                                            value={pool.variable}
                                                                            onChange={e => updateDataPool(pool.id, { variable: e.target.value })}
                                                                            placeholder="vd: comments"
                                                                            className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none`}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Collection</label>
                                                                        <select
                                                                            value={pool.collection_id || ''}
                                                                            onChange={e => updateDataPool(pool.id, { collection_id: parseInt(e.target.value) || null, field: '' })}
                                                                            className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none`}
                                                                        >
                                                                            <option value="">Chọn...</option>
                                                                            {dataCollections.map(dc => (
                                                                                <option key={dc.id} value={dc.id}>{dc.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Field (tuỳ chọn)</label>
                                                                        <select
                                                                            value={pool.field || ''}
                                                                            onChange={e => updateDataPool(pool.id, { field: e.target.value })}
                                                                            className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none`}
                                                                            disabled={!pool.collection_id}
                                                                        >
                                                                            <option value="">Tất cả fields</option>
                                                                            {getCollectionFields(pool.collection_id).map(f => (
                                                                                <option key={f} value={f}>{f}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <div className="flex-1">
                                                                            <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Số lượng</label>
                                                                            <input
                                                                                type="number"
                                                                                value={pool.count}
                                                                                onChange={e => updateDataPool(pool.id, { count: Math.max(1, parseInt(e.target.value) || 1) })}
                                                                                min={1}
                                                                                className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none`}
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Chế độ</label>
                                                                            <select
                                                                                value={pool.mode}
                                                                                onChange={e => updateDataPool(pool.id, { mode: e.target.value })}
                                                                                className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none`}
                                                                            >
                                                                                <option value="random">Random</option>
                                                                                <option value="sequential">Tuần tự</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => removeDataPool(pool.id)}
                                                                    className={`w-8 h-8 rounded-lg text-red-400 hover:bg-red-500/20`}
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Device Assignment Mode */}
                                        <div className={`p-5 rounded-xl ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50'}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Icon name="device" className="w-6 h-6" />
                                                    <div>
                                                        <p className={`font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>Phân Chia Records</p>
                                                        <p className={`text-xs ${isDark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>Cách phân records cho các thiết bị</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mode Toggle */}
                                            <div className="flex gap-2 mb-4">
                                                <button
                                                    onClick={() => setAssignmentMode('auto')}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                                                ${assignmentMode === 'auto'
                                                            ? 'bg-emerald-500 text-white'
                                                            : isDark ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                >
                                                    <Icon name="refresh" className="w-4 h-4 inline-block mr-1" /> Tự động (chia đều)
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setAssignmentMode('manual');
                                                        if (records.length === 0 && selectedCollection) {
                                                            loadRecords();
                                                        }
                                                    }}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                                                ${assignmentMode === 'manual'
                                                            ? 'bg-emerald-500 text-white'
                                                            : isDark ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                >
                                                    <Icon name="target" className="w-4 h-4 inline-block mr-1" /> Thủ công (chọn cụ thể)
                                                </button>
                                            </div>

                                            {/* Auto Mode: Records Per Device */}
                                            {assignmentMode === 'auto' && (
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Giới hạn records/thiết bị:
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={recordsPerDevice}
                                                        onChange={e => setRecordsPerDevice(e.target.value)}
                                                        placeholder="Auto"
                                                        className={`w-24 px-3 py-2 rounded-lg border text-center ${isDark ? 'bg-white/10 border-white/20 text-white placeholder:text-gray-500' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none`}
                                                    />
                                                </div>
                                            )}

                                            {/* Manual Mode: Device List with Record Assignment */}
                                            {assignmentMode === 'manual' && selectedCollection && (
                                                <div className="space-y-3">
                                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Click vào thiết bị để chọn records (Tổng: <span className="font-bold text-emerald-400">{getTotalAssignedRecords()}</span> records)
                                                    </p>
                                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                                        {selectedDevices.map(device => (
                                                            <div
                                                                key={device.id}
                                                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all
                                                            ${activeDeviceForPicker === device.id
                                                                        ? 'bg-emerald-500/20 border border-emerald-500'
                                                                        : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50'}`}
                                                                onClick={() => setActiveDeviceForPicker(activeDeviceForPicker === device.id ? null : device.id)}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <Icon name="device" className="w-5 h-5" />
                                                                    <div>
                                                                        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{device.name}</p>
                                                                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{device.model}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className={`px-3 py-1 rounded-lg text-sm font-medium
                                                                ${getAssignedRecordCount(device.id) > 0
                                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                                            : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                                                        {getAssignedRecordCount(device.id)} records
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Record Picker for Active Device */}
                                                    {activeDeviceForPicker && (
                                                        <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                    Chọn records cho: {selectedDevices.find(d => d.id === activeDeviceForPicker)?.name}
                                                                </p>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            const allIds = records.map(r => r.id);
                                                                            setDeviceRecordAssignments(prev => ({ ...prev, [activeDeviceForPicker]: allIds }));
                                                                        }}
                                                                        className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}
                                                                    >
                                                                        Chọn tất cả
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setDeviceRecordAssignments(prev => ({ ...prev, [activeDeviceForPicker]: [] }));
                                                                        }}
                                                                        className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}
                                                                    >
                                                                        Bỏ chọn
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                                                                {loadingRecords ? (
                                                                    <p className={`col-span-5 text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                        Đang tải...
                                                                    </p>
                                                                ) : records.map(record => {
                                                                    const isSelected = (deviceRecordAssignments[activeDeviceForPicker] || []).includes(record.id);
                                                                    return (
                                                                        <button
                                                                            key={record.id}
                                                                            onClick={() => toggleRecordForDevice(activeDeviceForPicker, record.id)}
                                                                            className={`p-2 rounded-lg text-xs font-medium transition-all
                                                                        ${isSelected
                                                                                    ? 'bg-emerald-500 text-white'
                                                                                    : isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                                        >
                                                                            #{record.id}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Warning when no collection selected in manual mode */}
                                            {assignmentMode === 'manual' && !selectedCollection && (
                                                <p className={`text-sm text-center py-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                    <Icon name="exclamation" className="w-4 h-4 inline-block mr-1" /> Vui lòng chọn Dữ Liệu trước khi phân chia thủ công
                                                </p>
                                            )}
                                        </div>

                                        {/* Repeat Config */}
                                        <div className={`p-5 rounded-xl flex items-center justify-between ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <Icon name="refresh" className="w-6 h-6" />
                                                <div>
                                                    <p className={`font-medium ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Số lần lặp</p>
                                                    <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>Mỗi record chạy bao nhiêu lần</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setRepeatPerRecord(Math.max(1, repeatPerRecord - 1))} className={`w-9 h-9 rounded-lg font-bold ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-gray-100'}`}>-</button>
                                                <span className={`w-12 text-center text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{repeatPerRecord}</span>
                                                <button onClick={() => setRepeatPerRecord(Math.min(100, repeatPerRecord + 1))} className={`w-9 h-9 rounded-lg font-bold ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-gray-100'}`}>+</button>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Mô tả (tuỳ chọn)
                                            </label>
                                            <textarea
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                placeholder="Ghi chú về campaign này..."
                                                rows={2}
                                                className={`w-full px-4 py-3 rounded-xl border resize-none ${isDark
                                                    ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600'
                                                    : 'bg-white border-gray-200 text-gray-900'} focus:outline-none`}
                                            />
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}

                        {/* Step 4: Summary */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <div className={`p-5 rounded-xl space-y-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}><Icon name="clipboard" className="w-4 h-4 inline-block mr-1" /> Tóm tắt Campaign</h3>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Tên:</div>
                                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{name}</div>

                                        <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Kịch bản:</div>
                                        <div className={isDark ? 'text-white' : 'text-gray-900'}>
                                            {selectedWorkflows.map((w, i) => (
                                                <span key={w.id}>
                                                    {i > 0 && ' → '}
                                                    <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>{w.name}</span>
                                                </span>
                                            ))}
                                        </div>

                                        <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Thiết bị:</div>
                                        <div className={isDark ? 'text-white' : 'text-gray-900'}>{selectedDevices.length} thiết bị</div>

                                        <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Dữ liệu:</div>
                                        <div className={isDark ? 'text-white' : 'text-gray-900'}>
                                            {selectedCollection ? (
                                                <>
                                                    <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700'}`}>
                                                        {selectedCollection.name}
                                                    </span>
                                                    <span className={`ml-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        ({effectiveRecordCount} records)
                                                    </span>
                                                </>
                                            ) : (
                                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Từ workflow</span>
                                            )}
                                        </div>

                                        <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Lặp/record:</div>
                                        <div className={isDark ? 'text-white' : 'text-gray-900'}>{repeatPerRecord}x</div>
                                    </div>
                                </div>

                                {/* Estimated runs */}
                                {selectedCollection && effectiveRecordCount > 0 && (
                                    <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                                        <span className={`text-xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                            ≈ {(effectiveRecordCount * selectedWorkflows.length * repeatPerRecord).toLocaleString()} jobs
                                        </span>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'}`}>
                                            {effectiveRecordCount} records × {selectedWorkflows.length} workflows × {repeatPerRecord} lần
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Validation Hint */}
                    {!canProceed() && getValidationHint() && (
                        <div className={`text-center mt-4 py-2 px-4 rounded-lg ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                            {getValidationHint()}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-6">
                        <Button
                            variant="ghost"
                            onClick={() => step > 1 ? setStep(step - 1) : setShowTemplates(true)}
                        >
                            {step > 1 ? '← Quay lại' : '← Chọn template khác'}
                        </Button>

                        {step < 4 ? (
                            <Button
                                variant="gradient"
                                onClick={() => setStep(step + 1)}
                                disabled={!canProceed()}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600"
                            >
                                Tiếp theo →
                            </Button>
                        ) : (
                            <Button
                                variant="gradient"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !canProceed()}
                                loading={isSubmitting}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600"
                            >
                                {isSubmitting ? 'Đang tạo...' : 'Tạo Campaign'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Record Picker Modal */}
            {showRecordPicker && selectedCollection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className={`w-full max-w-3xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                        {/* Modal Header */}
                        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                            <div>
                                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <Icon name="clipboard" className="w-4 h-4 inline-block mr-1" /> Chọn Records - {selectedCollection.name}
                                </h3>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Đã chọn {selectedRecordIds.length} / {records.length} records
                                </p>
                            </div>
                            <button
                                onClick={() => setShowRecordPicker(false)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Quick Actions */}
                        <div className={`flex items-center gap-2 p-3 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                            <button
                                onClick={selectAllRecords}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200'}`}
                            >
                                Chọn tất cả
                            </button>
                            <button
                                onClick={clearSelection}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-white/10 text-gray-400 hover:bg-white/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Bỏ chọn
                            </button>
                        </div>

                        {/* Records List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loadingRecords ? (
                                <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <span className="text-2xl block mb-2">⏳</span>
                                    Đang tải records...
                                </div>
                            ) : records.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {records.map(record => {
                                        const isSelected = selectedRecordIds.includes(record.id);
                                        const displayValue = Object.values(record.data || {})[0] || `Record #${record.id}`;
                                        return (
                                            <button
                                                key={record.id}
                                                onClick={() => toggleRecord(record.id)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                                                    ${isSelected
                                                        ? 'bg-cyan-500/10 border-cyan-500'
                                                        : isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center ${isSelected ? 'bg-cyan-500 text-white' : isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                                    {isSelected && '✓'}
                                                </div>
                                                <span className={`flex-1 text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {typeof displayValue === 'string' ? displayValue : JSON.stringify(displayValue)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Không có records
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className={`flex items-center justify-between p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {selectedRecordIds.length} records sẽ được chạy
                            </span>
                            <Button
                                variant="gradient"
                                onClick={() => setShowRecordPicker(false)}
                                className="bg-gradient-to-r from-cyan-500 to-teal-600"
                            >
                                Xác nhận
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Workflow Config Panel Modal */}
            {configPanelWorkflow && (
                <WorkflowConfigPanel
                    workflow={configPanelWorkflow}
                    config={getWorkflowConfig(configPanelWorkflow.id)}
                    onChange={(updatedConfig) => updateWorkflowConfig(configPanelWorkflow.id, updatedConfig)}
                    onClose={closeConfigPanel}
                    availableCollections={dataCollections}
                    campaignDataCollectionId={selectedCollection?.id}
                />
            )}
        </AppLayout>
    );
}
