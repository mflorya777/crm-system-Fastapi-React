from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import (
    List,
    Optional,
)
from datetime import datetime


# Создаем экземпляр FastAPI приложения
app = FastAPI(
    title="CRM System API",
    description="API для CRM системы",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url=None,  # ReDoc альтернативная документация
)

# Настройка CORS для работы с фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic модели для валидации данных
class HealthResponse(BaseModel):
    """Модель ответа для health check"""
    status: str
    timestamp: datetime


class MessageResponse(BaseModel):
    """Модель ответа с сообщением"""
    message: str


class UserCreate(BaseModel):
    """Модель для создания пользователя"""
    name: str
    email: str
    age: Optional[int] = None


class UserResponse(BaseModel):
    """Модель ответа с данными пользователя"""
    id: int
    name: str
    email: str
    age: Optional[int] = None
    created_at: datetime


users_db: List[UserResponse] = []
user_counter = 1


@app.get("/", response_model=MessageResponse)
async def root():
    """
    Корневой эндпоинт
    """
    return MessageResponse(message="Добро пожаловать в CRM System API!")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Проверка здоровья приложения
    """
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(),
    )


@app.get("/users", response_model=List[UserResponse])
async def get_users():
    """
    Получить список всех пользователей
    """
    return users_db


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    """
    Получить пользователя по ID
    """
    user = next((u for u in users_db if u.id == user_id), None)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    """
    Создать нового пользователя
    """
    global user_counter
    new_user = UserResponse(
        id=user_counter,
        name=user.name,
        email=user.email,
        age=user.age,
        created_at=datetime.now(),
    )
    users_db.append(new_user)
    user_counter += 1
    return new_user


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )
