import { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Button } from '@/Components/UI';

/**
 * TabHistory - Browser-like tab history showing recently visited pages
 * Tabs persist across page navigation and can be clicked to navigate
 */

// Map of routes to display names and icons (matching NavLink icon keys)
const PAGE_CONFIG = {
    '/dashboard': { name: 'Bảng Điều Khiển', icon: 'home' },
    '/devices': { name: 'Thiết Bị', icon: 'device' },
    '/flows': { name: 'Flows', icon: 'flow' },
    '/campaigns': { name: 'Campaigns', icon: 'seed' },
    '/jobs': { name: 'Jobs', icon: 'play' },
    '/data-collections': { name: 'Dữ Liệu', icon: 'database' },
    '/ai-studio': { name: 'AI Studio', icon: 'ai' },
    '/ai-credits': { name: 'AI Credits', icon: 'credits' },
    '/marketplace': { name: 'Marketplace', icon: 'shop' },
    '/media': { name: 'Thư Viện', icon: 'media' },
    '/wallet': { name: 'Ví Tiền', icon: 'wallet' },
    '/topup': { name: 'Nạp Tiền', icon: 'plus' },
    '/withdraw': { name: 'Rút Tiền', icon: 'withdraw' },
    '/bank-accounts': { name: 'Tài Khoản NH', icon: 'bank' },
    '/packages': { name: 'Gói Dịch Vụ', icon: 'package' },
    '/notifications': { name: 'Thông Báo', icon: 'bell' },
    '/error-reports': { name: 'Báo Lỗi', icon: 'bug' },
};

// SVG icon paths (same as NavLink)
const ICONS = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    device: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
    flow: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
    seed: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    play: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    database: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
    ai: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    credits: "M13 10V3L4 14h7v7l9-11h-7z",
    shop: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    media: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    wallet: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    plus: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    withdraw: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    bank: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
    package: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    bug: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    default: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
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
    return { name: path.split('/').filter(Boolean)[0] || 'Trang', icon: 'default', path };
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
                const loadedTabs = JSON.parse(saved);

                // DEDUPLICATION: Remove any duplicate tabs that might exist in localStorage
                const uniqueTabs = [];
                const seenPaths = new Set();

                for (const tab of loadedTabs) {
                    if (!seenPaths.has(tab.path)) {
                        uniqueTabs.push(tab);
                        seenPaths.add(tab.path);
                    }
                }

                setTabs(uniqueTabs);

                // Save deduplicated tabs back to localStorage
                if (uniqueTabs.length !== loadedTabs.length) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueTabs));
                }
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
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS[tab.icon] || ICONS.default} />
                                </svg>
                                <span className="truncate">{tab.name}</span>

                                {/* Close button */}
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={(e) => closeTab(e, tab.path)}
                                    className={`ml-1 opacity-0 group-hover:opacity-100 transition-opacity`}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </Button>
                            </Link>
                        );
                    })}
                </div>

                {/* Clear all button */}
                {tabs.length > 1 && (
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={clearAllTabs}
                        title="Đóng tất cả tabs"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </Button>
                )}
            </div>
        </div>
    );
}
