<?php

namespace App\Filament\Resources\FlowResource\Pages;

use App\Filament\Resources\FlowResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditFlow extends EditRecord
{
    protected static string $resource = FlowResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('open_editor')
                ->label('Mở Flow Editor')
                ->icon('heroicon-o-pencil-square')
                ->url(fn () => route('flows.edit', $this->record->id))
                ->openUrlInNewTab()
                ->color('primary'),

            Actions\DeleteAction::make(),
        ];
    }
}
