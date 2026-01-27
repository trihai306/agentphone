<?php

namespace App\Filament\Resources\UserMediaResource\Pages;

use App\Filament\Resources\UserMediaResource;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Resources\Pages\ViewRecord;

class ViewUserMedia extends ViewRecord
{
    protected static string $resource = UserMediaResource::class;

    protected static ?string $title = 'Chi tiết Media';

    public function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Preview')
                    ->schema([
                        Infolists\Components\ImageEntry::make('url')
                            ->label('')
                            ->height(400)
                            ->width('100%')
                            ->extraImgAttributes(['class' => 'object-contain rounded-lg'])
                            ->hiddenLabel()
                            ->visible(fn($record) => $record->isImage()),

                        Infolists\Components\TextEntry::make('url')
                            ->label('Video')
                            ->formatStateUsing(
                                fn($state) =>
                                '<video controls class="w-full max-h-96 rounded-lg"><source src="' . $state . '"></video>'
                            )
                            ->html()
                            ->visible(fn($record) => $record->isVideo()),

                        Infolists\Components\TextEntry::make('url')
                            ->label('File URL')
                            ->copyable()
                            ->url(fn($state) => $state, true)
                            ->visible(fn($record) => !$record->isImage() && !$record->isVideo()),
                    ]),

                Infolists\Components\Section::make('Thông tin file')
                    ->schema([
                        Infolists\Components\TextEntry::make('filename')
                            ->label('Tên file')
                            ->icon('heroicon-m-document')
                            ->copyable(),

                        Infolists\Components\TextEntry::make('original_name')
                            ->label('Tên gốc')
                            ->icon('heroicon-m-document-text'),

                        Infolists\Components\TextEntry::make('formatted_size')
                            ->label('Kích thước')
                            ->badge()
                            ->color('gray')
                            ->icon('heroicon-m-arrow-down-tray'),

                        Infolists\Components\TextEntry::make('mime_type')
                            ->label('Loại file')
                            ->badge()
                            ->color(fn(string $state): string => match (true) {
                                str_starts_with($state, 'image/') => 'success',
                                str_starts_with($state, 'video/') => 'warning',
                                str_starts_with($state, 'audio/') => 'info',
                                default => 'gray',
                            }),

                        Infolists\Components\TextEntry::make('folder')
                            ->label('Thư mục')
                            ->icon('heroicon-m-folder')
                            ->default('root')
                            ->badge()
                            ->color('primary'),

                        Infolists\Components\TextEntry::make('user.name')
                            ->label('Người sở hữu')
                            ->icon('heroicon-m-user'),

                        Infolists\Components\IconEntry::make('is_public')
                            ->label('Trạng thái')
                            ->boolean()
                            ->trueIcon('heroicon-o-globe-alt')
                            ->falseIcon('heroicon-o-lock-closed')
                            ->trueColor('success')
                            ->falseColor('gray'),

                        Infolists\Components\TextEntry::make('download_count')
                            ->label('Lượt tải')
                            ->icon('heroicon-m-arrow-down-circle')
                            ->badge()
                            ->color('info')
                            ->default(0),
                    ])->columns(2),

                Infolists\Components\Section::make('Tags')
                    ->schema([
                        Infolists\Components\TextEntry::make('tags')
                            ->label('')
                            ->badge()
                            ->separator(',')
                            ->default('Chưa có tag'),
                    ])
                    ->visible(fn($record) => !empty($record->tags)),

                Infolists\Components\Section::make('Mô tả')
                    ->schema([
                        Infolists\Components\TextEntry::make('description')
                            ->label('')
                            ->markdown()
                            ->default('Chưa có mô tả'),

                        Infolists\Components\TextEntry::make('alt_text')
                            ->label('Alt Text (SEO)')
                            ->icon('heroicon-m-magnifying-glass')
                            ->visible(fn($record) => !empty($record->alt_text)),
                    ])
                    ->visible(fn($record) => !empty($record->description) || !empty($record->alt_text))
                    ->collapsible(),

                Infolists\Components\Section::make('Metadata')
                    ->schema([
                        Infolists\Components\TextEntry::make('metadata')
                            ->label('Thông tin kỹ thuật')
                            ->formatStateUsing(
                                fn($state) =>
                                '<pre class="text-xs font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded">' .
                                json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) .
                                '</pre>'
                            )
                            ->html()
                            ->visible(fn($record) => !empty($record->metadata)),

                        Infolists\Components\Grid::make(2)
                            ->schema([
                                Infolists\Components\TextEntry::make('metadata.width')
                                    ->label('Chiều rộng')
                                    ->suffix(' px')
                                    ->icon('heroicon-m-arrows-right-left')
                                    ->visible(fn($record) => isset($record->metadata['width'])),

                                Infolists\Components\TextEntry::make('metadata.height')
                                    ->label('Chiều cao')
                                    ->suffix(' px')
                                    ->icon('heroicon-m-arrows-up-down')
                                    ->visible(fn($record) => isset($record->metadata['height'])),

                                Infolists\Components\TextEntry::make('metadata.duration')
                                    ->label('Thời lượng')
                                    ->suffix(' giây')
                                    ->icon('heroicon-m-clock')
                                    ->visible(fn($record) => isset($record->metadata['duration'])),
                            ]),
                    ])
                    ->collapsible()
                    ->visible(fn($record) => !empty($record->metadata)),

                Infolists\Components\Section::make('Lịch sử')
                    ->schema([
                        Infolists\Components\TextEntry::make('created_at')
                            ->label('Ngày tạo')
                            ->dateTime('d/m/Y H:i:s')
                            ->icon('heroicon-m-calendar'),

                        Infolists\Components\TextEntry::make('updated_at')
                            ->label('Cập nhật lần cuối')
                            ->dateTime('d/m/Y H:i:s')
                            ->since()
                            ->icon('heroicon-m-clock'),

                        Infolists\Components\TextEntry::make('source')
                            ->label('Nguồn')
                            ->badge()
                            ->icon('heroicon-m-arrow-up-tray')
                            ->visible(fn($record) => !empty($record->source)),
                    ])->columns(3),
            ]);
    }

    protected function getHeaderActions(): array
    {
        return [
            \Filament\Actions\Action::make('download')
                ->label('Tải xuống')
                ->icon('heroicon-o-arrow-down-tray')
                ->color('success')
                ->action(function () {
                    $this->record->incrementDownload();
                    return response()->download(
                        storage_path('app/public/' . $this->record->path),
                        $this->record->filename ?? $this->record->original_name
                    );
                }),

            \Filament\Actions\Action::make('copyUrl')
                ->label('Copy URL')
                ->icon('heroicon-o-clipboard-document')
                ->color('info')
                ->action(function () {
                    \Filament\Notifications\Notification::make()
                        ->title('URL đã sao chép!')
                        ->body($this->record->url)
                        ->success()
                        ->send();
                }),

            \Filament\Actions\EditAction::make(),

            \Filament\Actions\DeleteAction::make(),
        ];
    }
}
