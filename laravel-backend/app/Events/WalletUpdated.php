<?php

namespace App\Events;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WalletUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $userId;
    public float $balance;
    public float $previousBalance;
    public float $changeAmount;
    public string $changeType;
    public ?string $description;

    /**
     * Create a new event instance.
     */
    public function __construct(
        int $userId,
        float $balance,
        float $previousBalance,
        string $changeType = 'deposit',
        ?string $description = null
    ) {
        $this->userId = $userId;
        $this->balance = $balance;
        $this->previousBalance = $previousBalance;
        $this->changeAmount = abs($balance - $previousBalance);
        $this->changeType = $changeType;
        $this->description = $description;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('wallet.' . $this->userId),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'balance' => $this->balance,
            'previous_balance' => $this->previousBalance,
            'change_amount' => $this->changeAmount,
            'change_type' => $this->changeType,
            'description' => $this->description,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'wallet.updated';
    }
}
