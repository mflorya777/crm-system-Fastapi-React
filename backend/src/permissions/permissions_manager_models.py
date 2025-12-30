from enum import Enum
from typing import Optional

from pydantic import BaseModel

from src.misc.misc_lib import SubscriptableMeta


class PermissionId(str, Enum):
    REGISTER_USER_SELF = "REGISTER_USER_SELF"
    CREATE_USER_OTHER = "CREATE_USER_OTHER"
    GET_USER_SELF = "GET_USER_SELF"
    GET_USER_OTHER = "GET_USER_OTHER"
    GET_USERS_BY_ROLES = "GET_USERS_BY_ROLES"
    UPDATE_USER_SELF = "UPDATE_USER_SELF"
    UPDATE_USER_OTHER = "UPDATE_USER_OTHER"
    GET_USER_FIO_OTHER = "GET_USER_FIO_OTHER"
    USER_GET_USER_ROLES_SELF = "GET_USER_ROLES_SELF"
    USER_GET_USER_ROLES_OTHER = "GET_USER_ROLES_OTHER"
    USER_SEARCH = "USER_SEARCH"

    FORM_CREATE_SELF = "FORM_CREATE_SELF"
    FORM_CREATE_OTHER = "FORM_CREATE_OTHER"
    FORM_GET_SELF = "FORM_GET_SELF"
    FORM_GET_OTHER = "FORM_GET_OTHER"
    UPDATE_FORM_SELF = "UPDATE_FORM_SELF"
    UPDATE_FORM_OTHER = "UPDATE_FORM_OTHER"
    CHANGE_FORM_STATUS_SELF = "CHANGE_FORM_STATUS_SELF"
    CHANGE_FORM_STATUS_OTHER = "CHANGE_FORM_STATUS_OTHER"
    CHANGE_FORM_STATUS_BY_SYSTEM_SELF = "CHANGE_FORM_STATUS_BY_SYSTEM_SELF"
    CHANGE_FORM_STATUS_BY_SYSTEM_OTHER = "CHANGE_FORM_STATUS_BY_SYSTEM_OTHER"
    VALIDATE_FORM_SELF = "VALIDATE_FORM_SELF"
    VALIDATE_FORM_OTHER = "VALIDATE_FORM_OTHER"
    UPDATE_FORM_REQUEST_NUMBER = "UPDATE_FORM_REQUEST_NUMBER"
    UPDATE_FORM_IS_PRIMARY = "UPDATE_FORM_IS_PRIMARY"
    FORM_MANAGE_USER_FILES_SELF = "FORM_MANAGE_USER_FILES_SELF"
    FORM_MANAGE_USER_FILES_OTHER = "FORM_MANAGE_USER_FILES_OTHER"
    FORM_GET_BACKOFFICE_TO_USER_FILES_SELF = "FORM_GET_BACKOFFICE_TO_USER_FILES_SELF"
    FORM_GET_BACKOFFICE_TO_USER_FILES_OTHER = "FORM_GET_BACKOFFICE_TO_USER_FILES_OTHER"
    FORM_MANAGE_BACKOFFICE_FILES = "FORM_MANAGE_BACKOFFICE_FILES"
    FORM_UPDATE_EXECUTOR = "FORM_UPDATE_EXECUTOR"
    FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_SELF = "FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_SELF"
    FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_OTHER = "FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_OTHER"
    FORM_CHECK_IS_FORM_EXISTS_SELF = "FORM_CHECK_IS_FORM_EXISTS_SELF"
    FORM_CHECK_IS_FORM_EXISTS_OTHER = "FORM_CHECK_IS_FORM_EXISTS_OTHER"
    FORM_GET_FORM_OWNER_USER_ID_SELF = "FORM_GET_FORM_OWNER_USER_ID_SELF"
    FORM_GET_FORM_OWNER_USER_ID_OTHER = "FORM_GET_FORM_OWNER_USER_ID_OTHER"
    FORM_RENDER_TEMPLATE_SELF = "FORM_RENDER_TEMPLATE_SELF"
    FORM_RENDER_TEMPLATE_OTHER = "FORM_RENDER_TEMPLATE_OTHER"
    FORM_UPDATE_RENT_AGREEMENT_1_YEAR_FIELD = "FORM_UPDATE_RENT_AGREEMENT_1_YEAR_FIELD"
    FORM_UPDATE_LIVING_SPACE_IN_MKD_FIELD = "FORM_UPDATE_LIVING_SPACE_IN_MKD_FIELD"
    FORM_GET_REVISIONS_OTHER = "FORM_GET_REVISIONS_OTHER"

    NOTE_CREATE = "NOTE_CREATE"
    NOTE_GET_FORM_NOTES_OTHER = "NOTE_GET_FORM_NOTES_OTHER"
    NOTE_GET_FORM_NOTES_SELF = "NOTE_GET_FORM_NOTES_SELF"
    NOTE_RESOLVE_BY_USER_SELF = "NOTE_RESOLVE_BY_USER_SELF"
    NOTE_RESOLVE_BY_USER_OTHER = "NOTE_RESOLVE_BY_USER_OTHER"
    NOTE_RESOLVE_BY_BACKOFFICE_USER = "NOTE_RESOLVE_BY_BACKOFFICE_USER"
    NOTE_DELETED_BY_BACKOFFICE_USER = "NOTE_DELETED_BY_BACKOFFICE_USER"
    NOTE_RENDER_TEMPLATE_SELF = "NOTE_RENDER_TEMPLATE_SELF"
    NOTE_RENDER_TEMPLATE_OTHER = "NOTE_RENDER_TEMPLATE_OTHER"

    APPEAL_CREATE = "APPEAL_CREATE"
    APPEAL_CREATE_USER_MESSAGE = "APPEAL_CREATE_USER_MESSAGE"
    APPEAL_CREATE_BACKOFFICE_MESSAGE = "APPEAL_CREATE_BACKOFFICE_MESSAGE"
    APPEAL_CLOSE_SELF = "APPEAL_CLOSE_SELF"
    APPEAL_CLOSE_OTHER = "APPEAL_CLOSE_OTHER"
    APPEAL_GET_USER_APPEALS_SELF = "APPEAL_GET_USER_APPEALS_SELF"
    APPEAL_GET_USER_APPEALS_OTHER = "APPEAL_GET_USER_APPEALS_OTHER"
    APPEAL_GET_OWNER_ID_SELF = "APPEAL_GET_OWNER_ID_SELF"
    APPEAL_GET_OWNER_ID_OTHER = "APPEAL_GET_OWNER_ID_OTHER"
    APPEAL_DOWNLOAD_USER_FILES_SELF = "APPEAL_DOWNLOAD_USER_FILES_SELF"
    APPEAL_DOWNLOAD_USER_FILES_OTHER = "APPEAL_DOWNLOAD_USER_FILES_OTHER"
    APPEAL_DOWNLOAD_BACKOFFICE_FILES_SELF = "APPEAL_DOWNLOAD_BACKOFFICE_FILES_SELF"
    APPEAL_DOWNLOAD_BACKOFFICE_FILES_OTHER = "APPEAL_DOWNLOAD_BACKOFFICE_FILES_OTHER"

    SIGN_REQUEST_OTHER = "SIGN_REQUEST_BACKOFFICE_OTHER"
    SIGN_REQUEST_SELF = "SIGN_REQUEST_SELF"

    RAILWAY_GET_BY_BACKOFFICE_USER = "RAILWAY_GET_BY_BACKOFFICE_USER"
    RAILWAY_UPDATE_BY_BACKOFFICE_USER = "RAILWAY_UPDATE_BY_BACKOFFICE_USER"

    VOLTAGE_GET_LIST = "VOLTAGE_GET_LIST"
    REGION_GET_LIST = "REGION_GET_LIST"
    REGION_GET_BY_ID = "REGION_GET_BY_ID"

    RETAIL_MARKET_ENTITY_GET_ALL = "RETAIL_MARKET_ENTITY_GET_ALL"
    RETAIL_MARKET_ENTITY_SEARCH = "RETAIL_MARKET_ENTITY_SEARCH"
    RETAIL_MARKET_ENTITY_GET_BY_ID = "RETAIL_MARKET_ENTITY_GET_BY_ID"

    ADD_ROLE = "ADD_ROLE"
    DELETE_ROLE = "DELETE_ROLE"


class Permission(BaseModel):
    permission_id: PermissionId
    description: Optional[str]
    self_only: bool = True


class Permissions(metaclass=SubscriptableMeta):
    REGISTER_USER_SELF: Permission = Permission(
        permission_id=PermissionId.REGISTER_USER_SELF,
        description="Разрешить регистрацию",
    )
    GET_USER_SELF: Permission = Permission(
        permission_id=PermissionId.GET_USER_SELF,
        description="Разрешить получение своего профиля",
    )
    GET_USER_OTHER: Permission = Permission(
        permission_id=PermissionId.GET_USER_OTHER,
        description="Разрешить получение другого профиля",
        self_only=False,
    )
    CREATE_USER_OTHER: Permission = Permission(
        permission_id=PermissionId.CREATE_USER_OTHER,
        description="Разрешить создание пользователя",
        self_only=False,
    )
    UPDATE_USER_SELF: Permission = Permission(
        permission_id=PermissionId.UPDATE_USER_SELF,
        description="Разрешить пользователю редактирование своего профиля",
    )
    UPDATE_USER_OTHER: Permission = Permission(
        permission_id=PermissionId.UPDATE_USER_OTHER,
        description="Разрешить пользователю редактирование другого профиля",
        self_only=False,
    )
    GET_USER_FIO_OTHER: Permission = Permission(
        permission_id=PermissionId.UPDATE_USER_OTHER,
        description="Разрешить пользователю получение ФИО",
        self_only=False,
    )
    USER_GET_USER_ROLES_SELF: Permission = Permission(
        permission_id=PermissionId.USER_GET_USER_ROLES_SELF,
        description="Разрешить пользователю получение списка своих ролей",
    )
    USER_GET_USER_ROLES_OTHER: Permission = Permission(
        permission_id=PermissionId.USER_GET_USER_ROLES_OTHER,
        description="Разрешить пользователю получение списка ролей другого пользователя",
        self_only=False,
    )
    USER_SEARCH: Permission = Permission(
        permission_id=PermissionId.USER_SEARCH,
        description="Разрешить поиск пользователей",
        self_only=False,
    )
    #
    FORM_CREATE_SELF: Permission = Permission(
        permission_id=PermissionId.FORM_CREATE_SELF,
        description="Разрешить создание формы для себя",
    )
    FORM_CREATE_OTHER: Permission = Permission(
        permission_id=PermissionId.FORM_CREATE_OTHER,
        description="Разрешить создание формы для другого пользователя",
        self_only=False,
    )
    FORM_GET_SELF: Permission = Permission(
        permission_id=PermissionId.FORM_GET_SELF,
        description="Разрешить получение своих форм",
    )
    FORM_GET_OTHER: Permission = Permission(
        permission_id=PermissionId.FORM_GET_OTHER,
        description="Разрешить получение форм другого пользователя",
        self_only=False,
    )
    FORM_MANAGE_USER_FILES_SELF: Permission = Permission(
        permission_id=PermissionId.FORM_MANAGE_USER_FILES_SELF,
        description="Разрешить добавление файлов пользователя для собственной формы",
    )
    FORM_MANAGE_USER_FILES_OTHER: Permission = Permission(
        permission_id=PermissionId.FORM_MANAGE_USER_FILES_OTHER,
        description="Разрешить добавление файлов пользователя для формы другого пользователя",
        self_only=False,
    )
    FORM_GET_BACKOFFICE_TO_USER_FILES_SELF: Permission = Permission(
        permission_id=PermissionId.FORM_GET_BACKOFFICE_TO_USER_FILES_SELF,
        description="Разрешить получение файлов пользователя для собственной формы",
        self_only=False,
    )
    FORM_GET_BACKOFFICE_TO_USER_FILES_OTHER: Permission = Permission(
        permission_id=PermissionId.FORM_GET_BACKOFFICE_TO_USER_FILES_OTHER,
        description="Разрешить получение файлов пользователя для формы другого пользователя",
        self_only=False,
    )
    FORM_MANAGE_BACKOFFICE_FILES: Permission = Permission(
        permission_id=PermissionId.FORM_MANAGE_BACKOFFICE_FILES,
        description="Разрешить добавление файлов бэкофиса",
        self_only=False,
    )

    FORM_UPDATE_EXECUTOR: Permission = Permission(
        permission_id=PermissionId.FORM_UPDATE_EXECUTOR,
        description="Разрешить изменение исполнителя",
        self_only=False,
    )
    FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_SELF: Permission = Permission(
        permission_id=PermissionId.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_SELF,
        description="Разрешить получения доступных статусов для перехода своей формы",
    )
    FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_OTHER: Permission = Permission(
        permission_id=PermissionId.FORM_GET_AVAILABLE_STATUSES_FOR_EXECUTION_OTHER,
        description="Разрешить получения доступных статусов для перехода чужой формы",
        self_only=False,
    )
    NOTE_CREATE: Permission = Permission(
        permission_id=PermissionId.NOTE_CREATE,
        description="Разрешить создание замечания",
        self_only=False,
    )
    NOTE_RESOLVE_BY_USER_SELF: Permission = Permission(
        permission_id=PermissionId.NOTE_RESOLVE_BY_USER_SELF,
        description="Разрешить изменение статуса замечания для своей формы",
    )
    NOTE_RESOLVE_BY_USER_OTHER: Permission = Permission(
        permission_id=PermissionId.NOTE_RESOLVE_BY_USER_OTHER,
        description="Разрешить изменение статуса замечания для формы другого пользователя",
        self_only=False,
    )
    NOTE_RESOLVE_BY_BACKOFFICE_USER: Permission = Permission(
        permission_id=PermissionId.NOTE_RESOLVE_BY_BACKOFFICE_USER,
        description="Разрешить изменение статуса замечания для формы пользователем бэкофиса",
        self_only=False,
    )
    NOTE_GET_FORM_NOTES_OTHER: Permission = Permission(
        permission_id=PermissionId.NOTE_GET_FORM_NOTES_OTHER,
        description="Разрешить получение замечаний для формы другого пользователя",
        self_only=False,
    )
    NOTE_GET_FORM_NOTES_SELF: Permission = Permission(
        permission_id=PermissionId.NOTE_GET_FORM_NOTES_SELF,
        description="Разрешить получение замечания для собственной формы",
    )
    NOTE_DELETED_BY_BACKOFFICE_USER: Permission = Permission(
        permission_id=PermissionId.NOTE_DELETED_BY_BACKOFFICE_USER,
        description="Разрешить удаление замечания для формы пользователем бэкофиса",
    )
    NOTE_RENDER_TEMPLATE_SELF: Permission = Permission(
        permission_id=PermissionId.NOTE_RENDER_TEMPLATE_SELF,
        description="Разрешить получение печатного бланка замечаний для своей формы",
        self_only=True
    )
    NOTE_RENDER_TEMPLATE_OTHER: Permission = Permission(
        permission_id=PermissionId.NOTE_RENDER_TEMPLATE_OTHER,
        description="Разрешить получение печатного бланка замечаний для чужих форм",
        self_only=True
    )

    CHANGE_FORM_STATUS_SELF: Permission = Permission(
        permission_id=PermissionId.CHANGE_FORM_STATUS_SELF,
        description="Разрешить изменение статуса для формы принадлежащей пользователю",
    )

    CHANGE_FORM_STATUS_OTHER: Permission = Permission(
        permission_id=PermissionId.CHANGE_FORM_STATUS_OTHER,
        description="Разрешить изменение статуса для формы другому пользователю",
        self_only=False,
    )
    CHANGE_FORM_STATUS_BY_SYSTEM_SELF: Permission = Permission(
        permission_id=PermissionId.CHANGE_FORM_STATUS_BY_SYSTEM_SELF,
        description="Разрешить изменение статуса для формы пользователем системы",
        self_only=False,
    )
    CHANGE_FORM_STATUS_BY_SYSTEM_OTHER: Permission = Permission(
        permission_id=PermissionId.CHANGE_FORM_STATUS_BY_SYSTEM_OTHER,
        description="Разрешить изменение статуса для формы пользователем системы",
        self_only=False,
    )
    VALIDATE_FORM_SELF: Permission = Permission(
        permission_id=PermissionId.VALIDATE_FORM_SELF,
        description="Разрешить проверку формы принадлежащей пользователю",
    )
    VALIDATE_FORM_OTHER: Permission = Permission(
        permission_id=PermissionId.VALIDATE_FORM_OTHER,
        description="Разрешить проверку формы принадлежащей другому пользователю",
        self_only=False,
    )
    ADD_ROLE: Permission = Permission(
        permission_id=PermissionId.ADD_ROLE,
        description="Разрешить добавление роли",
        self_only=False,
    )
    DELETE_ROLE: Permission = Permission(
        permission_id=PermissionId.DELETE_ROLE,
        description="Разрешить удаление роли",
        self_only=False,
    )
    UPDATE_FORM_REQUEST_NUMBER: Permission = Permission(
        permission_id=PermissionId.UPDATE_FORM_REQUEST_NUMBER,
        description="Разрешить изменение номера формы",
        self_only=False,
    )

    UPDATE_FORM_SELF: Permission = Permission(
        permission_id=PermissionId.UPDATE_FORM_SELF,
        description="Разрешить изменение своей формы",
        self_only=False,
    )
    UPDATE_FORM_OTHER: Permission = Permission(
        permission_id=PermissionId.UPDATE_FORM_OTHER,
        description="Разрешить изменение чужой формы",
        self_only=False,
    )

    SIGN_REQUEST_OTHER: Permission = Permission(
        permission_id=PermissionId.SIGN_REQUEST_OTHER,
        description="Разрешить запрос подписи",
        self_only=False,
    )

    SIGN_REQUEST_SELF: Permission = Permission(
        permission_id=PermissionId.SIGN_REQUEST_SELF,
        description="Разрешить запрос своей подписи",
        self_only=True,
    )

    UPDATE_FORM_IS_PRIMARY: Permission = Permission(
        permission_id=PermissionId.UPDATE_FORM_IS_PRIMARY,
        description="Разрешить изменение первичности формы",
        self_only=False,
    )
    GET_USERS_BY_ROLES: Permission = Permission(
        permission_id=PermissionId.GET_USERS_BY_ROLES,
        description="Разрешить получение пользователей по ролям",
        self_only=False,
    )

    APPEAL_CREATE: Permission = Permission(
        permission_id=PermissionId.APPEAL_CREATE,
        description="Разрешить создание обращения пользователем",
        self_only=True
    )
    APPEAL_CREATE_USER_MESSAGE: Permission = Permission(
        permission_id=PermissionId.APPEAL_CREATE_USER_MESSAGE,
        description="Разрешить создание сообщения в обращении пользователем",
        self_only=True
    )
    APPEAL_CREATE_BACKOFFICE_MESSAGE: Permission = Permission(
        permission_id=PermissionId.APPEAL_CREATE_BACKOFFICE_MESSAGE,
        description="Разрешить создание обращения пользователем бэкофиса",
        self_only=False
    )

    APPEAL_CLOSE_SELF: Permission = Permission(
        permission_id=PermissionId.APPEAL_CLOSE_SELF,
        description="Разрешить закрытие обращения пользователем",
        self_only=True
    )
    APPEAL_CLOSE_OTHER: Permission = Permission(
        permission_id=PermissionId.APPEAL_CLOSE_OTHER,
        description="Разрешить закрытие обращений других пользователей",
        self_only=False
    )
    APPEAL_GET_USER_APPEALS_SELF: Permission = Permission(
        permission_id=PermissionId.APPEAL_GET_USER_APPEALS_SELF,
        description="Разрешить получение своих списков обращений",
        self_only=True
    )
    APPEAL_GET_USER_APPEALS_OTHER: Permission = Permission(
        permission_id=PermissionId.APPEAL_GET_USER_APPEALS_OTHER,
        description="Разрешить получение списков обращений других пользователей",
        self_only=False
    )

    FORM_GET_FORM_OWNER_USER_ID_SELF: Permission = Permission(
        permission_id=PermissionId.FORM_GET_FORM_OWNER_USER_ID_SELF,
        description="Разрешить получение id заявителя своей формы",
        self_only=True
    )
    FORM_GET_FORM_OWNER_USER_ID_OTHER: Permission = Permission(
        permission_id=PermissionId.FORM_GET_FORM_OWNER_USER_ID_OTHER,
        description="Разрешить получение id заявителя чужой формы",
        self_only=False
    )
    APPEAL_GET_OWNER_ID_SELF: Permission = Permission(
        permission_id=PermissionId.APPEAL_GET_OWNER_ID_SELF,
        description="Разрешить получение id создателя обращения, для своих обращений",
        self_only=True
    )
    APPEAL_GET_OWNER_ID_OTHER: Permission = Permission(
        permission_id=PermissionId.APPEAL_GET_OWNER_ID_OTHER,
        description="Разрешить получение id создателя обращения, для чужих обращений",
        self_only=False
    )
    APPEAL_DOWNLOAD_USER_FILES_SELF: Permission = Permission(
        permission_id=PermissionId.APPEAL_DOWNLOAD_USER_FILES_SELF,
        description="Разрешить скачивание файлов пользователя своих обращений",
        self_only=True
    )
    APPEAL_DOWNLOAD_USER_FILES_OTHER: Permission = Permission(
        permission_id=PermissionId.APPEAL_DOWNLOAD_USER_FILES_OTHER,
        description="Разрешить скачивание файлов пользователя чужих обращений",
        self_only=False
    )
    APPEAL_DOWNLOAD_BACKOFFICE_FILES_SELF: Permission = Permission(
        permission_id=PermissionId.APPEAL_DOWNLOAD_BACKOFFICE_FILES_SELF,
        description="Разрешить скачивание файлов бэкофис обращений бэкофиса",
        self_only=True
    )
    APPEAL_DOWNLOAD_BACKOFFICE_FILES_OTHER: Permission = Permission(
        permission_id=PermissionId.APPEAL_DOWNLOAD_BACKOFFICE_FILES_OTHER,
        description="Разрешить скачивание файлов бэкофис обращений бэкофиса",
        self_only=False
    )
    FORM_RENDER_TEMPLATE_SELF: Permission = Permission(
        permission_id=PermissionId.FORM_RENDER_TEMPLATE_SELF,
        description="Разрешить получение печатной формы для своей формы",
        self_only=True
    )
    FORM_RENDER_TEMPLATE_OTHER: Permission = Permission(
        permission_id=PermissionId.FORM_RENDER_TEMPLATE_OTHER,
        description="Разрешить получение печатной формы для чужих формы",
        self_only=False
    )
    RAILWAY_GET_BY_BACKOFFICE_USER: Permission = Permission(
        permission_id=PermissionId.RAILWAY_GET_BY_BACKOFFICE_USER,
        description="Разрешить получение железной дороги",
        self_only=False,
    )
    RAILWAY_UPDATE_BY_BACKOFFICE_USER: Permission = Permission(
        permission_id=PermissionId.RAILWAY_UPDATE_BY_BACKOFFICE_USER,
        description="Разрешить изменение железной дороги",
        self_only=False,
    )
    VOLTAGE_GET_LIST: Permission = Permission(
        permission_id=PermissionId.VOLTAGE_GET_LIST,
        description="Разрешить получение списка напряжений",
        self_only=False,
    )
    REGION_GET_LIST: Permission = Permission(
        permission_id=PermissionId.REGION_GET_LIST,
        description="Разрешить пользователю получение региона",
        self_only=False,
    )
    REGION_GET_BY_ID: Permission = Permission(
        permission_id=PermissionId.REGION_GET_BY_ID,
        description="Разрешить пользователю получение региона по id",
        self_only=False,
    )
    RETAIL_MARKET_ENTITY_GET_ALL: Permission = Permission(
        permission_id=PermissionId.RETAIL_MARKET_ENTITY_GET_ALL,
        description="Разрешить пользователю получение субъекта розничного рынка",
        self_only=False,
    )
    RETAIL_MARKET_ENTITY_SEARCH: Permission = Permission(
        permission_id=PermissionId.RETAIL_MARKET_ENTITY_SEARCH,
        description="Разрешить пользователю поиск субъекта розничного рынка",
        self_only=False,
    )
    RETAIL_MARKET_ENTITY_GET_BY_ID: Permission = Permission(
        permission_id=PermissionId.RETAIL_MARKET_ENTITY_GET_BY_ID,
        description="Разрешить получение субъекта розничного рынка по id",
        self_only=False,
    )
    FORM_UPDATE_RENT_AGREEMENT_1_YEAR_FIELD: Permission = Permission(
        permission_id=PermissionId.FORM_UPDATE_RENT_AGREEMENT_1_YEAR_FIELD,
        description="Разрешить пользователю изменение договора аренды ЗУ до года в форме",
        self_only=False,
    )
    FORM_UPDATE_LIVING_SPACE_IN_MKD_FIELD: Permission = Permission(
        permission_id=PermissionId.FORM_UPDATE_LIVING_SPACE_IN_MKD_FIELD,
        description="Разрешить пользователю изменение жилого помещения в МКД в форме",
        self_only=False,
    )
    FORM_GET_REVISIONS_OTHER: Permission = Permission(
        permission_id=PermissionId.FORM_GET_REVISIONS_OTHER,
        description="Разрешить пользователю просмотр ревизий чужой формы",
        self_only=False,
    )

    @classmethod
    def as_list(cls) -> list[Permission]:
        return [v for k, v in cls.__dict__.items() if isinstance(v, Permission)]
