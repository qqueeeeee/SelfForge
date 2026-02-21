from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime 
from .common import TimestampMixin

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
