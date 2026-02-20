const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'resources/js/Pages/Media/Index.jsx');
let content = fs.readFileSync(indexPath, 'utf8');

// Add Icon
if (!content.includes('import { Icon }')) {
    content = content.replace(
        "import { Button, SearchInput } from '@/Components/UI';",
        "import { Button, SearchInput, Icon } from '@/Components/UI';"
    );
}

// Toolbar classes
content = content.replace(
    /className=\{\`px-6 py-4 border-b flex items-center justify-between \$\{isDark \? 'bg-\\[#0d0d0d\\] border-\\[#2a2a2a\\]' : 'bg-white border-gray-200'\}\`\}/g,
    `className={\`px-6 py-4 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl \${isDark ? 'bg-[#0a0a0a]/80 border-white/5' : 'bg-white/80 border-gray-200'}\`}`
);

// Delete button icon
content = content.replace(
    /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M19 7l-\.867 12\.142A2 2 0 0116\.138 21H7\.862a2 2 0 01-1\.995-1\.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" \/>\n\s*<\/svg>/g,
    `<Icon name="delete" className="w-4 h-4" />`
);

// Detail panel toggle icon
content = content.replace(
    /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" \/>\n\s*<\/svg>/g,
    `<Icon name="media" className="w-4 h-4" />`
);

// Upload button icon and styles
content = content.replace(
    /className=\{\`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all \$\{isDark\n\s*\? 'bg-white text-black hover:bg-gray-100'\n\s*: 'bg-gray-900 text-white hover:bg-gray-800'\n\s*\}\`\}/g,
    `className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 \${isDark
                                ? 'bg-white/10 text-white hover:bg-white/20 shadow-lg shadow-black/20 border border-white/10'
                                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105'
                                }\`}`
);
content = content.replace( // Bottom empty state upload button
    /className=\{\`mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all \$\{isDark\n\s*\? 'bg-white text-black hover:bg-gray-100'\n\s*: 'bg-gray-900 text-white hover:bg-gray-800'\n\s*\}\`\}/g,
    `className={\`mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 \${isDark
                                        ? 'bg-white/10 text-white hover:bg-white/20 shadow-lg shadow-black/20 border border-white/10'
                                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105'
                                        }\`}`
);
content = content.replace(
    /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M7 16a4 4 0 01-\.88-7\.903A5 5 0 1115\.9 6L16 6a5 5 0 011 9\.9M15 13l-3-3m0 0l-3 3m3-3v12" \/>\n\s*<\/svg>/g,
    `<Icon name="upload" className="w-4 h-4" />`
);
content = content.replace(
    /<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M7 16a4 4 0 01-\.88-7\.903A5 5 0 1115\.9 6L16 6a5 5 0 011 9\.9M15 13l-3-3m0 0l-3 3m3-3v12" \/>\n\s*<\/svg>/g,
    `<Icon name="upload" className="w-5 h-5" />`
);
content = content.replace( // Upload progress icon
    /<svg className=\{\`w-5 h-5 animate-pulse \$\{isDark \? 'text-white' : 'text-gray-900'\}\`\} fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M7 16a4 4 0 01-\.88-7\.903A5 5 0 1115\.9 6L16 6a5 5 0 011 9\.9M15 13l-3-3m0 0l-3 3m3-3v12" \/>\n\s*<\/svg>/g,
    `<Icon name="upload" className={\`w-5 h-5 animate-pulse \${isDark ? 'text-white' : 'text-gray-900'}\`} />`
);
content = content.replace( // drag overlay icon
    /<svg className=\{\`w-10 h-10 \$\{isDark \? 'text-gray-400' : 'text-gray-400'\}\`\} fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M7 16a4 4 0 01-\.88-7\.903A5 5 0 1115\.9 6L16 6a5 5 0 011 9\.9M15 13l-3-3m0 0l-3 3m3-3v12" \/>\n\s*<\/svg>/g,
    `<Icon name="upload" className={\`w-10 h-10 \${isDark ? 'text-gray-400' : 'text-gray-400'}\`} />`
);


// View Mode toggle uses raw path inside map, we will convert those to Icon names later, but for now we replace the map data
content = content.replace(
    /\{\[[\s\S]*?\{ mode: 'grid', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' \},\n\s*\{ mode: 'list', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' \}[\s\S]*?\]\.map/,
    `[
                                    { mode: 'grid', icon: 'grid' },
                                    { mode: 'list', icon: 'list' }
                                ].map`
);

content = content.replace(
    /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d=\{icon\} \/>\n\s*<\/svg>/g,
    `<Icon name={icon} className="w-4 h-4" />`
);

// Breadcrumb home
content = content.replace(
    /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" \/>\n\s*<\/svg>/g,
    `<Icon name="home" className="w-4 h-4" />`
);
// Breadcrumb arrow
content = content.replace(
    /<svg className=\{\`w-4 h-4 \$\{isDark \? 'text-gray-600' : 'text-gray-400'\}\`\} fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M9 5l7 7-7 7" \/>\n\s*<\/svg>/g,
    `<Icon name="chevronRight" className={\`w-4 h-4 \${isDark ? 'text-gray-600' : 'text-gray-400'}\`} />`
);


// Folder empty icon
content = content.replace(
    /<svg className=\{\`w-16 h-16 mb-2 \$\{isDark \? 'text-amber-500' : 'text-amber-400'\}\`\} fill="currentColor" viewBox="0 0 24 24">\n\s*<path d="M10 4H4c-1\.1 0-1\.99\.9-1\.99 2L2 18c0 1\.1\.9 2 2 2h16c1\.1 0 2-\.9 2-2V8c0-1\.1-\.9-2-2-2h-8l-2-2z" \/>\n\s*<\/svg>/g,
    `<Icon name="folder" className={\`w-16 h-16 mb-2 \${isDark ? 'text-amber-500' : 'text-amber-400'}\`} />`
);

// Play button icon (Grid view)
content = content.replace(
    /<svg className="w-4 h-4 text-white ml-0\.5" fill="currentColor" viewBox="0 0 20 20">\n\s*<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9\.555 7\.168A1 1 0 008 8v4a1 1 0 001\.555\.832l3-2a1 1 0 000-1\.664l-3-2z" clipRule="evenodd" \/>\n\s*<\/svg>/g,
    `<Icon name="play" className="w-6 h-6 text-white ml-0.5" />`
);
// Play button icon (List view)
content = content.replace(
    /<svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">\n\s*<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9\.555 7\.168A1 1 0 008 8v4a1 1 0 001\.555\.832l3-2a1 1 0 000-1\.664l-3-2z" clipRule="evenodd" \/>\n\s*<\/svg>/g,
    `<Icon name="play" className="w-5 h-5 text-white drop-shadow-md" />`
);


// Checkmarks
content = content.replace(
    /<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{3\} d="M5 13l4 4L19 7" \/>\n\s*<\/svg>/g,
    `<Icon name="check" className="w-3 h-3 text-current" />`
);

// AI badge
content = content.replace(
    /<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M13 10V3L4 14h7v7l9-11h-7z" \/>\n\s*<\/svg>/g,
    `<Icon name="ai" className="w-3 h-3 text-white" />`
);
content = content.replace(
    /<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M13 10V3L4 14h7v7l9-11h-7z" \/>\n\s*<\/svg>/g,
    `<Icon name="ai" className="w-3 h-3" />`
);

// Empty state logo
content = content.replace(
    /<svg className=\{\`w-10 h-10 \$\{isDark \? 'text-gray-600' : 'text-gray-300'\}\`\} fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M4 16l4\.586-4\.586a2 2 0 012\.828 0L16 16m-2-2l1\.586-1\.586a2 2 0 012\.828 0L20 14m-6-6h\.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" \/>\n\s*<\/svg>/g,
    `<Icon name="media" className={\`w-10 h-10 \${isDark ? 'text-gray-600' : 'text-gray-400'}\`} />`
);

// Folder add context menu
content = content.replace(
    /<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" \/>\n\s*<\/svg>/g,
    `<Icon name="folder" className="w-4 h-4 flex-shrink-0" />`
);

// bg-[#0d0d0d] fixes to #0a0a0a
content = content.replace(/bg-\[#0d0d0d\]/g, 'bg-[#0a0a0a]');

// General grid item border enhancements
content = content.replace( // folder
    /border-2 border-dashed \$\{isDark \? 'border-\\[#2a2a2a\\]' : 'border-gray-200'\}/g,
    `border-2 border-dashed \${isDark ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:border-violet-300'}`
);

fs.writeFileSync(indexPath, content);
console.log('Index.jsx updated');
