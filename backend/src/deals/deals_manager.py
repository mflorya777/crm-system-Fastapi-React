import logging
from typing import (
    List,
    Optional,
)
from uuid import UUID

from src.deals.deals_storage import (
    DealsStorage,
    NoSuchDealError,
    NoSuchDealCategoryError,
    DealsStorageException,
)
from src.deals.deals_storage_models import (
    DealToGet,
    DealCategoryToGet,
    DealStage,
)
from src.users.users_storage import (
    UsersStorage,
    UsersStorageNoSuchUserException,
)
from src.permissions.permissions_manager import PermissionsManager


_LOG = logging.getLogger("uvicorn.error")


class DealsManagerException(Exception):
    pass


class NoSuchDealError(DealsManagerException):
    pass


class NoSuchDealCategoryError(DealsManagerException):
    pass


class InvalidStageError(DealsManagerException):
    pass


class DealsManager:
    def __init__(
        self,
        deals_storage: DealsStorage,
        users_storage: UsersStorage,
        permissions_manager: PermissionsManager,
    ):
        self.deals_storage: DealsStorage = deals_storage
        self.users_storage: UsersStorage = users_storage
        self.permissions_manager: PermissionsManager = permissions_manager

    async def create_category(
        self,
        actor_id: UUID,
        name: str,
        description: Optional[str] = None,
        stages: List[DealStage] = None,
    ) -> DealCategoryToGet:
        """Создать новую категорию сделок (воронку)"""
        try:
            category = await self.deals_storage.add_category(
                actor_id=actor_id,
                name=name,
                description=description,
                stages=stages or [],
            )
            return category
        except DealsStorageException as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при создании категории: {str(e)}",
            )

    async def get_category(
        self,
        actor_id: UUID,
        category_id: UUID,
    ) -> DealCategoryToGet:
        """Получить категорию по ID"""
        try:
            return await self.deals_storage.get_category(category_id)
        except NoSuchDealCategoryError as e:
            _LOG.error(e)
            raise NoSuchDealCategoryError(str(e))

    async def get_all_categories(
        self,
        actor_id: UUID,
        active_only: bool = False,
    ) -> List[DealCategoryToGet]:
        """Получить все категории"""
        try:
            return await self.deals_storage.get_all_categories(
                active_only=active_only,
            )
        except Exception as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при получении категорий: {str(e)}",
            )

    async def update_category_stages(
        self,
        actor_id: UUID,
        category_id: UUID,
        stages: List[DealStage],
    ) -> DealCategoryToGet:
        """Обновить стадии в категории (воронке)"""
        category = await self.get_category(
            actor_id,
            category_id,
        )
        
        # Валидация стадий: проверяем уникальность order и наличие хотя бы одной стадии
        if not stages:
            raise InvalidStageError("Воронка должна содержать хотя бы одну стадию")
        
        orders = [stage.order for stage in stages]
        if len(orders) != len(set(orders)):
            raise InvalidStageError("Порядок стадий должен быть уникальным")
        
        try:
            await self.deals_storage.update_category_stages(
                actor_id=actor_id,
                category_id=category_id,
                stages=stages,
            )
            return await self.get_category(
                actor_id,
                category_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при обновлении стадий: {str(e)}",
            )

    async def update_category(
        self,
        actor_id: UUID,
        category_id: UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> DealCategoryToGet:
        """Обновить категорию"""
        category = await self.get_category(
            actor_id,
            category_id,
        )
        
        update_query = {
            "$set": {},
        }

        if name is not None:
            update_query["$set"]["name"] = name
        if description is not None:
            update_query["$set"]["description"] = description
        if is_active is not None:
            update_query["$set"]["is_active"] = is_active
        
        if not update_query["$set"]:
            return category
        
        try:
            await self.deals_storage.update_category_with_revision(
                actor_id=actor_id,
                category_id=category_id,
                update_query=update_query,
            )
            return await self.get_category(
                actor_id,
                category_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при обновлении категории: {str(e)}",
            )

    async def delete_category(
        self,
        actor_id: UUID,
        category_id: UUID,
    ):
        """Мягкое удаление категории (установка is_active = False)"""
        # Проверяем, что категория существует
        await self.get_category(actor_id, category_id)
        
        try:
            await self.deals_storage.soft_delete_category(
                actor_id=actor_id,
                category_id=category_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при удалении категории: {str(e)}",
            )

    async def delete_stage(
        self,
        actor_id: UUID,
        category_id: UUID,
        stage_id: UUID,
    ):
        """Мягкое удаление стадии (установка is_active = False)"""
        # Проверяем, что категория существует
        category = await self.get_category(actor_id, category_id)
        
        # Проверяем, что стадия существует
        stage_exists = any(stage.id == stage_id for stage in category.stages)
        if not stage_exists:
            raise InvalidStageError(f"Стадия {stage_id} не найдена в категории {category_id}")
        
        try:
            await self.deals_storage.soft_delete_stage(
                actor_id=actor_id,
                category_id=category_id,
                stage_id=stage_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при удалении стадии: {str(e)}",
            )

    async def create_deal(
        self,
        actor_id: UUID,
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
        category = await self.get_category(
            actor_id,
            category_id,
        )
        
        # Проверяем, что стадия существует в категории
        stage_exists = any(stage.id == stage_id for stage in category.stages)
        if not stage_exists:
            raise InvalidStageError(f"Стадия {stage_id} не найдена в категории {category_id}")
        
        # Проверяем, что ответственный пользователь существует
        try:
            await self.users_storage.get(
                responsible_user_id,
            )
        except UsersStorageNoSuchUserException:
            raise DealsManagerException(
                f"Ответственный пользователь не найден: {responsible_user_id}",
            )
        
        try:
            deal = await self.deals_storage.add_deal(
                actor_id=actor_id,
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
            return deal
        except DealsStorageException as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при создании сделки: {str(e)}",
            )

    async def get_deal(
        self,
        actor_id: UUID,
        deal_id: UUID,
    ) -> DealToGet:
        """Получить сделку по ID"""
        try:
            return await self.deals_storage.get_deal(deal_id)
        except NoSuchDealError as e:
            _LOG.error(e)
            raise NoSuchDealError(str(e))

    async def get_deals_by_category(
        self,
        actor_id: UUID,
        category_id: UUID,
        active_only: bool = True,
        search: Optional[str] = None,
        stage_id: Optional[UUID] = None,
        sort_field: str = "order",
        sort_direction: str = "asc",
    ) -> List[DealToGet]:
        """Получить все сделки в категории с поддержкой поиска, фильтрации и сортировки"""
        # Проверяем, что категория существует
        await self.get_category(actor_id, category_id)
        
        try:
            return await self.deals_storage.get_deals_by_category(
                category_id=category_id,
                active_only=active_only,
                search=search,
                stage_id=stage_id,
                sort_field=sort_field,
                sort_direction=sort_direction,
            )
        except Exception as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при получении сделок: {str(e)}",
            )

    async def get_deals_by_responsible_user(
        self,
        actor_id: UUID,
        user_id: UUID,
        active_only: bool = True,
    ) -> List[DealToGet]:
        """Получить все сделки ответственного пользователя"""
        try:
            await self.users_storage.get(user_id)
        except UsersStorageNoSuchUserException:
            raise DealsManagerException(
                f"Пользователь не найден: {user_id}",
            )
        
        try:
            return await self.deals_storage.get_deals_by_responsible_user(
                user_id=user_id,
                active_only=active_only,
            )
        except Exception as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при получении сделок: {str(e)}",
            )

    async def count_deals_by_category(
        self,
        actor_id: UUID,
        category_id: UUID,
        active_only: bool = True,
    ) -> int:
        """Получить количество сделок в категории"""
        # Проверяем, что категория существует
        await self.get_category(
            actor_id,
            category_id,
            )
        
        try:
            return await self.deals_storage.count_deals_by_category(
                category_id=category_id,
                active_only=active_only,
            )
        except Exception as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при подсчете сделок: {str(e)}",
            )

    async def sum_deals_amount_by_category(
        self,
        actor_id: UUID,
        category_id: UUID,
        active_only: bool = True,
    ) -> float:
        """Получить сумму всех сделок в категории"""
        await self.get_category(
            actor_id,
            category_id,
        )
        
        try:
            return await self.deals_storage.sum_deals_amount_by_category(
                category_id=category_id,
                active_only=active_only,
            )
        except Exception as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при суммировании сделок: {str(e)}",
            )

    async def update_deal(
        self,
        actor_id: UUID,
        deal_id: UUID,
        title: Optional[str] = None,
        description: Optional[str] = None,
        amount: Optional[float] = None,
        currency: Optional[str] = None,
        client_id: Optional[UUID] = None,
        responsible_user_id: Optional[UUID] = None,
    ) -> DealToGet:
        """Обновить сделку"""
        deal = await self.get_deal(
            actor_id,
            deal_id,
        )
        
        update_query = {
            "$set": {},
        }

        if title is not None:
            update_query["$set"]["title"] = title
        if description is not None:
            update_query["$set"]["description"] = description
        if amount is not None:
            update_query["$set"]["amount"] = amount
        if currency is not None:
            update_query["$set"]["currency"] = currency
        if client_id is not None:
            update_query["$set"]["client_id"] = client_id
        if responsible_user_id is not None:

            try:
                await self.users_storage.get(
                    responsible_user_id,
                )
            except UsersStorageNoSuchUserException:
                raise DealsManagerException(
                    f"Ответственный пользователь не найден: {responsible_user_id}",
                )
            update_query["$set"]["responsible_user_id"] = responsible_user_id
        
        if not update_query["$set"]:
            return deal
        
        try:
            await self.deals_storage.update_deal_with_revision(
                actor_id=actor_id,
                deal_id=deal_id,
                update_query=update_query,
            )
            return await self.get_deal(
                actor_id,
                deal_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при обновлении сделки: {str(e)}",
            )

    async def delete_deal(
        self,
        actor_id: UUID,
        deal_id: UUID,
    ):
        """Мягкое удаление сделки (установка is_active = False)"""
        # Проверяем, что сделка существует
        await self.get_deal(actor_id, deal_id)
        
        try:
            await self.deals_storage.soft_delete_deal(
                actor_id=actor_id,
                deal_id=deal_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при удалении сделки: {str(e)}",
            )

    async def move_deal_to_stage(
        self,
        actor_id: UUID,
        deal_id: UUID,
        new_stage_id: UUID,
        order: Optional[int] = None,
    ) -> DealToGet:
        """Переместить сделку в другую стадию"""
        deal = await self.get_deal(
            actor_id,
            deal_id,
        )
        
        # Проверяем, что новая стадия существует в категории сделки
        category = await self.get_category(
            actor_id,
            deal.category_id,
        )
        stage_exists = any(stage.id == new_stage_id for stage in category.stages)
        if not stage_exists:
            raise InvalidStageError(
                f"Стадия {new_stage_id} не найдена в категории {deal.category_id}",
            )
        
        try:
            await self.deals_storage.move_deal_to_stage(
                actor_id=actor_id,
                deal_id=deal_id,
                new_stage_id=new_stage_id,
                order=order,
            )
            return await self.get_deal(
                actor_id,
                deal_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при перемещении сделки: {str(e)}",
            )

    async def close_deal(
        self,
        actor_id: UUID,
        deal_id: UUID,
    ) -> DealToGet:
        """Закрыть сделку"""
        await self.get_deal(
            actor_id,
            deal_id,
        )
        
        try:
            await self.deals_storage.close_deal(
                actor_id=actor_id,
                deal_id=deal_id,
            )
            return await self.get_deal(
                actor_id,
                deal_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise DealsManagerException(
                f"Ошибка при закрытии сделки: {str(e)}",
            )
