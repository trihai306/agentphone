<?php

namespace App\Filament\Resources;

use App\Filament\Resources\JobTaskResource\Pages;
use App\Models\JobTask;
use App\Models\WorkflowJob;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class JobTaskResource extends Resource
{
    protected static ?string $model = JobTask::class;

    protected static ?string $navigationIcon = 'heroicon-o-queue-list';

    protected static ?string $navigationGroup = 'Automation';

    protected static ?string $navigationLabel = 'Job Tasks';

    protected static ?string $modelLabel = 'Task';

    protected static ?string $pluralModelLabel = 'Job Tasks';

    protected static ?int $navigationSort = 5;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin Task')
                    ->schema([
                        Forms\Components\Select::make('workflow_job_id')
                            ->label('Job')
                            ->relationship('workflowJob', 'id')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\TextInput::make('node_id')
                            ->label('Node ID'),
                        Forms\Components\Select::make('status')
                            ->label('Trạng thái')
                            ->options([
                                'pending' => 'Chờ xử lý',
                                'running' => 'Đang chạy',
                                'completed' => 'Hoàn thành',
                                'failed' => 'Thất bại',
                                'skipped' => 'Bỏ qua',
                            ]),
                        Forms\Components\Textarea::make('result')
                            ->label('Kết quả')
                            ->rows(3)
                            ->columnSpanFull(),
                        Forms\Components\Textarea::make('error')
                            ->label('Lỗi')
                            ->rows(3)
                            ->columnSpanFull(),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('workflowJob.id')
                    ->label('Job ID')
                    ->sortable(),
                Tables\Columns\TextColumn::make('node_id')
                    ->label('Node')
                    ->limit(20),
                Tables\Columns\TextColumn::make('status')
                    ->label('Trạng thái')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'pending' => 'warning',
                        'running' => 'info',
                        'completed' => 'success',
                        'failed' => 'danger',
                        'skipped' => 'gray',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('started_at')
                    ->label('Bắt đầu')
                    ->dateTime('H:i:s')
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('completed_at')
                    ->label('Kết thúc')
                    ->dateTime('H:i:s')
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('error')
                    ->label('Lỗi')
                    ->limit(30)
                    ->placeholder('-')
                    ->color('danger'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Chờ xử lý',
                        'running' => 'Đang chạy',
                        'completed' => 'Hoàn thành',
                        'failed' => 'Thất bại',
                        'skipped' => 'Bỏ qua',
                    ]),
            ])
            ->headerActions([
                \pxlrbt\FilamentExcel\Actions\Tables\ExportAction::make()
                    ->label('Xuất Excel')
                    ->exports([
                        \pxlrbt\FilamentExcel\Exports\ExcelExport::make()
                            ->fromTable()
                            ->askForFilename(
                                default: 'job_tasks_' . now()->format('Y-m-d'),
                                label: 'Tên file'
                            )
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    \pxlrbt\FilamentExcel\Actions\Tables\ExportBulkAction::make()
                        ->label('Xuất Excel'),
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
            'index' => Pages\ListJobTasks::route('/'),
            'create' => Pages\CreateJobTask::route('/create'),
            'edit' => Pages\EditJobTask::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
