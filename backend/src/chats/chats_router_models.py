"""Модели для API чатов"""

import datetime as dt
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from src.chats.chats_storage_models import ChatToGet, ChatMessageToGet, ChatParticipant


# ==================== Запросы ====================

class CreateChatParams(BaseModel):
    """Параметры для создания чата"""
    participant_ids: List[UUID] = Field(..., description="ID участников чата")
    chat_type: str = Field(default="direct", description="Тип чата: direct или group")
    title: Optional[str] = Field(default=None, description="Название чата (для группового)")
    deal_id: Optional[UUID] = Field(default=None, description="ID сделки (опционально)")
    buyer_id: Optional[UUID] = Field(default=None, description="ID покупателя (опционально)")


class SendMessageParams(BaseModel):
    """Параметры для отправки сообщения"""
    content: str = Field(..., description="Текст сообщения")
    message_type: str = Field(default="text", description="Тип сообщения: text, file, image")
    file_url: Optional[str] = Field(default=None, description="URL файла")


class UpdateMessageParams(BaseModel):
    """Параметры для обновления сообщения"""
    content: str = Field(..., description="Новый текст сообщения")


class AddParticipantParams(BaseModel):
    """Параметры для добавления участника"""
    user_id: UUID = Field(..., description="ID пользователя для добавления")


class TypingIndicatorParams(BaseModel):
    """Параметры индикатора набора текста"""
    is_typing: bool = Field(..., description="Печатает ли пользователь")


# ==================== Ответы ====================

class ChatParticipantResponse(BaseModel):
    """Ответ с информацией об участнике чата"""
    user_id: UUID = Field(...)
    joined_at: dt.datetime = Field(...)
    last_read_at: Optional[dt.datetime] = Field(default=None)

    @classmethod
    def from_participant(cls, participant: ChatParticipant):
        return cls(
            user_id=participant.user_id,
            joined_at=participant.joined_at,
            last_read_at=participant.last_read_at
        )


class ChatResponse(BaseModel):
    """Ответ с информацией о чате"""
    id: UUID = Field(...)
    title: Optional[str] = Field(default=None)
    chat_type: str = Field(...)
    participants: List[ChatParticipantResponse] = Field(...)
    created_at: dt.datetime = Field(...)
    created_by: UUID = Field(...)
    updated_at: Optional[dt.datetime] = Field(default=None)
    is_active: bool = Field(default=True)
    deal_id: Optional[UUID] = Field(default=None)
    buyer_id: Optional[UUID] = Field(default=None)
    last_message_at: Optional[dt.datetime] = Field(default=None)
    unread_count: int = Field(default=0)

    @classmethod
    def from_chat(cls, chat: ChatToGet):
        return cls(
            id=chat.id,
            title=chat.title,
            chat_type=chat.chat_type,
            participants=[ChatParticipantResponse.from_participant(p) for p in chat.participants],
            created_at=chat.created_at,
            created_by=chat.created_by,
            updated_at=chat.updated_at,
            is_active=chat.is_active,
            deal_id=chat.deal_id,
            buyer_id=chat.buyer_id,
            last_message_at=chat.last_message_at,
            unread_count=chat.unread_count
        )


class ChatMessageResponse(BaseModel):
    """Ответ с информацией о сообщении"""
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

    @classmethod
    def from_message(cls, message: ChatMessageToGet):
        return cls(
            id=message.id,
            chat_id=message.chat_id,
            sender_id=message.sender_id,
            message_type=message.message_type,
            content=message.content,
            file_url=message.file_url,
            created_at=message.created_at,
            updated_at=message.updated_at,
            is_edited=message.is_edited,
            is_deleted=message.is_deleted,
            read_by=message.read_by
        )


class ChatApiResponse(BaseModel):
    """Ответ API с чатом"""
    status: bool = Field(default=True)
    data: Optional[ChatResponse] = Field(default=None)
    message: Optional[dict] = Field(default=None)


class ChatsListApiResponse(BaseModel):
    """Ответ API со списком чатов"""
    status: bool = Field(default=True)
    data: Optional[List[ChatResponse]] = Field(default=None)
    message: Optional[dict] = Field(default=None)


class ChatMessageApiResponse(BaseModel):
    """Ответ API с сообщением"""
    status: bool = Field(default=True)
    data: Optional[ChatMessageResponse] = Field(default=None)
    message: Optional[dict] = Field(default=None)


class ChatMessagesListApiResponse(BaseModel):
    """Ответ API со списком сообщений"""
    status: bool = Field(default=True)
    data: Optional[List[ChatMessageResponse]] = Field(default=None)
    message: Optional[dict] = Field(default=None)


class OnlineUsersResponse(BaseModel):
    """Ответ со списком онлайн пользователей"""
    status: bool = Field(default=True)
    data: Optional[List[str]] = Field(default=None)
    message: Optional[dict] = Field(default=None)


class SuccessResponse(BaseModel):
    """Успешный ответ"""
    status: bool = Field(default=True)
    data: Optional[dict] = Field(default=None)
    message: Optional[dict] = Field(default=None)


# ==================== WebSocket сообщения ====================

class WSMessage(BaseModel):
    """Базовое WebSocket сообщение"""
    type: str = Field(..., description="Тип сообщения")
    timestamp: dt.datetime = Field(...)


class WSNewMessage(WSMessage):
    """WebSocket сообщение о новом сообщении в чате"""
    type: str = Field(default="new_message")
    message: ChatMessageResponse = Field(...)


class WSTypingIndicator(WSMessage):
    """WebSocket сообщение об индикаторе набора текста"""
    type: str = Field(default="typing_indicator")
    user_id: UUID = Field(...)
    is_typing: bool = Field(...)


class WSMessageRead(WSMessage):
    """WebSocket сообщение о прочтении сообщений"""
    type: str = Field(default="messages_read")
    user_id: UUID = Field(...)


class WSMessageEdited(WSMessage):
    """WebSocket сообщение об изменении сообщения"""
    type: str = Field(default="message_edited")
    message_id: UUID = Field(...)
    content: str = Field(...)


class WSMessageDeleted(WSMessage):
    """WebSocket сообщение об удалении сообщения"""
    type: str = Field(default="message_deleted")
    message_id: UUID = Field(...)

