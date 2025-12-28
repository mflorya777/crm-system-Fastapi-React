import datetime as dt
from typing import Optional
from uuid import (
    UUID,
    uuid4,
)

from pydantic import (
    BaseModel,
    Field,
    EmailStr,
)

from src.misc.misc_lib import utc_now
from src.roles.roles_manager_models import UserRoleId


class UserToCreate(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    roles: list[UserRoleId]
    created_at: dt.datetime = Field(default_factory=utc_now)
    created_by: UUID | None = Field(...)
    updated_at: dt.datetime | None = Field(default=None)
    updated_by: UUID | None = Field(default=None)
    revision: int = Field(default=1)
    #
    name: str = Field(...)
    soname: str = Field(...)
    father_name: str = Field(...)
    phone: str = Field(...)
    email: EmailStr = Field(...)
    user_created_at: dt.datetime = Field(default_factory=utc_now)
    password_hash: str = Field()
    #
    email_approve_code: Optional[str] = Field(default=None)
    email_approve_code_sent_at: Optional[dt.datetime] = Field(default=None)
    email_approved_at: Optional[dt.datetime] = Field(default=None)
    is_email_approved: bool = Field(default=False)
    #
    phone_approve_code: Optional[str] = Field(default=None)
    phone_approve_code_sent_at: Optional[dt.datetime] = Field(default=None)
    phone_approved_at: Optional[dt.datetime] = Field(default=None)
    is_phone_approved: bool = Field(default=False)
    is_present: bool = Field(default=True)

    @property
    def is_backoffice_user(self) -> bool:
        for role in self.roles:
            if role != UserRoleId.COMMON_USER and role != UserRoleId.ANY:
                return True
        return False


class UserToGet(BaseModel):
    id: UUID = Field(...)
    roles: list[UserRoleId]
    name: str = Field(...)
    soname: str = Field(...)
    father_name: str = Field(...)
    phone: str = Field(...)
    email: EmailStr = Field(...)
    user_created_at: dt.datetime = Field(...)
    #
    is_email_approved: bool = Field(default=False)
    #
    is_phone_approved: bool = Field(default=False)
    is_present: bool = Field(default=True)

    @property
    def is_backoffice_user(self) -> bool:
        for role in self.roles:
            if role != UserRoleId.COMMON_USER and role != UserRoleId.ANY:
                return True
        return False
