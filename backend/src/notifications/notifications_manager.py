import datetime as dt
import logging
from typing import Type
from uuid import UUID

from src.misc.misc_lib import (
    datetime_to_moscow,
    utc_now,
)
from src.notifications.notifications_message_generator import NotificationsMessageGenerator as NG
from src.notifications.notifications_storage import NotificationsStorage
from src.notifications.notifications_storage_models import (
    NotificationMessageChannel,
    NotificationMessageType,
    NotificationMessageToCreate,
)
from src.users.users_storage import UsersStorage
from src.users.users_storage_models import UserToGet


_LOG = logging.getLogger("uvicorn.info")

NOTIFICATION_TTL_SECONDS = 60  # 1 minutes
NOTIFICATION_MAX_ATTEMPTS = 5


class NotificationsManagerException(Exception):
    pass


class NotificationManager:
    def __init__(
        self,
        notifications_storage: NotificationsStorage,
        users_storage: UsersStorage,
    ):
        self.storage: NotificationsStorage = notifications_storage
        self.users_storage: UsersStorage = users_storage

    async def create_notification(
        self,
        user_id: UUID,
        entity_id: UUID,
        entity_type: Type,
        message_type: NotificationMessageType,
        message_channel: NotificationMessageChannel,
        message_body: str,
        destination_address: str,
    ) -> NotificationMessageToCreate | None:
        result, reason = await self.check_notification_sent(
            user_id,
            entity_id,
            message_type,
            message_channel,
        )
        if result:
            raise NotificationsManagerException(reason)
        ttl_expires_at = utc_now() + dt.timedelta(seconds=NOTIFICATION_TTL_SECONDS)
        notification = NotificationMessageToCreate(
            user_id=user_id,
            entity_id=entity_id,
            entity_type=entity_type.__name__,
            message_type=message_type,
            message_channel=message_channel,
            body=message_body,
            max_attempts=NOTIFICATION_MAX_ATTEMPTS,
            ttl_expires_at=ttl_expires_at,
            destination_address=destination_address,
        )

        new_notification = await self.storage.add(notification)
        return new_notification

    async def check_notification_sent(
        self,
        user_id: UUID,
        entity_id: UUID,
        message_type: NotificationMessageType,
        message_channel: NotificationMessageChannel,
    ) -> tuple[bool, str | None]:
        existent_notification = await self.storage.get_not_expired_notification(
            user_id,
            entity_id,
            message_type,
            message_channel,
        )
        if existent_notification is not None:
            next_possible_send_time = datetime_to_moscow(
                existent_notification.ttl_expires_at,
            ).strftime(
                "%Y-%m-%d %H:%M:%S (МСК)",
            )
            message = f"Следующее сообщение можно отправить не ранее {next_possible_send_time}"
            return True, message
        return False, None

    async def get_notifications_to_send_for_channel(
        self,
        message_channel: NotificationMessageChannel,
    ) -> list[NotificationMessageToCreate]:
        return await self.storage.get_notifications_to_send_for_channel(
            message_channel,
            NOTIFICATION_MAX_ATTEMPTS,
        )

    async def handle_notifications_on_user_registration(
        self,
        user_id: UUID,
    ):
        email_approve_data = await self.users_storage.get_email_approve_data(uid=user_id)
        email = await self.users_storage.get_user_email(user_id)
        if email_approve_data is None:
            raise ValueError(f"Данные подтверждения email не найдены для пользователя: {user_id=}")
        if email_approve_data.email_approve_code is None:
            raise ValueError(f"Kод подтверждения не задан: {user_id=} {email_approve_data=}")
        message_body = NG.get_contact_approve_message(
            email_approve_data.email_approve_code,
            NotificationMessageChannel.EMAIL,
        )
        await self.create_notification(
            user_id=user_id,
            entity_id=user_id,
            entity_type=UserToGet,
            message_type=NotificationMessageType.APPROVE_CONTACT,
            message_channel=NotificationMessageChannel.EMAIL,
            destination_address=email,
            message_body=message_body,
        )
        phone_approve_data = await self.users_storage.get_phone_approve_data(user_id)
        if phone_approve_data.phone_approve_code is None:
            raise ValueError(f"Kод подтверждения не задан: {user_id=} {phone_approve_data=}")
        phone = await self.users_storage.get_user_phone(user_id)
        message_body = NG.get_contact_approve_message(
            phone_approve_data.phone_approve_code,
            NotificationMessageChannel.SMS,
        )
        await self.create_notification(
            user_id=user_id,
            entity_id=user_id,
            entity_type=UserToGet,
            message_type=NotificationMessageType.APPROVE_CONTACT,
            message_channel=NotificationMessageChannel.SMS,
            destination_address=phone,
            message_body=message_body,
        )
