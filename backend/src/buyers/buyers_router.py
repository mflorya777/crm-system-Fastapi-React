import logging
from typing import Optional
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
from src.buyers.buyers_manager import (
    BuyersManager,
    NoSuchBuyerError,
    NoSuchBuyerCategoryError,
    BuyersManagerException,
    InvalidStageError,
)
from src.buyers.buyers_router_models import (
    CreateBuyerCategoryParams,
    UpdateBuyerCategoryParams,
    UpdateBuyerCategoryStagesParams,
    BuyerCategoryResponse,
    BuyerCategoryApiResponse,
    BuyerCategoriesListApiResponse,
    CreateBuyerParams,
    UpdateBuyerParams,
    MoveBuyerToStageParams,
    BuyerResponse,
    BuyerApiResponse,
    BuyersListApiResponse,
    BuyersCountResponse,
    BuyersCountApiResponse,
    BuyersSumResponse,
    BuyersSumApiResponse,
)
from src.buyers.buyers_storage_models import BuyerStage


_LOG = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/buyers",
    tags=["Buyers"],
)


@router.post(
    "/categories",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def create_category(
    request: Request,
    category_data: CreateBuyerCategoryParams = Body(...),
) -> BuyerCategoryApiResponse | None:
    """Создать новую категорию покупателей (воронку)"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        stages = [
            BuyerStage(
                name=stage.name,
                order=stage.order,
                color=stage.color,
            )
            for stage in category_data.stages
        ]
        
        category = await buyers_manager.create_category(
            actor_id=user_id,
            name=category_data.name,
            description=category_data.description,
            stages=stages,
        )
        category_response = BuyerCategoryResponse.from_category(category)

        return BuyerCategoryApiResponse.success_response(
            data=category_response,
        )
    except BuyersManagerException as e:
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
        return BuyerCategoryApiResponse.error_response(
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
) -> BuyerCategoriesListApiResponse | None:
    """Получить все категории покупателей"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        categories = await buyers_manager.get_all_categories(
            actor_id=user_id,
            active_only=active_only,
        )
        categories_response = [BuyerCategoryResponse.from_category(cat) for cat in categories]

        return BuyerCategoriesListApiResponse.success_response(
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
        return BuyerCategoriesListApiResponse.error_response(
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
) -> BuyerCategoryApiResponse | None:
    """Получить категорию по ID"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        category = await buyers_manager.get_category(
            actor_id=user_id,
            category_id=category_id,
        )
        category_response = BuyerCategoryResponse.from_category(category)

        return BuyerCategoryApiResponse.success_response(
            data=category_response,
        )
    except NoSuchBuyerCategoryError as e:
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
        return BuyerCategoryApiResponse.error_response(
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
    category_data: UpdateBuyerCategoryParams = Body(...),
) -> BuyerCategoryApiResponse | None:
    """Обновить категорию"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        category = await buyers_manager.update_category(
            actor_id=user_id,
            category_id=category_id,
            name=category_data.name,
            description=category_data.description,
            is_active=category_data.is_active,
        )
        category_response = BuyerCategoryResponse.from_category(category)

        return BuyerCategoryApiResponse.success_response(
            data=category_response,
        )
    except NoSuchBuyerCategoryError as e:
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
        return BuyerCategoryApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при обновлении категории.",
        )


@router.delete(
    "/categories/{category_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def delete_category(
    request: Request,
    category_id: UUID,
) -> BuyerCategoryApiResponse | None:
    """Мягкое удаление категории (установка is_active = False)"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        await buyers_manager.delete_category(
            actor_id=user_id,
            category_id=category_id,
        )

        return BuyerCategoryApiResponse.success_response(
            message_text="Категория успешно удалена.",
        )
    except NoSuchBuyerCategoryError as e:
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
        return BuyerCategoryApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при удалении категории.",
        )


@router.put(
    "/categories/{category_id}/stages",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def update_category_stages(
    request: Request,
    category_id: UUID,
    stages_data: UpdateBuyerCategoryStagesParams = Body(...),
) -> BuyerCategoryApiResponse | None:
    """Обновить стадии в категории (воронке)"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        stages = []
        for stage in stages_data.stages:
            stage_data = {
                "name": stage.name,
                "order": stage.order,
                "color": stage.color,
            }
            # Если id передан, используем его (обновление существующей стадии)
            if stage.id:
                stage_data["id"] = stage.id
            stages.append(BuyerStage(**stage_data))
        
        category = await buyers_manager.update_category_stages(
            actor_id=user_id,
            category_id=category_id,
            stages=stages,
        )
        category_response = BuyerCategoryResponse.from_category(category)

        return BuyerCategoryApiResponse.success_response(
            data=category_response,
        )
    except NoSuchBuyerCategoryError as e:
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
        return BuyerCategoryApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при обновлении стадий.",
        )


@router.delete(
    "/categories/{category_id}/stages/{stage_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def delete_stage(
    request: Request,
    category_id: UUID,
    stage_id: UUID,
) -> BuyerCategoryApiResponse | None:
    """Мягкое удаление стадии (установка is_active = False)"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        await buyers_manager.delete_stage(
            actor_id=user_id,
            category_id=category_id,
            stage_id=stage_id,
        )

        return BuyerCategoryApiResponse.success_response(
            message_text="Стадия успешно удалена.",
        )
    except NoSuchBuyerCategoryError as e:
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
        return BuyerCategoryApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при удалении стадии.",
        )


@router.post(
    "",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def create_buyer(
    request: Request,
    buyer_data: CreateBuyerParams = Body(...),
) -> BuyerApiResponse | None:
    """Создать новую покупателя"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        buyer = await buyers_manager.create_buyer(
            actor_id=user_id,
            category_id=buyer_data.category_id,
            stage_id=buyer_data.stage_id,
            name=buyer_data.name,
            email=buyer_data.email,
            phone=buyer_data.phone,
            company=buyer_data.company,
            address=buyer_data.address,
            notes=buyer_data.notes,
            potential_value=buyer_data.potential_value,
            responsible_user_id=buyer_data.responsible_user_id,
            order=buyer_data.order,
        )
        buyer_response = BuyerResponse.from_buyer(buyer)

        return BuyerApiResponse.success_response(
            data=buyer_response,
        )
    except NoSuchBuyerCategoryError as e:
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
    except BuyersManagerException as e:
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
        return BuyerApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при создании покупатели.",
        )


@router.get(
    "/{buyer_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_buyer(
    request: Request,
    buyer_id: UUID,
) -> BuyerApiResponse | None:
    """Получить покупателя по ID"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        buyer = await buyers_manager.get_buyer(
            actor_id=user_id,
            buyer_id=buyer_id,
        )
        buyer_response = BuyerResponse.from_buyer(buyer)

        return BuyerApiResponse.success_response(
            data=buyer_response,
        )
    except NoSuchBuyerError as e:
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
        return BuyerApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при получении покупатели.",
        )


@router.get(
    "/category/{category_id}/buyers",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_buyers_by_category(
    request: Request,
    category_id: UUID,
    active_only: bool = Query(
        default=True,
        description="Только активные покупатели",
    ),
    search: Optional[str] = Query(
        default=None,
        description="Поиск по названию покупатели",
    ),
    stage_id: Optional[UUID] = Query(
        default=None,
        description="Фильтр по ID стадии",
    ),
    sort_field: str = Query(
        default="order",
        description="Поле сортировки: order, created_at, value, name",
    ),
    sort_direction: str = Query(
        default="asc",
        description="Направление сортировки: asc или desc",
    ),
) -> BuyersListApiResponse | None:
    """Получить все покупатели в категории с поддержкой поиска, фильтрации и сортировки"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        buyers = await buyers_manager.get_buyers_by_category(
            actor_id=user_id,
            category_id=category_id,
            active_only=active_only,
            search=search,
            stage_id=stage_id,
            sort_field=sort_field,
            sort_direction=sort_direction,
        )
        buyers_response = [BuyerResponse.from_buyer(buyer) for buyer in buyers]

        return BuyersListApiResponse.success_response(
            data=buyers_response,
        )
    except NoSuchBuyerCategoryError as e:
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
        return BuyersListApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при получении покупателей.",
        )


@router.get(
    "/category/{category_id}/buyers/count",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def count_buyers_by_category(
    request: Request,
    category_id: UUID,
    active_only: bool = Query(
        default=True,
        description="Только активные покупатели",
    ),
) -> BuyersCountApiResponse | None:
    """Получить количество покупателей в категории"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        count = await buyers_manager.count_buyers_by_category(
            actor_id=user_id,
            category_id=category_id,
            active_only=active_only,
        )
        count_response = BuyersCountResponse(
            count=count,
            category_id=category_id,
        )

        return BuyersCountApiResponse.success_response(
            data=count_response,
        )
    except NoSuchBuyerCategoryError as e:
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
        return BuyersCountApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при подсчете покупателей.",
        )


@router.get(
    "/category/{category_id}/buyers/sum",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def sum_buyers_by_category(
    request: Request,
    category_id: UUID,
    active_only: bool = Query(
        default=True,
        description="Только активные покупатели",
    ),
) -> BuyersSumApiResponse | None:
    """Получить сумму потенциальной стоимости всех покупателей в категории"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        total_amount = await buyers_manager.sum_buyers_amount_by_category(
            actor_id=user_id,
            category_id=category_id,
            active_only=active_only,
        )
        sum_response = BuyersSumResponse(
            total_amount=total_amount,
            category_id=category_id,
        )

        return BuyersSumApiResponse.success_response(
            data=sum_response,
        )
    except NoSuchBuyerCategoryError as e:
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
        return BuyersSumApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при суммировании покупателей.",
        )


@router.get(
    "/user/{user_id}/buyers",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_buyers_by_responsible_user(
    request: Request,
    user_id: UUID,
    active_only: bool = Query(
        default=True,
        description="Только активные покупатели",
    ),
) -> BuyersListApiResponse | None:
    """Получить все покупатели ответственного пользователя"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    actor_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        buyers = await buyers_manager.get_buyers_by_responsible_user(
            actor_id=actor_id,
            user_id=user_id,
            active_only=active_only,
        )
        buyers_response = [BuyerResponse.from_buyer(buyer) for buyer in buyers]

        return BuyersListApiResponse.success_response(
            data=buyers_response,
        )
    except BuyersManagerException as e:
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
        return BuyersListApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при получении покупателей.",
        )


@router.patch(
    "/{buyer_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def update_buyer(
    request: Request,
    buyer_id: UUID,
    buyer_data: UpdateBuyerParams = Body(...),
) -> BuyerApiResponse | None:
    """Обновить покупателя"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        buyer = await buyers_manager.update_buyer(
            actor_id=user_id,
            buyer_id=buyer_id,
            name=buyer_data.name,
            email=buyer_data.email,
            phone=buyer_data.phone,
            company=buyer_data.company,
            address=buyer_data.address,
            notes=buyer_data.notes,
            potential_value=buyer_data.potential_value,
            responsible_user_id=buyer_data.responsible_user_id,
        )
        buyer_response = BuyerResponse.from_buyer(buyer)

        return BuyerApiResponse.success_response(
            data=buyer_response,
        )
    except NoSuchBuyerError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except BuyersManagerException as e:
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
        return BuyerApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при обновлении покупатели.",
        )


@router.delete(
    "/{buyer_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def delete_buyer(
    request: Request,
    buyer_id: UUID,
) -> BuyerApiResponse | None:
    """Мягкое удаление покупатели (установка is_active = False)"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        await buyers_manager.delete_buyer(
            actor_id=user_id,
            buyer_id=buyer_id,
        )

        return BuyerApiResponse.success_response(
            message_text="Покупатель успешно удалена.",
        )
    except NoSuchBuyerError as e:
        _LOG.error(e)
        error = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=str(e),
        )
        errors.append(error)
    except BuyersManagerException as e:
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
        return BuyerApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при удалении покупатели.",
        )


@router.post(
    "/{buyer_id}/move-to-stage",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def move_buyer_to_stage(
    request: Request,
    buyer_id: UUID,
    move_data: MoveBuyerToStageParams = Body(...),
) -> BuyerApiResponse | None:
    """Переместить покупателя в другую стадию"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        buyer = await buyers_manager.move_buyer_to_stage(
            actor_id=user_id,
            buyer_id=buyer_id,
            new_stage_id=move_data.stage_id,
            order=move_data.order,
        )
        buyer_response = BuyerResponse.from_buyer(buyer)

        return BuyerApiResponse.success_response(
            data=buyer_response,
        )
    except NoSuchBuyerError as e:
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
        return BuyerApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при перемещении покупатели.",
        )


@router.post(
    "/{buyer_id}/close",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def close_buyer(
    request: Request,
    buyer_id: UUID,
) -> BuyerApiResponse | None:
    """Закрыть покупателя"""
    buyers_manager: BuyersManager = request.app.state.buyers_manager
    user_id = request.state.jwt_payload["user_id"]

    errors = []
    try:
        buyer = await buyers_manager.close_buyer(
            actor_id=user_id,
            buyer_id=buyer_id,
        )
        buyer_response = BuyerResponse.from_buyer(buyer)

        return BuyerApiResponse.success_response(
            data=buyer_response,
        )
    except NoSuchBuyerError as e:
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
        return BuyerApiResponse.error_response(
            errors=errors,
            message_text="Ошибка при закрытии покупатели.",
        )
