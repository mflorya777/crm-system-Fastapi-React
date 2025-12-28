import datetime as dt
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
    EmailStr,
)
from src.users.users_storage_models import (
    UserToCreate,
    UserToGet,
)
from src.common.common_router_models import ApiResponse


class UserResponse(BaseModel):
    id: UUID = Field(...)
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
    #
    is_backoffice_user: bool = Field(default=False)

    @classmethod
    def from_user(cls, user: UserToGet | UserToCreate):
        return cls(
            id=user.id,
            name=user.name,
            soname=user.soname,
            father_name=user.father_name,
            phone=user.phone,
            email=user.email,
            user_created_at=user.user_created_at,
            is_email_approved=user.is_email_approved,
            is_phone_approved=user.is_phone_approved,
            is_backoffice_user=user.is_backoffice_user,
        )


class UserApiResponse(ApiResponse):
    data: UserResponse | dict = Field(default={})


class ChangeEmailParams(BaseModel):
    email: EmailStr = Field(...)


class ChangePhoneParams(BaseModel):
    phone: str = Field(...)


class ChangeUserInfoParams(BaseModel):
    name: str = Field(...)
    soname: str = Field(...)
    father_name: str = Field(...)


class ChangeUserPasswordParams(BaseModel):
    new_password: str = Field(...)
    old_password: str = Field(...)
