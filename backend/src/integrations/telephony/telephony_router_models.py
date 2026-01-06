from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import UUID

from .telephony_models import CallInfo, CallStatistic


class CreateMangoOfficeIntegrationParams(BaseModel):
    """Параметры для создания интеграции Mango Office"""
    name: str = Field(..., description="Название интеграции")
    api_key: str = Field(..., description="API ключ Mango Office")
    api_salt: str = Field(..., description="Соль для API ключа")
    vpbx_api_key: str = Field(..., description="VPBX API ключ")
    vpbx_api_salt: str = Field(..., description="Соль для VPBX API ключа")
    is_active: bool = Field(default=True, description="Активна ли интеграция")


class UpdateMangoOfficeIntegrationParams(BaseModel):
    """Параметры для обновления интеграции Mango Office"""
    name: Optional[str] = Field(default=None, description="Название интеграции")
    api_key: Optional[str] = Field(default=None, description="API ключ Mango Office")
    api_salt: Optional[str] = Field(default=None, description="Соль для API ключа")
    vpbx_api_key: Optional[str] = Field(default=None, description="VPBX API ключ")
    vpbx_api_salt: Optional[str] = Field(default=None, description="Соль для VPBX API ключа")
    is_active: Optional[bool] = Field(default=None, description="Активна ли интеграция")


class TestConnectionResponse(BaseModel):
    """Ответ на проверку соединения"""
    success: bool = Field(..., description="Успешно ли соединение")
    message: str = Field(..., description="Сообщение")


class CallHistoryParams(BaseModel):
    """Параметры для получения истории звонков"""
    date_from: Optional[int] = Field(default=None, description="Начальная дата (Unix timestamp)")
    date_to: Optional[int] = Field(default=None, description="Конечная дата (Unix timestamp)")
    from_number: Optional[str] = Field(default=None, description="Номер звонящего")
    to_number: Optional[str] = Field(default=None, description="Номер получателя")
    limit: int = Field(default=100, description="Лимит записей")


class CallHistoryResponse(BaseModel):
    """Ответ с историей звонков"""
    calls: List[CallInfo] = Field(default_factory=list)
    total: int = Field(default=0)


class MakeCallParams(BaseModel):
    """Параметры для инициации звонка"""
    from_number: str = Field(..., description="Номер звонящего")
    to_number: str = Field(..., description="Номер получателя")
    line_number: Optional[str] = Field(default=None, description="Номер линии")


class MakeCallResponse(BaseModel):
    """Ответ на инициацию звонка"""
    success: bool = Field(..., description="Успешно ли инициирован звонок")
    data: dict = Field(default_factory=dict, description="Данные ответа от API")


class StatisticsParams(BaseModel):
    """Параметры для получения статистики"""
    date_from: int = Field(..., description="Начальная дата (Unix timestamp)")
    date_to: int = Field(..., description="Конечная дата (Unix timestamp)")


class StatisticsResponse(BaseModel):
    """Ответ со статистикой"""
    statistics: CallStatistic = Field(...)

