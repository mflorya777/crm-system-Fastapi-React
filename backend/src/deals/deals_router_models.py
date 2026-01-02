import datetime as dt
from typing import (
    Optional,
    List,
)
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
)

from src.common.common_router_models import ApiResponse
from src.deals.deals_storage_models import (
    DealToGet,
    DealCategoryToGet,
    DealStage,
)


class DealStageRequest(BaseModel):
    """Модель стадии для запроса"""
    id: Optional[UUID] = Field(default=None, description="ID стадии (если обновляем существующую)")
    name: str = Field(..., description="Название стадии")
    order: int = Field(..., description="Порядок стадии в воронке")
    color: Optional[str] = Field(default=None, description="Цвет стадии (hex код)")


class DealStageResponse(BaseModel):
    """Модель стадии для ответа"""
    id: UUID = Field(...)
    name: str = Field(...)
    order: int = Field(...)
    color: Optional[str] = Field(default=None)
    created_at: dt.datetime = Field(...)
    updated_at: Optional[dt.datetime] = Field(default=None)

    @classmethod
    def from_stage(cls, stage: DealStage):
        return cls(
            id=stage.id,
            name=stage.name,
            order=stage.order,
            color=stage.color,
            created_at=stage.created_at,
            updated_at=stage.updated_at,
        )


class CreateDealCategoryParams(BaseModel):
    """Параметры для создания категории"""
    name: str = Field(..., description="Название категории/воронки")
    description: Optional[str] = Field(default=None, description="Описание категории")
    stages: List[DealStageRequest] = Field(default_factory=list, description="Стадии в воронке")


class UpdateDealCategoryParams(BaseModel):
    """Параметры для обновления категории"""
    name: Optional[str] = Field(default=None, description="Название категории")
    description: Optional[str] = Field(default=None, description="Описание категории")
    is_active: Optional[bool] = Field(default=None, description="Активна ли категория")


class UpdateDealCategoryStagesParams(BaseModel):
    """Параметры для обновления стадий в категории"""
    stages: List[DealStageRequest] = Field(..., description="Список стадий")


class DealCategoryResponse(BaseModel):
    """Модель категории для ответа"""
    id: UUID = Field(...)
    name: str = Field(...)
    description: Optional[str] = Field(default=None)
    stages: List[DealStageResponse] = Field(default_factory=list)
    created_at: dt.datetime = Field(...)
    created_by: UUID | None = Field(...)
    updated_at: dt.datetime | None = Field(default=None)
    updated_by: UUID | None = Field(default=None)
    revision: int = Field(...)
    is_active: bool = Field(default=True)

    @classmethod
    def from_category(cls, category: DealCategoryToGet):
        return cls(
            id=category.id,
            name=category.name,
            description=category.description,
            stages=[DealStageResponse.from_stage(stage) for stage in category.stages],
            created_at=category.created_at,
            created_by=category.created_by,
            updated_at=category.updated_at,
            updated_by=category.updated_by,
            revision=category.revision,
            is_active=category.is_active,
        )


class DealCategoryApiResponse(ApiResponse):
    """API ответ с категорией"""
    data: DealCategoryResponse | dict = Field(default={})


class DealCategoriesListApiResponse(ApiResponse):
    """API ответ со списком категорий"""
    data: List[DealCategoryResponse] | dict = Field(default={})


class CreateDealParams(BaseModel):
    """Параметры для создания сделки"""
    category_id: UUID = Field(..., description="ID категории/воронки")
    stage_id: UUID = Field(..., description="ID начальной стадии")
    title: str = Field(..., description="Название сделки")
    description: Optional[str] = Field(default=None, description="Описание сделки")
    amount: Optional[float] = Field(default=None, description="Сумма сделки")
    currency: Optional[str] = Field(default="RUB", description="Валюта сделки")
    client_id: Optional[UUID] = Field(default=None, description="ID клиента")
    responsible_user_id: UUID = Field(..., description="ID ответственного пользователя")
    order: Optional[int] = Field(default=None, description="Порядок сделки в стадии")


class UpdateDealParams(BaseModel):
    """Параметры для обновления сделки"""
    title: Optional[str] = Field(default=None, description="Название сделки")
    description: Optional[str] = Field(default=None, description="Описание сделки")
    amount: Optional[float] = Field(default=None, description="Сумма сделки")
    currency: Optional[str] = Field(default=None, description="Валюта сделки")
    client_id: Optional[UUID] = Field(default=None, description="ID клиента")
    responsible_user_id: Optional[UUID] = Field(default=None, description="ID ответственного пользователя")


class MoveDealToStageParams(BaseModel):
    """Параметры для перемещения сделки в стадию"""
    stage_id: UUID = Field(..., description="ID новой стадии")
    order: Optional[int] = Field(default=None, description="Порядок сделки в новой стадии")


class DealResponse(BaseModel):
    """Модель сделки для ответа"""
    id: UUID = Field(...)
    category_id: UUID = Field(...)
    stage_id: UUID = Field(...)
    title: str = Field(...)
    description: Optional[str] = Field(default=None)
    amount: Optional[float] = Field(default=None)
    currency: Optional[str] = Field(default="RUB")
    client_id: Optional[UUID] = Field(default=None)
    responsible_user_id: UUID = Field(...)
    order: int = Field(default=0, description="Порядок сделки в стадии")
    created_at: dt.datetime = Field(...)
    created_by: UUID | None = Field(...)
    updated_at: dt.datetime | None = Field(default=None)
    updated_by: UUID | None = Field(default=None)
    revision: int = Field(...)
    is_active: bool = Field(default=True)
    closed_at: Optional[dt.datetime] = Field(default=None)

    @classmethod
    def from_deal(cls, deal: DealToGet):
        return cls(
            id=deal.id,
            category_id=deal.category_id,
            stage_id=deal.stage_id,
            title=deal.title,
            description=deal.description,
            amount=deal.amount,
            currency=deal.currency,
            client_id=deal.client_id,
            responsible_user_id=deal.responsible_user_id,
            order=deal.order,
            created_at=deal.created_at,
            created_by=deal.created_by,
            updated_at=deal.updated_at,
            updated_by=deal.updated_by,
            revision=deal.revision,
            is_active=deal.is_active,
            closed_at=deal.closed_at,
        )


class DealApiResponse(ApiResponse):
    """API ответ со сделкой"""
    data: DealResponse | dict = Field(default={})


class DealsListApiResponse(ApiResponse):
    """API ответ со списком сделок"""
    data: List[DealResponse] | dict = Field(default={})


class DealsCountResponse(BaseModel):
    """Модель для ответа с количеством сделок"""
    count: int = Field(..., description="Количество сделок")
    category_id: UUID = Field(..., description="ID категории")


class DealsCountApiResponse(ApiResponse):
    """API ответ с количеством сделок"""
    data: DealsCountResponse | dict = Field(default={})
