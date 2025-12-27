#!/usr/bin/env python3

import uvicorn


if __name__ == "__main__":
    uvicorn.run(
        "src.app:app",
        host="0.0.0.0",  # noqa: S104
        port=8000,
        reload=True,
    )
