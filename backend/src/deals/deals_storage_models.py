import datetime as dt
from typing import (
    Optional,
    List,
)
from uuid import (
    UUID,
    uuid4,
)

from pydantic import (
    BaseModel,
    Field,
)

from src.misc.misc_lib import utc_now


class DealStage(BaseModel):
    """Модель стадии в воронке (динамическая, не захардкожена)"""
    id: UUID = Field(default_factory=uuid4)
    name: str = Field(..., description="Название стадии")
    order: int = Field(..., description="Порядок стадии в воронке")
    color: Optional[str] = Field(default=None, description="Цвет стадии (hex код)")
    created_at: dt.datetime = Field(default_factory=utc_now)
    updated_at: Optional[dt.datetime] = Field(default=None)


class DealCategoryToCreate(BaseModel):
    """Модель категории сделок (воронки) для создания"""
    id: UUID = Field(default_factory=uuid4)
    name: str = Field(..., description="Название категории/воронки")
    description: Optional[str] = Field(default=None, description="Описание категории")
    stages: List[DealStage] = Field(default_factory=list, description="Стадии в воронке (динамические)")
    created_at: dt.datetime = Field(default_factory=utc_now)
    created_by: UUID | None = Field(...)
    updated_at: dt.datetime | None = Field(default=None)
    updated_by: UUID | None = Field(default=None)
    revision: int = Field(default=1)
    is_active: bool = Field(default=True, description="Активна ли категория")


class DealCategoryToGet(BaseModel):
    """Модель категории сделок (воронки) для получения"""
    id: UUID = Field(...)
    name: str = Field(...)
    description: Optional[str] = Field(default=None)
    stages: List[DealStage] = Field(default_factory=list)
    created_at: dt.datetime = Field(...)
    created_by: UUID | None = Field(...)
    updated_at: dt.datetime | None = Field(default=None)
    updated_by: UUID | None = Field(default=None)
    revision: int = Field(...)
    is_active: bool = Field(default=True)


class DealToCreate(BaseModel):
    """Модель сделки для создания"""
    id: UUID = Field(default_factory=uuid4)
    category_id: UUID = Field(..., description="ID категории/воронки")
    stage_id: UUID = Field(..., description="ID текущей стадии в воронке")
    title: str = Field(..., description="Название сделки")
    description: Optional[str] = Field(default=None, description="Описание сделки")
    amount: Optional[float] = Field(default=None, description="Сумма сделки")
    currency: Optional[str] = Field(default="RUB", description="Валюта сделки")
    client_id: Optional[UUID] = Field(default=None, description="ID клиента")
    responsible_user_id: UUID = Field(..., description="ID ответственного пользователя")
    created_at: dt.datetime = Field(default_factory=utc_now)
    created_by: UUID | None = Field(...)
    updated_at: dt.datetime | None = Field(default=None)
    updated_by: UUID | None = Field(default=None)
    revision: int = Field(default=1)
    is_active: bool = Field(default=True, description="Активна ли сделка")
    closed_at: Optional[dt.datetime] = Field(default=None, description="Дата закрытия сделки")


class DealToGet(BaseModel):
    """Модель сделки для получения"""
    id: UUID = Field(...)
    category_id: UUID = Field(...)
    stage_id: UUID = Field(...)
    title: str = Field(...)
    description: Optional[str] = Field(default=None)
    amount: Optional[float] = Field(default=None)
    currency: Optional[str] = Field(default="RUB")
    client_id: Optional[UUID] = Field(default=None)
    responsible_user_id: UUID = Field(...)
    created_at: dt.datetime = Field(...)
    created_by: UUID | None = Field(...)
    updated_at: dt.datetime | None = Field(default=None)
    updated_by: UUID | None = Field(default=None)
    revision: int = Field(...)
    is_active: bool = Field(default=True)
    closed_at: Optional[dt.datetime] = Field(default=None)
