import sqlite3
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import Response


app = FastAPI()

# Абсолютні шляхи - це наш захист від того, що сервер "забуде" де файли
DB_PATH = "/root/alpha/admin_panel.db"
PAYLOAD_PATH = "/root/alpha/payload.js"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Спрощена модель для прийому будь-яких даних від завантажувача
class AuthRequest(BaseModel):
    access_key: str = ""
    from pydantic import Field

    profiles: list = Field(default_factory=list)
    session_id: str = "default_sess"


import database


@app.post("/auth")
async def authenticate(request: AuthRequest):
    # Очищаємо ключ від лапок
    key = request.access_key.replace('"', '').strip()

    # Викликаємо перевірку з database.py (яку ми перепишемо в наступному кроці)
    # Поки що припускаємо, що функція повертає True/False
    if database.check_key(key):
        try:
            with open(PAYLOAD_PATH, "r", encoding="utf-8") as f:
                return {"status": "success", "code": f.read()}
        except Exception as e:
            return {"status": "error", "message": "Файл payload не знайдено"}

    return {"status": "error", "message": "Невірний ключ"}


@app.get("/get_payload")
async def get_payload(key: str = ""):
    key = key.replace('"', '').strip()

    if database.check_key(key):
        try:
            with open(PAYLOAD_PATH, "r", encoding="utf-8") as f:
                return Response(content=f.read(), media_type="application/javascript")
        except Exception:
            return Response(content="console.error('Payload missing');", media_type="application/javascript")

    return Response(content="console.error('Access Denied');", media_type="application/javascript")