<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserBankAccountResource\Pages;
use App\Filament\Resources\UserBankAccountResource\RelationManagers;
use App\Models\UserBankAccount;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Notifications\Notification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class UserBankAccountResource extends Resource
{
    protected static ?string $model = UserBankAccount::class;

    protected static ?string $navigationIcon = 'heroicon-o-credit-card';

    protected static ?string $navigationLabel = 'Tài khoản NH';

    protected static ?string $modelLabel = 'Tài khoản ngân hàng';

    protected static ?string $pluralModelLabel = 'Tài khoản ngân hàng';

    protected static ?string $navigationGroup = '💰 Tài Chính';

    protected static ?int $navigationSort = 4;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin tài khoản')
                    ->description('Thông tin tài khoản ngân hàng của khách hàng')
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->label('Khách hàng')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\Select::make('bank_id')
                            ->label('Ngân hàng')
                            ->relationship('bank', 'short_name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\TextInput::make('account_number')
                            ->label('Số tài khoản')
                            ->required()
                            ->maxLength(20),
                        Forms\Components\TextInput::make('account_name')
                            ->label('Tên tài khoản')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('branch')
                            ->label('Chi nhánh')
                            ->maxLength(255),
                    ])->columns(2),

                Forms\Components\Section::make('Trạng thái')
                    ->schema([
                        Forms\Components\Toggle::make('is_verified')
                            ->label('Đã xác thực')
                            ->helperText('Tài khoản đã được xác minh thông tin'),
                        Forms\Components\Toggle::make('is_default')
                            ->label('Mặc định')
                            ->helperText('Sử dụng làm tài khoản mặc định cho giao dịch'),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Khách hàng')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                Tables\Columns\TextColumn::make('bank.short_name')
                    ->label('Ngân hàng')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('info'),
                Tables\Columns\TextColumn::make('account_number')
                    ->label('Số TK')
                    ->searchable()
                    ->sortable()
                    ->copyable(),
                Tables\Columns\TextColumn::make('account_name')
                    ->label('Tên TK')
                    ->searchable()
                    ->sortable()
                    ->limit(20),
                Tables\Columns\IconColumn::make('is_verified')
                    ->label('Xác thực')
                    ->boolean()
                    ->trueIcon('heroicon-o-check-badge')
                    ->trueColor('success')
                    ->falseIcon('heroicon-o-x-circle')
                    ->falseColor('danger'),
                Tables\Columns\IconColumn::make('is_default')
                    ->label('Mặc định')
                    ->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('bank')
                    ->label('Ngân hàng')
                    ->relationship('bank', 'short_name')
                    ->searchable()
                    ->preload(),
                Tables\Filters\TernaryFilter::make('is_verified')
                    ->label('Xác thực')
                    ->boolean()
                    ->trueLabel('Đã xác thực')
                    ->falseLabel('Chưa xác thực'),
                Tables\Filters\TernaryFilter::make('is_default')
                    ->label('Mặc định')
                    ->boolean()
                    ->trueLabel('Có')
                    ->falseLabel('Không'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),

                Tables\Actions\Action::make('verify')
                    ->label('Xác thực')
                    ->icon('heroicon-o-check-badge')
                    ->color('success')
                    ->button()
                    ->visible(fn(UserBankAccount $record) => !$record->is_verified)
                    ->requiresConfirmation()
                    ->modalHeading('✅ Xác thực tài khoản ngân hàng')
                    ->modalDescription(
                        fn(UserBankAccount $record) =>
                        "Xác thực tài khoản {$record->account_number} - {$record->account_name} tại {$record->bank->short_name}?"
                    )
                    ->action(function (UserBankAccount $record) {
                        $record->update(['is_verified' => true]);

                        Notification::make()
                            ->success()
                            ->title('✅ Đã xác thực tài khoản')
                            ->body("Tài khoản {$record->account_number} của {$record->user->name} đã được xác thực.")
                            ->send();
                    }),

                Tables\Actions\Action::make('unverify')
                    ->label('Hủy xác thực')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->visible(fn(UserBankAccount $record) => $record->is_verified)
                    ->requiresConfirmation()
                    ->modalHeading('⚠️ Hủy xác thực tài khoản')
                    ->action(function (UserBankAccount $record) {
                        $record->update(['is_verified' => false]);

                        Notification::make()
                            ->warning()
                            ->title('Đã hủy xác thực')
                            ->body("Tài khoản {$record->account_number} đã bị hủy xác thực.")
                            ->send();
                    }),
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
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUserBankAccounts::route('/'),
            'create' => Pages\CreateUserBankAccount::route('/create'),
            'edit' => Pages\EditUserBankAccount::route('/{record}/edit'),
        ];
    }
}

