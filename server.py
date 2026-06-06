import sqlite3
import database
import database_fs
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import hashlib
import base64
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import Response


app = FastAPI()

# Абсолютні шляхи - це наш захист від того, що сервер "забуде" де файли
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PAYLOAD_PATH = os.path.join(BASE_DIR, "payload.js")
SMART_SEARCH_PATH = os.path.join(BASE_DIR, "smart_search.js") # ДОДАЛИ ЦЕЙ РЯДОК

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AuthRequest(BaseModel):
    access_key: str = ""
    session_id: str = "default_sess"
    hwid: str = ""  # ДОДАНО HWID
    profiles: list = []

class AuthRequest(BaseModel):
    access_key: str = ""
    session_id: str = "default_sess"
    hwid: str = ""
    profiles: list = []
    team: str = "alpha" # ДОДАЛИ

class HeartbeatRequest(BaseModel):
    access_key: str = ""
    hwid: str = ""
    profiles: list = []
    team: str = "alpha" # ДОДАЛИ


@app.post("/auth")
async def authenticate(request: AuthRequest):
    key = request.access_key.replace('"', '').strip()
    hwid = request.hwid.strip()

    # ВИБИРАЄМО БАЗУ:
    db = database_fs if request.team == "fs" else database

    success, message = db.verify_and_bind_key(key, hwid)
    if success:
        return {"status": "success", "message": message}
    return {"status": "error", "message": message}


class HeartbeatRequest(BaseModel):
    access_key: str = ""
    hwid: str = ""
    profiles: list = []


@app.post("/heartbeat")
async def heartbeat(request: HeartbeatRequest):
    key = request.access_key.replace('"', '').strip()
    hwid = request.hwid.strip()

    # ВИБИРАЄМО БАЗУ:
    db = database_fs if request.team == "fs" else database

    success, message = db.verify_and_bind_key(key, hwid)

    if success:
        db.update_profiles(key, request.profiles)
        return {"status": "success"}

    if message == "Ключ заблоковано":
        return {"status": "banned", "message": message}

    return {"status": "error", "message": message}


# Додаємо параметр team зі стандартним значенням "alpha"
@app.get("/get_payload")
async def get_payload(key: str = "", session_id: str = "", hwid: str = "", team: str = "alpha"):
    key = key.replace('"', '').strip()
    hwid = hwid.strip()

    success, msg = database.verify_and_bind_key(key, hwid)
    if success:
        try:
            # Визначаємо, який файл брати залежно від команди
            if team == "fs":
                current_payload_path = os.path.join(BASE_DIR, "payload-fs.js")
            else:
                current_payload_path = os.path.join(BASE_DIR, "payload.js")

            # Читаємо smart_search.js (він спільний для всіх)
            with open(SMART_SEARCH_PATH, "r", encoding="utf-8") as f_search:
                smart_search_js = f_search.read()

            # Читаємо потрібний payload
            with open(current_payload_path, "r", encoding="utf-8") as f_payload:
                main_payload_js = f_payload.read()

            raw_js = smart_search_js + "\n\n" + main_payload_js

            encrypted_js = encrypt_payload(raw_js, key)
            return Response(content=encrypted_js, media_type="text/plain")

        except Exception as e:
            # Тепер ми побачимо причину помилки в логах сервера
            print(f"[ERROR] Помилка читання або шифрування файлів: {e}")
            return Response(content="console.error('Payload error');", media_type="application/javascript")

    return Response(content="console.error('Access Denied');", media_type="application/javascript")


def encrypt_payload(payload: str, key: str) -> str:
    # Створюємо 32-байтний ключ з access_key для AES-256
    aes_key = hashlib.sha256(key.encode()).digest()
    aesgcm = AESGCM(aes_key)
    nonce = os.urandom(12)  # Унікальний вектор ініціалізації

    # Шифруємо і об'єднуємо з nonce
    ct = aesgcm.encrypt(nonce, payload.encode('utf-8'), None)
    return base64.b64encode(nonce + ct).decode('utf-8')