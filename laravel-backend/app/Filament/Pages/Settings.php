<?php

namespace App\Filament\Pages;

use App\Models\Setting;
use Filament\Forms;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;

class Settings extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';

    protected static string $view = 'filament.pages.settings';

    protected static ?string $navigationLabel = 'Cài Đặt Hệ Thống';

    protected static ?string $title = 'Cài Đặt Hệ Thống';

    protected static ?string $navigationGroup = 'Hệ Thống';

    protected static ?int $navigationSort = 11;

    public ?array $data = [];

    public function mount(): void
    {
        $settings = Setting::all()->pluck('value', 'key')->toArray();
        $this->form->fill($settings);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Tabs::make('Settings')
                    ->tabs([
                        Forms\Components\Tabs\Tab::make('Cài đặt chung')
                            ->icon('heroicon-o-home')
                            ->schema([
                                Forms\Components\TextInput::make('site_name')
                                    ->label('Tên website')
                                    ->required(),
                                Forms\Components\TextInput::make('site_description')
                                    ->label('Mô tả website'),
                                Forms\Components\FileUpload::make('site_logo')
                                    ->label('Logo')
                                    ->image()
                                    ->directory('settings'),
                                Forms\Components\Toggle::make('maintenance_mode')
                                    ->label('Chế độ bảo trì')
                                    ->helperText('Khi bật, chỉ admin có thể truy cập'),
                            ]),

                        Forms\Components\Tabs\Tab::make('Email')
                            ->icon('heroicon-o-envelope')
                            ->schema([
                                Forms\Components\TextInput::make('mail_from_address')
                                    ->label('Email gửi đi')
                                    ->email(),
                                Forms\Components\TextInput::make('mail_from_name')
                                    ->label('Tên người gửi'),
                                Forms\Components\Select::make('mail_driver')
                                    ->label('Driver')
                                    ->options([
                                        'smtp' => 'SMTP',
                                        'mailgun' => 'Mailgun',
                                        'ses' => 'Amazon SES',
                                    ]),
                            ]),

                        Forms\Components\Tabs\Tab::make('Thanh toán')
                            ->icon('heroicon-o-credit-card')
                            ->schema([
                                Forms\Components\TextInput::make('payment_gateway')
                                    ->label('Cổng thanh toán'),
                                Forms\Components\Toggle::make('payment_sandbox')
                                    ->label('Chế độ Sandbox'),
                                Forms\Components\TextInput::make('payment_api_key')
                                    ->label('API Key')
                                    ->password(),
                            ]),

                        Forms\Components\Tabs\Tab::make('Thông báo')
                            ->icon('heroicon-o-bell')
                            ->schema([
                                Forms\Components\Toggle::make('notification_email_enabled')
                                    ->label('Gửi thông báo qua Email'),
                                Forms\Components\Toggle::make('notification_push_enabled')
                                    ->label('Gửi Push Notification'),
                                Forms\Components\TextInput::make('notification_admin_email')
                                    ->label('Email nhận thông báo admin')
                                    ->email(),
                            ]),
                    ])
                    ->columnSpanFull(),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => is_array($value) ? json_encode($value) : $value,
                    'label' => $this->getSettingLabel($key),
                    'group' => $this->getSettingGroup($key),
                ]
            );
        }

        Setting::clearCache();

        Notification::make()
            ->title('Đã lưu cài đặt!')
            ->success()
            ->send();
    }

    protected function getSettingLabel(string $key): string
    {
        return match ($key) {
            'site_name' => 'Tên website',
            'site_description' => 'Mô tả website',
            'site_logo' => 'Logo',
            'maintenance_mode' => 'Chế độ bảo trì',
            default => ucwords(str_replace('_', ' ', $key)),
        };
    }

    protected function getSettingGroup(string $key): string
    {
        return match (true) {
            str_starts_with($key, 'mail_') => Setting::GROUP_EMAIL,
            str_starts_with($key, 'payment_') => Setting::GROUP_PAYMENT,
            str_starts_with($key, 'notification_') => Setting::GROUP_NOTIFICATION,
            str_starts_with($key, 'api_') => Setting::GROUP_API,
            default => Setting::GROUP_GENERAL,
        };
    }
}
