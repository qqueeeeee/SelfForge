from pydantic import BaseModel, Optional, Field
from datetime import datetime 

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

