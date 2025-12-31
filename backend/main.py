#!/usr/bin/env python3

import os
import uvicorn


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8081"))
    uvicorn.run(
        "src.app:app",
        host="0.0.0.0",  # noqa: S104
        port=port,
        reload=True,
    )
