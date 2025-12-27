from enum import Enum
from typing import (
    Any,
    Optional,
)

from pydantic import BaseModel


class ApiErrorCodes(Enum):
    BASE_EXCEPTION = 0
    EMAIL_VALIDATION_ERROR = 1
    PHONE_VALIDATION_ERROR = 2
    EMAIL_ALREADY_EXISTS_ERROR = 3
    PHONE_ALREADY_EXISTS_ERROR = 4
    USER_CREATION_ERROR = 5
    USER_NOT_FOUND_ERROR = 6
    AUTHENTICATION_ERROR = 7
    USER_BASE_ERROR = 8
    VALIDATION_ERROR = 9
    FORMS_STORAGE_ERROR = 10
    FORMS_MANAGER_ERROR = 11
    NOTES_STORAGE_ERROR = 12
    NOTES_MANAGER_ERROR = 13
    API_GENERAL_ERROR = 14
    NOTIFICATIONS_MANAGER_ERROR = 15


class ResponseError(BaseModel):
    code: int
    text: str
    field: str | None = None
    field_description: str | None = None


class ResponseMessage(BaseModel):
    text: str = ""
    errors: list[ResponseError] = []


class ApiResponse(BaseModel):
    status: bool
    data: Any | dict = {}
    message: ResponseMessage = ResponseMessage()

    @classmethod
    def success_response(
        cls,
        data: Optional[Any] = None,
        message_text: Optional[str] = "",
    ) -> "ApiResponse":
        response_message = ResponseMessage(text=message_text)
        if data is not None:
            d = data
        else:
            d = {}
        return cls(
            status=True,
            data=d,
            message=response_message,
        )

    @classmethod
    def error_response(
        cls,
        errors: list[ResponseError],
        message_text: Optional[str] = "",
    ) -> "ApiResponse":
        response_message = ResponseMessage(
            text=message_text,
            errors=errors,
        )
        return cls(
            status=False,
            message=response_message,
        )
