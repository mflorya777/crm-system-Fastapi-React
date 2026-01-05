import logging
import hashlib
import time
import json
import asyncio
from typing import (
    Dict,
    Any,
    Optional,
    List,
)
import httpx

from .telephony_models import (
    MangoOfficeConfig,
    CallInfo,
    CallHistoryResponse,
    CallStatistic,
)


_LOG = logging.getLogger("uvicorn.info")


class MangoOfficeClientError(Exception):
    pass


class MangoOfficeClient:
    """Клиент для работы с API Mango Office"""
    
    BASE_URL = "https://app.mango-office.ru/vpbx"
    
    def __init__(
        self,
        config: MangoOfficeConfig,
    ):
        self.config = config
        self.api_key = config.api_key
        self.api_salt = config.api_salt
        self.vpbx_api_key = config.vpbx_api_key
        self.vpbx_api_salt = config.vpbx_api_salt
        
    def _generate_sign(self, json_data: str, salt: str) -> str:
        """Генерация подписи для запросов к Mango Office"""
        sign_string = f"{self.api_key}{json_data}{salt}"
        return hashlib.sha256(sign_string.encode()).hexdigest()
    
    def _generate_vpbx_sign(self, json_data: str, salt: str) -> str:
        """Генерация подписи для запросов к VPBX API"""
        sign_string = f"{self.vpbx_api_key}{json_data}{salt}"
        return hashlib.sha256(sign_string.encode()).hexdigest()
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        use_vpbx: bool = False,
    ) -> Dict[str, Any]:
        """Выполнить запрос к API Mango Office"""
        url = f"{self.BASE_URL}/{endpoint}"
        
        json_data = ""
        if data:
            json_data = json.dumps(data, separators=(',', ':'))
        
        # Генерируем подпись
        if use_vpbx:
            sign = self._generate_vpbx_sign(json_data, self.vpbx_api_salt)
            api_key = self.vpbx_api_key
        else:
            sign = self._generate_sign(json_data, self.api_salt)
            api_key = self.api_key
        
        headers = {
            "Content-Type": "application/json",
        }
        
        request_data = {
            "vpbx_api_key": api_key if use_vpbx else None,
            "api_key": api_key if not use_vpbx else None,
            "sign": sign,
        }
        
        if data:
            request_data.update(data)
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.request(
                    method=method,
                    url=url,
                    json=request_data if json_data else None,
                    headers=headers,
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            _LOG.error(f"Mango Office API request error: {e}")
            raise MangoOfficeClientError(f"Failed to make request to Mango Office: {e}") from e
    
    async def test_connection(self) -> bool:
        """Проверить соединение с Mango Office"""
        try:
            # Простой запрос для проверки соединения
            # Используем метод stats/request для проверки
            result = await self._make_request(
                method="POST",
                endpoint="stats/request",
                data={
                    "date_from": int(time.time()) - 86400,  # Вчера
                    "date_to": int(time.time()),  # Сегодня
                },
            )
            return result.get("key") is not None
        except Exception as e:
            _LOG.error(f"Connection test failed: {e}")
            return False
    
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
            if not date_from:
                date_from = int(time.time()) - 86400  # По умолчанию последние 24 часа
            if not date_to:
                date_to = int(time.time())
            
            data = {
                "date_from": date_from,
                "date_to": date_to,
                "limit": limit,
            }
            
            if from_number:
                data["from_number"] = from_number
            if to_number:
                data["to_number"] = to_number
            
            result = await self._make_request(
                method="POST",
                endpoint="stats/request",
                data=data,
            )
            
            # Получаем данные по ключу
            key = result.get("key")
            if not key:
                return []
            
            # Ждем и получаем результат
            await asyncio.sleep(2)  # Даем время на обработку
            
            history_result = await self._make_request(
                method="POST",
                endpoint="stats/result",
                data={"key": key},
            )
            
            calls = history_result.get("data", [])
            return [CallInfo(**call) for call in calls]
        except Exception as e:
            _LOG.error(f"Error getting call history: {e}")
            raise MangoOfficeClientError(f"Failed to get call history: {e}") from e
    
    async def make_call(
        self,
        from_number: str,
        to_number: str,
        line_number: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Инициировать звонок"""
        try:
            data = {
                "from": {
                    "extension": from_number,
                },
                "to_number": to_number,
            }
            
            if line_number:
                data["from"]["line_number"] = line_number
            
            result = await self._make_request(
                method="POST",
                endpoint="commands/callback",
                data=data,
                use_vpbx=True,
            )
            
            return result
        except Exception as e:
            _LOG.error(f"Error making call: {e}")
            raise MangoOfficeClientError(f"Failed to make call: {e}") from e
    
    async def get_statistics(
        self,
        date_from: int,
        date_to: int,
    ) -> CallStatistic:
        """Получить статистику звонков"""
        try:
            result = await self._make_request(
                method="POST",
                endpoint="stats/request",
                data={
                    "date_from": date_from,
                    "date_to": date_to,
                },
            )
            
            key = result.get("key")
            if not key:
                raise MangoOfficeClientError("Failed to get statistics key")
            
            # Ждем и получаем результат
            await asyncio.sleep(2)
            
            stats_result = await self._make_request(
                method="POST",
                endpoint="stats/result",
                data={"key": key},
            )
            
            data = stats_result.get("data", [])
            total_calls = len(data)
            successful_calls = sum(1 for call in data if call.get("entry_id"))
            
            return CallStatistic(
                total_calls=total_calls,
                successful_calls=successful_calls,
                failed_calls=total_calls - successful_calls,
            )
        except Exception as e:
            _LOG.error(f"Error getting statistics: {e}")
            raise MangoOfficeClientError(f"Failed to get statistics: {e}") from e

