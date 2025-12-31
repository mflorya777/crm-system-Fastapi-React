# crm-system

```commandline
cd backend
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000

Строка подключения в mongodb: mongodb://localhost:27017/crm-fastapi

Проверка Swagger:
После запуска откройте в браузере:
Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc
API корень: http://localhost:8000/
В Swagger UI можно:
Просмотреть все эндпоинты
Протестировать API прямо в браузере
Увидеть схемы данных
```

Crm-system — это CRM-система, которая ...

## Ключевые аспекты проекта

## Локальная разработка

1. Использование версии питона 3.12

2. Установить зависимости проекта.
   ```
   pip install -r requirements.txt
   ```

3. Заполнить свои env файлы нужными переменными.
    ```
   local.env
   prod.env
   ```

4. Экспортировать переменные окружения в текущую оболочку.
    ```bash
   source load_env_file.sh local.env
    ```

5. Сбилдить имедж

6. Запуск

7. Другой способ локального запуска.
   ```
   cd src
   ```
   ```
   python manage.py runserver
   ```

# Development

## Создать .env файл для локальной разработки

1. --

## Запустить проект локально

1. --
2. --

## Запустить тесты

1. --
2. --

## Запустить линтеры

1. --
2. --
3. --
