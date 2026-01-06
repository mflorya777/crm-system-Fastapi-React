import logging
from typing import (
    Optional,
    List,
    Dict,
    Any,
)
from uuid import UUID

from .zoom_client import (
    ZoomClient,
    ZoomClientError,
)
from .zoom_models import (
    ZoomConfig,
    CreateMeetingParams,
    UpdateMeetingParams,
    ZoomMeeting,
    MeetingListParams,
    MeetingListResponse,
    ParticipantListResponse,
    RecordingListResponse,
)
from ..integrations_storage import IntegrationsStorage
from ..integrations_storage_models import IntegrationType


_LOG = logging.getLogger("uvicorn.info")


class ZoomManagerError(Exception):
    pass


class ZoomManager:
    """Менеджер для работы с Zoom"""
    
    def __init__(
        self,
        integrations_storage: IntegrationsStorage,
    ):
        self.integrations_storage = integrations_storage
        self._client: Optional[ZoomClient] = None
        self._current_integration_id: Optional[UUID] = None
    
    async def _get_active_integration(self) -> Optional[Dict[str, Any]]:
        """Получить активную интеграцию Zoom"""
        try:
            _LOG.info(f"Searching for active Zoom integrations...")
            integrations = await self.integrations_storage.get_by_type(
                IntegrationType.ZOOM,
                active_only=True,
            )
            _LOG.info(f"Found {len(integrations)} active Zoom integration(s)")
            
            if not integrations:
                # Попробуем найти любые интеграции Zoom для отладки
                all_integrations = await self.integrations_storage.get_by_type(
                    IntegrationType.ZOOM,
                    active_only=False,
                )
                _LOG.warning(f"No active Zoom integrations found. Total Zoom integrations: {len(all_integrations)}")
                if all_integrations:
                    for integration in all_integrations:
                        _LOG.warning(f"  - Integration ID: {integration.id}, Name: {integration.name}, is_active: {integration.is_active}")
                return None
            
            # Берем первую активную интеграцию
            integration = integrations[0]
            _LOG.info(f"Using Zoom integration: ID={integration.id}, Name={integration.name}, is_active={integration.is_active}")
            return {
                "id": integration.id,
                "config": integration.config,
            }
        except Exception as e:
            _LOG.error(f"Error getting active Zoom integration: {e}", exc_info=True)
            return None
    
    async def _ensure_client(self) -> ZoomClient:
        """Убедиться, что клиент инициализирован"""
        integration = await self._get_active_integration()
        if not integration:
            raise ZoomManagerError("No active Zoom integration found")
        
        # Если клиент уже инициализирован для этой интеграции, возвращаем его
        if self._client and self._current_integration_id == integration["id"]:
            return self._client
        
        # Создаем новый клиент
        try:
            config_dict = integration["config"]
            _LOG.info(f"Creating Zoom client with config keys: {list(config_dict.keys())}")
            
            # Проверяем наличие всех необходимых полей
            required_fields = ["account_id", "client_id", "client_secret"]
            missing_fields = [field for field in required_fields if field not in config_dict or not config_dict[field]]
            if missing_fields:
                raise ZoomManagerError(f"Missing required config fields: {missing_fields}")
            
            # Логируем значения (без секрета)
            account_id_val = config_dict.get('account_id', '')
            client_id_val = config_dict.get('client_id', '')
            client_secret_val = config_dict.get('client_secret', '')
            
            _LOG.info(f"Config values from DB: account_id='{account_id_val}' (len={len(account_id_val)}), client_id='{client_id_val}' (len={len(client_id_val)}), client_secret_length={len(client_secret_val)}")
            
            # Проверяем, что значения не пустые
            for field in required_fields:
                value = config_dict.get(field, "")
                if not value:
                    raise ZoomManagerError(f"Config field '{field}' is missing or empty")
                if isinstance(value, str) and not value.strip():
                    raise ZoomManagerError(f"Config field '{field}' contains only whitespace")
            
            # Очищаем значения от пробелов перед созданием конфига
            cleaned_config = {}
            for key, value in config_dict.items():
                if isinstance(value, str):
                    cleaned_config[key] = value.strip()
                else:
                    cleaned_config[key] = value
            
            _LOG.info(f"Cleaned config: account_id='{cleaned_config.get('account_id')}' (len={len(cleaned_config.get('account_id', ''))}), client_id='{cleaned_config.get('client_id')}' (len={len(cleaned_config.get('client_id', ''))})")
            
            config = ZoomConfig(**cleaned_config)
            self._client = ZoomClient(config)
            self._current_integration_id = integration["id"]
            _LOG.info("Zoom client created successfully")
            return self._client
        except Exception as e:
            _LOG.error(f"Error creating Zoom client: {e}", exc_info=True)
            raise ZoomManagerError(f"Failed to create Zoom client: {e}") from e
    
    async def test_connection(self) -> bool:
        """Проверить соединение с Zoom API"""
        try:
            client = await self._ensure_client()
            return await client.test_connection()
        except ZoomManagerError as e:
            if "No active Zoom integration found" in str(e):
                _LOG.warning("No active Zoom integration found for connection test")
                return False
            _LOG.error(f"ZoomManagerError during connection test: {e}")
            raise
        except ZoomClientError as e:
            _LOG.error(f"ZoomClientError during connection test: {e}")
            raise ZoomManagerError(f"Failed to test connection: {e}") from e
        except Exception as e:
            _LOG.error(f"Unexpected error testing Zoom connection: {e}", exc_info=True)
            raise ZoomManagerError(f"Failed to test connection: {e}") from e
    
    async def create_meeting(
        self,
        params: CreateMeetingParams,
    ) -> ZoomMeeting:
        """Создать встречу"""
        try:
            client = await self._ensure_client()
            return await client.create_meeting(params)
        except ZoomManagerError:
            raise
        except ZoomClientError as e:
            _LOG.error(f"Error creating meeting: {e}")
            raise ZoomManagerError(f"Failed to create meeting: {e}") from e
    
    async def get_meeting(
        self,
        meeting_id: str,
    ) -> ZoomMeeting:
        """Получить информацию о встрече"""
        try:
            client = await self._ensure_client()
            return await client.get_meeting(meeting_id)
        except ZoomManagerError:
            raise
        except ZoomClientError as e:
            _LOG.error(f"Error getting meeting: {e}")
            raise ZoomManagerError(f"Failed to get meeting: {e}") from e
    
    async def update_meeting(
        self,
        meeting_id: str,
        params: UpdateMeetingParams,
    ) -> None:
        """Обновить встречу"""
        try:
            client = await self._ensure_client()
            await client.update_meeting(meeting_id, params)
        except ZoomManagerError:
            raise
        except ZoomClientError as e:
            _LOG.error(f"Error updating meeting: {e}")
            raise ZoomManagerError(f"Failed to update meeting: {e}") from e
    
    async def delete_meeting(
        self,
        meeting_id: str,
    ) -> None:
        """Удалить встречу"""
        try:
            client = await self._ensure_client()
            await client.delete_meeting(meeting_id)
        except ZoomManagerError:
            raise
        except ZoomClientError as e:
            _LOG.error(f"Error deleting meeting: {e}")
            raise ZoomManagerError(f"Failed to delete meeting: {e}") from e
    
    async def list_meetings(
        self,
        params: MeetingListParams,
    ) -> MeetingListResponse:
        """Получить список встреч"""
        try:
            client = await self._ensure_client()
            return await client.list_meetings(params)
        except ZoomManagerError as e:
            if "No active Zoom integration found" in str(e):
                _LOG.warning("No active Zoom integration found for listing meetings")
                return MeetingListResponse(meetings=[], page_size=30)
            raise
        except ZoomClientError as e:
            _LOG.error(f"Error listing meetings: {e}")
            raise ZoomManagerError(f"Failed to list meetings: {e}") from e
    
    async def get_meeting_participants(
        self,
        meeting_id: str,
        page_size: int = 30,
        next_page_token: Optional[str] = None,
    ) -> ParticipantListResponse:
        """Получить список участников встречи"""
        try:
            client = await self._ensure_client()
            return await client.get_meeting_participants(
                meeting_id=meeting_id,
                page_size=page_size,
                next_page_token=next_page_token,
            )
        except ZoomManagerError:
            raise
        except ZoomClientError as e:
            _LOG.error(f"Error getting meeting participants: {e}")
            raise ZoomManagerError(f"Failed to get meeting participants: {e}") from e
    
    async def get_meeting_recordings(
        self,
        meeting_id: str,
        page_size: int = 30,
        next_page_token: Optional[str] = None,
    ) -> RecordingListResponse:
        """Получить список записей встречи"""
        try:
            client = await self._ensure_client()
            return await client.get_meeting_recordings(
                meeting_id=meeting_id,
                page_size=page_size,
                next_page_token=next_page_token,
            )
        except ZoomManagerError:
            raise
        except ZoomClientError as e:
            _LOG.error(f"Error getting meeting recordings: {e}")
            raise ZoomManagerError(f"Failed to get meeting recordings: {e}") from e

