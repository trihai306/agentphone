/**
 * Page Metadata Configuration
 * Defines comprehensive title, icon, description, and breadcrumb for each page  
 */

export const PAGE_METADATA = {
    // Dashboard
    '/dashboard': {
        title: 'Bảng Điều Khiển',
        titleEn: 'Dashboard',
        icon: '📊',
        description: 'Tổng quan hệ thống và thống kê',
        descriptionEn: 'System overview and statistics',
        breadcrumb: [{ label: 'Bảng Điều Khiển', url: '/dashboard' }]
    },

    // Devices
    '/devices': {
        title: 'Thiết Bị',
        titleEn: 'Devices',
        icon: '📱',
        description: 'Quản lý thiết bị điện thoại',
        descriptionEn: 'Manage mobile devices',
        breadcrumb: [{ label: 'Thiết Bị', url: '/devices' }]
    },
    '/devices/create': {
        title: 'Thêm Thiết Bị',
        titleEn: 'Add Device',
        icon: '➕',
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
        icon: '⚡',
        description: 'Tự động hóa quy trình',
        descriptionEn: 'Automate workflows',
        breadcrumb: [{ label: 'Workflows', url: '/flows' }]
    },
    '/flows/create': {
        title: 'Tạo Workflow',
        titleEn: 'Create Workflow',
        icon: '✨',
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
        icon: '🎯',
        description: 'Quản lý chiến dịch marketing',
        descriptionEn: 'Manage marketing campaigns',
        breadcrumb: [{ label: 'Chiến Dịch', url: '/campaigns' }]
    },
    '/campaigns/create': {
        title: 'Tạo Chiến Dịch',
        titleEn: 'Create Campaign',
        icon: '🚀',
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
        icon: '▶️',
        description: 'Theo dõi công việc thực thi',
        descriptionEn: 'Monitor job executions',
        breadcrumb: [{ label: 'Công Việc', url: '/jobs' }]
    },

    // Data Collections
    '/data-collections': {
        title: 'Quản Lý Dữ Liệu',
        titleEn: 'Data Collections',
        icon: '📊',
        description: 'Quản lý bộ sưu tập dữ liệu',
        descriptionEn: 'Manage data collections',
        breadcrumb: [{ label: 'Dữ Liệu', url: '/data-collections' }]
    },
    '/data-collections/create': {
        title: 'Tạo Bộ Sưu Tập',
        titleEn: 'Create Collection',
        icon: '📝',
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
        icon: '✨',
        description: 'Tạo ảnh và video bằng AI',
        descriptionEn: 'Generate images and videos with AI',
        breadcrumb: [{ label: 'AI Studio', url: '/ai-studio' }]
    },
    '/ai-studio/generations': {
        title: 'Thư Viện AI',
        titleEn: 'AI Gallery',
        icon: '🖼️',
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
        icon: '🎬',
        description: 'Quản lý kịch bản tạo nội dung',
        descriptionEn: 'Manage content scenarios',
        breadcrumb: [
            { label: 'AI Studio', url: '/ai-studio' },
            { label: 'Kịch Bản', url: '/ai-studio/scenarios' }
        ]
    },

    // AI Credits
    '/ai-credits': {
        title: 'Nạp Credit AI',
        titleEn: 'AI Credits',
        icon: '💎',
        description: 'Nạp credit để sử dụng AI',
        descriptionEn: 'Top up credits for AI usage',
        breadcrumb: [{ label: 'AI Credits', url: '/ai-credits' }]
    },

    // Marketplace
    '/marketplace': {
        title: 'Marketplace',
        titleEn: 'Marketplace',
        icon: '🏪',
        description: 'Mua bán workflow và template',
        descriptionEn: 'Buy and sell workflows and templates',
        breadcrumb: [{ label: 'Marketplace', url: '/marketplace' }]
    },

    // Media
    '/media': {
        title: 'Thư Viện Media',
        titleEn: 'Media Library',
        icon: '📁',
        description: 'Quản lý file media',
        descriptionEn: 'Manage media files',
        breadcrumb: [{ label: 'Media', url: '/media' }]
    },

    // Wallet & Finance
    '/wallet': {
        title: 'Ví Tiền',
        titleEn: 'Wallet',
        icon: '💰',
        description: 'Quản lý số dư ví',
        descriptionEn: 'Manage wallet balance',
        breadcrumb: [{ label: 'Ví Tiền', url: '/wallet' }]
    },
    '/topup': {
        title: 'Nạp Tiền',
        titleEn: 'Top Up',
        icon: '➕',
        description: 'Nạp tiền vào ví',
        descriptionEn: 'Add funds to wallet',
        breadcrumb: [{ label: 'Nạp Tiền', url: '/topup' }]
    },
    '/withdrawal': {
        title: 'Rút Tiền',
        titleEn: 'Withdrawal',
        icon: '💸',
        description: 'Rút tiền từ ví',
        descriptionEn: 'Withdraw funds from wallet',
        breadcrumb: [{ label: 'Rút Tiền', url: '/withdrawal' }]
    },
    '/bank-accounts': {
        title: 'Tài Khoản Ngân Hàng',
        titleEn: 'Bank Accounts',
        icon: '🏦',
        description: 'Quản lý tài khoản ngân hàng',
        descriptionEn: 'Manage bank accounts',
        breadcrumb: [{ label: 'Tài Khoản NH', url: '/bank-accounts' }]
    },
    '/packages': {
        title: 'Gói Dịch Vụ',
        titleEn: 'Service Packages',
        icon: '📦',
        description: 'Mua gói dịch vụ',
        descriptionEn: 'Purchase service packages',
        breadcrumb: [{ label: 'Gói Dịch Vụ', url: '/packages' }]
    },

    // Notifications
    '/notifications': {
        title: 'Thông Báo',
        titleEn: 'Notifications',
        icon: '🔔',
        description: 'Xem tất cả thông báo',
        descriptionEn: 'View all notifications',
        breadcrumb: [{ label: 'Thông Báo', url: '/notifications' }]
    },

    // Error Reports
    '/error-reports': {
        title: 'Báo Lỗi',
        titleEn: 'Error Reports',
        icon: '🐛',
        description: 'Theo dõi lỗi hệ thống',
        descriptionEn: 'Monitor system errors',
        breadcrumb: [{ label: 'Báo Lỗi', url: '/error-reports' }]
    },

    // Profile
    '/profile': {
        title: 'Hồ Sơ',
        titleEn: 'Profile',
        icon: '👤',
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
        icon: '🚀',
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
