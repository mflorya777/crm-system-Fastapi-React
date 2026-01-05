import logging
from typing import Optional
from uuid import UUID

from fastapi import (
    APIRouter,
    Body,
    Depends,
    Request,
    Query,
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
from .telephony_manager import (
    TelephonyManager,
    TelephonyManagerError,
)
from .telephony_router_models import (
    CreateMangoOfficeIntegrationParams,
    UpdateMangoOfficeIntegrationParams,
    TestConnectionResponse,
    CallHistoryParams,
    CallHistoryResponse,
    MakeCallParams,
    MakeCallResponse,
    StatisticsParams,
    StatisticsResponse,
)


_LOG = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/integrations/telephony",
    tags=["Telephony Integration"],
)


@router.post(
    "/mango-office",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def create_mango_office_integration(
    request: Request,
    params: CreateMangoOfficeIntegrationParams = Body(...),
) -> ApiResponse:
    """Создать интеграцию Mango Office"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    user_id = request.state.jwt_payload["user_id"]
    
    errors = []
    try:
        config = {
            "api_key": params.api_key,
            "api_salt": params.api_salt,
            "vpbx_api_key": params.vpbx_api_key,
            "vpbx_api_salt": params.vpbx_api_salt,
        }
        
        integration = await integrations_manager.create_integration(
            integration_type=IntegrationType.TELEPHONY,
            name=params.name,
            config=config,
            created_by=user_id,
            is_active=params.is_active,
        )
        
        return ApiResponse.success_response(
            data={"integration_id": str(integration.id)},
            message_text="Mango Office integration created successfully",
        )
    except IntegrationsManagerError as e:
        _LOG.error(f"Error creating Mango Office integration: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to create Mango Office integration",
        )


@router.get(
    "/mango-office",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_mango_office_integration(
    request: Request,
) -> ApiResponse:
    """Получить интеграцию Mango Office"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    
    errors = []
    try:
        integrations = await integrations_manager.get_integrations_by_type(
            IntegrationType.TELEPHONY,
            active_only=False,
        )
        
        # Маскируем чувствительные данные в конфиге
        integrations_data = []
        for integration in integrations:
            config = integration.config.copy()
            # Маскируем ключи
            if "api_key" in config:
                config["api_key"] = "***" + config["api_key"][-4:] if len(config["api_key"]) > 4 else "***"
            if "vpbx_api_key" in config:
                config["vpbx_api_key"] = "***" + config["vpbx_api_key"][-4:] if len(config["vpbx_api_key"]) > 4 else "***"
            if "api_salt" in config:
                config["api_salt"] = "***"
            if "vpbx_api_salt" in config:
                config["vpbx_api_salt"] = "***"
            
            integrations_data.append({
                "id": str(integration.id),
                "name": integration.name,
                "is_active": integration.is_active,
                "config": config,
                "created_at": integration.created_at.isoformat(),
                "updated_at": integration.updated_at.isoformat() if integration.updated_at else None,
            })
        
        return ApiResponse.success_response(
            data={"integrations": integrations_data},
            message_text="Mango Office integrations retrieved successfully",
        )
    except IntegrationsManagerError as e:
        _LOG.error(f"Error getting Mango Office integration: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to get Mango Office integration",
        )


@router.patch(
    "/mango-office/{integration_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def update_mango_office_integration(
    request: Request,
    integration_id: UUID,
    params: UpdateMangoOfficeIntegrationParams = Body(...),
) -> ApiResponse:
    """Обновить интеграцию Mango Office"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    user_id = request.state.jwt_payload["user_id"]
    
    errors = []
    try:
        # Получаем текущую интеграцию
        integration = await integrations_manager.get_integration(integration_id)
        
        # Обновляем конфиг, если переданы новые значения
        config = integration.config.copy()
        if params.api_key is not None:
            config["api_key"] = params.api_key
        if params.api_salt is not None:
            config["api_salt"] = params.api_salt
        if params.vpbx_api_key is not None:
            config["vpbx_api_key"] = params.vpbx_api_key
        if params.vpbx_api_salt is not None:
            config["vpbx_api_salt"] = params.vpbx_api_salt
        
        updated_integration = await integrations_manager.update_integration(
            integration_id=integration_id,
            name=params.name,
            is_active=params.is_active,
            config=config if any([params.api_key, params.api_salt, params.vpbx_api_key, params.vpbx_api_salt]) else None,
            updated_by=user_id,
        )
        
        return ApiResponse.success_response(
            data={"integration_id": str(updated_integration.id)},
            message_text="Mango Office integration updated successfully",
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
            message_text="Integration not found",
        )
    except IntegrationsManagerError as e:
        _LOG.error(f"Error updating Mango Office integration: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to update Mango Office integration",
        )


@router.post(
    "/test-connection",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def test_connection(
    request: Request,
) -> ApiResponse:
    """Проверить соединение с телефонией"""
    telephony_manager: TelephonyManager = request.app.state.telephony_manager
    
    errors = []
    try:
        success = await telephony_manager.test_connection()
        
        return ApiResponse.success_response(
            data={
                "success": success,
                "message": "Connection successful" if success else "Connection failed",
            },
            message_text="Connection test completed",
        )
    except TelephonyManagerError as e:
        _LOG.error(f"Error testing connection: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to test connection",
        )


@router.post(
    "/call-history",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_call_history(
    request: Request,
    params: CallHistoryParams = Body(...),
) -> ApiResponse:
    """Получить историю звонков"""
    telephony_manager: TelephonyManager = request.app.state.telephony_manager
    
    errors = []
    try:
        calls = await telephony_manager.get_call_history(
            date_from=params.date_from,
            date_to=params.date_to,
            from_number=params.from_number,
            to_number=params.to_number,
            limit=params.limit,
        )
        
        return ApiResponse.success_response(
            data={
                "calls": [call.model_dump() for call in calls],
                "total": len(calls),
            },
            message_text="Call history retrieved successfully",
        )
    except TelephonyManagerError as e:
        _LOG.error(f"Error getting call history: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to get call history",
        )


@router.post(
    "/make-call",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def make_call(
    request: Request,
    params: MakeCallParams = Body(...),
) -> ApiResponse:
    """Инициировать звонок"""
    telephony_manager: TelephonyManager = request.app.state.telephony_manager
    
    errors = []
    try:
        result = await telephony_manager.make_call(
            from_number=params.from_number,
            to_number=params.to_number,
            line_number=params.line_number,
        )
        
        return ApiResponse.success_response(
            data={
                "success": True,
                "data": result,
            },
            message_text="Call initiated successfully",
        )
    except TelephonyManagerError as e:
        _LOG.error(f"Error making call: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to make call",
        )


@router.post(
    "/statistics",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_statistics(
    request: Request,
    params: StatisticsParams = Body(...),
) -> ApiResponse:
    """Получить статистику звонков"""
    telephony_manager: TelephonyManager = request.app.state.telephony_manager
    
    errors = []
    try:
        statistics = await telephony_manager.get_statistics(
            date_from=params.date_from,
            date_to=params.date_to,
        )
        
        return ApiResponse.success_response(
            data={"statistics": statistics.model_dump()},
            message_text="Statistics retrieved successfully",
        )
    except TelephonyManagerError as e:
        _LOG.error(f"Error getting statistics: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to get statistics",
        )

