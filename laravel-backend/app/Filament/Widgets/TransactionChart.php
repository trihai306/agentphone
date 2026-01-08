<?php

namespace App\Filament\Widgets;

use App\Models\Transaction;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class TransactionChart extends ChartWidget
{
    protected static ?string $heading = 'Biểu đồ giao dịch 7 ngày qua';

    protected static ?int $sort = 2;

    protected int | string | array $columnSpan = 'full';

    protected static ?string $maxHeight = '300px';

    protected function getData(): array
    {
        $days = collect(range(6, 0))->map(function ($daysAgo) {
            return Carbon::now()->subDays($daysAgo);
        });

        $deposits = [];
        $withdrawals = [];
        $labels = [];

        foreach ($days as $day) {
            $labels[] = $day->format('d/m');

            $deposits[] = Transaction::deposit()
                ->where('status', 'completed')
                ->whereDate('created_at', $day)
                ->sum('amount') / 1000000; // Đổi sang triệu

            $withdrawals[] = Transaction::withdrawal()
                ->where('status', 'completed')
                ->whereDate('created_at', $day)
                ->sum('amount') / 1000000;
        }

        return [
            'datasets' => [
                [
                    'label' => 'Nạp tiền (triệu ₫)',
                    'data' => $deposits,
                    'backgroundColor' => 'rgba(34, 197, 94, 0.5)',
                    'borderColor' => 'rgb(34, 197, 94)',
                    'fill' => true,
                ],
                [
                    'label' => 'Rút tiền (triệu ₫)',
                    'data' => $withdrawals,
                    'backgroundColor' => 'rgba(239, 68, 68, 0.5)',
                    'borderColor' => 'rgb(239, 68, 68)',
                    'fill' => true,
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => [
                    'display' => true,
                ],
            ],
            'scales' => [
                'y' => [
                    'beginAtZero' => true,
                ],
            ],
        ];
    }
}
