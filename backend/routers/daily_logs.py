from fastapi import APIRouter, HTTPException
from typing import List 
from pydantic import Optional, Depends, Query
from datetime import datetime
from sqlalchemy.orm import Session
from core.dependencies import get_db
from schemas import (
        DailyLogResponse,
        DailyLogUpdate,
        DailyLogBase,
        DailyLogCreate
        )
from models import DailyLog

router = APIRouter(tags=["daily_logs"])

@router.get("/logs/daily", response_model=List[DailyLogResponse])
def get_daily_logs(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    """Get daily logs with optional date filtering"""
    query = db.query(DailyLog)

    if start_date:
        query = query.filter(DailyLog.log_date >= start_date)
    if end_date:
        query = query.filter(DailyLog.log_date <= end_date)

    logs = query.order_by(DailyLog.log_date.desc()).all()
    return logs


@router.post("/logs/daily", response_model=DailyLogResponse)
def create_daily_log(log: DailyLogCreate, db: Session = Depends(get_db)):
    """Create a new daily log entry"""
    # Check if log for this date already exists
    existing_log = (
        db.query(DailyLog).filter(DailyLog.log_date == log.log_date.date()).first()
    )

    if existing_log:
        raise HTTPException(
            status_code=400,
            detail="Daily log for this date already exists. Use PUT to update.",
        )

    db_log = DailyLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.put("/logs/daily/{log_id}", response_model=DailyLogResponse)
def update_daily_log(
    log_id: int,
    log_update: DailyLogUpdate,
    db: Session = Depends(get_db),
):
    """Update a daily log entry"""
    db_log = db.query(DailyLog).filter(DailyLog.id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Daily log not found")

    update_data = log_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_log, field, value)

    db_log.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_log)
    return db_log



