"""
Memory - Agent memory management
"""

from typing import Any, Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class MemoryItem:
    """Single memory item"""
    key: str
    value: Any
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


class Memory:
    """
    Agent memory for storing context and state

    Features:
    - Key-value storage
    - Expiration support
    - History tracking
    """

    def __init__(self):
        self._storage: Dict[str, MemoryItem] = {}
        self._history: list = []

    def remember(self, key: str, value: Any):
        """
        Store a value in memory

        Args:
            key: Memory key
            value: Value to store
        """
        if key in self._storage:
            item = self._storage[key]
            item.value = value
            item.updated_at = datetime.now()
        else:
            self._storage[key] = MemoryItem(key=key, value=value)

        self._history.append({
            "action": "remember",
            "key": key,
            "timestamp": datetime.now().isoformat()
        })

    def recall(self, key: str, default: Any = None) -> Any:
        """
        Retrieve a value from memory

        Args:
            key: Memory key
            default: Default value if not found

        Returns:
            Stored value or default
        """
        item = self._storage.get(key)
        return item.value if item else default

    def forget(self, key: str):
        """Remove a key from memory"""
        if key in self._storage:
            del self._storage[key]
            self._history.append({
                "action": "forget",
                "key": key,
                "timestamp": datetime.now().isoformat()
            })

    def clear(self):
        """Clear all memory"""
        self._storage.clear()
        self._history.append({
            "action": "clear",
            "timestamp": datetime.now().isoformat()
        })

    def get_all(self) -> Dict[str, Any]:
        """Get all stored values"""
        return {k: v.value for k, v in self._storage.items()}

    def has(self, key: str) -> bool:
        """Check if key exists"""
        return key in self._storage

    def keys(self) -> list:
        """Get all keys"""
        return list(self._storage.keys())

    def to_dict(self) -> Dict[str, Any]:
        """Export memory as dict"""
        return self.get_all()

    def __len__(self) -> int:
        return len(self._storage)

    def __contains__(self, key: str) -> bool:
        return key in self._storage

    def __getitem__(self, key: str) -> Any:
        return self.recall(key)

    def __setitem__(self, key: str, value: Any):
        self.remember(key, value)
