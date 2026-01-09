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

    protected static ?string $navigationGroup = 'Hệ Thống';

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
            ->actions([
                Tables\Actions\ViewAction::make()
                    ->modalContent(fn(ActivityLog $record) => view('filament.resources.activity-log.view', ['record' => $record])),
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
