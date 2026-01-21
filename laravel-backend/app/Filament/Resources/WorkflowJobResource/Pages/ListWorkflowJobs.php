<?php

namespace App\Filament\Resources\WorkflowJobResource\Pages;

use App\Filament\Resources\WorkflowJobResource;
use Filament\Resources\Pages\ListRecords;

class ListWorkflowJobs extends ListRecords
{
    protected static string $resource = WorkflowJobResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}
