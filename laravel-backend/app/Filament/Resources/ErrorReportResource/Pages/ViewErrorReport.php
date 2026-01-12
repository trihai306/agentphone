<?php

namespace App\Filament\Resources\ErrorReportResource\Pages;

use App\Filament\Resources\ErrorReportResource;
use App\Models\ErrorReport;
use App\Models\ErrorReportResponse;
use Filament\Actions;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ViewRecord;

class ViewErrorReport extends ViewRecord
{
    protected static string $resource = ErrorReportResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\EditAction::make(),

            Actions\Action::make('send_response')
                ->label('Gửi phản hồi')
                ->icon('heroicon-o-chat-bubble-left-right')
                ->color('primary')
                ->form([
                    Forms\Components\Textarea::make('message')
                        ->label('Nội dung phản hồi')
                        ->required()
                        ->rows(4)
                        ->placeholder('Nhập phản hồi của bạn cho người dùng...'),
                ])
                ->action(function (array $data, ErrorReport $record) {
                    ErrorReportResponse::create([
                        'error_report_id' => $record->id,
                        'user_id' => auth()->id(),
                        'message' => $data['message'],
                        'is_admin_response' => true,
                    ]);

                    // Update status to reviewing if still pending
                    if ($record->status === ErrorReport::STATUS_PENDING) {
                        $record->update(['status' => ErrorReport::STATUS_REVIEWING]);
                    }

                    Notification::make()
                        ->title('Phản hồi đã được gửi')
                        ->success()
                        ->send();
                }),

            Actions\Action::make('mark_resolved')
                ->label('Đánh dấu đã giải quyết')
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
        ];
    }

    protected function mutateFormDataBeforeFill(array $data): array
    {
        // Load responses for display
        $data['responses'] = $this->record->responses()->with('user')->get()->toArray();
        return $data;
    }
}
