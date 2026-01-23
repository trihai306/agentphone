<?php

namespace App\Filament\Resources\JobLogResource\Pages;

use App\Filament\Resources\JobLogResource;
use Filament\Actions;
use Filament\Resources\Pages\CreateRecord;

class CreateJobLog extends CreateRecord
{
    protected static string $resource = JobLogResource::class;
}
