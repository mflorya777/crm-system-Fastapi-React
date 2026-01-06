from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class ZoomConfig(BaseModel):
    """Конфигурация для Zoom (Server-to-Server OAuth)"""
    account_id: str = Field(..., description="Account ID (Zoom Account ID)")
    client_id: str = Field(..., description="Client ID (OAuth Client ID)")
    client_secret: str = Field(..., description="Client Secret (OAuth Client Secret)")


class ZoomMeetingSettings(BaseModel):
    """Настройки встречи Zoom"""
    host_video: bool = Field(default=False, description="Включить видео для организатора")
    participant_video: bool = Field(default=False, description="Включить видео для участников")
    join_before_host: bool = Field(default=False, description="Разрешить присоединение до начала")
    mute_upon_entry: bool = Field(default=False, description="Отключить звук при входе")
    waiting_room: bool = Field(default=False, description="Использовать комнату ожидания")
    auto_recording: Optional[str] = Field(default=None, description="Автоматическая запись (local/cloud/none)")
    approval_type: int = Field(default=0, description="Тип одобрения (0=автоматически, 1=вручную, 2=не требуется)")


class CreateMeetingParams(BaseModel):
    """Параметры для создания встречи"""
    topic: str = Field(..., description="Тема встречи")
    type: int = Field(default=2, description="Тип встречи (1=мгновенная, 2=запланированная, 3=повторяющаяся, 8=фиксированное время)")
    start_time: Optional[datetime] = Field(default=None, description="Время начала встречи")
    duration: Optional[int] = Field(default=30, description="Длительность в минутах")
    timezone: Optional[str] = Field(default="UTC", description="Часовой пояс")
    password: Optional[str] = Field(default=None, description="Пароль для встречи")
    agenda: Optional[str] = Field(default=None, description="Повестка дня")
    settings: Optional[ZoomMeetingSettings] = Field(default=None, description="Настройки встречи")
    user_id: Optional[str] = Field(default="me", description="ID пользователя Zoom (по умолчанию 'me')")


class UpdateMeetingParams(BaseModel):
    """Параметры для обновления встречи"""
    topic: Optional[str] = Field(default=None, description="Тема встречи")
    type: Optional[int] = Field(default=None, description="Тип встречи")
    start_time: Optional[datetime] = Field(default=None, description="Время начала встречи")
    duration: Optional[int] = Field(default=None, description="Длительность в минутах")
    timezone: Optional[str] = Field(default=None, description="Часовой пояс")
    password: Optional[str] = Field(default=None, description="Пароль для встречи")
    agenda: Optional[str] = Field(default=None, description="Повестка дня")
    settings: Optional[ZoomMeetingSettings] = Field(default=None, description="Настройки встречи")


class ZoomMeeting(BaseModel):
    """Модель встречи Zoom"""
    id: str = Field(..., description="ID встречи")
    uuid: str = Field(..., description="UUID встречи")
    host_id: str = Field(..., description="ID организатора")
    topic: str = Field(..., description="Тема встречи")
    type: int = Field(..., description="Тип встречи")
    start_time: Optional[datetime] = Field(default=None, description="Время начала")
    duration: int = Field(..., description="Длительность в минутах")
    timezone: Optional[str] = Field(default=None, description="Часовой пояс")
    created_at: Optional[datetime] = Field(default=None, description="Дата создания")
    join_url: str = Field(..., description="URL для присоединения")
    start_url: Optional[str] = Field(default=None, description="URL для начала (только для организатора)")
    password: Optional[str] = Field(default=None, description="Пароль")
    agenda: Optional[str] = Field(default=None, description="Повестка дня")
    settings: Optional[Dict[str, Any]] = Field(default=None, description="Настройки встречи")
    status: Optional[str] = Field(default=None, description="Статус встречи")
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_id_to_string(cls, v):
        """Конвертировать ID в строку, если он приходит как число"""
        if isinstance(v, (int, float)):
            return str(int(v))
        return str(v) if v is not None else v
    
    @field_validator('host_id', mode='before')
    @classmethod
    def convert_host_id_to_string(cls, v):
        """Конвертировать host_id в строку, если он приходит как число"""
        if isinstance(v, (int, float)):
            return str(int(v))
        return str(v) if v is not None else v


class ZoomParticipant(BaseModel):
    """Участник встречи Zoom"""
    id: Optional[str] = Field(default=None, description="ID участника")
    user_id: Optional[str] = Field(default=None, description="ID пользователя Zoom")
    name: str = Field(..., description="Имя участника")
    user_email: Optional[str] = Field(default=None, description="Email участника")
    join_time: Optional[datetime] = Field(default=None, description="Время присоединения")
    leave_time: Optional[datetime] = Field(default=None, description="Время выхода")
    duration: Optional[int] = Field(default=None, description="Длительность участия в секундах")


class ZoomRecording(BaseModel):
    """Запись встречи Zoom"""
    id: str = Field(..., description="ID записи")
    meeting_id: str = Field(..., description="ID встречи")
    recording_start: Optional[datetime] = Field(default=None, description="Время начала записи")
    recording_end: Optional[datetime] = Field(default=None, description="Время окончания записи")
    file_type: str = Field(..., description="Тип файла (MP4, M4A, etc.)")
    file_size: Optional[int] = Field(default=None, description="Размер файла в байтах")
    play_url: Optional[str] = Field(default=None, description="URL для воспроизведения")
    download_url: Optional[str] = Field(default=None, description="URL для скачивания")
    status: Optional[str] = Field(default=None, description="Статус записи")
    
    @field_validator('id', 'meeting_id', mode='before')
    @classmethod
    def convert_id_to_string(cls, v):
        """Конвертировать ID в строку, если он приходит как число"""
        if isinstance(v, (int, float)):
            return str(int(v))
        return str(v) if v is not None else v


class MeetingListParams(BaseModel):
    """Параметры для получения списка встреч"""
    user_id: Optional[str] = Field(default="me", description="ID пользователя Zoom")
    type: Optional[str] = Field(default="live", description="Тип встреч (live, scheduled, upcoming, previous)")
    page_size: int = Field(default=30, description="Количество результатов на странице")
    next_page_token: Optional[str] = Field(default=None, description="Токен для следующей страницы")


class MeetingListResponse(BaseModel):
    """Ответ со списком встреч"""
    meetings: List[ZoomMeeting] = Field(default_factory=list)
    page_size: int = Field(default=30)
    next_page_token: Optional[str] = Field(default=None)
    total_records: Optional[int] = Field(default=None)


class ParticipantListResponse(BaseModel):
    """Ответ со списком участников"""
    participants: List[ZoomParticipant] = Field(default_factory=list)
    page_count: int = Field(default=0)
    page_size: int = Field(default=30)
    total_records: int = Field(default=0)
    next_page_token: Optional[str] = Field(default=None)


class RecordingListResponse(BaseModel):
    """Ответ со списком записей"""
    recordings: List[ZoomRecording] = Field(default_factory=list)
    page_size: int = Field(default=30)
    next_page_token: Optional[str] = Field(default=None)
    total_records: Optional[int] = Field(default=None)

