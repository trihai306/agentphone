<?php

namespace App\Filament\Resources\UserResource\Widgets;

use App\Models\User;
use App\Models\UserServicePackage;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Database\Eloquent\Model;

class UserStatsWidget extends BaseWidget
{
    public ?Model $record = null;

    protected function getStats(): array
    {
        if (!$this->record instanceof User) {
            return [];
        }

        $user = $this->record;

        // Credits stats
        $creditsRemaining = UserServicePackage::where('user_id', $user->id)
            ->where('status', 'active')
            ->sum('credits_remaining');
        $creditsUsed = UserServicePackage::where('user_id', $user->id)
            ->where('status', 'active')
            ->sum('credits_used');
        $totalCredits = $creditsRemaining + $creditsUsed;
        $creditsPercent = $totalCredits > 0 ? round(($creditsUsed / $totalCredits) * 100) : 0;

        // Wallet balance
        $walletBalance = $user->wallets()->sum('balance');

        // Devices
        $devicesCount = $user->devices()->count();
        $devicesOnline = $user->devices()->where('socket_connected', true)->count();

        // Workflows
        $flowsCount = $user->flows()->count();

        // Jobs stats
        $jobsCompleted = $user->workflowJobs()->where('status', 'completed')->count();
        $jobsTotal = $user->workflowJobs()->count();
        $jobsSuccessRate = $jobsTotal > 0 ? round(($jobsCompleted / $jobsTotal) * 100) : 0;

        // AI Generations
        $aiGenerations = $user->aiGenerations()->count();

        // Storage
        $storageBytes = $user->mediaFiles()->sum('file_size');
        $storageMB = round($storageBytes / 1048576, 1);

        // Active packages
        $activePackages = UserServicePackage::where('user_id', $user->id)
            ->where('status', 'active')
            ->count();

        return [
            Stat::make('Credits còn lại', number_format($creditsRemaining))
                ->description("Đã dùng {$creditsPercent}% ({$creditsUsed}/{$totalCredits})")
                ->descriptionIcon($creditsPercent > 80 ? 'heroicon-m-exclamation-triangle' : 'heroicon-m-check-circle')
                ->color($creditsRemaining > 0 ? 'success' : 'danger'),

            Stat::make('Số dư ví', number_format($walletBalance, 0, ',', '.') . ' ₫')
                ->description('VND')
                ->color('info'),

            Stat::make('Thiết bị', $devicesCount)
                ->description("{$devicesOnline} đang online")
                ->descriptionIcon('heroicon-m-device-phone-mobile')
                ->color('primary'),

            Stat::make('Workflows', $flowsCount)
                ->description('Đã tạo')
                ->color('warning'),

            Stat::make('Jobs thành công', "{$jobsCompleted}/{$jobsTotal}")
                ->description("Tỷ lệ {$jobsSuccessRate}%")
                ->descriptionIcon($jobsSuccessRate >= 80 ? 'heroicon-m-check-circle' : 'heroicon-m-x-circle')
                ->color($jobsSuccessRate >= 80 ? 'success' : 'danger'),

            Stat::make('AI Generations', $aiGenerations)
                ->description('Tổng số lần tạo')
                ->color('info'),

            Stat::make('Dung lượng', "{$storageMB} MB")
                ->description('Đã sử dụng')
                ->color('gray'),

            Stat::make('Gói dịch vụ', $activePackages)
                ->description('Đang hoạt động')
                ->descriptionIcon($activePackages > 0 ? 'heroicon-m-check-badge' : 'heroicon-m-x-mark')
                ->color($activePackages > 0 ? 'success' : 'warning'),
        ];
    }
}
