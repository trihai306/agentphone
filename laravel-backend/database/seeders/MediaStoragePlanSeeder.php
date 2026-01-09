<?php

namespace Database\Seeders;

use App\Models\MediaStoragePlan;
use Illuminate\Database\Seeder;

class MediaStoragePlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free',
                'slug' => 'free',
                'description' => 'Gói miễn phí cho người dùng mới',
                'max_storage_bytes' => 1 * 1024 * 1024 * 1024, // 1GB
                'max_files' => 100,
                'max_file_size_bytes' => 10 * 1024 * 1024, // 10MB
                'price' => 0,
                'billing_period' => 'monthly',
                'features' => [
                    '1GB dung lượng lưu trữ',
                    'Tối đa 100 file',
                    'Kích thước file tối đa 10MB',
                    'Hỗ trợ ảnh và video cơ bản',
                ],
                'is_active' => true,
                'sort_order' => 1,
                'is_default' => true,
            ],
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'description' => 'Phù hợp cho người dùng cá nhân',
                'max_storage_bytes' => 10 * 1024 * 1024 * 1024, // 10GB
                'max_files' => 1000,
                'max_file_size_bytes' => 50 * 1024 * 1024, // 50MB
                'price' => 50000,
                'billing_period' => 'monthly',
                'features' => [
                    '10GB dung lượng lưu trữ',
                    'Tối đa 1,000 file',
                    'Kích thước file tối đa 50MB',
                    'Ưu tiên tốc độ tải lên',
                    'Hỗ trợ video HD',
                ],
                'is_active' => true,
                'sort_order' => 2,
                'is_default' => false,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'description' => 'Cho nhà sáng tạo nội dung chuyên nghiệp',
                'max_storage_bytes' => 50 * 1024 * 1024 * 1024, // 50GB
                'max_files' => 5000,
                'max_file_size_bytes' => 200 * 1024 * 1024, // 200MB
                'price' => 200000,
                'billing_period' => 'monthly',
                'features' => [
                    '50GB dung lượng lưu trữ',
                    'Tối đa 5,000 file',
                    'Kích thước file tối đa 200MB',
                    'Ưu tiên cao nhất',
                    'Hỗ trợ video 4K',
                    'Tự động sao lưu',
                ],
                'is_active' => true,
                'sort_order' => 3,
                'is_default' => false,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Giải pháp cho doanh nghiệp',
                'max_storage_bytes' => 100 * 1024 * 1024 * 1024, // 100GB
                'max_files' => null, // Unlimited
                'max_file_size_bytes' => 500 * 1024 * 1024, // 500MB
                'price' => 500000,
                'billing_period' => 'monthly',
                'features' => [
                    '100GB dung lượng lưu trữ',
                    'Số lượng file không giới hạn',
                    'Kích thước file tối đa 500MB',
                    'Ưu tiên tuyệt đối',
                    'Hỗ trợ mọi định dạng video',
                    'Sao lưu tự động hàng ngày',
                    'Hỗ trợ kỹ thuật 24/7',
                    'API access',
                ],
                'is_active' => true,
                'sort_order' => 4,
                'is_default' => false,
            ],
        ];

        foreach ($plans as $plan) {
            MediaStoragePlan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }
}
