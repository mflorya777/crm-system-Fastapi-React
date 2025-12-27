import functools
from typing import (
    Any,
    Awaitable,
    Callable,
)

from cachetools import (
    Cache,
    TTLCache,
    keys,
)


def cachedmethod(
    cache: Callable[[Any],
    Cache[tuple[Any, ...], Any]],
    key: Callable[[Any], Any] = keys.methodkey,
):
    """
    Decorator to wrap a class or instance method with a memoizing
    callable that saves results in a cache.
    """

    def decorator(
        method: Callable[..., Awaitable[Any]],
    ) -> Any:
        async def wrapper(
            self: Any,
            *args: Any,
            **kwargs: Any,
        ):
            c = cache(self)
            k = key(self, *args, **kwargs)
            try:
                return c[k]
            except KeyError:
                pass  # key not found
            v = await method(self, *args, **kwargs)
            try:
                c[k] = v
            except ValueError:
                pass  # value too large
            return v

        def clear(self: Any):
            c = cache(self)
            c.clear()

        wrapper.__setattr__("cache", cache)
        wrapper.__setattr__("cache_key", key)
        wrapper.__setattr__("cache_lock", None)
        wrapper.__setattr__("cache_clear", clear)

        return functools.update_wrapper(
            wrapper,
            method,
        )

    return decorator
