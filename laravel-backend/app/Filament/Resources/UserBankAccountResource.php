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

    protected static ?string $navigationGroup = 'Finance Management';

    protected static ?int $navigationSort = 4;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('user_id')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->required(),
                Forms\Components\Select::make('bank_id')
                    ->relationship('bank', 'short_name')
                    ->searchable()
                    ->required(),
                Forms\Components\TextInput::make('account_number')
                    ->required()
                    ->maxLength(20),
                Forms\Components\TextInput::make('account_name')
                    ->required()
                    ->maxLength(255),
                Forms\Components\TextInput::make('branch')
                    ->maxLength(255),
                Forms\Components\Toggle::make('is_verified'),
                Forms\Components\Toggle::make('is_default'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('bank.short_name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('account_number')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('account_name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_verified')
                    ->boolean(),
                Tables\Columns\IconColumn::make('is_default')
                    ->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('bank')
                    ->relationship('bank', 'short_name')
                    ->searchable()
                    ->preload(),
                Tables\Filters\TernaryFilter::make('is_verified')
                    ->label('Verification')
                    ->boolean()
                    ->trueLabel('Verified')
                    ->falseLabel('Unverified'),
                Tables\Filters\TernaryFilter::make('is_default')
                    ->label('Default Account')
                    ->boolean()
                    ->trueLabel('Yes')
                    ->falseLabel('No'),
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
