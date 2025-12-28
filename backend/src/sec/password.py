from passlib.hash import pbkdf2_sha256


def hash_password(password) -> str:
    return pbkdf2_sha256.hash(password)


def verify_password(
    plain_password,
    hashed_password,
) -> bool:
    return pbkdf2_sha256.verify(
        plain_password,
        hashed_password,
    )