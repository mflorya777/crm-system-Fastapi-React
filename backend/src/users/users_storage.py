import logging
from typing import (
    Optional,
    Any,
)
from uuid import (
    UUID,
    uuid4,
)

from bson import ObjectId
from cachetools import TTLCache
from motor.motor_asyncio import AsyncIOMotorCollection
from pydantic import EmailStr

from src.clients.cache import cachedmethod
from src.clients.mongo.client import MClient
from src.clients.mongo.create_models import (
    PasswordHashData,
    EmailApproveData,
    PhoneApproveData,
)
from src.misc.misc_lib import utc_now
from src.roles.roles_manager_models import (
    UserRoleId,
    Roles,
)
from src.sec.password import hash_password
from src.users.users_storage_models import (
    UserToCreate,
    UserToGet,
)


_LOG = logging.getLogger("uvicorn.info")


class UsersStorageException(Exception):
    pass


class UsersStorageNoSuchUserException(UsersStorageException):
    pass


class UsersStorage:
    _users_role_cache: TTLCache[tuple[UUID], Any] = TTLCache(maxsize=100, ttl=5)

    def __init__(
        self,
        mongo_client: MClient,
    ):
        self.mongo_client: MClient = mongo_client
        self.collection_name: str = "users"
        self.revisions_collection_name: str = f"{self.collection_name}_revisions"
        self.collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.collection_name,
        )
        self.revisions_collection: AsyncIOMotorCollection = self.mongo_client.db.get_collection(
            self.collection_name + "_revisions",
        )

    async def add(
        self,
        actor_id: UUID | None,
        name: str,
        soname: str,
        father_name: str,
        phone: str,
        email: EmailStr,
        password: str,
        email_approve_code: str,
        phone_approve_code: str,
    ) -> UserToGet:
        new_user_id = uuid4()
        if not actor_id:
            actor_id = new_user_id
        user = UserToCreate(
            id=new_user_id,
            created_by=actor_id,
            updated_by=actor_id,
            roles=[Roles.COMMON_USER.role_id],
            name=name,
            soname=soname,
            father_name=father_name,
            phone=phone,
            email=email,
            password_hash=hash_password(password),
            email_approve_code=email_approve_code,
            phone_approve_code=phone_approve_code,
        )
        result = await self.collection.insert_one(user.model_dump())
        new_user = await self.get_by_object_id(result.inserted_id)
        if not new_user:
            error_message = (
                f"Ошибка при добавлении пользователя."
                f" Запрос на создание пользователя выполнен,"
                f" но при запросе пользователя из бд вернулся None."
                f" {user.id}"
                f" {user.soname}"
                f" {user.father_name}"
                f" {user.phone}"
                f" {user.email}"
            )
            _LOG.error(error_message)
            raise UsersStorageException(error_message)
        return new_user

    async def add_system_user(
        self,
        user: UserToCreate,
    ) -> UserToGet:
        result = await self.collection.insert_one(user.model_dump())
        new_user = await self.get_by_object_id(result.inserted_id)
        if not new_user:
            error_message = (
                f"Ошибка при добавлении пользователя."
                f" Запрос на создание пользователя выполнен,"
                f" но при запросе пользователя из бд вернулся None."
                f" {user.id}"
                f" {user.soname}"
                f" {user.father_name}"
                f" {user.phone}"
                f" {user.email}"
            )
            _LOG.error(error_message)
            raise UsersStorageException(error_message)
        return new_user

    async def update_with_revision(
        self,
        actor_id: UUID,
        uid: UUID,
        update_query: dict,
    ):
        user = await self.get_full(uid)
        if not user:
            error_message = (
                f"Ошибка при обновлении пользователя." f" Пользователь с {uid=} не найден."
            )
            raise UsersStorageException(error_message)
        current_update_query = update_query.copy()
        if "$inc" in current_update_query:
            current_update_query["$inc"]["revision"] = 1
        else:
            current_update_query["$inc"] = {"revision": 1}
        if "$set" not in current_update_query:
            current_update_query["$set"] = {}
        current_update_query["$set"]["updated_at"] = utc_now()
        current_update_query["$set"]["updated_by"] = actor_id
        result = await self.collection.update_one(
            {
                "id": uid,
            },
            current_update_query,
        )
        _LOG.info(f"Результат обновления пользователя: {uid=} {result=}")
        await self.revisions_collection.insert_one(user.dict())

    async def update_email_approve_code(self, actor_id: UUID, uid: UUID, code: str):
        query = {
            "$set": {
                "email_approve_code": code,
            },
        }
        await self.update_with_revision(actor_id, uid, query)

    async def update_phone_approve_code(self, actor_id: UUID, uid: UUID, code: str):
        query = {
            "$set": {
                "phone_approved_at": code,
            },
        }
        await self.update_with_revision(actor_id, uid, query)

    async def get(self, uid: UUID) -> UserToGet:
        _LOG.info(f"Запрашиваю пользователя по id: {uid}")
        projection = {"_id": False}
        for key in UserToGet.model_fields:
            projection[key] = True
        _LOG.info(f"{projection=}")
        data = await self.collection.find_one(
            {"id": uid},
            projection=projection,
        )
        _LOG.debug(f"Полученные данные: {data}")
        if data:
            return UserToGet(**data)
        _LOG.info(f"Пользователь не найден. {uid=}")
        raise UsersStorageNoSuchUserException(f"Пользователь не найден. {uid=}")

    async def get_by_roles(self, role_ids: list[UserRoleId]) -> list[UserToCreate]:
        _LOG.info(f"Запрашиваю пользователя по role_ids: {role_ids}")
        projection = {"_id": False}
        for key in UserToCreate.model_fields:
            projection[key] = True
        _LOG.info(f"{projection=}")
        cursor = self.collection.find(
            {"roles": {"$in": role_ids}},
            projection=projection,
        )
        users: list[UserToCreate] = []
        _LOG.info(f"Полученные данные: {len(users)=}")
        async for raw_user in cursor:
            users.append(UserToCreate(**raw_user))
        return users

    async def get_all(self) -> list[UserToGet]:
        _LOG.info("Запрашиваю всех пользователей")
        projection = {"_id": False}
        for key in UserToGet.model_fields:
            projection[key] = True
        _LOG.info(f"{projection=}")
        cursor = self.collection.find(
            {},
            projection=projection,
        )
        return_data = []
        async for i in cursor:
            return_data.append(UserToGet(**i))
        return return_data

    async def get_user_roles(self, user_id: UUID) -> list[UserRoleId]:
        result = await self.collection.find_one(
            {"id": user_id},
            projection={"roles": True},
        )
        if result:
            return result["roles"]
        _LOG.info(f"Пользователь не найден. {user_id=}")
        raise UsersStorageNoSuchUserException(f"Пользователь не найден. {user_id=}")

    @cachedmethod(lambda self: self._users_role_cache)
    async def get_user_roles_cached(self, user_id: UUID) -> list[UserRoleId]:
        return await self.get_user_roles(user_id)

    async def get_by_object_id(self, _id: ObjectId) -> UserToGet:
        _LOG.info(f"Запрашиваю пользователя по ObjectID: {_id}")
        projection = {"_id": False}
        for key in UserToGet.model_fields:
            projection[key] = True
        _LOG.info(f"{projection=}")
        data = await self.collection.find_one(
            {"_id": _id},
            projection=projection,
        )
        _LOG.debug(f"Полученные данные: {data}")
        if data:
            return UserToGet(**data)
        _LOG.info(f"Пользователь не найден. {_id=}")
        raise UsersStorageNoSuchUserException(f"Пользователь не найден. {_id=}")

    async def get_full(self, uid: UUID) -> UserToCreate:
        _LOG.info(f"Запрашиваю пользователя по id: {uid}")
        projection = {"_id": False}
        for key in UserToCreate.model_fields:
            projection[key] = True
        data = await self.collection.find_one(
            {"id": uid},
            projection=projection,
        )
        _LOG.debug(f"Полученные данные: {data}")
        if data:
            return UserToCreate(**data)
        _LOG.info(f"Пользователь не найден. {uid=}")
        raise UsersStorageNoSuchUserException(f"Пользователь не найден. {uid=}")

    async def get_by_email(self, email: str) -> Optional[UserToGet]:
        result = await self.collection.find_one({"email": email})
        if result:
            return UserToGet(**result)
        _LOG.info(f"Пользователь не найден. {email=}")
        return None

    async def get_by_phone(self, phone: str) -> UserToGet:
        result = await self.collection.find_one({"phone": phone})
        if result:
            return UserToGet(**result)
        _LOG.info(f"Пользователь не найден. {phone=}")
        raise UsersStorageNoSuchUserException(f"Пользователь не найден. {phone=}")

    async def get_password_hash_by_email(self, email: str) -> PasswordHashData:
        _LOG.info(f"Запрашиваю по email: {email}")
        projection = {"_id": False}
        for key in PasswordHashData.model_fields:
            projection[key] = True
        data = await self.collection.find_one(
            {"email": email},
            projection=projection,
        )
        _LOG.debug(f"Полученные данные: {data}")
        if data:
            return PasswordHashData(**data)
        _LOG.info(f"Пользователь не найден. {email=}")
        raise UsersStorageNoSuchUserException(f"Пользователь не найден. {email=}")

    async def get_password_hash_by_phone(self, phone: str) -> PasswordHashData:
        _LOG.info(f"Запрашиваю по phone: {phone}")
        projection = {"_id": False}
        for key in PasswordHashData.model_fields:
            projection[key] = True
        data = await self.collection.find_one(
            {"phone": phone},
            projection=projection,
        )
        _LOG.debug(f"Полученные данные: {data}")
        if data:
            return PasswordHashData(**data)
        _LOG.info(f"Пользователь не найден. {phone=}")
        raise UsersStorageNoSuchUserException(f"Пользователь не найден. {phone=}")

    async def get_password_hash_by_id(self, uid: UUID) -> PasswordHashData:
        _LOG.info(f"Запрашиваю по id: {uid}")
        projection = {"_id": False}
        for key in PasswordHashData.model_fields:
            projection[key] = True
        data = await self.collection.find_one(
            {"id": uid},
            projection=projection,
        )
        _LOG.debug(f"Полученные данные: {data}")
        if data:
            return PasswordHashData(**data)
        _LOG.info(f"Пользователь не найден. {uid=}")
        raise UsersStorageNoSuchUserException(f"Пользователь не найден. {uid=}")

    async def get_email_approve_data(self, uid: UUID) -> EmailApproveData:
        _LOG.info(f"Запрашиваю по id: {uid}")
        projection = {"_id": False}
        for key in EmailApproveData.model_fields:
            projection[key] = True
        data = await self.collection.find_one(
            {"id": uid},
            projection=projection,
        )
        _LOG.debug(f"Полученные данные: {data}")
        if data:
            return EmailApproveData(**data)
        _LOG.info(f"Пользователь не найден. {uid=}")
        raise UsersStorageNoSuchUserException(f"Пользователь не найден. {uid=}")

    async def get_phone_approve_data(self, uid: UUID) -> PhoneApproveData:
        _LOG.info(f"Запрашиваю по id: {uid}")
        projection = {"_id": False}
        for key in PhoneApproveData.model_fields:
            projection[key] = True
        data = await self.collection.find_one(
            {"id": uid},
            projection=projection,
        )
        _LOG.debug(f"Полученные данные: {data}")
        if data:
            return PhoneApproveData(**data)
        _LOG.info(f"Пользователь не найден. {uid=}")
        raise UsersStorageNoSuchUserException(f"Пользователь не найден. {uid=}")

    async def get_user_email(self, uid: UUID) -> str:
        _LOG.info(f"Запрашиваю по id: {uid}")
        projection = {"_id": False, "email": True}
        data = await self.collection.find_one(
            {"id": uid},
            projection=projection,
        )
        if not data:
            raise UsersStorageNoSuchUserException(f"Пользователь не найден. {uid=}")
        if "email" not in data:
            raise UsersStorageException(f"Поле email отсутствует в ответе {data=}")
        return data["email"]

    async def get_user_phone(self, uid: UUID) -> str:
        _LOG.info(f"Запрашиваю по id: {uid}")
        projection = {"_id": False, "phone": True}
        data = await self.collection.find_one(
            {"id": uid},
            projection=projection,
        )
        if not data:
            raise UsersStorageNoSuchUserException(f"Пользователь не найден. {uid=}")
        if "phone" not in data:
            raise UsersStorageException(f"Поле phone отсутствует в ответе {data=}")
        return data["phone"]

    async def approve_email(self, actor_id: UUID, uid: UUID):
        update_query = {
            "$set": {
                "email_approve_code": None,
                "email_approved_at": utc_now(),
                "is_email_approved": True,
            },
        }
        await self.update_with_revision(
            actor_id,
            uid,
            update_query,
        )

    async def approve_phone(self, actor_id: UUID, uid: UUID):
        update_query = {
            "$set": {
                "phone_approve_code": None,
                "phone_approved_at": utc_now(),
                "is_phone_approved": True,
            },
        }
        await self.update_with_revision(
            actor_id,
            uid,
            update_query,
        )

    async def update_user_info(
        self,
        actor_id: UUID,
        uid: UUID,
        name: str,
        soname: str,
        father_name: str,
    ):
        update_query = {
            "$set": {
                "name": name,
                "soname": soname,
                "father_name": father_name,
            },
        }
        await self.update_with_revision(
            actor_id,
            uid,
            update_query,
        )

    async def update_email(
        self,
        actor_id: UUID,
        uid: UUID,
        email: EmailStr,
        email_approve_code: str,
    ):
        update_query = {
            "$set": {
                "email": email,
                "email_approve_code_sent_at": None,
                "email_approved_at": None,
                "email_approve_code": email_approve_code,
                "is_email_approved": False,
            },
        }
        await self.update_with_revision(
            actor_id,
            uid,
            update_query,
        )

    async def update_phone(
        self,
        actor_id: UUID,
        uid: UUID,
        phone: str,
        phone_approve_code: str,
    ):
        update_query = {
            "$set": {
                "phone": phone,
                "phone_approve_code_sent_at": None,
                "phone_approved_at": None,
                "phone_approve_code": phone_approve_code,
                "is_phone_approved": False,
            },
        }
        await self.update_with_revision(
            actor_id,
            uid,
            update_query,
        )

    async def update_password(
        self,
        actor_id: UUID,
        uid: UUID,
        password_hash: str,
    ):
        update_query = {
            "$set": {
                "password_hash": password_hash,
            },
        }
        await self.update_with_revision(
            actor_id,
            uid,
            update_query,
        )

    async def add_user_role(self, actor_id: UUID, uid: UUID, role: UserRoleId):
        update_query = {
            "$push": {
                "roles": role,
            }
        }
        await self.update_with_revision(
            actor_id,
            uid,
            update_query,
        )

    async def delete_user_role(self, actor_id: UUID, uid: UUID, role: UserRoleId):
        update_query = {
            "$pull": {
                "roles": role,
            }
        }
        await self.update_with_revision(
            actor_id,
            uid,
            update_query,
        )

    async def search_users(
        self,
        search_string: str,
        backoffice_only: bool = True
    ) -> list[UserToGet]:
        _LOG.info(f"Поиск пользователей {search_string=} {backoffice_only=}")
        query = {}
        if backoffice_only:
            query["is_backoffice_user"] = True
        fields_to_search = ['name', 'soname', 'father_name']

        if search_string:
            query["$or"] = []
            for chunk in search_string.split():
                for field in fields_to_search:
                    query["$or"].append(
                        {field: {"$regex": chunk, "$options": "i"}}
                    )

        projection = {"_id": False}
        for key in UserToGet.model_fields:
            projection[key] = True
        _LOG.info(f"{projection=}")
        cursor = self.collection.find(
            query,
            projection=projection,
        )
        return_users = []
        async for user in cursor:
            return_users.append(UserToGet(**user))
        return return_users
