const fs = require('fs');
const path = require('path');

const processFile = (filePath, replacements) => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Add import Icon if needed and if we have replacements
    if (replacements && replacements.length > 0) {
        if (!content.includes('import { Icon }')) {
            if (content.includes("import { Button }")) {
                content = content.replace("import { Button }", "import { Button, Icon }");
            } else if (content.includes("import { Button,")) {
                content = content.replace("import { Button,", "import { Button, Icon,");
            } else if (content.includes("@/Components/UI")) {
                const match = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]@\/Components\/UI['"]/);
                if (match && !match[1].includes('Icon')) {
                    content = content.replace(match[0], match[0].replace(match[1], match[1] + ', Icon'));
                }
            } else {
                const lastImportIdx = content.lastIndexOf("import ");
                if (lastImportIdx >= 0) {
                    const nextLine = content.indexOf('\n', lastImportIdx);
                    content = content.slice(0, nextLine + 1) + "import { Icon } from '@/Components/UI';\n" + content.slice(nextLine + 1);
                }
            }
        }

        for (const [search, replace] of replacements) {
            // we use split join for global replace if string, else string.replace for regex
            if (typeof search === 'string') {
                if (content.includes(search)) {
                    content = content.split(search).join(replace);
                    hasChanges = true;
                }
            } else if (search instanceof RegExp) {
                if (search.test(content)) {
                    content = content.replace(search, replace);
                    hasChanges = true;
                }
            }
        }
    }

    if (hasChanges) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${path.basename(filePath)}`);
    } else {
        console.log(`No changes for ${path.basename(filePath)}`);
    }
};

const componentsDir = path.join(process.cwd(), 'resources/js/Components/Media');

// 1. MediaContextMenu.jsx
processFile(path.join(componentsDir, 'MediaContextMenu.jsx'), [
    [
        /<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" \/>\n\s*<\/svg>/g,
        `<Icon name="arrowRight" className="w-4 h-4 flex-shrink-0" />`
    ],
    [
        /<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" \/>\n\s*<\/svg>/g,
        `<Icon name="copy" className="w-4 h-4 flex-shrink-0" />`
    ],
    [
        /<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" \/>\n\s*<\/svg>/g,
        `<Icon name="download" className="w-4 h-4 flex-shrink-0" />`
    ],
    [
        /<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M19 7l-\.867 12\.142A2 2 0 0116\.138 21H7\.862a2 2 0 01-1\.995-1\.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" \/>\n\s*<\/svg>/g,
        `<Icon name="delete" className="w-4 h-4 flex-shrink-0" />`
    ],
    [/bg-\[#1a1a1a\]/g, 'bg-[#121212]/90 backdrop-blur-xl'],
    [/border-\[#2a2a2a\]/g, 'border-white/10']
]);

// 2. FolderSelectModal.jsx
processFile(path.join(componentsDir, 'FolderSelectModal.jsx'), [
    [
        /<svg className=\{\`w-5 h-5 \$\{isDark \? 'text-violet-400' : 'text-violet-600'\}\`\} fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" \/>\n\s*<\/svg>/g,
        `<Icon name="home" className={\`w-5 h-5 \${isDark ? 'text-violet-400' : 'text-violet-600'}\`} />`
    ],
    [
        /<svg className=\{\`w-5 h-5 flex-shrink-0 \$\{selectedFolder === '\/' \? 'text-white' : isDark \? 'text-amber-500' : 'text-amber-400'\}\`\} fill="currentColor" viewBox="0 0 24 24">\n\s*<path d="M10 4H4c-1\.1 0-1\.99\.9-1\.99 2L2 18c0 1\.1\.9 2 2 2h16c1\.1 0 2-\.9 2-2V8c0-1\.1-\.9-2-2-2h-8l-2-2z" \/>\n\s*<\/svg>/g,
        `<Icon name="folder" className={\`w-5 h-5 flex-shrink-0 \${selectedFolder === '/' ? 'text-white' : isDark ? 'text-amber-500' : 'text-amber-400'}\`} />`
    ],
    [
        /<svg className=\{\`w-5 h-5 flex-shrink-0 \$\{selectedFolder === '\/' \+ folder \? 'text-white' : isDark \? 'text-amber-500' : 'text-amber-400'\}\`\} fill="currentColor" viewBox="0 0 24 24">\n\s*<path d="M10 4H4c-1\.1 0-1\.99\.9-1\.99 2L2 18c0 1\.1\.9 2 2 2h16c1\.1 0 2-\.9 2-2V8c0-1\.1-\.9-2-2-2h-8l-2-2z" \/>\n\s*<\/svg>/g,
        `<Icon name="folder" className={\`w-5 h-5 flex-shrink-0 \${selectedFolder === '/' + folder ? 'text-white' : isDark ? 'text-amber-500' : 'text-amber-400'}\`} />`
    ],
    [
        /<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M12 6v6m0 0v6m0-6h6m-6 0H6" \/>\n\s*<\/svg>/g,
        `<Icon name="plus" className="w-5 h-5 flex-shrink-0" />`
    ],
    [ // Button spin
        /<svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">\n\s*<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"><\/circle>\n\s*<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"><\/path>\n\s*<\/svg>/g,
        `<Icon name="refresh" className="animate-spin w-3 h-3" />`
    ],
    [
        /<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{3\} d="M5 13l4 4L19 7" \/>\n\s*<\/svg>/g,
        `<Icon name="check" className="w-3 h-3 text-white" />`
    ]
]);

// 3. CreateFolderModal.jsx
processFile(path.join(componentsDir, 'CreateFolderModal.jsx'), [
    [
        /<svg className=\{\`w-5 h-5 \$\{isDark \? 'text-white' : 'text-gray-700'\}\`\} fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" \/>\n\s*<\/svg>/g,
        `<Icon name="folder" className={\`w-5 h-5 \${isDark ? 'text-white' : 'text-gray-700'}\`} />`
    ],
    [
        /<svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">\n\s*<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"><\/circle>\n\s*<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5\.373 0 0 5\.373 0 12h4z"><\/path>\n\s*<\/svg>/g,
        `<Icon name="refresh" className="animate-spin w-4 h-4" />`
    ]
]);


// 4. MediaLibraryModal.jsx
processFile(path.join(componentsDir, 'MediaLibraryModal.jsx'), [
    [ // search icon
        /<svg className=\{\`absolute left-3 top-1\/2 -translate-y-1\/2 w-4 h-4 \$\{isDark \? 'text-gray-500' : 'text-gray-400'\}\`\} fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" \/>\n\s*<\/svg>/g,
        `<Icon name="search" className={\`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 \${isDark ? 'text-gray-500' : 'text-gray-400'}\`} />`
    ],
    [ // view mode mapped array
        /\{\[[\s\S]*?\{ mode: 'grid', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' \},\n\s*\{ mode: 'list', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' \}[\s\S]*?\]\.map/g,
        `[
                                    { mode: 'grid', icon: 'grid' },
                                    { mode: 'list', icon: 'list' }
                                ].map`
    ],
    [
        /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d=\{icon\} \/>\n\s*<\/svg>/g,
        `<Icon name={icon} className="w-4 h-4" />`
    ],
    [
        /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M7 16a4 4 0 01-\.88-7\.903A5 5 0 1115\.9 6L16 6a5 5 0 011 9\.9M15 13l-3-3m0 0l-3 3m3-3v12" \/>\n\s*<\/svg>/g,
        `<Icon name="upload" className="w-4 h-4" />`
    ],
    [
        /<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M7 16a4 4 0 01-\.88-7\.903A5 5 0 1115\.9 6L16 6a5 5 0 011 9\.9M15 13l-3-3m0 0l-3 3m3-3v12" \/>\n\s*<\/svg>/g,
        `<Icon name="upload" className="w-5 h-5" />`
    ],
    [
        /<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" \/>\n\s*<\/svg>/g,
        `<Icon name="home" className="w-4 h-4 flex-shrink-0" />`
    ],
    [
        /<svg className="w-4 h-4 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 24 24">\n\s*<path d="M10 4H4c-1\.1 0-1\.99\.9-1\.99 2L2 18c0 1\.1\.9 2 2 2h16c1\.1 0 2-\.9 2-2V8c0-1\.1-\.9-2-2-2h-8l-2-2z" \/>\n\s*<\/svg>/g,
        `<Icon name="folder" className="w-4 h-4 flex-shrink-0 text-amber-500" />`
    ],
    [ // upload progress
        /<svg className=\{\`w-5 h-5 animate-pulse \$\{isDark \? 'text-white' : 'text-gray-900'\}\`\} fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M7 16a4 4 0 01-\.88-7\.903A5 5 0 1115\.9 6L16 6a5 5 0 011 9\.9M15 13l-3-3m0 0l-3 3m3-3v12" \/>\n\s*<\/svg>/g,
        `<Icon name="upload" className={\`w-5 h-5 animate-pulse \${isDark ? 'text-white' : 'text-gray-900'}\`} />`
    ],
    [ // drag overlay
        /<svg className=\{\`w-10 h-10 \$\{isDark \? 'text-gray-400' : 'text-gray-400'\}\`\} fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M7 16a4 4 0 01-\.88-7\.903A5 5 0 1115\.9 6L16 6a5 5 0 011 9\.9M15 13l-3-3m0 0l-3 3m3-3v12" \/>\n\s*<\/svg>/g,
        `<Icon name="upload" className={\`w-10 h-10 \${isDark ? 'text-gray-400' : 'text-gray-400'}\`} />`
    ],
    [
        /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" \/>\n\s*<\/svg>/g,
        `<Icon name="home" className="w-4 h-4" />`
    ],
    [
        /<svg className=\{\`w-4 h-4 \$\{isDark \? 'text-gray-600' : 'text-gray-400'\}\`\} fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M9 5l7 7-7 7" \/>\n\s*<\/svg>/g,
        `<Icon name="chevronRight" className={\`w-4 h-4 \${isDark ? 'text-gray-600' : 'text-gray-400'}\`} />`
    ],
    [ // grid empty folder
        /<svg className=\{\`w-12 h-12 mb-2 \$\{isDark \? 'text-amber-500' : 'text-amber-400'\}\`\} fill="currentColor" viewBox="0 0 24 24">\n\s*<path d="M10 4H4c-1\.1 0-1\.99\.9-1\.99 2L2 18c0 1\.1\.9 2 2 2h16c1\.1 0 2-\.9 2-2V8c0-1\.1-\.9-2-2-2h-8l-2-2z" \/>\n\s*<\/svg>/g,
        `<Icon name="folder" className={\`w-12 h-12 mb-2 \${isDark ? 'text-amber-500' : 'text-amber-400'}\`} />`
    ],
    [ // checkmarks
        /<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{3\} d="M5 13l4 4L19 7" \/>\n\s*<\/svg>/g,
        `<Icon name="check" className="w-3 h-3 text-current" />`
    ],
    [ // ai badges
        /<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M13 10V3L4 14h7v7l9-11h-7z" \/>\n\s*<\/svg>/g,
        `<Icon name="ai" className="w-3 h-3 text-white" />`
    ],
    [
        /<svg className="w-4 h-4 text-white ml-0\.5" fill="currentColor" viewBox="0 0 20 20">\n\s*<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9\.555 7\.168A1 1 0 008 8v4a1 1 0 001\.555\.832l3-2a1 1 0 000-1\.664l-3-2z" clipRule="evenodd" \/>\n\s*<\/svg>/g,
        `<Icon name="play" className="w-6 h-6 text-white ml-0.5" />`
    ],
    [
        /<svg className="w-3 h-3 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">\n\s*<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9\.555 7\.168A1 1 0 008 8v4a1 1 0 001\.555\.832l3-2a1 1 0 000-1\.664l-3-2z" clipRule="evenodd" \/>\n\s*<\/svg>/g,
        `<Icon name="play" className="w-5 h-5 text-white drop-shadow-md" />`
    ],
    [ // empty state icon
        /<svg className=\{\`w-8 h-8 \$\{isDark \? 'text-gray-600' : 'text-gray-300'\}\`\} fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{1\.5\} d="M4 16l4\.586-4\.586a2 2 0 012\.828 0L16 16m-2-2l1\.586-1\.586a2 2 0 012\.828 0L20 14m-6-6h\.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" \/>\n\s*<\/svg>/g,
        `<Icon name="media" className={\`w-8 h-8 \${isDark ? 'text-gray-600' : 'text-gray-400'}\`} />`
    ],
    [ // close modal
        /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M6 18L18 6M6 6l12 12" \/>\n\s*<\/svg>/g,
        `<Icon name="close" className="w-4 h-4" />`
    ],
    [/bg-\[#1a1a1a\]/g, 'bg-[#121212]'],
    [/border-\[#2a2a2a\]/g, 'border-white/5']
]);
