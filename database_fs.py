import sqlite3
import json
import os

# Динамічний шлях: шукає базу в тій самій папці, де лежить скрипт
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "fs.db")


def get_connection():
    return sqlite3.connect(DB_PATH)


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # ==========================================
    # 1. ГОЛОВНА ТАБЛИЦЯ КЛЮЧІВ (Уніфікована)
    # ==========================================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        access_key TEXT UNIQUE,
        hwid TEXT,             -- Залишаємо виключно щоб не зламати старі файли SQLite (в коді ігноруватимемо)
        operator_id TEXT,      -- 🔥 НАША НОВА ЛІЦЕНЗІЯ (Захист від передачі ключа)
        session_token TEXT,    -- 🟢 ЖИВА СЕСІЯ (Захист від мульти-входу)
        is_banned INTEGER DEFAULT 0,
        profiles TEXT DEFAULT '[]',
        pending_config TEXT,
        stats_invites INTEGER DEFAULT 0,
        stats_letters INTEGER DEFAULT 0,
        last_ping TIMESTAMP
    )
    """)

    # --- БЕЗПЕЧНА МІГРАЦІЯ ДЛЯ СТАРИХ БАЗ ---
    # Цей блок пройдеться по старим базам і додасть нові колонки, якщо їх ще немає.
    columns_to_add = [
        ("operator_id", "TEXT"),
        ("session_token", "TEXT"),
        ("pending_config", "TEXT"),
        ("stats_invites", "INTEGER DEFAULT 0"),
        ("stats_letters", "INTEGER DEFAULT 0"),
        ("last_ping", "TIMESTAMP")
    ]
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE keys ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            pass  # Якщо колонка вже існує, йдемо далі

    # ==========================================
    # 2. АНАЛІТИКА ІНВАЙТІВ (З фіксацією часу)
    # ==========================================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS invite_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        access_key TEXT,
        invite_text TEXT,
        sent_count INTEGER DEFAULT 0,
        reply_count INTEGER DEFAULT 0,
        UNIQUE(access_key, invite_text)
    )
    """)

    # Синхронізація: додаємо час відправки для FS, бо в Alpha він уже був
    try:
        cursor.execute("ALTER TABLE invite_analytics ADD COLUMN last_sent_at DATETIME DEFAULT CURRENT_TIMESTAMP")
    except sqlite3.OperationalError:
        pass

    # ==========================================
    # 3. КВИТКИ (PENDING INVITES)
    # ==========================================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pending_invites (
        chat_uid TEXT PRIMARY KEY,
        access_key TEXT,
        invite_text TEXT
    )
    """)

    # ==========================================
    # 4. АНКЕТИ
    # ==========================================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS woman_profiles (
        woman_id TEXT PRIMARY KEY,
        profile_json TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ==========================================
    # 5. ЛІДИ (ДОСЬЄ ДЛЯ АНАЛІЗУ КОНВЕРСІЇ)
    # ==========================================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS leads_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        access_key TEXT,
        chat_uid TEXT,
        woman_id TEXT,     
        profile_id TEXT,   
        invite_text TEXT,
        lead_age INTEGER,
        lead_country TEXT,
        lead_interests TEXT,
        lead_bio TEXT,
        lead_photo TEXT,
        man_profile_json TEXT, 
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()


def add_key(access_key: str):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO keys (access_key) VALUES (?)",
            (access_key,)
        )

        conn.commit()
        conn.close()

        return True

    except sqlite3.IntegrityError:
        return False


def check_key(access_key: str) -> bool:
    if not access_key:
        return False

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT is_banned FROM keys WHERE access_key = ?",
            (access_key,)
        )

        row = cursor.fetchone()

        conn.close()

        if row and row[0] == 0:
            return True

        return False

    except Exception as e:
        print(f"DB ERROR: {e}")
        return False


def login_and_update_session(access_key: str, session_token: str) -> tuple[bool, str]:
    """Викликається лише ПРИ ВХОДІ. Завжди пускає, якщо ключ валідний, і перезаписує сесію."""
    if not access_key or not session_token:
        return False, "Ключ або токен відсутні"

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT is_banned FROM keys WHERE access_key = ?", (access_key,))
        row = cursor.fetchone()

        if not row:
            conn.close()
            return False, "Невірний ключ"

        if row[0] == 1:
            conn.close()
            return False, "Ключ заблоковано"

        # Записуємо нову сесію (хто останній зайшов, того і ключ)
        cursor.execute("UPDATE keys SET session_token = ? WHERE access_key = ?", (session_token, access_key))
        conn.commit()
        conn.close()

        return True, "Авторизація успішна"
    except Exception as e:
        print(f"DB ERROR: {e}")
        return False, "Помилка бази даних"

def verify_session(access_key: str, session_token: str) -> tuple[bool, str]:
    """Перевірка під час пінгу"""
    if not access_key or not session_token:
        return False, "Відсутні дані авторизації"

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT is_banned, session_token FROM keys WHERE access_key = ?", (access_key,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return False, "Невірний ключ"

        is_banned, current_db_token = row

        if is_banned == 1:
            return False, "Ключ заблоковано"

        # Якщо в базі ще немає токена — пускаємо (перший пінг після входу)
        if current_db_token is None:
            return True, "OK"

        # Якщо токен збігається — пускаємо
        if current_db_token == session_token:
            return True, "OK"

        # Якщо не збігається — сеанс перервано
        return False, "Ваш ключ щойно активували на іншому пристрої. Сеанс перервано."

    except Exception as e:
        print(f"DB ERROR: {e}")
        return False, "Помилка бази даних"


def verify_and_bind_key(access_key: str, hwid: str) -> tuple[bool, str]:
    if not access_key or not hwid:
        return False, "Ключ або HWID відсутні"

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT is_banned, hwid FROM keys WHERE access_key = ?", (access_key,))
        row = cursor.fetchone()

        if not row:
            conn.close()
            return False, "Невірний ключ"

        is_banned, current_hwid = row

        if is_banned == 1:
            conn.close()
            return False, "Ключ заблоковано"

        # Якщо HWID ще не прив'язаний — прив'язуємо
        if current_hwid is None:
            cursor.execute("UPDATE keys SET hwid = ? WHERE access_key = ?", (hwid, access_key))
            conn.commit()
            conn.close()
            return True, "Ключ успішно прив'язано до пристрою"

        # Якщо HWID вже є — порівнюємо
        conn.close()
        if current_hwid == hwid:
            return True, "Авторизація успішна"
        else:
            return False, "Цей ключ вже використовується на іншому пристрої"
    except Exception as e:
        print(f"DB ERROR: {e}")
        return False, "Помилка бази даних"


def reset_all_licenses() -> int:
    """Скидає operator_id та session_token для всіх ключів"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE keys SET operator_id = NULL, session_token = NULL")
    updated = cursor.rowcount
    conn.commit()
    conn.close()
    return updated

def reset_license(access_key: str) -> bool:
    """Скидає ліцензію для одного конкретного ключа"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE keys SET operator_id = NULL, session_token = NULL WHERE access_key = ?", (access_key,))
    updated = cursor.rowcount
    conn.commit()
    conn.close()
    return updated > 0


def get_all_keys():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT access_key, is_banned, profiles
    FROM keys
    """)

    rows = cursor.fetchall()

    conn.close()

    return rows


def update_profiles(access_key: str, profiles: list) -> bool:
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Перетворюємо список ID анкет у текст (JSON), бо SQLite не має типу масиву
        profiles_json = json.dumps(profiles, ensure_ascii=False)

        cursor.execute(
            "UPDATE keys SET profiles = ? WHERE access_key = ?",
            (profiles_json, access_key)
        )

        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"DB ERROR update_profiles: {e}")
        return False


def toggle_ban_key(access_key: str) -> tuple[bool, str]:
    """Змінює статус ключа на протилежний (Заблокований <-> Активний)"""
    conn = get_connection()
    cursor = conn.cursor()

    # Спочатку дізнаємося поточний статус
    cursor.execute("SELECT is_banned FROM keys WHERE access_key = ?", (access_key,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return False, "not_found"

    current_status = row[0]
    # Якщо був 1 (бан), ставимо 0. Якщо був 0, ставимо 1.
    new_status = 0 if current_status == 1 else 1

    cursor.execute("UPDATE keys SET is_banned = ? WHERE access_key = ?", (new_status, access_key))
    conn.commit()
    conn.close()

    return True, "banned" if new_status == 1 else "unbanned"


def delete_keys(keys_list: list) -> int:
    """Видаляє список ключів з бази"""
    if not keys_list:
        return 0

    conn = get_connection()
    cursor = conn.cursor()

    # executemany дозволяє виконати один запит для цілого списку
    cursor.executemany("DELETE FROM keys WHERE access_key = ?", [(k,) for k in keys_list])
    count = cursor.rowcount

    conn.commit()
    conn.close()

    return count

def get_keys_count() -> int:
    """Повертає загальну кількість ключів у базі"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM keys")
    count = cursor.fetchone()[0]
    conn.close()
    return count


def get_keys_page(limit: int = 10, offset: int = 0):
    """
    Повертає список ключів для однієї сторінки пагінації.
    Повертає: [(access_key, is_banned, profiles), ...]
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT access_key, is_banned, profiles 
        FROM keys 
        ORDER BY id ASC
        LIMIT ? OFFSET ?
    """, (limit, offset))
    rows = cursor.fetchall()
    conn.close()
    return rows

init_db()