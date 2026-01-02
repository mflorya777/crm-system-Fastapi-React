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


class BuyerStage(BaseModel):
    """Модель стадии в воронке покупателей (динамическая, не захардкожена)"""
    id: UUID = Field(default_factory=uuid4)
    name: str = Field(..., description="Название стадии")
    order: int = Field(..., description="Порядок стадии в воронке")
    color: Optional[str] = Field(default=None, description="Цвет стадии (hex код)")
    is_active: bool = Field(default=True, description="Активна ли стадия")
    created_at: dt.datetime = Field(default_factory=utc_now)
    updated_at: Optional[dt.datetime] = Field(default=None)


class BuyerCategoryToCreate(BaseModel):
    """Модель категории покупателей (воронки) для создания"""
    id: UUID = Field(default_factory=uuid4)
    name: str = Field(..., description="Название категории/воронки")
    description: Optional[str] = Field(default=None, description="Описание категории")
    stages: List[BuyerStage] = Field(default_factory=list, description="Стадии в воронке (динамические)")
    created_at: dt.datetime = Field(default_factory=utc_now)
    created_by: UUID | None = Field(...)
    updated_at: dt.datetime | None = Field(default=None)
    updated_by: UUID | None = Field(default=None)
    revision: int = Field(default=1)
    is_active: bool = Field(default=True, description="Активна ли категория")


class BuyerCategoryToGet(BaseModel):
    """Модель категории покупателей (воронки) для получения"""
    id: UUID = Field(...)
    name: str = Field(...)
    description: Optional[str] = Field(default=None)
    stages: List[BuyerStage] = Field(default_factory=list)
    created_at: dt.datetime = Field(...)
    created_by: UUID | None = Field(...)
    updated_at: dt.datetime | None = Field(default=None)
    updated_by: UUID | None = Field(default=None)
    revision: int = Field(...)
    is_active: bool = Field(default=True)


class BuyerToCreate(BaseModel):
    """Модель покупателя для создания"""
    id: UUID = Field(default_factory=uuid4)
    category_id: UUID = Field(..., description="ID категории/воронки")
    stage_id: UUID = Field(..., description="ID текущей стадии в воронке")
    name: str = Field(..., description="Имя покупателя")
    email: Optional[str] = Field(default=None, description="Email покупателя")
    phone: Optional[str] = Field(default=None, description="Телефон покупателя")
    company: Optional[str] = Field(default=None, description="Компания покупателя")
    address: Optional[str] = Field(default=None, description="Адрес покупателя")
    notes: Optional[str] = Field(default=None, description="Заметки о покупателе")
    potential_value: Optional[float] = Field(default=None, description="Потенциальная стоимость покупателя")
    responsible_user_id: UUID = Field(..., description="ID ответственного пользователя")
    order: int = Field(default=0, description="Порядок покупателя в стадии")
    created_at: dt.datetime = Field(default_factory=utc_now)
    created_by: UUID | None = Field(...)
    updated_at: dt.datetime | None = Field(default=None)
    updated_by: UUID | None = Field(default=None)
    revision: int = Field(default=1)
    is_active: bool = Field(default=True, description="Активен ли покупатель")
    converted_at: Optional[dt.datetime] = Field(default=None, description="Дата конвертации покупателя")


class BuyerToGet(BaseModel):
    """Модель покупателя для получения"""
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
