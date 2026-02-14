import { useState, useRef, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Components/Layout/ToastProvider';
import { Button } from '@/Components/UI';
import { DndContext, DragOverlay, closestCenter, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Enhanced Field Types with more options
// Field types with translation support
const getFieldTypes = (t) => [
    { type: 'text', label: t('data_collections.field_types.text'), icon: '📝', color: '#3b82f6', description: t('data_collections.field_types.text_desc'), placeholder: 'Enter text...' },
    { type: 'number', label: t('data_collections.field_types.number'), icon: '🔢', color: '#10b981', description: t('data_collections.field_types.number_desc'), placeholder: '0' },
    { type: 'email', label: t('data_collections.field_types.email'), icon: '📧', color: '#8b5cf6', description: t('data_collections.field_types.email_desc'), placeholder: 'email@example.com' },
    { type: 'phone', label: t('data_collections.field_types.phone'), icon: '📱', color: '#f97316', description: t('data_collections.field_types.phone_desc'), placeholder: '+84 xxx xxx xxx' },
    { type: 'date', label: t('data_collections.field_types.date'), icon: '📅', color: '#f59e0b', description: t('data_collections.field_types.date_desc'), placeholder: 'YYYY-MM-DD' },
    { type: 'boolean', label: t('data_collections.field_types.boolean'), icon: '☑️', color: '#ec4899', description: t('data_collections.field_types.boolean_desc'), placeholder: '☐' },
    { type: 'select', label: t('data_collections.field_types.select'), icon: '🎯', color: '#06b6d4', description: t('data_collections.field_types.select_desc'), placeholder: 'Select...' },
    { type: 'textarea', label: t('data_collections.field_types.textarea'), icon: '📄', color: '#6366f1', description: t('data_collections.field_types.textarea_desc'), placeholder: 'Enter long text...' },
    { type: 'url', label: t('data_collections.field_types.url'), icon: '🔗', color: '#14b8a6', description: t('data_collections.field_types.url_desc'), placeholder: 'https://...' },
    { type: 'currency', label: t('data_collections.field_types.currency'), icon: '💰', color: '#22c55e', description: t('data_collections.field_types.currency_desc'), placeholder: '$0.00' },
    { type: 'rating', label: t('data_collections.field_types.rating'), icon: '⭐', color: '#eab308', description: t('data_collections.field_types.rating_desc'), placeholder: '★★★☆☆' },
    { type: 'autonumber', label: t('data_collections.field_types.autonumber'), icon: '🔢', color: '#64748b', description: t('data_collections.field_types.autonumber_desc'), placeholder: '#001' },
];

// Quick Templates for common use cases
// Quick templates with translation support
const getQuickTemplates = (t) => [
    {
        id: 'customer',
        name: t('data_collections.templates.customer'),
        description: t('data_collections.templates.customer_desc'),
        fields: [
            { name: 'Full Name', type: 'text', required: true },
            { name: 'Email', type: 'email', required: true },
            { name: 'Phone', type: 'phone', required: false },
            { name: 'Company', type: 'text', required: false },
            { name: 'Status', type: 'select', required: false, options: ['Lead', 'Active', 'Inactive'] },
        ]
    },
    {
        id: 'product',
        name: t('data_collections.templates.product'),
        description: t('data_collections.templates.product_desc'),
        fields: [
            { name: 'Product Name', type: 'text', required: true },
            { name: 'SKU', type: 'text', required: true },
            { name: 'Price', type: 'currency', required: true },
            { name: 'Quantity', type: 'number', required: true },
            { name: 'Category', type: 'select', required: false, options: ['Electronics', 'Clothing', 'Food', 'Other'] },
        ]
    },
    {
        id: 'task',
        name: t('data_collections.templates.task'),
        description: t('data_collections.templates.task_desc'),
        fields: [
            { name: 'Task Name', type: 'text', required: true },
            { name: 'Description', type: 'textarea', required: false },
            { name: 'Due Date', type: 'date', required: false },
            { name: 'Priority', type: 'select', required: false, options: ['Low', 'Medium', 'High', 'Urgent'] },
            { name: 'Completed', type: 'boolean', required: false },
        ]
    },
];

// Static field type data for icon/placeholder lookups in child components
const FIELD_TYPES_STATIC = {
    text: { icon: '📝', color: '#3b82f6', placeholder: 'Enter text...' },
    number: { icon: '🔢', color: '#10b981', placeholder: '0' },
    email: { icon: '📧', color: '#8b5cf6', placeholder: 'email@example.com' },
    phone: { icon: '📱', color: '#f97316', placeholder: '+84 xxx xxx xxx' },
    date: { icon: '📅', color: '#f59e0b', placeholder: 'YYYY-MM-DD' },
    boolean: { icon: '☑️', color: '#ec4899', placeholder: '☐' },
    select: { icon: '🎯', color: '#06b6d4', placeholder: 'Select...' },
    textarea: { icon: '📄', color: '#6366f1', placeholder: 'Enter long text...' },
    url: { icon: '🔗', color: '#14b8a6', placeholder: 'https://...' },
    currency: { icon: '💰', color: '#22c55e', placeholder: '$0.00' },
    rating: { icon: '⭐', color: '#eab308', placeholder: '★★★☆☆' },
    autonumber: { icon: '🔢', color: '#64748b', placeholder: '#001' },
};

const ICON_OPTIONS = ['📊', '👥', '💼', '🎯', '📝', '💡', '🚀', '⚡', '🎨', '🔧', '📦', '🛒', '💰', '📈', '🗂️', '📋'];
const COLOR_OPTIONS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#84cc16', '#6366f1', '#14b8a6'];

export default function CreateCollectionModal({ isOpen, onClose, initialTemplate = null }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';
    const [step, setStep] = useState(initialTemplate ? 2 : 1);
    const [activeId, setActiveId] = useState(null);
    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [showTemplates, setShowTemplates] = useState(!initialTemplate);

    // Get translated field types and templates
    const FIELD_TYPES = getFieldTypes(t);
    const QUICK_TEMPLATES = getQuickTemplates(t);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: initialTemplate ? initialTemplate.name : '',
        description: initialTemplate ? initialTemplate.description || '' : '',
        icon: '📊',
        color: '#3b82f6',
        schema: [],
    });

    // Initialize fields from template if provided
    const [fields, setFields] = useState(() => {
        if (initialTemplate && initialTemplate.fields) {
            return initialTemplate.fields.map((f, i) => ({
                id: `field-${Date.now()}-${i}`,
                name: f.name,
                type: f.type,
                required: f.required || false,
                default: '',
                options: f.options || null,
            }));
        }
        return [];
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }
        })
    );


    // Quick Add field - click to add
    const addField = (type) => {
        const fieldType = FIELD_TYPES.find(f => f.type === type);
        if (!fieldType) return;

        const newField = {
            id: `field-${Date.now()}`,
            name: `${fieldType.label} ${fields.length + 1}`,
            type: fieldType.type,
            required: false,
            default: '',
            options: fieldType.type === 'select' ? ['Option 1', 'Option 2', 'Option 3'] : null,
        };
        setFields([...fields, newField]);
        setSelectedFieldId(newField.id);
        setShowTemplates(false);
    };

    // Apply Quick Template
    const applyTemplate = (template) => {
        const newFields = template.fields.map((f, i) => ({
            id: `field-${Date.now()}-${i}`,
            name: f.name,
            type: f.type,
            required: f.required || false,
            default: '',
            options: f.options || null,
        }));
        setFields(newFields);
        setShowTemplates(false);
        if (newFields.length > 0) {
            setSelectedFieldId(newFields[0].id);
        }
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        // Dragging a field type to the preview area
        if (active.id?.startsWith('type-') && over.id === 'table-drop') {
            const typeId = active.id.replace('type-', '');
            addField(typeId);
            return;
        }

        // Reordering existing fields (columns) in table
        if (active.id?.startsWith('field-') && over.id?.startsWith('field-')) {
            const oldIndex = fields.findIndex(f => f.id === active.id);
            const newIndex = fields.findIndex(f => f.id === over.id);
            if (oldIndex !== newIndex) {
                setFields(arrayMove(fields, oldIndex, newIndex));
            }
        }
    };

    const updateField = (id, updates) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const removeField = (id) => {
        setFields(fields.filter(f => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const schema = fields.map(({ id, ...field }) => field);

        // Use router.post directly with complete data object
        router.post('/data-collections', {
            name: data.name,
            description: data.description,
            icon: data.icon,
            color: data.color,
            schema: schema
        }, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setFields([]);
                setStep(1);
                onClose();
            },
            onError: (errors) => {
                console.error('Create collection errors:', errors);
                addToast(t('data_collections.wizard.error_occurred') + ': ' + Object.values(errors).join(', '), 'error');
            }
        });
    };

    const nextStep = () => {
        if (step === 1 && !data.name.trim()) {
            addToast(t('data_collections.wizard.validation_name_required'), 'warning');
            return;
        }
        if (step === 2 && fields.length === 0) {
            addToast(t('data_collections.wizard.validation_add_column'), 'warning');
            return;
        }
        setStep(step + 1);
    };

    const selectedField = fields.find(f => f.id === selectedFieldId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
            <div className={`relative w-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                {/* Header */}
                <ModalHeader data={data} step={step} onClose={onClose} isDark={isDark} />

                {/* Content */}
                <div className={`overflow-y-auto max-h-[calc(90vh-160px)] ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                    {step === 1 && <Step1 data={data} setData={setData} isDark={isDark} />}

                    {step === 2 && (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <Step2Enhanced
                                fields={fields}
                                selectedFieldId={selectedFieldId}
                                setSelectedFieldId={setSelectedFieldId}
                                selectedField={selectedField}
                                addField={addField}
                                updateField={updateField}
                                removeField={removeField}
                                applyTemplate={applyTemplate}
                                showTemplates={showTemplates && fields.length === 0}
                                isDark={isDark}
                                FIELD_TYPES={FIELD_TYPES}
                                QUICK_TEMPLATES={QUICK_TEMPLATES}
                            />
                            <DragOverlay>
                                {activeId?.startsWith('type-') && (
                                    <DragPreview type={activeId.replace('type-', '')} FIELD_TYPES={FIELD_TYPES} />
                                )}
                            </DragOverlay>
                        </DndContext>
                    )}

                    {step === 3 && <Step3 data={data} fields={fields} isDark={isDark} FIELD_TYPES={FIELD_TYPES} />}
                </div>

                {/* Footer */}
                <ModalFooter
                    step={step}
                    setStep={setStep}
                    nextStep={nextStep}
                    handleSubmit={handleSubmit}
                    processing={processing}
                    onClose={onClose}
                    isDark={isDark}
                />
            </div>
        </div>
    );
}

// Modal Header
function ModalHeader({ data, step, onClose, isDark }) {
    const { t } = useTranslation();
    const titles = {
        1: t('data_collections.wizard.step1_title'),
        2: t('data_collections.wizard.step2_title'),
        3: t('data_collections.wizard.step3_title')
    };

    return (
        <div className={`px-6 py-4 border-b ${isDark ? 'border-[#2a2a2a] bg-gradient-to-r from-cyan-900/30 to-blue-900/30' : 'border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-4xl p-2 rounded-xl" style={{ backgroundColor: data.color + '20' }}>{data.icon}</div>
                    <div>
                        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {titles[step]}
                        </h2>
                        <p className="text-sm text-gray-500">Bước {step}/3 • {data.name || 'Collection mới'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Step Indicators */}
                    <div className="flex items-center gap-1">
                        {[1, 2, 3].map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > s ? 'bg-green-500 text-white' :
                                    step === s ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30' :
                                        isDark ? 'bg-[#252525] text-gray-500' : 'bg-gray-200 text-gray-400'
                                    }`}>
                                    {step > s ? '✓' : s}
                                </div>
                                {i < 2 && <div className={`w-8 h-0.5 ${step > s ? 'bg-green-500' : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={onClose}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Modal Footer
function ModalFooter({ step, setStep, nextStep, handleSubmit, processing, onClose, isDark }) {
    const { t } = useTranslation();
    return (
        <div className={`px-6 py-4 border-t ${isDark ? 'border-[#2a2a2a] bg-[#141414]' : 'border-gray-200 bg-white'} flex justify-between`}>
            <Button
                variant="secondary"
                onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            >
                {step === 1 ? t('data_collections.wizard.cancel') : t('data_collections.wizard.back')}
            </Button>

            {step < 3 ? (
                <Button variant="gradient" onClick={nextStep}>
                    {t('data_collections.wizard.next')} <span className="text-lg">→</span>
                </Button>
            ) : (
                <Button
                    variant="gradient"
                    onClick={handleSubmit}
                    disabled={processing}
                >
                    {processing ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            {t('data_collections.wizard.creating')}
                        </>
                    ) : (
                        <>{t('data_collections.wizard.create_collection')}</>
                    )}
                </Button>
            )}
        </div>
    );
}

// Step 1: Basic Info
function Step1({ data, setData, isDark }) {
    const { t } = useTranslation();
    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Fields */}
                <div className="space-y-5">
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('data_collections.wizard.collection_name')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={t('data_collections.wizard.collection_name_placeholder')}
                            className={`w-full px-4 py-3 rounded-xl text-lg transition-all ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'} border-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500`}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('data_collections.wizard.description_optional')}
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder={t('data_collections.wizard.description_placeholder')}
                            rows={3}
                            className={`w-full px-4 py-3 rounded-xl resize-none transition-all ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-white border-gray-300'} border-2 focus:ring-2 focus:ring-cyan-500`}
                        />
                    </div>
                </div>

                {/* Icon & Color */}
                <div className="space-y-5">
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('data_collections.wizard.select_icon')}
                        </label>
                        <div className="grid grid-cols-8 gap-2">
                            {ICON_OPTIONS.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setData('icon', icon)}
                                    className={`aspect-square text-2xl rounded-xl transition-all flex items-center justify-center ${data.icon === icon ? 'ring-3 ring-cyan-500 scale-110 bg-cyan-500/20' : isDark ? 'hover:bg-[#252525] bg-[#1a1a1a]' : 'hover:bg-gray-100 bg-white'} border ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('data_collections.wizard.select_color')}
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {COLOR_OPTIONS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setData('color', color)}
                                    className={`w-10 h-10 rounded-xl transition-all shadow-lg ${data.color === color ? 'ring-3 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: color, boxShadow: `0 4px 14px ${color}40`, ringOffsetColor: isDark ? '#0f0f0f' : '#f3f4f6' }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'} border-2 ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-medium">{t('data_collections.wizard.preview')}</p>
                <div className="flex items-center gap-4">
                    <div className="text-5xl p-4 rounded-2xl" style={{ backgroundColor: data.color + '15' }}>{data.icon}</div>
                    <div>
                        <h3 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.name || t('data_collections.wizard.preview_name')}</h3>
                        <p className="text-gray-500 mt-1">{data.description || t('data_collections.wizard.preview_desc')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Step 2: Enhanced Schema Builder with Live Table Preview
function Step2Enhanced({ fields, selectedFieldId, setSelectedFieldId, selectedField, addField, updateField, removeField, applyTemplate, showTemplates, isDark, FIELD_TYPES, QUICK_TEMPLATES }) {
    const { t } = useTranslation();
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: 'table-drop' });

    return (
        <div className="flex h-[550px]">
            {/* Left: Field Type Palette */}
            <div className={`w-64 p-4 border-r overflow-y-auto ${isDark ? 'border-[#2a2a2a] bg-[#141414]' : 'border-gray-200 bg-gray-100'}`}>
                {/* Quick Templates Section */}
                {showTemplates && (
                    <div className="mb-6">
                        <h3 className={`text-xs font-bold mb-3 uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            ⚡ {t('data_collections.wizard.quick_templates')}
                        </h3>
                        <div className="space-y-2">
                            {QUICK_TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => applyTemplate(template)}
                                    className={`w-full p-3 rounded-xl text-left transition-all hover:scale-[1.02] ${isDark ? 'bg-gradient-to-r from-cyan-900/30 to-blue-900/30 hover:from-cyan-900/50 hover:to-blue-900/50 border-cyan-800/50' : 'bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 border-cyan-200'} border`}
                                >
                                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.name}</p>
                                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{template.fields.length} {t('data_collections.wizard.columns')} • {template.description}</p>
                                </button>
                            ))}
                        </div>
                        <div className={`my-4 flex items-center gap-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            <div className="flex-1 h-px bg-current opacity-30" />
                            <span className="text-xs uppercase tracking-wider">{t('data_collections.wizard.or')}</span>
                            <div className="flex-1 h-px bg-current opacity-30" />
                        </div>
                    </div>
                )}

                <h3 className={`text-xs font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    ➕ {t('data_collections.wizard.add_column')}
                </h3>
                <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('data_collections.wizard.click_or_drag')}
                </p>
                <div className="space-y-1.5">
                    {FIELD_TYPES.map((fieldType) => (
                        <FieldTypePaletteItem
                            key={fieldType.type}
                            fieldType={fieldType}
                            onAdd={() => addField(fieldType.type)}
                            isDark={isDark}
                        />
                    ))}
                </div>
            </div>

            {/* Center: Live Table Preview */}
            <div
                ref={setDropRef}
                className={`flex-1 p-4 overflow-auto transition-all ${isOver ? 'bg-cyan-500/5' : ''}`}
            >
                <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        📋 Live Table Preview
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
                        {fields.length} columns
                    </span>
                </div>

                {fields.length > 0 ? (
                    <SortableContext items={fields.map(f => f.id)} strategy={horizontalListSortingStrategy}>
                        <LiveTablePreview
                            fields={fields}
                            selectedFieldId={selectedFieldId}
                            setSelectedFieldId={setSelectedFieldId}
                            updateField={updateField}
                            removeField={removeField}
                            isDark={isDark}
                        />
                    </SortableContext>
                ) : (
                    <EmptyTableState isOver={isOver} isDark={isDark} t={t} />
                )}
            </div>

            {/* Right: Field Configuration Panel */}
            <div className={`w-72 p-4 border-l overflow-y-auto ${isDark ? 'border-[#2a2a2a] bg-[#141414]' : 'border-gray-200 bg-gray-100'}`}>
                {selectedField ? (
                    <FieldConfigPanel
                        field={selectedField}
                        updateField={updateField}
                        removeField={removeField}
                        onClose={() => setSelectedFieldId(null)}
                        isDark={isDark}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="text-5xl mb-4 opacity-50">⚙️</div>
                        <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('data_collections.wizard.column_config')}
                        </p>
                        <p className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {t('data_collections.wizard.click_header_to_config')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Field Type Palette Item (with Quick Add button)
function FieldTypePaletteItem({ fieldType, onAdd, isDark }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `type-${fieldType.type}`,
    });

    return (
        <div
            ref={setNodeRef}
            className={`group relative p-2 rounded-lg cursor-pointer transition-all ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'} ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525]' : 'bg-white hover:bg-gray-50'} border ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}
            style={{ borderLeftColor: fieldType.color, borderLeftWidth: 3 }}
        >
            <div className="flex items-center gap-2">
                {/* Drag handle */}
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 opacity-30 hover:opacity-100 transition-opacity">
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 100 4 2 2 0 000-4zM7 8a2 2 0 100 4 2 2 0 000-4zM7 14a2 2 0 100 4 2 2 0 000-4zM13 2a2 2 0 100 4 2 2 0 000-4zM13 8a2 2 0 100 4 2 2 0 000-4zM13 14a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                </div>
                <span className="text-base">{fieldType.icon}</span>
                <div className="flex-1 min-w-0">
                    <p className={`font-medium text-xs truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{fieldType.label}</p>
                </div>
                {/* Quick Add Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onAdd(); }}
                    className="p-1 rounded-md bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    title="Click to add"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// Sortable Column Header
function SortableColumnHeader({ field, isSelected, onClick, updateField, isDark }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(field.name);
    const inputRef = useRef(null);

    const ft = FIELD_TYPES_STATIC[field.type];

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        setEditName(field.name);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (editName.trim()) {
            updateField(field.id, { name: editName.trim() });
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setIsEditing(false);
    };

    return (
        <th
            ref={setNodeRef}
            style={style}
            onClick={onClick}
            onDoubleClick={handleDoubleClick}
            className={`min-w-[140px] px-2 py-2 text-left text-sm font-semibold border-b border-r cursor-pointer transition-all select-none ${isSelected
                ? 'bg-cyan-500/20 border-cyan-500'
                : isDark
                    ? 'border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#252525] text-gray-200'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
        >
            <div className="flex items-center gap-1.5">
                {/* Drag handle */}
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity p-0.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 100 4 2 2 0 000-4zM7 8a2 2 0 100 4 2 2 0 000-4zM7 14a2 2 0 100 4 2 2 0 000-4zM13 2a2 2 0 100 4 2 2 0 000-4zM13 8a2 2 0 100 4 2 2 0 000-4zM13 14a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                </div>
                <span className="text-sm">{ft?.icon}</span>
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className={`flex-1 px-1 py-0.5 text-sm rounded border ${isDark ? 'bg-[#0a0a0a] border-cyan-500 text-white' : 'bg-white border-cyan-500'} focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                    />
                ) : (
                    <span className="truncate flex-1 text-xs">{field.name}</span>
                )}
                {field.required && <span className="text-red-500 text-xs">*</span>}
            </div>
        </th>
    );
}

// Live Table Preview (Spreadsheet-like with Sortable Columns)
function LiveTablePreview({ fields, selectedFieldId, setSelectedFieldId, updateField, removeField, isDark }) {
    const { t } = useTranslation();
    return (
        <div className={`rounded-xl overflow-hidden border-2 ${isDark ? 'border-[#2a2a2a] bg-[#0a0a0a]' : 'border-gray-200 bg-white'}`}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                    <thead>
                        <tr>
                            <th className={`w-10 px-2 py-2 text-left text-xs font-medium border-b border-r ${isDark ? 'border-[#2a2a2a] bg-[#1a1a1a] text-gray-500' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                                #
                            </th>
                            {fields.map((field) => (
                                <SortableColumnHeader
                                    key={field.id}
                                    field={field}
                                    isSelected={selectedFieldId === field.id}
                                    onClick={() => setSelectedFieldId(field.id)}
                                    updateField={updateField}
                                    isDark={isDark}
                                />
                            ))}
                            <th className={`w-8 px-1 py-2 border-b ${isDark ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`} />
                        </tr>
                    </thead>
                    <tbody>
                        {/* Sample rows */}
                        {[1, 2, 3].map((rowNum) => (
                            <tr key={rowNum} className={`${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-50'} transition-colors`}>
                                <td className={`px-2 py-2.5 text-xs border-b border-r ${isDark ? 'border-[#2a2a2a] text-gray-600' : 'border-gray-100 text-gray-400'}`}>
                                    {rowNum}
                                </td>
                                {fields.map((field) => {
                                    const ft = FIELD_TYPES_STATIC[field.type];
                                    return (
                                        <td
                                            key={field.id}
                                            className={`px-2 py-2.5 text-xs border-b border-r ${isDark ? 'border-[#2a2a2a] text-gray-500' : 'border-gray-100 text-gray-400'}`}
                                        >
                                            <span className="italic opacity-60">{ft?.placeholder || '(empty)'}</span>
                                        </td>
                                    );
                                })}
                                <td className={`px-1 py-2.5 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`} />
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Footer hint */}
            <div className={`px-3 py-2 text-xs ${isDark ? 'bg-[#1a1a1a] text-gray-500' : 'bg-gray-50 text-gray-400'} border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                {t('data_collections.wizard.table_hint')}
            </div>
        </div>
    );
}

// Empty Table State
function EmptyTableState({ isOver, isDark, t }) {
    return (
        <div className={`h-full min-h-[400px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${isOver
            ? 'border-cyan-500 bg-cyan-500/10'
            : isDark
                ? 'border-[#2a2a2a] bg-[#0a0a0a]'
                : 'border-gray-300 bg-white'
            }`}>
            <div className={`text-6xl mb-4 ${isOver ? 'animate-bounce' : 'animate-pulse'}`}>
                {isOver ? '📥' : '📊'}
            </div>
            <h4 className={`font-semibold text-lg mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {isOver ? t('data_collections.wizard.drop_here') : t('data_collections.wizard.empty_table')}
            </h4>
            <p className={`text-sm text-center max-w-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {isOver
                    ? t('data_collections.wizard.release_to_add')
                    : t('data_collections.wizard.empty_table_hint')}
            </p>
        </div>
    );
}

// Field Configuration Panel
function FieldConfigPanel({ field, updateField, removeField, onClose, isDark }) {
    const { t } = useTranslation();
    const fieldType = FIELD_TYPES_STATIC[field.type];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{fieldType?.icon}</span>
                    <div>
                        <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('data_collections.wizard.column_config')}
                        </h4>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {field.type}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon-xs" onClick={onClose}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </Button>
            </div>

            <div className="space-y-4">
                {/* Field Name */}
                <div>
                    <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Column Name
                    </label>
                    <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-cyan-500`}
                    />
                </div>

                {/* Required Toggle */}
                <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'} border ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                    <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Required</p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Must have value</p>
                    </div>
                    <button
                        onClick={() => updateField(field.id, { required: !field.required })}
                        className={`relative w-11 h-6 rounded-full transition-all ${field.required ? 'bg-cyan-500' : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow ${field.required ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                {/* Default Value */}
                {field.type !== 'boolean' && field.type !== 'select' && field.type !== 'autonumber' && (
                    <div>
                        <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Default Value
                        </label>
                        <input
                            type={field.type === 'number' || field.type === 'currency' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            value={field.default || ''}
                            onChange={(e) => updateField(field.id, { default: e.target.value })}
                            placeholder={fieldType?.placeholder}
                            className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-cyan-500`}
                        />
                    </div>
                )}

                {/* Dropdown Options */}
                {field.type === 'select' && (
                    <div>
                        <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Options (one per line)
                        </label>
                        <textarea
                            value={(field.options || []).join('\n')}
                            onChange={(e) => updateField(field.id, { options: e.target.value.split('\n').filter(Boolean) })}
                            rows={4}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-cyan-500`}
                        />
                    </div>
                )}

                {/* Rating Preview */}
                {field.type === 'rating' && (
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'} border ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                        <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Preview</p>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="text-xl">⭐</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Button */}
            <Button
                variant="danger-ghost"
                className="w-full mt-4"
                onClick={() => removeField(field.id)}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Column
            </Button>
        </div>
    );
}

// Drag Preview
function DragPreview({ type, FIELD_TYPES }) {
    const fieldType = FIELD_TYPES?.find(f => f.type === type) || FIELD_TYPES_STATIC[type];
    if (!fieldType) return null;

    return (
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-2xl shadow-cyan-500/50 border-2 border-cyan-400">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{fieldType.icon}</span>
                <div>
                    <p className="font-bold">{fieldType.label}</p>
                    <p className="text-xs text-cyan-100">{fieldType.description}</p>
                </div>
            </div>
        </div>
    );
}

// Step 3: Preview & Confirm
function Step3({ data, fields, isDark, FIELD_TYPES }) {
    const { t } = useTranslation();
    return (
        <div className="p-6 space-y-6">
            {/* Collection Summary */}
            <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'} border-2 ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <div className="flex items-center gap-4 mb-6">
                    <div className="text-5xl p-4 rounded-2xl" style={{ backgroundColor: data.color + '15' }}>{data.icon}</div>
                    <div>
                        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.name}</h2>
                        {data.description && <p className="text-gray-500 mt-1">{data.description}</p>}
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: data.color + '20', color: data.color }}>
                                {fields.length} {t('data_collections.wizard.columns')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Final Table Preview */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className={`w-full ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                        <thead>
                            <tr className={isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}>
                                {fields.map((field) => {
                                    const ft = FIELD_TYPES?.find(f => f.type === field.type) || FIELD_TYPES_STATIC[field.type];
                                    return (
                                        <th key={field.id} className={`px-4 py-3 text-left text-sm font-semibold border-b ${isDark ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-700'}`}>
                                            <span className="mr-2">{ft?.icon}</span>
                                            {field.name}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {fields.map((field) => (
                                    <td key={field.id} className={`px-4 py-3 text-sm italic border-b ${isDark ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                                        {field.type === 'boolean' ? '☐' : field.type === 'date' ? '📅 --/--/----' : field.type === 'rating' ? '⭐⭐⭐☆☆' : '(empty)'}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Success Message */}
            <div className={`text-center p-6 rounded-xl ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'} border-2`}>
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="text-xl font-bold text-green-600 dark:text-green-400">{t('data_collections.wizard.ready_to_create')}</h3>
                <p className="text-sm text-gray-500 mt-2">{t('data_collections.wizard.will_create_with', { count: fields.length })}</p>
            </div>
        </div>
    );
}
