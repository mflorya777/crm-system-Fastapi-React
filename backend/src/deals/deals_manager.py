import logging

import jinja2
from anyio import open_file
from fastapi import UploadFile

from src.deals.deals_storage import DealsStorage
from src.misc.misc_lib import (
    datetime_to_moscow_proper_date,
    proper_phone_number,
)
from src.model import AppConfig
from src.notifications.notifications_manager import NotificationManager
from src.permissions.permissions_manager import PermissionsManager
from src.permissions.permissions_manager_models import Permissions
from src.roles.roles_manager import UserRoleId
from src.signs.signs_manager import SignsManager
from src.users.users_storage import UsersStorage

_LOG = logging.getLogger("uvicorn.info")

jinja_env = jinja2.Environment()
jinja_env.filters['datetime_to_moscow_proper_date'] = datetime_to_moscow_proper_date
jinja_env.filters['proper_phone_number'] = proper_phone_number


class DealsManagerException(Exception):
    pass


class WrongDealClassException(DealsManagerException):
    pass


class FormsManager:
    def __init__(
        self,
        deals_storage: DealsStorage,
        files_storage_directory_path: str,
        signs_manager: SignsManager,
        users_storage: UsersStorage,
        permissions_manager: PermissionsManager,
        notifications_manager: NotificationManager,
    ):
        self.deals_storage: DealsStorage = deals_storage
        self.files_storage_directory_path = files_storage_directory_path
        self.signs_manager: SignsManager = signs_manager
        self.users_storage: UsersStorage = users_storage
        self.permissions_manager: PermissionsManager = permissions_manager
        self.notifications_manager: NotificationManager = notifications_manager
