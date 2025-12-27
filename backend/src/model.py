from abc import (
    ABC,
    abstractmethod,
)
from typing import Any
from uuid import UUID

from pydantic import EmailStr
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


class OmnicomConfig(BaseSettings):
    sadr: str
    user: str
    pwd: str
    #
    model_config = SettingsConfigDict(env_prefix="OMNICOM_")


class ExchangeConfig(BaseSettings):
    email: EmailStr
    password: str
    login: str
    #
    model_config = SettingsConfigDict(env_prefix="EXCHANGE_")


class MongoConfig(BaseSettings):
    user: str
    password: str
    host: str
    port: int = 27017
    db_name: str
    enable_ssl: bool = False
    #
    model_config = SettingsConfigDict(env_prefix="MONGO_")


class TelegramConfig(BaseSettings):
    token: str
    chat_id: str
    #
    model_config = SettingsConfigDict(env_prefix="TG_")


class AppConfig(BaseSettings):
    jwt_secret: str
    jwt_algorithm: str
    secure_mode: bool = True
    stage: str
    domain: str | None = None
    front_office_url: str
    mongo_config: MongoConfig = MongoConfig()
    exchange_config: ExchangeConfig = ExchangeConfig()
    omnicom_config: OmnicomConfig = OmnicomConfig()
    files_storage_directory_path: str
    telegram_config: TelegramConfig = TelegramConfig()
    system_user_id: UUID = UUID("52432537-dbfd-4081-a47b-4e6c7ba1e6c9")


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
