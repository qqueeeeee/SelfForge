from datetime import datetime, timedelta

from app.db.models import HabitLog
from app.db.session import SessionLocal
from app.services.log_context import build_log_context
from sqlalchemy.orm import Session


def ask_ai(question: str) -> str:
    db: Session = SessionLocal()
    try:
        since = datetime.utcnow() - timedelta(days=30)

        logs = (
            db.query(HabitLog)
            .filter(HabitLog.timestamp >= since)
            .order_by(HabitLog.timestamp.desc())
            .all()
        )

        log_context = build_log_context(logs)

        prompt = build_prompt(question, log_context)

        return call_llm(prompt)

    finally:
        db.close()
