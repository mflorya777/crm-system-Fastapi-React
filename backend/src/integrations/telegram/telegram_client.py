import logging
import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime

from .telegram_models import (
    TelegramConfig,
    BotInfo,
    WebhookInfo,
    SendMessageParams,
    SendPhotoParams,
    SendDocumentParams,
    Update,
    TelegramMessage,
)


_LOG = logging.getLogger("uvicorn.error")


class TelegramClientError(Exception):
    """Ошибка клиента Telegram"""
    pass


class TelegramClient:
    """Клиент для работы с Telegram Bot API"""
    
    BASE_URL = "https://api.telegram.org/bot"
    
    def __init__(
        self,
        config: TelegramConfig,
    ):
        self.config = config
        self.bot_token = config.bot_token.strip() if config.bot_token else ""
        self.chat_id = config.chat_id.strip() if config.chat_id else None
        
        if not self.bot_token:
            raise TelegramClientError("Bot Token cannot be empty")
        
        self.api_url = f"{self.BASE_URL}{self.bot_token}"
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        files: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Выполнить запрос к Telegram API"""
        url = f"{self.api_url}/{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                if files:
                    # Для отправки файлов используем multipart/form-data
                    response = await client.post(url, data=data, files=files, params=params)
                elif data:
                    response = await client.post(url, json=data, params=params)
                else:
                    response = await client.get(url, params=params)
                
                response.raise_for_status()
                result = response.json()
                
                if not result.get("ok"):
                    error_description = result.get("description", "Unknown error")
                    error_code = result.get("error_code", 0)
                    raise TelegramClientError(f"Telegram API error {error_code}: {error_description}")
                
                return result.get("result", {})
        except httpx.HTTPStatusError as e:
            error_detail = "Unknown error"
            try:
                error_data = e.response.json()
                error_detail = error_data.get("description") or error_data.get("error") or str(e)
                _LOG.error(f"Telegram API HTTP error {e.response.status_code}: {error_detail}")
                _LOG.error(f"Response body: {e.response.text}")
            except:
                _LOG.error(f"Telegram API HTTP error {e.response.status_code}: {e.response.text}")
            raise TelegramClientError(f"Telegram API error: {error_detail}") from e
        except Exception as e:
            _LOG.error(f"Error making request to Telegram API: {e}")
            raise TelegramClientError(f"Failed to make request: {e}") from e
    
    async def get_me(self) -> BotInfo:
        """Получить информацию о боте"""
        try:
            result = await self._make_request("GET", "getMe")
            return BotInfo(**result)
        except Exception as e:
            _LOG.error(f"Error getting bot info: {e}")
            raise TelegramClientError(f"Failed to get bot info: {e}") from e
    
    async def test_connection(self) -> bool:
        """Проверить соединение с Telegram API"""
        try:
            await self.get_me()
            return True
        except Exception as e:
            _LOG.error(f"Connection test failed: {e}")
            return False
    
    async def send_message(self, params: SendMessageParams) -> TelegramMessage:
        """Отправить текстовое сообщение"""
        try:
            data = {
                "chat_id": params.chat_id,
                "text": params.text,
            }
            
            if params.parse_mode:
                data["parse_mode"] = params.parse_mode
            if params.disable_web_page_preview:
                data["disable_web_page_preview"] = params.disable_web_page_preview
            if params.disable_notification:
                data["disable_notification"] = params.disable_notification
            if params.reply_to_message_id:
                data["reply_to_message_id"] = params.reply_to_message_id
            
            result = await self._make_request("POST", "sendMessage", data=data)
            return TelegramMessage(**result)
        except Exception as e:
            _LOG.error(f"Error sending message: {e}")
            raise TelegramClientError(f"Failed to send message: {e}") from e
    
    async def send_photo(self, params: SendPhotoParams) -> TelegramMessage:
        """Отправить фото"""
        try:
            data = {
                "chat_id": params.chat_id,
                "photo": params.photo,
            }
            
            if params.caption:
                data["caption"] = params.caption
            if params.parse_mode:
                data["parse_mode"] = params.parse_mode
            if params.disable_notification:
                data["disable_notification"] = params.disable_notification
            
            result = await self._make_request("POST", "sendPhoto", data=data)
            return TelegramMessage(**result)
        except Exception as e:
            _LOG.error(f"Error sending photo: {e}")
            raise TelegramClientError(f"Failed to send photo: {e}") from e
    
    async def send_document(self, params: SendDocumentParams) -> TelegramMessage:
        """Отправить документ"""
        try:
            data = {
                "chat_id": params.chat_id,
                "document": params.document,
            }
            
            if params.caption:
                data["caption"] = params.caption
            if params.parse_mode:
                data["parse_mode"] = params.parse_mode
            if params.disable_notification:
                data["disable_notification"] = params.disable_notification
            
            result = await self._make_request("POST", "sendDocument", data=data)
            return TelegramMessage(**result)
        except Exception as e:
            _LOG.error(f"Error sending document: {e}")
            raise TelegramClientError(f"Failed to send document: {e}") from e
    
    async def get_webhook_info(self) -> WebhookInfo:
        """Получить информацию о webhook"""
        try:
            result = await self._make_request("GET", "getWebhookInfo")
            # Конвертируем timestamp в datetime если есть
            if result.get("last_error_date"):
                result["last_error_date"] = datetime.fromtimestamp(result["last_error_date"])
            return WebhookInfo(**result)
        except Exception as e:
            _LOG.error(f"Error getting webhook info: {e}")
            raise TelegramClientError(f"Failed to get webhook info: {e}") from e
    
    async def set_webhook(
        self,
        url: str,
        certificate: Optional[str] = None,
        max_connections: Optional[int] = None,
        allowed_updates: Optional[List[str]] = None,
    ) -> bool:
        """Установить webhook"""
        try:
            data = {"url": url}
            
            if certificate:
                data["certificate"] = certificate
            if max_connections:
                data["max_connections"] = max_connections
            if allowed_updates:
                data["allowed_updates"] = allowed_updates
            
            result = await self._make_request("POST", "setWebhook", data=data)
            return result.get("ok", False)
        except Exception as e:
            _LOG.error(f"Error setting webhook: {e}")
            raise TelegramClientError(f"Failed to set webhook: {e}") from e
    
    async def delete_webhook(self) -> bool:
        """Удалить webhook"""
        try:
            result = await self._make_request("POST", "deleteWebhook")
            return result.get("ok", False)
        except Exception as e:
            _LOG.error(f"Error deleting webhook: {e}")
            raise TelegramClientError(f"Failed to delete webhook: {e}") from e

