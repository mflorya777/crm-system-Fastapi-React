import datetime as dt
import logging
from typing import (
    Type,
    Any,
)
from uuid import UUID

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
import pymongo

from src.clients.mongo.client import (
    MClient,
    codec_options,
)
from src.misc.misc_lib import (
    moscow_now,
    utc_now,
    dataetime_utc_to_moscow,
)
from pymongo import ReturnDocument


_LOG = logging.getLogger("uvicorn.info")


class DealsStorageError(Exception):
    pass


class NoSuchDealsError(DealsStorageError):
    pass


class NoSuchDealFileError(DealsStorageError):
    pass


class DealsStorageException(Exception):
    pass


class WrongDealClassException(DealsStorageException):
    pass


class DealsStorage:
    def __init__(
        self,
        mongo_client: MClient,
    ):
        self.mongo_client: MClient = mongo_client
        self.collection_name: str = "deals"
        self.revisions_collection_name: str = f"{self.collection_name=}_revisions"
        self.collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.collection_name,
            codec_options=codec_options,
        )
        self.revisions_collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.collection_name + "_revisions",
            codec_options=codec_options,
        )
        self.files_storage_path: str = "/deals_files_uploads"
