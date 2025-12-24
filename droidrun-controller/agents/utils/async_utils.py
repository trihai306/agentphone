"""
Async Utilities - Helpers for async operations
"""

import asyncio
from typing import Callable, Any, Optional


async def run_with_timeout(
    coro: Any,
    timeout: float,
    default: Any = None
) -> Any:
    """
    Run coroutine with timeout

    Args:
        coro: Coroutine to run
        timeout: Timeout in seconds
        default: Default value if timeout

    Returns:
        Result or default
    """
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except asyncio.TimeoutError:
        return default


async def retry_async(
    func: Callable,
    max_retries: int = 3,
    delay: float = 1.0,
    *args,
    **kwargs
) -> Any:
    """
    Retry async function with exponential backoff

    Args:
        func: Async function to call
        max_retries: Maximum retry attempts
        delay: Initial delay between retries
        *args, **kwargs: Arguments to pass to function

    Returns:
        Function result

    Raises:
        Last exception if all retries fail
    """
    last_error = None

    for attempt in range(max_retries):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            last_error = e
            if attempt < max_retries - 1:
                await asyncio.sleep(delay * (2 ** attempt))

    raise last_error


def run_sync(coro: Any) -> Any:
    """
    Run async coroutine synchronously

    Args:
        coro: Coroutine to run

    Returns:
        Result
    """
    loop = asyncio.get_event_loop()
    if loop.is_running():
        # If already in async context, create task
        return asyncio.ensure_future(coro)
    else:
        return loop.run_until_complete(coro)
