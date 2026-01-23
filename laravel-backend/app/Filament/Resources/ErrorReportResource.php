<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ErrorReportResource\Pages;
use App\Models\ErrorReport;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ErrorReportResource extends Resource
{
    protected static ?string $model = ErrorReport::class;

    protected static ?string $navigationIcon = 'heroicon-o-bug-ant';

    protected static ?string $navigationLabel = 'Báo cáo lỗi';

    protected static ?string $modelLabel = 'Báo cáo lỗi';

    protected static ?string $pluralModelLabel = 'Báo cáo lỗi';

    protected static ?string $navigationGroup = 'Hệ Thống';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin báo cáo')
                    ->description('Chi tiết về báo cáo lỗi từ người dùng')
                    ->schema([
                        Forms\Components\Grid::make(2)
                            ->schema([
                                Forms\Components\Select::make('user_id')
                                    ->label('Người gửi')
                                    ->relationship('user', 'name')
                                    ->disabled()
                                    ->dehydrated(false),

                                Forms\Components\TextInput::make('title')
                                    ->label('Tiêu đề')
                                    ->required()
                                    ->maxLength(255)
                                    ->disabled(),
                            ]),

                        Forms\Components\Textarea::make('description')
                            ->label('Mô tả chi tiết')
                            ->required()
                            ->rows(5)
                            ->disabled(),

                        Forms\Components\Grid::make(3)
                            ->schema([
                                Forms\Components\Select::make('error_type')
                                    ->label('Loại lỗi')
                                    ->options(ErrorReport::TYPES)
                                    ->disabled(),

                                Forms\Components\Select::make('severity')
                                    ->label('Mức độ')
                                    ->options(ErrorReport::SEVERITIES)
                                    ->disabled(),

                                Forms\Components\TextInput::make('page_url')
                                    ->label('URL trang')
                                    ->disabled(),
                            ]),

                        Forms\Components\KeyValue::make('device_info')
                            ->label('Thông tin thiết bị')
                            ->disabled()
                            ->columnSpanFull(),
                    ]),

                Forms\Components\Section::make('Ảnh chụp màn hình')
                    ->schema([
                        Forms\Components\Repeater::make('screenshots')
                            ->label('')
                            ->simple(
                                Forms\Components\ViewField::make('screenshot')
                                    ->view('filament.components.screenshot-preview')
                            )
                            ->disabled()
                            ->defaultItems(0),
                    ])
                    ->collapsed()
                    ->collapsible(),

                Forms\Components\Section::make('Quản lý')
                    ->description('Cập nhật trạng thái và ghi chú')
                    ->schema([
                        Forms\Components\Grid::make(2)
                            ->schema([
                                Forms\Components\Select::make('status')
                                    ->label('Trạng thái')
                                    ->options(ErrorReport::STATUSES)
                                    ->required()
                                    ->native(false),

                                Forms\Components\Select::make('assigned_to')
                                    ->label('Phân công cho')
                                    ->options(fn() => User::role(['super_admin', 'admin'])->pluck('name', 'id'))
                                    ->searchable()
                                    ->nullable(),
                            ]),

                        Forms\Components\Textarea::make('admin_notes')
                            ->label('Ghi chú của Admin')
                            ->rows(3)
                            ->placeholder('Thêm ghi chú nội bộ về cách xử lý lỗi này...'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('#')
                    ->sortable(),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('Người gửi')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('title')
                    ->label('Tiêu đề')
                    ->searchable()
                    ->limit(40)
                    ->tooltip(fn($record) => $record->title),

                Tables\Columns\TextColumn::make('error_type')
                    ->label('Loại')
                    ->badge()
                    ->formatStateUsing(fn(string $state) => ErrorReport::TYPES[$state] ?? $state)
                    ->color(fn(string $state) => match ($state) {
                        'bug' => 'danger',
                        'ui_issue' => 'warning',
                        'performance' => 'info',
                        'feature_request' => 'success',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('severity')
                    ->label('Mức độ')
                    ->badge()
                    ->formatStateUsing(fn(string $state) => ErrorReport::SEVERITIES[$state] ?? $state)
                    ->color(fn(ErrorReport $record) => $record->getSeverityBadgeColor()),

                Tables\Columns\TextColumn::make('status')
                    ->label('Trạng thái')
                    ->badge()
                    ->formatStateUsing(fn(string $state) => ErrorReport::STATUSES[$state] ?? $state)
                    ->color(fn(ErrorReport $record) => $record->getStatusBadgeColor()),

                Tables\Columns\TextColumn::make('assignedAdmin.name')
                    ->label('Phân công')
                    ->placeholder('Chưa phân công')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('responses_count')
                    ->label('Phản hồi')
                    ->counts('responses')
                    ->badge()
                    ->color('info'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày gửi')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Trạng thái')
                    ->options(ErrorReport::STATUSES),

                Tables\Filters\SelectFilter::make('severity')
                    ->label('Mức độ')
                    ->options(ErrorReport::SEVERITIES),

                Tables\Filters\SelectFilter::make('error_type')
                    ->label('Loại lỗi')
                    ->options(ErrorReport::TYPES),

                Tables\Filters\SelectFilter::make('assigned_to')
                    ->label('Phân công')
                    ->options(fn() => User::role(['super_admin', 'admin'])->pluck('name', 'id'))
                    ->searchable(),
            ])
            ->actions([
                Tables\Actions\ActionGroup::make([
                    Tables\Actions\ViewAction::make(),
                    Tables\Actions\EditAction::make(),

                    Tables\Actions\Action::make('mark_reviewing')
                        ->label('Đang xem xét')
                        ->icon('heroicon-o-eye')
                        ->color('info')
                        ->requiresConfirmation()
                        ->action(fn(ErrorReport $record) => $record->update(['status' => ErrorReport::STATUS_REVIEWING]))
                        ->visible(fn(ErrorReport $record) => $record->status === ErrorReport::STATUS_PENDING),

                    Tables\Actions\Action::make('mark_in_progress')
                        ->label('Đang xử lý')
                        ->icon('heroicon-o-arrow-path')
                        ->color('primary')
                        ->requiresConfirmation()
                        ->action(fn(ErrorReport $record) => $record->update(['status' => ErrorReport::STATUS_IN_PROGRESS]))
                        ->visible(fn(ErrorReport $record) => in_array($record->status, [ErrorReport::STATUS_PENDING, ErrorReport::STATUS_REVIEWING])),

                    Tables\Actions\Action::make('mark_resolved')
                        ->label('Đã giải quyết')
                        ->icon('heroicon-o-check-circle')
                        ->color('success')
                        ->requiresConfirmation()
                        ->action(function (ErrorReport $record) {
                            $record->markAsResolved();
                            Notification::make()
                                ->title('Đã đánh dấu giải quyết')
                                ->success()
                                ->send();
                        })
                        ->visible(fn(ErrorReport $record) => !$record->isResolved()),

                    Tables\Actions\Action::make('close')
                        ->label('Đóng')
                        ->icon('heroicon-o-x-circle')
                        ->color('gray')
                        ->requiresConfirmation()
                        ->action(fn(ErrorReport $record) => $record->update(['status' => ErrorReport::STATUS_CLOSED]))
                        ->visible(fn(ErrorReport $record) => $record->status !== ErrorReport::STATUS_CLOSED),
                ]),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\BulkAction::make('bulk_mark_reviewing')
                        ->label('Đánh dấu đang xem xét')
                        ->icon('heroicon-o-eye')
                        ->color('info')
                        ->requiresConfirmation()
                        ->action(fn($records) => $records->each(fn($record) => $record->update(['status' => ErrorReport::STATUS_REVIEWING]))),

                    Tables\Actions\BulkAction::make('bulk_mark_resolved')
                        ->label('Đánh dấu đã giải quyết')
                        ->icon('heroicon-o-check-circle')
                        ->color('success')
                        ->requiresConfirmation()
                        ->action(fn($records) => $records->each(fn($record) => $record->markAsResolved())),

                    Tables\Actions\DeleteBulkAction::make(),
                ]),
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
            'index' => Pages\ListErrorReports::route('/'),
            'create' => Pages\CreateErrorReport::route('/create'),
            'view' => Pages\ViewErrorReport::route('/{record}'),
            'edit' => Pages\EditErrorReport::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        $pendingCount = static::getModel()::where('status', ErrorReport::STATUS_PENDING)->count();
        return $pendingCount > 0 ? (string) $pendingCount : null;
    }

    public static function getNavigationBadgeColor(): string|array|null
    {
        $criticalCount = static::getModel()::where('status', ErrorReport::STATUS_PENDING)
            ->where('severity', ErrorReport::SEVERITY_CRITICAL)
            ->count();

        return $criticalCount > 0 ? 'danger' : 'warning';
    }
}
