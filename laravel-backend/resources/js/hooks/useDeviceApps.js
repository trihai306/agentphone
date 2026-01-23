import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage device apps list via socket
 * Subscribes to 'apps.result' event and provides requestApps function
 * 
 * @param {number|string} userId - User ID for socket channel subscription
 * @returns {{ apps: Array, appsLoading: boolean, requestApps: Function }}
 */
export function useDeviceApps(userId) {
    const [apps, setApps] = useState([]);
    const [appsLoading, setAppsLoading] = useState(false);

    // Socket subscription to receive apps list from device
    useEffect(() => {
        if (!userId || !window.Echo) return;

        const channel = window.Echo.private(`user.${userId}`);
        console.log(`🔌 useDeviceApps: Subscribing to private-user.${userId}`);

        const handleAppsResult = (data) => {
            console.log('📱 useDeviceApps: Received apps.result:', data);
            setAppsLoading(false);

            if (data.success) {
                setApps(data.apps || []);
            } else {
                console.error('❌ useDeviceApps: Failed to get apps:', data.error);
                setApps([]);
            }
        };

        channel.listen('.apps.result', handleAppsResult);

        return () => {
            console.log(`🔌 useDeviceApps: Unsubscribing from private-user.${userId}`);
            channel.stopListening('.apps.result');
        };
    }, [userId]);

    // Request apps list from device via API
    const requestApps = useCallback(async (deviceId) => {
        if (!deviceId) {
            console.warn('⚠️ useDeviceApps: No deviceId provided');
            return;
        }

        console.log(`📤 useDeviceApps: Requesting apps from device ${deviceId}`);
        setAppsLoading(true);

        try {
            const response = await window.axios.post('/devices/apps', {
                device_id: deviceId
            });

            if (!response?.data?.success) {
                console.error('❌ useDeviceApps: API request failed');
                setAppsLoading(false);
            }
            // Loading will be set to false when socket event is received
        } catch (err) {
            console.error('❌ useDeviceApps: Failed to request apps:', err);
            setAppsLoading(false);
        }
    }, []);

    return { apps, appsLoading, requestApps };
}
