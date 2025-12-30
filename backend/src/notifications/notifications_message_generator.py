import logging

from jinja2 import (
    Environment,
    select_autoescape,
    FileSystemLoader,
)

from src.misc.misc_lib import (
    datetime_to_moscow_proper_date,
    proper_phone_number,
    moscow_date_str,
)
from src.notifications.notifications_storage_models import (
    NotificationMessageChannel,
)


env = Environment(
    loader=FileSystemLoader(["src/notifications/templates"]),
    autoescape=select_autoescape(),
)

_LOG = logging.getLogger("uvicorn.info")

env.filters['datetime_to_moscow_proper_date'] = datetime_to_moscow_proper_date
env.filters['proper_phone_number'] = proper_phone_number
env.globals["moscow_date_str"] = moscow_date_str


class NotificationsMessageGenerator:
    @staticmethod
    def get_contact_approve_message(
        verification_code: str,
        notification_channel: NotificationMessageChannel,
    ) -> str:
        match notification_channel:
            case NotificationMessageChannel.EMAIL:
                tpl = env.get_template("email/email_approve.html")
            case NotificationMessageChannel.SMS:
                tpl = env.get_template("sms/phone_approve.j2")
            case _:
                raise ValueError(f"Канал не поддерживается: {notification_channel}")
        return tpl.render(verification_code=verification_code)

    @staticmethod
    def get_sing_message(
        document_number: str,
        verification_code: str,
        notification_channel: NotificationMessageChannel,
    ) -> str:
        match notification_channel:
            case NotificationMessageChannel.EMAIL:
                tpl = env.get_template("email/sign.html")
            case NotificationMessageChannel.SMS:
                tpl = env.get_template("sms/sign.j2")
            case _:
                raise ValueError(f"Канал не поддерживается: {notification_channel}")
        return tpl.render(
            document_number=document_number,
            verification_code=verification_code,
        )

    @staticmethod
    def get_appeal_owner_message_on_new_appeal(appeal_number: str) -> str:
        message = env.get_template("sms/new_appeal.j2").render(
            appeal_number=appeal_number,
        )
        return message

    @staticmethod
    def get_executor_message_on_new_appeal(appeal_number: str) -> str:
        message = env.get_template("email/new_appeal.html").render(
            appeal_number=appeal_number,
        )
        return message

    @staticmethod
    def get_appeal_owner_message_on_appeal_resolved(appeal_number: str) -> str:
        message = env.get_template("sms/appeal_resolved.j2").render(
            appeal_number=appeal_number,
        )
        return message

    @staticmethod
    def get_executor_message_on_appeal_resolved(appeal_number: str) -> str:
        message = env.get_template("email/appeal_resolved.html").render(
            appeal_number=appeal_number,
        )
        return message

    @staticmethod
    def get_backoffice_message_on_executor_change(document_number: str) -> str:
        message = env.get_template("email/change_executor.html").render(
            document_number=document_number,
        )
        return message
