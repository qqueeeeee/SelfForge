from typing import List, Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field
from .common import TimestampMixin


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

class BatchCalendarItemCreate(BaseModel):
    items: List[Union[CalendarTaskCreate, CalendarEventCreate]]


class BatchCalendarItemResponse(BaseModel):
    created: List[CalendarItemResponse]
    errors: List[dict]




