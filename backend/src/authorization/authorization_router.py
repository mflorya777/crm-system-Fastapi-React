import logging
from typing import Annotated

from fastapi import (
    Body,
    APIRouter,
    Response,
    Request,
)
from fastapi.openapi.models import Example

from src.auth.auth_handler import sign_jwt
from src.users.users_manager import (
    ConflictError,
    NoSuchUserError,
    AuthenticationError,
    UsersManager,
)
from src.authorization.authorization_router_models import (
    CreateUserParams,
    LoginWithEmailParams,
    LoginWithPhoneParams,
)
from src.authorization.authorization_router_validators import (
    RegistrationFormValidator,
    LoginFormValidator,
)
from src.common.common_router_models import (
    ResponseError,
    ApiResponse,
    ApiErrorCodes,
)
from src.users.users_storage import (
    UsersStorageException,
    UsersStorage,
)


_LOG = logging.getLogger("uvicorn.error")
router = APIRouter()


@router.post(
    "/register",
    tags=["Registration"],
)
async def register(
    request: Request,
    user_data: CreateUserParams = Body(...),
) -> ApiResponse:
    users_manager: UsersManager = request.app.state.users_manager
    users_storage: UsersStorage = users_manager.users_storage

    errors = []
    errors += await RegistrationFormValidator.validate(
        user_data,
        users_storage,
    )
    if errors:
        message_text = "Ошибка валидации формы."
        return ApiResponse.error_response(
            errors=errors,
            message_text=message_text,
        )
    try:
        await users_manager.register_user(
            name=user_data.name,
            soname=user_data.soname,
            father_name=user_data.father_name,
            phone=user_data.phone,
            email=user_data.email,
            password=user_data.password,
        )
    except ConflictError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.EMAIL_ALREADY_EXISTS_ERROR,
            text=str(e),
        )
        errors.append(error)
        message_text = (
            "Ошибка создания пользователя. " "Email и/или номер телефона уже зарегистрированы"
        )
        return ApiResponse.error_response(errors=errors, message_text=message_text)
    except UsersStorageException as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_CREATION_ERROR,
            text=str(e),
        )
        errors.append(error)
        message_text = "Ошибка создания пользователя. На уровне UsersStorage"
        return ApiResponse.error_response(errors=errors, message_text=message_text)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_CREATION_ERROR,
            text=str(e),
        )
        errors.append(error)
        message_text = "Ошибка создания пользователя. " "Неизвестная ошибка"
        return ApiResponse.error_response(
            errors=errors,
            message_text=message_text,
        )

    return ApiResponse.success_response()


@router.post(
    "/login",
    tags=["Registration"],
)
async def login(
    request: Request,
    response: Response,
    args: Annotated[
        LoginWithEmailParams | LoginWithPhoneParams,
        Body(
            examples=[
                {"email": "test@mail.ru", "password": "password"},
                {"phone": "+79887776655", "password": "password"},
            ],
            openapi_examples={
                "email_auth": Example(
                    value={
                        "email": "test@mail.ru",
                        "password": "password",
                    },
                ),
                "phone_auth": Example(
                    value={
                        "phone": "+79887776655",
                        "password": "password",
                    },
                ),
            },
        ),
    ],
) -> ApiResponse:
    users_manager: UsersManager = request.app.state.users_manager
    users_storage: UsersStorage = users_manager.users_storage

    errors = []
    errors += await LoginFormValidator.validate(args, users_storage, users_manager)
    try:
        if not errors:
            user = None
            if isinstance(args, LoginWithEmailParams):
                user = await users_manager.authenticate_user(
                    args.password,
                    email=args.email,
                )
            elif isinstance(args, LoginWithPhoneParams):
                user = await users_manager.authenticate_user(
                    args.password,
                    phone=args.phone,
                )
            else:
                errors.append(
                    ResponseError(
                        code=ApiErrorCodes.AUTHENTICATION_ERROR,
                        text="Не корректный формат данных.",
                        field=None,
                    ),
                )
            if user:
                token = sign_jwt(
                    user_id=user.id.hex,
                    is_backoffice_user=user.is_backoffice_user,
                )

                response.set_cookie(
                    "EPS-Auth",
                    value=token,
                    httponly=request.app.state.config.secure_mode,
                    domain=request.app.state.config.domain,
                    secure=request.app.state.config.secure_mode,
                    samesite="none" if request.app.state.config.secure_mode else "lax",
                )
            else:
                errors.append(
                    ResponseError(
                        code=ApiErrorCodes.AUTHENTICATION_ERROR,
                        text="Неожиданное поведение, пользователь не получен из базы.",
                        field=None,
                    ),
                )
    except NoSuchUserError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.AUTHENTICATION_ERROR,
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
    except Exception as e:
        _LOG.exception(f": {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.AUTHENTICATION_ERROR,
                text="Неизвестная ошибка авторизации.",
                field=None,
            )
        )
    if errors:
        return ApiResponse.error_response(
            errors=errors,
            message_text="Ошибка авторизации.",
        )
    return ApiResponse.success_response()


@router.post(
    "/logout",
    tags=["Registration"],
)
async def login_with_phone(
    request: Request,
    response: Response,
) -> ApiResponse:
    errors = []
    try:
        response.delete_cookie(
            "EPS-Auth",
            httponly=request.app.state.config.secure_mode,
            domain=request.app.state.config.domain,
            secure=request.app.state.config.secure_mode,
            samesite="none" if request.app.state.config.secure_mode else "lax",
            )
    except Exception as e:
        _LOG.error(e)
        message_text = "Ошибка logout."
        error = ResponseError(
            code=ApiErrorCodes.AUTHENTICATION_ERROR,
            text=str(e),
        )
        errors.append(error)
        return ApiResponse.error_response(
            errors=errors,
            message_text=message_text,
        )
    return ApiResponse.success_response()
