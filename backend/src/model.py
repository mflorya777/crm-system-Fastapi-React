from abc import (
    ABC,
    abstractmethod,
)
from typing import Any, Optional
from uuid import UUID

from pydantic import EmailStr
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


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
        env_file="local.env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


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
