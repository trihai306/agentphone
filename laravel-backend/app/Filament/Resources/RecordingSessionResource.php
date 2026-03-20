<?php

namespace App\Filament\Resources;

use App\Filament\Resources\RecordingSessionResource\Pages;
use App\Models\RecordingSession;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class RecordingSessionResource extends Resource
{
    protected static ?string $model = RecordingSession::class;

    protected static ?string $navigationIcon = 'heroicon-o-video-camera';

    protected static ?string $navigationLabel = 'Phiên ghi hình';

    protected static ?string $modelLabel = 'Phiên ghi hình';

    protected static ?string $pluralModelLabel = 'Phiên ghi hình';

    protected static ?string $navigationGroup = 'Automation';

    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin phiên ghi')
                    ->schema([
                        Forms\Components\TextInput::make('session_id')
                            ->label('Session ID')
                            ->disabled(),
                        Forms\Components\Select::make('user_id')
                            ->label('Người dùng')
                            ->relationship('user', 'name')
                            ->disabled(),
                        Forms\Components\Select::make('device_id')
                            ->label('Thiết bị')
                            ->relationship('device', 'name')
                            ->disabled(),
                        Forms\Components\Select::make('flow_id')
                            ->label('Flow')
                            ->relationship('flow', 'name')
                            ->disabled(),
                        Forms\Components\TextInput::make('status')
                            ->label('Trạng thái')
                            ->disabled(),
                        Forms\Components\TextInput::make('target_app')
                            ->label('Ứng dụng ghi')
                            ->disabled(),
                        Forms\Components\TextInput::make('event_count')
                            ->label('Số sự kiện')
                            ->disabled(),
                        Forms\Components\TextInput::make('duration')
                            ->label('Thời lượng (ms)')
                            ->disabled(),
                        Forms\Components\DateTimePicker::make('started_at')
                            ->label('Bắt đầu')
                            ->disabled(),
                        Forms\Components\DateTimePicker::make('stopped_at')
                            ->label('Kết thúc')
                            ->disabled(),
                    ])->columns(2),
                Forms\Components\Section::make('Dữ liệu ghi nhận')
                    ->schema([
                        Forms\Components\Textarea::make('actions_display')
                            ->label('Actions (JSON)')
                            ->disabled()
                            ->rows(10)
                            ->formatStateUsing(fn ($record) => $record ? json_encode($record->actions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : ''),
                        Forms\Components\Textarea::make('metadata_display')
                            ->label('Metadata (JSON)')
                            ->disabled()
                            ->rows(5)
                            ->formatStateUsing(fn ($record) => $record ? json_encode($record->metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : ''),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),
                Tables\Columns\TextColumn::make('session_id')
                    ->label('Session ID')
                    ->searchable()
                    ->limit(20),
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Người dùng')
                    ->sortable(),
                Tables\Columns\TextColumn::make('device.name')
                    ->label('Thiết bị')
                    ->sortable(),
                Tables\Columns\TextColumn::make('flow.name')
                    ->label('Flow')
                    ->sortable()
                    ->placeholder('—'),
                Tables\Columns\BadgeColumn::make('status')
                    ->label('Trạng thái')
                    ->colors([
                        'warning' => 'started',
                        'info' => 'recording',
                        'success' => fn ($state) => in_array($state, ['completed', 'saved', 'stopped']),
                        'danger' => 'failed',
                    ]),
                Tables\Columns\TextColumn::make('event_count')
                    ->label('Sự kiện')
                    ->sortable()
                    ->placeholder('0'),
                Tables\Columns\TextColumn::make('target_app')
                    ->label('App')
                    ->searchable()
                    ->limit(25),
                Tables\Columns\TextColumn::make('duration')
                    ->label('Thời lượng')
                    ->formatStateUsing(fn ($state) => $state ? round($state / 1000, 1) . 's' : '—')
                    ->sortable(),
                Tables\Columns\TextColumn::make('started_at')
                    ->label('Bắt đầu')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Trạng thái')
                    ->options([
                        'started' => 'Bắt đầu',
                        'recording' => 'Đang ghi',
                        'stopped' => 'Đã dừng',
                        'completed' => 'Hoàn thành',
                        'saved' => 'Đã lưu',
                        'failed' => 'Thất bại',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListRecordingSessions::route('/'),
            'edit' => Pages\EditRecordingSession::route('/{record}/edit'),
        ];
    }
}
