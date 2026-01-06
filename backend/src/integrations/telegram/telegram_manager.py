import logging
from typing import Optional, Dict, Any
from uuid import UUID

from src.integrations.integrations_storage import IntegrationsStorage
from src.integrations.integrations_storage_models import IntegrationType
from src.integrations.integrations_manager import (
    IntegrationsManager,
    IntegrationsManagerError,
)
from .telegram_client import TelegramClient, TelegramClientError
from .telegram_models import (
    TelegramConfig,
    BotInfo,
    WebhookInfo,
    SendMessageParams,
    SendPhotoParams,
    SendDocumentParams,
    TelegramMessage,
    TelegramChat,
)


_LOG = logging.getLogger("uvicorn.error")


class TelegramManagerError(Exception):
    """Ошибка менеджера Telegram"""
    pass


class TelegramManager:
    """Менеджер для работы с интеграцией Telegram"""
    
    def __init__(
        self,
        integrations_storage: IntegrationsStorage,
        integrations_manager: IntegrationsManager,
    ):
        self.integrations_storage = integrations_storage
        self.integrations_manager = integrations_manager
        self._client: Optional[TelegramClient] = None
        self._current_integration_id: Optional[UUID] = None
    
    async def _get_active_integration(self) -> Optional[Dict[str, Any]]:
        """Получить активную интеграцию Telegram"""
        try:
            _LOG.info(f"Searching for active Telegram integrations...")
            integrations = await self.integrations_storage.get_by_type(
                IntegrationType.TELEGRAM,
                active_only=True,
            )
            _LOG.info(f"Found {len(integrations)} active Telegram integration(s)")
            
            if not integrations:
                # Попробуем найти любые интеграции Telegram для отладки
                all_integrations = await self.integrations_storage.get_by_type(
                    IntegrationType.TELEGRAM,
                    active_only=False,
                )
                _LOG.warning(f"No active Telegram integrations found. Total Telegram integrations: {len(all_integrations)}")
                if all_integrations:
                    for integration in all_integrations:
                        _LOG.warning(f"  - Integration ID: {integration.id}, Name: {integration.name}, is_active: {integration.is_active}")
                return None
            
            # Берем первую активную интеграцию
            integration = integrations[0]
            _LOG.info(f"Using Telegram integration: ID={integration.id}, Name={integration.name}, is_active={integration.is_active}")
            return {
                "id": integration.id,
                "config": integration.config,
            }
        except Exception as e:
            _LOG.error(f"Error getting active Telegram integration: {e}", exc_info=True)
            return None
    
    async def _ensure_client(self) -> TelegramClient:
        """Убедиться, что клиент инициализирован"""
        integration = await self._get_active_integration()
        if not integration:
            raise TelegramManagerError("No active Telegram integration found")
        
        # Если клиент уже инициализирован для этой интеграции, возвращаем его
        if self._client and self._current_integration_id == integration["id"]:
            return self._client
        
        # Создаем новый клиент
        try:
            config_dict = integration["config"]
            _LOG.info(f"Creating Telegram client with config keys: {list(config_dict.keys())}")
            
            # Проверяем наличие всех необходимых полей
            required_fields = ["bot_token"]
            missing_fields = [field for field in required_fields if field not in config_dict or not config_dict[field]]
            if missing_fields:
                raise TelegramManagerError(f"Missing required config fields: {missing_fields}")
            
            # Логируем значения (без токена)
            bot_token_val = config_dict.get('bot_token', '')
            chat_id_val = config_dict.get('chat_id', '')
            
            _LOG.info(f"Config values from DB: bot_token_length={len(bot_token_val)}, chat_id='{chat_id_val}'")
            
            # Проверяем, что значения не пустые
            for field in required_fields:
                value = config_dict.get(field, "")
                if not value:
                    raise TelegramManagerError(f"Config field '{field}' is missing or empty")
                if isinstance(value, str) and not value.strip():
                    raise TelegramManagerError(f"Config field '{field}' contains only whitespace")
            
            # Очищаем значения от пробелов перед созданием конфига
            cleaned_config = {}
            for key, value in config_dict.items():
                if isinstance(value, str):
                    cleaned_config[key] = value.strip()
                else:
                    cleaned_config[key] = value
            
            _LOG.info(f"Cleaned config: bot_token_length={len(cleaned_config.get('bot_token', ''))}, chat_id='{cleaned_config.get('chat_id')}'")
            
            config = TelegramConfig(**cleaned_config)
            self._client = TelegramClient(config)
            self._current_integration_id = integration["id"]
            _LOG.info("Telegram client created successfully")
            return self._client
        except Exception as e:
            _LOG.error(f"Error creating Telegram client: {e}", exc_info=True)
            raise TelegramManagerError(f"Failed to create Telegram client: {e}") from e
    
    async def test_connection(self) -> bool:
        """Проверить соединение с Telegram API"""
        try:
            client = await self._ensure_client()
            return await client.test_connection()
        except TelegramManagerError:
            return False
        except Exception as e:
            _LOG.error(f"Error testing connection: {e}")
            return False
    
    async def get_bot_info(self) -> BotInfo:
        """Получить информацию о боте"""
        client = await self._ensure_client()
        return await client.get_me()
    
    async def send_message(
        self,
        chat_id: str,
        text: str,
        parse_mode: Optional[str] = "HTML",
        disable_web_page_preview: bool = False,
        disable_notification: bool = False,
        reply_to_message_id: Optional[int] = None,
    ) -> TelegramMessage:
        """Отправить текстовое сообщение"""
        client = await self._ensure_client()
        params = SendMessageParams(
            chat_id=chat_id,
            text=text,
            parse_mode=parse_mode,
            disable_web_page_preview=disable_web_page_preview,
            disable_notification=disable_notification,
            reply_to_message_id=reply_to_message_id,
        )
        return await client.send_message(params)
    
    async def send_photo(
        self,
        chat_id: str,
        photo: str,
        caption: Optional[str] = None,
        parse_mode: Optional[str] = "HTML",
        disable_notification: bool = False,
    ) -> TelegramMessage:
        """Отправить фото"""
        client = await self._ensure_client()
        params = SendPhotoParams(
            chat_id=chat_id,
            photo=photo,
            caption=caption,
            parse_mode=parse_mode,
            disable_notification=disable_notification,
        )
        return await client.send_photo(params)
    
    async def send_document(
        self,
        chat_id: str,
        document: str,
        caption: Optional[str] = None,
        parse_mode: Optional[str] = "HTML",
        disable_notification: bool = False,
    ) -> TelegramMessage:
        """Отправить документ"""
        client = await self._ensure_client()
        params = SendDocumentParams(
            chat_id=chat_id,
            document=document,
            caption=caption,
            parse_mode=parse_mode,
            disable_notification=disable_notification,
        )
        return await client.send_document(params)
    
    async def get_webhook_info(self) -> WebhookInfo:
        """Получить информацию о webhook"""
        client = await self._ensure_client()
        return await client.get_webhook_info()
    
    async def set_webhook(
        self,
        url: str,
        max_connections: Optional[int] = None,
        allowed_updates: Optional[list] = None,
    ) -> bool:
        """Установить webhook"""
        client = await self._ensure_client()
        return await client.set_webhook(url, max_connections=max_connections, allowed_updates=allowed_updates)
    
    async def delete_webhook(self) -> bool:
        """Удалить webhook"""
        client = await self._ensure_client()
        return await client.delete_webhook()
    
    async def get_chat_info(self, chat_id: str) -> TelegramChat:
        """Получить информацию о чате"""
        client = await self._ensure_client()
        return await client.get_chat(chat_id)

