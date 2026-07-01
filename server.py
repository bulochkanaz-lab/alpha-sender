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
from typing import Optional
from fastapi import Header

app = FastAPI()

ADMIN_SECRET_TOKEN = "MxO0JkLprocFIdot666mENetVicrojsdep76AIOBUSERMONSTERglith3000ShoterL"

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
    hwid: str = ""           # 👈 Для старих клієнтів
    session_token: str = ""  # 👈 Для нових клієнтів
    profiles: list = []
    team: str = "alpha"

# ==========================================
# ОНОВЛЕНА МОДЕЛЯ АНАЛІТИКИ (ПРАВИЛЬНА І ЄДИНА)
# ==========================================
class InviteAnalyticsLogRequest(BaseModel):
    access_key: str
    invite_text: str = ""
    action: str
    chat_uid: str = ""
    team: str = "alpha"
    profile_id: str = "" # ID мужика
    woman_id: str = ""   # ID анкети
    lead_age: int = 0
    lead_country: str = ""
    lead_interests: str = ""
    lead_bio: str = ""
    lead_photo: str = ""
    man_profile_json: str = "{}"
    woman_profile_json: str = None # Опціональне поле!


class StealthLogRequest(BaseModel):
    access_key: str
    team: str = "alpha"
    payload: str  # Тут лежить наш зашифрований Base64 рядок


def decrypt_payload(encrypted_b64: str, key: str) -> str:
    """Розшифровує дані від розширення (AES-GCM)"""
    data = base64.b64decode(encrypted_b64)
    nonce = data[:12]  # Перші 12 байт - це вектор ініціалізації
    ct = data[12:]  # Все інше - зашифрований текст

    aes_key = hashlib.sha256(key.encode()).digest()
    aesgcm = AESGCM(aes_key)

    return aesgcm.decrypt(nonce, ct, None).decode('utf-8')

class HeartbeatRequest(BaseModel):
    access_key: str = ""
    hwid: str = ""           # 👈
    session_token: str = ""  # 👈
    profiles: list = []
    team: str = "alpha"
    stats_invites: int = 0
    stats_letters: int = 0

class AdminConfigUpdateRequest(BaseModel):
    access_key: str
    team: str = "alpha"
    new_config: dict # JSON з новими інвайтами або налаштуваннями

class ConfigAppliedRequest(BaseModel):
    access_key: str
    session_token: str
    team: str = "alpha"


@app.post("/config_applied")
async def config_applied(request: ConfigAppliedRequest):
    key = request.access_key.replace('"', '').strip()
    session_token = request.session_token.strip()

    db = database_fs if request.team == "fs" else database

    success, message = db.verify_session(key, session_token)

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
    db = database_fs if request.team == "fs" else database

    # 🔥 Гібридна логіка
    if request.session_token:
        success, message = db.login_and_update_session(key, request.session_token.strip())
    else:
        success, message = db.verify_and_bind_key(key, request.hwid.strip())

    if success:
        return {"status": "success", "message": message}
    return {"status": "error", "message": message}


@app.post("/heartbeat")
async def heartbeat(request: HeartbeatRequest):
    key = request.access_key.replace('"', '').strip()
    db = database_fs if request.team == "fs" else database

    # 🔥 Гібридна логіка
    if request.session_token:
        success, message = db.verify_session(key, request.session_token.strip())
    else:
        success, message = db.verify_and_bind_key(key, request.hwid.strip())

    if success:
        db.update_profiles(key, request.profiles)

        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE keys SET stats_invites = ?, stats_letters = ?, last_ping = CURRENT_TIMESTAMP WHERE access_key = ?",
            (request.stats_invites, request.stats_letters, key)
        )
        conn.commit()

        cursor.execute("SELECT pending_config FROM keys WHERE access_key = ?", (key,))
        row = cursor.fetchone()
        conn.close()

        if row and row[0]:
            return {
                "status": "sync_required",
                "config": json.loads(row[0])
            }

        return {"status": "success"}

    if message == "Ключ заблоковано":
        return {"status": "banned", "message": message}

    return {"status": "session_expired", "message": message}


@app.get("/get_payload")
async def get_payload(key: str = "", hwid: str = "", session_token: str = "", team: str = "alpha"):
    key = key.replace('"', '').strip()
    db = database_fs if team == "fs" else database

    # 🔥 Гібридна логіка
    if session_token:
        success, msg = db.verify_session(key, session_token.strip())
    else:
        success, msg = db.verify_and_bind_key(key, hwid.strip())

    if not success:
        return Response(
            content=json.dumps({"status": "error", "message": msg}),
            media_type="application/json",
            status_code=401
        )

    try:
        # Уніфікуємо для обох команд
        modules = [
            "smart_search.js",
            "bday_radar.js",
            "core.js",
            "api.js",
            "ui.js",
            "sender.js",
            "radar.js"
        ]
        # Якщо треба виключити щось специфічне для fs, зроби це тут

        # 🔥 СТВОРЮЄМО ФАНТОМА ДО ЗАВАНТАЖЕННЯ ІНШИХ МОДУЛІВ
        raw_js = """
if (!window._alphaPhantom) {
    Object.defineProperty(window, '_alphaPhantom', {
        value: {}, enumerable: false, writable: true
    });
}
"""
        for module in modules:
            file_path = os.path.join(BASE_DIR, module)
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    raw_js += f"\n\n// ==========================================\n"
                    raw_js += f"// --- MODULE: {module} ---\n"
                    raw_js += f"// ==========================================\n\n"
                    raw_js += f.read()
            else:
                print(f"[УВАГА] Файл модуля не знайдено: {module}")

            # ==========================================
            # 🔥 ЦЕЙ БЛОК ТЕПЕР ПОЗА ЦИКЛОМ ТА ПОЗА ELSE
            # ==========================================
            # 🛡️ БЕЗПЕЧНА ОБГОРТКА ТА ШИФРУВАННЯ
        stealth_js = "(function() {\n" + raw_js + "\n})();"

        # ПРИМУСОВИЙ ЗАПИС У ТВОЮ ПАПКУ (Загорнуто в try для безпеки)
        try:
            with open("/root/alpha_test/debug_payload.js", "w", encoding="utf-8") as f:
                f.write(stealth_js)
        except Exception as file_err:
            print(f"[DEBUG] Не вдалося зберегти дебаг-файл: {file_err}")

        encrypted_js = encrypt_payload(stealth_js, key)

        return Response(content=encrypted_js, media_type="text/plain")

    except Exception as e:
        print(f"[ERROR] Помилка збірки пейлоаду: {e}")
        # 🛑 ПРАВИЛЬНА ОБРОБКА ВНУТРІШНЬОЇ ПОМИЛКИ (HTTP 500)
        return Response(
            content=json.dumps({"status": "error", "message": "Internal Server Error"}),
            media_type="application/json",
            status_code=500
        )


def encrypt_payload(payload: str, key: str) -> str:
    aes_key = hashlib.sha256(key.encode()).digest()
    aesgcm = AESGCM(aes_key)
    nonce = os.urandom(12)  # Унікальний вектор ініціалізації

    ct = aesgcm.encrypt(nonce, payload.encode('utf-8'), None)
    return base64.b64encode(nonce + ct).decode('utf-8')


@app.post("/api/v2/met")
async def log_invite(stealth_req: StealthLogRequest):
    key = stealth_req.access_key.replace('"', '').strip()
    db = database_fs if stealth_req.team == "fs" else database

    # --- 1. ЗНІМАЄМО ШИФРУВАННЯ ---
    try:
        decrypted_json_str = decrypt_payload(stealth_req.payload, key)
        parsed_data = json.loads(decrypted_json_str)

        # Перетворюємо розшифрований JSON назад у нашу зручну модель
        request = InviteAnalyticsLogRequest(**parsed_data)
    except Exception as e:
        print(f"❌ Помилка розшифровки або злий хакер: {e}")
        return {"status": "error", "message": "Invalid secure payload"}

    # --- 2. СТАРА ЛОГІКА ЗБЕРЕЖЕННЯ ---
    conn = db.get_connection()
    cursor = conn.cursor()

    try:
        if request.action == "sent" and request.invite_text.strip():
            new_text = request.invite_text.strip()

            # За замовчуванням створюємо масив з одним (першим) повідомленням
            final_text_list = [new_text]

            if request.chat_uid:
                # 1. Шукаємо, чи є вже квиток (чи це добивка?)
                cursor.execute("SELECT invite_text FROM pending_invites WHERE chat_uid = ?", (request.chat_uid,))
                row = cursor.fetchone()

                if row:
                    old_text_raw = row[0]
                    try:
                        # Пробуємо прочитати старий текст як JSON-масив
                        old_list = json.loads(old_text_raw)
                        if isinstance(old_list, list):
                            old_list.append(new_text)
                            final_text_list = old_list
                        else:
                            # Якщо там чомусь був звичайний рядок
                            final_text_list = [str(old_list), new_text]
                    except json.JSONDecodeError:
                        # Захист: якщо в базі застряг старий формат (не JSON)
                        final_text_list = [old_text_raw, new_text]

                    # Віднімаємо 1 бал відправки у старого списку
                    cursor.execute("""
                        UPDATE invite_analytics 
                        SET sent_count = MAX(0, sent_count - 1) 
                        WHERE access_key = ? AND invite_text = ?
                    """, (key, old_text_raw))

            # 🔥 ПЕРЕТВОРЮЄМО СПИСОК НА JSON-РЯДОК ДЛЯ БАЗИ 🔥
            final_text_to_log = json.dumps(final_text_list, ensure_ascii=False)

            # 2. Плюсуємо відправку для фінального комбо (тепер це масив)
            cursor.execute("""
                INSERT INTO invite_analytics (access_key, invite_text, sent_count, reply_count)
                VALUES (?, ?, 1, 0)
                ON CONFLICT(access_key, invite_text) 
                DO UPDATE SET sent_count = sent_count + 1
            """, (key, final_text_to_log))

            # 3. Оновлюємо квиток новим масивом
            if request.chat_uid:
                cursor.execute("""
                    INSERT OR REPLACE INTO pending_invites (chat_uid, access_key, invite_text)
                    VALUES (?, ?, ?)
                """, (request.chat_uid, key, final_text_to_log))



        elif request.action == "reply" and request.chat_uid:
            print(f"\n🚨 [СЕРВЕР] Зайшли в гілку REPLY. Мужик ID: {request.profile_id}")
            print(
                f"📦 [СЕРВЕР] Дані анкети (JSON): {request.woman_profile_json[:100] if request.woman_profile_json else 'Немає'}")
            print(f"🛠 [Сервер Дебаг] Отримано запит 'reply' для чату: {request.chat_uid}")

            # Робимо SELECT до бази лише один раз!
            cursor.execute("SELECT invite_text FROM pending_invites WHERE chat_uid = ?", (request.chat_uid,))
            ticket_row = cursor.fetchone()

            saved_text = ticket_row[0] if ticket_row else None

            if saved_text:
                print(f"✅ [Сервер Дебаг] Квиток знайдено! Текст: '{saved_text}'. Зберігаємо ліда!")

                # --- ЗБЕРІГАЄМО ДОСЬЄ МУЖИКА ТА АНКЕТИ ---
                if request.profile_id:

                    # Якщо розширення прислало свіжий JSON анкети - оновлюємо її
                    if request.woman_profile_json:
                        cursor.execute("""
                                    INSERT OR REPLACE INTO woman_profiles (woman_id, profile_json, last_updated)
                                    VALUES (?, ?, CURRENT_TIMESTAMP)
                                """, (request.woman_id, request.woman_profile_json))
                        print(f"🔄 [Сервер] Оновлено досьє анкети: {request.woman_id} (Кеш на 14 днів)")

                    print(f"🎯 [Сервер Дебаг] Записуємо досьє мужика ID: {request.profile_id} в leads_analytics")
                    cursor.execute("""
                                INSERT INTO leads_analytics 
                                (access_key, chat_uid, woman_id, profile_id, invite_text, lead_age, lead_country, lead_interests, lead_bio, lead_photo, man_profile_json)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (key, request.chat_uid, request.woman_id, request.profile_id, saved_text,
                                  request.lead_age, request.lead_country, request.lead_interests,
                                  request.lead_bio, request.lead_photo, request.man_profile_json))
                    print("✅ [СЕРВЕР] Запис досьє мужика в базу пройшов успішно!")

                # --- ОНОВЛЮЄМО СТАТИСТИКУ НАЙКРАЩИХ ІНВАЙТІВ ---
                cursor.execute("""
                            UPDATE invite_analytics SET reply_count = reply_count + 1
                            WHERE access_key = ? AND invite_text = ?
                        """, (key, saved_text))
                # --- ВИДАЛЯЄМО КВИТОК ---
                cursor.execute("DELETE FROM pending_invites WHERE chat_uid = ?", (request.chat_uid,))

            else:
                print(f"ℹ️ [Сервер Дебаг] Звичайна переписка для {request.chat_uid}. Квитка немає, базу не засмічуємо.")

        conn.commit()
        return {"status": "success"}
    except Exception as e:
        print(f"❌ Помилка логування на сервері: {e}")
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

@app.get("/admin/leads")
async def get_leads_analytics(team: str = "alpha", authorized: bool = Depends(verify_admin)):
    """Віддає список зібраних досьє на тих, хто відповів"""
    db = database_fs if team == "fs" else database
    conn = db.get_connection()
    cursor = conn.cursor()

    # Дістаємо останні 100 зібраних досьє
    cursor.execute("""
        SELECT l.access_key, l.profile_id, l.invite_text, l.lead_age, l.lead_country, 
                l.lead_interests, l.lead_bio, l.lead_photo, l.timestamp, l.man_profile_json,
                w.profile_json, l.woman_id
        FROM leads_analytics l
        LEFT JOIN woman_profiles w ON l.woman_id = w.woman_id
        ORDER BY l.timestamp DESC 
        LIMIT 10000
        """)
    rows = cursor.fetchall()
    conn.close()

    leads = []
    for row in rows:
        leads.append({
            "key": row[0],
            "man_id": row[1],
            "text": row[2],
            "age": row[3],
            "country": row[4],
            "interests": row[5],
            "bio": row[6],
            "photo": row[7],
            "time": row[8],
            "man_json": row[9],
            "woman_json": row[10],
            "woman_id": row[11]
        })

    return {"status": "success", "leads": leads}

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


@app.post("/admin/reset_session") # Перейменували
async def reset_session(request: AdminActionRequest, authorized: bool = Depends(verify_admin)):
    """Примусово скидає поточну сесію (викидає користувача з мережі)"""
    db = database_fs if request.team == "fs" else database
    conn = db.get_connection()
    cursor = conn.cursor()

    cursor.execute("UPDATE keys SET session_token = NULL WHERE access_key = ?", (request.access_key,))
    conn.commit()
    conn.close()

    return {"status": "success", "message": f"Сесію для {request.access_key} скинуто"}


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

@app.get("/admin/metrics/leads-by-day")
async def get_leads_by_day(
    days: int = 7,
    access_key: Optional[str] = None,
    admin_token: str = Header(None),
    authorized: bool = Depends(verify_admin)
):
    try:
        conn = database.get_connection()   # ← беремо з database
        cursor = conn.cursor()

        query = """
            SELECT DATE(timestamp) as date, COUNT(*) as count
            FROM leads_analytics
            WHERE timestamp >= datetime('now', '-{} days')
        """.format(days)

        params = []

        if access_key:
            query += " AND access_key = ?"
            params.append(access_key)

        query += " GROUP BY DATE(timestamp) ORDER BY date ASC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        data = [{"date": row[0], "count": row[1]} for row in rows]

        return {
            "status": "success",
            "period_days": days,
            "access_key": access_key,
            "data": data
        }

    except Exception as e:
        print(f"[ERROR] /admin/metrics/leads-by-day: {e}")
        return {"status": "error", "message": str(e)}