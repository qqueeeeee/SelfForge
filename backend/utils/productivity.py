from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from models import CalendarItem, Goal, TimerSession, DailyLog


def get_user_productivity_data(db: Session, user_id: int, days: int = 30) -> str:
    since = datetime.now(timezone.utc) - timedelta(days=days)

    calendar_items = (
        db.query(CalendarItem)
        .filter(CalendarItem.user_id == user_id, CalendarItem.created_at >= since)
        .order_by(CalendarItem.start_datetime.desc())
        .all()
    )

    goals = db.query(Goal).filter(Goal.user_id == user_id).all()

    timer_sessions = (
        db.query(TimerSession)
        .filter(TimerSession.user_id == user_id, TimerSession.start_time >= since)
        .order_by(TimerSession.start_time.desc())
        .all()
    )

    daily_logs = (
        db.query(DailyLog)
        .filter(DailyLog.user_id == user_id, DailyLog.log_date >= since)
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

    if goals:
        data_summary.append("\nGOALS:")

        for goal in goals:
            milestones = goal.milestones or []

            completed = sum(1 for m in milestones if m.completed)
            total = len(milestones)

            progress = (completed / total * 100) if total else 0

            data_summary.append(
                f"- {goal.title}: {progress:.1f}% ({completed}/{total})"
            )

    completed_sessions = [s for s in timer_sessions if s.completed]

    total_focus_time = sum(s.duration for s in completed_sessions)

    data_summary.append(f"\nFOCUS ({days} days):")
    data_summary.append(f"- Sessions: {len(completed_sessions)}")
    data_summary.append(
        f"- Total focus: {total_focus_time} min ({total_focus_time/60:.1f} hrs)"
    )

    if daily_logs:
        sleep_values = [l.sleep_hours for l in daily_logs if l.sleep_hours]
        mood_values = [l.mood for l in daily_logs if l.mood]

        avg_sleep = (
            sum(sleep_values) / len(sleep_values)
            if sleep_values
            else 0
        )

        avg_mood = (
            sum(mood_values) / len(mood_values)
            if mood_values
            else 0
        )

        gym_days = sum(1 for l in daily_logs if l.gym_completed)

        data_summary.append(f"\nHABITS ({len(daily_logs)} days):")
        data_summary.append(f"- Avg sleep: {avg_sleep:.1f}h")
        data_summary.append(f"- Avg mood: {avg_mood:.1f}/10")
        data_summary.append(
            f"- Gym: {gym_days}/{len(daily_logs)} days"
        )

    return "\n".join(data_summary) or "No productivity data available."

