import logging
import base64
import secrets

from starlette.middleware.base import (
    BaseHTTPMiddleware,
    RequestResponseEndpoint,
)
from starlette.requests import Request
from starlette.responses import Response


_LOG = logging.getLogger("uvicorn")


class ApidocBasicAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(  # type: ignore
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ):
        if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
            auth_header = request.headers.get("Authorization")
            if auth_header:
                try:
                    scheme, credentials = auth_header.split()
                    if scheme.lower() == "basic":
                        decoded = base64.b64decode(credentials).decode("ascii")
                        username, password = decoded.split(":")
                        correct_username = secrets.compare_digest(username, "user")
                        correct_password = secrets.compare_digest(password, "pass")
                        if correct_username and correct_password:
                            return await call_next(request)
                except Exception as e:
                    _LOG.warning(e)
            response = Response(content="Unauthorized", status_code=401)
            response.headers["WWW-Authenticate"] = "Basic"
            return response
        return await call_next(request)