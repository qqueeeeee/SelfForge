from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DATABASE_URL = "sqlite:///./data.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit = Column(String, nullable=False)
    value = Column(JSON, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)


class CalendarItem(Base):
    __tablename__ = "calendar_items"

    id = Column(String, primary_key=True, index=True)  # UUID from frontend
    title = Column(String, nullable=False)
    description = Column(Text)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    category = Column(
        String, nullable=False
    )  # deep-work, work, personal, meeting, custom
    is_all_day = Column(Boolean, default=False)
    item_type = Column(String, nullable=False)  # task or event
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Task-specific fields
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    priority = Column(String)  # low, medium, high
    estimated_duration = Column(Integer)  # in minutes
    actual_duration = Column(Integer)  # in minutes (from timer)

    # Event-specific fields
    location = Column(String)
    attendees = Column(JSON)  # List of attendee names/emails


class Goal(Base):
    __tablename__ = "goals"

    id = Column(String, primary_key=True, index=True)  # UUID from frontend
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(
        String, nullable=False
    )  # personal, career, health, learning, finance
    priority = Column(String, nullable=False)  # low, medium, high
    status = Column(
        String, nullable=False, default="not-started"
    )  # not-started, in-progress, completed, paused
    target_date = Column(DateTime, nullable=False)
    progress = Column(Integer, default=0)  # 0-100 percentage
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to milestones
    milestones = relationship(
        "GoalMilestone", back_populates="goal", cascade="all, delete-orphan"
    )


class GoalMilestone(Base):
    __tablename__ = "goal_milestones"

    id = Column(String, primary_key=True, index=True)  # UUID from frontend
    goal_id = Column(String, ForeignKey("goals.id"), nullable=False)
    title = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to goal
    goal = relationship("Goal", back_populates="milestones")


class TimerSession(Base):
    __tablename__ = "timer_sessions"

    id = Column(String, primary_key=True, index=True)  # UUID from frontend
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)  # deep-work, work, personal, etc.
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    duration = Column(Integer, nullable=False)  # in minutes
    completed = Column(Boolean, default=False)
    session_type = Column(String, nullable=False)  # pomodoro, deep-work, custom
    created_calendar_entry = Column(Boolean, default=False)
    calendar_item_id = Column(
        String, ForeignKey("calendar_items.id")
    )  # Optional link to created task
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to calendar item if created
    calendar_item = relationship("CalendarItem")


class DailyLog(Base):
    __tablename__ = "daily_logs"

    id = Column(Integer, primary_key=True, index=True)
    log_date = Column(DateTime, nullable=False)  # Date only

    # Habit tracking fields
    sleep_hours = Column(Float)
    study_hours = Column(Float)
    screen_time_hours = Column(Float)
    gym_completed = Column(Boolean, default=False)
    mood = Column(Integer)  # 1-10 scale
    notes = Column(Text)

    # Productivity metrics
    tasks_completed = Column(Integer, default=0)
    events_attended = Column(Integer, default=0)
    focus_time_minutes = Column(Integer, default=0)
    deep_work_minutes = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default_user")  # For future multi-user support

    # Calendar preferences
    default_calendar_view = Column(String, default="month")
    work_start_hour = Column(Integer, default=9)
    work_end_hour = Column(Integer, default=17)
    preferred_break_duration = Column(Integer, default=15)  # minutes

    # Timer preferences
    default_pomodoro_duration = Column(Integer, default=25)  # minutes
    default_break_duration = Column(Integer, default=5)  # minutes
    auto_create_calendar_entries = Column(Boolean, default=True)

    # AI preferences
    ai_insights_enabled = Column(Boolean, default=True)
    ai_suggestions_frequency = Column(String, default="daily")  # daily, weekly, never

    # Notification preferences
    task_reminders = Column(Boolean, default=True)
    goal_deadline_alerts = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Create all tables
Base.metadata.create_all(bind=engine)


# Database helper functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Migration function to handle existing data
def migrate_existing_data():
    """
    Migrate existing habit logs to new daily logs format if needed
    This function can be called on startup to handle data migration
    """
    db = SessionLocal()
    try:
        # Check if we need to migrate habit logs to daily logs
        existing_habits = db.query(HabitLog).count()
        existing_daily_logs = db.query(DailyLog).count()

        if existing_habits > 0 and existing_daily_logs == 0:
            print("Migrating existing habit logs to daily logs format...")

            # Group habit logs by date
            habit_logs = db.query(HabitLog).all()
            daily_data = {}

            for log in habit_logs:
                log_date = log.timestamp.date()
                if log_date not in daily_data:
                    daily_data[log_date] = {}

                daily_data[log_date][log.habit] = log.value

            # Create daily log entries
            for date, data in daily_data.items():
                daily_log = DailyLog(
                    log_date=datetime.combine(date, datetime.min.time()),
                    sleep_hours=data.get("sleep_hours"),
                    study_hours=data.get("study_hours"),
                    screen_time_hours=data.get("screen_time_hours"),
                    gym_completed=data.get("gym_completed", False),
                    mood=data.get("mood"),
                    notes=data.get("notes"),
                )
                db.add(daily_log)

            db.commit()
            print(f"Migrated {len(daily_data)} daily logs")

    except Exception as e:
        print(f"Migration error: {e}")
        db.rollback()
    finally:
        db.close()


# Initialize default user preferences
def initialize_defaults():
    """Initialize default user preferences if they don't exist"""
    db = SessionLocal()
    try:
        existing_prefs = db.query(UserPreferences).first()
        if not existing_prefs:
            default_prefs = UserPreferences(user_id="default_user")
            db.add(default_prefs)
            db.commit()
            print("Initialized default user preferences")
    except Exception as e:
        print(f"Error initializing defaults: {e}")
    finally:
        db.close()


# Call initialization functions
if __name__ == "__main__":
    migrate_existing_data()
    initialize_defaults()
