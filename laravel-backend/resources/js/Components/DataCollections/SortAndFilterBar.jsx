import { useState, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';

export default function SortAndFilterBar({ sortBy, sortOrder, onSortChange, filterStatus, onFilterChange, isDark }) {
    const sortOptions = [
        { value: 'name', label: 'Name' },
        { value: 'created_at', label: 'Date Created' },
        { value: 'updated_at', label: 'Last Updated' },
        { value: 'total_records', label: 'Records Count' }
    ];

    const filterOptions = [
        { value: 'all', label: 'All Collections' },
        { value: 'has_records', label: 'Has Records' },
        { value: 'empty', label: 'Empty' },
        { value: 'has_workflows', label: 'Connected to Workflows' }
    ];

    const currentSort = sortOptions.find(opt => opt.value === sortBy);
    const currentFilter = filterOptions.find(opt => opt.value === filterStatus);

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Sort Dropdown */}
            <Menu as="div" className="relative">
                <Menu.Button className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#252525]' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span>Sort: {currentSort?.label}</span>
                    <svg className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </Menu.Button>
                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className={`absolute left-0 mt-2 w-56 rounded-xl shadow-lg py-1 z-10 ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-gray-200'}`}>
                        {sortOptions.map((option) => (
                            <Menu.Item key={option.value}>
                                {({ active }) => (
                                    <button
                                        onClick={() => {
                                            if (sortBy === option.value) {
                                                onSortChange(option.value, sortOrder === 'asc' ? 'desc' : 'asc');
                                            } else {
                                                onSortChange(option.value, 'asc');
                                            }
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-2 text-sm ${active
                                                ? isDark ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-900'
                                                : isDark ? 'text-gray-300' : 'text-gray-700'
                                            } ${sortBy === option.value ? 'font-semibold' : ''}`}
                                    >
                                        <span>{option.label}</span>
                                        {sortBy === option.value && (
                                            <svg className={`w-4 h-4 text-cyan-500 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </Menu.Item>
                        ))}
                    </Menu.Items>
                </Transition>
            </Menu>

            {/* Filter Dropdown */}
            <Menu as="div" className="relative">
                <Menu.Button className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#252525]' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>{currentFilter?.label}</span>
                </Menu.Button>
                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className={`absolute left-0 mt-2 w-56 rounded-xl shadow-lg py-1 z-10 ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-gray-200'}`}>
                        {filterOptions.map((option) => (
                            <Menu.Item key={option.value}>
                                {({ active }) => (
                                    <button
                                        onClick={() => onFilterChange(option.value)}
                                        className={`w-full flex items-center justify-between px-4 py-2 text-sm ${active
                                                ? isDark ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-900'
                                                : isDark ? 'text-gray-300' : 'text-gray-700'
                                            } ${filterStatus === option.value ? 'font-semibold' : ''}`}
                                    >
                                        <span>{option.label}</span>
                                        {filterStatus === option.value && (
                                            <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </Menu.Item>
                        ))}
                    </Menu.Items>
                </Transition>
            </Menu>
        </div>
    );
}
