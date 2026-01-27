<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserMediaResource\Pages;
use App\Models\UserMedia;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Storage;

class UserMediaResource extends Resource
{
    protected static ?string $model = UserMedia::class;

    protected static ?string $navigationIcon = 'heroicon-o-photo';

    protected static ?string $navigationGroup = 'Nội Dung';

    protected static ?string $navigationLabel = 'Media Library';

    protected static ?string $modelLabel = 'Tệp Media';

    protected static ?string $pluralModelLabel = 'Thư Viện Media';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Upload Media')
                    ->description('Tải lên hình ảnh, video, hoặc tài liệu')
                    ->schema([
                        Forms\Components\FileUpload::make('path')
                            ->label('Tệp tin')
                            ->disk('public')
                            ->directory('user-media')
                            ->image()
                            ->imageEditor()
                            ->imageEditorAspectRatios([
                                null,
                                '16:9',
                                '4:3',
                                '1:1',
                            ])
                            ->maxSize(102400) // 100MB
                            ->acceptedFileTypes([
                                'image/*',
                                'video/*',
                                'application/pdf',
                                'application/msword',
                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            ])
                            ->multiple()
                            ->reorderable()
                            ->downloadable()
                            ->openable()
                            ->required()
                            ->columnSpanFull()
                            ->helperText('Kéo thả file hoặc click để chọn. Hỗ trợ: Hình ảnh, Video, PDF, Word'),
                    ])->columns(1),

                Forms\Components\Section::make('Thông tin chi tiết')
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->label('Người sở hữu')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required()
                            ->default(fn() => auth()->id()),

                        Forms\Components\TextInput::make('filename')
                            ->label('Tên hiển thị')
                            ->required()
                            ->maxLength(255)
                            ->helperText('Tên file sẽ hiển thị cho người dùng'),

                        Forms\Components\TextInput::make('folder')
                            ->label('Thư mục')
                            ->datalist([
                                'images',
                                'videos',
                                'documents',
                                'ai-generated',
                                'avatars',
                                'campaigns',
                            ])
                            ->helperText('Folder ảo để tổ chức file'),

                        Forms\Components\TagsInput::make('tags')
                            ->label('Tags')
                            ->suggestions([
                                'AI Generated',
                                'User Upload',
                                'Profile Picture',
                                'Campaign Asset',
                                'Workflow Media',
                            ])
                            ->placeholder('Nhấn Enter để thêm tag'),

                        Forms\Components\Toggle::make('is_public')
                            ->label('Public')
                            ->helperText('Cho phép truy cập công khai')
                            ->default(false)
                            ->inline(false),

                        Forms\Components\Textarea::make('description')
                            ->label('Mô tả')
                            ->rows(3)
                            ->columnSpanFull(),

                        Forms\Components\TextInput::make('alt_text')
                            ->label('Alt Text (SEO)')
                            ->helperText('Mô tả cho screen readers và SEO')
                            ->maxLength(255)
                            ->columnSpanFull(),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->contentGrid([
                'md' => 2,
                'lg' => 3,
                'xl' => 4,
            ])
            ->columns([
                Tables\Columns\Layout\Stack::make([
                    // Large Thumbnail
                    Tables\Columns\ImageColumn::make('thumbnail_url')
                        ->label('')
                        ->height(200)
                        ->width('100%')
                        ->extraImgAttributes(['class' => 'object-cover rounded-t-lg'])
                        ->defaultImageUrl(fn($record) => match ($record->type ?? 'other') {
                            'video' => asset('images/video-placeholder.png'),
                            'audio' => asset('images/audio-placeholder.png'),
                            default => asset('images/file-placeholder.png'),
                        }),

                    // Info Overlay
                    Tables\Columns\Layout\Stack::make([
                        Tables\Columns\TextColumn::make('filename')
                            ->weight('bold')
                            ->limit(30)
                            ->tooltip(fn($record) => $record->filename ?? $record->original_name),

                        Tables\Columns\Layout\Split::make([
                            Tables\Columns\TextColumn::make('formatted_size')
                                ->badge()
                                ->color('gray')
                                ->icon('heroicon-m-arrow-down-tray'),

                            Tables\Columns\TextColumn::make('type')
                                ->badge()
                                ->color(fn(string $state): string => match ($state) {
                                    'image' => 'success',
                                    'video' => 'warning',
                                    'audio' => 'info',
                                    default => 'gray',
                                })
                                ->formatStateUsing(fn(string $state) => match ($state) {
                                    'image' => '🖼️ Hình ảnh',
                                    'video' => '🎬 Video',
                                    'audio' => '🎵 Audio',
                                    default => '📄 File',
                                }),
                        ]),

                        Tables\Columns\Layout\Split::make([
                            Tables\Columns\TextColumn::make('folder')
                                ->icon('heroicon-m-folder')
                                ->color('gray')
                                ->size('sm')
                                ->default('root'),

                            Tables\Columns\IconColumn::make('is_public')
                                ->boolean()
                                ->trueIcon('heroicon-o-globe-alt')
                                ->falseIcon('heroicon-o-lock-closed')
                                ->trueColor('success')
                                ->falseColor('gray')
                                ->tooltip(fn($record) => $record->is_public ? 'Public' : 'Private'),
                        ]),

                        Tables\Columns\TextColumn::make('created_at')
                            ->dateTime('d/m/Y H:i')
                            ->size('sm')
                            ->color('gray')
                            ->icon('heroicon-m-clock'),
                    ])->space(1),
                ])->space(2),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->label('Loại file')
                    ->options([
                        'image' => '🖼️ Hình ảnh',
                        'video' => '🎬 Video',
                        'audio' => '🎵 Audio',
                        'other' => '📄 Khác',
                    ])
                    ->query(function ($query, $data) {
                        if (!$data['value']) {
                            return $query;
                        }
                        return $query->where('mime_type', 'like', $data['value'] . '/%');
                    }),

                Tables\Filters\SelectFilter::make('folder')
                    ->label('Thư mục')
                    ->options(
                        fn() =>
                        UserMedia::query()
                            ->distinct()
                            ->whereNotNull('folder')
                            ->pluck('folder', 'folder')
                            ->toArray()
                    )
                    ->searchable(),

                Tables\Filters\SelectFilter::make('user_id')
                    ->label('Người sở hữu')
                    ->relationships('user', 'name')
                    ->searchable()
                    ->preload(),

                Tables\Filters\TernaryFilter::make('is_public')
                    ->label('Trạng thái')
                    ->placeholder('Tất cả')
                    ->trueLabel('🌐 Public')
                    ->falseLabel('🔒 Private'),
            ])
            ->actions([
                Tables\Actions\Action::make('view')
                    ->label('Xem')
                    ->icon('heroicon-o-eye')
                    ->url(fn($record) => $record->url)
                    ->openUrlInNewTab()
                    ->color('gray'),

                Tables\Actions\Action::make('download')
                    ->label('Tải')
                    ->icon('heroicon-o-arrow-down-tray')
                    ->action(function ($record) {
                        $record->incrementDownload();
                        return response()->download(
                            storage_path('app/public/' . $record->path),
                            $record->filename ?? $record->original_name
                        );
                    })
                    ->color('success'),

                Tables\Actions\Action::make('copyUrl')
                    ->label('Copy URL')
                    ->icon('heroicon-o-clipboard-document')
                    ->action(function ($record) {
                        Notification::make()
                            ->title('URL đã sao chép!')
                            ->body($record->url)
                            ->success()
                            ->send();
                    })
                    ->color('info')
                    ->requiresConfirmation(false)
                    ->extraAttributes([
                        'onclick' => 'navigator.clipboard.writeText(this.dataset.url)',
                    ]),

                Tables\Actions\EditAction::make()->color('warning'),

                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\BulkAction::make('moveToFolder')
                        ->label('Chuyển thư mục')
                        ->icon('heroicon-o-folder-arrow-down')
                        ->form([
                            Forms\Components\TextInput::make('folder')
                                ->label('Thư mục mới')
                                ->required()
                                ->datalist([
                                    'images',
                                    'videos',
                                    'documents',
                                    'ai-generated',
                                ]),
                        ])
                        ->action(function ($records, array $data) {
                            foreach ($records as $record) {
                                $record->update(['folder' => $data['folder']]);
                            }

                            Notification::make()
                                ->title('Đã chuyển ' . count($records) . ' file')
                                ->success()
                                ->send();
                        })
                        ->deselectRecordsAfterCompletion(),

                    Tables\Actions\BulkAction::make('togglePublic')
                        ->label('Đổi Public/Private')
                        ->icon('heroicon-o-lock-open')
                        ->action(function ($records) {
                            foreach ($records as $record) {
                                $record->update(['is_public' => !$record->is_public]);
                            }

                            Notification::make()
                                ->title('Đã cập nhật trạng thái')
                                ->success()
                                ->send();
                        })
                        ->deselectRecordsAfterCompletion(),

                    \pxlrbt\FilamentExcel\Actions\Tables\ExportBulkAction::make()
                        ->label('Xuất Excel'),

                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc')
            ->poll('30s')
            ->striped(false)
            ->paginated([12, 24, 48, 96])
            ->deferLoading()
            ->extremePaginationLinks();
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUserMedia::route('/'),
            'create' => Pages\CreateUserMedia::route('/create'),
            'view' => Pages\ViewUserMedia::route('/{record}'),
            'edit' => Pages\EditUserMedia::route('/{record}/edit'),
        ];
    }
}
