<?php

namespace App\Filament\Resources;

use App\Filament\Resources\FlowResource\Pages;
use App\Models\Flow;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class FlowResource extends Resource
{
    protected static ?string $model = Flow::class;

    protected static ?string $navigationIcon = 'heroicon-o-square-3-stack-3d';

    protected static ?string $navigationLabel = 'Flow Builder';

    protected static ?string $navigationGroup = 'Automation';

    protected static ?int $navigationSort = 30;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin Flow')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Tên Flow')
                            ->required()
                            ->maxLength(255),

                        Forms\Components\Textarea::make('description')
                            ->label('Mô tả')
                            ->maxLength(1000)
                            ->columnSpanFull(),

                        Forms\Components\Select::make('status')
                            ->label('Trạng thái')
                            ->options([
                                'draft' => 'Nháp',
                                'active' => 'Hoạt động',
                                'archived' => 'Lưu trữ',
                            ])
                            ->default('draft')
                            ->required(),

                        Forms\Components\Select::make('user_id')
                            ->label('Người tạo')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),

                        Forms\Components\Toggle::make('is_template')
                            ->label('Là Template')
                            ->helperText('Template có thể được sử dụng bởi các user khác'),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Thống kê')
                    ->schema([
                        Forms\Components\Placeholder::make('nodes_count')
                            ->label('Số lượng Nodes')
                            ->content(fn(?Flow $record): string => $record ? $record->nodes()->count() . ' nodes' : '0 nodes'),

                        Forms\Components\Placeholder::make('edges_count')
                            ->label('Số lượng Edges')
                            ->content(fn(?Flow $record): string => $record ? $record->edges()->count() . ' edges' : '0 edges'),

                        Forms\Components\Placeholder::make('created_at')
                            ->label('Ngày tạo')
                            ->content(fn(?Flow $record): string => $record?->created_at?->format('d/m/Y H:i') ?? '-'),

                        Forms\Components\Placeholder::make('updated_at')
                            ->label('Cập nhật lần cuối')
                            ->content(fn(?Flow $record): string => $record?->updated_at?->format('d/m/Y H:i') ?? '-'),
                    ])
                    ->columns(4)
                    ->hiddenOn('create'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),

                Tables\Columns\TextColumn::make('name')
                    ->label('Tên Flow')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('Người tạo')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Trạng thái')
                    ->colors([
                        'gray' => 'draft',
                        'success' => 'active',
                        'warning' => 'archived',
                    ])
                    ->formatStateUsing(fn(string $state): string => match ($state) {
                        'draft' => 'Nháp',
                        'active' => 'Hoạt động',
                        'archived' => 'Lưu trữ',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('nodes_count')
                    ->label('Nodes')
                    ->counts('nodes')
                    ->sortable(),

                Tables\Columns\TextColumn::make('edges_count')
                    ->label('Edges')
                    ->counts('edges')
                    ->sortable(),

                Tables\Columns\IconColumn::make('is_template')
                    ->label('Template')
                    ->boolean(),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Cập nhật')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('updated_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Trạng thái')
                    ->options([
                        'draft' => 'Nháp',
                        'active' => 'Hoạt động',
                        'archived' => 'Lưu trữ',
                    ]),

                Tables\Filters\Filter::make('is_template')
                    ->label('Chỉ hiện Template')
                    ->query(fn(Builder $query): Builder => $query->where('is_template', true)),

                Tables\Filters\SelectFilter::make('user_id')
                    ->label('Người tạo')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload(),
            ])
            ->actions([
                Tables\Actions\Action::make('open_editor')
                    ->label('Mở Editor')
                    ->icon('heroicon-o-pencil-square')
                    ->color('primary')
                    ->url(fn(Flow $record): string => route('flows.edit', $record->id))
                    ->openUrlInNewTab(),

                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    \pxlrbt\FilamentExcel\Actions\Tables\ExportBulkAction::make()
                        ->label('Xuất Excel'),
                    Tables\Actions\DeleteBulkAction::make(),

                    Tables\Actions\BulkAction::make('update_status')
                        ->label('Cập nhật trạng thái')
                        ->icon('heroicon-o-arrow-path')
                        ->form([
                            Forms\Components\Select::make('status')
                                ->label('Trạng thái mới')
                                ->options([
                                    'draft' => 'Nháp',
                                    'active' => 'Hoạt động',
                                    'archived' => 'Lưu trữ',
                                ])
                                ->required(),
                        ])
                        ->action(function (array $data, $records): void {
                            $records->each(fn($record) => $record->update(['status' => $data['status']]));
                        }),
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
            'index' => Pages\ListFlows::route('/'),
            'create' => Pages\CreateFlow::route('/create'),
            'edit' => Pages\EditFlow::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::count();
    }
}
