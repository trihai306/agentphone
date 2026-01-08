<?php

namespace Database\Seeders;

use App\Models\ServicePackage;
use Illuminate\Database\Seeder;

class ServicePackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing packages
        ServicePackage::query()->delete();

        $packages = [
            // 🆓 FREE TRIAL - Starter Package
            [
                'name' => '🚀 Starter',
                'description' => 'Trải nghiệm miễn phí - Hoàn hảo để bắt đầu với automation',
                'type' => ServicePackage::TYPE_SUBSCRIPTION,
                'price' => 0,
                'original_price' => 50000,
                'currency' => 'VND',
                'duration_days' => 7,
                'credits' => 200,
                'features' => [
                    '✨ Miễn phí 7 ngày dùng thử',
                    '📱 Tối đa 2 thiết bị Android',
                    '⚡ 200 credits automation',
                    '📋 3 workflow cơ bản',
                    '🎯 Templates sẵn có',
                    '💬 Hỗ trợ cộng đồng',
                    '📊 Thống kê cơ bản',
                ],
                'limits' => [
                    'max_workflows' => 3,
                    'max_executions_per_day' => 10,
                    'max_recording_duration' => 60, // seconds
                ],
                'max_devices' => 2,
                'priority' => 0,
                'is_featured' => false,
                'is_active' => true,
                'is_trial' => true,
                'trial_days' => 7,
                'badge' => 'MIỄN PHÍ',
                'badge_color' => '#3B82F6',
                'icon' => '🆓',
            ],

            // 💎 BASIC - Entry Level
            [
                'name' => '💎 Basic',
                'description' => 'Gói cơ bản - Phù hợp cho người dùng cá nhân và freelancer',
                'type' => ServicePackage::TYPE_SUBSCRIPTION,
                'price' => 99000,
                'original_price' => 149000,
                'currency' => 'VND',
                'duration_days' => 30,
                'credits' => 1500,
                'features' => [
                    '📱 Tối đa 5 thiết bị',
                    '⚡ 1,500 automation credits/tháng',
                    '📋 15 workflows đồng thời',
                    '🎨 50+ workflow templates',
                    '📧 Hỗ trợ qua Email',
                    '📊 Analytics cơ bản',
                    '☁️ Cloud storage 1GB',
                    '🔄 Auto-sync workflows',
                ],
                'limits' => [
                    'max_workflows' => 15,
                    'max_executions_per_day' => 150,
                    'max_recording_duration' => 300,
                    'cloud_storage_gb' => 1,
                ],
                'max_devices' => 5,
                'priority' => 1,
                'is_featured' => false,
                'is_active' => true,
                'badge' => 'TIẾT KIỆM 33%',
                'badge_color' => '#10B981',
                'icon' => '💎',
            ],

            // 🔥 PROFESSIONAL - Most Popular
            [
                'name' => '🔥 Professional',
                'description' => 'Lựa chọn phổ biến nhất - Dành cho chuyên gia và doanh nghiệp nhỏ',
                'type' => ServicePackage::TYPE_SUBSCRIPTION,
                'price' => 299000,
                'original_price' => 499000,
                'currency' => 'VND',
                'duration_days' => 30,
                'credits' => 7500,
                'features' => [
                    '📱 Tối đa 25 thiết bị',
                    '⚡ 7,500 automation credits/tháng',
                    '📋 Unlimited workflows',
                    '🎨 200+ workflow templates Pro',
                    '🎯 AI-powered automation',
                    '💬 Hỗ trợ ưu tiên (Email + Chat)',
                    '📊 Analytics nâng cao & Reports',
                    '🔌 API access đầy đủ',
                    '🔗 Custom integrations',
                    '☁️ Cloud storage 10GB',
                    '🔄 Real-time sync',
                    '🎬 Screen recording không giới hạn',
                ],
                'limits' => [
                    'max_workflows' => null, // unlimited
                    'max_executions_per_day' => 750,
                    'max_recording_duration' => null, // unlimited
                    'cloud_storage_gb' => 10,
                    'api_rate_limit' => 10000,
                ],
                'max_devices' => 25,
                'priority' => 2,
                'is_featured' => true,
                'is_active' => true,
                'badge' => 'PHỔ BIẾN NHẤT',
                'badge_color' => '#EF4444',
                'icon' => '🔥',
            ],

            // 💼 BUSINESS - For Teams
            [
                'name' => '💼 Business',
                'description' => 'Gói doanh nghiệp - Hoàn hảo cho team và công ty vừa',
                'type' => ServicePackage::TYPE_SUBSCRIPTION,
                'price' => 599000,
                'original_price' => 899000,
                'currency' => 'VND',
                'duration_days' => 30,
                'credits' => 20000,
                'features' => [
                    '📱 Tối đa 50 thiết bị',
                    '⚡ 20,000 automation credits/tháng',
                    '📋 Unlimited workflows',
                    '🎨 Premium templates library',
                    '🤖 Advanced AI features',
                    '👥 Team collaboration tools',
                    '📊 Custom analytics dashboards',
                    '🔌 Full API + Webhooks',
                    '🎯 Multi-user management',
                    '☁️ Cloud storage 50GB',
                    '🔒 Advanced security features',
                    '📞 Phone + Chat support',
                    '🎓 Training sessions',
                ],
                'limits' => [
                    'max_workflows' => null,
                    'max_executions_per_day' => 2000,
                    'max_recording_duration' => null,
                    'cloud_storage_gb' => 50,
                    'api_rate_limit' => 50000,
                    'max_team_members' => 10,
                ],
                'max_devices' => 50,
                'priority' => 3,
                'is_featured' => false,
                'is_active' => true,
                'badge' => 'CHO TEAM',
                'badge_color' => '#8B5CF6',
                'icon' => '💼',
            ],

            // 🏆 ENTERPRISE - Ultimate
            [
                'name' => '🏆 Enterprise',
                'description' => 'Gói cao cấp - Giải pháp toàn diện cho tổ chức lớn',
                'type' => ServicePackage::TYPE_SUBSCRIPTION,
                'price' => 1499000,
                'original_price' => 2499000,
                'currency' => 'VND',
                'duration_days' => 30,
                'credits' => 100000,
                'features' => [
                    '📱 Unlimited thiết bị',
                    '⚡ 100,000 automation credits/tháng',
                    '📋 Unlimited workflows',
                    '🎨 Enterprise templates + Custom',
                    '🤖 AI & Machine Learning features',
                    '👥 Unlimited team members',
                    '📊 Enterprise analytics & BI',
                    '🔌 API + Webhooks + SDK',
                    '🎯 Advanced automation engine',
                    '☁️ Cloud storage 500GB',
                    '🔒 Enterprise security & SSO',
                    '📞 24/7 Priority support',
                    '👨‍💼 Dedicated account manager',
                    '📋 SLA 99.9% uptime guarantee',
                    '🎓 Custom training program',
                    '🛠️ Custom development support',
                ],
                'limits' => [
                    'max_workflows' => null,
                    'max_executions_per_day' => null,
                    'max_recording_duration' => null,
                    'cloud_storage_gb' => 500,
                    'api_rate_limit' => null, // unlimited
                    'max_team_members' => null,
                ],
                'max_devices' => null, // unlimited
                'priority' => 4,
                'is_featured' => false,
                'is_active' => true,
                'badge' => 'GIÁ TRỊ TốT NHẤT',
                'badge_color' => '#F59E0B',
                'icon' => '🏆',
            ],

            // 🎁 ANNUAL PROFESSIONAL - Best Deal
            [
                'name' => '🎁 Professional Annual',
                'description' => 'Tiết kiệm 25% khi thanh toán theo năm - Ưu đãi đặc biệt',
                'type' => ServicePackage::TYPE_SUBSCRIPTION,
                'price' => 2699000, // ~225k/month
                'original_price' => 3588000, // 299k * 12
                'currency' => 'VND',
                'duration_days' => 365,
                'credits' => 90000, // 7500 * 12
                'features' => [
                    '💰 Tiết kiệm 889,000đ (25%)',
                    '📅 Thanh toán một lần cả năm',
                    '🎯 Tất cả tính năng Pro',
                    '📱 Tối đa 25 thiết bị',
                    '⚡ 90,000 credits/năm',
                    '🎨 Bonus 10GB cloud storage',
                    '🎁 Ưu tiên features mới',
                    '📊 Annual analytics report',
                    '🎓 Free yearly consultation',
                    '💝 Birthday bonus credits',
                ],
                'limits' => [
                    'max_workflows' => null,
                    'max_executions_per_day' => 750,
                    'max_recording_duration' => null,
                    'cloud_storage_gb' => 20, // 10 + 10 bonus
                    'api_rate_limit' => 10000,
                ],
                'max_devices' => 25,
                'priority' => 2,
                'is_featured' => true,
                'is_active' => true,
                'badge' => 'TIẾT KIỆM 25%',
                'badge_color' => '#10B981',
                'icon' => '🎁',
            ],
        ];

        foreach ($packages as $packageData) {
            ServicePackage::create($packageData);
        }

        $this->command->info('✅ Service packages seeded successfully!');
        $this->command->info('📦 Created ' . count($packages) . ' packages');
    }
}
