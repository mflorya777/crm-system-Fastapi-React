from enum import Enum
from typing import Optional

from pydantic import BaseModel


class DepartmentId(str, Enum):
    CLIENT_DEPARTMENT = "CLIENT_DEPARTMENT"
    TECHNICAL_DEPARTMENT = "TECHNICAL_DEPARTMENT"
    TARIFF_DEPARTMENT = "TARIFF_DEPARTMENT"
    CONTRACT_DEPARTMENT = "CONTRACT_DEPARTMENT"


class Department(BaseModel):
    department_id: DepartmentId
    description: Optional[str] = None


class UserPositionId(str, Enum):
    COMMON_USER = "COMMON_USER"
    HEAD_OF_DEPARTMENT = "HEAD_OF_DEPARTMENT"
    EXECUTOR = "EXECUTOR"
    ADMIN = "ADMIN"
    SYSTEM_USER = "SYSTEM_USER"


class UserPosition(BaseModel):
    role_id: UserPositionId
    description: Optional[str] = None
