from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class TelegramConfig(BaseModel):
    """Конфигурация для Telegram Bot"""
    bot_token: str = Field(..., description="Bot Token от BotFather")
    chat_id: Optional[str] = Field(default=None, description="ID чата для отправки уведомлений (опционально)")


class TelegramUser(BaseModel):
    """Пользователь Telegram"""
    id: int = Field(..., description="ID пользователя")
    is_bot: bool = Field(default=False, description="Является ли ботом")
    first_name: str = Field(..., description="Имя")
    last_name: Optional[str] = Field(default=None, description="Фамилия")
    username: Optional[str] = Field(default=None, description="Username")
    language_code: Optional[str] = Field(default=None, description="Код языка")


class TelegramChat(BaseModel):
    """Чат Telegram"""
    id: int = Field(..., description="ID чата")
    type: str = Field(..., description="Тип чата (private, group, supergroup, channel)")
    title: Optional[str] = Field(default=None, description="Название чата")
    username: Optional[str] = Field(default=None, description="Username чата")
    first_name: Optional[str] = Field(default=None, description="Имя (для приватных чатов)")
    last_name: Optional[str] = Field(default=None, description="Фамилия (для приватных чатов)")


class TelegramMessage(BaseModel):
    """Сообщение Telegram"""
    message_id: int = Field(..., description="ID сообщения")
    from_user: Optional[TelegramUser] = Field(default=None, alias="from", description="Отправитель")
    chat: TelegramChat = Field(..., description="Чат")
    date: datetime = Field(..., description="Дата отправки")
    text: Optional[str] = Field(default=None, description="Текст сообщения")
    caption: Optional[str] = Field(default=None, description="Подпись к медиа")
    entities: Optional[List[Dict[str, Any]]] = Field(default=None, description="Сущности сообщения")


class SendMessageParams(BaseModel):
    """Параметры для отправки сообщения"""
    chat_id: str = Field(..., description="ID чата или username (например, @username или -1001234567890)")
    text: str = Field(..., description="Текст сообщения")
    parse_mode: Optional[str] = Field(default="HTML", description="Режим парсинга (HTML, Markdown, MarkdownV2)")
    disable_web_page_preview: bool = Field(default=False, description="Отключить превью ссылок")
    disable_notification: bool = Field(default=False, description="Отправить без звука")
    reply_to_message_id: Optional[int] = Field(default=None, description="ID сообщения для ответа")


class SendPhotoParams(BaseModel):
    """Параметры для отправки фото"""
    chat_id: str = Field(..., description="ID чата или username")
    photo: str = Field(..., description="URL или file_id фото")
    caption: Optional[str] = Field(default=None, description="Подпись к фото")
    parse_mode: Optional[str] = Field(default="HTML", description="Режим парсинга")
    disable_notification: bool = Field(default=False, description="Отправить без звука")


class SendDocumentParams(BaseModel):
    """Параметры для отправки документа"""
    chat_id: str = Field(..., description="ID чата или username")
    document: str = Field(..., description="URL или file_id документа")
    caption: Optional[str] = Field(default=None, description="Подпись к документу")
    parse_mode: Optional[str] = Field(default="HTML", description="Режим парсинга")
    disable_notification: bool = Field(default=False, description="Отправить без звука")


class BotInfo(BaseModel):
    """Информация о боте"""
    id: int = Field(..., description="ID бота")
    is_bot: bool = Field(default=True, description="Является ли ботом")
    first_name: str = Field(..., description="Имя бота")
    username: str = Field(..., description="Username бота")
    can_join_groups: bool = Field(default=False, description="Может ли присоединяться к группам")
    can_read_all_group_messages: bool = Field(default=False, description="Может ли читать все сообщения в группах")
    supports_inline_queries: bool = Field(default=False, description="Поддерживает ли inline запросы")


class WebhookInfo(BaseModel):
    """Информация о webhook"""
    url: Optional[str] = Field(default=None, description="URL webhook")
    has_custom_certificate: bool = Field(default=False, description="Есть ли кастомный сертификат")
    pending_update_count: int = Field(default=0, description="Количество ожидающих обновлений")
    last_error_date: Optional[datetime] = Field(default=None, description="Дата последней ошибки")
    last_error_message: Optional[str] = Field(default=None, description="Сообщение последней ошибки")
    max_connections: Optional[int] = Field(default=None, description="Максимальное количество соединений")
    allowed_updates: Optional[List[str]] = Field(default=None, description="Разрешенные типы обновлений")


class Update(BaseModel):
    """Обновление от Telegram"""
    update_id: int = Field(..., description="ID обновления")
    message: Optional[TelegramMessage] = Field(default=None, description="Сообщение")
    edited_message: Optional[TelegramMessage] = Field(default=None, description="Отредактированное сообщение")
    channel_post: Optional[TelegramMessage] = Field(default=None, description="Пост в канале")
    edited_channel_post: Optional[TelegramMessage] = Field(default=None, description="Отредактированный пост в канале")

