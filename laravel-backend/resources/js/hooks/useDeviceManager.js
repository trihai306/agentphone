import { useState, useEffect, useCallback } from 'react';
import { deviceApi } from '@/services/api';

/**
 * Custom hook to manage device selection and status
 * Shows ALL devices and verifies online status via ping when selected
 * 
 * @param {Array} initialDevices - All user devices (not just online)
 * @param {Object} auth - Auth object with user info
 * @returns {Object} Device management state and functions
 */
export function useDeviceManager(initialDevices = [], auth = null) {
    const [devices, setDevices] = useState(initialDevices);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [isPinging, setIsPinging] = useState(false);
    const [pingError, setPingError] = useState(null);

    // Update devices when initialDevices changes (e.g., page refresh)
    useEffect(() => {
        if (initialDevices && initialDevices.length > 0) {
            setDevices(initialDevices);
        }
    }, [initialDevices]);

    // Auto-check accessibility status when device is selected and verified
    useEffect(() => {
        if (!selectedDevice?.device_id || !selectedDevice?.is_verified) return;

        const checkAccessibility = async () => {
            try {
                await deviceApi.checkAccessibility(selectedDevice.device_id);
                console.log('✅ useDeviceManager: Accessibility check sent for device:', selectedDevice.device_id);
            } catch (err) {
                console.warn('⚠️ useDeviceManager: Auto accessibility check failed:', err);
            }
        };

        // Small delay to ensure socket is ready
        const timeoutId = setTimeout(checkAccessibility, 500);
        return () => clearTimeout(timeoutId);
    }, [selectedDevice?.device_id, selectedDevice?.is_verified]);

    // Listen for device status updates via socket
    useEffect(() => {
        if (!auth?.user?.id || !window.Echo) return;

        const channel = window.Echo.private(`user.${auth.user.id}`);
        console.log('🔌 useDeviceManager: Listening for device updates...');

        const handleDeviceUpdate = (payload) => {
            console.log('📱 useDeviceManager: Device update received:', payload);

            const device = payload.device;
            const status = payload.status;

            if (!device?.device_id) {
                console.warn('⚠️ useDeviceManager: Invalid device update payload');
                return;
            }

            // Update devices array with new status
            setDevices(prevDevices => {
                return prevDevices.map(d => {
                    if (d.device_id === device.device_id) {
                        return { ...d, socket_connected: status === 'online' };
                    }
                    return d;
                });
            });

            // Update selectedDevice if it's the one that changed
            setSelectedDevice(prev => {
                if (prev?.device_id === device.device_id) {
                    if (status === 'online') {
                        return { ...prev, socket_connected: true };
                    } else {
                        // Device went offline - clear verification
                        return { ...prev, socket_connected: false, is_verified: false };
                    }
                }
                return prev;
            });
        };

        // Listen for pong responses (device verified online)
        const handlePongResult = (payload) => {
            console.log('📡 useDeviceManager: Pong received:', payload);

            if (payload.success && payload.device_id) {
                // Update device as verified
                setSelectedDevice(prev => {
                    if (prev?.device_id === payload.device_id) {
                        return { ...prev, is_verified: true, socket_connected: true };
                    }
                    return prev;
                });

                setDevices(prevDevices => {
                    return prevDevices.map(d => {
                        if (d.device_id === payload.device_id) {
                            return { ...d, socket_connected: true };
                        }
                        return d;
                    });
                });
            }
        };

        channel.listen('.device.status.changed', handleDeviceUpdate);
        channel.listen('.device.pong', handlePongResult);

        return () => {
            channel.stopListening('.device.status.changed');
            channel.stopListening('.device.pong');
        };
    }, [auth?.user?.id]);

    /**
     * Select device and verify it's online via ping
     * Shows loading state while verifying
     */
    const selectDevice = useCallback(async (device) => {
        if (!device?.device_id) {
            console.warn('⚠️ useDeviceManager: Invalid device');
            return;
        }

        console.log('🔌 useDeviceManager: Selecting device:', device.name);
        setIsPinging(true);
        setPingError(null);

        try {
            // Send verify-online request (backend sends ping to APK)
            const response = await deviceApi.verifyOnline(device.device_id);

            if (response.success) {
                console.log('📡 useDeviceManager: Ping sent, waiting for pong...', response.data?.ping_id);

                // Set device as selected but pending verification
                // We'll receive pong via socket and update is_verified
                setSelectedDevice({
                    ...device,
                    is_verified: false,
                    ping_id: response.data?.ping_id
                });

                // Fallback: If no pong received within 3 seconds, check socket_connected
                setTimeout(() => {
                    setSelectedDevice(prev => {
                        if (prev?.device_id === device.device_id && !prev.is_verified) {
                            // Assume online if DB says socket_connected
                            if (device.socket_connected) {
                                console.log('⚡ useDeviceManager: Fallback - using socket_connected hint');
                                setIsPinging(false);
                                return { ...prev, is_verified: true };
                            } else {
                                // Device didn't respond to ping but KEEP IT SELECTED
                                // Just mark as unverified and show warning
                                console.warn('⚠️ useDeviceManager: Fallback - device not responding, keeping selected');
                                setPingError('Device may be offline');
                                setIsPinging(false);
                                // Keep device selected but mark unverified - still usable for app list
                                return { ...prev, is_verified: false };
                            }
                        }
                        if (prev?.is_verified) {
                            setIsPinging(false);
                        }
                        return prev;
                    });
                }, 3000);
            } else {
                console.error('❌ useDeviceManager: Verify request failed');
                setPingError(response.error || 'Could not verify device status');
                setIsPinging(false);
            }
        } catch (err) {
            console.error('❌ useDeviceManager: Failed to verify device:', err);
            setPingError('Connection error');
            setIsPinging(false);
        }
    }, []);

    /**
     * Manually check accessibility status
     */
    const checkAccessibility = useCallback(async () => {
        if (!selectedDevice?.device_id) {
            console.warn('⚠️ useDeviceManager: No device selected for accessibility check');
            return;
        }

        try {
            const response = await deviceApi.checkAccessibility(selectedDevice.device_id);
            console.log('✅ useDeviceManager: Manual accessibility check:', response);
            return response;
        } catch (err) {
            console.error('❌ useDeviceManager: Accessibility check failed:', err);
            throw err;
        }
    }, [selectedDevice?.device_id]);

    /**
     * Clear ping error
     */
    const clearPingError = useCallback(() => {
        setPingError(null);
    }, []);

    return {
        // State
        selectedDevice,
        devices,
        isPinging,
        pingError,

        // Computed
        hasVerifiedDevice: selectedDevice?.is_verified ?? false,

        // Functions
        setSelectedDevice: selectDevice, // Renamed: now includes ping verification
        setDevices,
        checkAccessibility,
        clearPingError,
    };
}
