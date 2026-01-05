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
from .integrations_manager import (
    IntegrationsManager,
    IntegrationsManagerError,
    NoSuchIntegrationManagerError,
)
from .integrations_storage_models import IntegrationType


_LOG = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/integrations",
    tags=["Integrations"],
)


@router.get(
    "",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_all_integrations(
    request: Request,
    active_only: bool = Query(default=False, description="Только активные интеграции"),
) -> ApiResponse:
    """Получить все интеграции"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    
    errors = []
    try:
        integrations = await integrations_manager.get_all_integrations(active_only=active_only)
        
        # Маскируем чувствительные данные
        integrations_data = []
        for integration in integrations:
            config = integration.config.copy()
            # Маскируем все ключи в конфиге
            for key in config:
                if "key" in key.lower() or "salt" in key.lower() or "token" in key.lower() or "secret" in key.lower():
                    if isinstance(config[key], str) and len(config[key]) > 4:
                        config[key] = "***" + config[key][-4:]
                    else:
                        config[key] = "***"
            
            integrations_data.append({
                "id": str(integration.id),
                "type": integration.type,
                "name": integration.name,
                "is_active": integration.is_active,
                "config": config,
                "created_at": integration.created_at.isoformat(),
                "updated_at": integration.updated_at.isoformat() if integration.updated_at else None,
            })
        
        return ApiResponse.success_response(
            data={"integrations": integrations_data},
            message_text="Integrations retrieved successfully",
        )
    except IntegrationsManagerError as e:
        _LOG.error(f"Error getting integrations: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to get integrations",
        )


@router.get(
    "/{integration_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_integration(
    request: Request,
    integration_id: UUID,
) -> ApiResponse:
    """Получить интеграцию по ID"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    
    errors = []
    try:
        integration = await integrations_manager.get_integration(integration_id)
        
        # Маскируем чувствительные данные
        config = integration.config.copy()
        for key in config:
            if "key" in key.lower() or "salt" in key.lower() or "token" in key.lower() or "secret" in key.lower():
                if isinstance(config[key], str) and len(config[key]) > 4:
                    config[key] = "***" + config[key][-4:]
                else:
                    config[key] = "***"
        
        return ApiResponse.success_response(
            data={
                "id": str(integration.id),
                "type": integration.type,
                "name": integration.name,
                "is_active": integration.is_active,
                "config": config,
                "created_at": integration.created_at.isoformat(),
                "updated_at": integration.updated_at.isoformat() if integration.updated_at else None,
            },
            message_text="Integration retrieved successfully",
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
        _LOG.error(f"Error getting integration: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to get integration",
        )


@router.delete(
    "/{integration_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def delete_integration(
    request: Request,
    integration_id: UUID,
) -> ApiResponse:
    """Удалить интеграцию"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    
    errors = []
    try:
        await integrations_manager.delete_integration(integration_id)
        
        return ApiResponse.success_response(
            data={"integration_id": str(integration_id)},
            message_text="Integration deleted successfully",
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
        _LOG.error(f"Error deleting integration: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to delete integration",
        )

