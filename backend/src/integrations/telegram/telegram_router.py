import logging
from typing import Optional
from uuid import UUID
from fastapi import (
    APIRouter,
    Request,
    Body,
    Depends,
    Path,
)
from fastapi.responses import JSONResponse

from src.common.common_router_models import (
    ApiResponse,
    ApiErrorCodes,
    ResponseError,
)
from src.auth.auth_cookie import CookieAuthMiddleware
from src.integrations.integrations_manager import (
    IntegrationsManager,
    IntegrationsManagerError,
    NoSuchIntegrationManagerError,
)
from src.integrations.integrations_storage_models import IntegrationType
from src.integrations.telegram.telegram_manager import (
    TelegramManager,
    TelegramManagerError,
)
from .telegram_router_models import (
    CreateTelegramIntegrationParams,
    UpdateTelegramIntegrationParams,
    TestConnectionResponse,
    SendMessageRequest,
    SendPhotoRequest,
    SendDocumentRequest,
    MessageResponse,
    BotInfoResponse,
    WebhookInfoResponse,
    SetWebhookRequest,
)


_LOG = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/integrations/telegram",
    tags=["Telegram Integration"],
)


@router.post(
    "/",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def create_telegram_integration(
    request: Request,
    params: CreateTelegramIntegrationParams = Body(...),
) -> ApiResponse:
    """Создать интеграцию Telegram"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    user_id = request.state.jwt_payload["user_id"]
    
    errors = []
    try:
        config = {
            "integration_type": params.integration_type or "bot",
        }
        
        if params.integration_type == "user":
            # Конфигурация для личного аккаунта
            if not params.phone_number or not params.api_id or not params.api_hash:
                errors.append(
                    ResponseError(
                        code=ApiErrorCodes.BASE_EXCEPTION,
                        text="Для типа 'user' необходимо указать phone_number, api_id и api_hash",
                    )
                )
                return ApiResponse.error_response(
                    errors=errors,
                    message_text="Missing required fields for user integration",
                )
            config["phone_number"] = params.phone_number
            config["api_id"] = params.api_id
            config["api_hash"] = params.api_hash
        else:
            # Конфигурация для бота
            if not params.bot_token:
                errors.append(
                    ResponseError(
                        code=ApiErrorCodes.BASE_EXCEPTION,
                        text="Для типа 'bot' необходимо указать bot_token",
                    )
                )
                return ApiResponse.error_response(
                    errors=errors,
                    message_text="Missing required fields for bot integration",
                )
            config["bot_token"] = params.bot_token
        
        if params.chat_id:
            config["chat_id"] = params.chat_id
        
        integration = await integrations_manager.create_integration(
            integration_type=IntegrationType.TELEGRAM,
            name=params.name,
            config=config,
            created_by=user_id,
            is_active=params.is_active,
        )
        
        return ApiResponse.success_response(
            data={"integration_id": str(integration.id)},
            message_text="Telegram integration created successfully",
        )
    except IntegrationsManagerError as e:
        _LOG.error(f"Error creating Telegram integration: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to create Telegram integration",
        )


@router.get(
    "/",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_telegram_integration(
    request: Request,
) -> ApiResponse:
    """Получить активную интеграцию Telegram"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    
    errors = []
    try:
        integration = await integrations_manager.get_active_integration(IntegrationType.TELEGRAM)
        
        if not integration:
            return ApiResponse.success_response(
                data=None,
                message_text="No active Telegram integration found",
            )
        
        # Не возвращаем секретные данные в ответе для безопасности
        integration_type = integration.config.get("integration_type", "bot")
        response_data = {
            "id": integration.id,
            "type": integration.type,
            "name": integration.name,
            "is_active": integration.is_active,
            "created_at": integration.created_at,
            "updated_at": integration.updated_at,
            "integration_type": integration_type,
            "has_chat_id": bool(integration.config.get("chat_id")),
            "has_bot_token": bool(integration.config.get("bot_token")) if integration_type == "bot" else False,
            "has_user_credentials": bool(integration.config.get("phone_number") and integration.config.get("api_id") and integration.config.get("api_hash")) if integration_type == "user" else False,
        }
        
        return ApiResponse.success_response(
            data=response_data,
            message_text="Telegram integration retrieved successfully",
        )
    except IntegrationsManagerError as e:
        _LOG.error(f"Error getting Telegram integration: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to get Telegram integration",
        )


@router.patch(
    "/",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def update_telegram_integration_no_id(
    request: Request,
    params: UpdateTelegramIntegrationParams = Body(...),
) -> ApiResponse:
    """Обновить активную интеграцию Telegram (без указания ID)"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    user_id = request.state.jwt_payload["user_id"]
    
    _LOG.info(f"Update Telegram integration request: name={params.name}, has_bot_token={params.bot_token is not None}, has_chat_id={params.chat_id is not None}")
    
    errors = []
    try:
        # Получаем активную интеграцию (или любую, если активной нет)
        integration = await integrations_manager.get_active_integration(IntegrationType.TELEGRAM)
        
        # Если активной нет, попробуем найти любую интеграцию Telegram
        if not integration:
            _LOG.warning("No active Telegram integration found, trying to find any Telegram integration")
            all_integrations = await integrations_manager.get_integrations_by_type(
                IntegrationType.TELEGRAM,
                active_only=False,
            )
            if not all_integrations:
                # Если интеграции вообще нет, создаем новую
                _LOG.info("No Telegram integration found, creating new one")
                
                # Проверяем, что есть bot_token
                if not params.bot_token:
                    errors.append(
                        ResponseError(
                            code=ApiErrorCodes.BASE_EXCEPTION,
                            text="Cannot create integration: bot_token is required",
                        )
                    )
                    return ApiResponse.error_response(
                        errors=errors,
                        message_text="Cannot create integration without bot_token",
                    )
                
                # Определяем тип интеграции
                integration_type = params.integration_type or "bot"
                config = {
                    "integration_type": integration_type,
                }
                
                if integration_type == "user":
                    # Конфигурация для личного аккаунта
                    if not params.phone_number or not params.api_id or not params.api_hash:
                        errors.append(
                            ResponseError(
                                code=ApiErrorCodes.BASE_EXCEPTION,
                                text="Cannot create user integration: phone_number, api_id, and api_hash are required",
                            )
                        )
                        return ApiResponse.error_response(
                            errors=errors,
                            message_text="Cannot create integration without required credentials",
                        )
                    config["phone_number"] = params.phone_number
                    config["api_id"] = params.api_id
                    config["api_hash"] = params.api_hash
                else:
                    # Конфигурация для бота
                    if not params.bot_token:
                        errors.append(
                            ResponseError(
                                code=ApiErrorCodes.BASE_EXCEPTION,
                                text="Cannot create bot integration: bot_token is required",
                            )
                        )
                        return ApiResponse.error_response(
                            errors=errors,
                            message_text="Cannot create integration without bot_token",
                        )
                    config["bot_token"] = params.bot_token
                
                if params.chat_id:
                    config["chat_id"] = params.chat_id
                
                _LOG.info(f"Creating Telegram integration with type: {integration_type}, config keys: {list(config.keys())}")
                
                new_integration = await integrations_manager.create_integration(
                    integration_type=IntegrationType.TELEGRAM,
                    name=params.name or "Telegram Integration",
                    config=config,
                    created_by=user_id,
                    is_active=True,
                )
                _LOG.info(f"Created new Telegram integration: ID={new_integration.id}, Name={new_integration.name}, is_active={new_integration.is_active}")
                return ApiResponse.success_response(
                    data={"integration_id": str(new_integration.id)},
                    message_text="Telegram integration created successfully",
                )
            # Используем первую найденную интеграцию
            integration = all_integrations[0]
            _LOG.info(f"Using Telegram integration (not active): ID={integration.id}, Name={integration.name}, is_active={integration.is_active}")
        
        # Обновляем интеграцию
        return await update_telegram_integration_internal(
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
            message_text="Failed to update Telegram integration",
        )


@router.patch(
    "/{integration_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def update_telegram_integration(
    request: Request,
    integration_id: UUID = Path(...),
    params: UpdateTelegramIntegrationParams = Body(...),
) -> ApiResponse:
    """Обновить интеграцию Telegram"""
    user_id = request.state.jwt_payload["user_id"]
    return await update_telegram_integration_internal(
        request,
        integration_id,
        params,
        user_id,
    )


async def update_telegram_integration_internal(
    request: Request,
    integration_id: UUID,
    params: UpdateTelegramIntegrationParams,
    user_id: UUID,
) -> ApiResponse:
    """Внутренняя функция для обновления интеграции Telegram"""
    integrations_manager: IntegrationsManager = request.app.state.integrations_manager
    
    errors = []
    try:
        config = {}
        
        # Обновляем тип интеграции, если указан
        if params.integration_type is not None:
            config["integration_type"] = params.integration_type
        
        # Обновляем поля в зависимости от типа
        if params.integration_type == "user" or (params.integration_type is None and update_config and update_config.get("integration_type") == "user"):
            # Для пользователя
            if params.phone_number is not None:
                config["phone_number"] = params.phone_number
            if params.api_id is not None:
                config["api_id"] = params.api_id
            if params.api_hash is not None:
                config["api_hash"] = params.api_hash
        else:
            # Для бота
            if params.bot_token is not None:
                config["bot_token"] = params.bot_token
        
        if params.chat_id is not None:
            config["chat_id"] = params.chat_id
        
        update_config = config if config else None
        
        # Если is_active не указан, проверяем текущее значение
        is_active = params.is_active
        if is_active is None:
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
        
        _LOG.info(f"Updating Telegram integration {integration_id}: name={params.name}, is_active={is_active}, has_config={update_config is not None}")
        
        integration = await integrations_manager.update_integration(
            integration_id=integration_id,
            name=params.name,
            is_active=is_active,
            config=update_config,
            updated_by=user_id,
        )
        
        return ApiResponse.success_response(
            data={"integration_id": str(integration.id)},
            message_text="Telegram integration updated successfully",
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
            message_text="Telegram integration not found",
        )
    except IntegrationsManagerError as e:
        _LOG.error(f"Error updating Telegram integration: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to update Telegram integration",
        )


@router.post(
    "/test-connection",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def test_telegram_connection(
    request: Request,
) -> ApiResponse:
    """Проверить соединение с Telegram API"""
    telegram_manager: TelegramManager = request.app.state.telegram_manager
    
    errors = []
    try:
        connected = await telegram_manager.test_connection()
        
        if connected:
            bot_info = await telegram_manager.get_bot_info()
            message = f"Connection successful. Bot: @{bot_info.username}"
        else:
            message = "Connection failed. Please check your bot token."
        
        response_data = TestConnectionResponse(
            connected=connected,
            message=message,
        )
        
        return ApiResponse.success_response(
            data=response_data.dict(),
            message_text=message,
        )
    except TelegramManagerError as e:
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


@router.get(
    "/bot-info",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_bot_info(
    request: Request,
) -> ApiResponse:
    """Получить информацию о боте"""
    telegram_manager: TelegramManager = request.app.state.telegram_manager
    
    errors = []
    try:
        bot_info = await telegram_manager.get_bot_info()
        
        response_data = BotInfoResponse(
            id=bot_info.id,
            first_name=bot_info.first_name,
            username=bot_info.username,
            can_join_groups=bot_info.can_join_groups,
            can_read_all_group_messages=bot_info.can_read_all_group_messages,
        )
        
        return ApiResponse.success_response(
            data=response_data.dict(),
            message_text="Bot info retrieved successfully",
        )
    except TelegramManagerError as e:
        _LOG.error(f"Error getting bot info: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to get bot info",
        )


@router.post(
    "/send-message",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def send_message(
    request: Request,
    params: SendMessageRequest = Body(...),
) -> ApiResponse:
    """Отправить текстовое сообщение"""
    telegram_manager: TelegramManager = request.app.state.telegram_manager
    
    errors = []
    try:
        message = await telegram_manager.send_message(
            chat_id=params.chat_id,
            text=params.text,
            parse_mode=params.parse_mode,
            disable_web_page_preview=params.disable_web_page_preview,
            disable_notification=params.disable_notification,
            reply_to_message_id=params.reply_to_message_id,
        )
        
        response_data = MessageResponse(
            message_id=message.message_id,
            chat_id=message.chat.id,
            text=message.text,
            date=message.date.isoformat(),
        )
        
        return ApiResponse.success_response(
            data=response_data.dict(),
            message_text="Message sent successfully",
        )
    except TelegramManagerError as e:
        _LOG.error(f"Error sending message: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to send message",
        )


@router.post(
    "/send-photo",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def send_photo(
    request: Request,
    params: SendPhotoRequest = Body(...),
) -> ApiResponse:
    """Отправить фото"""
    telegram_manager: TelegramManager = request.app.state.telegram_manager
    
    errors = []
    try:
        message = await telegram_manager.send_photo(
            chat_id=params.chat_id,
            photo=params.photo,
            caption=params.caption,
            parse_mode=params.parse_mode,
            disable_notification=params.disable_notification,
        )
        
        response_data = MessageResponse(
            message_id=message.message_id,
            chat_id=message.chat.id,
            text=message.caption,
            date=message.date.isoformat(),
        )
        
        return ApiResponse.success_response(
            data=response_data.dict(),
            message_text="Photo sent successfully",
        )
    except TelegramManagerError as e:
        _LOG.error(f"Error sending photo: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to send photo",
        )


@router.post(
    "/send-document",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def send_document(
    request: Request,
    params: SendDocumentRequest = Body(...),
) -> ApiResponse:
    """Отправить документ"""
    telegram_manager: TelegramManager = request.app.state.telegram_manager
    
    errors = []
    try:
        message = await telegram_manager.send_document(
            chat_id=params.chat_id,
            document=params.document,
            caption=params.caption,
            parse_mode=params.parse_mode,
            disable_notification=params.disable_notification,
        )
        
        response_data = MessageResponse(
            message_id=message.message_id,
            chat_id=message.chat.id,
            text=message.text,
            date=message.date.isoformat(),
        )
        
        return ApiResponse.success_response(
            data=response_data.dict(),
            message_text="Document sent successfully",
        )
    except TelegramManagerError as e:
        _LOG.error(f"Error sending document: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to send document",
        )


@router.get(
    "/webhook-info",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_webhook_info(
    request: Request,
) -> ApiResponse:
    """Получить информацию о webhook"""
    telegram_manager: TelegramManager = request.app.state.telegram_manager
    
    errors = []
    try:
        webhook_info = await telegram_manager.get_webhook_info()
        
        response_data = WebhookInfoResponse(
            url=webhook_info.url,
            has_custom_certificate=webhook_info.has_custom_certificate,
            pending_update_count=webhook_info.pending_update_count,
            last_error_date=webhook_info.last_error_date.isoformat() if webhook_info.last_error_date else None,
            last_error_message=webhook_info.last_error_message,
        )
        
        return ApiResponse.success_response(
            data=response_data.dict(),
            message_text="Webhook info retrieved successfully",
        )
    except TelegramManagerError as e:
        _LOG.error(f"Error getting webhook info: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to get webhook info",
        )


@router.post(
    "/set-webhook",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def set_webhook(
    request: Request,
    params: SetWebhookRequest = Body(...),
) -> ApiResponse:
    """Установить webhook"""
    telegram_manager: TelegramManager = request.app.state.telegram_manager
    
    errors = []
    try:
        success = await telegram_manager.set_webhook(
            url=params.url,
            max_connections=params.max_connections,
            allowed_updates=params.allowed_updates,
        )
        
        if success:
            return ApiResponse.success_response(
                data={"success": True},
                message_text="Webhook set successfully",
            )
        else:
            errors.append(
                ResponseError(
                    code=ApiErrorCodes.BASE_EXCEPTION,
                    text="Failed to set webhook",
                )
            )
            return ApiResponse.error_response(
                errors=errors,
                message_text="Failed to set webhook",
            )
    except TelegramManagerError as e:
        _LOG.error(f"Error setting webhook: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to set webhook",
        )


@router.post(
    "/delete-webhook",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def delete_webhook(
    request: Request,
) -> ApiResponse:
    """Удалить webhook"""
    telegram_manager: TelegramManager = request.app.state.telegram_manager
    
    errors = []
    try:
        success = await telegram_manager.delete_webhook()
        
        if success:
            return ApiResponse.success_response(
                data={"success": True},
                message_text="Webhook deleted successfully",
            )
        else:
            errors.append(
                ResponseError(
                    code=ApiErrorCodes.BASE_EXCEPTION,
                    text="Failed to delete webhook",
                )
            )
            return ApiResponse.error_response(
                errors=errors,
                message_text="Failed to delete webhook",
            )
    except TelegramManagerError as e:
        _LOG.error(f"Error deleting webhook: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to delete webhook",
        )


@router.get(
    "/chat-info/{chat_id}",
    dependencies=[Depends(CookieAuthMiddleware())],
)
async def get_chat_info(
    request: Request,
    chat_id: str = Path(...),
) -> ApiResponse:
    """Получить информацию о чате"""
    telegram_manager: TelegramManager = request.app.state.telegram_manager
    
    errors = []
    try:
        chat_info = await telegram_manager.get_chat_info(chat_id)
        
        response_data = {
            "id": chat_info.id,
            "type": chat_info.type,
            "title": chat_info.title,
            "username": chat_info.username,
            "first_name": chat_info.first_name,
            "last_name": chat_info.last_name,
        }
        
        return ApiResponse.success_response(
            data=response_data,
            message_text="Chat info retrieved successfully",
        )
    except TelegramManagerError as e:
        _LOG.error(f"Error getting chat info: {e}")
        errors.append(
            ResponseError(
                code=ApiErrorCodes.BASE_EXCEPTION,
                text=str(e),
            )
        )
        return ApiResponse.error_response(
            errors=errors,
            message_text="Failed to get chat info",
        )

