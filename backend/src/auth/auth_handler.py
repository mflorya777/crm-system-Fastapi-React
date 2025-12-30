import os
import time

import jwt


JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ["JWT_ALGORITHM"]
# FIXME: this should be a config default should be hour
EXPIRATION_TIME_SEC = 60 * 60 * 24


def sign_jwt(user_id: str, is_backoffice_user: bool = False) -> str:
    payload = {
        "user_id": user_id,
        "expires": time.time() + EXPIRATION_TIME_SEC,
        "is_backoffice_user": is_backoffice_user,
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def decode_jwt(token: str) -> dict:
    decoded_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    return decoded_token
