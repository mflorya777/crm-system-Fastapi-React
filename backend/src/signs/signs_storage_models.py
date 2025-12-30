import datetime as dt

from pydantic import (
    BaseModel,
    Field,
)
from uuid import (
    UUID,
    uuid4,
)
from src.misc.misc_lib import (
    utc_now,
    generate_random_approve_code,
)


DEFAULT_SIGN_TTL_SEC = 60 * 5


def default_ttl_expires() -> dt.datetime:
    return utc_now() + dt.timedelta(seconds=DEFAULT_SIGN_TTL_SEC)


class SignToCreate(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    code: str = Field(default_factory=generate_random_approve_code)
    entity_id: UUID
    entity_type: str
    requested_by_id: UUID
    used_at: dt.datetime | None = None
    used_by_id: UUID | None = None
    is_used: bool = False
    ttl_expire_at: dt.datetime = Field(default_factory=default_ttl_expires)
    requested_at: dt.datetime = Field(default_factory=utc_now)
