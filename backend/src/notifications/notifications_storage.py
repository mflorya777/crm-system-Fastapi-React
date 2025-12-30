import logging
from uuid import UUID

from bson.objectid import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from src.clients.mongo.client import MClient
from src.misc.misc_lib import utc_now
from src.notifications.notifications_storage_models import (
    NotificationMessageChannel,
    NotificationMessageType,
    NotificationMessageToCreate,
)


_LOG = logging.getLogger("uvicorn.info")


class NotificationsStorage:
    def __init__(
        self,
        mongo_client: MClient,
    ):
        self.mongo_client = mongo_client
        self.collection_name = "notifications"
        self.collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.collection_name,
        )

    async def add(
        self,
        notification: NotificationMessageToCreate,
    ) -> NotificationMessageToCreate | None:
        # FIXME: Добавить проверку на то что запись создана.
        _LOG.info(
            f"Добавляю запись:"
            f" {notification.id=}"
            f"{notification.message_type=}"
            f" {notification.message_channel=}",
        )
        result = await self.collection.insert_one(notification.dict())
        _LOG.info(f"Результат добавления нотификации: {result}")
        return await self.get_by_object_id(
            result.inserted_id,
        )

    async def get_by_object_id(
        self,
        _id: ObjectId,
    ) -> NotificationMessageToCreate | None:
        _LOG.info(f"Запрашиваю по ObjectID: {_id}")
        projection = {
            "_id": False,
        }
        for key in NotificationMessageToCreate.model_fields:
            projection[key] = True
        _LOG.info(f"{projection=}")
        data = await self.collection.find_one(
            {
                "_id": _id,
            },
            projection=projection,
        )
        _LOG.debug(f"Полученные данные: {data}")
        if data:
            return NotificationMessageToCreate(**data)
        else:
            return None

    async def get_one(
        self,
        query: dict,
    ) -> NotificationMessageToCreate | None:
        projection = {
            "_id": False,
        }
        for key in NotificationMessageToCreate.model_fields:
            projection[key] = True
        _LOG.info(f"{query=}")
        _LOG.info(f"{projection=}")
        data = await self.collection.find_one(
            query,
            projection=projection,
        )
        _LOG.debug(f"Полученные данные: {data}")
        if data:
            return NotificationMessageToCreate(**data)
        else:
            return None

    async def get_not_expired_notification(
        self,
        user_id: UUID,
        entity_id: UUID,
        message_type: NotificationMessageType,
        message_channel: NotificationMessageChannel,
    ) -> NotificationMessageToCreate | None:
        query = {
            "user_id": user_id,
            "entity_id": entity_id,
            "message_type": message_type,
            "message_channel": message_channel,
            "ttl_expires_at": {"$gt": utc_now()},
        }
        return await self.get_one(query)

    async def get_notifications_to_send_for_channel(
        self,
        message_channel: NotificationMessageChannel,
        max_attempts: int,
    ) -> list[NotificationMessageToCreate]:
        """
        Получить список неотправленных уведомлений по каналу.
        - TTL не должен быть больше текущего времени.
        - Количество совершенных попыток не должно превышать максимальное количество попыток.
        """
        query = {
            "message_channel": message_channel,
            "ttl_expires_at": {"$gt": utc_now()},
            "performed_attempts": {"$lt": max_attempts},
            "sent_at": None,
        }
        _LOG.info(f"{query=}")
        messages = await self.collection.find(
            query,
            projection={
                "_id": False,
            },
        ).to_list(None)
        return [NotificationMessageToCreate(**message) for message in messages]

    async def bump_attempt_notification(
        self,
        notification_id: UUID,
    ):
        _LOG.info(f"Bumping attempt for notification_id: {notification_id}")
        await self.collection.update_one(
            {"id": notification_id},
            {
                "$inc": {"performed_attempts": 1},
                "$set": {"last_attempt_at": utc_now()},
            },
        )

    async def mark_notification_as_sent(
        self,
        notification_id: UUID,
    ):
        await self.collection.update_one(
            {"id": notification_id},
            {"$set": {"sent_at": utc_now()}},
        )

    async def add_error_to_notification(
        self,
        notification_id: UUID,
        error: str,
    ):
        error_dict = {
            "ts": utc_now(),
            "error_message": error,
        }
        await self.collection.update_one(
            {"id": notification_id},
            {"$push": {"errors": error_dict}},
        )
