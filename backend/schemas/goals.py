from typing import List, Optional, Union
from pydantic import BaseModel, Field
from datetime import datetime
from .common import TimestampMixin

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

class BatchGoalCreate(BaseModel):
    goals: List[GoalCreate]


class BatchGoalResponse(BaseModel):
    created: List[GoalResponse]
    errors: List[dict]


