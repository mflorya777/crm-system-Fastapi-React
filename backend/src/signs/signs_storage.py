import logging
from uuid import UUID
from typing import (
    Optional,
    Any,
)

from motor.motor_asyncio import AsyncIOMotorCollection
from src.clients.mongo.client import MClient
from src.signs.signs_storage_models import SignToCreate
from src.misc.misc_lib import utc_now


_LOG = logging.getLogger("uvicorn.info")


class SingsStorageException(Exception):
    pass


class SignsStorage:
    def __init__(
        self,
        mongo_client: MClient,
    ):
        self.mongo_client: MClient = mongo_client
        self.collection_name: str = "signs"
        self.collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.collection_name,
        )

    async def add(
        self,
        entity_id: UUID,
        entity_type: type[Any],
        requested_by_id: UUID,
    ) -> SignToCreate:
        sign = SignToCreate(
            entity_id=entity_id,
            entity_type=entity_type.__name__,
            requested_by_id=requested_by_id,
        )
        # FIXME: Проверить что запись создана
        result = await self.collection.insert_one(sign.dict())
        _LOG.info(f"Результат создания подписи: {result}")
        return sign

    async def get(
        self,
        uid: UUID,
    ) -> Optional[SignToCreate]:
        _LOG.info(f"Запрашиваю подпись по id: {uid}")
        projection = {
            "_id": False,
        }
        for key in SignToCreate.model_fields:
            projection[key] = True
        _LOG.info(f"{projection=}")
        data = await self.collection.find_one(
            {"id": uid},
            projection=projection,
        )
        _LOG.info(f"Полученные данные: {data}")
        if data:
            return SignToCreate(**data)
        _LOG.info(f"Подпись не найдена. {uid=}")
        return None

    async def get_not_expired_sign(
        self,
        user_id: UUID,
        entity_id: UUID,
    ) -> Optional[SignToCreate]:
        _LOG.info(f"Запрашиваю подпись {user_id=} {entity_id=}")
        projection = {
            "_id": False,
        }
        for key in SignToCreate.model_fields:
            projection[key] = True
        _LOG.info(f"{projection=}")
        data = await self.collection.find_one(
            {
                "requested_by_id": user_id,
                "entity_id": entity_id,
                "is_used": False,
                "ttl_expire_at": {"$gt": utc_now()},
            },
            projection=projection,

        )
        _LOG.info(f"Полученные данные: {data}")
        if data:
            return SignToCreate(**data)
        _LOG.info(f"Подпись не найдена. {user_id=} {entity_id=}")
        return None

    async def update(
        self,
        uid: UUID,
        update_query: dict,
    ):
        result = await self.collection.update_one(
            {
                "id": uid,
            },
            update_query,
        )
        _LOG.info(f"Результат обновления записи: {uid=} {result=}")

    async def set_sign_used(
        self,
        sign_id: UUID,
        used_by_id: UUID,
    ) -> None:
        query = {
            "$set": {
                "is_used": True,
                "used_at": utc_now(),
                "used_by_id": used_by_id,
            },
        }
        await self.update(
            sign_id,
            query,
        )
