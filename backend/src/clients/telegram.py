import requests

from src.model import TelegramConfig
from logging import getLogger
from io import BytesIO


_LOG = getLogger(__name__)


class TgClient:
    def __init__(
        self,
        tg_config: TelegramConfig,
    ):
        self.tg_config = tg_config
        self.token = tg_config.token
        self.chat_id = tg_config.chat_id

    def send_message(
        self,
        text: str,
        to: str | None = None,
    ):
        url = "https://api.telegram.org/bot%s/sendMessage?chat_id=%s&parse_mode=markdown" % (
            self.tg_config.token,
            self.chat_id,
        )
        message = text
        if to:
            message = f"Сообщение для {to}:\n{text}"
        result = requests.post(
            url,
            json={"text": message},
            timeout=10,
        )
        _LOG.info(result)
        _LOG.info(result.text)
        _LOG.info(result.json())

    def send_file(
        self,
        text: str,
        to: str | None = None,
    ):
        url = f"https://api.telegram.org/bot{self.tg_config.token}/sendDocument"

        message = BytesIO(text.encode('utf-8'))
        message.seek(0)
        result = requests.post(
            url,
            files={
                'document': (f'{to}.html', message),
            },
            data={
                'chat_id': self.tg_config.chat_id,
            },
            timeout=10
            )
        _LOG.info(result)
        _LOG.info(result.text)
        _LOG.info(result.json())
