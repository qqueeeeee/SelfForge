from datetime import datetime
from typing import List, Optional, Union

from pydantic import BaseModel, Field


# Base schemas for common fields
class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: datetime


# Calendar Item Schemas
class CalendarItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    category: str = Field(..., pattern="^(deep-work|work|personal|meeting|custom)$")
    is_all_day: bool = False
    item_type: str = Field(..., pattern="^(task|event)$")


class CalendarTaskCreate(CalendarItemBase):
    item_type: str = "task"
    priority: Optional[str] = Field("medium", pattern="^(low|medium|high)$")
    estimated_duration: Optional[int] = Field(None, ge=1, le=1440)  # 1-1440 minutes


class CalendarEventCreate(CalendarItemBase):
    item_type: str = "event"
    location: Optional[str] = None
    attendees: Optional[List[str]] = []


class CalendarItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    category: Optional[str] = Field(
        None, pattern="^(deep-work|work|personal|meeting|custom)$"
    )
    is_all_day: Optional[bool] = None
    # Task-specific updates
    completed: Optional[bool] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    estimated_duration: Optional[int] = Field(None, ge=1, le=1440)
    actual_duration: Optional[int] = Field(None, ge=1, le=1440)
    # Event-specific updates
    location: Optional[str] = None
    attendees: Optional[List[str]] = None


class CalendarItemResponse(CalendarItemBase, TimestampMixin):
    id: str
    # Task-specific fields
    completed: Optional[bool] = None
    completed_at: Optional[datetime] = None
    priority: Optional[str] = None
    estimated_duration: Optional[int] = None
    actual_duration: Optional[int] = None
    # Event-specific fields
    location: Optional[str] = None
    attendees: Optional[List[str]] = None

    class Config:
        from_attributes = True


# Goal Schemas
class GoalMilestoneBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    completed: bool = False


class GoalMilestoneCreate(GoalMilestoneBase):
    pass


class GoalMilestoneUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    completed: Optional[bool] = None


class GoalMilestoneResponse(GoalMilestoneBase, TimestampMixin):
    id: str
    goal_id: str
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GoalBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category: str = Field(..., pattern="^(personal|career|health|learning|finance)$")
    priority: str = Field(..., pattern="^(low|medium|high)$")
    target_date: datetime


class GoalCreate(GoalBase):
    milestones: Optional[List[GoalMilestoneCreate]] = []


class GoalUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = Field(
        None, pattern="^(personal|career|health|learning|finance)$"
    )
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    status: Optional[str] = Field(
        None, pattern="^(not-started|in-progress|completed|paused)$"
    )
    target_date: Optional[datetime] = None
    progress: Optional[int] = Field(None, ge=0, le=100)


class GoalResponse(GoalBase, TimestampMixin):
    id: str
    status: str
    progress: int
    milestones: List[GoalMilestoneResponse] = []

    class Config:
        from_attributes = True


# Timer Session Schemas
class TimerSessionBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., pattern="^(deep-work|work|personal|meeting|custom)$")
    session_type: str = Field(..., pattern="^(pomodoro|deep-work|custom)$")
    duration: int = Field(..., ge=1, le=1440)  # 1-1440 minutes


class TimerSessionCreate(TimerSessionBase):
    start_time: datetime


class TimerSessionUpdate(BaseModel):
    end_time: Optional[datetime] = None
    duration: Optional[int] = Field(None, ge=1, le=1440)
    completed: Optional[bool] = None
    created_calendar_entry: Optional[bool] = None
    calendar_item_id: Optional[str] = None


class TimerSessionResponse(TimerSessionBase, TimestampMixin):
    id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    completed: bool
    created_calendar_entry: bool
    calendar_item_id: Optional[str] = None

    class Config:
        from_attributes = True


# Daily Log Schemas
class DailyLogBase(BaseModel):
    log_date: datetime
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    study_hours: Optional[float] = Field(None, ge=0, le=24)
    screen_time_hours: Optional[float] = Field(None, ge=0, le=24)
    gym_completed: bool = False
    mood: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = None


class DailyLogCreate(DailyLogBase):
    pass


class DailyLogUpdate(BaseModel):
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    study_hours: Optional[float] = Field(None, ge=0, le=24)
    screen_time_hours: Optional[float] = Field(None, ge=0, le=24)
    gym_completed: Optional[bool] = None
    mood: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = None
    tasks_completed: Optional[int] = Field(None, ge=0)
    events_attended: Optional[int] = Field(None, ge=0)
    focus_time_minutes: Optional[int] = Field(None, ge=0)
    deep_work_minutes: Optional[int] = Field(None, ge=0)


class DailyLogResponse(DailyLogBase, TimestampMixin):
    id: int
    tasks_completed: int
    events_attended: int
    focus_time_minutes: int
    deep_work_minutes: int

    class Config:
        from_attributes = True


# User Preferences Schemas
class UserPreferencesBase(BaseModel):
    default_calendar_view: str = Field("month", pattern="^(month|week|day)$")
    work_start_hour: int = Field(9, ge=0, le=23)
    work_end_hour: int = Field(17, ge=0, le=23)
    preferred_break_duration: int = Field(15, ge=1, le=60)
    default_pomodoro_duration: int = Field(25, ge=1, le=60)
    default_break_duration: int = Field(5, ge=1, le=30)
    auto_create_calendar_entries: bool = True
    ai_insights_enabled: bool = True
    ai_suggestions_frequency: str = Field("daily", pattern="^(daily|weekly|never)$")
    task_reminders: bool = True
    goal_deadline_alerts: bool = True


class UserPreferencesUpdate(BaseModel):
    default_calendar_view: Optional[str] = Field(None, pattern="^(month|week|day)$")
    work_start_hour: Optional[int] = Field(None, ge=0, le=23)
    work_end_hour: Optional[int] = Field(None, ge=0, le=23)
    preferred_break_duration: Optional[int] = Field(None, ge=1, le=60)
    default_pomodoro_duration: Optional[int] = Field(None, ge=1, le=60)
    default_break_duration: Optional[int] = Field(None, ge=1, le=30)
    auto_create_calendar_entries: Optional[bool] = None
    ai_insights_enabled: Optional[bool] = None
    ai_suggestions_frequency: Optional[str] = Field(
        None, pattern="^(daily|weekly|never)$"
    )
    task_reminders: Optional[bool] = None
    goal_deadline_alerts: Optional[bool] = None


class UserPreferencesResponse(UserPreferencesBase, TimestampMixin):
    id: int
    user_id: str

    class Config:
        from_attributes = True


# AI Chat Schemas
class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    include_context: List[str] = Field(
        default=["tasks", "habits", "goals"],
        description="Types of data to include in context",
    )


class AskResponse(BaseModel):
    response: str
    context_used: List[str]
    timestamp: datetime


# Analytics Schemas
class ProductivityStatsRequest(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    include_categories: Optional[List[str]] = None


class ProductivityStatsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    total_events: int
    total_focus_time_minutes: int
    total_deep_work_minutes: int
    completion_rate: float
    category_breakdown: dict
    daily_averages: dict


# Batch operation schemas
class BatchCalendarItemCreate(BaseModel):
    items: List[Union[CalendarTaskCreate, CalendarEventCreate]]


class BatchCalendarItemResponse(BaseModel):
    created: List[CalendarItemResponse]
    errors: List[dict]


class BatchGoalCreate(BaseModel):
    goals: List[GoalCreate]


class BatchGoalResponse(BaseModel):
    created: List[GoalResponse]
    errors: List[dict]


# Export all schemas for easy import
__all__ = [
    # Calendar schemas
    "CalendarItemBase",
    "CalendarTaskCreate",
    "CalendarEventCreate",
    "CalendarItemUpdate",
    "CalendarItemResponse",
    # Goal schemas
    "GoalBase",
    "GoalCreate",
    "GoalUpdate",
    "GoalResponse",
    "GoalMilestoneBase",
    "GoalMilestoneCreate",
    "GoalMilestoneUpdate",
    "GoalMilestoneResponse",
    # Timer schemas
    "TimerSessionBase",
    "TimerSessionCreate",
    "TimerSessionUpdate",
    "TimerSessionResponse",
    # Daily log schemas
    "DailyLogBase",
    "DailyLogCreate",
    "DailyLogUpdate",
    "DailyLogResponse",
    # User preferences schemas
    "UserPreferencesBase",
    "UserPreferencesUpdate",
    "UserPreferencesResponse",
    # AI schemas
    "AskRequest",
    "AskResponse",
    # Analytics schemas
    "ProductivityStatsRequest",
    "ProductivityStatsResponse",
    # Batch schemas
    "BatchCalendarItemCreate",
    "BatchCalendarItemResponse",
    "BatchGoalCreate",
    "BatchGoalResponse",
]
