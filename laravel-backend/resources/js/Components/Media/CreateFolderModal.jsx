import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/UI';

export default function CreateFolderModal({
    isOpen,
    onClose,
    isDark = false,
    onSuccess
}) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setName('');
            setError('');
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            return () => window.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate
        if (!name.trim()) {
            setError(t('media.folder_name_required', 'Vui lòng nhập tên thư mục'));
            return;
        }

        // Validate folder name - only allow alphanumeric, space, dash, underscore
        if (!/^[a-zA-Z0-9_\-\s\u00C0-\u024F\u1E00-\u1EFF]+$/.test(name)) {
            setError(t('media.folder_name_invalid', 'Tên thư mục chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới'));
            return;
        }

        setError('');
        setIsSubmitting(true);

        router.post('/media/create-folder', { name: name.trim() }, {
            onSuccess: () => {
                onSuccess?.(name.trim());
                onClose();
            },
            onError: (errors) => {
                setError(errors.name || t('common.error', 'Đã xảy ra lỗi'));
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 ${isDark ? 'bg-black/80' : 'bg-black/50'} backdrop-blur-sm`}
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white'
                }`}>
                {/* Header */}
                <div className={`px-6 py-4 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                            }`}>
                            <svg className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('media.create_folder', 'Tạo thư mục mới')}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {t('media.create_folder_desc', 'Nhập tên cho thư mục mới')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('media.folder_name', 'Tên thư mục')}
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            placeholder={t('media.folder_name_placeholder', 'Ví dụ: Photos 2024')}
                            disabled={isSubmitting}
                            className={`w-full px-4 py-3 rounded-xl text-sm transition-all border focus:outline-none focus:ring-2 ${error
                                ? isDark
                                    ? 'border-red-500/50 focus:ring-red-500/20 focus:border-red-500'
                                    : 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                : isDark
                                    ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20'
                                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-gray-400/20'
                                }`}
                        />
                        {error && (
                            <p className={`mt-2 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`px-6 py-4 flex items-center justify-end gap-3 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            {t('common.cancel', 'Hủy')}
                        </Button>
                        <Button
                            type="submit"
                            variant="gradient"
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    {t('common.creating', 'Đang tạo...')}
                                </span>
                            ) : (
                                t('common.create', 'Tạo')
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
