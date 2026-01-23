<?php

namespace App\Filament\Resources;

use App\Filament\Resources\JobLogResource\Pages;
use App\Models\JobLog;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class JobLogResource extends Resource
{
    protected static ?string $model = JobLog::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $navigationGroup = 'Automation';

    protected static ?string $navigationLabel = 'Job Logs';

    protected static ?string $modelLabel = 'Job Log';

    protected static ?string $pluralModelLabel = 'Job Logs';

    protected static ?int $navigationSort = 4;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('workflow_job_id')
                    ->label('Job')
                    ->relationship('workflowJob', 'id')
                    ->searchable()
                    ->preload(),
                Forms\Components\Select::make('level')
                    ->label('Level')
                    ->options([
                        'info' => 'Info',
                        'warning' => 'Warning',
                        'error' => 'Error',
                        'debug' => 'Debug',
                    ]),
                Forms\Components\Textarea::make('message')
                    ->label('Nội dung')
                    ->rows(5)
                    ->columnSpanFull(),
                Forms\Components\KeyValue::make('context')
                    ->label('Context')
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('workflowJob.id')
                    ->label('Job ID')
                    ->sortable(),
                Tables\Columns\TextColumn::make('level')
                    ->label('Level')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'info' => 'info',
                        'warning' => 'warning',
                        'error' => 'danger',
                        'debug' => 'gray',
                        default => 'primary',
                    }),
                Tables\Columns\TextColumn::make('message')
                    ->label('Nội dung')
                    ->limit(60)
                    ->searchable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Thời gian')
                    ->dateTime('d/m/Y H:i:s')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('level')
                    ->options([
                        'info' => 'Info',
                        'warning' => 'Warning',
                        'error' => 'Error',
                        'debug' => 'Debug',
                    ]),
                Tables\Filters\SelectFilter::make('workflow_job_id')
                    ->label('Job')
                    ->relationship('workflowJob', 'id')
                    ->searchable()
                    ->preload(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
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
            'index' => Pages\ListJobLogs::route('/'),
            'create' => Pages\CreateJobLog::route('/create'),
            'edit' => Pages\EditJobLog::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
