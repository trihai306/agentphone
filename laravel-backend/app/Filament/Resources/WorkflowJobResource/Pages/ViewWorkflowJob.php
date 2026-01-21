<?php

namespace App\Filament\Resources\WorkflowJobResource\Pages;

use App\Filament\Resources\WorkflowJobResource;
use Filament\Actions;
use Filament\Resources\Pages\ViewRecord;

class ViewWorkflowJob extends ViewRecord
{
    protected static string $resource = WorkflowJobResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('cancel')
                ->label('Hủy công việc')
                ->icon('heroicon-o-x-circle')
                ->color('danger')
                ->requiresConfirmation()
                ->visible(fn() => $this->record->canCancel())
                ->action(function () {
                    $this->record->markAsCancelled();
                    $this->refreshFormData(['status']);
                }),

            Actions\Action::make('retry')
                ->label('Thử lại')
                ->icon('heroicon-o-arrow-path')
                ->color('info')
                ->requiresConfirmation()
                ->visible(fn() => $this->record->canRetry())
                ->action(function () {
                    $this->record->update([
                        'status' => \App\Models\WorkflowJob::STATUS_PENDING,
                        'error_message' => null,
                        'retry_count' => $this->record->retry_count + 1,
                        'completed_at' => null,
                    ]);
                    $this->refreshFormData(['status', 'retry_count', 'error_message']);
                }),
        ];
    }
}
