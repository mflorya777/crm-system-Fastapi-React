import logging
from typing import (
    List,
    Optional,
)
from uuid import UUID

from src.buyers.buyers_storage import (
    BuyersStorage,
    NoSuchBuyerError,
    NoSuchBuyerCategoryError,
    BuyersStorageException,
)
from src.buyers.buyers_storage_models import (
    BuyerToGet,
    BuyerCategoryToGet,
    BuyerStage,
)
from src.users.users_storage import (
    UsersStorage,
    UsersStorageNoSuchUserException,
)
from src.permissions.permissions_manager import PermissionsManager


_LOG = logging.getLogger("uvicorn.error")


class BuyersManagerException(Exception):
    pass


class NoSuchBuyerError(BuyersManagerException):
    pass


class NoSuchBuyerCategoryError(BuyersManagerException):
    pass


class InvalidStageError(BuyersManagerException):
    pass


class BuyersManager:
    def __init__(
        self,
        buyers_storage: BuyersStorage,
        users_storage: UsersStorage,
        permissions_manager: PermissionsManager,
    ):
        self.buyers_storage: BuyersStorage = buyers_storage
        self.users_storage: UsersStorage = users_storage
        self.permissions_manager: PermissionsManager = permissions_manager

    async def create_category(
        self,
        actor_id: UUID,
        name: str,
        description: Optional[str] = None,
        stages: List[BuyerStage] = None,
    ) -> BuyerCategoryToGet:
        """Создать новую категорию покупателей (воронку)"""
        try:
            category = await self.buyers_storage.add_category(
                actor_id=actor_id,
                name=name,
                description=description,
                stages=stages or [],
            )
            return category
        except BuyersStorageException as e:
            _LOG.error(e)
            raise BuyersManagerException(
                f"Ошибка при создании категории: {str(e)}",
            )

    async def get_category(
        self,
        actor_id: UUID,
        category_id: UUID,
    ) -> BuyerCategoryToGet:
        """Получить категорию по ID"""
        try:
            return await self.buyers_storage.get_category(category_id)
        except NoSuchBuyerCategoryError as e:
            _LOG.error(e)
            raise NoSuchBuyerCategoryError(str(e))

    async def get_all_categories(
        self,
        actor_id: UUID,
        active_only: bool = False,
    ) -> List[BuyerCategoryToGet]:
        """Получить все категории"""
        try:
            return await self.buyers_storage.get_all_categories(
                active_only=active_only,
            )
        except Exception as e:
            _LOG.error(e)
            raise BuyersManagerException(
                f"Ошибка при получении категорий: {str(e)}",
            )

    async def update_category_stages(
        self,
        actor_id: UUID,
        category_id: UUID,
        stages: List[BuyerStage],
    ) -> BuyerCategoryToGet:
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
            await self.buyers_storage.update_category_stages(
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
            raise BuyersManagerException(
                f"Ошибка при обновлении стадий: {str(e)}",
            )

    async def update_category(
        self,
        actor_id: UUID,
        category_id: UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> BuyerCategoryToGet:
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
            await self.buyers_storage.update_category_with_revision(
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
            raise BuyersManagerException(
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
            await self.buyers_storage.soft_delete_category(
                actor_id=actor_id,
                category_id=category_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise BuyersManagerException(
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
            await self.buyers_storage.soft_delete_stage(
                actor_id=actor_id,
                category_id=category_id,
                stage_id=stage_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise BuyersManagerException(
                f"Ошибка при удалении стадии: {str(e)}",
            )

    async def create_buyer(
        self,
        actor_id: UUID,
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
            raise BuyersManagerException(
                f"Ответственный пользователь не найден: {responsible_user_id}",
            )
        
        try:
            buyer = await self.buyers_storage.add_buyer(
                actor_id=actor_id,
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
            return buyer
        except BuyersStorageException as e:
            _LOG.error(e)
            raise BuyersManagerException(
                f"Ошибка при создании покупателя: {str(e)}",
            )

    async def get_buyer(
        self,
        actor_id: UUID,
        buyer_id: UUID,
    ) -> BuyerToGet:
        """Получить покупателя по ID"""
        try:
            return await self.buyers_storage.get_buyer(buyer_id)
        except NoSuchBuyerError as e:
            _LOG.error(e)
            raise NoSuchBuyerError(str(e))

    async def get_buyers_by_category(
        self,
        actor_id: UUID,
        category_id: UUID,
        active_only: bool = True,
        search: Optional[str] = None,
        stage_id: Optional[UUID] = None,
        sort_field: str = "order",
        sort_direction: str = "asc",
    ) -> List[BuyerToGet]:
        """Получить все покупатели в категории с поддержкой поиска, фильтрации и сортировки"""
        # Проверяем, что категория существует
        await self.get_category(actor_id, category_id)
        
        try:
            return await self.buyers_storage.get_buyers_by_category(
                category_id=category_id,
                active_only=active_only,
                search=search,
                stage_id=stage_id,
                sort_field=sort_field,
                sort_direction=sort_direction,
            )
        except Exception as e:
            _LOG.error(e)
            raise BuyersManagerException(
                f"Ошибка при получении покупателей: {str(e)}",
            )

    async def get_buyers_by_responsible_user(
        self,
        actor_id: UUID,
        user_id: UUID,
        active_only: bool = True,
    ) -> List[BuyerToGet]:
        """Получить все покупатели ответственного пользователя"""
        try:
            await self.users_storage.get(user_id)
        except UsersStorageNoSuchUserException:
            raise BuyersManagerException(
                f"Пользователь не найден: {user_id}",
            )
        
        try:
            return await self.buyers_storage.get_buyers_by_responsible_user(
                user_id=user_id,
                active_only=active_only,
            )
        except Exception as e:
            _LOG.error(e)
            raise BuyersManagerException(
                f"Ошибка при получении покупателей: {str(e)}",
            )

    async def count_buyers_by_category(
        self,
        actor_id: UUID,
        category_id: UUID,
        active_only: bool = True,
    ) -> int:
        """Получить количество покупателей в категории"""
        # Проверяем, что категория существует
        await self.get_category(
            actor_id,
            category_id,
            )
        
        try:
            return await self.buyers_storage.count_buyers_by_category(
                category_id=category_id,
                active_only=active_only,
            )
        except Exception as e:
            _LOG.error(e)
            raise BuyersManagerException(
                f"Ошибка при подсчете покупателей: {str(e)}",
            )

    async def sum_buyers_amount_by_category(
        self,
        actor_id: UUID,
        category_id: UUID,
        active_only: bool = True,
    ) -> float:
        """Получить сумму потенциальной стоимости всех покупателей в категории"""
        await self.get_category(
            actor_id,
            category_id,
        )
        
        try:
            return await self.buyers_storage.sum_buyers_amount_by_category(
                category_id=category_id,
                active_only=active_only,
            )
        except Exception as e:
            _LOG.error(e)
            raise BuyersManagerException(
                f"Ошибка при суммировании покупателей: {str(e)}",
            )

    async def update_buyer(
        self,
        actor_id: UUID,
        buyer_id: UUID,
        name: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        company: Optional[str] = None,
        address: Optional[str] = None,
        notes: Optional[str] = None,
        potential_value: Optional[float] = None,
        responsible_user_id: Optional[UUID] = None,
    ) -> BuyerToGet:
        """Обновить покупателя"""
        buyer = await self.get_buyer(
            actor_id,
            buyer_id,
        )
        
        update_query = {
            "$set": {},
        }

        if name is not None:
            update_query["$set"]["name"] = name
        if email is not None:
            update_query["$set"]["email"] = email
        if phone is not None:
            update_query["$set"]["phone"] = phone
        if company is not None:
            update_query["$set"]["company"] = company
        if address is not None:
            update_query["$set"]["address"] = address
        if notes is not None:
            update_query["$set"]["notes"] = notes
        if potential_value is not None:
            update_query["$set"]["potential_value"] = potential_value
        if responsible_user_id is not None:

            try:
                await self.users_storage.get(
                    responsible_user_id,
                )
            except UsersStorageNoSuchUserException:
                raise BuyersManagerException(
                    f"Ответственный пользователь не найден: {responsible_user_id}",
                )
            update_query["$set"]["responsible_user_id"] = responsible_user_id
        
        if not update_query["$set"]:
            return buyer
        
        try:
            await self.buyers_storage.update_buyer_with_revision(
                actor_id=actor_id,
                buyer_id=buyer_id,
                update_query=update_query,
            )
            return await self.get_buyer(
                actor_id,
                buyer_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise BuyersManagerException(
                f"Ошибка при обновлении покупатели: {str(e)}",
            )

    async def delete_buyer(
        self,
        actor_id: UUID,
        buyer_id: UUID,
    ):
        """Мягкое удаление покупатели (установка is_active = False)"""
        # Проверяем, что покупатель существует
        await self.get_buyer(actor_id, buyer_id)
        
        try:
            await self.buyers_storage.soft_delete_buyer(
                actor_id=actor_id,
                buyer_id=buyer_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise BuyersManagerException(
                f"Ошибка при удалении покупатели: {str(e)}",
            )

    async def move_buyer_to_stage(
        self,
        actor_id: UUID,
        buyer_id: UUID,
        new_stage_id: UUID,
        order: Optional[int] = None,
    ) -> BuyerToGet:
        """Переместить покупателя в другую стадию"""
        buyer = await self.get_buyer(
            actor_id,
            buyer_id,
        )
        
        # Проверяем, что новая стадия существует в категории покупатели
        category = await self.get_category(
            actor_id,
            buyer.category_id,
        )
        stage_exists = any(stage.id == new_stage_id for stage in category.stages)
        if not stage_exists:
            raise InvalidStageError(
                f"Стадия {new_stage_id} не найдена в категории {buyer.category_id}",
            )
        
        try:
            await self.buyers_storage.move_buyer_to_stage(
                actor_id=actor_id,
                buyer_id=buyer_id,
                new_stage_id=new_stage_id,
                order=order,
            )
            return await self.get_buyer(
                actor_id,
                buyer_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise BuyersManagerException(
                f"Ошибка при перемещении покупатели: {str(e)}",
            )

    async def close_buyer(
        self,
        actor_id: UUID,
        buyer_id: UUID,
    ) -> BuyerToGet:
        """Закрыть покупателя"""
        await self.get_buyer(
            actor_id,
            buyer_id,
        )
        
        try:
            await self.buyers_storage.close_buyer(
                actor_id=actor_id,
                buyer_id=buyer_id,
            )
            return await self.get_buyer(
                actor_id,
                buyer_id,
            )
        except Exception as e:
            _LOG.error(e)
            raise BuyersManagerException(
                f"Ошибка при закрытии покупатели: {str(e)}",
            )
