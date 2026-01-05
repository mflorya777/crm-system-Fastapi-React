import logging
from typing import (
    Optional,
    List,
    Dict,
    Any,
)
from uuid import UUID

from .telephony_client import (
    MangoOfficeClient,
    MangoOfficeClientError,
)
from .telephony_models import (
    MangoOfficeConfig,
    CallInfo,
    CallStatistic,
)
from ..integrations_storage import IntegrationsStorage
from ..integrations_storage_models import IntegrationType


_LOG = logging.getLogger("uvicorn.info")


class TelephonyManagerError(Exception):
    pass


class TelephonyManager:
    """Менеджер для работы с телефонией"""
    
    def __init__(
        self,
        integrations_storage: IntegrationsStorage,
    ):
        self.integrations_storage = integrations_storage
        self._client: Optional[MangoOfficeClient] = None
        self._current_integration_id: Optional[UUID] = None
    
    async def _get_active_integration(self) -> Optional[Dict[str, Any]]:
        """Получить активную интеграцию телефонии"""
        try:
            integrations = await self.integrations_storage.get_by_type(
                IntegrationType.TELEPHONY,
                active_only=True,
            )
            if not integrations:
                return None
            
            # Берем первую активную интеграцию
            integration = integrations[0]
            return {
                "id": integration.id,
                "config": integration.config,
            }
        except Exception as e:
            _LOG.error(f"Error getting active telephony integration: {e}")
            return None
    
    async def _ensure_client(self) -> MangoOfficeClient:
        """Убедиться, что клиент инициализирован"""
        integration = await self._get_active_integration()
        if not integration:
            raise TelephonyManagerError("No active telephony integration found")
        
        # Если клиент уже инициализирован для этой интеграции, возвращаем его
        if self._client and self._current_integration_id == integration["id"]:
            return self._client
        
        # Создаем новый клиент
        try:
            config = MangoOfficeConfig(**integration["config"])
            self._client = MangoOfficeClient(config)
            self._current_integration_id = integration["id"]
            return self._client
        except Exception as e:
            _LOG.error(f"Error creating Mango Office client: {e}")
            raise TelephonyManagerError(f"Failed to create Mango Office client: {e}") from e
    
    async def test_connection(self) -> bool:
        """Проверить соединение с телефонией"""
        try:
            client = await self._ensure_client()
            return await client.test_connection()
        except TelephonyManagerError:
            raise
        except Exception as e:
            _LOG.error(f"Error testing telephony connection: {e}")
            raise TelephonyManagerError(f"Failed to test connection: {e}") from e
    
    async def get_call_history(
        self,
        date_from: Optional[int] = None,
        date_to: Optional[int] = None,
        from_number: Optional[str] = None,
        to_number: Optional[str] = None,
        limit: int = 100,
    ) -> List[CallInfo]:
        """Получить историю звонков"""
        try:
            client = await self._ensure_client()
            return await client.get_call_history(
                date_from=date_from,
                date_to=date_to,
                from_number=from_number,
                to_number=to_number,
                limit=limit,
            )
        except TelephonyManagerError:
            raise
        except MangoOfficeClientError as e:
            _LOG.error(f"Error getting call history: {e}")
            raise TelephonyManagerError(f"Failed to get call history: {e}") from e
    
    async def make_call(
        self,
        from_number: str,
        to_number: str,
        line_number: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Инициировать звонок"""
        try:
            client = await self._ensure_client()
            return await client.make_call(
                from_number=from_number,
                to_number=to_number,
                line_number=line_number,
            )
        except TelephonyManagerError:
            raise
        except MangoOfficeClientError as e:
            _LOG.error(f"Error making call: {e}")
            raise TelephonyManagerError(f"Failed to make call: {e}") from e
    
    async def get_statistics(
        self,
        date_from: int,
        date_to: int,
    ) -> CallStatistic:
        """Получить статистику звонков"""
        try:
            client = await self._ensure_client()
            return await client.get_statistics(
                date_from=date_from,
                date_to=date_to,
            )
        except TelephonyManagerError:
            raise
        except MangoOfficeClientError as e:
            _LOG.error(f"Error getting statistics: {e}")
            raise TelephonyManagerError(f"Failed to get statistics: {e}") from e

