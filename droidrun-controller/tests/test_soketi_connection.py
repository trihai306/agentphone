"""Tests for Soketi WebSocket connection."""

import pytest
import time
from unittest.mock import Mock, patch
from app.services.soketi_service import SoketiService
from app.config.soketi_config import soketi_config


class TestSoketiConnection:
    """Test Soketi WebSocket connection and functionality."""
    
    def test_service_initialization(self):
        """Test that SoketiService initializes correctly."""
        service = SoketiService(auth_token="test-token")
        
        assert service._auth_token == "test-token"
        assert service._pusher_client is None
        assert service._connected is False
        assert service._channels == {}
    
    def test_config_loading(self):
        """Test that Soketi configuration loads correctly."""
        assert soketi_config.app_key == "app-key"
        assert soketi_config.host == "laravel-backend.test"
        assert soketi_config.port == 6001
        assert soketi_config.use_ssl is True
    
    def test_ws_url_generation(self):
        """Test WebSocket URL generation."""
        # Test with SSL
        assert soketi_config.ws_url == "wss://laravel-backend.test:6001"
        
        # Test without SSL
        from app.config.soketi_config import SoketiConfig
        config_no_ssl = SoketiConfig(use_ssl=False, host="localhost", port=6001)
        assert config_no_ssl.ws_url == "ws://localhost:6001"
    
    def test_auth_endpoint_generation(self):
        """Test authentication endpoint URL generation."""
        assert soketi_config.auth_endpoint == "https://laravel-backend.test/broadcasting/auth"
    
    @pytest.mark.skipif(True, reason="Requires live Soketi server")
    def test_live_connection(self):
        """Test actual connection to Soketi server.
        
        This test is skipped by default. To run:
        1. Start Soketi server: npx soketi start --config=soketi.json --debug
        2. Run: pytest tests/test_soketi_connection.py::TestSoketiConnection::test_live_connection -v
        """
        service = SoketiService()
        service.connect()
        
        # Wait for connection
        time.sleep(2)
        
        assert service.is_connected, "Should be connected to Soketi"
        
        # Subscribe to test channel
        service.subscribe_channel("device-updates")
        
        # Wait a bit
        time.sleep(1)
        
        # Cleanup
        service.disconnect()
        time.sleep(1)
        assert not service.is_connected, "Should be disconnected"
    
    def test_channel_subscription(self):
        """Test channel subscription without actual connection."""
        service = SoketiService()
        
        # Should raise error if not connected
        with pytest.raises(RuntimeError, match="Not connected to Soketi"):
            service.subscribe_channel("test-channel")
    
    def test_event_handler_binding(self):
        """Test that event handlers are properly bound."""
        service = SoketiService()
        
        # Mock the pusher client
        mock_client = Mock()
        mock_channel = Mock()
        mock_client.subscribe.return_value = mock_channel
        service._pusher_client = mock_client
        
        # Create event handlers
        def on_test_event(data):
            print(f"Test event: {data}")
        
        event_handlers = {
            "test.event": on_test_event,
        }
        
        # Subscribe with handlers
        service.subscribe_channel("test-channel", event_handlers)
        
        # Verify subscription was called
        mock_client.subscribe.assert_called_once_with("test-channel")
        
        # Verify event handler was bound
        mock_channel.bind.assert_called_once_with("test.event", on_test_event)
        
        # Verify channel was stored
        assert "test-channel" in service._channels
    
    def test_unsubscribe_channel(self):
        """Test channel unsubscription."""
        service = SoketiService()
        
        # Mock the pusher client
        mock_client = Mock()
        mock_channel = Mock()
        mock_client.subscribe.return_value = mock_channel
        service._pusher_client = mock_client
        
        # Subscribe first
        service.subscribe_channel("test-channel")
        assert "test-channel" in service._channels
        
        # Unsubscribe
        service.unsubscribe_channel("test-channel")
        
        # Verify unsubscribe was called
        mock_client.unsubscribe.assert_called_once_with("test-channel")
        
        # Verify channel was removed
        assert "test-channel" not in service._channels
    
    def test_multiple_channel_subscriptions(self):
        """Test subscribing to multiple channels."""
        service = SoketiService()
        
        # Mock the pusher client
        mock_client = Mock()
        service._pusher_client = mock_client
        
        # Subscribe to multiple channels
        channels = ["device-updates", "notifications", "private-user-123"]
        for channel in channels:
            mock_channel = Mock()
            mock_client.subscribe.return_value = mock_channel
            service.subscribe_channel(channel)
        
        # Verify all channels are stored
        assert len(service._channels) == 3
        for channel in channels:
            assert channel in service._channels
    
    def test_disconnect_cleanup(self):
        """Test that disconnect properly cleans up resources."""
        service = SoketiService()
        
        # Mock the pusher client
        mock_client = Mock()
        service._pusher_client = mock_client
        service._connected = True
        service._channels = {"test": Mock()}
        
        # Disconnect
        service.disconnect()
        
        # Verify cleanup
        assert service._connected is False
        assert len(service._channels) == 0
        mock_client.disconnect.assert_called_once()


def test_get_soketi_service_singleton():
    """Test that get_soketi_service returns singleton instance."""
    from app.services.soketi_service import get_soketi_service
    
    service1 = get_soketi_service("token1")
    service2 = get_soketi_service("token1")
    
    # Should be the same instance
    assert service1 is service2
    
    # Token should be updated when new token is provided
    service3 = get_soketi_service("token2")
    assert service3 is service1  # Same instance
    assert service3._auth_token == "token2"  # Updated token


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
