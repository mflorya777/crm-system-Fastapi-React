from uuid import UUID

from src.auth.auth_handler import decode_jwt
from fastapi import (
    Request,
    status,
    HTTPException,
)

import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarleteRequest


_LOG = logging.getLogger("uvicorn.info")


class CookieAuthMiddleware:
    def __init__(self):
        pass

    async def __call__(
        self,
        request: Request,
        # call_next: Callable
    ):
        # do something with the request object
        _LOG.info(f"{request.headers=}")
        _LOG.info(f"{request.cookies=}")
        headers_jwt_token = request.cookies.get("EPS-Auth")
        if headers_jwt_token is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Неправильная схема аутентификации",
            )
        if not self.verify_jwt(headers_jwt_token, request):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Не валидный токен",
            )
        if request.state.jwt_payload["expires"] <= time.time():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Срок жизни токена истек",
            )
        return request

    @staticmethod
    def verify_jwt(jwt_token: str, request: Request) -> bool:
        is_token_valid: bool = False

        try:
            payload = decode_jwt(jwt_token)
        except Exception as e:
            _LOG.warning(f"Ошибка декодирования токена. {e}")
            payload = None
        if payload:
            is_token_valid = True
            _LOG.info(payload)
            payload["user_id"] = UUID(payload["user_id"])
            request.state.jwt_payload = payload

        return is_token_valid


unrestricted_page_routes = {"/gui/login"}


class AuthMiddleware(BaseHTTPMiddleware):
    """
    This middleware restricts access to all NiceGUI pages.
    It redirects the user to the login page if they are not authenticated.
    """

    async def dispatch(self, request: StarleteRequest, call_next):
        _LOG.info(f"{request.headers=}")
        _LOG.info(f"{request.cookies=}")

        headers_jwt_token = request.cookies.get("EPS-Auth")

        if headers_jwt_token is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Неправильная схема аутентификации",
            )
        if not self.verify_jwt(headers_jwt_token, request):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Не валидный токен",
            )
        if request.app.storage.user["jwt_payload"]["expires"] <= time.time():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Срок жизни токена истек",
            )
        if not request.app.storage.user["jwt_payload"].get("is_backoffice_user"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )
        return await call_next(request)

    @staticmethod
    def verify_jwt(jwt_token: str, request: StarleteRequest) -> bool:
        is_token_valid: bool = False

        try:
            payload = decode_jwt(jwt_token)
        except Exception as e:
            _LOG.warning(f"Ошибка декодирования токена. {e}")
            payload = None
        if payload:
            is_token_valid = True
            _LOG.info(payload)
            payload["user_id"] = UUID(payload["user_id"])
            request.app.storage.user["jwt_payload"] = payload

        return is_token_valid