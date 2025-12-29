import logging
from uuid import UUID

from src.roles.roles_manager_models import UserRoleId
from src.users.users_storage import UsersStorage


_LOG = logging.getLogger("uvicorn.error")


class RolesManagerError(Exception):
    pass


class RolePermissionError(RolesManagerError):
    pass


class RolesManager:
    def __init__(
        self,
        users_storage: UsersStorage,

    ):
        self.users_storage: UsersStorage = users_storage

    async def check_role_permissions(
        self,
        actor_user_id: UUID,
        allowed_roles: set[UserRoleId],
    ) -> bool:
        actor_user = await self.users_storage.get_full(actor_user_id)
        if UserRoleId.ANY in allowed_roles:
            if len(actor_user.roles) > 0:
                return True
            raise RolePermissionError(
                "У пользователя не достаточно прав. Попробуйте изменить его роль."
            )
        if not set(actor_user.roles) and allowed_roles:
            raise RolePermissionError(
                "У пользователя не достаточно прав. Попробуйте изменить его роль."
            )
        return True
