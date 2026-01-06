import logging
from typing import (
    Optional,
    List,
    Dict,
    Any,
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
from .integrations_storage_models import (
    IntegrationToCreate,
    IntegrationToGet,
)


_LOG = logging.getLogger("uvicorn.info")


class IntegrationsStorageError(Exception):
    pass


class NoSuchIntegrationError(IntegrationsStorageError):
    pass


class IntegrationsStorageException(Exception):
    pass


class IntegrationsStorage:
    def __init__(
        self,
        mongo_client: MClient,
    ):
        self.mongo_client: MClient = mongo_client
        self.integrations_collection_name: str = "integrations"
        
        self.integrations_collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.integrations_collection_name,
            codec_options=codec_options,
        )

    async def create(
        self,
        integration: IntegrationToCreate,
    ) -> IntegrationToGet:
        """Создать новую интеграцию"""
        try:
            integration_dict = integration.model_dump()
            integration_dict["_id"] = ObjectId()
            integration_dict["id"] = str(integration.id)
            
            await self.integrations_collection.insert_one(integration_dict)
            _LOG.info(f"Integration created: {integration.id}, type: {integration.type}, name: {integration.name}")
            
            return await self.get_by_id(integration.id)
        except DuplicateKeyError as e:
            _LOG.error(f"Duplicate key error while creating integration: {e}")
            raise IntegrationsStorageException(f"Integration with id {integration.id} already exists") from e
        except Exception as e:
            _LOG.error(f"Error creating integration: {e}")
            raise IntegrationsStorageException(f"Failed to create integration: {e}") from e

    async def get_by_id(
        self,
        integration_id: UUID,
    ) -> IntegrationToGet:
        """Получить интеграцию по ID"""
        try:
            integration_dict = await self.integrations_collection.find_one({"id": str(integration_id)})
            if not integration_dict:
                raise NoSuchIntegrationError(f"Integration with id {integration_id} not found")
            
            integration_dict.pop("_id", None)
            return IntegrationToGet(**integration_dict)
        except NoSuchIntegrationError:
            raise
        except Exception as e:
            _LOG.error(f"Error getting integration by id: {e}")
            raise IntegrationsStorageException(f"Failed to get integration: {e}") from e

    async def get_by_type(
        self,
        integration_type: str,
        active_only: bool = False,
    ) -> List[IntegrationToGet]:
        """Получить все интеграции определенного типа"""
        try:
            query: Dict[str, Any] = {"type": integration_type}
            if active_only:
                query["is_active"] = True
            
            cursor = self.integrations_collection.find(query)
            integrations = []
            async for doc in cursor:
                doc.pop("_id", None)
                integrations.append(IntegrationToGet(**doc))
            
            return integrations
        except Exception as e:
            _LOG.error(f"Error getting integrations by type: {e}")
            raise IntegrationsStorageException(f"Failed to get integrations by type: {e}") from e

    async def get_all(
        self,
        active_only: bool = False,
    ) -> List[IntegrationToGet]:
        """Получить все интеграции"""
        try:
            query: Dict[str, Any] = {}
            if active_only:
                query["is_active"] = True
            
            cursor = self.integrations_collection.find(query)
            integrations = []
            async for doc in cursor:
                doc.pop("_id", None)
                integrations.append(IntegrationToGet(**doc))
            
            return integrations
        except Exception as e:
            _LOG.error(f"Error getting all integrations: {e}")
            raise IntegrationsStorageException(f"Failed to get all integrations: {e}") from e

    async def update(
        self,
        integration_id: UUID,
        name: Optional[str] = None,
        is_active: Optional[bool] = None,
        config: Optional[Dict[str, Any]] = None,
        updated_by: Optional[UUID] = None,
    ) -> IntegrationToGet:
        """Обновить интеграцию"""
        try:
            update_dict: Dict[str, Any] = {
                "updated_at": utc_now(),
            }
            
            if name is not None:
                update_dict["name"] = name
            if is_active is not None:
                update_dict["is_active"] = is_active
            if config is not None:
                update_dict["config"] = config
            if updated_by is not None:
                update_dict["updated_by"] = str(updated_by)
            
            result = await self.integrations_collection.update_one(
                {"id": str(integration_id)},
                {"$set": update_dict},
            )
            
            if result.matched_count == 0:
                raise NoSuchIntegrationError(f"Integration with id {integration_id} not found")
            
            _LOG.info(f"Integration updated: {integration_id}")
            return await self.get_by_id(integration_id)
        except NoSuchIntegrationError:
            raise
        except Exception as e:
            _LOG.error(f"Error updating integration: {e}")
            raise IntegrationsStorageException(f"Failed to update integration: {e}") from e

    async def delete(
        self,
        integration_id: UUID,
    ) -> None:
        """Удалить интеграцию"""
        try:
            result = await self.integrations_collection.delete_one({"id": str(integration_id)})
            if result.deleted_count == 0:
                raise NoSuchIntegrationError(f"Integration with id {integration_id} not found")
            
            _LOG.info(f"Integration deleted: {integration_id}")
        except NoSuchIntegrationError:
            raise
        except Exception as e:
            _LOG.error(f"Error deleting integration: {e}")
            raise IntegrationsStorageException(f"Failed to delete integration: {e}") from e

