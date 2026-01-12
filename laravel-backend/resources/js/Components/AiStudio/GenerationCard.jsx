export default function GenerationCard({ generation, onClick }) {
    const isProcessing = generation.status === 'pending' || generation.status === 'processing';

    return (
        <div
            onClick={onClick}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
        >
            {/* Image/Video Preview */}
            <div className="aspect-square bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                {isProcessing ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
                        <svg className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : generation.status === 'completed' && generation.result_url ? (
                    generation.type === 'image' ? (
                        <img
                            src={generation.result_url}
                            alt={generation.prompt}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <video
                            src={generation.result_url}
                            className="w-full h-full object-cover"
                            muted
                        />
                    )
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
                        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${generation.status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                            : generation.status === 'failed'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        }`}>
                        {generation.status === 'completed' ? '✓' : generation.status === 'failed' ? '✕' : '...'}
                    </span>
                </div>

                {/* Type Icon */}
                <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm">
                        {generation.type === 'image' ? (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                    {generation.prompt}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-mono">{generation.model}</span>
                    <span>{generation.credits_used} credits</span>
                </div>
            </div>
        </div>
    );
}
