"""Модели для хранения данных чатов"""

import datetime as dt
from typing import Optional, List
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from src.misc.misc_lib import utc_now


class ChatParticipant(BaseModel):
    """Модель участника чата"""
    user_id: UUID = Field(..., description="ID пользователя")
    joined_at: dt.datetime = Field(default_factory=utc_now, description="Дата присоединения к чату")
    last_read_at: Optional[dt.datetime] = Field(default=None, description="Время последнего прочтения")


class ChatToCreate(BaseModel):
    """Модель чата для создания"""
    id: UUID = Field(default_factory=uuid4)
    title: Optional[str] = Field(default=None, description="Название чата (для групповых)")
    chat_type: str = Field(default="direct", description="Тип чата: direct или group")
    participants: List[ChatParticipant] = Field(default_factory=list, description="Участники чата")
    created_at: dt.datetime = Field(default_factory=utc_now)
    created_by: UUID = Field(..., description="ID создателя чата")
    updated_at: Optional[dt.datetime] = Field(default=None)
    is_active: bool = Field(default=True, description="Активен ли чат")
    # Связь с сделками/покупателями (опционально)
    deal_id: Optional[UUID] = Field(default=None, description="ID сделки (если чат привязан к сделке)")
    buyer_id: Optional[UUID] = Field(default=None, description="ID покупателя (если чат привязан к покупателю)")


class ChatToGet(BaseModel):
    """Модель чата для получения"""
    id: UUID = Field(...)
    title: Optional[str] = Field(default=None)
    chat_type: str = Field(...)
    participants: List[ChatParticipant] = Field(...)
    created_at: dt.datetime = Field(...)
    created_by: UUID = Field(...)
    updated_at: Optional[dt.datetime] = Field(default=None)
    is_active: bool = Field(default=True)
    deal_id: Optional[UUID] = Field(default=None)
    buyer_id: Optional[UUID] = Field(default=None)
    # Дополнительные поля для UI
    last_message_at: Optional[dt.datetime] = Field(default=None, description="Время последнего сообщения")
    unread_count: int = Field(default=0, description="Количество непрочитанных сообщений")


class ChatMessageToCreate(BaseModel):
    """Модель сообщения для создания"""
    id: UUID = Field(default_factory=uuid4)
    chat_id: UUID = Field(..., description="ID чата")
    sender_id: UUID = Field(..., description="ID отправителя")
    message_type: str = Field(default="text", description="Тип сообщения: text, file, image")
    content: str = Field(..., description="Содержимое сообщения")
    file_url: Optional[str] = Field(default=None, description="URL файла (для типа file/image)")
    created_at: dt.datetime = Field(default_factory=utc_now)
    updated_at: Optional[dt.datetime] = Field(default=None)
    is_edited: bool = Field(default=False, description="Было ли сообщение отредактировано")
    is_deleted: bool = Field(default=False, description="Удалено ли сообщение")
    # Статусы прочтения
    read_by: List[UUID] = Field(default_factory=list, description="ID пользователей, прочитавших сообщение")


class ChatMessageToGet(BaseModel):
    """Модель сообщения для получения"""
    id: UUID = Field(...)
    chat_id: UUID = Field(...)
    sender_id: UUID = Field(...)
    message_type: str = Field(...)
    content: str = Field(...)
    file_url: Optional[str] = Field(default=None)
    created_at: dt.datetime = Field(...)
    updated_at: Optional[dt.datetime] = Field(default=None)
    is_edited: bool = Field(default=False)
    is_deleted: bool = Field(default=False)
    read_by: List[UUID] = Field(default_factory=list)


class TypingIndicator(BaseModel):
    """Модель индикатора набора текста"""
    chat_id: UUID = Field(..., description="ID чата")
    user_id: UUID = Field(..., description="ID пользователя, который печатает")
    is_typing: bool = Field(..., description="Печатает ли пользователь")
    timestamp: dt.datetime = Field(default_factory=utc_now)

