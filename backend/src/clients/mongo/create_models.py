import datetime as dt
from typing import Optional
from uuid import UUID

from pydantic import (
    BaseModel,
    EmailStr,
)


class NotFoundError(Exception):
    pass


class EmailApproveData(BaseModel):
    id: UUID
    email: EmailStr
    email_approve_code: Optional[str]
    email_approve_code_sent_at: Optional[dt.datetime]
    email_approved_at: Optional[dt.datetime]
    is_email_approved: bool


class PhoneApproveData(BaseModel):
    id: UUID
    phone: str
    phone_approved_at: Optional[dt.datetime]
    phone_approve_code_sent_at: Optional[dt.datetime]
    is_phone_approved: bool
    phone_approve_code: Optional[str]


class PasswordHashData(BaseModel):
    id: UUID
    password_hash: str
