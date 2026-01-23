<?php

namespace App\Filament\Pages;

use App\Models\Transaction;
use App\Models\User;
use App\Models\UserServicePackage;
use Filament\Forms;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Collection;

class ReportBuilder extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-document-chart-bar';

    protected static string $view = 'filament.pages.report-builder';

    protected static ?string $slug = 'report-builder';

    protected static ?string $navigationLabel = 'Tạo Báo Cáo';

    protected static ?string $title = 'Công Cụ Tạo Báo Cáo';

    protected static ?string $navigationGroup = '📊 Dashboard';

    protected static ?int $navigationSort = 5;

    public ?string $reportType = 'revenue';
    public ?string $dateFrom = null;
    public ?string $dateTo = null;
    public ?array $reportData = null;

    public function mount(): void
    {
        $this->dateFrom = now()->startOfMonth()->format('Y-m-d');
        $this->dateTo = now()->format('Y-m-d');
    }

    public function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Forms\Components\Grid::make(4)
                    ->schema([
                        Forms\Components\Select::make('reportType')
                            ->label('Loại Báo Cáo')
                            ->options([
                                'revenue' => '💰 Doanh Thu',
                                'users' => '👥 Người Dùng',
                                'transactions' => '💳 Giao Dịch',
                                'orders' => '🛒 Đơn Hàng',
                            ])
                            ->required()
                            ->native(false),

                        Forms\Components\DatePicker::make('dateFrom')
                            ->label('Từ Ngày')
                            ->required(),

                        Forms\Components\DatePicker::make('dateTo')
                            ->label('Đến Ngày')
                            ->required(),

                        Forms\Components\Actions::make([
                            Forms\Components\Actions\Action::make('generate')
                                ->label('Tạo Báo Cáo')
                                ->action('generateReport')
                                ->color('primary')
                                ->icon('heroicon-m-document-arrow-down'),
                        ])->verticallyAlignEnd(),
                    ]),
            ]);
    }

    public function generateReport(): void
    {
        $this->reportData = match ($this->reportType) {
            'revenue' => $this->generateRevenueReport(),
            'users' => $this->generateUsersReport(),
            'transactions' => $this->generateTransactionsReport(),
            'orders' => $this->generateOrdersReport(),
            default => null,
        };

        Notification::make()
            ->title('Đã tạo báo cáo!')
            ->success()
            ->send();
    }

    protected function generateRevenueReport(): array
    {
        $orders = UserServicePackage::paid()
            ->whereBetween('created_at', [$this->dateFrom, $this->dateTo . ' 23:59:59'])
            ->get();

        return [
            'title' => 'Báo Cáo Doanh Thu',
            'summary' => [
                ['label' => 'Tổng doanh thu', 'value' => number_format($orders->sum('price_paid'), 0, ',', '.') . ' ₫'],
                ['label' => 'Số đơn hàng', 'value' => $orders->count()],
                ['label' => 'Đơn hàng trung bình', 'value' => number_format($orders->avg('price_paid'), 0, ',', '.') . ' ₫'],
            ],
            'type' => 'revenue',
        ];
    }

    protected function generateUsersReport(): array
    {
        $users = User::whereBetween('created_at', [$this->dateFrom, $this->dateTo . ' 23:59:59'])->get();

        return [
            'title' => 'Báo Cáo Người Dùng',
            'summary' => [
                ['label' => 'Người dùng mới', 'value' => $users->count()],
                ['label' => 'Đã xác thực', 'value' => $users->whereNotNull('email_verified_at')->count()],
                ['label' => 'Chưa xác thực', 'value' => $users->whereNull('email_verified_at')->count()],
            ],
            'type' => 'users',
        ];
    }

    protected function generateTransactionsReport(): array
    {
        $transactions = Transaction::whereBetween('created_at', [$this->dateFrom, $this->dateTo . ' 23:59:59'])->get();

        return [
            'title' => 'Báo Cáo Giao Dịch',
            'summary' => [
                ['label' => 'Tổng giao dịch', 'value' => $transactions->count()],
                ['label' => 'Nạp tiền', 'value' => $transactions->where('type', 'deposit')->count()],
                ['label' => 'Rút tiền', 'value' => $transactions->where('type', 'withdrawal')->count()],
                ['label' => 'Tổng nạp', 'value' => number_format($transactions->where('type', 'deposit')->sum('amount'), 0, ',', '.') . ' ₫'],
            ],
            'type' => 'transactions',
        ];
    }

    protected function generateOrdersReport(): array
    {
        $orders = UserServicePackage::whereBetween('created_at', [$this->dateFrom, $this->dateTo . ' 23:59:59'])->get();

        return [
            'title' => 'Báo Cáo Đơn Hàng',
            'summary' => [
                ['label' => 'Tổng đơn hàng', 'value' => $orders->count()],
                ['label' => 'Đang active', 'value' => $orders->where('status', 'active')->count()],
                ['label' => 'Chờ xử lý', 'value' => $orders->where('status', 'pending')->count()],
                ['label' => 'Đã hủy', 'value' => $orders->where('status', 'cancelled')->count()],
            ],
            'type' => 'orders',
        ];
    }
}
