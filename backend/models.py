from database import Base, engine
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
)
from sqlalchemy.orm import relationship

from datetime import datetime, timezone

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    habit = Column(String, nullable=False)
    value = Column(JSON, nullable=False)
    timestamp = Column(DateTime, default=datetime.now(timezone.utc))


class CalendarItem(Base):
    __tablename__ = "calendar_items"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    category = Column(
        String, nullable=False
    )  
    is_all_day = Column(Boolean, default=False)
    item_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.utcnow)

    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    priority = Column(String)  
    estimated_duration = Column(Integer)
    actual_duration = Column(Integer) 

    location = Column(String)
    attendees = Column(JSON) 


class Goal(Base):
     __tablename__ = "goals"
 
     id = Column(String, primary_key=True, index=True)
     user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
     title = Column(String, nullable=False)
     description = Column(Text)
     category = Column(
         String, nullable=False
     )
     priority = Column(String, nullable=False)
     status = Column(
         String, nullable=False, default="not-started"
     ) 
     target_date = Column(DateTime, nullable=False)
     progress = Column(Integer, default=0)
     created_at = Column(DateTime, default=datetime.now(timezone.utc))
     updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.utcnow)
 
     milestones = relationship(
         "GoalMilestone", back_populates="goal", cascade="all, delete-orphan"
     )

 
class GoalMilestone(Base):
     __tablename__ = "goal_milestones"
 
     id = Column(String, primary_key=True, index=True)
     user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
     goal_id = Column(String, ForeignKey("goals.id"), nullable=False)
     title = Column(String, nullable=False)
     completed = Column(Boolean, default=False)
     completed_at = Column(DateTime)
     created_at = Column(DateTime, default=datetime.now(timezone.utc))
     updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.utcnow)
 
     goal = relationship("Goal", back_populates="milestones")


class TimerSession(Base):
     __tablename__ = "timer_sessions"
 
     id = Column(String, primary_key=True, index=True) 
     user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
     title = Column(String, nullable=False)
     category = Column(String, nullable=False)  
     start_time = Column(DateTime, nullable=False)
     end_time = Column(DateTime)
     duration = Column(Integer, nullable=False)
     completed = Column(Boolean, default=False)
     session_type = Column(String, nullable=False)
     created_calendar_entry = Column(Boolean, default=False)
     calendar_item_id = Column(
         String, ForeignKey("calendar_items.id")
     ) 
     created_at = Column(DateTime, default=datetime.now(timezone.utc))
 
#     calendar_item = relationship("CalendarItem")
 

class DailyLog(Base):
    __tablename__ = "daily_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    log_date = Column(DateTime, nullable=False)

    sleep_hours = Column(Float)
    study_hours = Column(Float)
    screen_time_hours = Column(Float)
    gym_completed = Column(Boolean, default=False)
    mood = Column(Integer)  
    notes = Column(Text)

    tasks_completed = Column(Integer, default=0)
    events_attended = Column(Integer, default=0)
    focus_time_minutes = Column(Integer, default=0)
    deep_work_minutes = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    default_calendar_view = Column(String, default="month")
    work_start_hour = Column(Integer, default=9)
    work_end_hour = Column(Integer, default=17)
    preferred_break_duration = Column(Integer, default=15)

    default_pomodoro_duration = Column(Integer, default=25)
    default_break_duration = Column(Integer, default=5)  
    auto_create_calendar_entries = Column(Boolean, default=True)

    ai_insights_enabled = Column(Boolean, default=True)
    ai_suggestions_frequency = Column(String, default="daily")  
    task_reminders = Column(Boolean, default=True)
    goal_deadline_alerts = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.utcnow)


Base.metadata.create_all(bind=engine)
