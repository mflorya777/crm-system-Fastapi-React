import datetime as dt
from enum import Enum
from typing import Optional
from uuid import (
    UUID,
    uuid4,
)

from pydantic import (
    BaseModel,
    Field,
)

from src.misc.misc_lib import utc_now


class NotificationMessageType(str, Enum):
    APPROVE_CONTACT = "approve_contact"
    SIGN_FORM = "sing_form"
    CHANGED_DOCUMENT_STATUS = "changed_document_status"
    UNRESOLVED_NOTES_NOTIFICATION = "unresolved_notes_notification"
    NEW_APPEAL = "new_appeal"
    APPEAL_RESOLVED = "appeal_resolved"
    UPDATE_CLIENT_DEPARTMEN_EXECUTOR = "update_client_department_executor"


class NotificationMessageChannel(str, Enum):
    SMS = "sms"
    EMAIL = "email"


class NotificationMessageToCreate(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID = Field(...)
    entity_id: UUID = Field(...)
    entity_type: str = Field(...)
    message_type: NotificationMessageType = Field(...)
    message_channel: NotificationMessageChannel = Field(...)
    destination_address: str = Field(...)
    #
    body: str = Field(...)
    created_at: dt.datetime = Field(default_factory=utc_now)
    #
    sent_at: Optional[dt.datetime] = Field(default=None)
    performed_attempts: int = Field(default=0)
    last_attempt_at: Optional[dt.datetime] = Field(default=None)
    max_attempts: int = Field(...)
    ttl_expires_at: dt.datetime = Field(...)
    #
    errors: list[dict] = Field(default=[])
