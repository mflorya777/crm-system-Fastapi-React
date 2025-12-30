#!/usr/bin/env python

import argparse
import asyncio
import logging
import time
import schedule  # type: ignore

from src.clients.exchange_client import ExchangeClient
from src.clients.mongo.client import MClient
from src.model import AppConfig
from src.notifications.notifications_manager import NotificationManager
from src.notifications.notifications_storage import NotificationsStorage
from src.notifications.notifications_storage_models import (
    NotificationMessageToCreate,
    NotificationMessageChannel,
)

from src.users.users_storage import UsersStorage
from src.clients.telegram import TgClient


_LOG = logging.getLogger(__name__)

APP_CONFIG = AppConfig()
SENT_MESSAGE_DELAY_SECONDS = 1
FETCH_MESSAGES_TO_SEND_DELAY_SECONDS = 5
HEALTH_CHECK_DELAY_MINUTES = 5
M_CLIENT = MClient(APP_CONFIG.mongo_config)
E_CLIENT = ExchangeClient(APP_CONFIG.exchange_config)
NOTIFICATIONS_STORAGE = NotificationsStorage(M_CLIENT)
USERS_STORAGE = UsersStorage(M_CLIENT)
NOTIFICATIONS_MANAGER = NotificationManager(NOTIFICATIONS_STORAGE, USERS_STORAGE)

LOOP = asyncio.get_event_loop()
TG_CLIENT = TgClient(APP_CONFIG.telegram_config)


def _parse() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "-v",
        dest="log_level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Set the logging level",
    )
    parser.add_argument(
        "--run",
        action="store_true",
        help="Run the email notificator",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run the email once",
    )
    parser.add_argument(
        "--forever",
        action="store_true",
        help="Run the email forever",
    )
    return parser


def handle_message(message: NotificationMessageToCreate) -> None:
    _LOG.info(f"Отправка email: {message.id=} {message.destination_address=}")
    _LOG.info(f"{message.dict()}")
    LOOP.run_until_complete(
        NOTIFICATIONS_STORAGE.bump_attempt_notification(
            message.id,
        ),
    )
    result = False
    try:
        # Fixme: Проверка на то что email отправлен
        if message.destination_address.endswith("rzd.energy") and APP_CONFIG.stage != "prod":
            TG_CLIENT.send_file(message.body, to=message.destination_address)
            result = True
            _LOG.warning("Сообщение ушло через телеграм.")
        else:
            result = E_CLIENT.send_email(
                email_to=message.destination_address,
                subject="Уведомление от Энергопромсбыт",
                html_string=message.body,
            )
            _LOG.info(f"Результат отправки email {result=}")
    except Exception as e:
        error_message = f"Ошибка отправки email: {e}"
        _LOG.error(f"Ошибка отправки email: {e}")
        LOOP.run_until_complete(
            NOTIFICATIONS_STORAGE.add_error_to_notification(
                message.id,
                f"{error_message}",
            ),
        )
    if result:
        _LOG.info("Email отправлен")
        _LOG.info("Помечаю сообщение как отправлено.")
        LOOP.run_until_complete(
            NOTIFICATIONS_STORAGE.mark_notification_as_sent(message.id),
        )
    _LOG.info("Процессинг email закончен")


def handle_email_notifications() -> None:
    _LOG.info("Запрашиваю сообщения для отправки.")
    email_notifications = LOOP.run_until_complete(
        NOTIFICATIONS_MANAGER.get_notifications_to_send_for_channel(
            NotificationMessageChannel.EMAIL,
        ),
    )
    _LOG.info(f"Количество сообщений для отправки: {len(email_notifications)}")
    for email_notification in email_notifications:
        try:
            handle_message(email_notification)
        except Exception as e:
            _LOG.error(f"Ошибка обработки email: {e}")
            LOOP.run_until_complete(
                NOTIFICATIONS_STORAGE.add_error_to_notification(
                    email_notification.id,
                    f"{e}",
                ),
            )
        time.sleep(SENT_MESSAGE_DELAY_SECONDS)
    _LOG.info("Все сообщения отправлены.")


def _main(parser: argparse.ArgumentParser) -> None:
    args = parser.parse_args()
    logging.basicConfig(level=args.log_level)
    _LOG.info("Аргументы запуска:")
    _LOG.info(f"{args.run=}")
    _LOG.info(f"{args.once=}")
    _LOG.info(f"{args.forever=}")
    if args.run:
        # Запуск по расписанию
        if args.forever:
            schedule.every(FETCH_MESSAGES_TO_SEND_DELAY_SECONDS).seconds.do(
                handle_email_notifications,
            )
            schedule.every(HEALTH_CHECK_DELAY_MINUTES).minutes.do()
            while True:
                schedule.run_pending()
                time.sleep(1)
        # Запуск по расписанию
        elif args.once:
            handle_email_notifications()


if __name__ == "__main__":
    _main(_parse())
