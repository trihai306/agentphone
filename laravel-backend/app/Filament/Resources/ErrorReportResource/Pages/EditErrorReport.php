<?php

namespace App\Filament\Resources\ErrorReportResource\Pages;

use App\Filament\Resources\ErrorReportResource;
use App\Models\ErrorReport;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;

class EditErrorReport extends EditRecord
{
    protected static string $resource = ErrorReportResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\ViewAction::make(),

            Actions\Action::make('mark_resolved')
                ->label('Đánh dấu đã giải quyết')
                ->icon('heroicon-o-check-circle')
                ->color('success')
                ->requiresConfirmation()
                ->action(function () {
                    $this->record->markAsResolved();
                    Notification::make()
                        ->title('Đã đánh dấu giải quyết')
                        ->success()
                        ->send();
                    $this->redirect($this->getResource()::getUrl('view', ['record' => $this->record]));
                })
                ->visible(fn() => !$this->record->isResolved()),

            Actions\DeleteAction::make(),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('view', ['record' => $this->record]);
    }
}
