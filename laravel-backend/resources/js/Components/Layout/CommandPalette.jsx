import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const commands = [
        { label: 'Dashboard', href: '/dashboard', icon: 'home', shortcut: 'D' },
        { label: 'My Devices', href: '/devices', icon: 'device', shortcut: 'M' },
        { label: 'Profile Settings', href: '/profile', icon: 'user', shortcut: 'P' },
        { label: 'Add Device', href: '/devices/create', icon: 'plus', shortcut: 'N' },
        { label: 'Landing Page', href: '/', icon: 'globe', shortcut: 'H' },
        { label: 'Pricing', href: '/pricing', icon: 'upgrade', shortcut: 'R' },
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Cmd+K or Ctrl+K to open
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            // Escape to close
            if (e.key === 'Escape') {
                setIsOpen(false);
                setSearch('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSelect = (href) => {
        router.visit(href);
        setIsOpen(false);
        setSearch('');
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
                onClick={() => setIsOpen(false)}
            />

            {/* Command Palette */}
            <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 animate-scale-in">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Type a command or search..."
                            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
                            autoFocus
                        />
                        <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 rounded">
                            ESC
                        </kbd>
                    </div>

                    {/* Commands List */}
                    <div className="max-h-96 overflow-y-auto p-2">
                        {filteredCommands.length > 0 ? (
                            filteredCommands.map((cmd, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelect(cmd.href)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-700 transition-all group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <CommandIcon icon={cmd.icon} />
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {cmd.label}
                                        </span>
                                    </div>
                                    <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 rounded">
                                        {cmd.shortcut}
                                    </kbd>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500 dark:text-gray-400">No commands found</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">↑</kbd>
                                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">↓</kbd>
                                <span>to navigate</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">↵</kbd>
                                <span>to select</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function CommandIcon({ icon }) {
    const icons = {
        home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
        device: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
        user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        plus: "M12 4v16m8-8H4",
        globe: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        upgrade: "M13 10V3L4 14h7v7l9-11h-7z",
    };

    return (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
        </svg>
    );
}
