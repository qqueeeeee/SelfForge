from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, Field

class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: datetime

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


from .calendar import (
    CalendarItemBase,
    CalendarTaskCreate,
    CalendarEventCreate,
    CalendarItemUpdate,
    CalendarItemResponse,
    BatchCalendarItemCreate,
    BatchCalendarItemResponse,

)

from .timer import (
    TimerSessionBase,
    TimerSessionCreate,
    TimerSessionUpdate,
    TimerSessionResponse,
) 

from .goals import (
    GoalBase,
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    GoalMilestoneBase,
    GoalMilestoneCreate,
    GoalMilestoneUpdate,
    GoalMilestoneResponse,
    BatchGoalCreate,
    BatchGoalResponse,
)

from .daily_logs import (
    DailyLogBase,
    DailyLogCreate,
    DailyLogUpdate,
    DailyLogResponse,
)

from .ai import (
    AskRequest,
    AskResponse,
)    

from .analytics import (
    ProductivityStatsRequest,
    ProductivityStatsResponse,
)

__all__ = [

    "CalendarItemBase",
    "CalendarTaskCreate",
    "CalendarEventCreate",
    "CalendarItemUpdate",
    "CalendarItemResponse",

    "GoalBase",
    "GoalCreate",
    "GoalUpdate",
    "GoalResponse",
    "GoalMilestoneBase",
    "GoalMilestoneCreate",
    "GoalMilestoneUpdate",
    "GoalMilestoneResponse",

    "TimerSessionBase",
    "TimerSessionCreate",
    "TimerSessionUpdate",
    "TimerSessionResponse",

    "DailyLogBase",
    "DailyLogCreate",
    "DailyLogUpdate",
    "DailyLogResponse",

    "UserPreferencesBase",
    "UserPreferencesUpdate",
    "UserPreferencesResponse",

    "AskRequest",
    "AskResponse",

    "ProductivityStatsRequest",
    "ProductivityStatsResponse",

    "BatchCalendarItemCreate",
    "BatchCalendarItemResponse",
    "BatchGoalCreate",
    "BatchGoalResponse",
] 
