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
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class UserBankAccountResource extends Resource
{
    protected static ?string $model = UserBankAccount::class;

    protected static ?string $navigationIcon = 'heroicon-o-credit-card';

    protected static ?string $navigationLabel = 'Tài khoản NH';

    protected static ?string $modelLabel = 'Tài khoản ngân hàng';

    protected static ?string $pluralModelLabel = 'Tài khoản ngân hàng';

    protected static ?string $navigationGroup = 'Quản lý tài chính';

    protected static ?int $navigationSort = 4;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                //
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                //
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
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
