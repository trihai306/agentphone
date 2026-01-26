<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DeviceActivityLogResource\Pages;
use App\Models\DeviceActivityLog;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class DeviceActivityLogResource extends Resource
{
    protected static ?string $model = DeviceActivityLog::class;

    protected static ?string $navigationIcon = 'heroicon-o-clock';

    protected static ?string $navigationGroup = 'Dashboard';

    protected static ?string $navigationLabel = 'Log Thiết Bị';

    protected static ?string $modelLabel = 'Log Thiết Bị';

    protected static ?string $pluralModelLabel = 'Log Thiết Bị';

    protected static ?int $navigationSort = 7;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('device_id')
                    ->label('Thiết bị')
                    ->relationship('device', 'name')
                    ->searchable()
                    ->preload(),
                Forms\Components\TextInput::make('action')
                    ->label('Hành động'),
                Forms\Components\Textarea::make('details')
                    ->label('Chi tiết')
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('device.name')
                    ->label('Thiết bị')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('action')
                    ->label('Hành động')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'online' => 'success',
                        'offline' => 'gray',
                        'connected' => 'info',
                        'disconnected' => 'warning',
                        'error' => 'danger',
                        default => 'primary',
                    }),
                Tables\Columns\TextColumn::make('details')
                    ->label('Chi tiết')
                    ->limit(50),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Thời gian')
                    ->dateTime('d/m/Y H:i:s')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('device_id')
                    ->label('Thiết bị')
                    ->relationship('device', 'name')
                    ->searchable()
                    ->preload(),
                Tables\Filters\SelectFilter::make('action')
                    ->label('Hành động')
                    ->options([
                        'online' => 'Online',
                        'offline' => 'Offline',
                        'connected' => 'Connected',
                        'disconnected' => 'Disconnected',
                        'error' => 'Error',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
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

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDeviceActivityLogs::route('/'),
            'create' => Pages\CreateDeviceActivityLog::route('/create'),
            'edit' => Pages\EditDeviceActivityLog::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
