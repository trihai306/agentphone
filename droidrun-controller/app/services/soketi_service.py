"""Soketi WebSocket Service for real-time communication.

This service manages WebSocket connections to the Soketi server
using the Pusher-compatible protocol.
"""

import asyncio
import json
import ssl
from typing import Callable, Dict, Any, Optional
import pysher

from app.config.soketi_config import soketi_config


class SoketiService:
    """Manages Soketi WebSocket connections and event handling.
    
    This service provides:
    - Connection management with automatic reconnection
    - Channel subscription/unsubscription
    - Event binding and handling
    - Authentication for private/presence channels
    """
    
    def __init__(self, auth_token: Optional[str] = None):
        """Initialize Soketi service.
        
        Args:
            auth_token: Bearer token for authenticating private/presence channels
        """
        self._auth_token = auth_token
        self._pusher_client: Optional[pysher.Pusher] = None
        self._channels: Dict[str, Any] = {}
        self._event_handlers: Dict[str, list[Callable]] = {}
        self._connected = False
        self._reconnect_task: Optional[asyncio.Task] = None
        
    def connect(self):
        """Establish WebSocket connection to Soketi.
        
        This method:
        1. Creates a Pusher client instance
        2. Configures authentication for private channels
        3. Binds connection event handlers
        4. Initiates the WebSocket connection
        """
        if self._connected:
            print("[Soketi] Already connected")
            return
        
        # Custom SSL context if SSL verification is disabled
        custom_ssl = None
        if soketi_config.use_ssl and not soketi_config.verify_ssl:
            custom_ssl = ssl.create_default_context()
            custom_ssl.check_hostname = False
            custom_ssl.verify_mode = ssl.CERT_NONE
        
        # Create Pusher client
        self._pusher_client = pysher.Pusher(
            key=soketi_config.app_key,
            cluster=soketi_config.cluster,
            host=soketi_config.host,
            port=soketi_config.port,
            secure=soketi_config.use_ssl,
            custom_ssl_context=custom_ssl,
            # Custom auth endpoint for private/presence channels
            auth_endpoint=soketi_config.auth_endpoint,
            auth_endpoint_headers={
                "Authorization": f"Bearer {self._auth_token}" if self._auth_token else "",
            },
        )
        
        # Connection event handlers
        self._pusher_client.connection.bind('pusher:connection_established', self._on_connected)
        self._pusher_client.connection.bind('pusher:connection_failed', self._on_connection_failed)
        self._pusher_client.connection.bind('pusher:error', self._on_error)
        
        # Connect
        self._pusher_client.connect()
        print(f"[Soketi] Connecting to {soketi_config.ws_url}...")
    
    def disconnect(self):
        """Disconnect from Soketi and cleanup resources."""
        if self._pusher_client:
            # Cancel reconnection task if running
            if self._reconnect_task and not self._reconnect_task.done():
                self._reconnect_task.cancel()
                self._reconnect_task = None
            
            self._pusher_client.disconnect()
            self._connected = False
            self._channels.clear()
            print("[Soketi] Disconnected")
    
    def subscribe_channel(
        self, 
        channel_name: str, 
        event_handlers: Optional[Dict[str, Callable]] = None
    ):
        """Subscribe to a channel.
        
        Args:
            channel_name: Name of the channel (e.g., 'device-updates', 'private-controller-123')
            event_handlers: Dict mapping event names to handler functions
        
        Returns:
            Channel object
            
        Raises:
            RuntimeError: If not connected to Soketi
        """
        if not self._pusher_client:
            raise RuntimeError("Not connected to Soketi. Call connect() first.")
        
        # Subscribe to channel
        channel = self._pusher_client.subscribe(channel_name)
        self._channels[channel_name] = channel
        
        # Bind event handlers
        if event_handlers:
            for event_name, handler in event_handlers.items():
                channel.bind(event_name, handler)
                print(f"[Soketi] Subscribed to {channel_name}:{event_name}")
        
        return channel
    
    def unsubscribe_channel(self, channel_name: str):
        """Unsubscribe from a channel.
        
        Args:
            channel_name: Name of the channel to unsubscribe from
        """
        if channel_name in self._channels:
            self._pusher_client.unsubscribe(channel_name)
            del self._channels[channel_name]
            print(f"[Soketi] Unsubscribed from {channel_name}")
    
    def trigger_client_event(self, channel_name: str, event_name: str, data: Dict[str, Any]):
        """Trigger a client event on a channel (for presence/private channels only).
        
        Args:
            channel_name: Channel name (must be presence- or private-)
            event_name: Event name (must start with 'client-')
            data: Event payload
        """
        if channel_name not in self._channels:
            raise ValueError(f"Not subscribed to channel: {channel_name}")
        
        if not event_name.startswith("client-"):
            raise ValueError("Client events must start with 'client-'")
        
        channel = self._channels[channel_name]
        channel.trigger(event_name, data)
    
    # Connection event handlers
    
    def _on_connected(self, data):
        """Handler for connection established event.
        
        Args:
            data: Connection data including socket_id
        """
        self._connected = True
        socket_id = data if isinstance(data, str) else data.get('socket_id', 'unknown')
        print(f"[Soketi] ✅ Connected! Socket ID: {socket_id}")
    
    def _on_connection_failed(self, error):
        """Handler for connection failed event.
        
        Args:
            error: Error details
        """
        self._connected = False
        print(f"[Soketi] ❌ Connection failed: {error}")
        
        # Attempt reconnection after 5 seconds
        if not self._reconnect_task or self._reconnect_task.done():
            self._reconnect_task = asyncio.create_task(self._reconnect_after_delay(5))
    
    def _on_error(self, error):
        """Handler for general errors.
        
        Args:
            error: Error details
        """
        print(f"[Soketi] ⚠️ Error: {error}")
    
    async def _reconnect_after_delay(self, seconds: int):
        """Attempt reconnection after a delay.
        
        Args:
            seconds: Delay in seconds before reconnecting
        """
        try:
            print(f"[Soketi] Reconnecting in {seconds} seconds...")
            await asyncio.sleep(seconds)
            print("[Soketi] Attempting reconnection...")
            self.connect()
        except asyncio.CancelledError:
            print("[Soketi] Reconnection cancelled")
    
    @property
    def is_connected(self) -> bool:
        """Check if currently connected to Soketi.
        
        Returns:
            True if connected, False otherwise
        """
        return self._connected


# Global service instance
_soketi_service: Optional[SoketiService] = None


def get_soketi_service(auth_token: Optional[str] = None) -> SoketiService:
    """Get or create the global Soketi service instance.
    
    Args:
        auth_token: Bearer token for authentication (updates existing instance if provided)
    
    Returns:
        Global SoketiService instance
    """
    global _soketi_service
    if _soketi_service is None:
        _soketi_service = SoketiService(auth_token)
    elif auth_token and _soketi_service._auth_token != auth_token:
        # Update token if changed
        _soketi_service._auth_token = auth_token
    return _soketi_service
