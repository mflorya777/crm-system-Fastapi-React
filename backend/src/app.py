import logging

from fastapi import (
    FastAPI,
    Request,
    HTTPException,
    status,
)
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.common.common_router_models import (
    ResponseError,
    ApiResponse,
    ApiErrorCodes,
)

from typing import Optional

from src.clients.mongo.client import MClient
from src.model import AppConfig


_LOG = logging.getLogger("uvicorn")
APP_CONFIG = AppConfig()
MONGO_CLIENT = None
if APP_CONFIG.mongo_config and APP_CONFIG.mongo_config.db_name:
    MONGO_CLIENT = MClient(APP_CONFIG.mongo_config)

app = FastAPI()


@app.on_event("startup")
async def startup():
    # FIXME: add create indexes for each storage if required
    # FIXME: on_event is deprecated, use lifespan event handlers instead.
    #  Read more about it in the
    #  [FastAPI docs for Lifespan Events](https:// fastapi. tiangolo. com/ advanced/ events/).
    # forms_storage = FormsStorage(MONGO_CLIENT, PORTAL_PG_CLIENT)
    # notes_storage = NotesStorage(MONGO_CLIENT)
    # notifications_storage = NotificationsStorage(MONGO_CLIENT)
    # users_storage = UsersStorage(MONGO_CLIENT)
    # notifications_manager = NotificationManager(
    #     notifications_storage,
    #     users_storage,
    #     forms_storage,
    #     notes_storage,
    # )
    # permissions_manager = PermissionsManager(users_storage)
    # appeals_storage = AppealsStorage(
    #     MONGO_CLIENT,
    #     APP_CONFIG.files_storage_directory_path,
    # )
    # forms_storage = FormsStorage(MONGO_CLIENT, PORTAL_PG_CLIENT)
    # users_manager = UsersManager(
    #     users_storage,
    #     notifications_manager,
    #     permissions_manager,
    # )

    # await appeals_storage.create_indexes()
    # await appeals_storage.create_files_storage_folder()
    # await forms_storage.create_indexes()
    # await users_manager.create_system_users()
    pass


def setup_app(
    app_instance: FastAPI,
    app_config: AppConfig,
    mongo_client: Optional[MClient],
):
    app_instance.state.config = app_config
    app_instance.state.mongo_client = mongo_client
    # users_storage = UsersStorage(mongo_client)
    # notifications_storage = NotificationsStorage(mongo_client)
    # forms_storage = FormsStorage(mongo_client)
    # signs_storage = SignsStorage(mongo_client)
    # notes_storage = NotesStorage(mongo_client)
    # appeals_storage = AppealsStorage(
    #     mongo_client,
    #     files_storage_directory_path=app_config.files_storage_directory_path,
    # )

    # notifications_manager = NotificationManager(
    #     notifications_storage,
    #     users_storage,
    #     forms_storage,
    #     notes_storage,
    # )
    # roles_manager = RolesManager(users_storage=users_storage)
    # permissions_manager = PermissionsManager(users_storage=users_storage)
    # users_manager = UsersManager(
    #     users_storage,
    #     notifications_manager,
    #     permissions_manager,
    # )
    # signs_manager = SignsManager(
    #     signs_storage=signs_storage,
    #     notification_manager=notifications_manager,
    #     users_storage=users_storage,
    #     forms_storage=forms_storage,
    # )
    # notes_manager = NotesManager(
    #     notes_storage,
    #     users_storage,
    #     users_manager,
    #     permissions_manager,
    # )
    # forms_manager = FormsManager(
    #     forms_storage=forms_storage,
    #     files_storage_directory_path=app_config.files_storage_directory_path,
    #     signs_manager=signs_manager,
    #     users_storage=users_storage,
    #     permissions_manager=permissions_manager,
    #     notifications_manager=notifications_manager,
    #     notes_manager=notes_manager,
    #     notes_storage=notes_storage,
    # )

    # appeals_manager = AppealsManager(
    #     signs_manager=signs_manager,
    #     appeals_storage=appeals_storage,
    #     files_storage_directory_path=app_config.files_storage_directory_path,
    #     permissions_manager=permissions_manager,
    #     notifications_manager=notifications_manager,
    #     forms_manager=forms_manager,
    #     users_manager=users_manager,
    # )

    # app_instance.state.users_manager = users_manager
    # app_instance.state.forms_manager = forms_manager
    # app_instance.state.notes_manager = notes_manager
    # app_instance.state.signs_manager = signs_manager
    # app_instance.state.appeals_manager = appeals_manager

    origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8081",
        "https://localhost:3000",
        "https://localhost:3001",
        "https://localhost:8081",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:8081",
    ]

    app_instance.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=[
            "GET",
            "POST",
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

    # app_instance.include_router(authorization_router)
    # app_instance.include_router(misc_router)
    # app_instance.include_router(users_router)
    # app_instance.include_router(forms_router)
    # app_instance.include_router(forms_common_router)
    # app_instance.include_router(notes_router)
    # app_instance.include_router(appeals_router)


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
