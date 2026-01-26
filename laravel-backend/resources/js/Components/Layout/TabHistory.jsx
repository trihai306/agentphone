import { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * TabHistory - Browser-like tab history showing recently visited pages
 * Tabs persist across page navigation and can be clicked to navigate
 */

// Map of routes to display names and icons
const PAGE_CONFIG = {
    '/dashboard': { name: 'Bảng Điều Khiển', icon: '🏠' },
    '/devices': { name: 'Thiết Bị', icon: '📱' },
    '/workflows': { name: 'Workflows', icon: '⚡' },
    '/campaigns': { name: 'Campaigns', icon: '📢' },
    '/jobs': { name: 'Jobs', icon: '📋' },
    '/data-collections': { name: 'Dữ Liệu', icon: '📊' },
    '/ai-studio': { name: 'AI Studio', icon: '✨' },
    '/ai-credits': { name: 'AI Credits', icon: '💎' },
    '/marketplace': { name: 'Marketplace', icon: '🏪' },
    '/media': { name: 'Thư Viện', icon: '📁' },
    '/wallet': { name: 'Ví Tiền', icon: '💰' },
    '/deposits': { name: 'Nạp Tiền', icon: '➕' },
    '/withdrawals': { name: 'Rút Tiền', icon: '➖' },
    '/bank-accounts': { name: 'Tài Khoản NH', icon: '🏦' },
    '/service-packages': { name: 'Gói Dịch Vụ', icon: '📦' },
    '/notifications': { name: 'Thông Báo', icon: '🔔' },
    '/error-logs': { name: 'Báo Lỗi', icon: '⚠️' },
};

// Get page info from URL
function getPageInfo(url) {
    // Remove query string
    const path = url.split('?')[0];

    // Check exact match first
    if (PAGE_CONFIG[path]) {
        return { ...PAGE_CONFIG[path], path };
    }

    // Check prefix matches for nested routes
    for (const [route, config] of Object.entries(PAGE_CONFIG)) {
        if (path.startsWith(route + '/')) {
            // Extract ID or sub-path for more specific title
            const subPath = path.replace(route + '/', '');
            return {
                ...config,
                name: `${config.name}`,
                path,
            };
        }
    }

    // Default fallback
    return { name: path.split('/').filter(Boolean)[0] || 'Trang', icon: '📄', path };
}

const MAX_TABS = 8;
const STORAGE_KEY = 'tabHistory';

export default function TabHistory() {
    const { url } = usePage();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [tabs, setTabs] = useState([]);

    // Load tabs from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setTabs(JSON.parse(saved));
            } catch (e) {
                setTabs([]);
            }
        }
    }, []);

    // Add current page to tabs when URL changes
    useEffect(() => {
        if (!url) return;

        const pageInfo = getPageInfo(url);

        setTabs(prevTabs => {
            // Check if tab already exists
            const existingIndex = prevTabs.findIndex(t => t.path === pageInfo.path);

            let newTabs;
            if (existingIndex !== -1) {
                // Tab exists - keep it in same position, just update lastVisited
                newTabs = prevTabs.map((tab, index) =>
                    index === existingIndex
                        ? { ...tab, lastVisited: Date.now() }
                        : tab
                );
            } else {
                // Add new tab at the end
                newTabs = [
                    ...prevTabs,
                    { ...pageInfo, lastVisited: Date.now() }
                ];
            }

            // Limit to max tabs (remove oldest from beginning)
            if (newTabs.length > MAX_TABS) {
                newTabs = newTabs.slice(-MAX_TABS);
            }

            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTabs));

            return newTabs;
        });
    }, [url]);

    // Close a tab
    const closeTab = (e, path) => {
        e.preventDefault();
        e.stopPropagation();

        setTabs(prevTabs => {
            const newTabs = prevTabs.filter(t => t.path !== path);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTabs));
            return newTabs;
        });
    };

    // Clear all tabs
    const clearAllTabs = () => {
        setTabs([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    if (tabs.length === 0) return null;

    const currentPath = url.split('?')[0];

    return (
        <div className={`border-b transition-colors ${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200/80'}`}>
            <div className="flex items-center px-4 py-1.5 gap-1 overflow-x-auto scrollbar-hide">
                {/* Tab list */}
                <div className="flex items-center gap-1 flex-1 min-w-0">
                    {tabs.map((tab, index) => {
                        const isActive = currentPath === tab.path;

                        return (
                            <Link
                                key={tab.path}
                                href={tab.path}
                                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all max-w-[180px] ${isActive
                                    ? isDark
                                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                        : 'bg-violet-50 text-violet-700 border border-violet-200'
                                    : isDark
                                        ? 'text-slate-400 hover:text-white hover:bg-white/5'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                            >
                                <span className="text-sm flex-shrink-0">{tab.icon}</span>
                                <span className="truncate">{tab.name}</span>

                                {/* Close button */}
                                <button
                                    onClick={(e) => closeTab(e, tab.path)}
                                    className={`ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${isDark
                                        ? 'hover:bg-white/10 text-slate-500 hover:text-white'
                                        : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                                        }`}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </Link>
                        );
                    })}
                </div>

                {/* Clear all button */}
                {tabs.length > 1 && (
                    <button
                        onClick={clearAllTabs}
                        className={`flex-shrink-0 p-1.5 rounded-lg text-xs transition-colors ${isDark
                            ? 'text-slate-500 hover:text-white hover:bg-white/5'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                        title="Đóng tất cả tabs"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
