import { useEffect, useState, useCallback } from 'react';
import { usePage, router } from '@inertiajs/react';

/**
 * Hook to listen for real-time wallet balance updates
 * Subscribe to wallet updates via Pusher/Soketi and update UI in real-time
 */
export function useWalletUpdates() {
    const { auth } = usePage().props;
    const userId = auth?.user?.id;

    const [balance, setBalance] = useState(auth?.wallet_balance || 0);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // Update balance from props when they change
    useEffect(() => {
        if (auth?.wallet_balance !== undefined) {
            setBalance(auth.wallet_balance);
        }
    }, [auth?.wallet_balance]);

    // Setup WebSocket listener for wallet updates
    useEffect(() => {
        if (!window.Echo || !userId) return;

        let channel = null;

        try {
            channel = window.Echo.private(`wallet.${userId}`);

            channel.listen('.wallet.updated', (data) => {
                console.log('Wallet update received:', data);

                // Update local balance state immediately
                setBalance(data.balance);
                setLastUpdate({
                    ...data,
                    receivedAt: new Date(),
                });

                // Reload Inertia shared props to sync all components
                router.reload({
                    only: ['auth'],
                    preserveScroll: true,
                    preserveState: true,
                });
            });

            setIsConnected(true);
            console.log(`Subscribed to wallet updates for user ${userId}`);
        } catch (error) {
            console.error('Failed to subscribe to wallet channel:', error);
            setIsConnected(false);
        }

        return () => {
            if (channel) {
                window.Echo.leaveChannel(`private-wallet.${userId}`);
            }
        };
    }, [userId]);

    // Refresh balance from server
    const refreshBalance = useCallback(() => {
        router.reload({
            only: ['auth'],
            preserveScroll: true,
            preserveState: true,
        });
    }, []);

    return {
        balance,
        lastUpdate,
        isConnected,
        refreshBalance,
    };
}

export default useWalletUpdates;
