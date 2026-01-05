from typing import Optional, List
from pydantic import BaseModel, Field


class MangoOfficeConfig(BaseModel):
    """Конфигурация для Mango Office"""
    api_key: str = Field(..., description="API ключ Mango Office")
    api_salt: str = Field(..., description="Соль для API ключа")
    vpbx_api_key: str = Field(..., description="VPBX API ключ")
    vpbx_api_salt: str = Field(..., description="Соль для VPBX API ключа")


class CallInfo(BaseModel):
    """Информация о звонке"""
    entry_id: Optional[str] = Field(default=None, description="ID записи звонка")
    from_number: Optional[str] = Field(default=None, description="Номер звонящего")
    to_number: Optional[str] = Field(default=None, description="Номер получателя")
    start_time: Optional[int] = Field(default=None, description="Время начала звонка (Unix timestamp)")
    duration: Optional[int] = Field(default=None, description="Длительность звонка в секундах")
    status: Optional[str] = Field(default=None, description="Статус звонка")
    direction: Optional[str] = Field(default=None, description="Направление (incoming/outgoing)")


class CallHistoryResponse(BaseModel):
    """Ответ с историей звонков"""
    calls: List[CallInfo] = Field(default_factory=list)
    total: int = Field(default=0)


class CallStatistic(BaseModel):
    """Статистика звонков"""
    total_calls: int = Field(default=0, description="Всего звонков")
    successful_calls: int = Field(default=0, description="Успешных звонков")
    failed_calls: int = Field(default=0, description="Неудачных звонков")

