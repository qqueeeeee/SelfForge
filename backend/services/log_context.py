from datetime import datetime
from typing import List

from app.db.models import HabitLog


def build_log_context(logs: List[HabitLog]) -> str:
    if not logs:
        return "No habit logs available."

    lines = []
    for log in logs:
        ts = log.timestamp.strftime("%Y-%m-%d")
        lines.append(f"- {ts}: {log.habit} = {log.value}")

    return "\n".join(lines)
