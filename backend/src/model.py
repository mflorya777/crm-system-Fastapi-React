from abc import (
    ABC,
    abstractmethod,
)
from pathlib import Path
from typing import Any, Optional
from uuid import UUID
import os

from pydantic import EmailStr
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)

try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False


class OmnicomConfig(BaseSettings):
    sadr: Optional[str] = None
    user: Optional[str] = None
    pwd: Optional[str] = None
    #
    model_config = SettingsConfigDict(env_prefix="OMNICOM_")


class ExchangeConfig(BaseSettings):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    login: Optional[str] = None
    #
    model_config = SettingsConfigDict(env_prefix="EXCHANGE_")


class MongoConfig(BaseSettings):
    user: Optional[str] = None
    password: Optional[str] = None
    host: Optional[str] = None
    port: int = 27017
    db_name: Optional[str] = None
    enable_ssl: bool = False
    #
    model_config = SettingsConfigDict(env_prefix="MONGO_")


class TelegramConfig(BaseSettings):
    token: Optional[str] = None
    chat_id: Optional[str] = None
    #
    model_config = SettingsConfigDict(env_prefix="TG_")


def _get_env_file_path() -> str:
    """Получает путь к файлу local.env относительно текущего файла"""
    current_file = Path(__file__).resolve()
    # src/model.py -> backend/local.env
    env_file = current_file.parent.parent / "local.env"
    env_path = str(env_file)
    
    # Загружаем переменные из файла в окружение, если dotenv доступен
    if DOTENV_AVAILABLE and Path(env_path).exists():
        load_dotenv(env_path, override=False)
    
    return env_path


class AppConfig(BaseSettings):
    jwt_secret: Optional[str] = None
    jwt_algorithm: Optional[str] = None
    secure_mode: bool = True
    stage: Optional[str] = None
    domain: str | None = None
    front_office_url: Optional[str] = None
    mongo_config: MongoConfig = MongoConfig()
    exchange_config: ExchangeConfig = ExchangeConfig()
    omnicom_config: OmnicomConfig = OmnicomConfig()
    files_storage_directory_path: Optional[str] = None
    telegram_config: TelegramConfig = TelegramConfig()
    system_user_id: UUID = UUID("52432537-dbfd-4081-a47b-4e6c7ba1e6c9")
    #
    model_config = SettingsConfigDict(
        env_file=_get_env_file_path(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Пересоздаем вложенные конфигурации после загрузки env_file,
        # чтобы они получили переменные окружения
        self.mongo_config = MongoConfig()
        self.exchange_config = ExchangeConfig()
        self.omnicom_config = OmnicomConfig()
        self.telegram_config = TelegramConfig()


class StorageABC(ABC):
    @abstractmethod
    async def add(self, *args, **kwargs) -> Any:
        pass

    @abstractmethod
    async def get(self, *args, **kwargs) -> Any:
        pass

    @abstractmethod
    async def update(self, *args, **kwargs) -> Any:
        pass
