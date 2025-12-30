from enum import Enum
from typing import Optional

from pydantic import BaseModel

from src.misc.misc_lib import SubscriptableMeta
from src.permissions.permissions_manager_models import (
    Permissions,
    Permission,
    PermissionId,
)

from src.users.users_storage_models_common import (
    DepartmentId,
    UserPositionId,
)


class UserRoleId(str, Enum):
    ANY = "ANY"
    ADMIN = "ADMIN"
    SYSTEM_USER = "SYSTEM_USER"
    COMMON_USER = "COMMON_USER"
    CLIENT_DEPARTMENT_HEAD_OF_DEPARTMENT = "CLIENT_DEPARTMENT_HEAD_OF_DEPARTMENT"
    CLIENT_DEPARTMENT_EXECUTOR = "CLIENT_DEPARTMENT_EXECUTOR"
    TECHNICAL_DEPARTMENT_HEAD_OF_DEPARTMENT = "TECHNICAL_DEPARTMENT_HEAD_OF_DEPARTMENT"
    TECHNICAL_DEPARTMENT_EXECUTOR = "TECHNICAL_DEPARTMENT_EXECUTOR"
    TARIFF_DEPARTMENT_HEAD_OF_DEPARTMENT = "TARIFF_DEPARTMENT_HEAD_OF_DEPARTMENT"
    TARIFF_DEPARTMENT_EXECUTOR = "TARIFF_DEPARTMENT_EXECUTOR"
    CONTRACTS_DEPARTMENT_HEAD_OF_DEPARTMENT = "CONTRACTS_DEPARTMENT_HEAD_OF_DEPARTMENT"
    CONTRACTS_DEPARTMENT_EXECUTOR = "CONTRACTS_DEPARTMENT_EXECUTOR"


class UserRole(BaseModel):
    role_id: UserRoleId
    department_id: DepartmentId | None
    position_id: UserPositionId | None
    permissions: list[Permission]
    description: Optional[str] = None


class Roles(metaclass=SubscriptableMeta):
    ANY = UserRole(
        role_id=UserRoleId.ANY,
        department_id=None,
        position_id=None,
        description="Системная роль для случаев когда нужна любая роль для операции. "
                    "Не должна использоваться для конкретных пользователей",
        permissions=[
            Permissions.GET_USER_SELF,
        ]
    )
    SYSTEM_USER = UserRole(
        role_id=UserRoleId.SYSTEM_USER,
        department_id=None,
        position_id=UserPositionId.SYSTEM_USER,
        description="Системный пользователь",
        permissions=[
            Permissions.CHANGE_FORM_STATUS_BY_SYSTEM_SELF,
            Permissions.CHANGE_FORM_STATUS_BY_SYSTEM_OTHER,
            Permissions.FORM_GET_FORM_OWNER_USER_ID_OTHER,
        ],
    )
    ADMIN = UserRole(
        role_id=UserRoleId.ADMIN,
        department_id=None,
        position_id=UserPositionId.ADMIN,
        description="Администратор системы",
        permissions=Permissions.as_list(),
    )
    COMMON_USER = UserRole(
        role_id=UserRoleId.COMMON_USER,
        department_id=None,
        position_id=UserPositionId.COMMON_USER,
        description="Внешний пользователь",
        permissions=[
            Permissions.SIGN_REQUEST_SELF,
            Permissions.UPDATE_USER_SELF,
            Permissions.CHANGE_FORM_STATUS_SELF,
            Permissions.NOTE_RESOLVE_BY_USER_SELF,
            Permissions.VALIDATE_FORM_SELF,
            Permissions.FORM_CREATE_SELF,
            Permissions.GET_USER_SELF,
            Permissions.FORM_GET_SELF,
            Permissions.UPDATE_FORM_SELF,
            Permissions.NOTE_GET_FORM_NOTES_SELF,
            Permissions.NOTE_RENDER_TEMPLATE_SELF,
            Permissions.GET_USER_FIO_OTHER,
            Permissions.FORM_MANAGE_USER_FILES_SELF,
            Permissions.FORM_GET_BACKOFFICE_TO_USER_FILES_SELF,
            Permissions.USER_GET_USER_ROLES_SELF,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_SELF,
            Permissions.APPEAL_CREATE,
            Permissions.APPEAL_CREATE_USER_MESSAGE,
            Permissions.APPEAL_CLOSE_SELF,
            Permissions.APPEAL_GET_USER_APPEALS_SELF,
            Permissions.FORM_GET_FORM_OWNER_USER_ID_SELF,
            Permissions.APPEAL_GET_OWNER_ID_SELF,
            Permissions.FORM_GET_FORM_OWNER_USER_ID_SELF,
            Permissions.FORM_RENDER_TEMPLATE_SELF,
            Permissions.REGION_GET_LIST,
            Permissions.VOLTAGE_GET_LIST,
            Permissions.APPEAL_DOWNLOAD_USER_FILES_SELF,
            Permissions.APPEAL_DOWNLOAD_BACKOFFICE_FILES_SELF,
            Permissions.RETAIL_MARKET_ENTITY_GET_ALL,
            Permissions.RETAIL_MARKET_ENTITY_SEARCH,
            Permissions.REGION_GET_BY_ID,
            Permissions.RETAIL_MARKET_ENTITY_GET_BY_ID,
        ]
    )
    CLIENT_DEPARTMENT_HEAD_OF_DEPARTMENT = UserRole(
        role_id=UserRoleId.CLIENT_DEPARTMENT_HEAD_OF_DEPARTMENT,
        department_id=DepartmentId.CLIENT_DEPARTMENT,
        position_id=UserPositionId.HEAD_OF_DEPARTMENT,
        description="Начальник клиентского отдела",
        permissions=[
            Permissions.SIGN_REQUEST_SELF,
            Permissions.SIGN_REQUEST_OTHER,
            Permissions.CREATE_USER_OTHER,
            Permissions.GET_USER_OTHER,
            Permissions.UPDATE_USER_OTHER,
            Permissions.FORM_CREATE_SELF,
            Permissions.FORM_CREATE_OTHER,
            Permissions.FORM_GET_SELF,
            Permissions.FORM_GET_OTHER,
            Permissions.NOTE_CREATE,
            Permissions.NOTE_RESOLVE_BY_USER_SELF,
            Permissions.NOTE_RESOLVE_BY_USER_OTHER,
            Permissions.NOTE_RESOLVE_BY_BACKOFFICE_USER,
            Permissions.CHANGE_FORM_STATUS_SELF,
            Permissions.CHANGE_FORM_STATUS_OTHER,
            Permissions.VALIDATE_FORM_SELF,
            Permissions.VALIDATE_FORM_OTHER,
            Permissions.UPDATE_FORM_REQUEST_NUMBER,
            Permissions.FORM_MANAGE_USER_FILES_SELF,
            Permissions.FORM_GET_BACKOFFICE_TO_USER_FILES_SELF,
            Permissions.FORM_MANAGE_USER_FILES_OTHER,
            Permissions.FORM_GET_BACKOFFICE_TO_USER_FILES_OTHER,
            Permissions.FORM_MANAGE_BACKOFFICE_FILES,
            Permissions.USER_GET_USER_ROLES_SELF,
            Permissions.FORM_UPDATE_EXECUTOR,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_SELF,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_OTHER,
            Permissions.USER_SEARCH,
            Permissions.APPEAL_GET_USER_APPEALS_OTHER,
            Permissions.APPEAL_CREATE_BACKOFFICE_MESSAGE,
            Permissions.APPEAL_CLOSE_OTHER,
            Permissions.FORM_GET_FORM_OWNER_USER_ID_OTHER,
            Permissions.FORM_GET_FORM_OWNER_USER_ID_OTHER,
            Permissions.APPEAL_GET_OWNER_ID_OTHER,
            Permissions.FORM_RENDER_TEMPLATE_OTHER,
            Permissions.NOTE_RENDER_TEMPLATE_OTHER,
            Permissions.NOTE_GET_FORM_NOTES_OTHER,
            Permissions.NOTE_GET_FORM_NOTES_SELF,
            Permissions.UPDATE_FORM_IS_PRIMARY,
            Permissions.UPDATE_USER_SELF,
            Permissions.UPDATE_USER_OTHER,
            Permissions.GET_USER_FIO_OTHER,
            Permissions.RAILWAY_UPDATE_BY_BACKOFFICE_USER,
            Permissions.RAILWAY_GET_BY_BACKOFFICE_USER,
            Permissions.REGION_GET_LIST,
            Permissions.VOLTAGE_GET_LIST,
            Permissions.FORM_UPDATE_RENT_AGREEMENT_1_YEAR_FIELD,
            Permissions.FORM_UPDATE_LIVING_SPACE_IN_MKD_FIELD,
            Permissions.APPEAL_DOWNLOAD_USER_FILES_OTHER,
            Permissions.APPEAL_DOWNLOAD_BACKOFFICE_FILES_OTHER,
            Permissions.RETAIL_MARKET_ENTITY_GET_ALL,
            Permissions.RETAIL_MARKET_ENTITY_SEARCH,
            Permissions.NOTE_DELETED_BY_BACKOFFICE_USER,
            Permissions.REGION_GET_BY_ID,
            Permissions.RETAIL_MARKET_ENTITY_GET_BY_ID,
            Permissions.FORM_GET_REVISIONS_OTHER,
        ]
    )

    CLIENT_DEPARTMENT_EXECUTOR = UserRole(
        role_id=UserRoleId.CLIENT_DEPARTMENT_EXECUTOR,
        department_id=DepartmentId.CLIENT_DEPARTMENT,
        position_id=UserPositionId.EXECUTOR,
        description="Исполнитель клиентского отдела",
        permissions=[
            Permissions.SIGN_REQUEST_SELF,
            Permissions.SIGN_REQUEST_OTHER,
            Permissions.FORM_CREATE_SELF,
            Permissions.GET_USER_OTHER,
            Permissions.FORM_CREATE_OTHER,
            Permissions.FORM_GET_SELF,
            Permissions.FORM_GET_OTHER,
            Permissions.NOTE_CREATE,
            Permissions.NOTE_RESOLVE_BY_USER_SELF,
            Permissions.NOTE_RESOLVE_BY_BACKOFFICE_USER,
            Permissions.CHANGE_FORM_STATUS_SELF,
            Permissions.CHANGE_FORM_STATUS_OTHER,
            Permissions.VALIDATE_FORM_SELF,
            Permissions.VALIDATE_FORM_OTHER,
            Permissions.FORM_MANAGE_USER_FILES_SELF,
            Permissions.FORM_GET_BACKOFFICE_TO_USER_FILES_SELF,
            Permissions.FORM_MANAGE_USER_FILES_OTHER,
            Permissions.FORM_GET_BACKOFFICE_TO_USER_FILES_OTHER,
            Permissions.FORM_MANAGE_BACKOFFICE_FILES,
            Permissions.USER_GET_USER_ROLES_SELF,
            Permissions.FORM_UPDATE_EXECUTOR,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_SELF,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_OTHER,
            Permissions.USER_SEARCH,
            Permissions.NOTE_GET_FORM_NOTES_OTHER,
            Permissions.NOTE_GET_FORM_NOTES_SELF,
            Permissions.UPDATE_FORM_IS_PRIMARY,
            Permissions.APPEAL_GET_USER_APPEALS_OTHER,
            Permissions.APPEAL_CREATE_BACKOFFICE_MESSAGE,
            Permissions.APPEAL_CLOSE_OTHER,
            Permissions.APPEAL_GET_OWNER_ID_OTHER,
            Permissions.FORM_GET_FORM_OWNER_USER_ID_OTHER,
            Permissions.FORM_RENDER_TEMPLATE_OTHER,
            Permissions.NOTE_RENDER_TEMPLATE_OTHER,
            Permissions.UPDATE_USER_SELF,
            Permissions.UPDATE_USER_OTHER,
            Permissions.GET_USER_FIO_OTHER,
            Permissions.RAILWAY_UPDATE_BY_BACKOFFICE_USER,
            Permissions.RAILWAY_GET_BY_BACKOFFICE_USER,
            Permissions.REGION_GET_LIST,
            Permissions.VOLTAGE_GET_LIST,
            Permissions.FORM_UPDATE_RENT_AGREEMENT_1_YEAR_FIELD,
            Permissions.FORM_UPDATE_LIVING_SPACE_IN_MKD_FIELD,
            Permissions.APPEAL_DOWNLOAD_USER_FILES_OTHER,
            Permissions.APPEAL_DOWNLOAD_BACKOFFICE_FILES_OTHER,
            Permissions.RETAIL_MARKET_ENTITY_GET_ALL,
            Permissions.RETAIL_MARKET_ENTITY_SEARCH,
            Permissions.NOTE_DELETED_BY_BACKOFFICE_USER,
            Permissions.REGION_GET_BY_ID,
            Permissions.RETAIL_MARKET_ENTITY_GET_BY_ID,
            Permissions.FORM_GET_REVISIONS_OTHER,
        ]
    )
    TECHNICAL_DEPARTMENT_HEAD_OF_DEPARTMENT = UserRole(
        role_id=UserRoleId.TECHNICAL_DEPARTMENT_HEAD_OF_DEPARTMENT,
        department_id=DepartmentId.TECHNICAL_DEPARTMENT,
        position_id=UserPositionId.HEAD_OF_DEPARTMENT,
        description="Начальник технического отдела",
        permissions=[
            Permissions.SIGN_REQUEST_SELF,
            Permissions.SIGN_REQUEST_OTHER,
            Permissions.GET_USER_OTHER,
            Permissions.FORM_GET_OTHER,
            Permissions.CHANGE_FORM_STATUS_SELF,
            Permissions.CHANGE_FORM_STATUS_OTHER,
            Permissions.USER_GET_USER_ROLES_SELF,
            Permissions.FORM_UPDATE_EXECUTOR,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_SELF,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_OTHER,
            Permissions.REGION_GET_LIST,
            Permissions.VOLTAGE_GET_LIST,
            Permissions.APPEAL_DOWNLOAD_USER_FILES_OTHER,
            Permissions.APPEAL_DOWNLOAD_BACKOFFICE_FILES_OTHER,
            Permissions.RETAIL_MARKET_ENTITY_GET_ALL,
            Permissions.RETAIL_MARKET_ENTITY_SEARCH,
            Permissions.REGION_GET_BY_ID,
            Permissions.RETAIL_MARKET_ENTITY_GET_BY_ID,
        ]
    )
    TECHNICAL_DEPARTMENT_EXECUTOR = UserRole(
        role_id=UserRoleId.TECHNICAL_DEPARTMENT_EXECUTOR,
        department_id=DepartmentId.TECHNICAL_DEPARTMENT,
        position_id=UserPositionId.EXECUTOR,
        description="Исполнитель технического отдела",
        permissions=[
            Permissions.SIGN_REQUEST_SELF,
            Permissions.SIGN_REQUEST_OTHER,
            Permissions.GET_USER_OTHER,
            Permissions.FORM_GET_OTHER,
            Permissions.CHANGE_FORM_STATUS_SELF,
            Permissions.CHANGE_FORM_STATUS_OTHER,
            Permissions.USER_GET_USER_ROLES_SELF,
            Permissions.FORM_UPDATE_EXECUTOR,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_SELF,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_OTHER,
            Permissions.REGION_GET_LIST,
            Permissions.VOLTAGE_GET_LIST,
            Permissions.APPEAL_DOWNLOAD_USER_FILES_OTHER,
            Permissions.APPEAL_DOWNLOAD_BACKOFFICE_FILES_OTHER,
            Permissions.RETAIL_MARKET_ENTITY_GET_ALL,
            Permissions.RETAIL_MARKET_ENTITY_SEARCH,
            Permissions.REGION_GET_BY_ID,
            Permissions.RETAIL_MARKET_ENTITY_GET_BY_ID,
        ]
    )
    TARIFF_DEPARTMENT_HEAD_OF_DEPARTMENT = UserRole(
        role_id=UserRoleId.TARIFF_DEPARTMENT_HEAD_OF_DEPARTMENT,
        department_id=DepartmentId.TARIFF_DEPARTMENT,
        position_id=UserPositionId.HEAD_OF_DEPARTMENT,
        description="Начальник тарифного отдела",
        permissions=[
            Permissions.SIGN_REQUEST_SELF,
            Permissions.SIGN_REQUEST_OTHER,
            Permissions.GET_USER_OTHER,
            Permissions.FORM_GET_OTHER,
            Permissions.CHANGE_FORM_STATUS_SELF,
            Permissions.CHANGE_FORM_STATUS_OTHER,
            Permissions.USER_GET_USER_ROLES_SELF,
            Permissions.FORM_UPDATE_EXECUTOR,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_SELF,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_OTHER,
            Permissions.REGION_GET_LIST,
            Permissions.VOLTAGE_GET_LIST,
            Permissions.APPEAL_DOWNLOAD_USER_FILES_OTHER,
            Permissions.APPEAL_DOWNLOAD_BACKOFFICE_FILES_OTHER,
            Permissions.RETAIL_MARKET_ENTITY_GET_ALL,
            Permissions.RETAIL_MARKET_ENTITY_SEARCH,
            Permissions.REGION_GET_BY_ID,
            Permissions.RETAIL_MARKET_ENTITY_GET_BY_ID,
        ]
    )
    TARIFF_DEPARTMENT_EXECUTOR = UserRole(
        role_id=UserRoleId.TARIFF_DEPARTMENT_EXECUTOR,
        department_id=DepartmentId.TARIFF_DEPARTMENT,
        position_id=UserPositionId.EXECUTOR,
        description="Исполнитель тарифного отдела",
        permissions=[
            Permissions.SIGN_REQUEST_SELF,
            Permissions.SIGN_REQUEST_OTHER,
            Permissions.GET_USER_OTHER,
            Permissions.FORM_GET_OTHER,
            Permissions.CHANGE_FORM_STATUS_SELF,
            Permissions.CHANGE_FORM_STATUS_OTHER,
            Permissions.USER_GET_USER_ROLES_SELF,
            Permissions.FORM_UPDATE_EXECUTOR,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_SELF,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_OTHER,
            Permissions.REGION_GET_LIST,
            Permissions.VOLTAGE_GET_LIST,
            Permissions.APPEAL_DOWNLOAD_USER_FILES_OTHER,
            Permissions.APPEAL_DOWNLOAD_BACKOFFICE_FILES_OTHER,
            Permissions.RETAIL_MARKET_ENTITY_GET_ALL,
            Permissions.RETAIL_MARKET_ENTITY_SEARCH,
            Permissions.REGION_GET_BY_ID,
            Permissions.RETAIL_MARKET_ENTITY_GET_BY_ID,
        ]
    )
    CONTRACTS_DEPARTMENT_HEAD_OF_DEPARTMENT = UserRole(
        role_id=UserRoleId.CONTRACTS_DEPARTMENT_HEAD_OF_DEPARTMENT,
        department_id=DepartmentId.CONTRACT_DEPARTMENT,
        position_id=UserPositionId.HEAD_OF_DEPARTMENT,
        description="Начальник договорного отдела",
        permissions=[
            Permissions.SIGN_REQUEST_SELF,
            Permissions.SIGN_REQUEST_OTHER,
            Permissions.GET_USER_OTHER,
            Permissions.FORM_GET_OTHER,
            Permissions.CHANGE_FORM_STATUS_SELF,
            Permissions.CHANGE_FORM_STATUS_OTHER,
            Permissions.USER_GET_USER_ROLES_SELF,
            Permissions.FORM_UPDATE_EXECUTOR,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_SELF,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_OTHER,
            Permissions.REGION_GET_LIST,
            Permissions.VOLTAGE_GET_LIST,
            Permissions.APPEAL_DOWNLOAD_USER_FILES_OTHER,
            Permissions.APPEAL_DOWNLOAD_BACKOFFICE_FILES_OTHER,
            Permissions.RETAIL_MARKET_ENTITY_GET_ALL,
            Permissions.RETAIL_MARKET_ENTITY_SEARCH,
            Permissions.REGION_GET_BY_ID,
            Permissions.RETAIL_MARKET_ENTITY_GET_BY_ID,
        ]
    )
    CONTRACTS_DEPARTMENT_EXECUTOR = UserRole(
        role_id=UserRoleId.CONTRACTS_DEPARTMENT_EXECUTOR,
        department_id=DepartmentId.CONTRACT_DEPARTMENT,
        position_id=UserPositionId.EXECUTOR,
        description="Исполнитель договорного отдела",
        permissions=[
            Permissions.SIGN_REQUEST_SELF,
            Permissions.SIGN_REQUEST_OTHER,
            Permissions.GET_USER_OTHER,
            Permissions.FORM_GET_OTHER,
            Permissions.CHANGE_FORM_STATUS_SELF,
            Permissions.CHANGE_FORM_STATUS_OTHER,
            Permissions.USER_GET_USER_ROLES_SELF,
            Permissions.FORM_UPDATE_EXECUTOR,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_SELF,
            Permissions.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_OTHER,
            Permissions.REGION_GET_LIST,
            Permissions.VOLTAGE_GET_LIST,
            Permissions.APPEAL_DOWNLOAD_USER_FILES_OTHER,
            Permissions.APPEAL_DOWNLOAD_BACKOFFICE_FILES_OTHER,
            Permissions.RETAIL_MARKET_ENTITY_GET_ALL,
            Permissions.RETAIL_MARKET_ENTITY_SEARCH,
            Permissions.REGION_GET_BY_ID,
            Permissions.RETAIL_MARKET_ENTITY_GET_BY_ID,
        ]
    )

    @classmethod
    def as_list(cls) -> list[UserRole]:
        return [v for k, v in cls.__dict__.items() if isinstance(v, UserRole)]

    @classmethod
    def as_permission_to_roles_mapping(cls) -> dict[PermissionId, list[UserRoleId]]:
        result = {}
        for role in cls.as_list():
            for permission in role.permissions:
                if permission.permission_id not in result:
                    result[permission.permission_id] = []
                result[permission.permission_id].append(role.role_id)
        return result
