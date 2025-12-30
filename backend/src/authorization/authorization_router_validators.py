import logging
from typing import List

from pydantic import (
    BaseModel,
    EmailStr,
)
from pydantic_extra_types.phone_numbers import PhoneNumber


from src.users.users_manager import (
    NoSuchUserError,
    AuthenticationError,
    UsersManager,
    UsersStorage,
)
from src.authorization.authorization_router_models import (
    CreateUserParams,
    LoginWithPhoneParams,
    LoginWithEmailParams,
)
from src.common.common_router_models import (
    ResponseError,
    ApiErrorCodes,
)
from src.common.common_validators import (
    validate_email,
    validate_phone,
    validate_password,
)


PhoneNumber.supported_regions = ["RU"]
PhoneNumber.default_region_code = "+7"

_LOG = logging.getLogger("uvicorn.error")


# class EmailValidator(BaseModel):
#     email: EmailStr


# class PhoneValidator(BaseModel):
#     phone: PhoneNumber


class RegistrationFormValidator:
    @classmethod
    async def validate(
        cls,
        form_data: CreateUserParams,
        users_storage: UsersStorage,
    ):
        email_results = await cls.validate_email(form_data.email, users_storage)
        phone_results = await cls.validate_phone(form_data.phone, users_storage)
        password_results = await cls.validate_password(form_data.password, users_storage)
        return email_results + phone_results + password_results

    @staticmethod
    async def validate_phone(phone: str, users_storage: UsersStorage) -> List[ResponseError]:
        return await validate_phone(phone, users_storage)

    @staticmethod
    async def validate_email(email: str, users_storage: UsersStorage) -> List[ResponseError]:
        return await validate_email(email, users_storage)

    @staticmethod
    async def validate_password(email: str, users_storage: UsersStorage) -> List[ResponseError]:
        return await validate_password(email, users_storage)


class LoginFormValidator:
    @classmethod
    async def validate(
        cls,
        form_data: LoginWithPhoneParams | LoginWithEmailParams,
        users_storage: UsersStorage,
        users_manager: UsersManager,
    ) -> List[ResponseError]:
        errors: list[ResponseError] = []

        try:
            if isinstance(form_data, LoginWithEmailParams):
                errors += await validate_email(form_data.email, users_storage, check_unique=False)
                if not errors:
                    _ = users_manager.authenticate_user(
                        form_data.password,
                        email=form_data.email,
                    )
            elif isinstance(form_data, LoginWithPhoneParams):
                errors += await validate_phone(form_data.phone, users_storage, check_unique=False)
                if not errors:
                    _ = users_manager.authenticate_user(
                        form_data.password,
                        phone=form_data.phone,
                    )
            else:
                errors.append(
                    ResponseError(
                        code=ApiErrorCodes.EMAIL_VALIDATION_ERROR,
                        text="Не корректный формат данных.",
                        field=None,
                    ),
                )
        except NoSuchUserError as e:
            _LOG.error(e)
            error = ResponseError(
                code=ApiErrorCodes.EMAIL_VALIDATION_ERROR,
                text=str(e),
                field=None,
            )
            errors.append(error)
        except AuthenticationError as e:
            _LOG.error(e)
            error = ResponseError(
                code=ApiErrorCodes.AUTHENTICATION_ERROR,
                text=str(e),
                field=None,
            )
            errors.append(error)

        return errors