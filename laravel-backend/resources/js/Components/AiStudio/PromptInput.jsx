import { useEffect, useRef } from 'react';

export default function PromptInput({ value, onChange, placeholder = "Mô tả chi tiết những gì bạn muốn tạo...", disabled = false, maxLength = 1000 }) {
    const textareaRef = useRef(null);

    // Auto-grow textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    const remainingChars = maxLength - (value?.length || 0);

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Prompt
                </label>
                <span className={`text-xs ${remainingChars < 100 ? 'text-red-500' : 'text-gray-400'}`}>
                    {remainingChars} ký tự còn lại
                </span>
            </div>

            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                rows={3}
                className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 rounded-xl resize-none transition-all focus:outline-none ${disabled
                        ? 'border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'
                        : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400'
                    } text-gray-900 dark:text-white placeholder-gray-400`}
                style={{ minHeight: '80px', maxHeight: '300px' }}
            />

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                💡 Tip: Mô tả càng chi tiết, kết quả càng chính xác
            </p>
        </div>
    );
}
