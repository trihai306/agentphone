const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, '..', 'resources/js/Components/Media/MediaSidebar.jsx');
let sidebar = fs.readFileSync(sidebarPath, 'utf8');

// Add Icon
if (!sidebar.includes('import { Icon }')) {
    sidebar = sidebar.replace(
        "import { useTranslation } from 'react-i18next';",
        "import { useTranslation } from 'react-i18next';\nimport { Icon } from '@/Components/UI';"
    );
}

// Nav items
sidebar = sidebar.replace(
    /const navItems = \[[\s\S]*?\];/,
    `const navItems = [
        { key: 'all', label: t('media.all_files', 'Tất cả'), icon: 'grid', count: stats.total },
        { key: 'image', label: t('media.images', 'Hình ảnh'), icon: 'media', count: stats.images },
        { key: 'video', label: t('media.videos', 'Video'), icon: 'video', count: stats.videos },
        { key: 'ai', label: 'AI Generated', icon: 'ai', count: stats.ai_generated },
    ];`
);

// bg-[#0d0d0d] to bg-[#0a0a0a]
sidebar = sidebar.replace('bg-[#0d0d0d]', 'bg-[#0a0a0a]');
sidebar = sidebar.replace('border-[#2a2a2a]', 'border-white/5');

// Active state
sidebar = sidebar.replace(
    /className=\{\`w-full flex items-center gap-3 px-3 py-2\.5 rounded-lg text-sm font-medium transition-all \$\{\(activeFilter === item\.key && !activeFolder\) \|\| \(item\.key === 'all' && !activeFilter && !activeFolder\)\n\s*\? isDark\n\s*\? 'bg-white text-black'\n\s*: 'bg-gray-900 text-white'\n\s*: isDark\n\s*\? 'text-gray-400 hover:text-white hover:bg-\\[#1a1a1a\\]'\n\s*: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'\n\s*\}\`\}/,
    `className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 \${(activeFilter === item.key && !activeFolder) || (item.key === 'all' && !activeFilter && !activeFolder)
                            ? isDark
                                ? 'bg-white/10 text-white shadow-xl shadow-black/20 border border-white/10'
                                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
                            : isDark
                                ? 'text-gray-400 hover:text-white hover:bg-white/5'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }\`}`
);

// Icon mapping
sidebar = sidebar.replace(
    /<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d=\{item\.icon\} \/>\n\s*<\/svg>/,
    `<Icon name={item.icon} className="w-5 h-5 flex-shrink-0" />`
);

// AI Studio SVG
sidebar = sidebar.replace(
    /<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M13 10V3L4 14h7v7l9-11h-7z" \/>\n\s*<\/svg>/g,
    `<Icon name="ai" className="w-5 h-5 text-violet-500" />`
);
sidebar = sidebar.replace(
    /<svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" \/>\n\s*<\/svg>/g,
    `<Icon name="chevronRight" className="w-4 h-4 opacity-40" />`
);

// AI Gallery SVG
sidebar = sidebar.replace(
    /<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" \/>\n\s*<\/svg>/g,
    `<Icon name="media" className="w-5 h-5 text-emerald-500" />`
);

// Detail arrow SVG
sidebar = sidebar.replace(
    /<svg className="w-3\.5 h-3\.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" \/>\n\s*<\/svg>/g,
    `<Icon name="arrowRight" className="w-3.5 h-3.5" />`
);

// Upgraded Quick Links Classes
sidebar = sidebar.replace(
    /className=\{\`w-full flex items-center gap-3 px-3 py-2\.5 rounded-lg text-sm font-medium transition-all \$\{isDark\n\s*\? 'text-gray-400 hover:text-white hover:bg-\\[#1a1a1a\\]'\n\s*: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'\n\s*\}\`\}/g,
    `className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 \${isDark
                        ? 'text-gray-400 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }\`}`
);

fs.writeFileSync(sidebarPath, sidebar);
console.log('MediaSidebar updated');

const detailPath = path.join(__dirname, '..', 'resources/js/Components/Media/MediaDetailPanel.jsx');
let detail = fs.readFileSync(detailPath, 'utf8');

// Add Icon
if (!detail.includes('import { Icon }')) {
    detail = detail.replace(
        "import { Button } from '@/Components/UI';",
        "import { Button, Icon } from '@/Components/UI';"
    );
}

// empty state SVG
detail = detail.replace(
    /<svg className=\{\`w-8 h-8 \$\{isDark \? 'text-gray-600' : 'text-gray-300'\}\`\} fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M4 16l4\.586-4\.586a2 2 0 012\.828 0L16 16m-2-2l1\.586-1\.586a2 2 0 012\.828 0L20 14m-6-6h\.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" \/>\n\s*<\/svg>/g,
    `<Icon name="media" className={\`w-8 h-8 \${isDark ? 'text-gray-500' : 'text-gray-400'}\`} />`
);

// close icon SVG
detail = detail.replace(
    /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M6 18L18 6M6 6l12 12" \/>\n\s*<\/svg>/g,
    `<Icon name="close" className="w-4 h-4" />`
);

// Source Badge SVG
detail = detail.replace(
    /<svg className="w-3\.5 h-3\.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M13 10V3L4 14h7v7l9-11h-7z" \/>\n\s*<\/svg>/g,
    `<Icon name="ai" className="w-3.5 h-3.5" />`
);

// copy copied SVG
detail = detail.replace(
    /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M5 13l4 4L19 7" \/>\n\s*<\/svg>/g,
    `<Icon name="check" className="w-4 h-4" />`
);
detail = detail.replace(
    /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" \/>\n\s*<\/svg>/g,
    `<Icon name="copy" className="w-4 h-4" />`
);

// download SVG
detail = detail.replace(
    /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" \/>\n\s*<\/svg>/g,
    `<Icon name="download" className="w-4 h-4" />`
);

// delete SVG
detail = detail.replace(
    /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M19 7l-\.867 12\.142A2 2 0 0116\.138 21H7\.862a2 2 0 01-1\.995-1\.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" \/>\n\s*<\/svg>/g,
    `<Icon name="delete" className="w-4 h-4" />`
);

// open original SVG
detail = detail.replace(
    /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" \/>\n\s*<\/svg>/g,
    `<Icon name="arrowRight" className="w-4 h-4" />` // Maybe link or external link, arrowRight is close
);

// Dark mode styles for panel
// bg-[#0d0d0d] -> bg-[#0a0a0a]
detail = detail.replace(/bg-\[#0d0d0d\]/g, 'bg-[#0a0a0a]');
detail = detail.replace(/border-\[#2a2a2a\]/g, 'border-white/5');

fs.writeFileSync(detailPath, detail);
console.log('MediaDetailPanel updated');
