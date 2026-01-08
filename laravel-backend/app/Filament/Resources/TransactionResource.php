<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TransactionResource\Pages;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use App\Models\UserBankAccount;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Notifications\Notification;
use Illuminate\Database\Eloquent\Builder;

class TransactionResource extends Resource
{
    protected static ?string $model = Transaction::class;

    protected static ?string $navigationIcon = 'heroicon-o-banknotes';

    protected static ?string $navigationLabel = 'Giao dịch';

    protected static ?string $modelLabel = 'Giao dịch';

    protected static ?string $pluralModelLabel = 'Giao dịch';

    protected static ?string $navigationGroup = 'Finance Management';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin giao dịch')
                    ->schema([
                        Forms\Components\TextInput::make('transaction_code')
                            ->label('Mã giao dịch')
                            ->disabled()
                            ->dehydrated(false),

                        Forms\Components\Select::make('user_id')
                            ->label('User')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->required()
                            ->reactive()
                            ->afterStateUpdated(fn ($set) => $set('wallet_id', null)),

                        Forms\Components\Select::make('wallet_id')
                            ->label('Ví')
                            ->options(function (callable $get) {
                                $userId = $get('user_id');
                                if (!$userId) {
                                    return [];
                                }
                                return Wallet::where('user_id', $userId)
                                    ->pluck('currency', 'id')
                                    ->map(fn($currency, $id) => "Ví $currency");
                            })
                            ->required(),

                        Forms\Components\Select::make('type')
                            ->label('Loại giao dịch')
                            ->options([
                                'deposit' => 'Nạp tiền',
                                'withdrawal' => 'Rút tiền',
                            ])
                            ->required(),

                        Forms\Components\TextInput::make('amount')
                            ->label('Số tiền')
                            ->numeric()
                            ->required()
                            ->prefix('VND')
                            ->step(1000),

                        Forms\Components\TextInput::make('fee')
                            ->label('Phí giao dịch')
                            ->numeric()
                            ->default(0)
                            ->prefix('VND')
                            ->step(1000),

                        Forms\Components\TextInput::make('final_amount')
                            ->label('Số tiền thực nhận/trừ')
                            ->numeric()
                            ->required()
                            ->prefix('VND')
                            ->step(1000),

                        Forms\Components\Select::make('status')
                            ->label('Trạng thái')
                            ->options([
                                'pending' => 'Chờ xử lý',
                                'processing' => 'Đang xử lý',
                                'completed' => 'Hoàn thành',
                                'failed' => 'Thất bại',
                                'cancelled' => 'Đã hủy',
                            ])
                            ->required()
                            ->default('pending'),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Thông tin ngân hàng')
                    ->schema([
                        Forms\Components\Select::make('user_bank_account_id')
                            ->label('Tài khoản ngân hàng')
                            ->relationship('userBankAccount', 'account_number')
                            ->searchable(),

                        Forms\Components\TextInput::make('payment_method')
                            ->label('Phương thức thanh toán')
                            ->maxLength(255),

                        Forms\Components\TextInput::make('bank_transaction_id')
                            ->label('Mã GD ngân hàng')
                            ->maxLength(255),

                        Forms\Components\FileUpload::make('proof_images')
                            ->label('Ảnh chứng từ')
                            ->multiple()
                            ->image()
                            ->maxFiles(5)
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Ghi chú')
                    ->schema([
                        Forms\Components\Textarea::make('user_note')
                            ->label('Ghi chú của user')
                            ->rows(2),

                        Forms\Components\Textarea::make('admin_note')
                            ->label('Ghi chú admin')
                            ->rows(2),

                        Forms\Components\Textarea::make('reject_reason')
                            ->label('Lý do từ chối')
                            ->rows(2),
                    ])
                    ->columns(1),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('transaction_code')
                    ->label('Mã GD')
                    ->searchable()
                    ->sortable()
                    ->copyable(),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('User')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('type')
                    ->label('Loại')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'deposit' => 'Nạp tiền',
                        'withdrawal' => 'Rút tiền',
                        default => $state,
                    })
                    ->colors([
                        'success' => 'deposit',
                        'danger' => 'withdrawal',
                    ]),

                Tables\Columns\TextColumn::make('amount')
                    ->label('Số tiền')
                    ->money('VND')
                    ->sortable()
                    ->summarize(Tables\Columns\Summarizers\Sum::make()->money('VND')),

                Tables\Columns\TextColumn::make('fee')
                    ->label('Phí')
                    ->money('VND')
                    ->sortable()
                    ->summarize(Tables\Columns\Summarizers\Sum::make()->money('VND')),

                Tables\Columns\TextColumn::make('final_amount')
                    ->label('Thực nhận')
                    ->money('VND')
                    ->sortable()
                    ->summarize(Tables\Columns\Summarizers\Sum::make()->money('VND')),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Trạng thái')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'pending' => 'Chờ xử lý',
                        'processing' => 'Đang xử lý',
                        'completed' => 'Hoàn thành',
                        'failed' => 'Thất bại',
                        'cancelled' => 'Đã hủy',
                        default => $state,
                    })
                    ->colors([
                        'warning' => 'pending',
                        'info' => 'processing',
                        'success' => 'completed',
                        'danger' => 'failed',
                        'secondary' => 'cancelled',
                    ]),

                Tables\Columns\TextColumn::make('userBankAccount.bank.short_name')
                    ->label('Ngân hàng')
                    ->searchable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),

                Tables\Columns\TextColumn::make('approved_at')
                    ->label('Ngày duyệt')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->label('Loại giao dịch')
                    ->options([
                        'deposit' => 'Nạp tiền',
                        'withdrawal' => 'Rút tiền',
                    ]),

                Tables\Filters\SelectFilter::make('status')
                    ->label('Trạng thái')
                    ->options([
                        'pending' => 'Chờ xử lý',
                        'processing' => 'Đang xử lý',
                        'completed' => 'Hoàn thành',
                        'failed' => 'Thất bại',
                        'cancelled' => 'Đã hủy',
                    ])
                    ->multiple(),

                Tables\Filters\Filter::make('created_at')
                    ->form([
                        Forms\Components\DatePicker::make('created_from')
                            ->label('Từ ngày'),
                        Forms\Components\DatePicker::make('created_until')
                            ->label('Đến ngày'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when(
                                $data['created_from'],
                                fn (Builder $query, $date): Builder => $query->whereDate('created_at', '>=', $date),
                            )
                            ->when(
                                $data['created_until'],
                                fn (Builder $query, $date): Builder => $query->whereDate('created_at', '<=', $date),
                            );
                    }),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),

                Tables\Actions\Action::make('approve')
                    ->label('Duyệt')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (Transaction $record): bool => $record->status === 'pending')
                    ->action(function (Transaction $record) {
                        // Get or create wallet for the user
                        $wallet = $record->wallet;

                        if (!$wallet) {
                            // If no wallet specified, get or create default wallet
                            $wallet = Wallet::firstOrCreate(
                                ['user_id' => $record->user_id, 'is_active' => true],
                                ['balance' => 0, 'locked_balance' => 0, 'currency' => 'VND']
                            );
                            $record->wallet_id = $wallet->id;
                        }

                        // Update wallet balance based on transaction type
                        if ($record->type === Transaction::TYPE_DEPOSIT) {
                            // Deposit: Add money to wallet
                            $wallet->deposit($record->final_amount);
                        } elseif ($record->type === Transaction::TYPE_WITHDRAWAL) {
                            // Withdrawal: Subtract money from wallet
                            if (!$wallet->withdraw($record->final_amount)) {
                                Notification::make()
                                    ->danger()
                                    ->title('Không đủ số dư')
                                    ->body('Số dư trong ví không đủ để thực hiện giao dịch rút tiền này.')
                                    ->send();
                                return;
                            }
                        }

                        // Update transaction status
                        $record->update([
                            'status' => 'completed',
                            'approved_by' => auth()->id(),
                            'approved_at' => now(),
                            'completed_at' => now(),
                        ]);

                        Notification::make()
                            ->success()
                            ->title('Đã duyệt giao dịch')
                            ->body('Số dư ví đã được cập nhật: ' . number_format($wallet->balance, 0, ',', '.') . ' ₫')
                            ->send();
                    }),

                Tables\Actions\Action::make('reject')
                    ->label('Từ chối')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (Transaction $record): bool => $record->status === 'pending')
                    ->form([
                        Forms\Components\Textarea::make('reject_reason')
                            ->label('Lý do từ chối')
                            ->required(),
                    ])
                    ->action(function (Transaction $record, array $data) {
                        $record->update([
                            'status' => 'failed',
                            'reject_reason' => $data['reject_reason'],
                            'approved_by' => auth()->id(),
                        ]);

                        Notification::make()
                            ->warning()
                            ->title('Đã từ chối giao dịch')
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
            'index' => Pages\ListTransactions::route('/'),
            'create' => Pages\CreateTransaction::route('/create'),
            'edit' => Pages\EditTransaction::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('status', 'pending')->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }
}
