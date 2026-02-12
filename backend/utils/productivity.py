from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import CalendarItem, Goal, TimerSession, DailyLog

def get_user_productivity_data(db: Session, days: int = 30) -> str:
    since = datetime.utcnow() - timedelta(days=days)

    calendar_items = (
        db.query(CalendarItem)
        .filter(CalendarItem.created_at >= since)
        .order_by(CalendarItem.start_datetime.desc())
        .all()
    )

    goals = db.query(Goal).all()

    timer_sessions = (
        db.query(TimerSession)
        .filter(TimerSession.start_time >= since)
        .order_by(TimerSession.start_time.desc())
        .all()
    )

    daily_logs = (
        db.query(DailyLog)
        .filter(DailyLog.log_date >= since)
        .order_by(DailyLog.log_date.desc())
        .all()
    )

    data_summary = []

    tasks = [i for i in calendar_items if i.item_type == "task"]
    events = [i for i in calendar_items if i.item_type == "event"]
    completed_tasks = [t for t in tasks if t.completed]

    task_count = len(tasks)

    completion_rate = (
        len(completed_tasks) / task_count * 100
        if task_count > 0
        else 0
    )

    data_summary.append(f"CALENDAR DATA ({days} days):")
    data_summary.append(f"- Total tasks: {task_count}")
    data_summary.append(f"- Completed tasks: {len(completed_tasks)}")
    data_summary.append(f"- Total events: {len(events)}")
    data_summary.append(f"- Completion rate: {completion_rate:.1f}%")


