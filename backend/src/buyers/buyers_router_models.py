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
from src.buyers.buyers_storage_models import (
    BuyerToGet,
    BuyerCategoryToGet,
    BuyerStage,
)


class BuyerStageRequest(BaseModel):
    """Модель стадии для запроса"""
    id: Optional[UUID] = Field(default=None, description="ID стадии (если обновляем существующую)")
    name: str = Field(..., description="Название стадии")
    order: int = Field(..., description="Порядок стадии в воронке")
    color: Optional[str] = Field(default=None, description="Цвет стадии (hex код)")


class BuyerStageResponse(BaseModel):
    """Модель стадии для ответа"""
    id: UUID = Field(...)
    name: str = Field(...)
    order: int = Field(...)
    color: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: dt.datetime = Field(...)
    updated_at: Optional[dt.datetime] = Field(default=None)

    @classmethod
    def from_stage(cls, stage: BuyerStage):
        return cls(
            id=stage.id,
            name=stage.name,
            order=stage.order,
            color=stage.color,
            is_active=stage.is_active,
            created_at=stage.created_at,
            updated_at=stage.updated_at,
        )


class CreateBuyerCategoryParams(BaseModel):
    """Параметры для создания категории"""
    name: str = Field(..., description="Название категории/воронки")
    description: Optional[str] = Field(default=None, description="Описание категории")
    stages: List[BuyerStageRequest] = Field(default_factory=list, description="Стадии в воронке")


class UpdateBuyerCategoryParams(BaseModel):
    """Параметры для обновления категории"""
    name: Optional[str] = Field(default=None, description="Название категории")
    description: Optional[str] = Field(default=None, description="Описание категории")
    is_active: Optional[bool] = Field(default=None, description="Активна ли категория")


class UpdateBuyerCategoryStagesParams(BaseModel):
    """Параметры для обновления стадий в категории"""
    stages: List[BuyerStageRequest] = Field(..., description="Список стадий")


class BuyerCategoryResponse(BaseModel):
    """Модель категории для ответа"""
    id: UUID = Field(...)
    name: str = Field(...)
    description: Optional[str] = Field(default=None)
    stages: List[BuyerStageResponse] = Field(default_factory=list)
    created_at: dt.datetime = Field(...)
    created_by: UUID | None = Field(...)
    updated_at: dt.datetime | None = Field(default=None)
    updated_by: UUID | None = Field(default=None)
    revision: int = Field(...)
    is_active: bool = Field(default=True)

    @classmethod
    def from_category(cls, category: BuyerCategoryToGet):
        return cls(
            id=category.id,
            name=category.name,
            description=category.description,
            stages=[BuyerStageResponse.from_stage(stage) for stage in category.stages],
            created_at=category.created_at,
            created_by=category.created_by,
            updated_at=category.updated_at,
            updated_by=category.updated_by,
            revision=category.revision,
            is_active=category.is_active,
        )


class BuyerCategoryApiResponse(ApiResponse):
    """API ответ с категорией"""
    data: BuyerCategoryResponse | dict = Field(default={})


class BuyerCategoriesListApiResponse(ApiResponse):
    """API ответ со списком категорий"""
    data: List[BuyerCategoryResponse] | dict = Field(default={})


class CreateBuyerParams(BaseModel):
    """Параметры для создания покупателя"""
    category_id: UUID = Field(..., description="ID категории/воронки")
    stage_id: UUID = Field(..., description="ID начальной стадии")
    name: str = Field(..., description="Имя покупателя")
    email: Optional[str] = Field(default=None, description="Email покупателя")
    phone: Optional[str] = Field(default=None, description="Телефон покупателя")
    company: Optional[str] = Field(default=None, description="Компания покупателя")
    address: Optional[str] = Field(default=None, description="Адрес покупателя")
    notes: Optional[str] = Field(default=None, description="Заметки о покупателе")
    potential_value: Optional[float] = Field(default=None, description="Потенциальная стоимость")
    responsible_user_id: UUID = Field(..., description="ID ответственного пользователя")
    order: Optional[int] = Field(default=None, description="Порядок покупателя в стадии")


class UpdateBuyerParams(BaseModel):
    """Параметры для обновления покупателя"""
    name: Optional[str] = Field(default=None, description="Имя покупателя")
    email: Optional[str] = Field(default=None, description="Email покупателя")
    phone: Optional[str] = Field(default=None, description="Телефон покупателя")
    company: Optional[str] = Field(default=None, description="Компания покупателя")
    address: Optional[str] = Field(default=None, description="Адрес покупателя")
    notes: Optional[str] = Field(default=None, description="Заметки о покупателе")
    potential_value: Optional[float] = Field(default=None, description="Потенциальная стоимость")
    responsible_user_id: Optional[UUID] = Field(default=None, description="ID ответственного пользователя")


class MoveBuyerToStageParams(BaseModel):
    """Параметры для перемещения покупателя в стадию"""
    stage_id: UUID = Field(..., description="ID новой стадии")
    order: Optional[int] = Field(default=None, description="Порядок покупателя в новой стадии")


class BuyerResponse(BaseModel):
    """Модель покупателя для ответа"""
    id: UUID = Field(...)
    category_id: UUID = Field(...)
    stage_id: UUID = Field(...)
    name: str = Field(...)
    email: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    company: Optional[str] = Field(default=None)
    address: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    potential_value: Optional[float] = Field(default=None)
    responsible_user_id: UUID = Field(...)
    order: int = Field(default=0, description="Порядок покупателя в стадии")
    created_at: dt.datetime = Field(...)
    created_by: UUID | None = Field(...)
    updated_at: dt.datetime | None = Field(default=None)
    updated_by: UUID | None = Field(default=None)
    revision: int = Field(...)
    is_active: bool = Field(default=True)
    converted_at: Optional[dt.datetime] = Field(default=None)

    @classmethod
    def from_buyer(cls, buyer: BuyerToGet):
        return cls(
            id=buyer.id,
            category_id=buyer.category_id,
            stage_id=buyer.stage_id,
            name=buyer.name,
            email=buyer.email,
            phone=buyer.phone,
            company=buyer.company,
            address=buyer.address,
            notes=buyer.notes,
            potential_value=buyer.potential_value,
            responsible_user_id=buyer.responsible_user_id,
            order=buyer.order,
            created_at=buyer.created_at,
            created_by=buyer.created_by,
            updated_at=buyer.updated_at,
            updated_by=buyer.updated_by,
            revision=buyer.revision,
            is_active=buyer.is_active,
            converted_at=buyer.converted_at,
        )


class BuyerApiResponse(ApiResponse):
    """API ответ с покупателем"""
    data: BuyerResponse | dict = Field(default={})


class BuyersListApiResponse(ApiResponse):
    """API ответ со списком покупателей"""
    data: List[BuyerResponse] | dict = Field(default={})


class BuyersCountResponse(BaseModel):
    """Модель для ответа с количеством покупателей"""
    count: int = Field(..., description="Количество покупателей")
    category_id: UUID = Field(..., description="ID категории")


class BuyersCountApiResponse(ApiResponse):
    """API ответ с количеством покупателей"""
    data: BuyersCountResponse | dict = Field(default={})


class BuyersSumResponse(BaseModel):
    """Модель для ответа с суммой потенциальной стоимости покупателей"""
    total_amount: float = Field(..., description="Сумма потенциальной стоимости всех покупателей")
    category_id: UUID = Field(..., description="ID категории")


class BuyersSumApiResponse(ApiResponse):
    """API ответ с суммой покупателей"""
    data: BuyersSumResponse | dict = Field(default={})
