import datetime as dt
import re

from random import random
import pytz  # type: ignore
import logging


_LOG = logging.getLogger("uvicorn.info")

MOSCOW_TZ = pytz.timezone("Europe/Moscow")
UTC_TZ = pytz.timezone("UTC")


def is_valid_time_format(
    time_str,
):
    """
    Проверка, что строка имеет формат HH:MM или HH:MM:SS.
    """

    return re.match(
        r"^\d{2}:\d{2}$",
        time_str,
    )


def moscow_now() -> dt.datetime:
    """
    Возвращает текущую дату и время в часовом поясе Москвы.
    """

    return dt.datetime.now(
        MOSCOW_TZ,
    )


def utc_now() -> dt.datetime:
    """
    Возвращает текущую дату и время в часовом поясе UTC.
    """

    return dt.datetime.now(
        dt.UTC,
    )


def generate_random_approve_code():
    """
    Генерирует четырёхзначный код подтверждения из случайного числа.
    """

    return str(
        random()
    ).split(".")[1][:4]  # noqa


def datetime_to_utc(
    t: dt.datetime,
) -> dt.datetime:
    """
    Приводит локальное значение datetime к UTC с установкой таймзоны.
    """

    return UTC_TZ.localize(
        t,
    )


def datetime_to_moscow(
    t: dt.datetime,
) -> dt.datetime:
    """
    Переводит время из UTC в часовую зону Москвы.
    """

    return datetime_to_utc(
        t,
    ).astimezone(
        MOSCOW_TZ,
    )


def dataetime_utc_to_moscow(
    time: dt.datetime,
) -> dt.datetime:
    """
    Конвертирует UTC datetime в московский часовой пояс
    без смены календарной даты.
    """

    return time.astimezone(
        MOSCOW_TZ,
    )


def datetime_to_moscow_proper_date_time(
    time: dt.datetime | None,
) -> str:
    """
    Форматирует datetime в строку 'дд.мм.гггг чч:мм'
    по времени Москвы.
    """

    if time is None:
        return "Не указано"

    return datetime_to_moscow(
        time,
    ).strftime(
        "%d.%m.%Y %H:%M",
    )


def datetime_to_moscow_proper_date(
    time: dt.datetime | dt.date,
) -> str:
    """
    Форматирует дату или datetime в строку 'дд.мм.гггг'
    с учётом часового пояса Москвы.
    """

    if time is None:
        return "Не указано"

    if isinstance(time, str):
        try:
            time = dt.datetime.fromisoformat(time)
        except ValueError:
            return "Не указано"

    if isinstance(time, dt.date):
        return time.strftime("%d.%m.%Y")

    return datetime_to_moscow(
        time,
    ).strftime(
        "%d.%m.%Y",
    )


def date_to_moscow_inverted_date(
    entry_date: dt.datetime | dt.date,
) -> str:
    """
    Форматирует дату или datetime в строку 'гггг.мм.дд'
    для московского часового пояса.
    """

    if entry_date is None:
        return "Не указано"

    if isinstance(entry_date, str):
        try:
            entry_date = dt.datetime.fromisoformat(entry_date)
        except ValueError:
            return "Не указано"

    if isinstance(entry_date, dt.date):
        return entry_date.strftime("%Y-%m-%d")

    return datetime_to_moscow(
        entry_date,
    ).strftime(
        "%Y.%m.%d",
    )


def normalize_date_from_str(
    value: str,
    end_of_day: bool = False,
) -> str:
    """
    Приводит входную дату к ISO `YYYY-MM-DDTHH:MM:SS` без изменения типа.
    """
    if not value:
        return value

    if "T" in value:
        return value

    try:
        dt_obj = dt.datetime.strptime(value, "%d.%m.%Y")
        if end_of_day:
            dt_obj = dt_obj.replace(hour=23, minute=59, second=59)
        return dt_obj.isoformat(timespec="seconds")
    except Exception:
        _LOG.warning(f"Не удалось распарсить дату '{value}', передаем как есть")
        return value


def moscow_date_str() -> str:
    """
    Возвращает текущую дату в Москве формата 'дд.мм.гггг'.
    """

    return moscow_now().strftime(
        "%d.%m.%Y",
    )


def proper_phone_number(
    phone: str | None,
) -> str:
    """
    Приводит телефон к формату '+7 (XXX) XXX-XX-XX'
    или возвращает 'Не указано'.
    """

    if not phone:
        return "Не указано"

    digits = re.sub(
        r"\D",
        "",
        phone,
    )

    if digits.startswith("8"):
        digits = "7" + digits[1:]

    if len(digits) == 11 and digits.startswith("7"):
        return f"+7 ({digits[1:4]}) {digits[4:7]}-{digits[7:9]}-{digits[9:11]}"

    return "Не указано"


def get_extenison_by_filename(
    file_name: str,
) -> str:
    if not file_name:
        return "bin"
    return file_name.split(".")[-1]


class SubscriptableMeta(type):

    def __getitem__(
        self,
        item,
    ):
        return self.__dict__[item]
