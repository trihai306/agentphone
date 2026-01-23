<?php

namespace App\Filament\Resources;

use App\Filament\Resources\WorkflowJobResource\Pages;
use App\Filament\Resources\WorkflowJobResource\RelationManagers;
use App\Models\WorkflowJob;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Notifications\Notification;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Illuminate\Database\Eloquent\Builder;

class WorkflowJobResource extends Resource
{
    protected static ?string $model = WorkflowJob::class;

    protected static ?string $navigationIcon = 'heroicon-o-queue-list';

    protected static ?string $navigationLabel = 'Công việc';

    protected static ?string $modelLabel = 'Công việc';

    protected static ?string $pluralModelLabel = 'Công việc';

    protected static ?string $navigationGroup = '⚡ Automation';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin công việc')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Tên công việc')
                            ->disabled(),

                        Forms\Components\Select::make('user_id')
                            ->label('Người tạo')
                            ->relationship('user', 'name')
                            ->disabled(),

                        Forms\Components\Select::make('flow_id')
                            ->label('Workflow')
                            ->relationship('flow', 'name')
                            ->disabled(),

                        Forms\Components\Select::make('device_id')
                            ->label('Thiết bị')
                            ->relationship('device', 'name')
                            ->disabled(),

                        Forms\Components\Select::make('campaign_id')
                            ->label('Chiến dịch')
                            ->relationship('campaign', 'name')
                            ->disabled(),

                        Forms\Components\Select::make('status')
                            ->label('Trạng thái')
                            ->options([
                                WorkflowJob::STATUS_PENDING => 'Chờ xử lý',
                                WorkflowJob::STATUS_QUEUED => 'Trong hàng đợi',
                                WorkflowJob::STATUS_RUNNING => 'Đang chạy',
                                WorkflowJob::STATUS_COMPLETED => 'Hoàn thành',
                                WorkflowJob::STATUS_FAILED => 'Thất bại',
                                WorkflowJob::STATUS_CANCELLED => 'Đã hủy',
                            ])
                            ->disabled(),
                    ])
                    ->columns(3),

                Forms\Components\Section::make('Tiến độ')
                    ->schema([
                        Forms\Components\TextInput::make('total_tasks')
                            ->label('Tổng tasks')
                            ->disabled(),

                        Forms\Components\TextInput::make('completed_tasks')
                            ->label('Hoàn thành')
                            ->disabled(),

                        Forms\Components\TextInput::make('failed_tasks')
                            ->label('Thất bại')
                            ->disabled(),

                        Forms\Components\TextInput::make('retry_count')
                            ->label('Số lần retry')
                            ->disabled(),

                        Forms\Components\TextInput::make('max_retries')
                            ->label('Max retries')
                            ->disabled(),
                    ])
                    ->columns(5),

                Forms\Components\Section::make('Thời gian')
                    ->schema([
                        Forms\Components\DateTimePicker::make('scheduled_at')
                            ->label('Lên lịch')
                            ->disabled(),

                        Forms\Components\DateTimePicker::make('started_at')
                            ->label('Bắt đầu')
                            ->disabled(),

                        Forms\Components\DateTimePicker::make('completed_at')
                            ->label('Hoàn thành')
                            ->disabled(),
                    ])
                    ->columns(3),

                Forms\Components\Section::make('Lỗi')
                    ->schema([
                        Forms\Components\Textarea::make('error_message')
                            ->label('Thông báo lỗi')
                            ->disabled()
                            ->rows(3),
                    ])
                    ->visible(fn($record) => $record?->error_message),
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
                    ->limit(25)
                    ->placeholder('(Không tên)'),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('Người tạo')
                    ->searchable()
                    ->sortable()
                    ->limit(15),

                Tables\Columns\TextColumn::make('flow.name')
                    ->label('Workflow')
                    ->searchable()
                    ->limit(20)
                    ->placeholder('-'),

                Tables\Columns\TextColumn::make('device.name')
                    ->label('Thiết bị')
                    ->searchable()
                    ->limit(15)
                    ->placeholder('-'),

                Tables\Columns\TextColumn::make('campaign.name')
                    ->label('Chiến dịch')
                    ->limit(15)
                    ->placeholder('-')
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Trạng thái')
                    ->formatStateUsing(fn(string $state): string => match ($state) {
                        WorkflowJob::STATUS_PENDING => 'Chờ xử lý',
                        WorkflowJob::STATUS_QUEUED => 'Hàng đợi',
                        WorkflowJob::STATUS_RUNNING => 'Đang chạy',
                        WorkflowJob::STATUS_COMPLETED => 'Hoàn thành',
                        WorkflowJob::STATUS_FAILED => 'Thất bại',
                        WorkflowJob::STATUS_CANCELLED => 'Đã hủy',
                        default => $state,
                    })
                    ->colors([
                        'secondary' => WorkflowJob::STATUS_PENDING,
                        'info' => WorkflowJob::STATUS_QUEUED,
                        'warning' => WorkflowJob::STATUS_RUNNING,
                        'success' => WorkflowJob::STATUS_COMPLETED,
                        'danger' => WorkflowJob::STATUS_FAILED,
                        'gray' => WorkflowJob::STATUS_CANCELLED,
                    ]),

                Tables\Columns\TextColumn::make('progress')
                    ->label('Tiến độ')
                    ->formatStateUsing(
                        fn($record) =>
                        "{$record->completed_tasks}/{$record->total_tasks} ({$record->progress}%)"
                    )
                    ->color(fn($record) => match (true) {
                        $record->progress >= 100 => 'success',
                        $record->progress > 0 => 'warning',
                        default => 'secondary',
                    }),

                Tables\Columns\TextColumn::make('failed_tasks')
                    ->label('Lỗi')
                    ->color('danger')
                    ->alignCenter()
                    ->formatStateUsing(fn($state) => $state ?: '-'),

                Tables\Columns\TextColumn::make('started_at')
                    ->label('Bắt đầu')
                    ->dateTime('d/m H:i')
                    ->sortable()
                    ->placeholder('-'),

                Tables\Columns\TextColumn::make('completed_at')
                    ->label('Hoàn thành')
                    ->dateTime('d/m H:i')
                    ->sortable()
                    ->placeholder('-'),

                Tables\Columns\TextColumn::make('error_message')
                    ->label('Lỗi')
                    ->limit(30)
                    ->color('danger')
                    ->placeholder('-')
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Trạng thái')
                    ->options([
                        WorkflowJob::STATUS_PENDING => 'Chờ xử lý',
                        WorkflowJob::STATUS_QUEUED => 'Hàng đợi',
                        WorkflowJob::STATUS_RUNNING => 'Đang chạy',
                        WorkflowJob::STATUS_COMPLETED => 'Hoàn thành',
                        WorkflowJob::STATUS_FAILED => 'Thất bại',
                        WorkflowJob::STATUS_CANCELLED => 'Đã hủy',
                    ])
                    ->multiple(),

                Tables\Filters\SelectFilter::make('user_id')
                    ->label('Người tạo')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload(),

                Tables\Filters\SelectFilter::make('device_id')
                    ->label('Thiết bị')
                    ->relationship('device', 'name')
                    ->searchable()
                    ->preload(),

                Tables\Filters\SelectFilter::make('campaign_id')
                    ->label('Chiến dịch')
                    ->relationship('campaign', 'name')
                    ->searchable()
                    ->preload(),

                Tables\Filters\Filter::make('has_errors')
                    ->label('Có lỗi')
                    ->query(fn(Builder $query): Builder => $query->whereNotNull('error_message')),

                Tables\Filters\Filter::make('created_today')
                    ->label('Hôm nay')
                    ->query(fn(Builder $query): Builder => $query->whereDate('created_at', today())),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),

                Tables\Actions\Action::make('cancel')
                    ->label('Hủy')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('Hủy công việc')
                    ->modalDescription('Bạn có chắc muốn hủy công việc này?')
                    ->visible(fn(WorkflowJob $record): bool => $record->canCancel())
                    ->action(function (WorkflowJob $record) {
                        $record->markAsCancelled();
                        Notification::make()
                            ->warning()
                            ->title('Đã hủy công việc')
                            ->send();
                    }),

                Tables\Actions\Action::make('retry')
                    ->label('Thử lại')
                    ->icon('heroicon-o-arrow-path')
                    ->color('info')
                    ->requiresConfirmation()
                    ->modalHeading('Thử lại công việc')
                    ->modalDescription('Công việc sẽ được đưa vào hàng đợi để chạy lại.')
                    ->visible(fn(WorkflowJob $record): bool => $record->canRetry())
                    ->action(function (WorkflowJob $record) {
                        $record->update([
                            'status' => WorkflowJob::STATUS_PENDING,
                            'error_message' => null,
                            'retry_count' => $record->retry_count + 1,
                            'completed_at' => null,
                        ]);
                        Notification::make()
                            ->success()
                            ->title('Đã đưa công việc vào hàng đợi')
                            ->send();
                    }),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Thông tin công việc')
                    ->schema([
                        Infolists\Components\TextEntry::make('name')
                            ->label('Tên'),
                        Infolists\Components\TextEntry::make('user.name')
                            ->label('Người tạo'),
                        Infolists\Components\TextEntry::make('flow.name')
                            ->label('Workflow'),
                        Infolists\Components\TextEntry::make('device.name')
                            ->label('Thiết bị'),
                        Infolists\Components\TextEntry::make('campaign.name')
                            ->label('Chiến dịch')
                            ->placeholder('-'),
                        Infolists\Components\TextEntry::make('status')
                            ->label('Trạng thái')
                            ->badge()
                            ->color(fn(string $state): string => match ($state) {
                                WorkflowJob::STATUS_RUNNING => 'warning',
                                WorkflowJob::STATUS_COMPLETED => 'success',
                                WorkflowJob::STATUS_FAILED => 'danger',
                                WorkflowJob::STATUS_CANCELLED => 'gray',
                                default => 'secondary',
                            }),
                    ])
                    ->columns(3),

                Infolists\Components\Section::make('Tiến độ')
                    ->schema([
                        Infolists\Components\TextEntry::make('total_tasks')
                            ->label('Tổng tasks'),
                        Infolists\Components\TextEntry::make('completed_tasks')
                            ->label('Hoàn thành')
                            ->color('success'),
                        Infolists\Components\TextEntry::make('failed_tasks')
                            ->label('Thất bại')
                            ->color('danger'),
                        Infolists\Components\TextEntry::make('progress')
                            ->label('Tiến độ')
                            ->formatStateUsing(fn($state) => "{$state}%"),
                        Infolists\Components\TextEntry::make('retry_count')
                            ->label('Số lần retry'),
                        Infolists\Components\TextEntry::make('max_retries')
                            ->label('Max retries'),
                    ])
                    ->columns(6),

                Infolists\Components\Section::make('Thời gian')
                    ->schema([
                        Infolists\Components\TextEntry::make('scheduled_at')
                            ->label('Lên lịch')
                            ->dateTime('d/m/Y H:i')
                            ->placeholder('-'),
                        Infolists\Components\TextEntry::make('started_at')
                            ->label('Bắt đầu')
                            ->dateTime('d/m/Y H:i')
                            ->placeholder('-'),
                        Infolists\Components\TextEntry::make('completed_at')
                            ->label('Hoàn thành')
                            ->dateTime('d/m/Y H:i')
                            ->placeholder('-'),
                        Infolists\Components\TextEntry::make('created_at')
                            ->label('Ngày tạo')
                            ->dateTime('d/m/Y H:i'),
                    ])
                    ->columns(4),

                Infolists\Components\Section::make('Lỗi')
                    ->schema([
                        Infolists\Components\TextEntry::make('error_message')
                            ->label('Thông báo lỗi')
                            ->color('danger')
                            ->columnSpanFull(),
                    ])
                    ->visible(fn($record) => $record->error_message),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\TasksRelationManager::class,
            RelationManagers\LogsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListWorkflowJobs::route('/'),
            'view' => Pages\ViewWorkflowJob::route('/{record}'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('status', WorkflowJob::STATUS_RUNNING)->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }
}
