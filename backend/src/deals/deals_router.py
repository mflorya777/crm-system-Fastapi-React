import logging
from uuid import UUID

from fastapi import (
    APIRouter,
    Body,
    Depends,
    Request,
    Query,
)

from src.auth.auth_cookie import CookieAuthMiddleware
from src.common.common_router_models import (
    ResponseError,
    ApiErrorCodes,
)
from src.deals.deals_manager import (
    DealsManager,
    NoSuchDealError,
    NoSuchDealCategoryError,
    DealsManagerException,
    InvalidStageError,
)
from src.deals.deals_router_models import (
    CreateDealCategoryParams,
    UpdateDealCategoryParams,
    UpdateDealCategoryStagesParams,
    DealCategoryResponse,
    DealCategoryApiResponse,
    DealCategoriesListApiResponse,
    CreateDealParams,
    UpdateDealParams,
    MoveDealToStageParams,
    DealResponse,
    DealApiResponse,
    DealsListApiResponse,
)
from src.deals.deals_storage_models import DealStage


_LOG = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/deals",
    tags=["Deals"],
)


@router.post(
    "/categories",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def create_category(
    request: Request,
    category_data: CreateDealCategoryParams = Body(...),
) -> DealCategoryApiResponse | None:
    """Создать новую категорию сделок (воронку)"""
    deals_manager: DealsManager = request.app.state.deals_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        stages = [
            DealStage(
                name=stage.name,
                order=stage.order,
                color=stage.color,
            )
            for stage in category_data.stages
        ]
        
        category = await deals_manager.create_category(
            actor_id=user_id,
            name=category_data.name,
            description=category_data.description,
            stages=stages,
        )
        category_response = DealCategoryResponse.from_category(category)

        return DealCategoryApiResponse.success_response(
            data=category_response,
        )
    except DealsManagerException as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except InvalidStageError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)

    if errors:
        return DealCategoryApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при создании категории.",
        )


@router.get(
    "/categories",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_all_categories(
    request: Request,
    active_only: bool = Query(
        default=False,
        description="Только активные категории",
    ),
) -> DealCategoriesListApiResponse | None:
    """Получить все категории сделок"""
    deals_manager: DealsManager = request.app.state.deals_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        categories = await deals_manager.get_all_categories(
            actor_id=user_id,
            active_only=active_only,
        )
        categories_response = [DealCategoryResponse.from_category(cat) for cat in categories]

        return DealCategoriesListApiResponse.success_response(
            data=categories_response,
        )
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)

    if errors:
        return DealCategoriesListApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при получении категорий.",
        )


@router.get(
    "/categories/{category_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_category(
    request: Request,
    category_id: UUID,
) -> DealCategoryApiResponse | None:
    """Получить категорию по ID"""
    deals_manager: DealsManager = request.app.state.deals_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        category = await deals_manager.get_category(
            actor_id=user_id,
            category_id=category_id,
        )
        category_response = DealCategoryResponse.from_category(category)

        return DealCategoryApiResponse.success_response(
            data=category_response,
        )
    except NoSuchDealCategoryError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)

    if errors:
        return DealCategoryApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при получении категории.",
        )


@router.patch(
    "/categories/{category_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def update_category(
    request: Request,
    category_id: UUID,
    category_data: UpdateDealCategoryParams = Body(...),
) -> DealCategoryApiResponse | None:
    """Обновить категорию"""
    deals_manager: DealsManager = request.app.state.deals_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        category = await deals_manager.update_category(
            actor_id=user_id,
            category_id=category_id,
            name=category_data.name,
            description=category_data.description,
            is_active=category_data.is_active,
        )
        category_response = DealCategoryResponse.from_category(category)

        return DealCategoryApiResponse.success_response(
            data=category_response,
        )
    except NoSuchDealCategoryError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)

    if errors:
        return DealCategoryApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при обновлении категории.",
        )


@router.put(
    "/categories/{category_id}/stages",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def update_category_stages(
    request: Request,
    category_id: UUID,
    stages_data: UpdateDealCategoryStagesParams = Body(...),
) -> DealCategoryApiResponse | None:
    """Обновить стадии в категории (воронке)"""
    deals_manager: DealsManager = request.app.state.deals_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        stages = [
            DealStage(
                name=stage.name,
                order=stage.order,
                color=stage.color,
            )
            for stage in stages_data.stages
        ]
        
        category = await deals_manager.update_category_stages(
            actor_id=user_id,
            category_id=category_id,
            stages=stages,
        )
        category_response = DealCategoryResponse.from_category(category)

        return DealCategoryApiResponse.success_response(
            data=category_response,
        )
    except NoSuchDealCategoryError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except InvalidStageError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)

    if errors:
        return DealCategoryApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при обновлении стадий.",
        )


@router.post(
    "",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def create_deal(
    request: Request,
    deal_data: CreateDealParams = Body(...),
) -> DealApiResponse | None:
    """Создать новую сделку"""
    deals_manager: DealsManager = request.app.state.deals_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        deal = await deals_manager.create_deal(
            actor_id=user_id,
            category_id=deal_data.category_id,
            stage_id=deal_data.stage_id,
            title=deal_data.title,
            description=deal_data.description,
            amount=deal_data.amount,
            currency=deal_data.currency,
            client_id=deal_data.client_id,
            responsible_user_id=deal_data.responsible_user_id,
            order=deal_data.order,
        )
        deal_response = DealResponse.from_deal(deal)

        return DealApiResponse.success_response(
            data=deal_response,
        )
    except NoSuchDealCategoryError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except InvalidStageError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except DealsManagerException as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)

    if errors:
        return DealApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при создании сделки.",
        )


@router.get(
    "/{deal_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_deal(
    request: Request,
    deal_id: UUID,
) -> DealApiResponse | None:
    """Получить сделку по ID"""
    deals_manager: DealsManager = request.app.state.deals_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        deal = await deals_manager.get_deal(
            actor_id=user_id,
            deal_id=deal_id,
        )
        deal_response = DealResponse.from_deal(deal)

        return DealApiResponse.success_response(
            data=deal_response,
        )
    except NoSuchDealError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)

    if errors:
        return DealApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при получении сделки.",
        )


@router.get(
    "/category/{category_id}/deals",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_deals_by_category(
    request: Request,
    category_id: UUID,
    active_only: bool = Query(
        default=True,
        description="Только активные сделки",
    ),
) -> DealsListApiResponse | None:
    """Получить все сделки в категории"""
    deals_manager: DealsManager = request.app.state.deals_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        deals = await deals_manager.get_deals_by_category(
            actor_id=user_id,
            category_id=category_id,
            active_only=active_only,
        )
        deals_response = [DealResponse.from_deal(deal) for deal in deals]

        return DealsListApiResponse.success_response(
            data=deals_response,
        )
    except NoSuchDealCategoryError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)

    if errors:
        return DealsListApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при получении сделок.",
        )


@router.get(
    "/user/{user_id}/deals",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_deals_by_responsible_user(
    request: Request,
    user_id: UUID,
    active_only: bool = Query(
        default=True,
        description="Только активные сделки",
    ),
) -> DealsListApiResponse | None:
    """Получить все сделки ответственного пользователя"""
    deals_manager: DealsManager = request.app.state.deals_manager
    actor_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        deals = await deals_manager.get_deals_by_responsible_user(
            actor_id=actor_id,
            user_id=user_id,
            active_only=active_only,
        )
        deals_response = [DealResponse.from_deal(deal) for deal in deals]

        return DealsListApiResponse.success_response(
            data=deals_response,
        )
    except DealsManagerException as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)

    if errors:
        return DealsListApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при получении сделок.",
        )


@router.patch(
    "/{deal_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def update_deal(
    request: Request,
    deal_id: UUID,
    deal_data: UpdateDealParams = Body(...),
) -> DealApiResponse | None:
    """Обновить сделку"""
    deals_manager: DealsManager = request.app.state.deals_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        deal = await deals_manager.update_deal(
            actor_id=user_id,
            deal_id=deal_id,
            title=deal_data.title,
            description=deal_data.description,
            amount=deal_data.amount,
            currency=deal_data.currency,
            client_id=deal_data.client_id,
            responsible_user_id=deal_data.responsible_user_id,
        )
        deal_response = DealResponse.from_deal(deal)

        return DealApiResponse.success_response(
            data=deal_response,
        )
    except NoSuchDealError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except DealsManagerException as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)

    if errors:
        return DealApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при обновлении сделки.",
        )


@router.post(
    "/{deal_id}/move-to-stage",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def move_deal_to_stage(
    request: Request,
    deal_id: UUID,
    move_data: MoveDealToStageParams = Body(...),
) -> DealApiResponse | None:
    """Переместить сделку в другую стадию"""
    deals_manager: DealsManager = request.app.state.deals_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        deal = await deals_manager.move_deal_to_stage(
            actor_id=user_id,
            deal_id=deal_id,
            new_stage_id=move_data.stage_id,
            order=move_data.order,
        )
        deal_response = DealResponse.from_deal(deal)

        return DealApiResponse.success_response(
            data=deal_response,
        )
    except NoSuchDealError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except InvalidStageError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)

    if errors:
        return DealApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при перемещении сделки.",
        )


@router.post(
    "/{deal_id}/close",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def close_deal(
    request: Request,
    deal_id: UUID,
) -> DealApiResponse | None:
    """Закрыть сделку"""
    deals_manager: DealsManager = request.app.state.deals_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        deal = await deals_manager.close_deal(
            actor_id=user_id,
            deal_id=deal_id,
        )
        deal_response = DealResponse.from_deal(deal)

        return DealApiResponse.success_response(
            data=deal_response,
        )
    except NoSuchDealError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except Exception as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=f"Неизвестная ошибка. {str(e)}",
        )
        errors.append(error)

    if errors:
        return DealApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при закрытии сделки.",
        )
