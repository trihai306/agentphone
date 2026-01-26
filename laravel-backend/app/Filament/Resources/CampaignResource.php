<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CampaignResource\Pages;
use App\Models\Campaign;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Notifications\Notification;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Illuminate\Database\Eloquent\Builder;

class CampaignResource extends Resource
{
    protected static ?string $model = Campaign::class;

    protected static ?string $navigationIcon = 'heroicon-o-megaphone';

    protected static ?string $navigationLabel = 'Chiến dịch';

    protected static ?string $modelLabel = 'Chiến dịch';

    protected static ?string $pluralModelLabel = 'Chiến dịch';

    protected static ?string $navigationGroup = 'Automation';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin cơ bản')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Tên chiến dịch')
                            ->required()
                            ->maxLength(255),

                        Forms\Components\Select::make('user_id')
                            ->label('Người tạo')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),

                        Forms\Components\Textarea::make('description')
                            ->label('Mô tả')
                            ->rows(2),

                        Forms\Components\Select::make('status')
                            ->label('Trạng thái')
                            ->options([
                                Campaign::STATUS_DRAFT => 'Nháp',
                                Campaign::STATUS_ACTIVE => 'Đang chạy',
                                Campaign::STATUS_PAUSED => 'Tạm dừng',
                                Campaign::STATUS_COMPLETED => 'Hoàn thành',
                            ])
                            ->default(Campaign::STATUS_DRAFT)
                            ->required(),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Cấu hình')
                    ->schema([
                        Forms\Components\Select::make('data_collection_id')
                            ->label('Bộ dữ liệu')
                            ->relationship('dataCollection', 'name')
                            ->searchable()
                            ->preload(),

                        Forms\Components\Select::make('execution_mode')
                            ->label('Chế độ thực thi')
                            ->options([
                                Campaign::MODE_SEQUENTIAL => 'Tuần tự',
                                Campaign::MODE_PARALLEL => 'Song song',
                            ])
                            ->default(Campaign::MODE_SEQUENTIAL),

                        Forms\Components\Select::make('device_strategy')
                            ->label('Chiến lược thiết bị')
                            ->options([
                                Campaign::DEVICE_ROUND_ROBIN => 'Round Robin',
                                Campaign::DEVICE_RANDOM => 'Ngẫu nhiên',
                                Campaign::DEVICE_SPECIFIC => 'Cụ thể',
                            ])
                            ->default(Campaign::DEVICE_ROUND_ROBIN),

                        Forms\Components\TextInput::make('records_per_batch')
                            ->label('Records mỗi batch')
                            ->numeric()
                            ->default(10),

                        Forms\Components\TextInput::make('repeat_per_record')
                            ->label('Lặp lại mỗi record')
                            ->numeric()
                            ->default(1),
                    ])
                    ->columns(3),

                Forms\Components\Section::make('Thống kê')
                    ->schema([
                        Forms\Components\TextInput::make('total_records')
                            ->label('Tổng records')
                            ->numeric()
                            ->disabled(),

                        Forms\Components\TextInput::make('records_processed')
                            ->label('Đã xử lý')
                            ->numeric()
                            ->disabled(),

                        Forms\Components\TextInput::make('records_success')
                            ->label('Thành công')
                            ->numeric()
                            ->disabled(),

                        Forms\Components\TextInput::make('records_failed')
                            ->label('Thất bại')
                            ->numeric()
                            ->disabled(),
                    ])
                    ->columns(4)
                    ->visibleOn('edit'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Tên')
                    ->searchable()
                    ->sortable()
                    ->limit(30),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('Người tạo')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Trạng thái')
                    ->formatStateUsing(fn(string $state): string => match ($state) {
                        Campaign::STATUS_DRAFT => 'Nháp',
                        Campaign::STATUS_ACTIVE => 'Đang chạy',
                        Campaign::STATUS_PAUSED => 'Tạm dừng',
                        Campaign::STATUS_COMPLETED => 'Hoàn thành',
                        default => $state,
                    })
                    ->colors([
                        'secondary' => Campaign::STATUS_DRAFT,
                        'success' => Campaign::STATUS_ACTIVE,
                        'warning' => Campaign::STATUS_PAUSED,
                        'info' => Campaign::STATUS_COMPLETED,
                    ]),

                Tables\Columns\TextColumn::make('workflows_count')
                    ->label('Workflows')
                    ->counts('workflows')
                    ->badge()
                    ->color('primary'),

                Tables\Columns\TextColumn::make('devices_count')
                    ->label('Thiết bị')
                    ->counts('devices')
                    ->badge()
                    ->color('info'),

                Tables\Columns\TextColumn::make('progress')
                    ->label('Tiến độ')
                    ->formatStateUsing(
                        fn($record) =>
                        "{$record->records_processed}/{$record->total_records} ({$record->progress}%)"
                    )
                    ->color(fn($record) => $record->progress >= 100 ? 'success' : 'warning'),

                Tables\Columns\TextColumn::make('records_success')
                    ->label('✓')
                    ->color('success')
                    ->alignCenter(),

                Tables\Columns\TextColumn::make('records_failed')
                    ->label('✗')
                    ->color('danger')
                    ->alignCenter(),

                Tables\Columns\TextColumn::make('last_run_at')
                    ->label('Chạy lần cuối')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->placeholder('-'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Trạng thái')
                    ->options([
                        Campaign::STATUS_DRAFT => 'Nháp',
                        Campaign::STATUS_ACTIVE => 'Đang chạy',
                        Campaign::STATUS_PAUSED => 'Tạm dừng',
                        Campaign::STATUS_COMPLETED => 'Hoàn thành',
                    ])
                    ->multiple(),

                Tables\Filters\SelectFilter::make('user_id')
                    ->label('Người tạo')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload(),

                Tables\Filters\Filter::make('has_workflows')
                    ->label('Có workflows')
                    ->query(fn(Builder $query): Builder => $query->has('workflows')),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),

                Tables\Actions\Action::make('pause')
                    ->label('Tạm dừng')
                    ->icon('heroicon-o-pause')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->visible(fn(Campaign $record): bool => $record->status === Campaign::STATUS_ACTIVE)
                    ->action(function (Campaign $record) {
                        $record->update(['status' => Campaign::STATUS_PAUSED]);
                        Notification::make()
                            ->warning()
                            ->title('Đã tạm dừng chiến dịch')
                            ->send();
                    }),

                Tables\Actions\Action::make('resume')
                    ->label('Tiếp tục')
                    ->icon('heroicon-o-play')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn(Campaign $record): bool => $record->status === Campaign::STATUS_PAUSED)
                    ->action(function (Campaign $record) {
                        $record->update(['status' => Campaign::STATUS_ACTIVE]);
                        Notification::make()
                            ->success()
                            ->title('Đã kích hoạt lại chiến dịch')
                            ->send();
                    }),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    \pxlrbt\FilamentExcel\Actions\Tables\ExportBulkAction::make()
                        ->label('Xuất Excel'),
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Thông tin chiến dịch')
                    ->schema([
                        Infolists\Components\TextEntry::make('name')
                            ->label('Tên'),
                        Infolists\Components\TextEntry::make('user.name')
                            ->label('Người tạo'),
                        Infolists\Components\TextEntry::make('status')
                            ->label('Trạng thái')
                            ->badge()
                            ->color(fn(string $state): string => match ($state) {
                                Campaign::STATUS_ACTIVE => 'success',
                                Campaign::STATUS_PAUSED => 'warning',
                                Campaign::STATUS_COMPLETED => 'info',
                                default => 'secondary',
                            }),
                        Infolists\Components\TextEntry::make('description')
                            ->label('Mô tả')
                            ->columnSpanFull(),
                    ])
                    ->columns(3),

                Infolists\Components\Section::make('Thống kê')
                    ->schema([
                        Infolists\Components\TextEntry::make('total_records')
                            ->label('Tổng records'),
                        Infolists\Components\TextEntry::make('records_processed')
                            ->label('Đã xử lý'),
                        Infolists\Components\TextEntry::make('records_success')
                            ->label('Thành công')
                            ->color('success'),
                        Infolists\Components\TextEntry::make('records_failed')
                            ->label('Thất bại')
                            ->color('danger'),
                        Infolists\Components\TextEntry::make('progress')
                            ->label('Tiến độ')
                            ->formatStateUsing(fn($state) => "{$state}%"),
                        Infolists\Components\TextEntry::make('success_rate')
                            ->label('Tỷ lệ thành công')
                            ->formatStateUsing(fn($state) => "{$state}%"),
                    ])
                    ->columns(6),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCampaigns::route('/'),
            'create' => Pages\CreateCampaign::route('/create'),
            'view' => Pages\ViewCampaign::route('/{record}'),
            'edit' => Pages\EditCampaign::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('status', Campaign::STATUS_ACTIVE)->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'success';
    }
}
