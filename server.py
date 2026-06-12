import sqlite3
import database
import database_fs
import os
from fastapi import Depends, HTTPException, Header
import json
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import hashlib
import base64
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import Response


app = FastAPI()

ADMIN_SECRET_TOKEN = "SuperSecretAlphaKey_2026_ChangeMe" # Зміниш на щось складне

def verify_admin(admin_token: str = Header(None)):
    if admin_token != ADMIN_SECRET_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

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
    hwid: str = ""
    profiles: list = []
    team: str = "alpha"

class HeartbeatRequest(BaseModel):
    access_key: str = ""
    hwid: str = ""
    profiles: list = []
    team: str = "alpha"

class AdminConfigUpdateRequest(BaseModel):
    access_key: str
    team: str = "alpha"
    new_config: dict # JSON з новими інвайтами або налаштуваннями

class ConfigAppliedRequest(BaseModel):
    access_key: str
    hwid: str
    team: str = "alpha"


@app.post("/config_applied")
async def config_applied(request: ConfigAppliedRequest):
    """Очищає pending_config після того, як розширення успішно його застосувало"""
    key = request.access_key.replace('"', '').strip()
    hwid = request.hwid.strip()

    db = database_fs if request.team == "fs" else database

    # Обов'язково перевіряємо валідність ключа і HWID, щоб хтось чужий не скинув наказ
    success, message = db.verify_and_bind_key(key, hwid)

    if success:
        conn = db.get_connection()
        cursor = conn.cursor()

        # Обнуляємо колонку наказів
        cursor.execute(
            "UPDATE keys SET pending_config = NULL WHERE access_key = ?",
            (key,)
        )
        conn.commit()
        conn.close()

        return {"status": "success", "message": "Конфіг успішно застосовано та очищено"}

    return {"status": "error", "message": message}

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


@app.post("/heartbeat")
async def heartbeat(request: HeartbeatRequest):
    key = request.access_key.replace('"', '').strip()
    hwid = request.hwid.strip()

    db = database_fs if request.team == "fs" else database

    success, message = db.verify_and_bind_key(key, hwid)

    if success:
        db.update_profiles(key, request.profiles)

        # Перевіряємо, чи є нові накази від адміна
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT pending_config FROM keys WHERE access_key = ?", (key,))
        row = cursor.fetchone()
        conn.close()

        # Якщо наказ є - віддаємо його розширенню
        if row and row[0]:
            return {
                "status": "sync_required",
                "config": json.loads(row[0])
            }

        return {"status": "success"}

    if message == "Ключ заблоковано":
        return {"status": "banned", "message": message}

    return {"status": "error", "message": message}


# Додаємо параметр team зі стандартним значенням "alpha"
@app.get("/get_payload")
async def get_payload(key: str = "", session_id: str = "", hwid: str = "", team: str = "alpha"):
    key = key.replace('"', '').strip()
    hwid = hwid.strip()

    # ТУТ ТЕЖ ТРЕБА ВИБРАТИ БАЗУ! (Ось де ховалася помилка цілісності)
    db = database_fs if team == "fs" else database

    success, msg = db.verify_and_bind_key(key, hwid)
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


# ==========================================
# ADMIN API (Тільки для Vue.js)
# ==========================================

@app.get("/admin/keys")
async def get_admin_keys(team: str = "alpha", authorized: bool = Depends(verify_admin)):
    """Віддає всі ключі для таблиці у Vue"""
    db = database_fs if team == "fs" else database

    conn = db.get_connection()
    cursor = conn.cursor()
    # Витягуємо всі дані, включаючи поточні накази
    cursor.execute("SELECT access_key, hwid, is_banned, profiles, pending_config FROM keys")
    rows = cursor.fetchall()
    conn.close()

    keys_list = []
    for row in rows:
        keys_list.append({
            "access_key": row[0],
            "hwid": row[1],
            "is_banned": bool(row[2]),
            "profiles": json.loads(row[3]) if row[3] else [],
            "pending_config": json.loads(row[4]) if row[4] else None
        })

    return {"status": "success", "keys": keys_list}


@app.post("/admin/config")
async def update_user_config(request: AdminConfigUpdateRequest, authorized: bool = Depends(verify_admin)):
    """Записує новий наказ (інвайти/налаштування) для розширення"""
    db = database_fs if request.team == "fs" else database

    conn = db.get_connection()
    cursor = conn.cursor()

    config_json = json.dumps(request.new_config, ensure_ascii=False)

    cursor.execute(
        "UPDATE keys SET pending_config = ? WHERE access_key = ?",
        (config_json, request.access_key)
    )
    conn.commit()
    conn.close()

    return {"status": "success", "message": f"Наказ для {request.access_key} збережено"}