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

    # ДОДАЄМО ЦЕ: Колонка для зберігання наказів (C&C)
    try:
        cursor.execute("ALTER TABLE keys ADD COLUMN pending_config TEXT")
    except sqlite3.OperationalError:
        pass  # Якщо колонка вже є

    # ДОДАЄМО ЦЕ: Колонки для статистики та онлайну
    try:
        cursor.execute("ALTER TABLE keys ADD COLUMN stats_invites INTEGER DEFAULT 0")
        cursor.execute("ALTER TABLE keys ADD COLUMN stats_letters INTEGER DEFAULT 0")
        cursor.execute("ALTER TABLE keys ADD COLUMN last_ping TIMESTAMP")
    except sqlite3.OperationalError:
        pass  # Якщо колонки вже є

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

def reset_all_hwids() -> int:
    """Скидає HWID для всіх ключів у базі і повертає кількість оновлених рядків"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE keys SET hwid = NULL")
    updated = cursor.rowcount
    conn.commit()
    conn.close()
    return updated

def reset_hwid(access_key: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE keys SET hwid = NULL WHERE access_key = ?", (access_key,))
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