import logging
import inspect
from uuid import UUID

from src.permissions.permissions_manager_models import (
    Permission,
    PermissionId,
)
from src.roles.roles_manager_models import (
    Roles,
    UserRoleId,
)
from src.users.users_storage import UsersStorage


_LOG = logging.getLogger("uvicorn.error")


class PermissionsManagerError(Exception):
    pass


class PermissionsManager:
    def __init__(
        self,
        users_storage: UsersStorage,

    ):
        self.users_storage: UsersStorage = users_storage
        self.permissions_to_role_mapping: dict[
            PermissionId, list[UserRoleId]
        ] = Roles.as_permission_to_roles_mapping()

    async def is_action_allowed(
        self,
        actor_user_id: UUID,
        user_id: UUID,
        allowed_permissions: list[Permission]
    ) -> bool:
        _LOG.info(f"Проверяем действие {allowed_permissions=}")
        _LOG.info(f"Пользователь {actor_user_id=}")
        _LOG.info(f"Пользователь {user_id=}")
        _LOG.info(f"Метод: {inspect.stack()[1].function=}")

        actor_user_roles = await self.users_storage.get_user_roles_cached(
            actor_user_id,
        )
        permission: Permission

        for role_id in actor_user_roles:
            role_permissions = Roles[role_id].permissions
            for permission in role_permissions:
                if permission in allowed_permissions:
                    _LOG.debug(f"Пермишен: {permission}")
                    if permission.self_only:
                        if actor_user_id == user_id:
                            return True
                    else:
                        return True
        _LOG.info(f"{inspect.stack()[1].filename}:{inspect.stack()[1].lineno}")
        _LOG.info(f"{inspect.stack()[1].function=}")

        raise PermissionsManagerError(
            f"Действие не разрешено для пользователя. {actor_user_id=}"
        )
