from pydantic import (
    BaseModel,
    Field,
    EmailStr,
)


class CreateUserParams(BaseModel):
    name: str = Field(...)
    soname: str = Field(...)
    father_name: str = Field(...)
    phone: str
    email: str
    password: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Василий",
                "soname": "Пупкин",
                "father_name": "Васильевич",
                "phone": "+79993334455",
                "email": "a@a.a",
                "password": "<PASSWORD>",
            },
        }


class ApproveRegistrationCodeParams(BaseModel):
    code: str = Field(max_length=4, min_length=4)


class LoginWithEmailParams(BaseModel):
    email: EmailStr = Field(...)
    password: str = Field(...)


class LoginWithPhoneParams(BaseModel):
    phone: str = Field(...)
    password: str = Field(...)