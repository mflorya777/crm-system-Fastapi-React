import logging
from typing import (
    Optional,
    List,
)
from uuid import (
    UUID,
    uuid4,
)

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from pymongo.errors import DuplicateKeyError

from src.clients.mongo.client import (
    MClient,
    codec_options,
)
from src.misc.misc_lib import utc_now
from .buyers_storage_models import (
    BuyerToCreate,
    BuyerToGet,
    BuyerCategoryToCreate,
    BuyerCategoryToGet,
    BuyerStage,
)


_LOG = logging.getLogger("uvicorn.info")


class BuyersStorageError(Exception):
    pass


class NoSuchBuyerError(BuyersStorageError):
    pass


class NoSuchBuyerCategoryError(BuyersStorageError):
    pass


class BuyersStorageException(Exception):
    pass


class BuyersStorage:
    def __init__(
        self,
        mongo_client: MClient,
    ):
        self.mongo_client: MClient = mongo_client
        self.buyers_collection_name: str = "buyers"
        self.categories_collection_name: str = "buyer_categories"
        self.buyers_revisions_collection_name: str = f"{self.buyers_collection_name}_revisions"
        self.categories_revisions_collection_name: str = f"{self.categories_collection_name}_revisions"
        
        self.buyers_collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.buyers_collection_name,
            codec_options=codec_options,
        )
        self.categories_collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.categories_collection_name,
            codec_options=codec_options,
        )
        self.buyers_revisions_collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.buyers_revisions_collection_name,
            codec_options=codec_options,
        )
        self.categories_revisions_collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.categories_revisions_collection_name,
            codec_options=codec_options,
        )

    async def add_category(
        self,
        actor_id: UUID | None,
        name: str,
        description: Optional[str] = None,
        stages: List[BuyerStage] = None,
    ) -> BuyerCategoryToGet:
        """Создать новую категорию покупателей (воронку)"""
        if stages is None:
            stages = []
        
        new_category_id = uuid4()
        if not actor_id:
            actor_id = new_category_id
        
        category = BuyerCategoryToCreate(
            id=new_category_id,
            created_by=actor_id,
            updated_by=actor_id,
            name=name,
            description=description,
            stages=stages,
        )
        
        try:
            result = await self.categories_collection.insert_one(
                category.model_dump(),
            )
            new_category = await self.get_category_by_object_id(
                result.inserted_id,
            )
            if not new_category:
                error_message = (
                    f"Ошибка при добавлении категории покупателей."
                    f" Запрос на создание категории выполнен,"
                    f" но при запросе категории из бд вернулся None."
                    f" {category.id}"
                    f" {category.name}"
                )
                _LOG.error(error_message)
                raise BuyersStorageException(error_message)
            return new_category
        except DuplicateKeyError as e:
            _LOG.error(e)
            raise BuyersStorageException(
                f"Категория с таким именем уже существует: {name}",
            )

    async def get_category(
        self,
        category_id: UUID,
    ) -> BuyerCategoryToGet:
        """Получить категорию по ID"""
        _LOG.info(f"Запрашиваю категорию по id: {category_id}")
        projection = {
            "_id": False,
        }
        for key in BuyerCategoryToGet.model_fields:
            projection[key] = True
        data = await self.categories_collection.find_one(
            {"id": category_id},
            projection=projection,
        )
        if data:
            return BuyerCategoryToGet(**data)
        _LOG.info(f"Категория не найдена. {category_id=}")
        raise NoSuchBuyerCategoryError(
            f"Категория не найдена. {category_id=}",
        )

    async def get_category_by_object_id(
        self,
        _id: ObjectId,
    ) -> Optional[BuyerCategoryToGet]:
        """Получить категорию по ObjectId"""
        _LOG.info(f"Запрашиваю категорию по ObjectID: {_id}")
        projection = {
            "_id": False,
        }
        for key in BuyerCategoryToGet.model_fields:
            projection[key] = True
        data = await self.categories_collection.find_one(
            {
                "_id": _id,
            },
            projection=projection,
        )
        if data:
            return BuyerCategoryToGet(**data)
        return None

    async def get_all_categories(
        self,
        active_only: bool = False,
    ) -> List[BuyerCategoryToGet]:
        """Получить все категории"""
        _LOG.info("Запрашиваю все категории")
        query = {}
        if active_only:
            query["is_active"] = True
        
        projection = {
            "_id": False,
        }
        for key in BuyerCategoryToGet.model_fields:
            projection[key] = True
        
        cursor = self.categories_collection.find(
            query,
            projection=projection,
        )
        categories = []
        async for category in cursor:
            categories.append(BuyerCategoryToGet(**category))
        return categories

    async def update_category_with_revision(
        self,
        actor_id: UUID,
        category_id: UUID,
        update_query: dict,
    ):
        """Обновить категорию с созданием ревизии"""
        category = await self.get_category_full(category_id)

        if not category:
            error_message = (
                f"Ошибка при обновлении категории."
                f" Категория с {category_id=} не найдена."
            )
            raise BuyersStorageException(error_message)
        
        current_update_query = update_query.copy()
        if "$inc" in current_update_query:
            current_update_query["$inc"]["revision"] = 1
        else:
            current_update_query["$inc"] = {"revision": 1}
        
        if "$set" not in current_update_query:
            current_update_query["$set"] = {}
        current_update_query["$set"]["updated_at"] = utc_now()
        current_update_query["$set"]["updated_by"] = actor_id
        
        result = await self.categories_collection.update_one(
            {
                "id": category_id,
            },
            current_update_query,
        )
        _LOG.info(f"Результат обновления категории: {category_id=} {result=}")
        await self.categories_revisions_collection.insert_one(
            category.model_dump(),
        )

    async def get_category_full(
        self,
        category_id: UUID,
    ) -> Optional[BuyerCategoryToCreate]:
        """Получить полную категорию (для ревизий)"""
        _LOG.info(f"Запрашиваю полную категорию по id: {category_id}")
        projection = {
            "_id": False,
        }
        for key in BuyerCategoryToCreate.model_fields:
            projection[key] = True
        data = await self.categories_collection.find_one(
            {
                "id": category_id,
            },
            projection=projection,
        )
        if data:
            return BuyerCategoryToCreate(**data)
        return None

    async def update_category_stages(
        self,
        actor_id: UUID,
        category_id: UUID,
        stages: List[BuyerStage],
    ):
        """Обновить стадии в категории"""
        update_query = {
            "$set": {
                "stages": [stage.model_dump() for stage in stages],
            },
        }
        await self.update_category_with_revision(
            actor_id,
            category_id,
            update_query,
        )

    async def soft_delete_category(
        self,
        actor_id: UUID,
        category_id: UUID,
    ):
        """Мягкое удаление категории (установка is_active = False)"""
        _LOG.info(f"Мягкое удаление категории: {category_id}")
        
        update_query = {
            "$set": {
                "is_active": False,
            }
        }
        
        await self.update_category_with_revision(
            actor_id=actor_id,
            category_id=category_id,
            update_query=update_query,
        )

    async def soft_delete_stage(
        self,
        actor_id: UUID,
        category_id: UUID,
        stage_id: UUID,
    ):
        """Мягкое удаление стадии (установка is_active = False)"""
        _LOG.info(f"Мягкое удаление стадии: {stage_id} в категории: {category_id}")
        
        # Получаем категорию
        category = await self.get_category(category_id)
        
        # Находим и обновляем стадию
        stage_found = False
        for stage in category.stages:
            if stage.id == stage_id:
                stage.is_active = False
                stage.updated_at = utc_now()
                stage_found = True
                break
        
        if not stage_found:
            raise BuyersStorageException(f"Стадия {stage_id} не найдена в категории {category_id}")
        
        # Обновляем категорию с новыми стадиями
        await self.update_category_stages(
            actor_id=actor_id,
            category_id=category_id,
            stages=category.stages,
        )

    async def add_buyer(
        self,
        actor_id: UUID | None,
        category_id: UUID,
        stage_id: UUID,
        name: str,
        responsible_user_id: UUID,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        company: Optional[str] = None,
        address: Optional[str] = None,
        notes: Optional[str] = None,
        potential_value: Optional[float] = None,
        order: Optional[int] = None,
    ) -> BuyerToGet:
        """Создать нового покупателя"""
        new_buyer_id = uuid4()
        if not actor_id:
            actor_id = new_buyer_id
        
        # Если order не указан, вычисляем максимальный order для стадии + 1
        if order is None:
            max_order_buyer = await self.buyers_collection.find_one(
                {"stage_id": stage_id},
                sort=[("order", -1)],
            )
            order = (max_order_buyer.get("order", -1) + 1) if max_order_buyer else 0
        
        buyer = BuyerToCreate(
            id=new_buyer_id,
            created_by=actor_id,
            updated_by=actor_id,
            category_id=category_id,
            stage_id=stage_id,
            name=name,
            email=email,
            phone=phone,
            company=company,
            address=address,
            notes=notes,
            potential_value=potential_value,
            responsible_user_id=responsible_user_id,
            order=order,
        )
        
        result = await self.buyers_collection.insert_one(
            buyer.model_dump(),
        )
        new_buyer = await self.get_buyer_by_object_id(
            result.inserted_id,
        )

        if not new_buyer:
            error_message = (
                f"Ошибка при добавлении покупатели."
                f" Запрос на создание покупатели выполнен,"
                f" но при запросе покупатели из бд вернулся None."
                f" {buyer.id}"
                f" {buyer.name}"
            )
            _LOG.error(error_message)
            raise BuyersStorageException(error_message)
        return new_buyer

    async def get_buyer(
        self,
        buyer_id: UUID,
    ) -> BuyerToGet:
        """Получить покупателя по ID"""
        _LOG.info(f"Запрашиваю покупателя по id: {buyer_id}")
        projection = {
            "_id": False,
        }
        for key in BuyerToGet.model_fields:
            projection[key] = True
        data = await self.buyers_collection.find_one(
            {
                "id": buyer_id,
            },
            projection=projection,
        )
        if data:
            return BuyerToGet(**data)
        _LOG.info(f"Покупатель не найдена. {buyer_id=}")
        raise NoSuchBuyerError(
            f"Покупатель не найдена. {buyer_id=}",
        )

    async def get_buyer_by_object_id(
        self,
        _id: ObjectId,
    ) -> Optional[BuyerToGet]:
        """Получить покупателя по ObjectId"""
        _LOG.info(f"Запрашиваю покупателя по ObjectID: {_id}")
        projection = {
            "_id": False,
        }
        for key in BuyerToGet.model_fields:
            projection[key] = True
        data = await self.buyers_collection.find_one(
            {
                "_id": _id,
            },
            projection=projection,
        )
        if data:
            return BuyerToGet(**data)
        return None

    async def get_buyers_by_category(
        self,
        category_id: UUID,
        active_only: bool = True,
        search: Optional[str] = None,
        stage_id: Optional[UUID] = None,
        sort_field: str = "order",
        sort_direction: str = "asc",
    ) -> List[BuyerToGet]:
        """Получить все покупатели в категории с поддержкой поиска, фильтрации и сортировки"""
        _LOG.info(f"Запрашиваю покупатели по категории: {category_id}")
        query: dict = {
            "category_id": category_id,
        }
        if active_only:
            query["is_active"] = True
        
        # Фильтр по стадии
        if stage_id:
            query["stage_id"] = stage_id
        
        # Поиск по названию (регистронезависимый)
        if search:
            query["name"] = {"$regex": search, "$options": "i"}
        
        projection = {"_id": False}
        for key in BuyerToGet.model_fields:
            projection[key] = True
        
        # Определяем направление сортировки
        sort_dir = 1 if sort_direction == "asc" else -1
        
        # Маппинг полей сортировки
        sort_field_map = {
            "order": "order",
            "created_at": "created_at",
            "value": "value",
            "name": "name",
        }
        mongo_sort_field = sort_field_map.get(
            sort_field,
            "order",
        )
        
        cursor = self.buyers_collection.find(
            query,
            projection=projection,
        ).sort(mongo_sort_field, sort_dir)
        
        buyers = []
        async for buyer in cursor:
            buyers.append(BuyerToGet(**buyer))
        return buyers

    async def count_buyers_by_category(
        self,
        category_id: UUID,
        active_only: bool = True,
    ) -> int:
        """Получить количество покупателей в категории"""
        _LOG.info(f"Считаю покупатели по категории: {category_id}")
        query = {
            "category_id": category_id,
        }
        if active_only:
            query["is_active"] = True
        
        count = await self.buyers_collection.count_documents(query)
        return count

    async def sum_buyers_amount_by_category(
        self,
        category_id: UUID,
        active_only: bool = True,
    ) -> float:
        """Получить сумму потенциальной стоимости всех покупателей в категории"""
        _LOG.info(f"Суммирую покупателей по категории: {category_id}")
        match_query = {
            "category_id": category_id,
        }
        if active_only:
            match_query["is_active"] = True
        
        pipeline = [
            {
                "$match": match_query,
            },
            {
                "$group": {"_id": None, "total": {"$sum": "$potential_value"}},
            },
        ]
        
        cursor = self.buyers_collection.aggregate(pipeline)
        result = await cursor.to_list(length=1)
        
        if result and len(result) > 0:
            return result[0].get("total", 0.0)
        return 0.0

    async def get_buyers_by_responsible_user(
        self,
        user_id: UUID,
        active_only: bool = True,
    ) -> List[BuyerToGet]:
        """Получить все покупатели ответственного пользователя"""
        _LOG.info(f"Запрашиваю покупатели по ответственному пользователю: {user_id}")
        query = {
            "responsible_user_id": user_id,
        }
        if active_only:
            query["is_active"] = True
        
        projection = {
            "_id": False,
        }
        for key in BuyerToGet.model_fields:
            projection[key] = True
        
        cursor = self.buyers_collection.find(
            query,
            projection=projection,
        ).sort("order", 1)  # Сортируем по order по возрастанию
        buyers = []
        async for buyer in cursor:
            buyers.append(BuyerToGet(**buyer))
        return buyers

    async def update_buyer_with_revision(
        self,
        actor_id: UUID,
        buyer_id: UUID,
        update_query: dict,
    ):
        """Обновить покупателя с созданием ревизии"""
        buyer = await self.get_buyer_full(buyer_id)

        if not buyer:
            error_message = (
                f"Ошибка при обновлении покупатели."
                f" Покупатель с {buyer_id=} не найдена."
            )
            raise BuyersStorageException(error_message)
        
        current_update_query = update_query.copy()
        if "$inc" in current_update_query:
            current_update_query["$inc"]["revision"] = 1
        else:
            current_update_query["$inc"] = {"revision": 1}
        
        if "$set" not in current_update_query:
            current_update_query["$set"] = {}
        current_update_query["$set"]["updated_at"] = utc_now()
        current_update_query["$set"]["updated_by"] = actor_id
        
        result = await self.buyers_collection.update_one(
            {
                "id": buyer_id,
            },
            current_update_query,
        )
        _LOG.info(f"Результат обновления покупатели: {buyer_id=} {result=}")
        await self.buyers_revisions_collection.insert_one(
            buyer.model_dump(),
        )

    async def get_buyer_full(
        self,
        buyer_id: UUID,
    ) -> Optional[BuyerToCreate]:
        """Получить полную покупателя (для ревизий)"""
        _LOG.info(f"Запрашиваю полную покупателя по id: {buyer_id}")
        projection = {
            "_id": False,
        }
        for key in BuyerToCreate.model_fields:
            projection[key] = True
        data = await self.buyers_collection.find_one(
            {
                "id": buyer_id,
            },
            projection=projection,
        )
        if data:
            return BuyerToCreate(**data)
        return None

    async def soft_delete_buyer(
        self,
        actor_id: UUID,
        buyer_id: UUID,
    ):
        """Мягкое удаление покупатели (установка is_active = False)"""
        _LOG.info(f"Мягкое удаление покупатели: {buyer_id}")
        
        update_query = {
            "$set": {
                "is_active": False,
                "converted_at": utc_now(),
            }
        }
        
        await self.update_buyer_with_revision(
            actor_id=actor_id,
            buyer_id=buyer_id,
            update_query=update_query,
        )

    async def move_buyer_to_stage(
        self,
        actor_id: UUID,
        buyer_id: UUID,
        new_stage_id: UUID,
        order: Optional[int] = None,
    ):
        """Переместить покупателя в другую стадию"""
        # Получаем текущую покупателя
        current_buyer = await self.get_buyer(buyer_id)
        old_stage_id = current_buyer.stage_id
        old_order = current_buyer.order
        
        # Если order не указан, вычисляем максимальный order для новой стадии + 1
        if order is None:
            max_order_buyer = await self.buyers_collection.find_one(
                {"stage_id": new_stage_id},
                sort=[("order", -1)],
            )
            order = (max_order_buyer.get("order", -1) + 1) if max_order_buyer else 0
        
        # Если перемещаем в ту же стадию, нужно обновить порядок других покупателей
        if old_stage_id == new_stage_id:
            # Если порядок не изменился, ничего не делаем
            if old_order == order:
                return
            # Сдвигаем порядок других покупателей в стадии
            await self._reorder_buyers_in_stage(new_stage_id, buyer_id, old_order, order)
        else:
            # Если перемещаем в другую стадию, нужно:
            # 1. Сдвинуть порядок покупателей в старой стадии (уменьшить order всех покупателей после старой позиции)
            await self.buyers_collection.update_many(
                {
                    "stage_id": old_stage_id,
                    "id": {"$ne": buyer_id},
                    "order": {"$gt": old_order},
                },
                {"$inc": {"order": -1}},
            )
            # 2. Сдвинуть порядок покупателей в новой стадии (увеличить order всех покупателей начиная с новой позиции)
            await self.buyers_collection.update_many(
                {
                    "stage_id": new_stage_id,
                    "id": {"$ne": buyer_id},
                    "order": {"$gte": order},
                },
                {"$inc": {"order": 1}},
            )
        
        update_query = {
            "$set": {
                "stage_id": new_stage_id,
                "order": order,
            },
        }
        await self.update_buyer_with_revision(
            actor_id,
            buyer_id,
            update_query,
        )
    
    async def _reorder_buyers_in_stage(
        self,
        stage_id: UUID,
        moved_buyer_id: UUID,
        old_order: int,
        new_order: int,
    ):
        """Переупорядочить покупатели в стадии при перемещении в той же стадии"""
        if old_order == new_order:
            return  # Порядок не изменился
        
        # Если перемещаем вперед (уменьшаем order)
        if new_order < old_order:
            # Увеличиваем order всех покупателей между new_order и old_order
            await self.buyers_collection.update_many(
                {
                    "stage_id": stage_id,
                    "id": {"$ne": moved_buyer_id},
                    "order": {"$gte": new_order, "$lt": old_order},
                },
                {"$inc": {"order": 1}},
            )
        # Если перемещаем назад (увеличиваем order)
        else:
            # Уменьшаем order всех покупателей между old_order и new_order
            await self.buyers_collection.update_many(
                {
                    "stage_id": stage_id,
                    "id": {"$ne": moved_buyer_id},
                    "order": {"$gt": old_order, "$lte": new_order},
                },
                {"$inc": {"order": -1}},
            )

    async def close_buyer(
        self,
        actor_id: UUID,
        buyer_id: UUID,
    ):
        """Конвертировать покупателя (закрыть как успешно конвертированный)"""
        update_query = {
            "$set": {
                "is_active": False,
                "converted_at": utc_now(),
            },
        }
        await self.update_buyer_with_revision(
            actor_id,
            buyer_id,
            update_query,
        )
