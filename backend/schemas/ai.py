from pydantic import BaseModel, Field
from typing import List 
from datetime import datetime

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


