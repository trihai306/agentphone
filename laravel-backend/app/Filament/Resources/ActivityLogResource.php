<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ActivityLogResource\Pages;
use App\Models\ActivityLog;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ActivityLogResource extends Resource
{
    protected static ?string $model = ActivityLog::class;

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-list';

    protected static ?string $navigationLabel = 'Nhật Ký Hoạt Động';

    protected static ?string $navigationGroup = '⚙️ Hệ Thống';

    protected static ?int $navigationSort = 10;

    protected static ?string $modelLabel = 'Nhật ký';

    protected static ?string $pluralModelLabel = 'Nhật ký hoạt động';

    public static function form(Form $form): Form
    {
        return $form->schema([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Thời gian')
                    ->dateTime('d/m/Y H:i:s')
                    ->sortable(),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('Người dùng')
                    ->searchable()
                    ->sortable()
                    ->icon('heroicon-m-user')
                    ->default('Hệ thống'),

                Tables\Columns\TextColumn::make('action')
                    ->label('Hành động')
                    ->badge()
                    ->formatStateUsing(fn(ActivityLog $record): string => $record->action_label)
                    ->color(fn(ActivityLog $record): string => $record->action_color),

                Tables\Columns\TextColumn::make('model_name')
                    ->label('Đối tượng')
                    ->badge()
                    ->color('gray'),

                Tables\Columns\TextColumn::make('description')
                    ->label('Mô tả')
                    ->searchable()
                    ->wrap()
                    ->limit(50),

                Tables\Columns\TextColumn::make('ip_address')
                    ->label('IP')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('action')
                    ->label('Hành động')
                    ->options([
                        ActivityLog::ACTION_CREATE => 'Tạo mới',
                        ActivityLog::ACTION_UPDATE => 'Cập nhật',
                        ActivityLog::ACTION_DELETE => 'Xóa',
                        ActivityLog::ACTION_LOGIN => 'Đăng nhập',
                        ActivityLog::ACTION_LOGOUT => 'Đăng xuất',
                        ActivityLog::ACTION_APPROVE => 'Phê duyệt',
                        ActivityLog::ACTION_REJECT => 'Từ chối',
                    ]),

                Tables\Filters\SelectFilter::make('user_id')
                    ->label('Người dùng')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload(),

                Tables\Filters\SelectFilter::make('period')
                    ->label('Thời gian')
                    ->options([
                        'today' => 'Hôm nay',
                        'week' => 'Tuần này',
                        'month' => 'Tháng này',
                        'quarter' => 'Quý này',
                    ])
                    ->query(function ($query, array $data) {
                        $value = $data['value'] ?? null;
                        if (!$value)
                            return $query;

                        return match ($value) {
                            'today' => $query->whereDate('created_at', today()),
                            'week' => $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]),
                            'month' => $query->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()]),
                            'quarter' => $query->whereBetween('created_at', [now()->startOfQuarter(), now()->endOfQuarter()]),
                            default => $query,
                        };
                    }),

                Tables\Filters\Filter::make('created_at')
                    ->form([
                        Forms\Components\DatePicker::make('from')->label('Từ ngày'),
                        Forms\Components\DatePicker::make('until')->label('Đến ngày'),
                    ])
                    ->query(function ($query, array $data) {
                        return $query
                            ->when($data['from'], fn($q, $date) => $q->whereDate('created_at', '>=', $date))
                            ->when($data['until'], fn($q, $date) => $q->whereDate('created_at', '<=', $date));
                    }),
            ])
            ->headerActions([
                Tables\Actions\Action::make('clearOldLogs')
                    ->label('Dọn dẹp logs cũ')
                    ->icon('heroicon-o-trash')
                    ->color('danger')
                    ->form([
                        Forms\Components\Select::make('period')
                            ->label('Xóa logs cũ hơn')
                            ->options([
                                'week' => '1 tuần trước',
                                'month' => '1 tháng trước',
                                'quarter' => '3 tháng trước',
                                'half_year' => '6 tháng trước',
                                'year' => '1 năm trước',
                            ])
                            ->required(),
                    ])
                    ->requiresConfirmation()
                    ->modalHeading('Xóa logs cũ')
                    ->modalDescription('Hành động này không thể hoàn tác. Bạn có chắc chắn?')
                    ->action(function (array $data) {
                        $cutoffDate = match ($data['period']) {
                            'week' => now()->subWeek(),
                            'month' => now()->subMonth(),
                            'quarter' => now()->subQuarter(),
                            'half_year' => now()->subMonths(6),
                            'year' => now()->subYear(),
                            default => now()->subMonth(),
                        };

                        $deleted = ActivityLog::where('created_at', '<', $cutoffDate)->delete();

                        \Filament\Notifications\Notification::make()
                            ->success()
                            ->title('Đã xóa logs cũ')
                            ->body("Đã xóa {$deleted} logs cũ hơn " . $cutoffDate->format('d/m/Y'))
                            ->send();
                    }),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()
                    ->modalContent(fn(ActivityLog $record) => view('filament.resources.activity-log.view', ['record' => $record])),

                Tables\Actions\Action::make('restore')
                    ->label('Khôi phục')
                    ->icon('heroicon-o-arrow-uturn-left')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->modalHeading('Khôi phục dữ liệu gốc')
                    ->modalDescription(fn(ActivityLog $record) => "Bạn có chắc muốn khôi phục {$record->model_name} về giá trị cũ?")
                    ->modalSubmitActionLabel('Khôi phục')
                    ->visible(fn(ActivityLog $record): bool => $record->canRestore())
                    ->action(function (ActivityLog $record) {
                        $result = $record->restoreOldValues();

                        if ($result) {
                            \Filament\Notifications\Notification::make()
                                ->success()
                                ->title('Đã khôi phục thành công')
                                ->body("Dữ liệu đã được khôi phục về giá trị gốc.")
                                ->send();
                        } else {
                            \Filament\Notifications\Notification::make()
                                ->danger()
                                ->title('Không thể khôi phục')
                                ->body("Đối tượng không tồn tại hoặc đã bị xóa.")
                                ->send();
                        }
                    }),
            ])
            ->bulkActions([])
            ->defaultSort('created_at', 'desc')
            ->poll('30s');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListActivityLogs::route('/'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit($record): bool
    {
        return false;
    }

    public static function canDelete($record): bool
    {
        return false;
    }
}
