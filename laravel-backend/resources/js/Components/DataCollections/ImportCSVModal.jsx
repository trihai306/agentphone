import { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Components/Layout/ToastProvider';

// Auto-detect field type from sample values
function detectFieldType(values) {
    const nonEmptyValues = values.filter(v => v && v.trim());
    if (nonEmptyValues.length === 0) return 'text';

    const samples = nonEmptyValues.slice(0, 10);

    // Check if all are numbers
    if (samples.every(v => !isNaN(parseFloat(v)) && isFinite(v))) {
        // Check if currency (has VND, $, etc)
        if (samples.some(v => /[\$₫€£¥]/.test(v))) return 'currency';
        return 'number';
    }

    // Check phone pattern
    if (samples.every(v => /^[\+0-9\s\-\(\)]{8,}$/.test(v))) return 'phone';

    // Check email
    if (samples.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) return 'email';

    // Check URL
    if (samples.every(v => /^https?:\/\//.test(v))) return 'url';

    // Check date patterns
    if (samples.every(v => /^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}$/.test(v))) return 'date';

    // Check boolean-like
    if (samples.every(v => ['yes', 'no', 'true', 'false', '0', '1', 'có', 'không'].includes(v.toLowerCase()))) {
        return 'boolean';
    }

    // Long text
    if (samples.some(v => v.length > 100)) return 'textarea';

    return 'text';
}

// Parse CSV content
function parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return { headers: [], rows: [], error: 'File trống hoặc chỉ có header' };

    // Detect delimiter
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(';') ? ';' : ',');

    const parseRow = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const headers = parseRow(lines[0]);
    const rows = lines.slice(1).map(parseRow).filter(row => row.some(cell => cell.trim()));

    return { headers, rows, error: null };
}

const FIELD_TYPE_OPTIONS = [
    { value: 'text', label: 'Text', icon: '📝' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'phone', label: 'Phone', icon: '📱' },
    { value: 'date', label: 'Date', icon: '📅' },
    { value: 'boolean', label: 'Checkbox', icon: '☑️' },
    { value: 'select', label: 'Dropdown', icon: '🎯' },
    { value: 'textarea', label: 'Long Text', icon: '📄' },
    { value: 'url', label: 'URL', icon: '🔗' },
    { value: 'currency', label: 'Currency', icon: '💰' },
];

export default function ImportCSVModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';

    const fileInputRef = useRef(null);
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview & Map, 3: Confirm
    const [dragOver, setDragOver] = useState(false);
    const [csvData, setCsvData] = useState(null);
    const [collectionName, setCollectionName] = useState('');
    const [columnTypes, setColumnTypes] = useState({});
    const [processing, setProcessing] = useState(false);

    const resetState = () => {
        setStep(1);
        setCsvData(null);
        setCollectionName('');
        setColumnTypes({});
        setDragOver(false);
        setProcessing(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) processFile(file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const processFile = (file) => {
        if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
            addToast(t('data_collections.csv.invalid_file'), 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const parsed = parseCSV(content);

            if (parsed.error) {
                addToast(parsed.error, 'error');
                return;
            }

            // Auto-detect types for each column
            const types = {};
            parsed.headers.forEach((header, index) => {
                const columnValues = parsed.rows.map(row => row[index] || '');
                types[header] = detectFieldType(columnValues);
            });

            setCsvData(parsed);
            setColumnTypes(types);
            setCollectionName(file.name.replace(/\.(csv|txt)$/i, ''));
            setStep(2);
        };
        reader.readAsText(file);
    };

    const handleImport = () => {
        if (!csvData || !collectionName.trim()) {
            addToast(t('data_collections.csv.name_required'), 'warning');
            return;
        }

        setProcessing(true);

        // Build schema from headers and types
        const schema = csvData.headers.map(header => ({
            name: header,
            type: columnTypes[header] || 'text',
            required: false,
        }));

        // Build records from rows
        const records = csvData.rows.map(row => {
            const record = {};
            csvData.headers.forEach((header, index) => {
                record[header] = row[index] || '';
            });
            return record;
        });

        router.post('/data-collections/import-csv', {
            name: collectionName,
            description: `Imported from CSV`,
            icon: '📊',
            color: '#3b82f6',
            schema: schema,
            records: records,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                addToast(t('data_collections.csv.import_success', { count: records.length }), 'success');
                handleClose();
            },
            onError: (errors) => {
                console.error('Import errors:', errors);
                addToast(t('data_collections.csv.import_error'), 'error');
                setProcessing(false);
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className={`relative w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                {/* Header */}
                <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-[#2a2a2a] bg-[#141414]' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-100'}`}>
                            <span className="text-2xl">📥</span>
                        </div>
                        <div>
                            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('data_collections.import_csv')}
                            </h2>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('data_collections.csv.step', { step, total: 2 })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-gray-200'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className={`overflow-y-auto max-h-[calc(85vh-140px)] ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                    {step === 1 && (
                        <div className="p-8">
                            {/* Upload Area */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragOver
                                        ? 'border-cyan-500 bg-cyan-500/10 scale-[1.01]'
                                        : isDark
                                            ? 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-cyan-600 hover:bg-cyan-900/10'
                                            : 'border-gray-300 bg-white hover:border-cyan-500 hover:bg-cyan-50'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <div className="text-6xl mb-4">{dragOver ? '📥' : '📄'}</div>
                                <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('data_collections.csv.drop_here')}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('data_collections.csv.or_click')}
                                </p>
                                <p className={`text-xs mt-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                    CSV, TXT • UTF-8
                                </p>
                            </div>

                            {/* Tips */}
                            <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-200'} border`}>
                                <p className={`text-sm font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>💡 {t('data_collections.csv.tips_title')}</p>
                                <ul className={`text-xs space-y-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                    <li>• {t('data_collections.csv.tip_first_row')}</li>
                                    <li>• {t('data_collections.csv.tip_utf8')}</li>
                                    <li>• {t('data_collections.csv.tip_auto_detect')}</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {step === 2 && csvData && (
                        <div className="p-6 space-y-6">
                            {/* Collection Name */}
                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {t('data_collections.wizard.collection_name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={collectionName}
                                    onChange={(e) => setCollectionName(e.target.value)}
                                    placeholder={t('data_collections.wizard.collection_name_placeholder')}
                                    className={`w-full px-4 py-3 rounded-xl text-lg transition-all ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-white border-gray-300'} border-2 focus:ring-2 focus:ring-cyan-500`}
                                />
                            </div>

                            {/* Column Mapping */}
                            <div>
                                <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {t('data_collections.csv.column_mapping')} ({csvData.headers.length} {t('data_collections.wizard.columns')})
                                </h3>
                                <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                                    <div className="overflow-x-auto">
                                        <table className={`w-full ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                                            <thead>
                                                <tr className={isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}>
                                                    <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {t('data_collections.csv.column_name')}
                                                    </th>
                                                    <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {t('data_collections.csv.field_type')}
                                                    </th>
                                                    <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {t('data_collections.csv.sample_values')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${isDark ? 'divide-[#2a2a2a]' : 'divide-gray-100'}`}>
                                                {csvData.headers.map((header, index) => (
                                                    <tr key={header} className={isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-50'}>
                                                        <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            <span className="font-medium">{header}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select
                                                                value={columnTypes[header] || 'text'}
                                                                onChange={(e) => setColumnTypes(prev => ({ ...prev, [header]: e.target.value }))}
                                                                className={`px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-[#252525] border-[#3a3a3a] text-white' : 'bg-gray-50 border-gray-200'} border`}
                                                            >
                                                                {FIELD_TYPE_OPTIONS.map(opt => (
                                                                    <option key={opt.value} value={opt.value}>
                                                                        {opt.icon} {opt.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {csvData.rows.slice(0, 3).map(row => row[index]).filter(Boolean).join(', ').substring(0, 50) || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Preview Summary */}
                            <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-200'} border`}>
                                <p className={`font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                                    ✅ {t('data_collections.csv.will_import', { rows: csvData.rows.length, columns: csvData.headers.length })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t flex justify-between ${isDark ? 'border-[#2a2a2a] bg-[#141414]' : 'border-gray-200 bg-white'}`}>
                    <button
                        onClick={() => step === 1 ? handleClose() : setStep(1)}
                        className={`px-5 py-2.5 rounded-xl font-medium transition-all ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    >
                        {step === 1 ? t('data_collections.wizard.cancel') : t('data_collections.wizard.back')}
                    </button>

                    {step === 2 && (
                        <button
                            onClick={handleImport}
                            disabled={processing || !collectionName.trim()}
                            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-cyan-500/30 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    {t('data_collections.csv.importing')}
                                </>
                            ) : (
                                <>📥 {t('data_collections.csv.import_button', { count: csvData?.rows?.length || 0 })}</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
