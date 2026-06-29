import sqlite3
import json
import os

# Динамічний шлях: шукає базу в тій самій папці, де лежить скрипт
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "admin_panel.db")


def get_connection():
    return sqlite3.connect(DB_PATH)


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        access_key TEXT UNIQUE,
        hwid TEXT,
        is_banned INTEGER DEFAULT 0,
        profiles TEXT DEFAULT '[]'
    )
    """)

    # Колонка для зберігання наказів (C&C)
    try:
        cursor.execute("ALTER TABLE keys ADD COLUMN pending_config TEXT")
    except sqlite3.OperationalError:
        pass  # Якщо колонка вже є

    # Колонки для статистики та онлайну
    try:
        cursor.execute("ALTER TABLE keys ADD COLUMN stats_invites INTEGER DEFAULT 0")
        cursor.execute("ALTER TABLE keys ADD COLUMN stats_letters INTEGER DEFAULT 0")
        cursor.execute("ALTER TABLE keys ADD COLUMN last_ping TIMESTAMP")
    except sqlite3.OperationalError:
        pass  # Якщо колонки вже є

    ## Безпечно додаємо колонку для токена сесій в основну базу, якщо її там немає
    try:
        cursor.execute("ALTER TABLE keys ADD COLUMN session_token TEXT")
    except sqlite3.OperationalError:
        pass  # Якщо колонка вже є, SQLite видасть помилку, ми її просто ігноруємо

    # СТВОРЮЄМО ТАБЛИЦЮ ДЛЯ АНАЛІТИКИ ТЕКСТІВ ІНВАЙТІВ (ВИРІВНЯНО ВІДСТУП)
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

    # СТВОРЮЄМО ТАБЛИЦЮ ДЛЯ "КВИТКІВ" (ВИРІВНЯНО ВІДСТУП)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pending_invites (
        chat_uid TEXT PRIMARY KEY,
        access_key TEXT,
        invite_text TEXT
    )
    """)

    # СТВОРЮЄМО ТАБЛИЦЮ ДЛЯ АНКЕТ (ОНОВЛЮЄТЬСЯ РАЗ НА 14 ДНІВ)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS woman_profiles (
            woman_id TEXT PRIMARY KEY,
            profile_json TEXT,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)

    # СТВОРЮЄМО ТАБЛИЦЮ ДЛЯ ДОСЬЄ МУЖИКІВ (ЛІДІВ)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leads_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            access_key TEXT,
            chat_uid TEXT,
            woman_id TEXT,     -- 🔥 ID анкети (для зв'язку)
            profile_id TEXT,   -- 🔥 ID мужика
            invite_text TEXT,
            lead_age INTEGER,
            lead_country TEXT,
            lead_interests TEXT,
            lead_bio TEXT,
            lead_photo TEXT,
            man_profile_json TEXT, -- 🔥 Сирий JSON мужика
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



def reset_session(access_key: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE keys SET session_token = NULL WHERE access_key = ?", (access_key,))
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


def login_and_update_session(access_key: str, session_token: str) -> tuple[bool, str]:
    """Авторизація при вході: записує актуальний токен сесії"""
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

        # Оновлюємо сесію — хто останній зайшов, той і власник активного сеансу
        cursor.execute("UPDATE keys SET session_token = ? WHERE access_key = ?", (session_token, access_key))
        conn.commit()
        conn.close()

        return True, "Авторизація успішна"
    except Exception as e:
        print(f"DB ERROR: {e}")
        return False, "Помилка бази даних"


def verify_session(access_key: str, session_token: str) -> tuple[bool, str]:
    """Перевірка під час пінгу: чи не витіснив цю сесію хтось інший"""
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

        # Перевіряємо, чи токен у базі збігається з токеном поточного пінгу
        if current_db_token != session_token:
            return False, "Ваш ключ щойно активували на іншому пристрої. Сеанс перервано."

        return True, "OK"
    except Exception as e:
        print(f"DB ERROR: {e}")
        return False, "Помилка бази даних"