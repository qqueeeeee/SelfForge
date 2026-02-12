from fastapi import APIRouter
from typing import List
from pydantic import Optional, Query, Depends
from datetime import datetime
from models import CalendarItem, User
from sqlalchemy.orm import Session
from core.dependencies import get_db, get_current_user
from schemas import (
    BatchCalendarItemCreate,
    BatchCalendarItemResponse,
    CalendarEventCreate,
    CalendarItemResponse,
    CalendarItemUpdate,
    CalendarTaskCreate,
    )

router = APIRouter(prefix="/calendar", tags=["Calendar"])

@router.get("/items", response_model=List[CalendarItemResponse])
def get_calendar_items(
    current_user: User = Depends(get_current_user),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    item_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    completed: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    """Get calendar items with optional filtering"""
    query = db.query(CalendarItem)

    if start_date:
        query = query.filter(CalendarItem.start_datetime >= start_date)
    if end_date:
        query = query.filter(CalendarItem.end_datetime <= end_date)
    if item_type:
        query = query.filter(CalendarItem.item_type == item_type)
    if category:
        query = query.filter(CalendarItem.category == category)
    if completed is not None:
        query = query.filter(CalendarItem.completed == completed)

    items = query.order_by(CalendarItem.start_datetime.asc()).all()
    return items


@app.post("/calendar/items", response_model=CalendarItemResponse)
def create_calendar_item(
    item: CalendarTaskCreate | CalendarEventCreate,
    db: Session = Depends(get_db),
):
    """Create a new calendar item (task or event)"""
    db_item = CalendarItem(
        id=item.dict().get("id", str(datetime.utcnow().timestamp())),
        **item.dict(),
    )

    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.get("/calendar/items/{item_id}", response_model=CalendarItemResponse)
def get_calendar_item(item_id: str, db: Session = Depends(get_db)):
    """Get a specific calendar item"""
    item = db.query(CalendarItem).filter(CalendarItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Calendar item not found")
    return item


@app.put("/calendar/items/{item_id}", response_model=CalendarItemResponse)
def update_calendar_item(
    item_id: str,
    item_update: CalendarItemUpdate,
    db: Session = Depends(get_db),
):
    """Update a calendar item"""
    db_item = db.query(CalendarItem).filter(CalendarItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Calendar item not found")

    update_data = item_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)

    db_item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return db_item


@app.delete("/calendar/items/{item_id}")
def delete_calendar_item(item_id: str, db: Session = Depends(get_db)):
    """Delete a calendar item"""
    db_item = db.query(CalendarItem).filter(CalendarItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Calendar item not found")

    db.delete(db_item)
    db.commit()
    return {"message": "Calendar item deleted successfully"}


@app.post("/calendar/items/batch", response_model=BatchCalendarItemResponse)
def create_calendar_items_batch(
    batch_request: BatchCalendarItemCreate,
    db: Session = Depends(get_db),
):
    """Create multiple calendar items in a single request"""
    created = []
    errors = []

    for i, item_data in enumerate(batch_request.items):
        try:
            db_item = CalendarItem(
                id=item_data.dict().get(
                    "id", f"batch_{i}_{datetime.utcnow().timestamp()}"
                ),
                **item_data.dict(),
            )
            db.add(db_item)
            db.flush()  # Flush to get the ID but don't commit yet
            created.append(db_item)
        except Exception as e:
            errors.append({"index": i, "error": str(e)})

    if not errors:  # Only commit if no errors
        db.commit()
        for item in created:
            db.refresh(item)
    else:
        db.rollback()

    return BatchCalendarItemResponse(created=created, errors=errors)


