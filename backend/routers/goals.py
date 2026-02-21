from pydantic import Optional, List, Depends
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from models import Goal, GoalMilestone
from core.dependencies import get_db 
from schemas import (
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

router = APIRouter(tags=["goals"])

@router.get("/", response_model=List[GoalResponse])
def get_goals(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get all goals with optional filtering"""
    query = db.query(Goal)

    if status:
        query = query.filter(Goal.status == status)
    if category:
        query = query.filter(Goal.category == category)

    goals = query.order_by(Goal.created_at.desc()).all()
    return goals


@router.post("/", response_model=GoalResponse)
def create_goal(goal: GoalCreate, db: Session = Depends(get_db)):
    """Create a new goal with milestones"""
    db_goal = Goal(
        id=goal.dict().get("id", str(datetime.utcnow().timestamp())),
        **goal.dict(exclude={"milestones"}),
    )

    db.add(db_goal)
    db.flush()  

    for milestone_data in goal.milestones:
        db_milestone = GoalMilestone(
            id=f"ms_{datetime.utcnow().timestamp()}",
            goal_id=db_goal.id,
            **milestone_data.dict(),
        )
        db.add(db_milestone)

    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: str, db: Session = Depends(get_db)):
    """Get a specific goal with its milestones"""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: str,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
):
    """Update a goal"""
    db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    update_data = goal_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_goal, field, value)

    db_goal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.put("/{goal_id}/milestones/{milestone_id}")
def update_milestone(
    goal_id: str,
    milestone_id: str,
    milestone_update: GoalMilestoneUpdate,
    db: Session = Depends(get_db),
):
    """Update a goal milestone"""
    milestone = (
        db.query(GoalMilestone)
        .filter(
            GoalMilestone.id == milestone_id,
            GoalMilestone.goal_id == goal_id,
        )
        .first()
    )

    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    update_data = milestone_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "completed" and value and not milestone.completed:
            milestone.completed_at = datetime.utcnow()
        elif field == "completed" and not value:
            milestone.completed_at = None
        setattr(milestone, field, value)

    milestone.updated_at = datetime.utcnow()

    # Update goal progress based on milestone completion
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if goal:
        completed_milestones = sum(1 for m in goal.milestones if m.completed)
        total_milestones = len(goal.milestones)
        goal.progress = (
            int((completed_milestones / total_milestones) * 100)
            if total_milestones > 0
            else 0
        )

        # Update goal status based on progress
        if goal.progress == 100:
            goal.status = "completed"
        elif goal.progress > 0:
            goal.status = "in-progress"

    db.commit()
    return {"message": "Milestone updated successfully"}
