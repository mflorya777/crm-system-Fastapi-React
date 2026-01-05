"""Хранилище для работы с чатами"""

import datetime as dt
import logging
from typing import List, Optional
from uuid import UUID

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import DESCENDING

from src.chats.chats_storage_models import (
    ChatToCreate,
    ChatToGet,
    ChatMessageToCreate,
    ChatMessageToGet,
    ChatParticipant,
)
from src.misc.misc_lib import utc_now


logger = logging.getLogger(__name__)


class ChatsStorage:
    """Класс для работы с хранилищем чатов"""

    def __init__(self, mongo_client: AsyncIOMotorClient, db_name: str):
        self.mongo_client = mongo_client
        self.db_name = db_name
        self.db = mongo_client[db_name]
        self.chats_collection = self.db["chats"]
        self.messages_collection = self.db["chat_messages"]

    # ==================== Методы для работы с чатами ====================

    async def create_chat(self, chat: ChatToCreate) -> ChatToGet:
        """Создать новый чат"""
        logger.info(f"Создание нового чата: {chat.id}")
        
        chat_dict = chat.model_dump(mode="json")
        await self.chats_collection.insert_one(chat_dict)
        
        return ChatToGet(**chat_dict)

    async def get_chat(self, chat_id: UUID) -> Optional[ChatToGet]:
        """Получить чат по ID"""
        logger.info(f"Получение чата: {chat_id}")
        
        chat_dict = await self.chats_collection.find_one({"id": str(chat_id)})
        if not chat_dict:
            return None
        
        return ChatToGet(**chat_dict)

    async def get_user_chats(
        self, 
        user_id: UUID, 
        active_only: bool = True,
        skip: int = 0,
        limit: int = 50
    ) -> List[ChatToGet]:
        """Получить список чатов пользователя"""
        logger.info(f"Получение чатов для пользователя: {user_id}")
        
        query = {"participants.user_id": str(user_id)}
        if active_only:
            query["is_active"] = True
        
        cursor = self.chats_collection.find(query).sort("updated_at", DESCENDING).skip(skip).limit(limit)
        chats = await cursor.to_list(length=limit)
        
        return [ChatToGet(**chat) for chat in chats]

    async def get_direct_chat(self, user1_id: UUID, user2_id: UUID) -> Optional[ChatToGet]:
        """Найти личный чат между двумя пользователями"""
        logger.info(f"Поиск личного чата между {user1_id} и {user2_id}")
        
        chat_dict = await self.chats_collection.find_one({
            "chat_type": "direct",
            "is_active": True,
            "participants.user_id": {"$all": [str(user1_id), str(user2_id)]},
            "$expr": {"$eq": [{"$size": "$participants"}, 2]}
        })
        
        if not chat_dict:
            return None
        
        return ChatToGet(**chat_dict)

    async def update_chat_timestamp(self, chat_id: UUID) -> None:
        """Обновить timestamp последнего сообщения"""
        await self.chats_collection.update_one(
            {"id": str(chat_id)},
            {"$set": {"updated_at": utc_now(), "last_message_at": utc_now()}}
        )

    async def update_last_read(self, chat_id: UUID, user_id: UUID) -> None:
        """Обновить время последнего прочтения для пользователя"""
        await self.chats_collection.update_one(
            {"id": str(chat_id), "participants.user_id": str(user_id)},
            {"$set": {"participants.$.last_read_at": utc_now()}}
        )

    async def add_participant(self, chat_id: UUID, participant: ChatParticipant) -> bool:
        """Добавить участника в чат"""
        logger.info(f"Добавление участника {participant.user_id} в чат {chat_id}")
        
        result = await self.chats_collection.update_one(
            {"id": str(chat_id)},
            {"$addToSet": {"participants": participant.model_dump(mode="json")}}
        )
        
        return result.modified_count > 0

    async def remove_participant(self, chat_id: UUID, user_id: UUID) -> bool:
        """Удалить участника из чата"""
        logger.info(f"Удаление участника {user_id} из чата {chat_id}")
        
        result = await self.chats_collection.update_one(
            {"id": str(chat_id)},
            {"$pull": {"participants": {"user_id": str(user_id)}}}
        )
        
        return result.modified_count > 0

    async def deactivate_chat(self, chat_id: UUID) -> bool:
        """Деактивировать чат (мягкое удаление)"""
        logger.info(f"Деактивация чата: {chat_id}")
        
        result = await self.chats_collection.update_one(
            {"id": str(chat_id)},
            {"$set": {"is_active": False, "updated_at": utc_now()}}
        )
        
        return result.modified_count > 0

    # ==================== Методы для работы с сообщениями ====================

    async def create_message(self, message: ChatMessageToCreate) -> ChatMessageToGet:
        """Создать новое сообщение"""
        logger.info(f"Создание сообщения в чате: {message.chat_id}")
        
        message_dict = message.model_dump(mode="json")
        await self.messages_collection.insert_one(message_dict)
        
        # Обновляем timestamp чата
        await self.update_chat_timestamp(message.chat_id)
        
        return ChatMessageToGet(**message_dict)

    async def get_message(self, message_id: UUID) -> Optional[ChatMessageToGet]:
        """Получить сообщение по ID"""
        message_dict = await self.messages_collection.find_one({"id": str(message_id)})
        if not message_dict:
            return None
        
        return ChatMessageToGet(**message_dict)

    async def get_chat_messages(
        self,
        chat_id: UUID,
        skip: int = 0,
        limit: int = 50,
        include_deleted: bool = False
    ) -> List[ChatMessageToGet]:
        """Получить сообщения чата"""
        logger.info(f"Получение сообщений для чата: {chat_id}")
        
        query = {"chat_id": str(chat_id)}
        if not include_deleted:
            query["is_deleted"] = False
        
        cursor = self.messages_collection.find(query).sort("created_at", DESCENDING).skip(skip).limit(limit)
        messages = await cursor.to_list(length=limit)
        
        # Возвращаем в прямом порядке (от старых к новым)
        return [ChatMessageToGet(**msg) for msg in reversed(messages)]

    async def update_message(self, message_id: UUID, content: str) -> bool:
        """Обновить содержимое сообщения"""
        logger.info(f"Обновление сообщения: {message_id}")
        
        result = await self.messages_collection.update_one(
            {"id": str(message_id)},
            {"$set": {"content": content, "is_edited": True, "updated_at": utc_now()}}
        )
        
        return result.modified_count > 0

    async def delete_message(self, message_id: UUID) -> bool:
        """Удалить сообщение (мягкое удаление)"""
        logger.info(f"Удаление сообщения: {message_id}")
        
        result = await self.messages_collection.update_one(
            {"id": str(message_id)},
            {"$set": {"is_deleted": True, "content": "[удалено]", "updated_at": utc_now()}}
        )
        
        return result.modified_count > 0

    async def mark_message_as_read(self, message_id: UUID, user_id: UUID) -> bool:
        """Отметить сообщение как прочитанное"""
        result = await self.messages_collection.update_one(
            {"id": str(message_id)},
            {"$addToSet": {"read_by": str(user_id)}}
        )
        
        return result.modified_count > 0

    async def mark_chat_messages_as_read(self, chat_id: UUID, user_id: UUID, until_time: dt.datetime) -> int:
        """Отметить все сообщения чата как прочитанные до определенного времени"""
        logger.info(f"Отметка сообщений как прочитанных в чате {chat_id} до {until_time}")
        
        result = await self.messages_collection.update_many(
            {
                "chat_id": str(chat_id),
                "created_at": {"$lte": until_time},
                "sender_id": {"$ne": str(user_id)},  # Не отмечаем свои сообщения
                "read_by": {"$ne": str(user_id)}  # Только непрочитанные
            },
            {"$addToSet": {"read_by": str(user_id)}}
        )
        
        # Обновляем last_read_at у пользователя
        await self.update_last_read(chat_id, user_id)
        
        return result.modified_count

    async def get_unread_count(self, chat_id: UUID, user_id: UUID) -> int:
        """Получить количество непрочитанных сообщений в чате"""
        count = await self.messages_collection.count_documents({
            "chat_id": str(chat_id),
            "sender_id": {"$ne": str(user_id)},
            "read_by": {"$ne": str(user_id)},
            "is_deleted": False
        })
        
        return count

