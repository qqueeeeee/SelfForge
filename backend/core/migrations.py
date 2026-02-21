from sqlalchemy import text
from sqlalchemy.engine import Engine


USER_SCOPED_TABLES = (
    "calendar_items",
    "goals",
    "goal_milestones",
    "timer_sessions",
    "daily_logs",
    "habit_logs",
    "user_preferences",
)


def _has_column(conn, table_name: str, column_name: str) -> bool:
    rows = conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    return any(row[1] == column_name for row in rows)


def _has_index(conn, table_name: str, index_name: str) -> bool:
    rows = conn.execute(text(f"PRAGMA index_list({table_name})")).fetchall()
    return any(row[1] == index_name for row in rows)


def run_startup_migrations(engine: Engine) -> None:
    """Apply idempotent SQLite migrations needed for per-user data isolation."""
    with engine.begin() as conn:
        for table_name in USER_SCOPED_TABLES:
            if not _has_column(conn, table_name, "user_id"):
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN user_id INTEGER"))

            index_name = f"ix_{table_name}_user_id"
            if not _has_index(conn, table_name, index_name):
                conn.execute(text(f"CREATE INDEX {index_name} ON {table_name}(user_id)"))
