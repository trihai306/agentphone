// Bulk emoji replacement script - Batch 2
const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, 'resources/js/Pages');

const filesToProcess = [
    // Tasks/Index.jsx
    {
        file: 'Tasks/Index.jsx',
        addImport: true,
        replacements: [
            ["<option value=\"reward_high\">💎 {t('tasks.reward_high', 'Thưởng cao')}</option>", "<option value=\"reward_high\">{t('tasks.reward_high', 'Thưởng cao')}</option>"],
            ["<option value=\"reward_low\">💵 {t('tasks.reward_low', 'Thưởng thấp')}</option>", "<option value=\"reward_low\">{t('tasks.reward_low', 'Thưởng thấp')}</option>"],
            ["<span className=\"text-3xl\">{task.icon || '📋'}</span>", "{task.icon ? <span className=\"text-3xl\">{task.icon}</span> : <Icon name=\"clipboard\" className=\"w-8 h-8\" />}"],
        ]
    },
    // Tasks/MyTasks.jsx
    {
        file: 'Tasks/MyTasks.jsx',
        addImport: true,
        replacements: [
            ["📤 {t('tasks.created_tasks', 'Đã tạo')}", "<Icon name=\"upload\" className=\"w-4 h-4 inline-block mr-1\" /> {t('tasks.created_tasks', 'Đã tạo')}"],
            ["📥 {t('tasks.accepted_tasks', 'Đã nhận')}", "<Icon name=\"download\" className=\"w-4 h-4 inline-block mr-1\" /> {t('tasks.accepted_tasks', 'Đã nhận')}"],
            ["<div className=\"text-5xl mb-4\">📋</div>", "<div className=\"mb-4\"><Icon name=\"clipboard\" className=\"w-12 h-12 mx-auto\" /></div>"],
            ["<span className=\"text-3xl\">{task.icon || '📋'}</span>", "{task.icon ? <span className=\"text-3xl\">{task.icon}</span> : <Icon name=\"clipboard\" className=\"w-8 h-8\" />}"],
            ["🤖 {task.flow?.name}", "<Icon name=\"robot\" className=\"w-3.5 h-3.5 inline-block mr-0.5\" /> {task.flow?.name}"],
            ["📱 {task.accepted_devices}/{task.required_devices}", "<Icon name=\"device\" className=\"w-3.5 h-3.5 inline-block mr-0.5\" /> {task.accepted_devices}/{task.required_devices}"],
            ["💰 {formatVND(task.reward_amount)} đ", "<Icon name=\"coin\" className=\"w-3.5 h-3.5 inline-block mr-0.5\" /> {formatVND(task.reward_amount)} đ"],
            ["<div className=\"text-5xl mb-4\">📥</div>", "<div className=\"mb-4\"><Icon name=\"download\" className=\"w-12 h-12 mx-auto\" /></div>"],
            ["<span className=\"text-3xl\">{app.task?.icon || '📋'}</span>", "{app.task?.icon ? <span className=\"text-3xl\">{app.task.icon}</span> : <Icon name=\"clipboard\" className=\"w-8 h-8\" />}"],
            ["👤 {app.task?.creator?.name}", "<Icon name=\"user\" className=\"w-3.5 h-3.5 inline-block mr-0.5\" /> {app.task?.creator?.name}"],
            ["📱 {app.device?.name || `${app.device?.brand} ${app.device?.model}`}", "<Icon name=\"device\" className=\"w-3.5 h-3.5 inline-block mr-0.5\" /> {app.device?.name || `${app.device?.brand} ${app.device?.model}`}"],
            ["▶️ {t('tasks.start', 'Bắt đầu')}", "{t('tasks.start', 'Bắt đầu')}"],
        ]
    },
    // Tasks/Show.jsx
    {
        file: 'Tasks/Show.jsx',
        addImport: true,
        replacements: [
            ["<span className=\"text-4xl\">{task.icon || '📋'}</span>", "{task.icon ? <span className=\"text-4xl\">{task.icon}</span> : <Icon name=\"clipboard\" className=\"w-10 h-10\" />}"],
            ["<span className=\"text-3xl\">{task.flow.icon || '🤖'}</span>", "{task.flow.icon ? <span className=\"text-3xl\">{task.flow.icon}</span> : <Icon name=\"robot\" className=\"w-8 h-8\" />}"],
            ["⚠️ {t('tasks.user_must_provide_data', 'Bạn cần cung cấp data collection của riêng mình khi nhận nhiệm vụ')}", "<Icon name=\"exclamation\" className=\"w-4 h-4 inline-block mr-1\" /> {t('tasks.user_must_provide_data', 'Bạn cần cung cấp data collection của riêng mình khi nhận nhiệm vụ')}"],
            ["<span className=\"text-3xl\">{task.data_collection.icon || '📊'}</span>", "{task.data_collection.icon ? <span className=\"text-3xl\">{task.data_collection.icon}</span> : <Icon name=\"database\" className=\"w-8 h-8\" />}"],
            ["📱 {app.device?.name || app.device?.brand}", "<Icon name=\"device\" className=\"w-3.5 h-3.5 inline-block mr-0.5\" /> {app.device?.name || app.device?.brand}"],
            ["📱 {t('tasks.apply_now', 'Nhận nhiệm vụ')}", "<Icon name=\"device\" className=\"w-4 h-4 inline-block mr-1\" /> {t('tasks.apply_now', 'Nhận nhiệm vụ')}"],
        ]
    },
    // Marketplace/Index.jsx
    {
        file: 'Marketplace/Index.jsx',
        addImport: true,
        replacements: [
            ["{ id: 'all', name: t('common.all', 'Tất cả'), icon: '🔥' }", "{ id: 'all', name: t('common.all', 'Tất cả'), icon: 'fire' }"],
            ["{ id: 'tiktok', name: 'TikTok', icon: '🎵' }", "{ id: 'tiktok', name: 'TikTok', icon: 'music' }"],
            ["{ id: 'facebook', name: 'Facebook', icon: '📘' }", "{ id: 'facebook', name: 'Facebook', icon: 'globe' }"],
            ["{ id: 'instagram', name: 'Instagram', icon: '📸' }", "{ id: 'instagram', name: 'Instagram', icon: 'camera' }"],
            ["{ id: 'youtube', name: 'YouTube', icon: '▶️' }", "{ id: 'youtube', name: 'YouTube', icon: 'play' }"],
            ["{ id: 'shopee', name: 'Shopee', icon: '🛒' }", "{ id: 'shopee', name: 'Shopee', icon: 'shoppingCart' }"],
            ["{ id: 'lazada', name: 'Lazada', icon: '🛍️' }", "{ id: 'lazada', name: 'Lazada', icon: 'shoppingBag' }"],
            ["{ id: 'telegram', name: 'Telegram', icon: '✈️' }", "{ id: 'telegram', name: 'Telegram', icon: 'airplane' }"],
            ["{ id: 'ecommerce', name: 'E-commerce', icon: '🏪' }", "{ id: 'ecommerce', name: 'E-commerce', icon: 'store' }"],
            ["{ id: 'automation', name: 'Automation', icon: '⚡' }", "{ id: 'automation', name: 'Automation', icon: 'credits' }"],
            ["{ value: 'paid', label: '💰 Trả phí' }", "{ value: 'paid', label: 'Trả phí' }"],
            ["<option value=\"popular\">🔥 Phổ biến</option>", "<option value=\"popular\">Phổ biến</option>"],
            ["<option value=\"price_low\">💵 Giá thấp → cao</option>", "<option value=\"price_low\">Giá thấp → cao</option>"],
            ["<option value=\"price_high\">💎 Giá cao → thấp</option>", "<option value=\"price_high\">Giá cao → thấp</option>"],
        ]
    },
    // AiStudio/Index.jsx
    {
        file: 'AiStudio/Index.jsx',
        addImport: true,
        replacements: [
            ["icon: '🔄',", "icon: 'refresh',"],
            ["{ label: '16:9', w: 1920, h: 1080, icon: '🖥️' }", "{ label: '16:9', w: 1920, h: 1080, icon: 'tv' }"],
            ["{ label: '9:16', w: 1080, h: 1920, icon: '📱' }", "{ label: '9:16', w: 1080, h: 1920, icon: 'device' }"],
            ["{ label: '4:3', w: 1024, h: 768, icon: '📺' }", "{ label: '4:3', w: 1024, h: 768, icon: 'tv' }"],
            ["{ label: '16:9', value: '16:9', icon: '🖥️' }", "{ label: '16:9', value: '16:9', icon: 'tv' }"],
            ["{ label: '9:16', value: '9:16', icon: '📱' }", "{ label: '9:16', value: '9:16', icon: 'device' }"],
            // Tab buttons
            [`                                                    🎬`, `                                                    <Icon name="video" className="w-5 h-5" />`],
            [`                                                    🖼️`, `                                                    <Icon name="media" className="w-5 h-5" />`],
            ["📝 Text to Video", "<Icon name=\"edit\" className=\"w-4 h-4 inline-block mr-1\" /> Text to Video"],
            ["🖼️ Image to Video", "<Icon name=\"media\" className=\"w-4 h-4 inline-block mr-1\" /> Image to Video"],
            ["<span className=\"text-3xl block mb-3\">📷</span>", "<Icon name=\"camera\" className=\"w-8 h-8 mx-auto mb-3\" />"],
            ["🔊 Generate Audio", "<Icon name=\"sound\" className=\"w-4 h-4 inline-block mr-1\" /> Generate Audio"],
            ["{type === 'image' ? '🖼️ Ảnh gần đây' : '🎬 Video gần đây'}", "{type === 'image' ? <><Icon name=\"media\" className=\"w-4 h-4 inline-block mr-1\" /> Ảnh gần đây</> : <><Icon name=\"video\" className=\"w-4 h-4 inline-block mr-1\" /> Video gần đây</>}"],
            ["<span className=\"text-4xl\">❌</span>", "<Icon name=\"xCircle\" className=\"w-10 h-10\" />"],
            ["{gen.type === 'video' ? '🎬' : '🖼️'}", "{gen.type === 'video' ? <Icon name=\"video\" className=\"w-5 h-5\" /> : <Icon name=\"media\" className=\"w-5 h-5\" />}"],
            ["<span className=\"text-4xl\">{gen.type === 'video' ? '🎬' : '🖼️'}</span>", "{gen.type === 'video' ? <Icon name=\"video\" className=\"w-10 h-10\" /> : <Icon name=\"media\" className=\"w-10 h-10\" />}"],
            [`                                                                ⬇️`, `                                                                <Icon name="download" className="w-4 h-4" />`],
            [`                                                                💾`, `                                                                <Icon name="save" className="w-4 h-4" />`],
            ["🔄 Thử lại", "<Icon name=\"refresh\" className=\"w-3.5 h-3.5 inline-block mr-0.5\" /> Thử lại"],
            ["<span className=\"text-4xl\">{type === 'image' ? '🖼️' : '🎬'}</span>", "{type === 'image' ? <Icon name=\"media\" className=\"w-10 h-10\" /> : <Icon name=\"video\" className=\"w-10 h-10\" />}"],
            ["⚡ Đang xử lý", "<Icon name=\"credits\" className=\"w-4 h-4 inline-block mr-1\" /> Đang xử lý"],
            ["{previewGeneration.type === 'video' ? '🎬 Video' : '🖼️ Ảnh'}", "{previewGeneration.type === 'video' ? <><Icon name=\"video\" className=\"w-4 h-4 inline-block mr-1\" /> Video</> : <><Icon name=\"media\" className=\"w-4 h-4 inline-block mr-1\" /> Ảnh</>}"],
        ]
    },
    // AiStudio/Gallery.jsx
    {
        file: 'AiStudio/Gallery.jsx',
        addImport: true,
        replacements: [
            ["<span className=\"text-xl\">🎨</span>", "<Icon name=\"palette\" className=\"w-5 h-5\" />"],
            ["<option value=\"image\">🖼️ Hình ảnh</option>", "<option value=\"image\">Hình ảnh</option>"],
            ["<option value=\"video\">🎬 Video</option>", "<option value=\"video\">Video</option>"],
            ["<span className=\"text-xl\">❌</span>", "<Icon name=\"xCircle\" className=\"w-5 h-5\" />"],
            ["{gen.type === 'video' ? '🎬 Video' : '🖼️ Ảnh'}", "{gen.type === 'video' ? 'Video' : 'Ảnh'}"],
            ["<span className=\"text-rose-500\">❌</span>", "<Icon name=\"xCircle\" className=\"w-4 h-4 text-rose-500\" />"],
            ["{gen.type === 'video' ? '🎬' : '🖼️'}", "{gen.type === 'video' ? <Icon name=\"video\" className=\"w-5 h-5\" /> : <Icon name=\"media\" className=\"w-5 h-5\" />}"],
            ["<span className=\"text-4xl\">🎨</span>", "<Icon name=\"palette\" className=\"w-10 h-10\" />"],
            ["<span className=\"text-3xl\">❌</span>", "<Icon name=\"xCircle\" className=\"w-8 h-8\" />"],
            ["{selectedGeneration.type === 'video' ? '🎬 Video' : '🖼️ Hình ảnh'}", "{selectedGeneration.type === 'video' ? 'Video' : 'Hình ảnh'}"],
        ]
    },
    // AiStudio/Scenario.jsx
    {
        file: 'AiStudio/Scenario.jsx',
        addImport: true,
        replacements: [
            ["{ id: 'cinematic', icon: '🎬', name: 'Cinematic', desc: 'Hollywood style' }", "{ id: 'cinematic', icon: 'film', name: 'Cinematic', desc: 'Hollywood style' }"],
            ["{ id: 'documentary', icon: '📹', name: 'Documentary', desc: 'Real & authentic' }", "{ id: 'documentary', icon: 'video', name: 'Documentary', desc: 'Real & authentic' }"],
            ["{ id: 'commercial', icon: '💎', name: 'Commercial', desc: 'Premium ads' }", "{ id: 'commercial', icon: 'diamond', name: 'Commercial', desc: 'Premium ads' }"],
            ["{ id: 'social_media', icon: '📱', name: 'Social', desc: 'Viral content' }", "{ id: 'social_media', icon: 'device', name: 'Social', desc: 'Viral content' }"],
            ["{ id: 'storytelling', icon: '💫', name: 'Story', desc: 'Emotional' }", "{ id: 'storytelling', icon: 'sparkle', name: 'Story', desc: 'Emotional' }"],
            ["{ id: 'general', name: 'Đa nền tảng', icon: '🌐' }", "{ id: 'general', name: 'Đa nền tảng', icon: 'globe' }"],
            ["{ id: 'youtube', name: 'YouTube', icon: '▶️' }", "{ id: 'youtube', name: 'YouTube', icon: 'play' }"],
            ["{ id: 'tiktok', name: 'TikTok', icon: '🎵' }", "{ id: 'tiktok', name: 'TikTok', icon: 'music' }"],
            ["{ id: 'instagram', name: 'Instagram', icon: '📷' }", "{ id: 'instagram', name: 'Instagram', icon: 'camera' }"],
            ["{ id: 'ads', name: 'Quảng cáo', icon: '💼' }", "{ id: 'ads', name: 'Quảng cáo', icon: 'briefcase' }"],
            ["addToast('🎬 Đã bắt đầu tạo video! Theo dõi tiến độ bên dưới.', 'success')", "addToast('Đã bắt đầu tạo video! Theo dõi tiến độ bên dưới.', 'success')"],
            ["<span>📋</span>", "<Icon name=\"clipboard\" className=\"w-4 h-4\" />"],
            ["🎬 Kịch bản đang tạo", "<Icon name=\"video\" className=\"w-4 h-4 inline-block mr-1\" /> Kịch bản đang tạo"],
            ["{s.status === 'queued' ? '🕐' : '⚡'}", "{s.status === 'queued' ? <Icon name=\"clock\" className=\"w-4 h-4\" /> : <Icon name=\"credits\" className=\"w-4 h-4\" />}"],
            ["{s.output_type === 'video' ? '🎥' : '🖼️'} {s.total_scenes} cảnh", "<>{s.output_type === 'video' ? <Icon name=\"video\" className=\"w-3.5 h-3.5 inline-block mr-0.5\" /> : <Icon name=\"media\" className=\"w-3.5 h-3.5 inline-block mr-0.5\" />} {s.total_scenes} cảnh</>"],
            ["{ id: 'script', label: '📝 Kịch bản', icon: null }", "{ id: 'script', label: 'Kịch bản', icon: 'edit' }"],
            ["{ id: 'settings', label: '⚙️ Cài đặt', icon: null }", "{ id: 'settings', label: 'Cài đặt', icon: 'settings' }"],
            ["{ id: 'characters', label: '👤 Nhân vật', icon: null }", "{ id: 'characters', label: 'Nhân vật', icon: 'user' }"],
        ]
    },
    // Campaigns/Create.jsx - the biggest one
    {
        file: 'Campaigns/Create.jsx',
        addImport: true,
        replacements: [
            // Templates
            ["icon: '🌱',", "icon: 'seed',"],
            ["icon: '🎵',", "icon: 'music',"],
            ["icon: '🎯',", "icon: 'target',"],
            ["icon: '⚙️',", "icon: 'settings',"],
            // Validation messages
            ["if (!name.trim()) return '⚠️ Nhập tên campaign';", "if (!name.trim()) return 'Nhập tên campaign';"],
            ["if (selectedWorkflows.length === 0) return '⚠️ Thêm ít nhất 1 kịch bản';", "if (selectedWorkflows.length === 0) return 'Thêm ít nhất 1 kịch bản';"],
            ["return '⚠️ Chọn ít nhất 1 thiết bị';", "return 'Chọn ít nhất 1 thiết bị';"],
            // Header emoji
            ["<span className=\"text-3xl\">🚀</span>", "<Icon name=\"rocket\" className=\"w-8 h-8\" />"],
            ["📖 Cách thức hoạt động", "<Icon name=\"book\" className=\"w-4 h-4 inline-block mr-1\" /> Cách thức hoạt động"],
            // How it works steps
            ["{ icon: '⚡', title: 'Kịch bản', desc: 'Chọn workflow' }", "{ icon: 'credits', title: 'Kịch bản', desc: 'Chọn workflow' }"],
            ["{ icon: '📱', title: 'Thiết bị', desc: 'Chọn điện thoại' }", "{ icon: 'device', title: 'Thiết bị', desc: 'Chọn điện thoại' }"],
            ["{ icon: '📊', title: 'Dữ liệu', desc: 'Chọn records chạy' }", "{ icon: 'database', title: 'Dữ liệu', desc: 'Chọn records chạy' }"],
            ["{ icon: '🎯', title: 'Kết quả', desc: 'Jobs tự động tạo' }", "{ icon: 'target', title: 'Kết quả', desc: 'Jobs tự động tạo' }"],
            // Quick start label
            ["⚡ Bắt đầu nhanh", "<Icon name=\"credits\" className=\"w-4 h-4 inline-block mr-1\" /> Bắt đầu nhanh"],
            // Template icon
            ["<span className=\"text-3xl\">{selectedTemplate?.icon || '🌱'}</span>", "{selectedTemplate?.icon ? <span className=\"text-3xl\">{selectedTemplate.icon}</span> : <Icon name=\"seed\" className=\"w-8 h-8\" />}"],
            // Step indicators
            ["{ num: 1, label: 'Kịch bản', icon: '⚡' }", "{ num: 1, label: 'Kịch bản', icon: 'credits' }"],
            ["{ num: 2, label: 'Thiết bị', icon: '📱' }", "{ num: 2, label: 'Thiết bị', icon: 'device' }"],
            ["{ num: 3, label: 'Cấu hình', icon: '⚙️' }", "{ num: 3, label: 'Cấu hình', icon: 'settings' }"],
            ["{ num: 4, label: 'Xác nhận', icon: '✅' }", "{ num: 4, label: 'Xác nhận', icon: 'checkCircle' }"],
            // Workflow order section
            ["⚡ Thứ Tự Chạy", "<Icon name=\"credits\" className=\"w-4 h-4 inline-block mr-1\" /> Thứ Tự Chạy"],
            // Workflow chain badges
            ["? { icon: '🔵', text: `${config.repeat_count}×`, color: 'blue' }", "? { icon: 'refresh', text: `${config.repeat_count}×`, color: 'blue' }"],
            ["? { icon: '🟣', text: 'If', color: 'purple' }", "? { icon: 'target', text: 'If', color: 'purple' }"],
            [": { icon: '🟢', text: '1×', color: 'emerald' };", ": { icon: 'check', text: '1×', color: 'emerald' };"],
            // Config gear icon
            [`                                                            ⚙️`, `                                                            <Icon name="settings" className="w-4 h-4" />`],
            // Search placeholder
            ["placeholder=\"🔍 Tìm...\"", "placeholder=\"Tìm...\""],
            // Workflow lightning
            ["<span className=\"text-lg\">⚡</span>", "<Icon name=\"credits\" className=\"w-5 h-5\" />"],
            // Device section headers
            ["📱 Chọn Thiết Bị", "<Icon name=\"device\" className=\"w-4 h-4 inline-block mr-1\" /> Chọn Thiết Bị"],
            // Device icons in cards
            ["<span className=\"text-2xl\">📱</span>", "<Icon name=\"device\" className=\"w-6 h-6\" />"],
            // Data collection label
            ["📊 Data collection (tuỳ chọn):", "<Icon name=\"database\" className=\"w-3.5 h-3.5 inline-block mr-0.5\" /> Data collection (tuỳ chọn):"],
            // No device state
            ["<span className=\"text-4xl block mb-3\">📵</span>", "<Icon name=\"noDevice\" className=\"w-10 h-10 mx-auto mb-3\" />"],
            // Data collection heading
            ["<span className=\"text-2xl\">📊</span>", "<Icon name=\"database\" className=\"w-6 h-6\" />"],
            // DC items
            ["<span className=\"text-xl\">{dc.icon || '📋'}</span>", "{dc.icon ? <span className=\"text-xl\">{dc.icon}</span> : <Icon name=\"clipboard\" className=\"w-5 h-5\" />}"],
            // Config section
            ["<span className=\"text-xl\">⚙️</span>", "<Icon name=\"settings\" className=\"w-5 h-5\" />"],
            // Repeat icon
            ["<span className=\"text-2xl\">🔄</span>", "<Icon name=\"refresh\" className=\"w-6 h-6\" />"],
            // Distribution options
            ["<option value=\"random\">🔀 Random</option>", "<option value=\"random\">Random</option>"],
            ["<option value=\"sequential\">📋 Tuần tự</option>", "<option value=\"sequential\">Tuần tự</option>"],
            // Device assignment
            ["<span className=\"text-2xl\">📱</span>", "<Icon name=\"device\" className=\"w-6 h-6\" />"],
            ["🔄 Tự động (chia đều)", "<Icon name=\"refresh\" className=\"w-4 h-4 inline-block mr-1\" /> Tự động (chia đều)"],
            ["🎯 Thủ công (chọn cụ thể)", "<Icon name=\"target\" className=\"w-4 h-4 inline-block mr-1\" /> Thủ công (chọn cụ thể)"],
            // Manual assignment device icons
            ["<span className=\"text-xl\">📱</span>", "<Icon name=\"device\" className=\"w-5 h-5\" />"],
            // Warning
            ["⚠️ Vui lòng chọn Dữ Liệu trước khi phân chia thủ công", "<Icon name=\"exclamation\" className=\"w-4 h-4 inline-block mr-1\" /> Vui lòng chọn Dữ Liệu trước khi phân chia thủ công"],
            // Pool repeat
            ["<span className=\"text-2xl\">🔄</span>", "<Icon name=\"refresh\" className=\"w-6 h-6\" />"],
            // Summary
            ["📋 Tóm tắt Campaign", "<Icon name=\"clipboard\" className=\"w-4 h-4 inline-block mr-1\" /> Tóm tắt Campaign"],
            // Submit button
            ["{isSubmitting ? 'Đang tạo...' : '🚀 Tạo Campaign'}", "{isSubmitting ? 'Đang tạo...' : 'Tạo Campaign'}"],
            // Record selector header
            ["📋 Chọn Records - {selectedCollection.name}", "<Icon name=\"clipboard\" className=\"w-4 h-4 inline-block mr-1\" /> Chọn Records - {selectedCollection.name}"],
        ]
    },
];

let processed = 0;
let errors = [];

for (const config of filesToProcess) {
    const filePath = path.join(PAGES_DIR, config.file);

    if (!fs.existsSync(filePath)) {
        errors.push(`File not found: ${config.file}`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let matchCount = 0;

    // Add Icon import if needed
    if (config.addImport && !content.includes("Icon")) {
        const uiImportMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]@\/Components\/UI['"]/);
        if (uiImportMatch) {
            const existingImports = uiImportMatch[1];
            if (!existingImports.includes('Icon')) {
                content = content.replace(uiImportMatch[0], uiImportMatch[0].replace(uiImportMatch[1], existingImports + ', Icon'));
                modified = true;
            }
        } else {
            const lastImportIdx = content.lastIndexOf("import ");
            if (lastImportIdx >= 0) {
                const lineEnd = content.indexOf('\n', lastImportIdx);
                content = content.slice(0, lineEnd + 1) + "import { Icon } from '@/Components/UI';\n" + content.slice(lineEnd + 1);
                modified = true;
            }
        }
    }

    for (const [search, replace] of config.replacements) {
        if (content.includes(search)) {
            content = content.replace(search, replace);
            modified = true;
            matchCount++;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content);
        processed++;
        console.log(`✅ ${config.file} (${matchCount} replacements)`);
    } else {
        console.log(`⚠️ No changes: ${config.file}`);
    }
}

console.log(`\nProcessed: ${processed}/${filesToProcess.length}`);
if (errors.length > 0) {
    console.log('Errors:', errors.join(', '));
}
