import logging
from pathlib import Path
from dotenv import load_dotenv

from fastapi import (
    FastAPI,
    Request,
    HTTPException,
    status,
)
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from typing import Optional

from src.clients.mongo.client import MClient
from src.model import AppConfig
from src.common.common_router_models import (
    ResponseError,
    ApiResponse,
    ApiErrorCodes,
)
from src.notifications.notifications_storage import NotificationsStorage
from src.notifications.notifications_manager import NotificationManager
from src.users.users_storage import UsersStorage
from src.users.users_manager import UsersManager
from src.permissions.permissions_manager import PermissionsManager
from src.roles.roles_manager import RolesManager
from src.signs.signs_storage import SignsStorage
from src.signs.signs_manager import SignsManager
from src.deals.deals_storage import DealsStorage
from src.deals.deals_manager import DealsManager
from src.buyers.buyers_storage import BuyersStorage
from src.buyers.buyers_manager import BuyersManager
from src.authorization.authorization_router import router as authorization_router
from src.users.users_router import router as users_router
from src.signs.signs_router import router as signs_router
from src.deals.deals_router import router as deals_router
from src.buyers.buyers_router import router as buyers_router


# Загружаем переменные окружения из local.env перед созданием конфигурации
try:
    env_file = Path(__file__).parent.parent.parent / "local.env"
    if env_file.exists():
        load_dotenv(
            env_file,
            override=False,
        )
        _LOG = logging.getLogger("uvicorn")
        _LOG.info(f"Loaded environment variables from {env_file}")
except ImportError:
    pass
except Exception as e:
    _LOG = logging.getLogger("uvicorn")
    _LOG.warning(f"Failed to load .env file: {e}")


_LOG = logging.getLogger("uvicorn")

APP_CONFIG = AppConfig()
MONGO_CLIENT = None
if APP_CONFIG.mongo_config and APP_CONFIG.mongo_config.db_name:
    try:
        MONGO_CLIENT = MClient(APP_CONFIG.mongo_config)
        _LOG.info(f"MongoDB client created successfully. DB: {APP_CONFIG.mongo_config.db_name}")
    except Exception as e:
        _LOG.error(f"Failed to create MongoDB client: {e}")
else:
    _LOG.warning(
        f"MongoDB client not created. "
        f"mongo_config: {APP_CONFIG.mongo_config is not None}, "
        f"db_name: {APP_CONFIG.mongo_config.db_name if APP_CONFIG.mongo_config else 'N/A'}"
    )

app = FastAPI()


@app.on_event("startup")
async def startup():
    # FIXME: add create indexes for each storage if required
    # FIXME: on_event is deprecated, use lifespan event handlers instead.
    #  Read more about it in the
    #  [FastAPI docs for Lifespan Events](https:// fastapi. tiangolo. com/ advanced/ events/).
    if MONGO_CLIENT:
        notifications_storage = NotificationsStorage(MONGO_CLIENT)
        users_storage = UsersStorage(MONGO_CLIENT)
        notifications_manager = NotificationManager(
            notifications_storage,
            users_storage,
        )
        permissions_manager = PermissionsManager(users_storage)
        users_manager = UsersManager(
            users_storage,
            notifications_manager,
            permissions_manager,
        )

        await users_manager.create_system_users()


def setup_app(
    app_instance: FastAPI,
    app_config: AppConfig,
    mongo_client: Optional[MClient],
):
    app_instance.state.config = app_config
    app_instance.state.mongo_client = mongo_client
    
    if mongo_client:
        try:
            users_storage = UsersStorage(mongo_client)
            notifications_storage = NotificationsStorage(mongo_client)
            signs_storage = SignsStorage(mongo_client)
            deals_storage = DealsStorage(mongo_client)
            buyers_storage = BuyersStorage(mongo_client)

            notifications_manager = NotificationManager(
                notifications_storage,
                users_storage,
            )
            roles_manager = RolesManager(users_storage=users_storage)
            permissions_manager = PermissionsManager(users_storage=users_storage)
            users_manager = UsersManager(
                users_storage,
                notifications_manager,
                permissions_manager,
            )
            signs_manager = SignsManager(
                signs_storage=signs_storage,
                notification_manager=notifications_manager,
                users_storage=users_storage,
            )
            deals_manager = DealsManager(
                deals_storage=deals_storage,
                users_storage=users_storage,
                permissions_manager=permissions_manager,
            )
            buyers_manager = BuyersManager(
                buyers_storage=buyers_storage,
                users_storage=users_storage,
                permissions_manager=permissions_manager,
            )

            app_instance.state.users_manager = users_manager
            app_instance.state.signs_manager = signs_manager
            app_instance.state.deals_manager = deals_manager
            app_instance.state.buyers_manager = buyers_manager
            _LOG.info("Managers initialized successfully")
        except Exception as e:
            _LOG.error(f"Failed to initialize managers: {e}")
            raise
    else:
        error_msg = (
            "MongoDB client is not available. "
            "Please check MongoDB configuration in local.env file.\n"
            f"Current config: mongo_config={app_config.mongo_config is not None}, "
            f"db_name={app_config.mongo_config.db_name if app_config.mongo_config else 'N/A'}, "
            f"host={app_config.mongo_config.host if app_config.mongo_config else 'N/A'}"
        )
        _LOG.error(error_msg)
        raise RuntimeError(error_msg)

    origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:8081",
        "https://localhost:3000",
        "https://localhost:3001",
        "https://localhost:5173",
        "https://localhost:8081",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8081",
    ]

    app_instance.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=[
            "GET",
            "POST",
            "PATCH",
            "HEAD",
            "OPTIONS",
            "PUT",
            "DELETE",
        ],
        allow_headers=[
            "Access-Control-Allow-Headers",
            "Content-Type",
            "Content-Disposition",
            "Authorization",
            "Access-Control-Allow-Origin",
            "Set-Cookie",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Expose-Headers",
        ],
    )

    # app_instance.add_middleware(ApidocBasicAuthMiddleware)  # noqa
    # app_instance.add_middleware(RequestTimeMiddleware, stage="dev")

    app_instance.include_router(authorization_router)
    app_instance.include_router(users_router)
    app_instance.include_router(signs_router)
    app_instance.include_router(deals_router)
    app_instance.include_router(buyers_router)


setup_app(
    app,
    APP_CONFIG,
    MONGO_CLIENT,
)


@app.exception_handler(HTTPException)
async def exception_handler(
    request: Request,
    exc: HTTPException,
):
    _LOG.error(exc)
    error = ResponseError(
        code=ApiErrorCodes.BASE_EXCEPTION,
        text=str(exc.with_traceback(None)),
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse.error_response(
            errors=[error],
            message_text=exc.detail,
        ).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    _LOG.error(exc)
    errors = []
    for error in exc.errors():
        text = f"({error['type']}) {error['msg']}."
        if "ctx" in error:
            text += f" Context: {error['ctx']['error']}"
        e = ResponseError(
            code=ApiErrorCodes.BASE_EXCEPTION,
            text=text,
            field=".".join([str(i) for i in error["loc"]]) if "loc" in error else None,
        )
        errors.append(e)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ApiResponse.error_response(
            errors=errors,
            message_text="RequestValidationError",
        ).model_dump(),
    )
