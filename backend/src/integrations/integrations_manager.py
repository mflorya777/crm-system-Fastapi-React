import logging
from typing import (
    Optional,
    List,
    Dict,
    Any,
)
from uuid import UUID

from .integrations_storage import (
    IntegrationsStorage,
    NoSuchIntegrationError,
    IntegrationsStorageException,
)
from .integrations_storage_models import (
    IntegrationToCreate,
    IntegrationToGet,
    IntegrationType,
)


_LOG = logging.getLogger("uvicorn.info")


class IntegrationsManagerError(Exception):
    pass


class NoSuchIntegrationManagerError(IntegrationsManagerError):
    pass


class IntegrationsManager:
    def __init__(
        self,
        integrations_storage: IntegrationsStorage,
    ):
        self.integrations_storage = integrations_storage

    async def create_integration(
        self,
        integration_type: str,
        name: str,
        config: Dict[str, Any],
        created_by: Optional[UUID] = None,
        is_active: bool = True,
    ) -> IntegrationToGet:
        """Создать новую интеграцию"""
        try:
            integration = IntegrationToCreate(
                type=integration_type,
                name=name,
                config=config,
                created_by=created_by,
                is_active=is_active,
            )
            
            return await self.integrations_storage.create(integration)
        except IntegrationsStorageException as e:
            _LOG.error(f"Error creating integration: {e}")
            raise IntegrationsManagerError(f"Failed to create integration: {e}") from e

    async def get_integration(
        self,
        integration_id: UUID,
    ) -> IntegrationToGet:
        """Получить интеграцию по ID"""
        try:
            return await self.integrations_storage.get_by_id(integration_id)
        except NoSuchIntegrationError as e:
            raise NoSuchIntegrationManagerError(str(e)) from e
        except IntegrationsStorageException as e:
            _LOG.error(f"Error getting integration: {e}")
            raise IntegrationsManagerError(f"Failed to get integration: {e}") from e

    async def get_integrations_by_type(
        self,
        integration_type: str,
        active_only: bool = False,
    ) -> List[IntegrationToGet]:
        """Получить все интеграции определенного типа"""
        try:
            return await self.integrations_storage.get_by_type(integration_type, active_only)
        except IntegrationsStorageException as e:
            _LOG.error(f"Error getting integrations by type: {e}")
            raise IntegrationsManagerError(f"Failed to get integrations by type: {e}") from e

    async def get_active_integration(
        self,
        integration_type: str,
    ) -> Optional[IntegrationToGet]:
        """Получить активную интеграцию определенного типа (первую найденную)"""
        try:
            integrations = await self.integrations_storage.get_by_type(integration_type, active_only=True)
            return integrations[0] if integrations else None
        except IntegrationsStorageException as e:
            _LOG.error(f"Error getting active integration: {e}")
            raise IntegrationsManagerError(f"Failed to get active integration: {e}") from e

    async def get_all_integrations(
        self,
        active_only: bool = False,
    ) -> List[IntegrationToGet]:
        """Получить все интеграции"""
        try:
            return await self.integrations_storage.get_all(active_only)
        except IntegrationsStorageException as e:
            _LOG.error(f"Error getting all integrations: {e}")
            raise IntegrationsManagerError(f"Failed to get all integrations: {e}") from e

    async def update_integration(
        self,
        integration_id: UUID,
        name: Optional[str] = None,
        is_active: Optional[bool] = None,
        config: Optional[Dict[str, Any]] = None,
        updated_by: Optional[UUID] = None,
    ) -> IntegrationToGet:
        """Обновить интеграцию"""
        try:
            return await self.integrations_storage.update(
                integration_id=integration_id,
                name=name,
                is_active=is_active,
                config=config,
                updated_by=updated_by,
            )
        except NoSuchIntegrationError as e:
            raise NoSuchIntegrationManagerError(str(e)) from e
        except IntegrationsStorageException as e:
            _LOG.error(f"Error updating integration: {e}")
            raise IntegrationsManagerError(f"Failed to update integration: {e}") from e

    async def delete_integration(
        self,
        integration_id: UUID,
    ) -> None:
        """Удалить интеграцию"""
        try:
            await self.integrations_storage.delete(integration_id)
        except NoSuchIntegrationError as e:
            raise NoSuchIntegrationManagerError(str(e)) from e
        except IntegrationsStorageException as e:
            _LOG.error(f"Error deleting integration: {e}")
            raise IntegrationsManagerError(f"Failed to delete integration: {e}") from e

