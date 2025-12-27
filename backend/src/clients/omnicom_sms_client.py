#!/usr/bin/env python

from src.model import OmnicomConfig
import requests


class OmnicomSmsClient:
    def __init__(self, config: OmnicomConfig):
        self.sadr = config.sadr
        self.user = config.user
        self.pwd = config.pwd
        self.api_url = "https://gateway.api.sc"

    def send_sms(
        self,
        phone_to: str,
        message_string: str,
    ) -> bool:
        url = f"{self.api_url}/get"
        phone_to_reformated = phone_to.replace("tel:", "").replace(
            "+", "").replace("-", "")
        params = {
            "sadr": self.sadr,
            "dadr": phone_to_reformated,
            "pwd": self.pwd,
            "user": self.user,
            "text": message_string,
        }
        response = requests.get(
            url,
            params=params,
            timeout=5,
        )
        print(response.text)
        if response.status_code == 200 and response.text.isalnum():
            return True
        else:
            return False
