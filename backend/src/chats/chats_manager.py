"""Менеджер для работы с чатами и WebSocket соединениями"""

import asyncio
import datetime as dt
import json
import logging
from typing import Dict, List, Optional, Set
from uuid import UUID

from fastapi import WebSocket

from src.chats.chats_storage import ChatsStorage
from src.chats.chats_storage_models import (
    ChatToCreate,
    ChatToGet,
    ChatMessageToCreate,
    ChatMessageToGet,
    ChatParticipant,
    TypingIndicator,
)
from src.misc.misc_lib import utc_now

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Менеджер WebSocket соединений"""

    def __init__(self):
        # Активные соединения: {chat_id: {user_id: WebSocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # Пользователи онлайн: {user_id: Set[chat_ids]}
        self.online_users: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, chat_id: str, user_id: str):
        """Подключить пользователя к чату"""
        await websocket.accept()
        
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = {}
        
        self.active_connections[chat_id][user_id] = websocket
        
        if user_id not in self.online_users:
            self.online_users[user_id] = set()
        self.online_users[user_id].add(chat_id)
        
        logger.info(f"Пользователь {user_id} подключился к чату {chat_id}")

    def disconnect(self, chat_id: str, user_id: str):
        """Отключить пользователя от чата"""
        if chat_id in self.active_connections and user_id in self.active_connections[chat_id]:
            del self.active_connections[chat_id][user_id]
            
            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]
        
        if user_id in self.online_users:
            self.online_users[user_id].discard(chat_id)
            if not self.online_users[user_id]:
                del self.online_users[user_id]
        
        logger.info(f"Пользователь {user_id} отключился от чата {chat_id}")

    async def send_personal_message(self, message: str, chat_id: str, user_id: str):
        """Отправить сообщение конкретному пользователю в чате"""
        if chat_id in self.active_connections and user_id in self.active_connections[chat_id]:
            try:
                await self.active_connections[chat_id][user_id].send_text(message)
            except Exception as e:
                logger.error(f"Ошибка отправки сообщения пользователю {user_id}: {e}")
                self.disconnect(chat_id, user_id)

    async def broadcast_to_chat(self, message: str, chat_id: str, exclude_user: Optional[str] = None):
        """Отправить сообщение всем участникам чата"""
        if chat_id not in self.active_connections:
            return
        
        disconnected_users = []
        
        for user_id, websocket in self.active_connections[chat_id].items():
            if exclude_user and user_id == exclude_user:
                continue
            
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.error(f"Ошибка отправки сообщения пользователю {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Удаляем отключившихся пользователей
        for user_id in disconnected_users:
            self.disconnect(chat_id, user_id)

    def is_user_online(self, user_id: str, chat_id: str) -> bool:
        """Проверить, онлайн ли пользователь в чате"""
        return user_id in self.online_users and chat_id in self.online_users[user_id]

    def get_online_users_in_chat(self, chat_id: str) -> List[str]:
        """Получить список онлайн пользователей в чате"""
        if chat_id not in self.active_connections:
            return []
        return list(self.active_connections[chat_id].keys())


class ChatsManager:
    """Менеджер для бизнес-логики чатов"""

    def __init__(self, chats_storage: ChatsStorage):
        self.chats_storage = chats_storage
        self.connection_manager = ConnectionManager()

    # ==================== Методы для работы с чатами ====================

    async def create_chat(
        self,
        creator_id: UUID,
        participant_ids: List[UUID],
        chat_type: str = "direct",
        title: Optional[str] = None,
        deal_id: Optional[UUID] = None,
        buyer_id: Optional[UUID] = None
    ) -> ChatToGet:
        """Создать новый чат"""
        logger.info(f"Создание чата типа {chat_type} от пользователя {creator_id}")
        
        # Если это личный чат, проверяем, не существует ли он уже
        if chat_type == "direct" and len(participant_ids) == 1:
            existing_chat = await self.chats_storage.get_direct_chat(creator_id, participant_ids[0])
            if existing_chat:
                logger.info(f"Личный чат уже существует: {existing_chat.id}")
                return existing_chat
        
        # Создаем список участников
        participants = [ChatParticipant(user_id=creator_id)]
        for user_id in participant_ids:
            if user_id != creator_id:
                participants.append(ChatParticipant(user_id=user_id))
        
        chat = ChatToCreate(
            title=title,
            chat_type=chat_type,
            participants=participants,
            created_by=creator_id,
            deal_id=deal_id,
            buyer_id=buyer_id
        )
        
        return await self.chats_storage.create_chat(chat)

    async def get_chat(self, chat_id: UUID) -> Optional[ChatToGet]:
        """Получить чат по ID"""
        return await self.chats_storage.get_chat(chat_id)

    async def get_user_chats(
        self,
        user_id: UUID,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 50
    ) -> List[ChatToGet]:
        """Получить список чатов пользователя"""
        chats = await self.chats_storage.get_user_chats(user_id, active_only, skip, limit)
        
        # Добавляем количество непрочитанных сообщений
        for chat in chats:
            chat.unread_count = await self.chats_storage.get_unread_count(chat.id, user_id)
        
        return chats

    async def add_participant(self, chat_id: UUID, user_id: UUID) -> bool:
        """Добавить участника в чат"""
        participant = ChatParticipant(user_id=user_id)
        success = await self.chats_storage.add_participant(chat_id, participant)
        
        if success:
            # Уведомляем участников чата
            await self.connection_manager.broadcast_to_chat(
                json.dumps({
                    "type": "participant_added",
                    "user_id": str(user_id),
                    "timestamp": utc_now().isoformat()
                }),
                str(chat_id)
            )
        
        return success

    async def remove_participant(self, chat_id: UUID, user_id: UUID) -> bool:
        """Удалить участника из чата"""
        success = await self.chats_storage.remove_participant(chat_id, user_id)
        
        if success:
            # Уведомляем участников чата
            await self.connection_manager.broadcast_to_chat(
                json.dumps({
                    "type": "participant_removed",
                    "user_id": str(user_id),
                    "timestamp": utc_now().isoformat()
                }),
                str(chat_id)
            )
        
        return success

    async def delete_chat(self, chat_id: UUID) -> bool:
        """Удалить чат (мягкое удаление)"""
        return await self.chats_storage.deactivate_chat(chat_id)

    # ==================== Методы для работы с сообщениями ====================

    async def send_message(
        self,
        chat_id: UUID,
        sender_id: UUID,
        content: str,
        message_type: str = "text",
        file_url: Optional[str] = None
    ) -> ChatMessageToGet:
        """Отправить сообщение в чат"""
        logger.info(f"Отправка сообщения в чат {chat_id} от пользователя {sender_id}")
        
        message = ChatMessageToCreate(
            chat_id=chat_id,
            sender_id=sender_id,
            content=content,
            message_type=message_type,
            file_url=file_url
        )
        
        saved_message = await self.chats_storage.create_message(message)
        
        # Отправляем сообщение через WebSocket всем участникам чата
        await self.connection_manager.broadcast_to_chat(
            json.dumps({
                "type": "new_message",
                "message": {
                    "id": str(saved_message.id),
                    "chat_id": str(saved_message.chat_id),
                    "sender_id": str(saved_message.sender_id),
                    "content": saved_message.content,
                    "message_type": saved_message.message_type,
                    "file_url": saved_message.file_url,
                    "created_at": saved_message.created_at.isoformat(),
                    "is_edited": saved_message.is_edited,
                    "is_deleted": saved_message.is_deleted
                }
            }),
            str(chat_id)
        )
        
        return saved_message

    async def get_chat_messages(
        self,
        chat_id: UUID,
        skip: int = 0,
        limit: int = 50,
        include_deleted: bool = False
    ) -> List[ChatMessageToGet]:
        """Получить сообщения чата"""
        return await self.chats_storage.get_chat_messages(chat_id, skip, limit, include_deleted)

    async def update_message(self, message_id: UUID, content: str, user_id: UUID) -> bool:
        """Обновить сообщение"""
        message = await self.chats_storage.get_message(message_id)
        if not message:
            return False
        
        # Проверяем, что пользователь - автор сообщения
        if message.sender_id != user_id:
            return False
        
        success = await self.chats_storage.update_message(message_id, content)
        
        if success:
            # Уведомляем участников чата об изменении
            await self.connection_manager.broadcast_to_chat(
                json.dumps({
                    "type": "message_edited",
                    "message_id": str(message_id),
                    "content": content,
                    "timestamp": utc_now().isoformat()
                }),
                str(message.chat_id)
            )
        
        return success

    async def delete_message(self, message_id: UUID, user_id: UUID) -> bool:
        """Удалить сообщение"""
        message = await self.chats_storage.get_message(message_id)
        if not message:
            return False
        
        # Проверяем, что пользователь - автор сообщения
        if message.sender_id != user_id:
            return False
        
        success = await self.chats_storage.delete_message(message_id)
        
        if success:
            # Уведомляем участников чата об удалении
            await self.connection_manager.broadcast_to_chat(
                json.dumps({
                    "type": "message_deleted",
                    "message_id": str(message_id),
                    "timestamp": utc_now().isoformat()
                }),
                str(message.chat_id)
            )
        
        return success

    async def mark_messages_as_read(self, chat_id: UUID, user_id: UUID) -> int:
        """Отметить все сообщения чата как прочитанные"""
        count = await self.chats_storage.mark_chat_messages_as_read(chat_id, user_id, utc_now())
        
        if count > 0:
            # Уведомляем отправителей о прочтении
            await self.connection_manager.broadcast_to_chat(
                json.dumps({
                    "type": "messages_read",
                    "user_id": str(user_id),
                    "timestamp": utc_now().isoformat()
                }),
                str(chat_id),
                exclude_user=str(user_id)
            )
        
        return count

    async def handle_typing_indicator(self, chat_id: UUID, user_id: UUID, is_typing: bool):
        """Обработать индикатор набора текста"""
        await self.connection_manager.broadcast_to_chat(
            json.dumps({
                "type": "typing_indicator",
                "user_id": str(user_id),
                "is_typing": is_typing,
                "timestamp": utc_now().isoformat()
            }),
            str(chat_id),
            exclude_user=str(user_id)
        )

    def get_online_users(self, chat_id: UUID) -> List[str]:
        """Получить список онлайн пользователей в чате"""
        return self.connection_manager.get_online_users_in_chat(str(chat_id))

