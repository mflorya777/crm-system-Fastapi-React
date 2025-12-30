import logging

from fastapi import (
    APIRouter,
    Depends,
    Request,
)

from src.auth.auth_cookie import CookieAuthMiddleware
from src.common.common_router_models import (
    ResponseError,
    ApiResponse,
    ApiErrorCodes,
)
from src.users.users_manager import (
    UsersManager,
    NoSuchUserError,
)
from src.users.users_router_models import (
    UserApiResponse,
    UserResponse,
)


_LOG = logging.getLogger("uvicorn.error")
router = APIRouter()


@router.post(
    "/sign/verify-sign",
    tags=["User"],
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def verify_sign(
    request: Request,
    code: str,
    entity_id: str,
) -> ApiResponse:
    users_manager: UsersManager = request.app.state.users_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        await users_manager.update_user_info(
            actor_user_id=user_id,
            user_id=user_id,
            name=user_id.name,
            soname=user_id.soname,
            father_name=user_id.father_name,
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
    user = await users_manager.get_user(
        user_id,
        user_id,
    )
    user_model = UserResponse.from_user(
        user,
    )
    return UserApiResponse.success_response(
        data=user_model,
    )
