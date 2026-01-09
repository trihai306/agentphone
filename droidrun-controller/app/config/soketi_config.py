"""Soketi WebSocket Configuration for DroidRun Controller."""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class SoketiConfig:
    """Configuration for Soketi WebSocket connection.
    
    This configuration is compatible with the Pusher protocol
    and connects to the Soketi server running on Laravel Backend.
    """
    
    # Pusher-compatible credentials
    app_key: str = "app-key"
    app_secret: str = "app-secret"  # Not needed for client connections
    cluster: str = "mt1"
    
    # Connection settings
    host: str = "laravel-backend.test"
    port: int = 6001
    use_ssl: bool = True
    verify_ssl: bool = False  # Set to True in production with valid cert
    
    # Channels to subscribe
    presence_channel: str = "presence-controllers"
    private_channel_prefix: str = "private-controller"
    device_channel: str = "device-updates"
    notification_channel: str = "notifications"
    
    @property
    def ws_url(self) -> str:
        """Get WebSocket URL.
        
        Returns:
            Full WebSocket URL (ws:// or wss://)
        """
        scheme = "wss" if self.use_ssl else "ws"
        return f"{scheme}://{self.host}:{self.port}"
    
    @property
    def auth_endpoint(self) -> str:
        """Get authentication endpoint URL for private/presence channels.
        
        Returns:
            Full URL to Laravel's broadcasting auth endpoint
        """
        scheme = "https" if self.use_ssl else "http"
        return f"{scheme}://{self.host}/broadcasting/auth"
    
    @classmethod
    def from_env(cls) -> "SoketiConfig":
        """Load configuration from environment variables.
        
        Environment variables:
            PUSHER_APP_KEY: Application key (default: "app-key")
            PUSHER_APP_SECRET: Application secret (default: "app-secret")
            PUSHER_APP_CLUSTER: Cluster name (default: "mt1")
            PUSHER_HOST: WebSocket host (default: "laravel-backend.test")
            PUSHER_PORT: WebSocket port (default: 6001)
            PUSHER_SCHEME: Connection scheme - "http" or "https" (default: "https")
            PUSHER_VERIFY_SSL: Verify SSL certificate (default: "false")
        
        Returns:
            SoketiConfig instance with environment-based settings
        """
        return cls(
            app_key=os.getenv("PUSHER_APP_KEY", "app-key"),
            app_secret=os.getenv("PUSHER_APP_SECRET", "app-secret"),
            cluster=os.getenv("PUSHER_APP_CLUSTER", "mt1"),
            host=os.getenv("PUSHER_HOST", "laravel-backend.test"),
            port=int(os.getenv("PUSHER_PORT", "6001")),
            use_ssl=os.getenv("PUSHER_SCHEME", "https") == "https",
            verify_ssl=os.getenv("PUSHER_VERIFY_SSL", "false").lower() == "true",
        )


# Global config instance
soketi_config = SoketiConfig.from_env()
