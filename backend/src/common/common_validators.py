r"""
Common validator template

async def validate_email(
        email: str,
        users_manager: UsersManager,
        field_name: str = "email",
) -> list[ResponseError]:
    errors: list[ResponseError] = []
    try:
        if "@" not in email:
            errors.append(
                ResponseError(
                    code=ApiErrorCodes.VALIDATION_ERROR,
                    text="Символ '@' должен присутствовать в email",
                    field=field_name,
                ),
            )
    except Exception as e:
        error = ResponseError(
            code=ApiErrorCodes.VALIDATION_ERROR,
            text=str(e),
            field=field_name,
        )
        errors.append(error)
    return errors
"""

import re
from typing import Callable

from pydantic import (
    BaseModel,
    EmailStr,
)
from pydantic_extra_types.phone_numbers import PhoneNumber
from validators import domain as domain_validator

from src.common.common_router_models import (
    ResponseError,
    ApiErrorCodes,
)
from src.users.users_storage import UsersStorage
from src.users.users_storage import UsersStorageNoSuchUserException

import logging
from fastapi import Request


_LOG = logging.getLogger("uvicorn.error")


class Validators:
    @staticmethod
    async def check_if_field_not_empty(
        request: Request,
        full_field_path: str,
        form,
        field
    ) -> list[ResponseError]:
        errors: list[ResponseError] = []
        try:
            if not field:
                errors.append(
                    ResponseError(
                        code=ApiErrorCodes.VALIDATION_ERROR,
                        text="Поле не должно быть пустым.",
                        field=full_field_path,
                    ),
                )
        except Exception as e:
            error = ResponseError(
                code=ApiErrorCodes.VALIDATION_ERROR,
                text=str(e),
                field=full_field_path,
            )
            errors.append(error)
        return errors

    @staticmethod
    async def check_if_field_less_1000_symbols(
        request: Request,
        full_field_path: str,
        form,
        field
    ) -> list[ResponseError]:
        errors: list[ResponseError] = []
        try:
            if field and len(field) > 1000:
                errors.append(
                    ResponseError(
                        code=ApiErrorCodes.VALIDATION_ERROR,
                        text="Количество символов превышает 1000.",
                        field=full_field_path,
                    ),
                )
        except Exception as e:
            error = ResponseError(
                code=ApiErrorCodes.VALIDATION_ERROR,
                text=str(e),
                field=full_field_path,
            )
            errors.append(error)
        return errors

    @staticmethod
    async def validate_fio(
        request: Request,
        full_field_path: str,
        form,
        field: str,
    ) -> list[ResponseError]:
        errors: list[ResponseError] = []
        if field:
            try:
                if field.startswith(" ") or field.isspace():
                    errors.append(
                        ResponseError(
                            code=ApiErrorCodes.VALIDATION_ERROR,
                            text="В начале или конце поля не должно быть пробелов.",
                            field=full_field_path,
                        ),
                    )
                if "  " in field:
                    errors.append(
                        ResponseError(
                            code=ApiErrorCodes.VALIDATION_ERROR,
                            text="В поле не должно быть двух подряд пробелов.",
                            field=full_field_path,
                        ),
                    )
                if VALID_NAME_SYMBOLS.findall(field):
                    errors.append(
                        ResponseError(
                            code=ApiErrorCodes.VALIDATION_ERROR,
                            text="В поле не должно быть символов кроме букв кириллицы, пробелов, "
                                 "знаков ' и -",
                            field=full_field_path,
                        ),
                    )
                if len(field) > 50:
                    errors.append(
                        ResponseError(
                            code=ApiErrorCodes.VALIDATION_ERROR,
                            text="Значение не должно быть более 50 символов",
                            field=full_field_path,
                        ),
                    )

            except Exception as e:
                error = ResponseError(
                    code=ApiErrorCodes.VALIDATION_ERROR,
                    text=str(e),
                    field=full_field_path,
                )
                errors.append(error)
        return errors

    @staticmethod
    async def validate_phone(
        request: Request,
        full_field_path: str,
        form,
        phone: str,
    ) -> list[ResponseError]:
        errors = []
        try:
            pre_check_errors = await Validators.check_if_field_not_empty(request, full_field_path, form, phone)
            errors.extend(pre_check_errors)
            if not errors:
                if not phone.startswith("+79"):
                    errors.append(
                        ResponseError(
                            code=ApiErrorCodes.PHONE_VALIDATION_ERROR,
                            text="Не корректный телефон. " "Номер телефона должен начинаться с '+79'",
                            field=full_field_path,
                        ),
                    )
                if len(phone) != 12:
                    errors.append(
                        ResponseError(
                            code=ApiErrorCodes.PHONE_VALIDATION_ERROR,
                            text="Не корректный телефон. "
                                 "Номер телефона должен состоять из 12 символов включая знак '+'.",
                            field=full_field_path,
                        ),
                    )
                if not phone.split("+")[-1].isalnum() or not len(phone.split("+")[-1]) == 11:
                    errors.append(
                        ResponseError(
                            code=ApiErrorCodes.PHONE_VALIDATION_ERROR,
                            text="Не корректный телефон. "
                                 "Номер телефона должен состоять из 11 цифр и знака '+' вначале.",
                            field=full_field_path,
                        ),
                    )
            if not errors:
                _ = PhoneValidator(phone=phone)
        except Exception as e:
            error = ResponseError(
                code=ApiErrorCodes.PHONE_VALIDATION_ERROR,
                text=str(e),
                field=full_field_path,
            )
            errors.append(error)
        return errors

    @staticmethod
    async def validate_email(
        request: Request,
        full_field_path: str,
        form,
        email: str,
    ) -> list[ResponseError]:
        errors: list[ResponseError] = []
        try:
            pre_check_errors = await Validators.check_if_field_not_empty(request, full_field_path, form, email)
            errors.extend(pre_check_errors)
            if not errors:
                if "@" not in email:
                    errors.append(
                        ResponseError(
                            code=ApiErrorCodes.VALIDATION_ERROR,
                            text="Символ '@' должен присутствовать в email",
                            field=full_field_path,
                        ),
                    )
                email_domain = email.split("@")[-1]
                if not domain_validator(email_domain):
                    errors.append(
                        ResponseError(
                            code=ApiErrorCodes.VALIDATION_ERROR,
                            text="Не корректный email. "
                                 "Домен указанный после символа '@' указан не корректен.",
                            field=full_field_path,
                        ),
                    )
            if not errors:
                _ = EmailValidator(email=email)
        except Exception as e:
            error = ResponseError(
                code=ApiErrorCodes.VALIDATION_ERROR,
                text=str(e),
                field=full_field_path,
            )
            errors.append(error)
        return errors

    @staticmethod
    async def validate_snils(
        request: Request,
        full_field_path: str,
        form,
        snils: str,
    ) -> list[ResponseError]:
        errors: list[ResponseError] = []
        try:
            pre_check_errors = await Validators.check_if_field_not_empty(request, full_field_path, form, snils)
            errors.extend(pre_check_errors)
            if not errors:
                if not snils.isalnum():
                    errors.append(
                        ResponseError(
                            code=ApiErrorCodes.VALIDATION_ERROR,
                            text="СНИЛС может состоять только из цифр.",
                            field=full_field_path,
                        ),
                    )
                if len(snils) != 11:
                    errors.append(
                        ResponseError(
                            code=ApiErrorCodes.VALIDATION_ERROR,
                            text="СНИЛС должен состоять из 11 цифр.",
                            field=full_field_path,
                        ),
                    )

        except Exception as e:
            error = ResponseError(
                code=ApiErrorCodes.VALIDATION_ERROR,
                text=str(e),
                field=full_field_path,
            )
            errors.append(error)
        return errors

    @staticmethod
    async def validate_address(
        request: Request,
        full_field_path: str,
        form,
        value: str,
    ) -> list[ResponseError]:
        errors: list[ResponseError] = []
        try:
            if len(value) > 400:
                errors.append(
                    ResponseError(
                        code=ApiErrorCodes.VALIDATION_ERROR,
                        text="Количество символов должно быть не более 400.",
                        field=full_field_path,
                    ),
                )
            if len(value) < 1:
                errors.append(
                    ResponseError(
                        code=ApiErrorCodes.VALIDATION_ERROR,
                        text="Поле не должно быть пустым",
                        field=full_field_path,
                    ),
                )
        except Exception as e:
            error = ResponseError(
                code=ApiErrorCodes.VALIDATION_ERROR,
                text=str(e),
                field=full_field_path,
            )
            errors.append(error)
        return errors

    @classmethod
    def validator_picker(cls, validator_name: str) -> Callable:
        return cls.__dict__[validator_name]

    @staticmethod
    async def sms_or_email_should_be_true(
        request: Request,
        full_field_path: str,
        form,
        value: str,
    ) -> list[ResponseError]:
        errors: list[ResponseError] = []
        try:
            if not form.notify_by_phone and not form.notify_by_email:
                errors.append(
                    ResponseError(
                        code=ApiErrorCodes.VALIDATION_ERROR,
                        text="Хотя бы один из способов получения уведомлений должен быть указан.",
                        field=full_field_path,
                    ),
                )
        except Exception as e:
            error = ResponseError(
                code=ApiErrorCodes.VALIDATION_ERROR,
                text=str(e),
                field=full_field_path,
            )
            errors.append(error)
        return errors


async def validate_phone(
    phone: str,
    users_storage: UsersStorage | None = None,
    field_name: str = "phone",
    check_unique: bool = True,
) -> list[ResponseError]:
    errors = []

    try:
        if not phone.startswith("+79"):
            errors.append(
                ResponseError(
                    code=ApiErrorCodes.PHONE_VALIDATION_ERROR,
                    text="Не корректный телефон. " "Номер телефона должен начинаться с '+79'",
                    field=field_name,
                ),
            )
        if len(phone) != 12:
            errors.append(
                ResponseError(
                    code=ApiErrorCodes.PHONE_VALIDATION_ERROR,
                    text="Не корректный телефон. "
                    "Номер телефона должен состоять из 12 символов включая знак '+'.",
                    field=field_name,
                ),
            )
        if not phone.split("+")[-1].isalnum() or not len(phone.split("+")[-1]) == 11:
            errors.append(
                ResponseError(
                    code=ApiErrorCodes.PHONE_VALIDATION_ERROR,
                    text="Не корректный телефон. "
                    "Номер телефона должен состоять из 11 цифр и знака '+' вначале.",
                    field=field_name,
                ),
            )
        if not errors:
            _ = PhoneValidator(phone=phone)
        if check_unique:
            if not errors:
                if await check_phone_exists(phone, users_storage):
                    error = ResponseError(
                        code=ApiErrorCodes.PHONE_VALIDATION_ERROR,
                        text="Пользователь с таким телефоном уже существует",
                        field=field_name,
                    )
                    errors.append(error)
    except Exception as e:
        error = ResponseError(
            code=ApiErrorCodes.PHONE_VALIDATION_ERROR,
            text=str(e),
            field=field_name,
        )
        errors.append(error)
    return errors


async def validate_email(
    email: str,
    users_storage: UsersStorage | None = None,
    field_name: str = "email",
    check_unique: bool = True,
) -> list[ResponseError]:
    errors: list[ResponseError] = []

    try:
        if "@" not in email:
            errors.append(
                ResponseError(
                    code=ApiErrorCodes.VALIDATION_ERROR,
                    text="Символ '@' должен присутствовать в email",
                    field=field_name,
                ),
            )
        email_domain = email.split("@")[-1]
        if not domain_validator(email_domain):
            errors.append(
                ResponseError(
                    code=ApiErrorCodes.VALIDATION_ERROR,
                    text="Не корректный email. "
                    "Домен указанный после символа '@' указан не корректен.",
                    field=field_name,
                ),
            )
        if not errors:
            _ = EmailValidator(email=email)
        if check_unique:
            if not errors:
                if await check_email_exists(email, users_storage):
                    error = ResponseError(
                        code=ApiErrorCodes.VALIDATION_ERROR,
                        text="Пользователь с таким email уже существует",
                        field=field_name,
                    )
                    errors.append(error)
    except Exception as e:
        error = ResponseError(
            code=ApiErrorCodes.VALIDATION_ERROR,
            text=str(e),
            field=field_name,
        )
        errors.append(error)
    return errors


async def validate_password(
    password: str,
    users_storage: UsersStorage | None = None,
    field_name: str = "password",
    check_unique: bool = True,
) -> list[ResponseError]:
    errors = []
    try:
        if len(password) < 8:
            errors.append(
                ResponseError(
                code=ApiErrorCodes.VALIDATION_ERROR,
                text="Пароль должен содержать не менее 8 символов.",
                field=field_name,
            )
        )

        if not re.search(r"[A-Z]", password):
            errors.append(
                ResponseError(
                code=ApiErrorCodes.VALIDATION_ERROR,
                text="Пароль должен содержать хотя бы одну заглавную букву.",
                field=field_name,
            )
        )

        if not re.search(r"\d", password):
            errors.append(
                ResponseError(
                    code=ApiErrorCodes.VALIDATION_ERROR,
                    text="Пароль должен содержать хотя бы одну цифру.",
                    field=field_name,
                )
            )

        if not re.search(r"[!@#$%&]", password):
            errors.append(
                ResponseError(
                code=ApiErrorCodes.VALIDATION_ERROR,
                text="Пароль должен содержать хотя бы один специальный символ.",
                field=field_name,
            )
        )

        if not re.fullmatch(r"[A-Za-z0-9!@#$%&]+", password):
            errors.append(
                ResponseError(
                code=ApiErrorCodes.VALIDATION_ERROR,
                text="Пароль должен содержать только латинские символы.",
                field=field_name,
            )
        )
        if not errors:
            _ = PasswordValidator(password=password)
        if check_unique:
            if not errors:
                if await check_email_exists(password, users_storage):
                    error = ResponseError(
                        code=ApiErrorCodes.VALIDATION_ERROR,
                        text="Пользователь с таким паролем уже существует",
                        field=field_name,
                    )
                    errors.append(error)
    except Exception as e:
        error = ResponseError(
            code=ApiErrorCodes.VALIDATION_ERROR,
            text=str(e),
            field=field_name,
        )
        errors.append(error)

    return errors


VALID_NAME_SYMBOLS = re.compile(r"[^ёЁа-яА-Я'\" -]")
PhoneNumber.supported_regions = ["RU"]


class EmailValidator(BaseModel):
    email: EmailStr


class PhoneValidator(BaseModel):
    phone: PhoneNumber


class PasswordValidator(BaseModel):
    password: str


async def check_email_exists(
    email: str,
    users_storage: UsersStorage | None = None,
) -> bool:
    if not users_storage:
        raise ValueError("UsersStorage необходим для проверки наличия email в БД.")
    try:
        if await users_storage.get_by_email(email):
            return True
    except UsersStorageNoSuchUserException:
        pass
    return False


async def check_phone_exists(
    phone: str,
    users_storage: UsersStorage | None = None,
) -> bool:
    if not users_storage:
        raise ValueError("UsersStorage необходим для проверки наличия email в БД.")
    try:
        if await users_storage.get_by_phone(phone):
            return True
    except UsersStorageNoSuchUserException:
        pass
    return False
