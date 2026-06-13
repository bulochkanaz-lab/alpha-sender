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
SMART_SEARCH_PATH = os.path.join(BASE_DIR, "smart_search.js")

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

class InviteAnalyticsLogRequest(BaseModel):
    access_key: str
    invite_text: str
    action: str  # "sent" або "reply"
    team: str = "alpha"

class HeartbeatRequest(BaseModel):
    access_key: str = ""
    hwid: str = ""
    profiles: list = []
    team: str = "alpha"
    stats_invites: int = 0  # <--- Додали лічильник інвайтів
    stats_letters: int = 0  # <--- Додали лічильник листів

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

    db = database_fs if request.team == "fs" else database

    success, message = db.verify_and_bind_key(key, hwid)
    if success:
        return {"status": "success", "message": message}
    return {"status": "error", "message": message}


@app.post("/heartbeat")
async def heartbeat(request: HeartbeatRequest):
    print(
        f"[ДЕБАГ] Пінг від {request.access_key}: Інвайти={request.stats_invites}, Листи={request.stats_letters}")  # <--- ДОДАЙ ЦЕ

    key = request.access_key.replace('"', '').strip()
    # ... далі твій код ...
    hwid = request.hwid.strip()

    db = database_fs if request.team == "fs" else database

    success, message = db.verify_and_bind_key(key, hwid)

    if success:
        db.update_profiles(key, request.profiles)

        # --- ОНОВЛЕННЯ СТАТИСТИКИ ТА ПІНГУ ---
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE keys SET stats_invites = ?, stats_letters = ?, last_ping = CURRENT_TIMESTAMP WHERE access_key = ?",
            (request.stats_invites, request.stats_letters, key)
        )
        conn.commit()
        # -----------------------------------

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


@app.get("/get_payload")
async def get_payload(key: str = "", session_id: str = "", hwid: str = "", team: str = "alpha"):
    key = key.replace('"', '').strip()
    hwid = hwid.strip()

    db = database_fs if team == "fs" else database

    success, msg = db.verify_and_bind_key(key, hwid)
    if success:
        try:
            if team == "fs":
                current_payload_path = os.path.join(BASE_DIR, "payload-fs.js")
            else:
                current_payload_path = os.path.join(BASE_DIR, "payload.js")

            with open(SMART_SEARCH_PATH, "r", encoding="utf-8") as f_search:
                smart_search_js = f_search.read()

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
    aes_key = hashlib.sha256(key.encode()).digest()
    aesgcm = AESGCM(aes_key)
    nonce = os.urandom(12)  # Унікальний вектор ініціалізації

    ct = aesgcm.encrypt(nonce, payload.encode('utf-8'), None)
    return base64.b64encode(nonce + ct).decode('utf-8')


@app.post("/api/analytics/log_invite")
async def log_invite(request: InviteAnalyticsLogRequest):
    key = request.access_key.replace('"', '').strip()
    db = database_fs if request.team == "fs" else database

    # Захист від порожніх текстів
    if not request.invite_text.strip():
        return {"status": "error", "message": "Текст порожній"}

    conn = db.get_connection()
    cursor = conn.cursor()

    try:
        if request.action == "sent":
            # Якщо тексту ще немає — створюємо із sent_count=1. Якщо є — плюсуємо 1.
            cursor.execute("""
                INSERT INTO invite_analytics (access_key, invite_text, sent_count, reply_count)
                VALUES (?, ?, 1, 0)
                ON CONFLICT(access_key, invite_text) 
                DO UPDATE SET sent_count = sent_count + 1
            """, (key, request.invite_text.strip()))

        elif request.action == "reply":
            # Якщо прийшла відповідь, плюсуємо в reply_count
            cursor.execute("""
                INSERT INTO invite_analytics (access_key, invite_text, sent_count, reply_count)
                VALUES (?, ?, 0, 1)
                ON CONFLICT(access_key, invite_text) 
                DO UPDATE SET reply_count = reply_count + 1
            """, (key, request.invite_text.strip()))

        conn.commit()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

# ==========================================
# ADMIN API (Тільки для Vue.js)
# ==========================================

@app.get("/admin/keys")
async def get_admin_keys(team: str = "alpha", authorized: bool = Depends(verify_admin)):
    db = database_fs if team == "fs" else database

    conn = db.get_connection()
    cursor = conn.cursor()

    # 1. Отримуємо користувачів
    cursor.execute(
        "SELECT access_key, hwid, is_banned, profiles, pending_config, stats_invites, stats_letters, last_ping FROM keys")
    rows = cursor.fetchall()

    keys_list = []
    for index, row in enumerate(rows, start=1):
        user_key = row[0]

        # 2. Для кожного користувача дістаємо його аналітику інвайтів
        cursor.execute("""
            SELECT invite_text, sent_count, reply_count 
            FROM invite_analytics 
            WHERE access_key = ?
            ORDER BY reply_count DESC
        """, (user_key,))
        analytics_rows = cursor.fetchall()

        invite_analytics = []
        for a_row in analytics_rows:
            sent = a_row[1] or 0
            replied = a_row[2] or 0
            # Рахуємо конверсію відсотках
            conversion = round((replied / sent) * 100, 1) if sent > 0 else 0

            invite_analytics.append({
                "text": a_row[0],
                "sent": sent,
                "replied": replied,
                "conversion": conversion
            })

        keys_list.append({
            "id": index,
            "access_key": user_key,
            "hwid": row[1],
            "balance": 0,
            "is_banned": bool(row[2]),
            "profiles": json.loads(row[3]) if row[3] else [],
            "pending_config": json.loads(row[4]) if row[4] else None,
            "stats_invites": row[5] or 0,
            "stats_letters": row[6] or 0,
            "last_ping": row[7],
            "invite_analytics": invite_analytics  # <--- Передаємо масив з топом інвайтів у Vue
        })

    conn.close()
    return {"status": "success", "keys": keys_list}


@app.get("/admin/global_stats")
async def get_global_stats(team: str = "alpha", authorized: bool = Depends(verify_admin)):
    """Віддає топ найефективніших інвайтів по всій команді"""
    db = database_fs if team == "fs" else database

    conn = db.get_connection()
    cursor = conn.cursor()

    # Групуємо всі записи за текстом, сумуємо відправки та відповіді
    cursor.execute("""
        SELECT invite_text, SUM(sent_count), SUM(reply_count)
        FROM invite_analytics 
        GROUP BY invite_text
        ORDER BY SUM(reply_count) DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    global_stats = []
    for row in rows:
        sent = row[1] or 0
        replied = row[2] or 0
        conversion = round((replied / sent) * 100, 1) if sent > 0 else 0

        global_stats.append({
            "text": row[0],
            "sent": sent,
            "replied": replied,
            "conversion": conversion
        })

    return {"status": "success", "stats": global_stats}

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


# ==========================================
# ШВИДКІ ДІЇ (Quick Actions)
# ==========================================

class AdminActionRequest(BaseModel):
    access_key: str
    team: str = "alpha"


@app.post("/admin/toggle_ban")
async def toggle_ban(request: AdminActionRequest, authorized: bool = Depends(verify_admin)):
    """Блокує або розблоковує користувача (перемикач)"""
    db = database_fs if request.team == "fs" else database
    conn = db.get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT is_banned FROM keys WHERE access_key = ?", (request.access_key,))
    row = cursor.fetchone()

    if row is not None:
        new_status = 0 if row[0] else 1  # Якщо був 1 (бан), ставимо 0. Якщо був 0, ставимо 1.
        cursor.execute("UPDATE keys SET is_banned = ? WHERE access_key = ?", (new_status, request.access_key))
        conn.commit()
        action_str = "заблоковано" if new_status else "розблоковано"
        message = f"Ключ {request.access_key} успішно {action_str}"
    else:
        message = "Ключ не знайдено"

    conn.close()
    return {"status": "success", "message": message}


@app.post("/admin/reset_hwid")
async def reset_hwid(request: AdminActionRequest, authorized: bool = Depends(verify_admin)):
    """Скидає прив'язку до комп'ютера (HWID)"""
    db = database_fs if request.team == "fs" else database
    conn = db.get_connection()
    cursor = conn.cursor()

    cursor.execute("UPDATE keys SET hwid = NULL WHERE access_key = ?", (request.access_key,))
    conn.commit()
    conn.close()

    return {"status": "success", "message": f"HWID для {request.access_key} скинуто"}


@app.post("/admin/delete_key")
async def delete_key(request: AdminActionRequest, authorized: bool = Depends(verify_admin)):
    """Повністю видаляє ключ із бази"""
    db = database_fs if request.team == "fs" else database
    conn = db.get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM keys WHERE access_key = ?", (request.access_key,))
    conn.commit()
    conn.close()

    return {"status": "success", "message": f"Ключ {request.access_key} назавжди видалено"}