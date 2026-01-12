<?php

namespace App\Filament\Resources\ErrorReportResource\Pages;

use App\Filament\Resources\ErrorReportResource;
use Filament\Resources\Pages\ListRecords;
use Filament\Actions;

class ListErrorReports extends ListRecords
{
    protected static string $resource = ErrorReportResource::class;

    protected function getHeaderActions(): array
    {
        return [
            // Note: Error reports are created by users, not admins
        ];
    }
}
