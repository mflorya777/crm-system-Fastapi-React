#!/usr/bin/env python

from exchangelib import (
    Credentials,
    Account,
    Message,
    Mailbox,
    HTMLBody,
)
from src.model import ExchangeConfig


class ExchangeClient:
    def __init__(self, config: ExchangeConfig):
        self.credentials = Credentials(
            config.login,
            config.password,
        )
        self.account = Account(
            config.email,
            credentials=self.credentials,
            autodiscover=True,
        )

    def send_email(
        self,
        email_to: str,
        subject: str,
        html_string: str,
    ) -> bool:
        m = Message(
            account=self.account,
            subject=subject,
            body=HTMLBody(html_string),
            to_recipients=[
                Mailbox(email_address=email_to),
            ],
        )
        return m.send()
