import sqlite3
import json

DB_PATH = "/root/alpha/admin_panel.db"


def get_connection():
    return sqlite3.connect(DB_PATH)


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        access_key TEXT UNIQUE,
        is_banned INTEGER DEFAULT 0,
        profiles TEXT DEFAULT '[]'
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