"""Модуль для работы с чатами"""

import logging
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)


async def create_chats_indexes(mongo_client: AsyncIOMotorClient, db_name: str):
    """Создать индексы для коллекций чатов"""
    try:
        db = mongo_client[db_name]
        
        # Индексы для коллекции чатов
        chats_collection = db["chats"]
        await chats_collection.create_index("id", unique=True)
        await chats_collection.create_index([("participants.user_id", 1)])
        await chats_collection.create_index([("chat_type", 1)])
        await chats_collection.create_index([("is_active", 1)])
        await chats_collection.create_index([("deal_id", 1)])
        await chats_collection.create_index([("buyer_id", 1)])
        await chats_collection.create_index([("updated_at", -1)])
        
        # Индексы для коллекции сообщений
        messages_collection = db["chat_messages"]
        await messages_collection.create_index("id", unique=True)
        await messages_collection.create_index([("chat_id", 1), ("created_at", -1)])
        await messages_collection.create_index([("sender_id", 1)])
        await messages_collection.create_index([("is_deleted", 1)])
        
        logger.info("Индексы для чатов успешно созданы")
    except Exception as e:
        logger.error(f"Ошибка создания индексов для чатов: {e}")
        raise
