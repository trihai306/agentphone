import { motion } from 'framer-motion';

export default function ViewModeSwitcher({ currentView, onViewChange, isDark }) {
    const views = [
        {
            id: 'grid',
            label: 'Grid',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            id: 'list',
            label: 'List',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            )
        },
        {
            id: 'table',
            label: 'Table',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )
        }
    ];

    return (
        <div className={`inline-flex items-center rounded-lg p-1 ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-gray-100 border border-gray-200'}`}>
            {views.map((view) => (
                <button
                    key={view.id}
                    onClick={() => onViewChange(view.id)}
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentView === view.id
                            ? isDark ? 'text-white' : 'text-gray-900'
                            : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    {currentView === view.id && (
                        <motion.div
                            layoutId="activeView"
                            className={`absolute inset-0 rounded-md ${isDark ? 'bg-cyan-500/20' : 'bg-white shadow-sm'}`}
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                        {view.icon}
                        <span className="hidden sm:inline">{view.label}</span>
                    </span>
                </button>
            ))}
        </div>
    );
}
