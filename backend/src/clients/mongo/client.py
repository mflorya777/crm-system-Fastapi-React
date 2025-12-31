import datetime as dt
import logging

from motor.motor_asyncio import AsyncIOMotorClient

from src.model import MongoConfig

from bson.binary import UuidRepresentation
from bson.codec_options import (
    TypeRegistry,
    CodecOptions,
)


_LOG = logging.getLogger("uvicorn.info")


def fallback_encoder(value):
    """
    Function that transforms a custom type value into a type
    that BSON can encode.
    """
    if isinstance(value, dt.date):
        return dt.datetime.combine(value, dt.time.min)
    return value


type_registry = TypeRegistry(fallback_encoder=fallback_encoder)
codec_options: CodecOptions = CodecOptions(
    type_registry=type_registry,
    uuid_representation=UuidRepresentation.STANDARD,
)


class MClient:
    def __init__(self, config: MongoConfig):
        if not config.db_name:
            raise ValueError("MongoDB db_name is required but not set in configuration")
        if not config.host:
            raise ValueError("MongoDB host is required but not set in configuration")
        
        self.user = config.user
        self.password = config.password
        self.host = config.host
        self.port = config.port
        self.db_name = config.db_name
        self.enable_ssl = config.enable_ssl
        self.client = self.get_mongo_client()
        self.db = self.client.get_database(self.db_name)

    def get_mongo_client(self) -> AsyncIOMotorClient:
        # Формируем параметры подключения
        client_params = {
            "host": self.host,
            "port": self.port,
            "tls": self.enable_ssl,
            "tlsAllowInvalidCertificates": True,
            "uuidRepresentation": "standard",
        }
        
        # Добавляем username и password только если они указаны (не None и не пустая строка)
        if self.user and self.user.strip():
            client_params["username"] = self.user
        if self.password and self.password.strip():
            client_params["password"] = self.password
        
        return AsyncIOMotorClient(**client_params)

    # Infrastructure
    async def ping(self):
        try:
            await self.client.admin.command("ping")
            print("Соединение с MongoDB успешно!")
        except Exception as e:
            print(e)

    # FIXME: Move to users storage
    # async def create_indexes(self):
    #     await self.users_collection.create_index(
    #         [("phone", pymongo.ASCENDING)],
    #         unique=True,
    #     )
    #     await self.users_collection.create_index(
    #         [("email", pymongo.ASCENDING)],
    #         unique=True,
    #     )
    #     await self.users_collection.create_index(
    #         [("id", pymongo.ASCENDING)],
    #         unique=True,
    #     )
