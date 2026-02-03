---
trigger: glob
glob: laravel-backend/app/Filament/**/*.php
description: Filament v3 development patterns for Admin Panel
---

# FILAMENT V3 PATTERNS (ADMIN PANEL)

**BẮT BUỘC**: Mọi Filament code PHẢI tuân theo patterns này.

## 1. RESOURCE STRUCTURE

```
app/Filament/
├── Resources/
│   ├── UserResource/
│   │   ├── Pages/
│   │   │   ├── CreateUser.php
│   │   │   ├── EditUser.php
│   │   │   └── ListUsers.php
│   │   └── RelationManagers/
│   │       └── DevicesRelationManager.php
│   └── UserResource.php
├── Pages/
│   └── Dashboard.php
└── Widgets/
    ├── StatsOverview.php
    └── LatestOrders.php
```

## 2. RESOURCE TEMPLATE

```php
<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DeviceResource\Pages;
use App\Filament\Resources\DeviceResource\RelationManagers;
use App\Models\Device;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class DeviceResource extends Resource
{
    protected static ?string $model = Device::class;

    protected static ?string $navigationIcon = 'heroicon-o-device-phone-mobile';

    protected static ?string $navigationGroup = 'Device Management';

    protected static ?int $navigationSort = 1;

    // ✅ Form Schema
    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Device Information')
                ->schema([
                    Forms\Components\TextInput::make('name')
                        ->required()
                        ->maxLength(255),

                    Forms\Components\TextInput::make('device_id')
                        ->required()
                        ->unique(ignoreRecord: true),

                    Forms\Components\Select::make('user_id')
                        ->relationship('user', 'name')
                        ->searchable()
                        ->preload()
                        ->required(),

                    Forms\Components\Select::make('status')
                        ->options([
                            'active' => 'Active',
                            'inactive' => 'Inactive',
                            'maintenance' => 'Maintenance',
                        ])
                        ->default('active')
                        ->required(),

                    Forms\Components\Toggle::make('is_online')
                        ->default(false),

                    Forms\Components\KeyValue::make('metadata')
                        ->columnSpanFull(),
                ])
                ->columns(2),
        ]);
    }

    // ✅ Table Schema
    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('Owner')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('status')
                    ->colors([
                        'success' => 'active',
                        'danger' => 'inactive',
                        'warning' => 'maintenance',
                    ]),

                Tables\Columns\IconColumn::make('is_online')
                    ->boolean(),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'active' => 'Active',
                        'inactive' => 'Inactive',
                    ]),

                Tables\Filters\TernaryFilter::make('is_online'),

                Tables\Filters\SelectFilter::make('user')
                    ->relationship('user', 'name'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\JobsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDevices::route('/'),
            'create' => Pages\CreateDevice::route('/create'),
            'edit' => Pages\EditDevice::route('/{record}/edit'),
        ];
    }
}
```

## 3. RELATION MANAGER

```php
<?php

namespace App\Filament\Resources\DeviceResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class JobsRelationManager extends RelationManager
{
    protected static string $relationship = 'jobs';

    public function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')
                ->required()
                ->maxLength(255),
        ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('name')
            ->columns([
                Tables\Columns\TextColumn::make('name'),
                Tables\Columns\BadgeColumn::make('status'),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime(),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }
}
```

## 4. CUSTOM ACTIONS

```php
// ✅ Table Action
Tables\Actions\Action::make('activate')
    ->icon('heroicon-o-check-circle')
    ->color('success')
    ->requiresConfirmation()
    ->action(fn (Device $record) => $record->update(['status' => 'active']))
    ->visible(fn (Device $record) => $record->status !== 'active');

// ✅ Bulk Action
Tables\Actions\BulkAction::make('activate')
    ->icon('heroicon-o-check-circle')
    ->requiresConfirmation()
    ->action(fn (Collection $records) => $records->each->update(['status' => 'active']));

// ✅ Header Action
Tables\Actions\Action::make('export')
    ->icon('heroicon-o-arrow-down-tray')
    ->action(fn () => Excel::download(new DevicesExport, 'devices.xlsx'));
```

## 5. WIDGETS

```php
<?php

namespace App\Filament\Widgets;

use App\Models\Device;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class DeviceStatsWidget extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Total Devices', Device::count())
                ->description('All registered devices')
                ->descriptionIcon('heroicon-m-device-phone-mobile')
                ->color('primary'),

            Stat::make('Online', Device::where('is_online', true)->count())
                ->description('Currently connected')
                ->descriptionIcon('heroicon-m-signal')
                ->color('success'),

            Stat::make('Offline', Device::where('is_online', false)->count())
                ->description('Disconnected')
                ->color('danger'),
        ];
    }
}
```

## 6. AUTHORIZATION

```php
// ✅ Policy-based authorization
// app/Policies/DevicePolicy.php
class DevicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function view(User $user, Device $device): bool
    {
        return $user->hasRole('admin') || $device->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, Device $device): bool
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, Device $device): bool
    {
        return $user->hasRole('super-admin');
    }
}

// Resource tự động dùng Policy nếu đã register trong AuthServiceProvider
```

## 7. NAVIGATION

```php
// ✅ Trong Resource
protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';
protected static ?string $navigationGroup = 'Content Management';
protected static ?int $navigationSort = 1;
protected static ?string $navigationLabel = 'Articles';

// ✅ Badge count
public static function getNavigationBadge(): ?string
{
    return static::getModel()::where('status', 'pending')->count();
}

public static function getNavigationBadgeColor(): ?string
{
    return static::getModel()::where('status', 'pending')->count() > 10
        ? 'danger'
        : 'primary';
}

// ✅ Conditional visibility
public static function shouldRegisterNavigation(): bool
{
    return auth()->user()?->hasRole('admin');
}
```

## 8. FORM COMPONENTS

```php
// Text fields
Forms\Components\TextInput::make('name')
    ->required()
    ->maxLength(255)
    ->placeholder('Enter name');

Forms\Components\Textarea::make('description')
    ->rows(5)
    ->columnSpanFull();

Forms\Components\RichEditor::make('content')
    ->fileAttachmentsDisk('public')
    ->columnSpanFull();

// Selection
Forms\Components\Select::make('category_id')
    ->relationship('category', 'name')
    ->searchable()
    ->preload()
    ->createOptionForm([
        Forms\Components\TextInput::make('name')->required(),
    ]);

Forms\Components\Radio::make('type')
    ->options(['draft' => 'Draft', 'published' => 'Published']);

Forms\Components\CheckboxList::make('tags')
    ->relationship('tags', 'name');

// Files
Forms\Components\FileUpload::make('avatar')
    ->image()
    ->disk('public')
    ->directory('avatars')
    ->imageEditor();

// Layout
Forms\Components\Section::make('Details')
    ->schema([...])
    ->columns(2)
    ->collapsible();

Forms\Components\Tabs::make('Tabs')
    ->tabs([
        Forms\Components\Tabs\Tab::make('General')
            ->schema([...]),
        Forms\Components\Tabs\Tab::make('SEO')
            ->schema([...]),
    ]);
```

## 9. TABLE COLUMNS

```php
// Text
Tables\Columns\TextColumn::make('name')
    ->searchable()
    ->sortable()
    ->limit(50)
    ->tooltip(fn ($record) => $record->name);

// Badge
Tables\Columns\BadgeColumn::make('status')
    ->colors([
        'success' => 'active',
        'danger' => 'inactive',
        'warning' => 'pending',
    ]);

// Icon
Tables\Columns\IconColumn::make('is_featured')
    ->boolean();

// Image
Tables\Columns\ImageColumn::make('avatar')
    ->circular()
    ->size(40);

// Date
Tables\Columns\TextColumn::make('created_at')
    ->dateTime('d/m/Y H:i')
    ->sortable()
    ->since(); // "2 hours ago"
```

## 10. BEST PRACTICES

### ✅ DO

- Dùng `->searchable()` cho columns user hay tìm
- Dùng `->sortable()` cho columns quan trọng
- Dùng `Section` và `Tabs` để organize form
- Dùng `->preload()` cho Select relationships
- Implement Policy cho authorization
- Dùng `toggleable()` cho columns optional

### ❌ DON'T

- Query trong form/table methods (cache hoặc dùng relationships)
- Skip `->required()` validation
- Hardcode authorization trong resource
- Quá nhiều columns (dùng `toggleable`)
- Custom quá nhiều khi Filament có sẵn

## COMMANDS

```bash
# Create Resource
php artisan make:filament-resource Device --generate

# Create RelationManager
php artisan make:filament-relation-manager DeviceResource jobs name

# Create Widget
php artisan make:filament-widget StatsOverview --stats-overview

# Create Page
php artisan make:filament-page Settings

# Clear cache
php artisan filament:clear-cached-components
php artisan filament:cache-components
```
