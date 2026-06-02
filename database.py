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

    # ДОДАЛИ ЦЕЙ БЛОК: Безпечно додаємо колонку до вже існуючої таблиці
    try:
        cursor.execute("ALTER TABLE keys ADD COLUMN hwid TEXT")
    except sqlite3.OperationalError:
        pass  # Якщо колонка вже є, нічого не робимо

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

# Замінюємо стару check_key на нову з перевіркою HWID
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


def reset_hwid(access_key: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE keys SET hwid = NULL WHERE access_key = ?", (access_key,))
    updated = cursor.rowcount
    conn.commit()
    conn.close()
    return updated > 0

def ban_key(access_key: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE keys SET is_banned = 1 WHERE access_key = ?",
        (access_key,)
    )

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