import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import MediaLibraryModal from '@/Components/MediaLibraryModal';

/**
 * FileInputConfig - Configuration for file input nodes
 * Supports single file or folder selection with random file mode
 */
export function FileInputConfig({ data, updateData, isDark }) {
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const { t } = useTranslation();

    const selectionType = data.selectionType || 'file';
    const fileName = data.fileName || null;
    const folderName = data.folderName || null;
    const filePath = data.filePath || null;
    const filesArray = data.files || null;

    const hasSelection = (selectionType === 'file' && fileName) ||
        (selectionType === 'files' && filesArray && filesArray.length > 0) ||
        (selectionType === 'folder' && folderName);

    // Handle file(s) selected from Media Library - supports both single and multi-select
    const handleFileSelected = (files) => {
        // Normalize to array for consistent handling
        const fileArray = Array.isArray(files) ? files : [files];

        if (fileArray.length === 1) {
            // Single file mode
            const file = fileArray[0];
            updateData('selectionType', 'file');
            updateData('fileId', file.id);
            updateData('fileName', file.original_name || file.name);
            updateData('filePath', file.url || file.file_url);
            updateData('fileType', file.type);
            updateData('fileSize', file.size || file.formatted_size);
            updateData('files', null); // Clear multi-file data
        } else {
            // Multi-file mode
            updateData('selectionType', 'files');
            updateData('files', fileArray.map(file => ({
                id: file.id,
                name: file.original_name || file.name,
                url: file.url || file.file_url,
                type: file.type,
                size: file.size || file.formatted_size,
            })));
            updateData('fileId', null);
            updateData('fileName', `${fileArray.length} files`);
            updateData('filePath', null);
        }
        // Clear folder data
        updateData('folderName', null);
        updateData('folderPath', null);
    };

    // Handle folder selected from Media Library (includes files list)
    const handleFolderSelected = (folder, files = []) => {
        updateData('selectionType', 'folder');
        updateData('folderName', folder.name);
        updateData('folderPath', folder.path);
        // Store files in folder for processing
        if (files && files.length > 0) {
            updateData('folderFiles', files.map(file => ({
                id: file.id,
                name: file.original_name || file.name,
                url: file.url || file.file_url,
                type: file.type,
            })));
            updateData('folderFileCount', files.length);
        }
        // Clear single/multi file data
        updateData('fileId', null);
        updateData('fileName', null);
        updateData('filePath', null);
        updateData('files', null);
    };

    // Clear selection
    const clearSelection = () => {
        updateData('selectionType', 'file');
        updateData('fileId', null);
        updateData('fileName', null);
        updateData('filePath', null);
        updateData('folderName', null);
        updateData('folderPath', null);
        updateData('folderFiles', null);
        updateData('folderFileCount', null);
        updateData('files', null);
    };

    return (
        <>
            {/* Current Selection Display */}
            <ConfigSection title={t('flows.editor.config.selected_file')} isDark={isDark}>
                {hasSelection ? (
                    <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[#2a2a2a] bg-[#0f0f0f]' : 'border-gray-200 bg-gray-50'}`}>
                        {selectionType === 'folder' ? (
                            /* Folder Preview */
                            <div className="p-4 flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-50'}`}>
                                    <svg className="w-7 h-7 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M10 4H2v16h20V6H12l-2-2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {folderName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                                            {t('flows.editor.config.random_mode')}
                                        </span>
                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('flows.editor.config.random_file_desc')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : selectionType === 'files' && filesArray ? (
                            /* Multiple Files Preview */
                            <div className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-violet-500/20' : 'bg-violet-50'}`}>
                                        <span className={`text-xl font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                            {filesArray.length}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {filesArray.length} {t('flows.editor.config.files_selected', 'files selected')}
                                        </p>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                                            {t('flows.editor.config.multi_mode', 'Multi-file')}
                                        </span>
                                    </div>
                                </div>
                                {/* File list preview */}
                                <div className={`space-y-1 max-h-32 overflow-y-auto ${isDark ? 'scrollbar-dark' : ''}`}>
                                    {filesArray.slice(0, 5).map((file, idx) => (
                                        <div key={file.id || idx} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                            <span className={`text-xs truncate flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {file.name}
                                            </span>
                                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {file.type}
                                            </span>
                                        </div>
                                    ))}
                                    {filesArray.length > 5 && (
                                        <p className={`text-xs text-center py-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            +{filesArray.length - 5} {t('common.more', 'more')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* File Preview */
                            <div className="p-4 flex items-center gap-3">
                                {filePath && data.fileType === 'image' ? (
                                    <img
                                        src={filePath}
                                        alt={fileName}
                                        className="w-12 h-12 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-violet-500/20' : 'bg-violet-50'}`}>
                                        <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {fileName}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {t('flows.editor.config.fixed_file')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className={`flex gap-2 px-4 py-3 border-t ${isDark ? 'border-[#252525]' : 'border-gray-200'}`}>
                            <button
                                onClick={() => setShowMediaPicker(true)}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${isDark
                                    ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300'
                                    : 'bg-white hover:bg-gray-100 text-gray-700'}`}
                            >
                                {t('flows.editor.config.change')}
                            </button>
                            <button
                                onClick={clearSelection}
                                className="px-3 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-all"
                            >
                                {t('flows.editor.config.delete')}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Empty State */
                    <button
                        onClick={() => setShowMediaPicker(true)}
                        className={`w-full py-6 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-3 ${isDark
                            ? 'border-[#2a2a2a] hover:border-cyan-500/50 hover:bg-cyan-500/5'
                            : 'border-gray-200 hover:border-cyan-400 hover:bg-cyan-50/50'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-50'}`}>
                            <svg className={`w-7 h-7 ${isDark ? 'text-cyan-400' : 'text-cyan-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('flows.editor.config.select_file_folder')}
                            </p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('flows.editor.config.file_folder_desc')}
                            </p>
                        </div>
                    </button>
                )}
            </ConfigSection>

            {/* Output Variable */}
            <ConfigSection title={t('flows.editor.config.output_variable')} isDark={isDark}>
                <input
                    type="text"
                    value={data.outputVariable || 'filePath'}
                    onChange={(e) => updateData('outputVariable', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-cyan-400'
                        : 'bg-white border-gray-200 text-cyan-600'
                        }`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('flows.editor.config.access_via')} <code className="text-cyan-400">{`{{${data.outputVariable || 'filePath'}}}`}</code> {t('flows.editor.config.in_other_nodes')}
                </p>
            </ConfigSection>

            {/* Explanation */}
            {selectionType === 'folder' && (
                <div className={`p-3 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                    <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                        <strong>{t('flows.editor.config.random_mode_label')}</strong> {t('flows.editor.config.random_mode_explanation')}
                    </p>
                </div>
            )}

            {/* Media Library Modal */}
            <MediaLibraryModal
                isOpen={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelect={handleFileSelected}
                onSelectFolder={handleFolderSelected}
                allowFolderSelection={true}
                allowMultiple={true}
                fileType="any"
            />
        </>
    );
}

export default FileInputConfig;
