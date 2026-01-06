from typing import Optional
from pydantic import BaseModel, Field


class CreateTelegramIntegrationParams(BaseModel):
    """Параметры для создания интеграции Telegram"""
    name: str = Field(..., description="Название интеграции")
    bot_token: str = Field(..., description="Bot Token от BotFather")
    chat_id: Optional[str] = Field(default=None, description="ID чата для отправки уведомлений (опционально)")
    is_active: bool = Field(default=True, description="Активна ли интеграция")


class UpdateTelegramIntegrationParams(BaseModel):
    """Параметры для обновления интеграции Telegram"""
    name: Optional[str] = Field(default=None, description="Название интеграции")
    bot_token: Optional[str] = Field(default=None, description="Bot Token")
    chat_id: Optional[str] = Field(default=None, description="ID чата")
    is_active: Optional[bool] = Field(default=None, description="Активна ли интеграция")


class TestConnectionResponse(BaseModel):
    """Ответ на проверку соединения"""
    connected: bool = Field(..., description="Подключено ли")
    message: str = Field(..., description="Сообщение о результате")


class SendMessageRequest(BaseModel):
    """Запрос на отправку сообщения"""
    chat_id: str = Field(..., description="ID чата или username")
    text: str = Field(..., description="Текст сообщения")
    parse_mode: Optional[str] = Field(default="HTML", description="Режим парсинга (HTML, Markdown, MarkdownV2)")
    disable_web_page_preview: bool = Field(default=False, description="Отключить превью ссылок")
    disable_notification: bool = Field(default=False, description="Отправить без звука")
    reply_to_message_id: Optional[int] = Field(default=None, description="ID сообщения для ответа")


class SendPhotoRequest(BaseModel):
    """Запрос на отправку фото"""
    chat_id: str = Field(..., description="ID чата или username")
    photo: str = Field(..., description="URL или file_id фото")
    caption: Optional[str] = Field(default=None, description="Подпись к фото")
    parse_mode: Optional[str] = Field(default="HTML", description="Режим парсинга")
    disable_notification: bool = Field(default=False, description="Отправить без звука")


class SendDocumentRequest(BaseModel):
    """Запрос на отправку документа"""
    chat_id: str = Field(..., description="ID чата или username")
    document: str = Field(..., description="URL или file_id документа")
    caption: Optional[str] = Field(default=None, description="Подпись к документу")
    parse_mode: Optional[str] = Field(default="HTML", description="Режим парсинга")
    disable_notification: bool = Field(default=False, description="Отправить без звука")


class MessageResponse(BaseModel):
    """Ответ с информацией о сообщении"""
    message_id: int = Field(..., description="ID сообщения")
    chat_id: int = Field(..., description="ID чата")
    text: Optional[str] = Field(default=None, description="Текст сообщения")
    date: str = Field(..., description="Дата отправки")


class BotInfoResponse(BaseModel):
    """Ответ с информацией о боте"""
    id: int = Field(..., description="ID бота")
    first_name: str = Field(..., description="Имя бота")
    username: str = Field(..., description="Username бота")
    can_join_groups: bool = Field(..., description="Может ли присоединяться к группам")
    can_read_all_group_messages: bool = Field(..., description="Может ли читать все сообщения в группах")


class WebhookInfoResponse(BaseModel):
    """Ответ с информацией о webhook"""
    url: Optional[str] = Field(default=None, description="URL webhook")
    has_custom_certificate: bool = Field(..., description="Есть ли кастомный сертификат")
    pending_update_count: int = Field(..., description="Количество ожидающих обновлений")
    last_error_date: Optional[str] = Field(default=None, description="Дата последней ошибки")
    last_error_message: Optional[str] = Field(default=None, description="Сообщение последней ошибки")


class SetWebhookRequest(BaseModel):
    """Запрос на установку webhook"""
    url: str = Field(..., description="URL для webhook")
    max_connections: Optional[int] = Field(default=None, description="Максимальное количество соединений")
    allowed_updates: Optional[list] = Field(default=None, description="Разрешенные типы обновлений")

