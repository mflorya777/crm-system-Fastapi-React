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
from .deals_storage_models import (
    DealToCreate,
    DealToGet,
    DealCategoryToCreate,
    DealCategoryToGet,
    DealStage,
)


_LOG = logging.getLogger("uvicorn.info")


class DealsStorageError(Exception):
    pass


class NoSuchDealError(DealsStorageError):
    pass


class NoSuchDealCategoryError(DealsStorageError):
    pass


class DealsStorageException(Exception):
    pass


class DealsStorage:
    def __init__(
        self,
        mongo_client: MClient,
    ):
        self.mongo_client: MClient = mongo_client
        self.deals_collection_name: str = "deals"
        self.categories_collection_name: str = "deal_categories"
        self.deals_revisions_collection_name: str = f"{self.deals_collection_name}_revisions"
        self.categories_revisions_collection_name: str = f"{self.categories_collection_name}_revisions"
        
        self.deals_collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.deals_collection_name,
            codec_options=codec_options,
        )
        self.categories_collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.categories_collection_name,
            codec_options=codec_options,
        )
        self.deals_revisions_collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.deals_revisions_collection_name,
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
        stages: List[DealStage] = None,
    ) -> DealCategoryToGet:
        """Создать новую категорию сделок (воронку)"""
        if stages is None:
            stages = []
        
        new_category_id = uuid4()
        if not actor_id:
            actor_id = new_category_id
        
        category = DealCategoryToCreate(
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
                    f"Ошибка при добавлении категории сделок."
                    f" Запрос на создание категории выполнен,"
                    f" но при запросе категории из бд вернулся None."
                    f" {category.id}"
                    f" {category.name}"
                )
                _LOG.error(error_message)
                raise DealsStorageException(error_message)
            return new_category
        except DuplicateKeyError as e:
            _LOG.error(e)
            raise DealsStorageException(
                f"Категория с таким именем уже существует: {name}",
            )

    async def get_category(
        self,
        category_id: UUID,
    ) -> DealCategoryToGet:
        """Получить категорию по ID"""
        _LOG.info(f"Запрашиваю категорию по id: {category_id}")
        projection = {
            "_id": False,
        }
        for key in DealCategoryToGet.model_fields:
            projection[key] = True
        data = await self.categories_collection.find_one(
            {"id": category_id},
            projection=projection,
        )
        if data:
            return DealCategoryToGet(**data)
        _LOG.info(f"Категория не найдена. {category_id=}")
        raise NoSuchDealCategoryError(
            f"Категория не найдена. {category_id=}",
        )

    async def get_category_by_object_id(
        self,
        _id: ObjectId,
    ) -> Optional[DealCategoryToGet]:
        """Получить категорию по ObjectId"""
        _LOG.info(f"Запрашиваю категорию по ObjectID: {_id}")
        projection = {
            "_id": False,
        }
        for key in DealCategoryToGet.model_fields:
            projection[key] = True
        data = await self.categories_collection.find_one(
            {
                "_id": _id,
            },
            projection=projection,
        )
        if data:
            return DealCategoryToGet(**data)
        return None

    async def get_all_categories(
        self,
        active_only: bool = False,
    ) -> List[DealCategoryToGet]:
        """Получить все категории"""
        _LOG.info("Запрашиваю все категории")
        query = {}
        if active_only:
            query["is_active"] = True
        
        projection = {
            "_id": False,
        }
        for key in DealCategoryToGet.model_fields:
            projection[key] = True
        
        cursor = self.categories_collection.find(
            query,
            projection=projection,
        )
        categories = []
        async for category in cursor:
            categories.append(DealCategoryToGet(**category))
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
            raise DealsStorageException(error_message)
        
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
    ) -> Optional[DealCategoryToCreate]:
        """Получить полную категорию (для ревизий)"""
        _LOG.info(f"Запрашиваю полную категорию по id: {category_id}")
        projection = {
            "_id": False,
        }
        for key in DealCategoryToCreate.model_fields:
            projection[key] = True
        data = await self.categories_collection.find_one(
            {
                "id": category_id,
            },
            projection=projection,
        )
        if data:
            return DealCategoryToCreate(**data)
        return None

    async def update_category_stages(
        self,
        actor_id: UUID,
        category_id: UUID,
        stages: List[DealStage],
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

    async def add_deal(
        self,
        actor_id: UUID | None,
        category_id: UUID,
        stage_id: UUID,
        title: str,
        responsible_user_id: UUID,
        description: Optional[str] = None,
        amount: Optional[float] = None,
        currency: Optional[str] = "RUB",
        client_id: Optional[UUID] = None,
        order: Optional[int] = None,
    ) -> DealToGet:
        """Создать новую сделку"""
        new_deal_id = uuid4()
        if not actor_id:
            actor_id = new_deal_id
        
        # Если order не указан, вычисляем максимальный order для стадии + 1
        if order is None:
            max_order_deal = await self.deals_collection.find_one(
                {"stage_id": stage_id},
                sort=[("order", -1)],
            )
            order = (max_order_deal.get("order", -1) + 1) if max_order_deal else 0
        
        deal = DealToCreate(
            id=new_deal_id,
            created_by=actor_id,
            updated_by=actor_id,
            category_id=category_id,
            stage_id=stage_id,
            title=title,
            description=description,
            amount=amount,
            currency=currency,
            client_id=client_id,
            responsible_user_id=responsible_user_id,
            order=order,
        )
        
        result = await self.deals_collection.insert_one(
            deal.model_dump(),
        )
        new_deal = await self.get_deal_by_object_id(
            result.inserted_id,
        )

        if not new_deal:
            error_message = (
                f"Ошибка при добавлении сделки."
                f" Запрос на создание сделки выполнен,"
                f" но при запросе сделки из бд вернулся None."
                f" {deal.id}"
                f" {deal.title}"
            )
            _LOG.error(error_message)
            raise DealsStorageException(error_message)
        return new_deal

    async def get_deal(
        self,
        deal_id: UUID,
    ) -> DealToGet:
        """Получить сделку по ID"""
        _LOG.info(f"Запрашиваю сделку по id: {deal_id}")
        projection = {
            "_id": False,
        }
        for key in DealToGet.model_fields:
            projection[key] = True
        data = await self.deals_collection.find_one(
            {
                "id": deal_id,
            },
            projection=projection,
        )
        if data:
            return DealToGet(**data)
        _LOG.info(f"Сделка не найдена. {deal_id=}")
        raise NoSuchDealError(
            f"Сделка не найдена. {deal_id=}",
        )

    async def get_deal_by_object_id(
        self,
        _id: ObjectId,
    ) -> Optional[DealToGet]:
        """Получить сделку по ObjectId"""
        _LOG.info(f"Запрашиваю сделку по ObjectID: {_id}")
        projection = {
            "_id": False,
        }
        for key in DealToGet.model_fields:
            projection[key] = True
        data = await self.deals_collection.find_one(
            {
                "_id": _id,
            },
            projection=projection,
        )
        if data:
            return DealToGet(**data)
        return None

    async def get_deals_by_category(
        self,
        category_id: UUID,
        active_only: bool = True,
    ) -> List[DealToGet]:
        """Получить все сделки в категории"""
        _LOG.info(f"Запрашиваю сделки по категории: {category_id}")
        query = {
            "category_id": category_id,
        }
        if active_only:
            query["is_active"] = True
        
        projection = {"_id": False}
        for key in DealToGet.model_fields:
            projection[key] = True
        
        cursor = self.deals_collection.find(
            query,
            projection=projection,
        ).sort("order", 1)  # Сортируем по order по возрастанию
        deals = []
        async for deal in cursor:
            deals.append(DealToGet(**deal))
        return deals

    async def count_deals_by_category(
        self,
        category_id: UUID,
        active_only: bool = True,
    ) -> int:
        """Получить количество сделок в категории"""
        _LOG.info(f"Считаю сделки по категории: {category_id}")
        query = {
            "category_id": category_id,
        }
        if active_only:
            query["is_active"] = True
        
        count = await self.deals_collection.count_documents(query)
        return count

    async def get_deals_by_responsible_user(
        self,
        user_id: UUID,
        active_only: bool = True,
    ) -> List[DealToGet]:
        """Получить все сделки ответственного пользователя"""
        _LOG.info(f"Запрашиваю сделки по ответственному пользователю: {user_id}")
        query = {
            "responsible_user_id": user_id,
        }
        if active_only:
            query["is_active"] = True
        
        projection = {
            "_id": False,
        }
        for key in DealToGet.model_fields:
            projection[key] = True
        
        cursor = self.deals_collection.find(
            query,
            projection=projection,
        ).sort("order", 1)  # Сортируем по order по возрастанию
        deals = []
        async for deal in cursor:
            deals.append(DealToGet(**deal))
        return deals

    async def update_deal_with_revision(
        self,
        actor_id: UUID,
        deal_id: UUID,
        update_query: dict,
    ):
        """Обновить сделку с созданием ревизии"""
        deal = await self.get_deal_full(deal_id)

        if not deal:
            error_message = (
                f"Ошибка при обновлении сделки."
                f" Сделка с {deal_id=} не найдена."
            )
            raise DealsStorageException(error_message)
        
        current_update_query = update_query.copy()
        if "$inc" in current_update_query:
            current_update_query["$inc"]["revision"] = 1
        else:
            current_update_query["$inc"] = {"revision": 1}
        
        if "$set" not in current_update_query:
            current_update_query["$set"] = {}
        current_update_query["$set"]["updated_at"] = utc_now()
        current_update_query["$set"]["updated_by"] = actor_id
        
        result = await self.deals_collection.update_one(
            {
                "id": deal_id,
            },
            current_update_query,
        )
        _LOG.info(f"Результат обновления сделки: {deal_id=} {result=}")
        await self.deals_revisions_collection.insert_one(
            deal.model_dump(),
        )

    async def get_deal_full(
        self,
        deal_id: UUID,
    ) -> Optional[DealToCreate]:
        """Получить полную сделку (для ревизий)"""
        _LOG.info(f"Запрашиваю полную сделку по id: {deal_id}")
        projection = {
            "_id": False,
        }
        for key in DealToCreate.model_fields:
            projection[key] = True
        data = await self.deals_collection.find_one(
            {
                "id": deal_id,
            },
            projection=projection,
        )
        if data:
            return DealToCreate(**data)
        return None

    async def move_deal_to_stage(
        self,
        actor_id: UUID,
        deal_id: UUID,
        new_stage_id: UUID,
        order: Optional[int] = None,
    ):
        """Переместить сделку в другую стадию"""
        # Получаем текущую сделку
        current_deal = await self.get_deal(deal_id)
        old_stage_id = current_deal.stage_id
        old_order = current_deal.order
        
        # Если order не указан, вычисляем максимальный order для новой стадии + 1
        if order is None:
            max_order_deal = await self.deals_collection.find_one(
                {"stage_id": new_stage_id},
                sort=[("order", -1)],
            )
            order = (max_order_deal.get("order", -1) + 1) if max_order_deal else 0
        
        # Если перемещаем в ту же стадию, нужно обновить порядок других сделок
        if old_stage_id == new_stage_id:
            # Если порядок не изменился, ничего не делаем
            if old_order == order:
                return
            # Сдвигаем порядок других сделок в стадии
            await self._reorder_deals_in_stage(new_stage_id, deal_id, old_order, order)
        else:
            # Если перемещаем в другую стадию, нужно:
            # 1. Сдвинуть порядок сделок в старой стадии (уменьшить order всех сделок после старой позиции)
            await self.deals_collection.update_many(
                {
                    "stage_id": old_stage_id,
                    "id": {"$ne": deal_id},
                    "order": {"$gt": old_order},
                },
                {"$inc": {"order": -1}},
            )
            # 2. Сдвинуть порядок сделок в новой стадии (увеличить order всех сделок начиная с новой позиции)
            await self.deals_collection.update_many(
                {
                    "stage_id": new_stage_id,
                    "id": {"$ne": deal_id},
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
        await self.update_deal_with_revision(
            actor_id,
            deal_id,
            update_query,
        )
    
    async def _reorder_deals_in_stage(
        self,
        stage_id: UUID,
        moved_deal_id: UUID,
        old_order: int,
        new_order: int,
    ):
        """Переупорядочить сделки в стадии при перемещении в той же стадии"""
        if old_order == new_order:
            return  # Порядок не изменился
        
        # Если перемещаем вперед (уменьшаем order)
        if new_order < old_order:
            # Увеличиваем order всех сделок между new_order и old_order
            await self.deals_collection.update_many(
                {
                    "stage_id": stage_id,
                    "id": {"$ne": moved_deal_id},
                    "order": {"$gte": new_order, "$lt": old_order},
                },
                {"$inc": {"order": 1}},
            )
        # Если перемещаем назад (увеличиваем order)
        else:
            # Уменьшаем order всех сделок между old_order и new_order
            await self.deals_collection.update_many(
                {
                    "stage_id": stage_id,
                    "id": {"$ne": moved_deal_id},
                    "order": {"$gt": old_order, "$lte": new_order},
                },
                {"$inc": {"order": -1}},
            )

    async def close_deal(
        self,
        actor_id: UUID,
        deal_id: UUID,
    ):
        """Закрыть сделку"""
        update_query = {
            "$set": {
                "is_active": False,
                "closed_at": utc_now(),
            },
        }
        await self.update_deal_with_revision(
            actor_id,
            deal_id,
            update_query,
        )
