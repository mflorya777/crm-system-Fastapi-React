import logging
from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import (
    APIRouter,
    Body,
    Depends,
    Request,
    Query,
    Path,
)
from src.auth.auth_cookie import CookieAuthMiddleware
from src.common.common_router_models import (
    ResponseError,
    ApiErrorCodes,
    ApiResponse,
)
from ..integrations_manager import (
    IntegrationsManager,
    IntegrationsManagerError,
    NoSuchIntegrationManagerError,
)
from ..integrations_storage_models import IntegrationType
from .zoom_manager import (
    ZoomManager,
    ZoomManagerError,
)
from .zoom_router_models import (
    CreateZoomIntegrationParams,
    UpdateZoomIntegrationParams,
    ZoomIntegrationResponse,
    ZoomIntegrationApiResponse,
    TestConnectionResponse,
    TestConnectionApiResponse,
    CreateMeetingApiParams,
    CreateMeetingApiResponse,
    UpdateMeetingApiParams,
    GetMeetingApiResponse,
    ListMeetingsApiParams,
    ListMeetingsApiResponse,
    GetParticipantsApiParams,
    GetParticipantsApiResponse,
    GetRecordingsApiParams,
    GetRecordingsApiResponse,
)
from .zoom_models import (
    CreateMeetingParams,
    UpdateMeetingParams,
    MeetingListParams,
    ZoomMeetingSettings,
)


_LOG = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/integrations/zoom",
    tags=["Zoom Integration"],
)


@router.post(
    "/",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def create_zoom_integration(
    request: Request,
    params: CreateZoomIntegrationParams = Body(...),
) -> ApiResponse:
    """Создать интеграцию Zoom"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    user_id = request.state.jwt_payload["user_id"]
    
    errors = []
    try:
        config = {
            "account_id": params.account_id,
            "client_id": params.client_id,
            "client_secret": params.client_secret,
        }
        
        integration = await integrations_manager.create_integration(
            integration_type=IntegrationType.ZOOM,
            name=params.name,
            config=config,
            created_by=user_id,
            is_active=params.is_active,
        )
        
        return ApiResponse.success_response(
            data={"integration_id": str(integration.id)},
            message_text="Zoom integration created successfully",
        )
    except IntegrationsManagerError as e:
        _LOG.error(f"Error creating Zoom integration: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to create Zoom integration",
        )


@router.get(
    "/",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_zoom_integration(
    request: Request,
) -> ApiResponse:
    """Получить активную интеграцию Zoom"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    
    errors = []
    try:
        integration = await integrations_manager.get_active_integration(IntegrationType.ZOOM)
        
        if not integration:
            return ApiResponse.success_response(
                data=None,
                message_text="No active Zoom integration found",
            )
        
        response_data = ZoomIntegrationResponse(
            id=integration.id,
            type=integration.type,
            name=integration.name,
            is_active=integration.is_active,
            created_at=integration.created_at,
            updated_at=integration.updated_at,
        )
        
        return ApiResponse.success_response(
            data=response_data.dict(),
            message_text="Zoom integration retrieved successfully",
        )
    except IntegrationsManagerError as e:
        _LOG.error(f"Error getting Zoom integration: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to get Zoom integration",
        )


@router.patch(
    "/",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def update_zoom_integration_no_id(
    request: Request,
    params: UpdateZoomIntegrationParams = Body(...),
) -> ApiResponse:
    """Обновить активную интеграцию Zoom (без указания ID)"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    user_id = request.state.jwt_payload["user_id"]
    
    _LOG.info(f"Update Zoom integration request: name={params.name}, has_account_id={params.account_id is not None}, has_client_id={params.client_id is not None}, has_client_secret={params.client_secret is not None}")
    
    errors = []
    try:
        # Получаем активную интеграцию (или любую, если активной нет)
        integration = await integrations_manager.get_active_integration(IntegrationType.ZOOM)
        
        # Если активной нет, попробуем найти любую интеграцию Zoom
        if not integration:
            _LOG.warning("No active Zoom integration found, trying to find any Zoom integration")
            all_integrations = await integrations_manager.get_integrations_by_type(
                IntegrationType.ZOOM,
                active_only=False,
            )
            if not all_integrations:
                # Если интеграции вообще нет, создаем новую
                _LOG.info("No Zoom integration found, creating new one")
                
                # Проверяем, что есть хотя бы один из обязательных параметров
                if not params.account_id and not params.client_id and not params.client_secret:
                    errors.append(
                        ResponseError(
                            code=ApiErrorCodes.BASE_EXCEPTION,
                            text="Cannot create integration: no credentials provided (account_id, client_id, or client_secret required)",
                        )
                    )
                    return ApiResponse.error_response(
                        errors=errors,
                        message_text="Cannot create integration without credentials",
                    )
                
                # Собираем конфиг из переданных параметров
                config = {}
                if params.account_id:
                    config["account_id"] = params.account_id
                if params.client_id:
                    config["client_id"] = params.client_id
                if params.client_secret:
                    config["client_secret"] = params.client_secret
                
                _LOG.info(f"Creating Zoom integration with config keys: {list(config.keys())}")
                
                new_integration = await integrations_manager.create_integration(
                    integration_type=IntegrationType.ZOOM,
                    name=params.name or "Zoom Integration",
                    config=config,
                    created_by=user_id,
                    is_active=True,
                )
                _LOG.info(f"Created new Zoom integration: ID={new_integration.id}, Name={new_integration.name}, is_active={new_integration.is_active}")
                return ApiResponse.success_response(
                    data={"integration_id": str(new_integration.id)},
                    message_text="Zoom integration created successfully",
                )
            # Используем первую найденную интеграцию
            integration = all_integrations[0]
            _LOG.info(f"Using Zoom integration (not active): ID={integration.id}, Name={integration.name}, is_active={integration.is_active}")
        
        # Обновляем интеграцию
        return await update_zoom_integration_internal(
            request,
            integration.id,
            params,
            user_id,
        )
    except IntegrationsManagerError as e:
        _LOG.error(f"Error getting active integration: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to update Zoom integration",
        )


@router.patch(
    "/{integration_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def update_zoom_integration(
    request: Request,
    integration_id: UUID = Path(...),
    params: UpdateZoomIntegrationParams = Body(...),
) -> ApiResponse:
    """Обновить интеграцию Zoom"""
    user_id = request.state.jwt_payload["user_id"]
    return await update_zoom_integration_internal(
        request,
        integration_id,
        params,
        user_id,
    )


async def update_zoom_integration_internal(
    request: Request,
    integration_id: UUID,
    params: UpdateZoomIntegrationParams,
    user_id: UUID,
) -> ApiResponse:
    """Внутренняя функция для обновления интеграции Zoom"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    
    errors = []
    try:
        config = {}
        if params.account_id is not None:
            config["account_id"] = params.account_id
        if params.client_id is not None:
            config["client_id"] = params.client_id
        if params.client_secret is not None:
            config["client_secret"] = params.client_secret
        
        update_config = config if config else None
        
        # Если is_active не указан, но есть обновление конфига, убедимся что интеграция активна
        is_active = params.is_active
        if is_active is None:
            # Если is_active не указан, проверяем текущее значение
            try:
                current_integration = await integrations_manager.get_integration(integration_id)
                # Если обновляем конфиг, делаем интеграцию активной (если она еще не активна)
                if update_config and not current_integration.is_active:
                    is_active = True
                    _LOG.info(f"Setting is_active=True for integration {integration_id} (config updated)")
                else:
                    # Сохраняем текущее значение
                    is_active = current_integration.is_active if current_integration.is_active is not None else True
                    _LOG.info(f"Keeping is_active={is_active} for integration {integration_id}")
            except Exception as e:
                # Если не можем получить текущую интеграцию, делаем активной
                is_active = True
                _LOG.warning(f"Could not get current integration, setting is_active=True: {e}")
        
        _LOG.info(f"Updating Zoom integration {integration_id}: name={params.name}, is_active={is_active}, has_config={update_config is not None}")
        
        integration = await integrations_manager.update_integration(
            integration_id=integration_id,
            name=params.name,
            is_active=is_active,
            config=update_config,
            updated_by=user_id,
        )
        
        return ApiResponse.success_response(
            data={"integration_id": str(integration.id)},
            message_text="Zoom integration updated successfully",
        )
    except NoSuchIntegrationManagerError as e:
        _LOG.error(f"Integration not found: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Zoom integration not found",
        )
    except IntegrationsManagerError as e:
        _LOG.error(f"Error updating Zoom integration: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to update Zoom integration",
        )


@router.post(
    "/test-connection",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def test_zoom_connection(
    request: Request,
) -> ApiResponse:
    """Проверить соединение с Zoom API"""
    zoom_manager: ZoomManager = request.app.state.zoom_manager
    
    errors = []
    try:
        success = await zoom_manager.test_connection()
        
        response_data = TestConnectionResponse(
            success=success,
            message="Connection successful" if success else "Connection failed",
        )
        
        return ApiResponse.success_response(
            data=response_data.dict(),
            message_text="Connection test completed",
        )
    except ZoomManagerError as e:
        error_message = str(e)
        _LOG.error(f"Error testing Zoom connection: {e}", exc_info=True)
        
        # Более детальное сообщение об ошибке
        if "No active Zoom integration found" in error_message:
            error_message = "Интеграция Zoom не настроена. Пожалуйста, сначала создайте интеграцию."
        elif "Failed to get access token" in error_message:
            error_message = f"Ошибка аутентификации Zoom: {error_message}. Проверьте правильность Account ID, Client ID и Client Secret."
        elif "Connection test failed" in error_message:
            error_message = f"Не удалось подключиться к Zoom API: {error_message}"
        
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=error_message,
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to test connection",
        )


@router.post(
    "/meetings",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def create_meeting(
    request: Request,
    params: CreateMeetingApiParams = Body(...),
) -> ApiResponse:
    """Создать встречу Zoom"""
    zoom_manager: ZoomManager = request.app.state.zoom_manager
    
    errors = []
    try:
        # Преобразуем API параметры в параметры модели
        start_time = None
        if params.start_time:
            start_time = datetime.fromisoformat(params.start_time.replace('Z', '+00:00'))
        
        settings = None
        if any([
            params.host_video is not None,
            params.participant_video is not None,
            params.join_before_host is not None,
            params.mute_upon_entry is not None,
            params.waiting_room is not None,
            params.auto_recording is not None,
        ]):
            settings = ZoomMeetingSettings(
                host_video=params.host_video,
                participant_video=params.participant_video,
                join_before_host=params.join_before_host,
                mute_upon_entry=params.mute_upon_entry,
                waiting_room=params.waiting_room,
                auto_recording=params.auto_recording,
            )
        
        create_params = CreateMeetingParams(
            topic=params.topic,
            type=params.type,
            start_time=start_time,
            duration=params.duration,
            timezone=params.timezone,
            password=params.password,
            agenda=params.agenda,
            settings=settings,
            user_id=params.user_id,
        )
        
        meeting = await zoom_manager.create_meeting(create_params)
        
        return ApiResponse.success_response(
            data=meeting.dict(),
            message_text="Meeting created successfully",
        )
    except ZoomManagerError as e:
        _LOG.error(f"Error creating meeting: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to create meeting",
        )


@router.get(
    "/meetings/{meeting_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_meeting(
    request: Request,
    meeting_id: str = Path(...),
) -> ApiResponse:
    """Получить информацию о встрече"""
    zoom_manager: ZoomManager = request.app.state.zoom_manager
    
    errors = []
    try:
        meeting = await zoom_manager.get_meeting(meeting_id)
        
        return ApiResponse.success_response(
            data=meeting.dict(),
            message_text="Meeting retrieved successfully",
        )
    except ZoomManagerError as e:
        _LOG.error(f"Error getting meeting: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to get meeting",
        )


@router.patch(
    "/meetings/{meeting_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def update_meeting(
    request: Request,
    meeting_id: str = Path(...),
    params: UpdateMeetingApiParams = Body(...),
) -> ApiResponse:
    """Обновить встречу"""
    zoom_manager: ZoomManager = request.app.state.zoom_manager
    
    errors = []
    try:
        start_time = None
        if params.start_time:
            start_time = datetime.fromisoformat(params.start_time.replace('Z', '+00:00'))
        
        settings = None
        if any([
            params.host_video is not None,
            params.participant_video is not None,
            params.join_before_host is not None,
            params.mute_upon_entry is not None,
            params.waiting_room is not None,
            params.auto_recording is not None,
        ]):
            settings = ZoomMeetingSettings(
                host_video=params.host_video,
                participant_video=params.participant_video,
                join_before_host=params.join_before_host,
                mute_upon_entry=params.mute_upon_entry,
                waiting_room=params.waiting_room,
                auto_recording=params.auto_recording,
            )
        
        update_params = UpdateMeetingParams(
            topic=params.topic,
            type=params.type,
            start_time=start_time,
            duration=params.duration,
            timezone=params.timezone,
            password=params.password,
            agenda=params.agenda,
            settings=settings,
        )
        
        await zoom_manager.update_meeting(meeting_id, update_params)
        
        return ApiResponse.success_response(
            data=None,
            message_text="Meeting updated successfully",
        )
    except ZoomManagerError as e:
        _LOG.error(f"Error updating meeting: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to update meeting",
        )


@router.delete(
    "/meetings/{meeting_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def delete_meeting(
    request: Request,
    meeting_id: str = Path(...),
) -> ApiResponse:
    """Удалить встречу"""
    zoom_manager: ZoomManager = request.app.state.zoom_manager
    
    errors = []
    try:
        await zoom_manager.delete_meeting(meeting_id)
        
        return ApiResponse.success_response(
            data=None,
            message_text="Meeting deleted successfully",
        )
    except ZoomManagerError as e:
        _LOG.error(f"Error deleting meeting: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to delete meeting",
        )


@router.get(
    "/meetings",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def list_meetings(
    request: Request,
    user_id: Optional[str] = Query(default="me", description="ID пользователя Zoom"),
    type: Optional[str] = Query(default="live", description="Тип встреч"),
    page_size: int = Query(default=30, description="Количество результатов на странице"),
    next_page_token: Optional[str] = Query(default=None, description="Токен для следующей страницы"),
) -> ApiResponse:
    """Получить список встреч"""
    zoom_manager: ZoomManager = request.app.state.zoom_manager
    
    errors = []
    try:
        params = MeetingListParams(
            user_id=user_id,
            type=type,
            page_size=page_size,
            next_page_token=next_page_token,
        )
        
        result = await zoom_manager.list_meetings(params)
        
        return ApiResponse.success_response(
            data=result.dict(),
            message_text="Meetings retrieved successfully",
        )
    except ZoomManagerError as e:
        _LOG.error(f"Error listing meetings: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to list meetings",
        )


@router.get(
    "/meetings/{meeting_id}/participants",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_meeting_participants(
    request: Request,
    meeting_id: str = Path(...),
    page_size: int = Query(default=30, description="Количество результатов на странице"),
    next_page_token: Optional[str] = Query(default=None, description="Токен для следующей страницы"),
) -> ApiResponse:
    """Получить список участников встречи"""
    zoom_manager: ZoomManager = request.app.state.zoom_manager
    
    errors = []
    try:
        result = await zoom_manager.get_meeting_participants(
            meeting_id=meeting_id,
            page_size=page_size,
            next_page_token=next_page_token,
        )
        
        return ApiResponse.success_response(
            data=result.dict(),
            message_text="Participants retrieved successfully",
        )
    except ZoomManagerError as e:
        _LOG.error(f"Error getting meeting participants: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to get meeting participants",
        )


@router.get(
    "/meetings/{meeting_id}/recordings",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_meeting_recordings(
    request: Request,
    meeting_id: str = Path(...),
    page_size: int = Query(default=30, description="Количество результатов на странице"),
    next_page_token: Optional[str] = Query(default=None, description="Токен для следующей страницы"),
) -> ApiResponse:
    """Получить список записей встречи"""
    zoom_manager: ZoomManager = request.app.state.zoom_manager
    
    errors = []
    try:
        result = await zoom_manager.get_meeting_recordings(
            meeting_id=meeting_id,
            page_size=page_size,
            next_page_token=next_page_token,
        )
        
        return ApiResponse.success_response(
            data=result.dict(),
            message_text="Recordings retrieved successfully",
        )
    except ZoomManagerError as e:
        _LOG.error(f"Error getting meeting recordings: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to get meeting recordings",
        )

