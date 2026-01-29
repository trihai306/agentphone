/**
 * Page Metadata Configuration
 * Defines comprehensive title, icon, description, and breadcrumb for each page  
 */

// SVG icon paths (same as NavLink/TabHistory for consistency)
export const ICONS = {
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
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    gallery: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    video: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    rocket: "M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z",
    target: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
    default: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
};

export const PAGE_METADATA = {
    // Dashboard
    '/dashboard': {
        title: 'Bảng Điều Khiển',
        titleEn: 'Dashboard',
        icon: 'home',
        description: 'Tổng quan hệ thống và thống kê',
        descriptionEn: 'System overview and statistics',
        breadcrumb: [{ label: 'Bảng Điều Khiển', url: '/dashboard' }]
    },

    // Devices
    '/devices': {
        title: 'Thiết Bị',
        titleEn: 'Devices',
        icon: 'device',
        description: 'Quản lý thiết bị điện thoại',
        descriptionEn: 'Manage mobile devices',
        breadcrumb: [{ label: 'Thiết Bị', url: '/devices' }]
    },
    '/devices/create': {
        title: 'Thêm Thiết Bị',
        titleEn: 'Add Device',
        icon: 'plus',
        description: 'Thêm thiết bị mới vào hệ thống',
        descriptionEn: 'Add new device to system',
        breadcrumb: [
            { label: 'Thiết Bị', url: '/devices' },
            { label: 'Thêm Mới', url: '/devices/create' }
        ]
    },

    // Workflows
    '/flows': {
        title: 'Workflows',
        titleEn: 'Workflows',
        icon: 'flow',
        description: 'Tự động hóa quy trình',
        descriptionEn: 'Automate workflows',
        breadcrumb: [{ label: 'Workflows', url: '/flows' }]
    },
    '/flows/create': {
        title: 'Tạo Workflow',
        titleEn: 'Create Workflow',
        icon: 'ai',
        description: 'Tạo workflow tự động hóa mới',
        descriptionEn: 'Create new automation workflow',
        breadcrumb: [
            { label: 'Workflows', url: '/flows' },
            { label: 'Tạo Mới', url: '/flows/create' }
        ]
    },

    // Campaigns
    '/campaigns': {
        title: 'Chiến Dịch',
        titleEn: 'Campaigns',
        icon: 'seed',
        description: 'Quản lý chiến dịch marketing',
        descriptionEn: 'Manage marketing campaigns',
        breadcrumb: [{ label: 'Chiến Dịch', url: '/campaigns' }]
    },
    '/campaigns/create': {
        title: 'Tạo Chiến Dịch',
        titleEn: 'Create Campaign',
        icon: 'rocket',
        description: 'Tạo chiến dịch marketing mới',
        descriptionEn: 'Create new marketing campaign',
        breadcrumb: [
            { label: 'Chiến Dịch', url: '/campaigns' },
            { label: 'Tạo Mới', url: '/campaigns/create' }
        ]
    },

    // Jobs
    '/jobs': {
        title: 'Công Việc',
        titleEn: 'Jobs',
        icon: 'play',
        description: 'Theo dõi công việc thực thi',
        descriptionEn: 'Monitor job executions',
        breadcrumb: [{ label: 'Công Việc', url: '/jobs' }]
    },

    // Data Collections
    '/data-collections': {
        title: 'Quản Lý Dữ Liệu',
        titleEn: 'Data Collections',
        icon: 'database',
        description: 'Quản lý bộ sưu tập dữ liệu',
        descriptionEn: 'Manage data collections',
        breadcrumb: [{ label: 'Dữ Liệu', url: '/data-collections' }]
    },
    '/data-collections/create': {
        title: 'Tạo Bộ Sưu Tập',
        titleEn: 'Create Collection',
        icon: 'plus',
        description: 'Tạo bộ sưu tập dữ liệu mới',
        descriptionEn: 'Create new data collection',
        breadcrumb: [
            { label: 'Dữ Liệu', url: '/data-collections' },
            { label: 'Tạo Mới', url: '/data-collections/create' }
        ]
    },

    // AI Studio
    '/ai-studio': {
        title: 'AI Studio',
        titleEn: 'AI Studio',
        icon: 'ai',
        description: 'Tạo ảnh và video bằng AI',
        descriptionEn: 'Generate images and videos with AI',
        breadcrumb: [{ label: 'AI Studio', url: '/ai-studio' }]
    },
    '/ai-studio/generations': {
        title: 'Thư Viện AI',
        titleEn: 'AI Gallery',
        icon: 'gallery',
        description: 'Xem lịch sử tạo nội dung AI',
        descriptionEn: 'View AI generation history',
        breadcrumb: [
            { label: 'AI Studio', url: '/ai-studio' },
            { label: 'Thư Viện', url: '/ai-studio/generations' }
        ]
    },
    '/ai-studio/scenarios': {
        title: 'Kịch Bản AI',
        titleEn: 'AI Scenarios',
        icon: 'video',
        description: 'Quản lý kịch bản tạo nội dung',
        descriptionEn: 'Manage content scenarios',
        breadcrumb: [
            { label: 'AI Studio', url: '/ai-studio' },
            { label: 'Kịch Bản', url: '/ai-studio/scenarios' }
        ]
    },

    // AI Credits
    '/ai-credits': {
        title: 'AI Credits',
        titleEn: 'AI Credits',
        icon: 'credits',
        description: 'Nạp credit để sử dụng AI',
        descriptionEn: 'Top up credits for AI usage',
        breadcrumb: [{ label: 'AI Credits', url: '/ai-credits' }]
    },

    // Marketplace
    '/marketplace': {
        title: 'Marketplace',
        titleEn: 'Marketplace',
        icon: 'shop',
        description: 'Mua bán workflow và template',
        descriptionEn: 'Buy and sell workflows and templates',
        breadcrumb: [{ label: 'Marketplace', url: '/marketplace' }]
    },

    // Media
    '/media': {
        title: 'Thư Viện Media',
        titleEn: 'Media Library',
        icon: 'media',
        description: 'Quản lý file media',
        descriptionEn: 'Manage media files',
        breadcrumb: [{ label: 'Media', url: '/media' }]
    },

    // Wallet & Finance
    '/wallet': {
        title: 'Ví Tiền',
        titleEn: 'Wallet',
        icon: 'wallet',
        description: 'Quản lý số dư ví',
        descriptionEn: 'Manage wallet balance',
        breadcrumb: [{ label: 'Ví Tiền', url: '/wallet' }]
    },
    '/topup': {
        title: 'Nạp Tiền',
        titleEn: 'Top Up',
        icon: 'plus',
        description: 'Nạp tiền vào ví',
        descriptionEn: 'Add funds to wallet',
        breadcrumb: [{ label: 'Nạp Tiền', url: '/topup' }]
    },
    '/withdraw': {
        title: 'Rút Tiền',
        titleEn: 'Withdrawal',
        icon: 'withdraw',
        description: 'Rút tiền từ ví',
        descriptionEn: 'Withdraw funds from wallet',
        breadcrumb: [{ label: 'Rút Tiền', url: '/withdraw' }]
    },
    '/bank-accounts': {
        title: 'Tài Khoản Ngân Hàng',
        titleEn: 'Bank Accounts',
        icon: 'bank',
        description: 'Quản lý tài khoản ngân hàng',
        descriptionEn: 'Manage bank accounts',
        breadcrumb: [{ label: 'Tài Khoản NH', url: '/bank-accounts' }]
    },
    '/packages': {
        title: 'Gói Dịch Vụ',
        titleEn: 'Service Packages',
        icon: 'package',
        description: 'Mua gói dịch vụ',
        descriptionEn: 'Purchase service packages',
        breadcrumb: [{ label: 'Gói Dịch Vụ', url: '/packages' }]
    },

    // Notifications
    '/notifications': {
        title: 'Thông Báo',
        titleEn: 'Notifications',
        icon: 'bell',
        description: 'Xem tất cả thông báo',
        descriptionEn: 'View all notifications',
        breadcrumb: [{ label: 'Thông Báo', url: '/notifications' }]
    },

    // Error Reports
    '/error-reports': {
        title: 'Báo Lỗi',
        titleEn: 'Error Reports',
        icon: 'bug',
        description: 'Theo dõi lỗi hệ thống',
        descriptionEn: 'Monitor system errors',
        breadcrumb: [{ label: 'Báo Lỗi', url: '/error-reports' }]
    },

    // Profile
    '/profile': {
        title: 'Hồ Sơ',
        titleEn: 'Profile',
        icon: 'user',
        description: 'Quản lý thông tin cá nhân',
        descriptionEn: 'Manage personal information',
        breadcrumb: [{ label: 'Hồ Sơ', url: '/profile' }]
    },
};

/**
 * Get page metadata by URL path
 * Supports dynamic routes by matching prefixes
 */
export function getPageMetadata(url, lang = 'vi') {
    // Remove query string
    const path = url.split('?')[0];

    // Exact match
    if (PAGE_METADATA[path]) {
        return formatMetadata(PAGE_METADATA[path], lang);
    }

    // Try to match dynamic routes (e.g., /flows/123/edit -> /flows)
    const segments = path.split('/').filter(Boolean);

    // Try parent paths
    for (let i = segments.length - 1; i >= 0; i--) {
        const testPath = '/' + segments.slice(0, i + 1).join('/');
        if (PAGE_METADATA[testPath]) {
            return formatMetadata(PAGE_METADATA[testPath], lang);
        }
    }

    // Default fallback
    return {
        title: lang === 'vi' ? 'CLICKAI' : 'CLICKAI',
        titleEn: 'CLICKAI',
        icon: 'rocket',
        description: lang === 'vi' ? 'Tự động hóa marketing' : 'Marketing automation',
        descriptionEn: 'Marketing automation',
        breadcrumb: []
    };
}

/**
 * Format metadata based on language
 */
function formatMetadata(metadata, lang) {
    return {
        ...metadata,
        title: lang === 'en' ? metadata.titleEn : metadata.title,
        description: lang === 'en' ? metadata.descriptionEn : metadata.description,
    };
}
