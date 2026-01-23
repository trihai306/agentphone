import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage device selection and status
 * Handles device auto-selection and accessibility checks
 * 
 * @param {Array} initialDevices - Initial list of online devices
 * @param {Object} auth - Auth object with user info
 * @returns {Object} Device management state and functions
 */
export function useDeviceManager(initialDevices = [], auth = null) {
    const [onlineDevices, setOnlineDevices] = useState(initialDevices);
    const [selectedDevice, setSelectedDevice] = useState(null);

    // Auto-select first online device when page loads
    useEffect(() => {
        if (!selectedDevice && onlineDevices && onlineDevices.length > 0) {
            setSelectedDevice(onlineDevices[0]);
            console.log('🔌 useDeviceManager: Auto-selected first device:', onlineDevices[0]);
        }
    }, [onlineDevices, selectedDevice]);

    // Auto-check accessibility status when device is selected
    useEffect(() => {
        if (!selectedDevice?.device_id) return;

        const checkAccessibility = async () => {
            try {
                await window.axios.post('/devices/check-accessibility', {
                    device_id: selectedDevice.device_id
                });
                console.log('✅ useDeviceManager: Accessibility check sent for device:', selectedDevice.device_id);
            } catch (err) {
                console.warn('⚠️ useDeviceManager: Auto accessibility check failed:', err);
            }
        };

        // Small delay to ensure socket is ready
        const timeoutId = setTimeout(checkAccessibility, 500);
        return () => clearTimeout(timeoutId);
    }, [selectedDevice?.device_id]);

    // Listen for device status updates via socket
    useEffect(() => {
        if (!auth?.user?.id || !window.Echo) return;

        const channel = window.Echo.private(`user.${auth.user.id}`);
        console.log('🔌 useDeviceManager: Listening for device updates...');

        const handleDeviceUpdate = (data) => {
            console.log('📱 useDeviceManager: Device update received:', data);

            // Update onlineDevices array
            setOnlineDevices(prevDevices => {
                const existingIndex = prevDevices.findIndex(d => d.device_id === data.device_id);

                if (data.status === 'online') {
                    if (existingIndex >= 0) {
                        // Update existing device
                        const updated = [...prevDevices];
                        updated[existingIndex] = { ...updated[existingIndex], ...data };
                        return updated;
                    } else {
                        // Add new device
                        return [...prevDevices, data];
                    }
                } else {
                    // Remove offline device
                    return prevDevices.filter(d => d.device_id !== data.device_id);
                }
            });

            // Update selectedDevice if it's the one that changed
            setSelectedDevice(prev => {
                if (prev?.device_id === data.device_id) {
                    return data.status === 'online' ? { ...prev, ...data } : null;
                }
                return prev;
            });
        };

        channel.listen('.device.status', handleDeviceUpdate);

        return () => {
            channel.stopListening('.device.status');
        };
    }, [auth?.user?.id]);

    const selectDevice = useCallback((device) => {
        console.log('🔌 useDeviceManager: Device selected:', device);
        setSelectedDevice(device);
    }, []);

    const checkAccessibility = useCallback(async () => {
        if (!selectedDevice?.device_id) {
            console.warn('⚠️ useDeviceManager: No device selected for accessibility check');
            return;
        }

        try {
            const response = await window.axios.post('/devices/check-accessibility', {
                device_id: selectedDevice.device_id
            });
            console.log('✅ useDeviceManager: Manual accessibility check:', response.data);
            return response.data;
        } catch (err) {
            console.error('❌ useDeviceManager: Accessibility check failed:', err);
            throw err;
        }
    }, [selectedDevice?.device_id]);

    return {
        // State
        selectedDevice,
        onlineDevices,

        // Functions
        setSelectedDevice: selectDevice,
        setOnlineDevices,
        checkAccessibility,
    };
}
