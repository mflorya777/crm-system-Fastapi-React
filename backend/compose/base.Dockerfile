# Базовый образ
FROM python:3.12-slim AS base

# Обновление пакетов
RUN apt-get update && apt-get install -y \
    build-essential \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
