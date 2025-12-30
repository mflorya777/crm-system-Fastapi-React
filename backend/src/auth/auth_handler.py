import os
import time

import jwt

from src.model import AppConfig

# Загружаем конфигурацию
_app_config = AppConfig()

# Получаем JWT настройки из конфигурации или переменных окружения
JWT_SECRET = _app_config.jwt_secret or os.environ.get("JWT_SECRET", "")
JWT_ALGORITHM = _app_config.jwt_algorithm or os.environ.get("JWT_ALGORITHM", "HS256")

if not JWT_SECRET:
    raise ValueError("JWT_SECRET must be set in environment variables or AppConfig")

# FIXME: this should be a config default should be hour
EXPIRATION_TIME_SEC = 60 * 60 * 24


def sign_jwt(
    user_id: str,
    is_backoffice_user: bool = False,
) -> str:
    payload = {
        "user_id": user_id,
        "expires": time.time() + EXPIRATION_TIME_SEC,
        "is_backoffice_user": is_backoffice_user,
    }
    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )
    return token


def decode_jwt(token: str) -> dict:
    decoded_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    return decoded_token
