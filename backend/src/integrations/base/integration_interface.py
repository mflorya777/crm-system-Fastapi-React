from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from uuid import UUID


class IntegrationInterface(ABC):
    """Базовый интерфейс для всех интеграций"""
    
    @abstractmethod
    async def connect(self, config: Dict[str, Any]) -> bool:
        """Подключиться к внешнему сервису"""
        pass
    
    @abstractmethod
    async def disconnect(self) -> None:
        """Отключиться от внешнего сервиса"""
        pass
    
    @abstractmethod
    async def test_connection(self) -> bool:
        """Проверить соединение с внешним сервисом"""
        pass
    
    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Получить статус интеграции"""
        pass

