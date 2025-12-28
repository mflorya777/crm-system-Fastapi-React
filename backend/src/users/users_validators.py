from src.users.users_router_models import ChangeUserInfoParams
from src.common.common_router_models import ResponseError


class UserInfoValidator:
    @classmethod
    def validate(cls, user_info_params: ChangeUserInfoParams) -> list[ResponseError]:
        return []
