from src.model import AppConfig
from src.roles.roles_manager_models import UserRoleId
from src.sec.password import hash_password
from src.users.users_storage_models import UserToCreate


APP_CONFIG = AppConfig()

system_user_id = APP_CONFIG.system_user_id

USERS = {
        UserRoleId.SYSTEM_USER: UserToCreate(
            id=system_user_id,
            created_by=system_user_id,
            updated_by=system_user_id,
            roles=[UserRoleId.SYSTEM_USER,],
            name="System",
            soname="System",
            father_name="System",
            phone="+79999991010",
            email="system@rzd.energy",
            password_hash=hash_password("12345678"),
        ),
    }
