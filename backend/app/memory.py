import json
import os
import sqlite3
import time
from pathlib import Path

DATA_DIR = Path(os.getenv("DATA_DIR", "data"))
DB_PATH = DATA_DIR / "mollie.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def connect():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA foreign_keys=ON")
    return connection


def initialize_memory():
    with connect() as db:
        # Sessions table
        db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT 'New Conversation',
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL,
                is_pinned INTEGER NOT NULL DEFAULT 0
            )
        """)
        db.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_updated
            ON sessions(is_pinned DESC, updated_at DESC)
        """)

        # Messages table
        db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                tool_used TEXT,
                sources TEXT,
                image_url TEXT,
                created_at REAL NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        """)
        db.execute("""
            CREATE INDEX IF NOT EXISTS idx_messages_session
            ON messages(session_id, id)
        """)

        # Safely migrate older schema columns if needed
        cursor = db.execute("PRAGMA table_info(messages)")
        cols = {row["name"] for row in cursor.fetchall()}
        if "tool_used" not in cols:
            db.execute("ALTER TABLE messages ADD COLUMN tool_used TEXT")
        if "sources" not in cols:
            db.execute("ALTER TABLE messages ADD COLUMN sources TEXT")
        if "image_url" not in cols:
            db.execute("ALTER TABLE messages ADD COLUMN image_url TEXT")


def create_or_get_session(session_id: str, title: str = "New Conversation") -> dict:
    now = time.time()
    with connect() as db:
        row = db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        if row:
            return dict(row)
        db.execute(
            """
            INSERT INTO sessions (id, title, created_at, updated_at, is_pinned)
            VALUES (?, ?, ?, ?, 0)
            """,
            (session_id, title, now, now),
        )
        return {
            "id": session_id,
            "title": title,
            "created_at": now,
            "updated_at": now,
            "is_pinned": 0,
        }


def list_sessions() -> list[dict]:
    with connect() as db:
        rows = db.execute(
            """
            SELECT s.*, 
                   (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) as message_count
            FROM sessions s
            ORDER BY s.is_pinned DESC, s.updated_at DESC
            """
        ).fetchall()
        return [dict(r) for r in rows]


def get_session(session_id: str) -> dict | None:
    with connect() as db:
        row = db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        return dict(row) if row else None


def update_session(session_id: str, title: str | None = None, is_pinned: bool | None = None) -> dict | None:
    now = time.time()
    with connect() as db:
        session = db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        if not session:
            return None

        new_title = title.strip() if title is not None else session["title"]
        new_pinned = int(is_pinned) if is_pinned is not None else session["is_pinned"]

        db.execute(
            """
            UPDATE sessions
            SET title = ?, is_pinned = ?, updated_at = ?
            WHERE id = ?
            """,
            (new_title, new_pinned, now, session_id),
        )
        row = db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        return dict(row) if row else None


def delete_session(session_id: str) -> bool:
    with connect() as db:
        db.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        cursor = db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        return cursor.rowcount > 0


def touch_session(session_id: str):
    now = time.time()
    with connect() as db:
        db.execute(
            "UPDATE sessions SET updated_at = ? WHERE id = ?",
            (now, session_id),
        )


def add_message(
    session_id: str,
    role: str,
    content: str,
    tool_used: str | None = None,
    sources: list | None = None,
    image_url: str | None = None,
):
    if role not in {"user", "assistant"}:
        raise ValueError("Invalid message role")

    now = time.time()
    create_or_get_session(session_id)

    sources_json = json.dumps(sources) if sources else None

    with connect() as db:
        db.execute(
            """
            INSERT INTO messages (session_id, role, content, tool_used, sources, image_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (session_id, role, content, tool_used, sources_json, image_url, now),
        )
        db.execute(
            "UPDATE sessions SET updated_at = ? WHERE id = ?",
            (now, session_id),
        )


def get_messages(session_id: str) -> list[dict]:
    with connect() as db:
        rows = db.execute(
            """
            SELECT id, session_id, role, content, tool_used, sources, image_url, created_at
            FROM messages
            WHERE session_id = ?
            ORDER BY id ASC
            """,
            (session_id,),
        ).fetchall()

        result = []
        for r in rows:
            item = dict(r)
            if item.get("sources"):
                try:
                    item["sources"] = json.loads(item["sources"])
                except Exception:
                    item["sources"] = []
            else:
                item["sources"] = []
            result.append(item)
        return result


def get_history(session_id: str, limit: int = 10) -> list[dict]:
    with connect() as db:
        rows = db.execute(
            """
            SELECT role, content
            FROM messages
            WHERE session_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (session_id, limit),
        ).fetchall()

    rows = list(rows)
    rows.reverse()

    return [
        {"role": r["role"], "content": r["content"]}
        for r in rows
    ]


def clear_history(session_id: str):
    with connect() as db:
        db.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))


initialize_memory()
