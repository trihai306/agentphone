---
description: Quy trình tạo Filament Resource/Page/Widget cho dự án Laravel (CLICKAI Admin Panel)
---

# Quy Trình Tạo Filament

**Stack**: Laravel 11 + Filament v3 | MySQL | Spatie Permissions

## Cấu Trúc
```
app/Filament/
├── Pages/           # Custom Pages (Dashboard, Settings)
├── Resources/       # CRUD Resources + Pages + RelationManagers
└── Widgets/         # Dashboard Widgets
```

---

## 1. Tạo Resource

```bash
php artisan make:filament-resource ModelName --generate
```

### Template Cơ Bản
```php
class ExampleResource extends Resource
{
    protected static ?string $model = Example::class;
    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';
    protected static ?string $navigationLabel = 'Tên menu';
    protected static ?string $navigationGroup = 'Nhóm';
    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Tiêu đề')
                ->schema([
                    Forms\Components\TextInput::make('name')->required()->maxLength(255),
                    Forms\Components\Select::make('status')
                        ->options(['active' => 'Hoạt động', 'inactive' => 'Tắt'])
                        ->required()->native(false),
                    Forms\Components\Select::make('user_id')
                        ->relationship('user', 'name')->searchable()->preload(),
                ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\BadgeColumn::make('status')
                    ->colors(['success' => 'active', 'warning' => 'inactive']),
                Tables\Columns\TextColumn::make('created_at')->dateTime('d/m/Y')->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options(['active' => 'Hoạt động', 'inactive' => 'Tắt']),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListExamples::route('/'),
            'create' => Pages\CreateExample::route('/create'),
            'edit' => Pages\EditExample::route('/{record}/edit'),
        ];
    }
}
```

---

## 2. Tạo RelationManager

```bash
php artisan make:filament-relation-manager UserResource wallets currency
```

Đăng ký trong Resource:
```php
public static function getRelations(): array
{
    return [RelationManagers\WalletsRelationManager::class];
}
```

---

## 3. Tạo Widget

```bash
# Stats
php artisan make:filament-widget ExampleStats --stats-overview
# Chart
php artisan make:filament-widget ExampleChart --chart
```

### Stats Widget
```php
class ExampleStats extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Tổng số', Example::count())
                ->description('Records')->color('primary'),
        ];
    }
}
```

---

## 4. Custom Action với Modal

```php
Tables\Actions\Action::make('approve')
    ->label('Duyệt')->icon('heroicon-o-check')->color('success')
    ->modalHeading('Xác nhận duyệt')
    ->form([Forms\Components\Textarea::make('note')->rows(2)])
    ->action(function (Example $record, array $data) {
        $record->update(['status' => 'approved']);
        Notification::make()->success()->title('Đã duyệt')->send();
    }),
```

---

## Checklist

- [ ] Model có `$fillable`, relationships
- [ ] Navigation (icon, label, group)
- [ ] Form với Section, columns(2)
- [ ] Table với searchable/sortable
- [ ] Filters, Actions
- [ ] Labels tiếng Việt

## Tham Khảo

| Pattern | File |
|---------|------|
| Full Resource | `UserResource.php` |
| Custom Actions | `DeviceResource.php` |
| Stats Widget | `TransactionStatsOverview.php` |

// turbo-all
