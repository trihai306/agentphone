export default function GenerationPreview({ generation, type = 'image' }) {
    if (!generation) {
        return (
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                <div className="text-center text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Preview sẽ hiển thị ở đây</p>
                </div>
            </div>
        );
    }

    if (generation.status === 'pending' || generation.status === 'processing') {
        return (
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-purple-600 dark:text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-purple-700 dark:text-purple-300 font-semibold">
                        {generation.status === 'pending' ? 'Đang chờ...' : 'Đang tạo...'}
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                        Vui lòng đợi trong giây lát
                    </p>
                </div>
            </div>
        );
    }

    if (generation.status === 'failed') {
        return (
            <div className="aspect-square bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                <div className="text-center text-red-600 dark:text-red-400 px-6">
                    <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-semibold mb-1">Generation failed</p>
                    <p className="text-sm">{generation.error_message || 'Unknown error'}</p>
                </div>
            </div>
        );
    }

    if (generation.status === 'completed' && generation.result_url) {
        if (type === 'image') {
            return (
                <div className="rounded-2xl overflow-hidden shadow-xl">
                    <img
                        src={generation.result_url}
                        alt={generation.prompt}
                        className="w-full h-auto"
                    />
                </div>
            );
        } else {
            return (
                <div className="rounded-2xl overflow-hidden shadow-xl">
                    <video
                        src={generation.result_url}
                        controls
                        className="w-full h-auto"
                    />
                </div>
            );
        }
    }

    return null;
}
