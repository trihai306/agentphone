<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Filament\Resources\UserResource\RelationManagers\WalletsRelationManager;
use App\Models\User;
use App\States\UserWorkflow\Active;
use App\States\UserWorkflow\Archived;
use App\States\UserWorkflow\Pending;
use App\States\UserWorkflow\Suspended;
use App\States\UserWorkflow\UserWorkflowState;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationGroup = 'User Management';

    protected static ?int $navigationSort = 1;

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('User Information')
                    ->description('Basic user account information')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->maxLength(255),

                        Forms\Components\TextInput::make('email')
                            ->email()
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Password')
                    ->description('Set the user password')
                    ->schema([
                        Forms\Components\TextInput::make('password')
                            ->password()
                            ->dehydrateStateUsing(fn (string $state): string => Hash::make($state))
                            ->dehydrated(fn (?string $state): bool => filled($state))
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->rule(Password::default())
                            ->same('password_confirmation')
                            ->label(fn (string $operation): string => $operation === 'create' ? 'Password' : 'New Password')
                            ->helperText(fn (string $operation): ?string => $operation === 'edit' ? 'Leave empty to keep the current password.' : null),

                        Forms\Components\TextInput::make('password_confirmation')
                            ->password()
                            ->dehydrated(false)
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->label('Confirm Password'),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Roles & Status')
                    ->description('Assign roles and manage workflow state')
                    ->schema([
                        Forms\Components\Select::make('roles')
                            ->relationship('roles', 'name')
                            ->multiple()
                            ->preload()
                            ->searchable(),

                        Forms\Components\Select::make('workflow_state')
                            ->label('Workflow State')
                            ->options(fn () => self::getAvailableWorkflowStates())
                            ->default(Pending::class)
                            ->required()
                            ->native(false)
                            ->helperText('Select the user workflow state'),
                    ])
                    ->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('email')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('roles.name')
                    ->label('Roles')
                    ->badge()
                    ->separator(',')
                    ->searchable(),

                Tables\Columns\TextColumn::make('workflow_state')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn ($state): string => $state instanceof UserWorkflowState ? $state->label() : (string) $state)
                    ->color(fn ($state): string => $state instanceof UserWorkflowState ? $state->color() : 'gray')
                    ->sortable(),

                Tables\Columns\TextColumn::make('email_verified_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('roles')
                    ->relationship('roles', 'name')
                    ->multiple()
                    ->preload()
                    ->label('Role'),

                Tables\Filters\TernaryFilter::make('email_verified_at')
                    ->label('Email Verified')
                    ->nullable()
                    ->trueLabel('Verified')
                    ->falseLabel('Unverified')
                    ->queries(
                        true: fn ($query) => $query->whereNotNull('email_verified_at'),
                        false: fn ($query) => $query->whereNull('email_verified_at'),
                    ),

                Tables\Filters\SelectFilter::make('workflow_state')
                    ->label('Status')
                    ->options([
                        Pending::class => 'Pending',
                        Active::class => 'Active',
                        Suspended::class => 'Suspended',
                        Archived::class => 'Archived',
                    ]),
            ])
            ->actions([
                Tables\Actions\ActionGroup::make([
                    Tables\Actions\ViewAction::make(),
                    Tables\Actions\EditAction::make(),
                    Tables\Actions\Action::make('changeState')
                        ->label('Change Status')
                        ->icon('heroicon-o-arrow-path')
                        ->color('warning')
                        ->form([
                            Forms\Components\Select::make('workflow_state')
                                ->label('New Status')
                                ->options(fn (User $record): array => self::getValidTransitions($record))
                                ->required()
                                ->native(false),
                        ])
                        ->action(function (User $record, array $data): void {
                            $newStateClass = $data['workflow_state'];

                            try {
                                $record->workflow_state->transitionTo($newStateClass);

                                Notification::make()
                                    ->title('Status updated successfully')
                                    ->success()
                                    ->send();
                            } catch (\Exception $e) {
                                Notification::make()
                                    ->title('Failed to update status')
                                    ->body($e->getMessage())
                                    ->danger()
                                    ->send();
                            }
                        })
                        ->visible(fn (User $record): bool => !empty(self::getValidTransitions($record))),

                    Tables\Actions\Action::make('resetPassword')
                        ->label('Reset Password')
                        ->icon('heroicon-o-key')
                        ->color('info')
                        ->form([
                            Forms\Components\TextInput::make('new_password')
                                ->label('New Password')
                                ->password()
                                ->required()
                                ->rule(Password::default())
                                ->same('new_password_confirmation'),

                            Forms\Components\TextInput::make('new_password_confirmation')
                                ->label('Confirm Password')
                                ->password()
                                ->required(),
                        ])
                        ->action(function (User $record, array $data): void {
                            $record->update([
                                'password' => Hash::make($data['new_password']),
                            ]);

                            Notification::make()
                                ->title('Password reset successfully')
                                ->success()
                                ->send();
                        }),

                    Tables\Actions\DeleteAction::make()
                        ->before(function (User $record, Tables\Actions\DeleteAction $action) {
                            if (self::isProtectedFromDeletion($record)) {
                                $message = self::getProtectionMessage($record);

                                Notification::make()
                                    ->title('Deletion Not Allowed')
                                    ->body($message)
                                    ->danger()
                                    ->send();

                                $action->cancel();
                            }
                        }),
                ]),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make()
                        ->before(function (\Illuminate\Database\Eloquent\Collection $records, Tables\Actions\DeleteBulkAction $action) {
                            $idsToDelete = $records->pluck('id');

                            // Check for super admin protection
                            $superAdminRoles = ['super_admin', 'super-admin'];
                            $remainingSuperAdmins = User::whereNotIn('id', $idsToDelete)
                                ->whereHas('roles', function (Builder $q) use ($superAdminRoles) {
                                    $q->whereIn('name', $superAdminRoles);
                                })
                                ->count();

                            $deletingAnySuperAdmin = $records->contains(function (User $user) use ($superAdminRoles) {
                                foreach ($superAdminRoles as $role) {
                                    if ($user->hasRole($role)) {
                                        return true;
                                    }
                                }
                                return false;
                            });

                            if ($remainingSuperAdmins === 0 && $deletingAnySuperAdmin) {
                                Notification::make()
                                    ->title('Cannot delete all super admin users')
                                    ->body('This action would remove all super admin users from the system.')
                                    ->danger()
                                    ->send();

                                $action->cancel();

                                return;
                            }

                            // Check for admin protection
                            $adminRole = 'admin';
                            $remainingAdmins = User::role($adminRole)->whereNotIn('id', $idsToDelete)->count();

                            if ($remainingAdmins === 0 && $records->contains(fn (User $user) => $user->hasRole($adminRole))) {
                                Notification::make()
                                    ->title('Cannot delete all admin users')
                                    ->body('This action would remove all admin users from the system.')
                                    ->danger()
                                    ->send();

                                $action->cancel();
                            }
                        }),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getRelations(): array
    {
        return [
            WalletsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }

    public static function getGloballySearchableAttributes(): array
    {
        return ['name', 'email'];
    }

    /**
     * Get available workflow states for the select dropdown.
     */
    protected static function getAvailableWorkflowStates(): array
    {
        return [
            Pending::class => 'Pending',
            Active::class => 'Active',
            Suspended::class => 'Suspended',
            Archived::class => 'Archived',
        ];
    }

    /**
     * Get valid state transitions for a user.
     */
    protected static function getValidTransitions(User $user): array
    {
        $currentState = $user->workflow_state;

        if (!$currentState instanceof UserWorkflowState) {
            return self::getAvailableWorkflowStates();
        }

        $transitions = [];
        $allStates = [
            Pending::class => 'Pending',
            Active::class => 'Active',
            Suspended::class => 'Suspended',
            Archived::class => 'Archived',
        ];

        foreach ($allStates as $stateClass => $label) {
            if ($currentState->canTransitionTo($stateClass)) {
                $transitions[$stateClass] = $label;
            }
        }

        return $transitions;
    }

    /**
     * Check if this is the last admin user.
     */
    protected static function isLastAdmin(User $user): bool
    {
        if (!$user->hasRole('admin')) {
            return false;
        }

        return User::role('admin')->count() <= 1;
    }

    /**
     * Check if this is the last super admin user.
     * Checks both 'super_admin' and 'super-admin' role naming conventions.
     */
    protected static function isLastSuperAdmin(User $user): bool
    {
        $superAdminRoles = ['super_admin', 'super-admin'];

        // Check if user has any super admin role
        $hasSuperAdminRole = false;
        foreach ($superAdminRoles as $role) {
            if ($user->hasRole($role)) {
                $hasSuperAdminRole = true;
                break;
            }
        }

        if (!$hasSuperAdminRole) {
            return false;
        }

        // Count remaining super admins
        $remainingSuperAdmins = User::where(function (Builder $query) use ($superAdminRoles) {
            foreach ($superAdminRoles as $role) {
                $query->orWhereHas('roles', function (Builder $q) use ($role) {
                    $q->where('name', $role);
                });
            }
        })->count();

        return $remainingSuperAdmins <= 1;
    }

    /**
     * Check if user is protected from deletion (last admin or last super admin).
     */
    protected static function isProtectedFromDeletion(User $user): bool
    {
        return self::isLastAdmin($user) || self::isLastSuperAdmin($user);
    }

    /**
     * Get protection message for user deletion.
     */
    protected static function getProtectionMessage(User $user): string
    {
        if (self::isLastSuperAdmin($user)) {
            return 'Cannot delete the last super admin user. There must be at least one super admin in the system.';
        }

        if (self::isLastAdmin($user)) {
            return 'Cannot delete the last admin user. There must be at least one admin in the system.';
        }

        return '';
    }

    /**
     * Get the navigation badge showing total users count.
     */
    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::count();
    }

    /**
     * Get the navigation badge color.
     */
    public static function getNavigationBadgeColor(): ?string
    {
        return 'primary';
    }
}
