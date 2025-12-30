import logging

from fastapi import (
    Body,
    APIRouter,
    status,
    Depends,
    Request,
    Response,
)

from src.auth.auth_cookie import CookieAuthMiddleware
from src.auth.auth_handler import sign_jwt
from src.authorization.authorization_router_models import ApproveRegistrationCodeParams
from src.common.common_router_models import (
    ResponseError,
    ApiResponse,
    ApiErrorCodes,
)
from src.notifications.notifications_manager import NotificationsManagerException
from .users_manager import (
    UsersManager,
    NoSuchUserError,
    AuthenticationError,
)
from .users_router_models import (
    ChangeUserInfoParams,
    ChangeUserPasswordParams,
    ChangeEmailParams,
    ChangePhoneParams,
    UserResponse,
    UserApiResponse,
)


_LOG = logging.getLogger("uvicorn.error")
router = APIRouter()


@router.get(
    "/me",
    tags=["Registration", "User"],
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_me(
    request: Request,
    response: Response,
) -> UserApiResponse | ApiResponse:
    users_manager: UsersManager = request.app.state.users_manager

    errors = []
    try:
        user_id = request.state.jwt_payload["user_id"]
        user = await users_manager.get_user(user_id, user_id)
        token = sign_jwt(
            user_id=user.id.hex,
            is_backoffice_user=user.is_backoffice_user,
        )
        response.set_cookie(
            "EPS-Auth",
            value=token,
            httponly=request.app.state.config.secure_mode,
            domain=request.app.state.config.domain
            if request.app.state.config.secure_mode
            else None,
            secure=request.app.state.config.secure_mode,
            samesite="none" if request.app.state.config.secure_mode else "lax",
        )
        user_model = UserResponse.from_user(user)
        _LOG.info(f"Получен пользователь: {user_model}")
        return UserApiResponse.success_response(data=user_model)
    except Exception as e:
        _LOG.error(e)
        message_text = "Ошибка получения пользователя."
        error = ResponseError(
            code=ApiErrorCodes.USER_BASE_ERROR,
            text=str(e),
        )
        errors.append(error)
        return UserApiResponse.error_response(
            errors=errors,
            message_text=message_text,
        )


@router.post(
    "/approve-email",
    tags=["User"],
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def approve_email(
    request: Request,
    approve_email_args: ApproveRegistrationCodeParams = Body(...),
) -> ApiResponse:
    users_manager: UsersManager = request.app.state.users_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        await users_manager.approve_email(
            user_id,
            user_id,
            approve_email_args.code,
        )
    except NoSuchUserError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_NOT_FOUND_ERROR,
            text=str(e),
        )
        errors.append(error)
    except AuthenticationError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.AUTHENTICATION_ERROR,
            text=str(e),
        )
        errors.append(error)

    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_BASE_ERROR,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)
    if errors:
        return ApiResponse.error_response(
            errors=errors,
            message_text="Ошибка подтверждения email.",
        )
    return ApiResponse.success_response()


@router.post(
    "/approve-phone",
    tags=["User"],
    dependencies=[Depends(CookieAuthMiddleware())],
    responses={
        status.HTTP_200_OK: {"message": "OK"},
        status.HTTP_400_BAD_REQUEST: {"message": "Ошибка подтверждения телефона."},
    },
)
async def approve_phone(
    request: Request,
    approve_phone_args: ApproveRegistrationCodeParams = Body(...),
):
    users_manager: UsersManager = request.app.state.users_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        await users_manager.approve_phone(user_id, user_id, approve_phone_args.code)
    except NoSuchUserError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_NOT_FOUND_ERROR,
            text=str(e),
        )
        errors.append(error)
    except AuthenticationError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.AUTHENTICATION_ERROR,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_BASE_ERROR,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)
    if errors:
        return ApiResponse.error_response(
            errors=errors,
            message_text="Ошибка подтверждения телефона.",
        )
    return ApiResponse.success_response()


@router.put(
    "/user/update-info",
    tags=["User"],
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def update_user_info(
    request: Request,
    user_info_params: ChangeUserInfoParams = Body(...),
) -> UserApiResponse | ApiResponse:
    users_manager: UsersManager = request.app.state.users_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        await users_manager.update_user_info(
            actor_user_id=user_id,
            user_id=user_id,
            name=user_info_params.name,
            soname=user_info_params.soname,
            father_name=user_info_params.father_name,
        )
    except NoSuchUserError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_NOT_FOUND_ERROR,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_BASE_ERROR,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)
    if errors:
        return UserApiResponse.error_response(
            errors=errors,
            message_text="Ошибка подтверждения телефона.",
        )
    user = await users_manager.get_user(user_id, user_id)
    user_model = UserResponse.from_user(user)
    return UserApiResponse.success_response(data=user_model)


@router.put(
    "/user/update-email",
    tags=["User"],
    dependencies=[Depends(CookieAuthMiddleware())]
)
async def update_user_email(
    request: Request,
    email_params: ChangeEmailParams = Body(...),
) -> ApiResponse:
    users_manager: UsersManager = request.app.state.users_manager
    user_id = request.state.jwt_payload["user_id"]
    errors = []
    try:
        await users_manager.update_email(
            actor_user_id=user_id,
            user_id=user_id,
            email=email_params.email,
        )
    except NoSuchUserError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_NOT_FOUND_ERROR,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_BASE_ERROR,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)
    if errors:
        return ApiResponse.error_response(
            errors=errors,
            message_text="Ошибка подтверждения смены email.",
        )
    return ApiResponse.success_response()


@router.put(
    "/user/update-phone",
    tags=["User"],
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def update_user_phone(
    request: Request,
    phone_params: ChangePhoneParams = Body(...),
) -> ApiResponse:
    users_manager: UsersManager = request.app.state.users_manager
    user_id = request.state.jwt_payload["user_id"]
    errors = []
    try:
        await users_manager.update_phone(
            actor_user_id=user_id,
            user_id=user_id,
            phone=phone_params.phone,
        )
    except NoSuchUserError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_NOT_FOUND_ERROR,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_BASE_ERROR,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)
    if errors:
        return ApiResponse.error_response(
            errors=errors,
            message_text="Ошибка подтверждения смены телефона.",
        )
    return ApiResponse.success_response()


@router.put(
    "/user/update-password",
    tags=["User"],
    dependencies=[Depends(CookieAuthMiddleware())]
)
async def update_user_password(
    request: Request,
    password_params: ChangeUserPasswordParams = Body(...),
) -> ApiResponse:
    users_manager: UsersManager = request.app.state.users_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        await users_manager.update_password(
            actor_user_id=user_id,
            user_id=user_id,
            new_password=password_params.new_password,
            old_password=password_params.old_password,
        )
    except NoSuchUserError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_NOT_FOUND_ERROR,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_BASE_ERROR,
            text=f"Ошибка при попытке смены пароля. {str(e)}",
        )
        errors.append(error)
    if errors:
        return ApiResponse.error_response(
            errors=errors,
            message_text="Ошибка подтверждения смены телефона.",
        )
    return ApiResponse.success_response()


@router.post(
    "/user/send-approve-email-code",
    tags=["User"],
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def send_approve_email_code(
    request: Request,
) -> ApiResponse:
    users_manager: UsersManager = request.app.state.users_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        await users_manager.send_approve_email_code(user_id)
    except NotificationsManagerException as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.NOTIFICATIONS_MANAGER_ERROR,
            text=str(e),
        )
        errors.append(error)
    except NoSuchUserError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_NOT_FOUND_ERROR,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_BASE_ERROR,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)
    if errors:
        return ApiResponse.error_response(
            errors=errors,
            message_text="Ошибка отправки кода подтверждения.",
        )
    return ApiResponse.success_response(
        message_text="Код подтверждения отправлен.",
    )


@router.post(
    "/user/send-approve-phone-code",
    tags=["User"],
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def send_approve_phone_code(
    request: Request,
) -> ApiResponse:
    users_manager: UsersManager = request.app.state.users_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        await users_manager.send_approve_phone_code(user_id)
    except NotificationsManagerException as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.NOTIFICATIONS_MANAGER_ERROR,
            text=str(e),
        )
        errors.append(error)
    except NoSuchUserError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_NOT_FOUND_ERROR,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.USER_BASE_ERROR,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)
    if errors:
        return ApiResponse.error_response(
            errors=errors,
            message_text="Ошибка отправки кода подтверждения.",
        )
    return ApiResponse.success_response(
        message_text="Код подтверждения отправлен.",
    )
