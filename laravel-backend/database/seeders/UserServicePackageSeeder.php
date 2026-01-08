<?php

namespace Database\Seeders;

use App\Models\ServicePackage;
use App\Models\User;
use App\Models\UserServicePackage;
use Illuminate\Database\Seeder;

class UserServicePackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Lấy users (trừ admin)
        $users = User::whereDoesntHave('roles', function ($q) {
            $q->where('name', 'admin');
        })->get();

        // Nếu không có user, tạo một số user mẫu
        if ($users->isEmpty()) {
            $this->command->warn('⚠️ No non-admin users found. Creating sample users...');

            for ($i = 1; $i <= 10; $i++) {
                $users->push(User::create([
                    'name' => "User Demo {$i}",
                    'email' => "user{$i}@demo.com",
                    'password' => bcrypt('password'),
                    'email_verified_at' => now(),
                ]));
            }
        }

        $packages = ServicePackage::active()->get();

        if ($packages->isEmpty()) {
            $this->command->error('❌ No service packages found. Please run ServicePackageSeeder first.');
            return;
        }

        $orders = [];

        // Tạo đơn hàng mẫu cho mỗi user
        foreach ($users as $user) {
            // Random số lượng đơn hàng cho mỗi user (1-3)
            $orderCount = rand(1, 3);

            for ($i = 0; $i < $orderCount; $i++) {
                $package = $packages->random();
                $status = $this->randomStatus();
                $paymentStatus = $this->randomPaymentStatus($status);

                $discountPercent = rand(0, 20);
                $discountAmount = ($package->price * $discountPercent) / 100;
                $pricePaid = $package->price - $discountAmount;

                $createdAt = now()->subDays(rand(0, 90));
                $activatedAt = null;
                $expiresAt = null;
                $creditsRemaining = null;
                $creditsUsed = 0;

                // Nếu đã thanh toán và active
                if ($paymentStatus === 'paid' && $status === 'active') {
                    $activatedAt = $createdAt->copy()->addHours(rand(1, 24));

                    if ($package->duration_days) {
                        $expiresAt = $activatedAt->copy()->addDays($package->duration_days);
                    }

                    if ($package->credits) {
                        $creditsUsed = rand(0, (int) ($package->credits * 0.7));
                        $creditsRemaining = $package->credits - $creditsUsed;
                    }
                }

                // Nếu đã hết hạn
                if ($status === 'expired') {
                    $activatedAt = $createdAt->copy()->addHours(rand(1, 24));
                    $expiresAt = now()->subDays(rand(1, 30));

                    if ($package->credits) {
                        $creditsUsed = rand((int) ($package->credits * 0.5), $package->credits);
                        $creditsRemaining = $package->credits - $creditsUsed;
                    }
                }

                $orders[] = [
                    'order_code' => UserServicePackage::generateOrderCode(),
                    'user_id' => $user->id,
                    'service_package_id' => $package->id,
                    'price_paid' => $pricePaid,
                    'discount_amount' => $discountAmount,
                    'discount_code' => $discountPercent > 0 ? 'DISCOUNT' . $discountPercent : null,
                    'currency' => $package->currency,
                    'status' => $status,
                    'payment_status' => $paymentStatus,
                    'payment_method' => $this->randomPaymentMethod(),
                    'activated_at' => $activatedAt,
                    'expires_at' => $expiresAt,
                    'credits_remaining' => $creditsRemaining,
                    'credits_used' => $creditsUsed,
                    'auto_renew' => rand(0, 1) === 1,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];
            }
        }

        // Insert all orders
        foreach ($orders as $order) {
            UserServicePackage::create($order);
        }

        $this->command->info('✅ User service packages seeded successfully!');
        $this->command->info('📦 Created ' . count($orders) . ' orders');

        // Statistics
        $stats = collect($orders)->groupBy('status')->map->count();
        foreach ($stats as $status => $count) {
            $this->command->info("   - {$status}: {$count}");
        }
    }

    private function randomStatus(): string
    {
        $statuses = [
            'pending' => 15,
            'active' => 50,
            'expired' => 20,
            'cancelled' => 10,
            'refunded' => 5,
        ];

        $rand = rand(1, 100);
        $cumulative = 0;

        foreach ($statuses as $status => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return $status;
            }
        }

        return 'active';
    }

    private function randomPaymentStatus(string $status): string
    {
        if ($status === 'pending') {
            return rand(0, 1) === 1 ? 'pending' : 'paid';
        }

        if ($status === 'refunded') {
            return 'refunded';
        }

        if ($status === 'cancelled') {
            return rand(0, 1) === 1 ? 'pending' : 'paid';
        }

        return 'paid';
    }

    private function randomPaymentMethod(): string
    {
        $methods = [
            'bank_transfer',
            'wallet',
            'momo',
            'vnpay',
            'credit_card',
        ];

        return $methods[array_rand($methods)];
    }
}
