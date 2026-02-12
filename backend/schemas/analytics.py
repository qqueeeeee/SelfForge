from typing import List, Optional, Union
from pydantic import BaseModel, Field
from datetime import datetime

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



