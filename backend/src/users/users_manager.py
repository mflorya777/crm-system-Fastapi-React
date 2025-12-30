import logging
from typing import (
    Optional,
    Any,
)
from uuid import UUID

from pydantic import EmailStr
from pymongo.errors import DuplicateKeyError

from src.users.users_manager_common import USERS
from src.notifications.notifications_storage_models import (
    NotificationMessageChannel,
    NotificationMessageType,
)
from src.notifications.notifications_manager import NotificationManager
from src.sec.password import (
    verify_password,
    hash_password,
)
from .users_storage_models import (
    UserToGet,
)
from src.roles.roles_manager_models import UserRoleId
from .users_storage import (
    UsersStorage,
    UsersStorageNoSuchUserException,
)
from src.misc.misc_lib import generate_random_approve_code
from src.permissions.permissions_manager_models import Permissions
from src.permissions.permissions_manager import PermissionsManager
from cachetools import TTLCache
from src.clients.cache import cachedmethod


_LOG = logging.getLogger("uvicorn.error")


class UsersManagerError(Exception):
    pass


class ConflictError(UsersManagerError):
    pass


class NoSuchUserError(UsersManagerError):
    pass


class AuthenticationError(UsersManagerError):
    pass


class UsersManager:
    _users_fio_cache: TTLCache[tuple[UUID], Any] = TTLCache(maxsize=100, ttl=3)

    def __init__(
        self,
        users_storage: UsersStorage,
        notification_manager: NotificationManager,
        permissions_manager: PermissionsManager,
    ):
        self.users_storage: UsersStorage = users_storage
        self.notification_manager: NotificationManager = notification_manager
        self.permissions_manager: PermissionsManager = permissions_manager

    async def TMP_get_users_by_role(
        self,
        roles: list[UserRoleId],
    ) -> list[UserToGet]:
        # FIXME: Удалить после мержа с веткой Димы
        query = {"roles": {"$in": roles}}
        projection = {"_id": False}
        for key in UserToGet.model_fields:
            projection[key] = True
        cursor = self.users_storage.collection.find(query, projection)
        users = [UserToGet(**user) async for user in cursor]
        return users

    async def register_user(
        self,
        name: str,
        soname: str,
        father_name: str,
        phone: str,
        email: EmailStr,
        password: str,
    ) -> UserToGet:
        try:
            user = await self.users_storage.add(
                actor_id=None,
                name=name,
                soname=soname,
                father_name=father_name,
                phone=phone,
                email=email,
                password=password,
                email_approve_code=generate_random_approve_code(),
                phone_approve_code=generate_random_approve_code(),
            )
        except DuplicateKeyError as e:
            _LOG.error(e)
            raise ConflictError("Пользователь с таким email или телефоном уже существует")
        except Exception:
            raise
        await self.notification_manager.handle_notifications_on_user_registration(user.id)
        return user

    async def create_system_users(
        self,
    ) -> None:
        for role, data in USERS.items():
            try:
                await self.users_storage.get(data.id)
            except UsersStorageNoSuchUserException:
                _LOG.info(f"Создаем системного пользователя {role=}")
                try:
                    await self.users_storage.add_system_user(
                        data,
                    )
                except Exception as e:
                    _LOG.error(f"Ошибка при создании системного пользователя {role}: {e}")
            _LOG.debug(f"Системный пользователь {role=} уже создан")

    async def authenticate_user(
        self,
        password: str,
        phone: Optional[str] = None,
        email: Optional[EmailStr] = None,
    ) -> UserToGet:
        if phone is None and email is None:
            raise ValueError("Не указан email или телефон")
        if phone is not None and email is not None:
            raise ValueError("Можно указать только email или только телефон")

        if phone is not None:
            password_data = await self.users_storage.get_password_hash_by_phone(phone)
            if password_data is None:
                raise NoSuchUserError("Пользователь с таким телефоном не найден")
            if not verify_password(password, password_data.password_hash):
                raise AuthenticationError("Неверный пароль")
            user = await self.users_storage.get_by_phone(phone)
            if user is None:
                raise NoSuchUserError(f"Пользователь с таким {phone=} не найден")
            return user

        elif email is not None:
            password_data = await self.users_storage.get_password_hash_by_email(email)
            if password_data is None:
                raise NoSuchUserError("Пользователь с таким email не найден")
            if not verify_password(password, password_data.password_hash):
                raise AuthenticationError("Неверный пароль")
            user = await self.users_storage.get_by_email(email)
            if user is None:
                raise NoSuchUserError(f"Пользователь с таким {email=} не найден")
            return user
        else:
            raise AuthenticationError("Ошибка логики!")

    async def get_user(
        self,
        actor_user_id: UUID,
        user_id: UUID,
    ) -> UserToGet:
        permissions = [
            Permissions.GET_USER_SELF,
            Permissions.GET_USER_OTHER,
        ]
        if await self.permissions_manager.is_action_allowed(
                actor_user_id,
                user_id,
                permissions,
        ):
            user = await self.users_storage.get(user_id)
            if user is None:
                raise NoSuchUserError(f"Пользователь с таким {user_id=} не найден")
            return user
        raise UsersManagerError("Ошибка логики. Проверка прав доступа должна порождать исключение")

    async def get_user_roles(
        self,
        actor_user_id: UUID,
        user_id: UUID,
    ) -> list[UserRoleId]:
        permissions = [
            Permissions.USER_GET_USER_ROLES_SELF,
            Permissions.USER_GET_USER_ROLES_OTHER,
        ]
        if await self.permissions_manager.is_action_allowed(actor_user_id, user_id, permissions):
            roles = await self.users_storage.get_user_roles(user_id)
            return roles
        raise UsersManagerError("Ошибка логики. Проверка прав доступа должна порождать исключение")

    async def approve_email(
        self,
        actor_user_id: UUID,
        user_id: UUID,
        code: str,
    ) -> bool:
        permissions = [
            Permissions.UPDATE_USER_SELF,
            Permissions.UPDATE_USER_OTHER,
        ]
        if await self.permissions_manager.is_action_allowed(actor_user_id, user_id, permissions):
            email_approve_data = await self.users_storage.get_email_approve_data(user_id)
            if email_approve_data is None:
                raise NoSuchUserError("Пользователь с таким id не найден")
            if email_approve_data.is_email_approved:
                raise ConflictError("Пользователь уже подтвердил email")
            if email_approve_data.email_approve_code != code:
                raise AuthenticationError("Неверный код подтверждения")
            await self.users_storage.approve_email(actor_user_id, user_id)
            return True
        return False

    async def approve_phone(
        self,
        actor_user_id: UUID,
        user_id: UUID,
        code: str,
    ) -> bool:
        permissions = [
            Permissions.UPDATE_USER_SELF,
            Permissions.UPDATE_USER_OTHER,
        ]
        if await self.permissions_manager.is_action_allowed(actor_user_id, user_id, permissions):
            phone_approve_data = await self.users_storage.get_phone_approve_data(user_id)
            if phone_approve_data is None:
                raise NoSuchUserError("Пользователь с таким id не найден")
            if phone_approve_data.is_phone_approved:
                raise AuthenticationError("Пользователь уже подтвердил телефон")
            if phone_approve_data.phone_approve_code != code:
                raise AuthenticationError("Неверный код подтверждения")
            await self.users_storage.approve_phone(actor_user_id, user_id)
            return True
        return False

    async def update_user_info(
        self,
        actor_user_id: UUID,
        user_id: UUID,
        name: str,
        soname: str,
        father_name: str,
    ):
        permissions = [
            Permissions.UPDATE_USER_SELF,
            Permissions.UPDATE_USER_OTHER,
        ]
        if await self.permissions_manager.is_action_allowed(actor_user_id, user_id, permissions):
            await self.users_storage.update_user_info(
                actor_id=actor_user_id,
                uid=user_id,
                name=name,
                soname=soname,
                father_name=father_name,
            )

    async def update_email(
        self,
        actor_user_id: UUID,
        user_id: UUID,
        email: EmailStr,
    ):
        permissions = [
            Permissions.UPDATE_USER_SELF,
            Permissions.UPDATE_USER_OTHER,
        ]
        if await self.permissions_manager.is_action_allowed(actor_user_id, user_id, permissions):
            await self.users_storage.update_email(
                actor_id=actor_user_id,
                uid=user_id,
                email=email,
                email_approve_code=generate_random_approve_code(),
            )
            email_approve_data = await self.users_storage.get_email_approve_data(uid=user_id)
            if email_approve_data is None:
                raise ValueError(
                    f"Данные подтверждения email не "
                    f"найдены для пользователя: {user_id=}"
                )
            if email_approve_data.email_approve_code is None:
                raise ValueError(f"Kод подтверждения не задан: {user_id=} {email_approve_data=}")
            message_body = self.notification_manager.get_contact_approve_message(
                email_approve_data.email_approve_code,
                NotificationMessageChannel.EMAIL,
            )
            await self.notification_manager.create_notification(
                user_id=user_id,
                entity_id=user_id,
                entity_type=UserToGet,
                message_type=NotificationMessageType.APPROVE_CONTACT,
                message_channel=NotificationMessageChannel.EMAIL,
                destination_address=email,
                message_body=message_body,
            )

    async def update_phone(
        self,
        actor_user_id: UUID,
        user_id: UUID,
        phone: str,
    ):
        permissions = [
            Permissions.UPDATE_USER_SELF,
            Permissions.UPDATE_USER_OTHER,
        ]
        if await self.permissions_manager.is_action_allowed(actor_user_id, user_id, permissions):
            await self.users_storage.update_phone(
                actor_id=actor_user_id,
                uid=user_id,
                phone=phone,
                phone_approve_code=generate_random_approve_code(),
            )
            phone_approve_data = await self.users_storage.get_phone_approve_data(uid=user_id)
            if phone_approve_data is None:
                raise ValueError(
                    f"Данные подтверждения телефона не найдены для пользователя: {user_id=}",
                )
            if phone_approve_data.phone_approve_code is None:
                raise ValueError(f"Kод подтверждения не задан: {user_id=} {phone_approve_data=}")
            message_body = self.notification_manager.get_contact_approve_message(
                phone_approve_data.phone_approve_code,
                NotificationMessageChannel.SMS,
            )
            await self.notification_manager.create_notification(
                user_id=user_id,
                entity_id=user_id,
                entity_type=UserToGet,
                message_type=NotificationMessageType.APPROVE_CONTACT,
                message_channel=NotificationMessageChannel.SMS,
                destination_address=phone,
                message_body=message_body,
            )

    async def update_password(
        self,
        actor_user_id: UUID,
        user_id: UUID,
        new_password: str,
        old_password: str,
    ):
        permissions = [
            Permissions.UPDATE_USER_SELF,
            Permissions.UPDATE_USER_OTHER,
        ]
        if not await self.permissions_manager.is_action_allowed(
            actor_user_id,
            user_id,
            permissions
        ):
            raise UsersManagerError(
                "Неизвестная ошибка. Проверка прав "
                "доступа должна порождать исключение"
            )
        password_data = await self.users_storage.get_password_hash_by_id(user_id)
        if password_data is None:
            raise NoSuchUserError("Пользователь не найден")
        if not verify_password(old_password, password_data.password_hash):
            raise AuthenticationError("Действующий пароль введен неверно")
        if new_password == old_password:
            raise AuthenticationError("Новый пароль должен отличаться от старого")
        password_hash = hash_password(new_password)
        await self.users_storage.update_password(
            actor_id=actor_user_id,
            uid=user_id,
            password_hash=password_hash,
        )

    async def get_user_fio(
        self,
        actor_user_id: UUID,
        user_id: UUID,
    ) -> str:
        permissions = [
            Permissions.UPDATE_USER_SELF,
            Permissions.UPDATE_USER_OTHER,
            Permissions.GET_USER_FIO_OTHER
        ]
        if await self.permissions_manager.is_action_allowed(actor_user_id, user_id, permissions):
            user = await self.users_storage.get(user_id)
            if user is None:
                raise NoSuchUserError(f"Пользователь с таким {user_id=} не найден")
            return f"{user.soname} {user.name} {user.father_name}"
        raise UsersManagerError("Ошибка логики. Проверка прав доступа должна порождать исключение")

    @cachedmethod(lambda self: self._users_fio_cache)
    async def get_user_fio_cached(
        self,
        actor_user_id: UUID,
        user_id: UUID,
    ) -> str:
        return await self.get_user_fio(actor_user_id, user_id)

    async def add_role(
        self,
        actor_user_id: UUID,
        user_to_change_id: UUID,
        role_id: UserRoleId,
    ):
        permissions = [
            Permissions.ADD_ROLE,
        ]
        if await self.permissions_manager.is_action_allowed(
            actor_user_id,
            user_to_change_id,
            permissions
        ):
            user_to_change = await self.users_storage.get(user_to_change_id)
            if user_to_change is None:
                raise NoSuchUserError(f"Пользователь с таким {user_to_change_id=} не найден")
            await self.users_storage.add_user_role(actor_user_id, user_to_change_id, role_id)
        else:
            raise UsersManagerError("Неизвестная ошибка")

    async def delete_role(
        self,
        actor_user_id: UUID,
        user_to_change_id: UUID,
        role_id: UserRoleId,
    ):
        permissions = [
            Permissions.DELETE_ROLE,
        ]
        if await self.permissions_manager.is_action_allowed(
            actor_user_id,
            user_to_change_id,
            permissions
        ):
            user_to_change = await self.users_storage.get(user_to_change_id)
            if user_to_change is None:
                raise NoSuchUserError(f"Пользователь с таким {user_to_change_id=} не найден")
            await self.users_storage.delete_user_role(actor_user_id, user_to_change_id, role_id)
        else:
            raise UsersManagerError("Неизвестная ошибка")

    async def search_users(
        self,
        actor_user_id: UUID,
        search_string: str,
        backoffice_only: bool,
    ) -> list[UserToGet]:
        permissions = [
            Permissions.USER_SEARCH,
        ]
        if await self.permissions_manager.is_action_allowed(
            actor_user_id,
            actor_user_id,
            permissions
        ):
            return await self.users_storage.search_users(search_string, backoffice_only)
        raise UsersManagerError("Неизвестная ошибка")

    async def send_approve_email_code(
        self,
        user_id: UUID,
    ):
        user = await self.users_storage.get(user_id)
        if user is None:
            raise NoSuchUserError(f"Пользователь с таким {user_id=} не найден")
        if user.email is None:
            raise ValueError(f"Email пользователя не задан: {user_id=}")
        if user.is_email_approved:
            raise ValueError(f"Email пользователя уже подтвержден: {user_id=}")
        email_approve_data = await self.users_storage.get_email_approve_data(uid=user_id)
        if email_approve_data is None:
            raise ValueError(
                f"Данные подтверждения почты не "
                f"найдены для пользователя: {user_id=}",
            )
        if email_approve_data.email_approve_code is None:
            raise ValueError(f"Kод подтверждения не задан: {user_id=} {email_approve_data=}")
        message_body = self.notification_manager.get_contact_approve_message(
            email_approve_data.email_approve_code,
            NotificationMessageChannel.EMAIL,
        )
        await self.notification_manager.create_notification(
            user_id=user_id,
            entity_id=user_id,
            entity_type=UserToGet,
            message_type=NotificationMessageType.APPROVE_CONTACT,
            message_channel=NotificationMessageChannel.EMAIL,
            destination_address=user.email,
            message_body=message_body,
        )

    async def send_approve_phone_code(
        self,
        user_id: UUID,
    ):
        user = await self.users_storage.get(user_id)
        if user is None:
            raise NoSuchUserError(f"Пользователь с таким {user_id=} не найден")
        if user.phone is None:
            raise ValueError(f"Телефон пользователя не задан: {user_id=}")
        if user.is_phone_approved:
            raise ValueError(f"Номер телефона пользователя уже подтвержден: {user_id=}")
        phone_approve_data = await self.users_storage.get_phone_approve_data(uid=user_id)
        if phone_approve_data is None:
            raise ValueError(
                f"Данные подтверждения телефона не "
                f"найдены для пользователя: {user_id=}",
            )
        if phone_approve_data.phone_approve_code is None:
            raise ValueError(f"Kод подтверждения не задан: {user_id=} {phone_approve_data=}")
        message_body = self.notification_manager.get_contact_approve_message(
            phone_approve_data.phone_approve_code,
            NotificationMessageChannel.SMS,
        )
        await self.notification_manager.create_notification(
            user_id=user_id,
            entity_id=user_id,
            entity_type=UserToGet,
            message_type=NotificationMessageType.APPROVE_CONTACT,
            message_channel=NotificationMessageChannel.SMS,
            destination_address=user.phone,
            message_body=message_body,
        )
