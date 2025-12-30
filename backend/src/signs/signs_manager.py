import logging
from uuid import UUID

from src.misc.misc_lib import (
    utc_now,
    datetime_to_utc,
)
from src.notifications.notifications_manager import NotificationManager
from src.notifications.notifications_message_generator import NotificationsMessageGenerator
from src.notifications.notifications_storage_models import (
    NotificationMessageChannel,
    NotificationMessageType,
)
from src.users.users_storage import UsersStorage
from .signs_storage import SignsStorage
from .signs_storage_models import SignToCreate


_LOG = logging.getLogger("uvicorn.error")


class SignsManagerException(Exception):
    pass


class ExpiredSignError(Exception):
    pass


class SignAlreadyExistsError(Exception):
    pass


class SignsManager:
    def __init__(
        self,
        signs_storage: SignsStorage,
        notification_manager: NotificationManager,
        users_storage: UsersStorage,
    ):
        self.signs_storage: SignsStorage = signs_storage
        self.notification_manager: NotificationManager = notification_manager
        self.users_storage: UsersStorage = users_storage

    async def validate_sign(
        self,
        code: str,
        user_id: UUID,
        entity_id: UUID,
    ) -> bool:
        sign = await self.signs_storage.get_not_expired_sign(
            user_id=user_id,
            entity_id=entity_id,
        )
        _LOG.info(f"sign: {sign}")
        if not sign:
            raise ExpiredSignError("Время действия подписи истекло")

        if sign.code == code:
            await self.signs_storage.set_sign_used(
                sign.id,
                user_id,
            )
            return True
        return False

    async def request_new_form_sign(
        self,
        user_id: UUID,
        form_id: UUID,
    ) -> bool:
        sign: SignToCreate | None = await self.signs_storage.get_not_expired_sign(
            user_id=user_id,
            entity_id=form_id,
        )
        if sign:
            next_try_delta = datetime_to_utc(sign.ttl_expire_at) - utc_now()
            next_try_seconds = next_try_delta.seconds
            message = (
                f"Код подтверждения уже отправлен."
                f" Следующий запрос можно отправить через ({next_try_seconds}) секунд."
            )
            _LOG.warning(message)
            raise SignsManagerException(message)

        user = await self.users_storage.get(user_id)
        if not user:
            _LOG.error(f"Пользователь не найден: {user_id=}")
            raise SignsManagerException("Пользователь не найден")

        if user.is_backoffice_user:
            message_channel = NotificationMessageChannel.EMAIL
            destination_address = user.email

        else:
            message_channel = NotificationMessageChannel.SMS
            destination_address = user.phone
        result, reason = await self.notification_manager.check_notification_sent(
            user_id,
            form_id,
            NotificationMessageType.SIGN_FORM,
            message_channel,
        )
        if result:
            raise SignsManagerException(f"Не удалось создать подпись. {reason}")

        new_sign = await self.signs_storage.add(
            requested_by_id=user_id,
            entity_id=form_id,
        )
        if message_channel == NotificationMessageChannel.EMAIL:
            message_body = NotificationsMessageGenerator.get_sing_message(
                new_sign.code,
                NotificationMessageChannel.EMAIL,
            )
        elif message_channel == NotificationMessageChannel.SMS:
            message_body = NotificationsMessageGenerator.get_sing_message(
                new_sign.code,
                NotificationMessageChannel.SMS,
            )
        else:
            raise SignsManagerException(f"Неизвестный тип уведомления: {message_channel=}")

        await self.notification_manager.create_notification(
            user_id=user_id,
            entity_id=form_id,
            message_type=NotificationMessageType.SIGN_FORM,
            message_channel=message_channel,
            message_body=message_body,
            destination_address=destination_address,
        )
        return True
