import datetime as dt
from typing import (
    Optional,
    Dict,
    Any,
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


class IntegrationType:
    """Типы интеграций"""
    TELEPHONY = "telephony"
    ONE_C = "one_c"
    ZOOM = "zoom"
    TELEGRAM = "telegram"


class IntegrationToCreate(BaseModel):
    """Модель интеграции для создания"""
    id: UUID = Field(default_factory=uuid4)
    type: str = Field(..., description="Тип интеграции (telephony, one_c, zoom)")
    name: str = Field(..., description="Название интеграции (например, 'Mango Office')")
    is_active: bool = Field(default=True, description="Активна ли интеграция")
    config: Dict[str, Any] = Field(default_factory=dict, description="Конфигурация интеграции (API ключи, URL и т.д.)")
    created_at: dt.datetime = Field(default_factory=utc_now)
    created_by: UUID | None = Field(default=None, description="ID пользователя, создавшего интеграцию")
    updated_at: Optional[dt.datetime] = Field(default=None)
    updated_by: Optional[UUID] = Field(default=None, description="ID пользователя, обновившего интеграцию")


class IntegrationToGet(BaseModel):
    """Модель интеграции для получения"""
    id: UUID = Field(...)
    type: str = Field(...)
    name: str = Field(...)
    is_active: bool = Field(...)
    config: Dict[str, Any] = Field(...)
    created_at: dt.datetime = Field(...)
    created_by: UUID | None = Field(default=None)
    updated_at: Optional[dt.datetime] = Field(default=None)
    updated_by: Optional[UUID] = Field(default=None)

