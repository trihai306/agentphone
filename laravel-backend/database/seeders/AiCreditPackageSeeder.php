<?php

namespace Database\Seeders;

use App\Models\AiCreditPackage;
use Illuminate\Database\Seeder;

class AiCreditPackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $packages = [
            [
                'name' => 'Gói Basic',
                'description' => 'Phù hợp cho người dùng mới bắt đầu khám phá AI',
                'credits' => 100,
                'price' => 50000,
                'original_price' => null,
                'currency' => 'VND',
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 1,
                'badge' => 'Starter',
                'badge_color' => 'blue',
            ],
            [
                'name' => 'Gói Pro',
                'description' => 'Dành cho người dùng thường xuyên với giá tốt hơn',
                'credits' => 500,
                'price' => 200000,
                'original_price' => 250000,
                'currency' => 'VND',
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 2,
                'badge' => 'Best Value',
                'badge_color' => 'green',
            ],
            [
                'name' => 'Gói Enterprise',
                'description' => 'Gói lớn nhất với mức giá tốt nhất cho nhu cầu cao',
                'credits' => 2000,
                'price' => 600000,
                'original_price' => 1000000,
                'currency' => 'VND',
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 3,
                'badge' => 'Most Popular',
                'badge_color' => 'purple',
            ],
        ];

        foreach ($packages as $package) {
            AiCreditPackage::updateOrCreate(
                ['name' => $package['name']],
                $package
            );
        }

        $this->command->info('AI Credit Packages seeded successfully!');
    }
}
