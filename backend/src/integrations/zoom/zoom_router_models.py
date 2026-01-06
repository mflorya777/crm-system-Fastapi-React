from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID

from .zoom_models import (
    ZoomMeeting,
    ZoomMeetingSettings,
    MeetingListResponse,
    ParticipantListResponse,
    RecordingListResponse,
)


class CreateZoomIntegrationParams(BaseModel):
    """Параметры для создания интеграции Zoom"""
    name: str = Field(..., description="Название интеграции")
    account_id: str = Field(..., description="Account ID (Zoom Account ID)")
    client_id: str = Field(..., description="Client ID (OAuth Client ID)")
    client_secret: str = Field(..., description="Client Secret (OAuth Client Secret)")
    is_active: bool = Field(default=True, description="Активна ли интеграция")


class UpdateZoomIntegrationParams(BaseModel):
    """Параметры для обновления интеграции Zoom"""
    name: Optional[str] = Field(default=None, description="Название интеграции")
    account_id: Optional[str] = Field(default=None, description="Account ID")
    client_id: Optional[str] = Field(default=None, description="Client ID")
    client_secret: Optional[str] = Field(default=None, description="Client Secret")
    is_active: Optional[bool] = Field(default=None, description="Активна ли интеграция")


class ZoomIntegrationResponse(BaseModel):
    """Ответ с информацией об интеграции Zoom"""
    id: UUID = Field(..., description="ID интеграции")
    type: str = Field(..., description="Тип интеграции")
    name: str = Field(..., description="Название интеграции")
    is_active: bool = Field(..., description="Активна ли интеграция")
    created_at: datetime = Field(..., description="Дата создания")
    updated_at: Optional[datetime] = Field(default=None, description="Дата обновления")


class ZoomIntegrationApiResponse(BaseModel):
    """API ответ с информацией об интеграции Zoom"""
    success: bool = Field(..., description="Успешно ли выполнение")
    data: Optional[ZoomIntegrationResponse] = Field(default=None, description="Данные интеграции")
    message: Optional[str] = Field(default=None, description="Сообщение")


class TestConnectionResponse(BaseModel):
    """Ответ на проверку соединения"""
    success: bool = Field(..., description="Успешно ли соединение")
    message: str = Field(..., description="Сообщение")


class TestConnectionApiResponse(BaseModel):
    """API ответ на проверку соединения"""
    success: bool = Field(..., description="Успешно ли выполнение")
    data: Optional[TestConnectionResponse] = Field(default=None, description="Данные проверки")
    message: Optional[str] = Field(default=None, description="Сообщение")


class CreateMeetingApiParams(BaseModel):
    """Параметры API для создания встречи"""
    topic: str = Field(..., description="Тема встречи")
    type: int = Field(default=2, description="Тип встречи (1=мгновенная, 2=запланированная, 3=повторяющаяся, 8=фиксированное время)")
    start_time: Optional[str] = Field(default=None, description="Время начала встречи (ISO 8601)")
    duration: Optional[int] = Field(default=30, description="Длительность в минутах")
    timezone: Optional[str] = Field(default="UTC", description="Часовой пояс")
    password: Optional[str] = Field(default=None, description="Пароль для встречи")
    agenda: Optional[str] = Field(default=None, description="Повестка дня")
    host_video: bool = Field(default=False, description="Включить видео для организатора")
    participant_video: bool = Field(default=False, description="Включить видео для участников")
    join_before_host: bool = Field(default=False, description="Разрешить присоединение до начала")
    mute_upon_entry: bool = Field(default=False, description="Отключить звук при входе")
    waiting_room: bool = Field(default=False, description="Использовать комнату ожидания")
    auto_recording: Optional[str] = Field(default=None, description="Автоматическая запись (local/cloud/none)")
    user_id: Optional[str] = Field(default="me", description="ID пользователя Zoom")


class CreateMeetingApiResponse(BaseModel):
    """API ответ на создание встречи"""
    success: bool = Field(..., description="Успешно ли выполнение")
    data: Optional[ZoomMeeting] = Field(default=None, description="Данные встречи")
    message: Optional[str] = Field(default=None, description="Сообщение")


class UpdateMeetingApiParams(BaseModel):
    """Параметры API для обновления встречи"""
    topic: Optional[str] = Field(default=None, description="Тема встречи")
    type: Optional[int] = Field(default=None, description="Тип встречи")
    start_time: Optional[str] = Field(default=None, description="Время начала встречи (ISO 8601)")
    duration: Optional[int] = Field(default=None, description="Длительность в минутах")
    timezone: Optional[str] = Field(default=None, description="Часовой пояс")
    password: Optional[str] = Field(default=None, description="Пароль для встречи")
    agenda: Optional[str] = Field(default=None, description="Повестка дня")
    host_video: Optional[bool] = Field(default=None, description="Включить видео для организатора")
    participant_video: Optional[bool] = Field(default=None, description="Включить видео для участников")
    join_before_host: Optional[bool] = Field(default=None, description="Разрешить присоединение до начала")
    mute_upon_entry: Optional[bool] = Field(default=None, description="Отключить звук при входе")
    waiting_room: Optional[bool] = Field(default=None, description="Использовать комнату ожидания")
    auto_recording: Optional[str] = Field(default=None, description="Автоматическая запись")


class GetMeetingApiResponse(BaseModel):
    """API ответ на получение встречи"""
    success: bool = Field(..., description="Успешно ли выполнение")
    data: Optional[ZoomMeeting] = Field(default=None, description="Данные встречи")
    message: Optional[str] = Field(default=None, description="Сообщение")


class ListMeetingsApiParams(BaseModel):
    """Параметры API для получения списка встреч"""
    user_id: Optional[str] = Field(default="me", description="ID пользователя Zoom")
    type: Optional[str] = Field(default="live", description="Тип встреч (live, scheduled, upcoming, previous)")
    page_size: int = Field(default=30, description="Количество результатов на странице")
    next_page_token: Optional[str] = Field(default=None, description="Токен для следующей страницы")


class ListMeetingsApiResponse(BaseModel):
    """API ответ со списком встреч"""
    success: bool = Field(..., description="Успешно ли выполнение")
    data: Optional[MeetingListResponse] = Field(default=None, description="Данные встреч")
    message: Optional[str] = Field(default=None, description="Сообщение")


class GetParticipantsApiParams(BaseModel):
    """Параметры API для получения участников"""
    page_size: int = Field(default=30, description="Количество результатов на странице")
    next_page_token: Optional[str] = Field(default=None, description="Токен для следующей страницы")


class GetParticipantsApiResponse(BaseModel):
    """API ответ со списком участников"""
    success: bool = Field(..., description="Успешно ли выполнение")
    data: Optional[ParticipantListResponse] = Field(default=None, description="Данные участников")
    message: Optional[str] = Field(default=None, description="Сообщение")


class GetRecordingsApiParams(BaseModel):
    """Параметры API для получения записей"""
    page_size: int = Field(default=30, description="Количество результатов на странице")
    next_page_token: Optional[str] = Field(default=None, description="Токен для следующей страницы")


class GetRecordingsApiResponse(BaseModel):
    """API ответ со списком записей"""
    success: bool = Field(..., description="Успешно ли выполнение")
    data: Optional[RecordingListResponse] = Field(default=None, description="Данные записей")
    message: Optional[str] = Field(default=None, description="Сообщение")

