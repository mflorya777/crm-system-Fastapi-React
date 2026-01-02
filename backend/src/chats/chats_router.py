"""Роутер для API чатов"""

import json
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, Request
from starlette import status

from src.chats.chats_manager import ChatsManager
from src.chats.chats_router_models import (
    CreateChatParams,
    SendMessageParams,
    UpdateMessageParams,
    AddParticipantParams,
    ChatApiResponse,
    ChatsListApiResponse,
    ChatMessageApiResponse,
    ChatMessagesListApiResponse,
    OnlineUsersResponse,
    SuccessResponse,
    ChatResponse,
    ChatMessageResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chats", tags=["Chats"])


def get_chats_manager(request: Request) -> ChatsManager:
    """Получить менеджер чатов из состояния приложения"""
    return request.app.state.chats_manager


# ==================== WebSocket endpoint ====================

@router.websocket("/ws/{chat_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    chat_id: UUID,
    user_id: str = Query(..., description="ID пользователя"),
):
    """
    WebSocket endpoint для real-time общения в чате
    
    Параметры:
    - chat_id: ID чата
    - user_id: ID пользователя (query параметр)
    
    Типы входящих сообщений:
    - send_message: отправить сообщение
    - typing_indicator: индикатор набора текста
    - mark_as_read: отметить сообщения как прочитанные
    
    Типы исходящих сообщений:
    - new_message: новое сообщение в чате
    - typing_indicator: кто-то печатает
    - messages_read: сообщения прочитаны
    - message_edited: сообщение изменено
    - message_deleted: сообщение удалено
    - participant_added: добавлен участник
    - participant_removed: удален участник
    """
    chats_manager: ChatsManager = websocket.app.state.chats_manager
    
    try:
        # Подключаем пользователя к чату
        await chats_manager.connection_manager.connect(websocket, str(chat_id), user_id)
        
        # Отправляем подтверждение подключения
        await websocket.send_text(json.dumps({
            "type": "connected",
            "chat_id": str(chat_id),
            "user_id": user_id
        }))
        
        # Отправляем список онлайн пользователей
        online_users = chats_manager.get_online_users(chat_id)
        await websocket.send_text(json.dumps({
            "type": "online_users",
            "users": online_users
        }))
        
        # Уведомляем других участников о подключении
        await chats_manager.connection_manager.broadcast_to_chat(
            json.dumps({
                "type": "user_joined",
                "user_id": user_id
            }),
            str(chat_id),
            exclude_user=user_id
        )
        
        # Обрабатываем входящие сообщения
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            message_type = message_data.get("type")
            
            if message_type == "send_message":
                # Отправка сообщения
                content = message_data.get("content")
                msg_type = message_data.get("message_type", "text")
                file_url = message_data.get("file_url")
                
                await chats_manager.send_message(
                    chat_id=chat_id,
                    sender_id=UUID(user_id),
                    content=content,
                    message_type=msg_type,
                    file_url=file_url
                )
            
            elif message_type == "typing_indicator":
                # Индикатор набора текста
                is_typing = message_data.get("is_typing", False)
                await chats_manager.handle_typing_indicator(
                    chat_id=chat_id,
                    user_id=UUID(user_id),
                    is_typing=is_typing
                )
            
            elif message_type == "mark_as_read":
                # Отметить сообщения как прочитанные
                await chats_manager.mark_messages_as_read(
                    chat_id=chat_id,
                    user_id=UUID(user_id)
                )
            
            elif message_type == "ping":
                # Пинг для поддержания соединения
                await websocket.send_text(json.dumps({"type": "pong"}))
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: user {user_id} from chat {chat_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Отключаем пользователя
        chats_manager.connection_manager.disconnect(str(chat_id), user_id)
        
        # Уведомляем других участников об отключении
        await chats_manager.connection_manager.broadcast_to_chat(
            json.dumps({
                "type": "user_left",
                "user_id": user_id
            }),
            str(chat_id)
        )


# ==================== REST endpoints для чатов ====================

@router.post(
    "",
    response_model=ChatApiResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_chat(
    params: CreateChatParams,
    user_id: UUID = Query(..., description="ID текущего пользователя"),
    chats_manager: ChatsManager = Depends(get_chats_manager),
):
    """
    Создать новый чат
    
    Параметры:
    - participant_ids: список ID участников
    - chat_type: тип чата (direct или group)
    - title: название чата (для группового)
    - deal_id: ID сделки (опционально)
    - buyer_id: ID покупателя (опционально)
    """
    try:
        chat = await chats_manager.create_chat(
            creator_id=user_id,
            participant_ids=params.participant_ids,
            chat_type=params.chat_type,
            title=params.title,
            deal_id=params.deal_id,
            buyer_id=params.buyer_id
        )
        
        return ChatApiResponse(
            status=True,
            data=ChatResponse.from_chat(chat)
        )
    except Exception as e:
        logger.error(f"Ошибка создания чата: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка создания чата: {str(e)}"
        )


@router.get(
    "",
    response_model=ChatsListApiResponse,
)
async def get_user_chats(
    user_id: UUID = Query(..., description="ID пользователя"),
    active_only: bool = Query(default=True, description="Только активные чаты"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    chats_manager: ChatsManager = Depends(get_chats_manager),
):
    """
    Получить список чатов пользователя
    """
    try:
        chats = await chats_manager.get_user_chats(user_id, active_only, skip, limit)
        
        return ChatsListApiResponse(
            status=True,
            data=[ChatResponse.from_chat(chat) for chat in chats]
        )
    except Exception as e:
        logger.error(f"Ошибка получения чатов: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка получения чатов: {str(e)}"
        )


@router.get(
    "/{chat_id}",
    response_model=ChatApiResponse,
)
async def get_chat(
    chat_id: UUID,
    chats_manager: ChatsManager = Depends(get_chats_manager),
):
    """
    Получить информацию о чате
    """
    try:
        chat = await chats_manager.get_chat(chat_id)
        
        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Чат не найден"
            )
        
        return ChatApiResponse(
            status=True,
            data=ChatResponse.from_chat(chat)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения чата: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка получения чата: {str(e)}"
        )


@router.delete(
    "/{chat_id}",
    response_model=SuccessResponse,
)
async def delete_chat(
    chat_id: UUID,
    chats_manager: ChatsManager = Depends(get_chats_manager),
):
    """
    Удалить чат (мягкое удаление)
    """
    try:
        success = await chats_manager.delete_chat(chat_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Чат не найден"
            )
        
        return SuccessResponse(status=True, data={"deleted": True})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка удаления чата: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка удаления чата: {str(e)}"
        )


@router.post(
    "/{chat_id}/participants",
    response_model=SuccessResponse,
)
async def add_participant(
    chat_id: UUID,
    params: AddParticipantParams,
    chats_manager: ChatsManager = Depends(get_chats_manager),
):
    """
    Добавить участника в чат
    """
    try:
        success = await chats_manager.add_participant(chat_id, params.user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Не удалось добавить участника"
            )
        
        return SuccessResponse(status=True, data={"added": True})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка добавления участника: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка добавления участника: {str(e)}"
        )


@router.delete(
    "/{chat_id}/participants/{user_id}",
    response_model=SuccessResponse,
)
async def remove_participant(
    chat_id: UUID,
    user_id: UUID,
    chats_manager: ChatsManager = Depends(get_chats_manager),
):
    """
    Удалить участника из чата
    """
    try:
        success = await chats_manager.remove_participant(chat_id, user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Не удалось удалить участника"
            )
        
        return SuccessResponse(status=True, data={"removed": True})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка удаления участника: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка удаления участника: {str(e)}"
        )


# ==================== REST endpoints для сообщений ====================

@router.post(
    "/{chat_id}/messages",
    response_model=ChatMessageApiResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    chat_id: UUID,
    params: SendMessageParams,
    user_id: UUID = Query(..., description="ID отправителя"),
    chats_manager: ChatsManager = Depends(get_chats_manager),
):
    """
    Отправить сообщение в чат
    """
    try:
        message = await chats_manager.send_message(
            chat_id=chat_id,
            sender_id=user_id,
            content=params.content,
            message_type=params.message_type,
            file_url=params.file_url
        )
        
        return ChatMessageApiResponse(
            status=True,
            data=ChatMessageResponse.from_message(message)
        )
    except Exception as e:
        logger.error(f"Ошибка отправки сообщения: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка отправки сообщения: {str(e)}"
        )


@router.get(
    "/{chat_id}/messages",
    response_model=ChatMessagesListApiResponse,
)
async def get_chat_messages(
    chat_id: UUID,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    include_deleted: bool = Query(default=False),
    chats_manager: ChatsManager = Depends(get_chats_manager),
):
    """
    Получить сообщения чата
    """
    try:
        messages = await chats_manager.get_chat_messages(chat_id, skip, limit, include_deleted)
        
        return ChatMessagesListApiResponse(
            status=True,
            data=[ChatMessageResponse.from_message(msg) for msg in messages]
        )
    except Exception as e:
        logger.error(f"Ошибка получения сообщений: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка получения сообщений: {str(e)}"
        )


@router.patch(
    "/{chat_id}/messages/{message_id}",
    response_model=SuccessResponse,
)
async def update_message(
    chat_id: UUID,
    message_id: UUID,
    params: UpdateMessageParams,
    user_id: UUID = Query(..., description="ID пользователя"),
    chats_manager: ChatsManager = Depends(get_chats_manager),
):
    """
    Обновить сообщение
    """
    try:
        success = await chats_manager.update_message(message_id, params.content, user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нельзя редактировать чужое сообщение"
            )
        
        return SuccessResponse(status=True, data={"updated": True})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка обновления сообщения: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка обновления сообщения: {str(e)}"
        )


@router.delete(
    "/{chat_id}/messages/{message_id}",
    response_model=SuccessResponse,
)
async def delete_message(
    chat_id: UUID,
    message_id: UUID,
    user_id: UUID = Query(..., description="ID пользователя"),
    chats_manager: ChatsManager = Depends(get_chats_manager),
):
    """
    Удалить сообщение
    """
    try:
        success = await chats_manager.delete_message(message_id, user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нельзя удалить чужое сообщение"
            )
        
        return SuccessResponse(status=True, data={"deleted": True})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка удаления сообщения: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка удаления сообщения: {str(e)}"
        )


@router.post(
    "/{chat_id}/messages/mark-as-read",
    response_model=SuccessResponse,
)
async def mark_messages_as_read(
    chat_id: UUID,
    user_id: UUID = Query(..., description="ID пользователя"),
    chats_manager: ChatsManager = Depends(get_chats_manager),
):
    """
    Отметить все сообщения чата как прочитанные
    """
    try:
        count = await chats_manager.mark_messages_as_read(chat_id, user_id)
        
        return SuccessResponse(status=True, data={"marked_count": count})
    except Exception as e:
        logger.error(f"Ошибка отметки сообщений как прочитанных: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка отметки сообщений: {str(e)}"
        )


@router.get(
    "/{chat_id}/online",
    response_model=OnlineUsersResponse,
)
async def get_online_users(
    chat_id: UUID,
    chats_manager: ChatsManager = Depends(get_chats_manager),
):
    """
    Получить список онлайн пользователей в чате
    """
    try:
        online_users = chats_manager.get_online_users(chat_id)
        
        return OnlineUsersResponse(status=True, data=online_users)
    except Exception as e:
        logger.error(f"Ошибка получения онлайн пользователей: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка получения онлайн пользователей: {str(e)}"
        )

