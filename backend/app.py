import glob
import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains.retrieval import create_retrieval_chain
from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import Session

from core.dependencies import get_current_user, get_db
from core.migrations import run_startup_migrations
from database import engine
from models import (
    CalendarItem,
    DailyLog,
    Goal,
    GoalMilestone,
    HabitLog,
    TimerSession,
    User,
    UserPreferences,
)
from routers import auth
from schemas import (
    AskRequest,
    AskResponse,
    BatchCalendarItemCreate,
    BatchCalendarItemResponse,
    CalendarEventCreate,
    CalendarItemResponse,
    CalendarItemUpdate,
    CalendarTaskCreate,
    DailyLogCreate,
    DailyLogResponse,
    DailyLogUpdate,
    GoalCreate,
    GoalMilestoneUpdate,
    GoalResponse,
    GoalUpdate,
    ProductivityStatsResponse,
    TimerSessionCreate,
    TimerSessionResponse,
    TimerSessionUpdate,
    UserPreferencesResponse,
    UserPreferencesUpdate,
)
from services.auth_service import AuthService
from utils.productivity import get_user_productivity_data

load_dotenv()

app = FastAPI(title="SelfForge API", version="2.0.0")
app.include_router(auth.router)

run_startup_migrations(engine)

ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "*")
origins = ["*"] if ALLOWED_ORIGINS == "*" else ALLOWED_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

NOTES_DIR = os.getenv("NOTES_DIR", "notes")
FAISS_DIR = "faiss_index"
vector_store = None
retriever = None


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_id(prefix: str) -> str:
    return f"{prefix}_{_utcnow().timestamp()}"


def load_vector_store():
    global vector_store, retriever

    if vector_store is not None:
        return vector_store

    try:
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        if os.path.exists(FAISS_DIR):
            vector_store = FAISS.load_local(
                FAISS_DIR,
                embeddings,
                allow_dangerous_deserialization=True,
            )
        else:
            documents = []
            if os.path.exists(NOTES_DIR):
                for path in glob.glob(f"{NOTES_DIR}/**/*.md", recursive=True):
                    documents.extend(TextLoader(path, encoding="utf-8").load())

            if not documents:
                vector_store = FAISS.from_texts(["Empty knowledge base"], embeddings)
            else:
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000,
                    chunk_overlap=200,
                )
                splits = splitter.split_documents(documents)
                vector_store = FAISS.from_documents(splits, embeddings)
                vector_store.save_local(FAISS_DIR)

        retriever = vector_store.as_retriever(search_kwargs={"k": 5})
        return vector_store
    except Exception:
        return None


groq_api_key = os.getenv("GROQ_API_KEY")
ai_enabled = bool(groq_api_key)
rag_chain = None
llm = None

if ai_enabled:
    try:
        llm = ChatGroq(
            api_key=groq_api_key,
            model="llama-3.1-8b-instant",
        )

        prompt = PromptTemplate.from_template(
            """
You are a personal productivity and self-improvement assistant with access to the user's productivity data.

Recent productivity data (last 30 days):
{productivity_data}

Relevant notes:
{context}

User question:
{input}
"""
        )

        load_vector_store()
        if retriever is not None:
            document_chain = create_stuff_documents_chain(llm, prompt)
            rag_chain = create_retrieval_chain(retriever, document_chain)
    except Exception:
        ai_enabled = False
        rag_chain = None
        llm = None


@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "ai_enabled": ai_enabled,
        "features": {
            "calendar": True,
            "goals": True,
            "timer": True,
            "analytics": True,
            "ai_chat": ai_enabled,
        },
    }


@app.get("/calendar/items", response_model=List[CalendarItemResponse])
def get_calendar_items(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    item_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    completed: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CalendarItem).filter(CalendarItem.user_id == current_user.id)

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

    return query.order_by(CalendarItem.start_datetime.asc()).all()


@app.post("/calendar/items", response_model=CalendarItemResponse)
def create_calendar_item(
    item: CalendarTaskCreate | CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = item.model_dump()
    db_item = CalendarItem(
        id=data.get("id") or _new_id("item"),
        user_id=current_user.id,
        **data,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.get("/calendar/items/{item_id}", response_model=CalendarItemResponse)
def get_calendar_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(CalendarItem)
        .filter(CalendarItem.id == item_id, CalendarItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Calendar item not found")
    return item


@app.put("/calendar/items/{item_id}", response_model=CalendarItemResponse)
def update_calendar_item(
    item_id: str,
    item_update: CalendarItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_item = (
        db.query(CalendarItem)
        .filter(CalendarItem.id == item_id, CalendarItem.user_id == current_user.id)
        .first()
    )
    if not db_item:
        raise HTTPException(status_code=404, detail="Calendar item not found")

    for field, value in item_update.model_dump(exclude_unset=True).items():
        setattr(db_item, field, value)

    db_item.updated_at = _utcnow()
    db.commit()
    db.refresh(db_item)
    return db_item


@app.delete("/calendar/items/{item_id}")
def delete_calendar_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_item = (
        db.query(CalendarItem)
        .filter(CalendarItem.id == item_id, CalendarItem.user_id == current_user.id)
        .first()
    )
    if not db_item:
        raise HTTPException(status_code=404, detail="Calendar item not found")

    db.delete(db_item)
    db.commit()
    return {"message": "Calendar item deleted successfully"}


@app.post("/calendar/items/batch", response_model=BatchCalendarItemResponse)
def create_calendar_items_batch(
    batch_request: BatchCalendarItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    created = []
    errors = []

    for idx, item_data in enumerate(batch_request.items):
        try:
            data = item_data.model_dump()
            db_item = CalendarItem(
                id=data.get("id") or _new_id(f"batch_{idx}"),
                user_id=current_user.id,
                **data,
            )
            db.add(db_item)
            db.flush()
            created.append(db_item)
        except Exception as exc:
            errors.append({"index": idx, "error": str(exc)})

    if errors:
        db.rollback()
    else:
        db.commit()
        for item in created:
            db.refresh(item)

    return BatchCalendarItemResponse(created=created, errors=errors)


@app.get("/goals", response_model=List[GoalResponse])
def get_goals(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Goal).filter(Goal.user_id == current_user.id)
    if status:
        query = query.filter(Goal.status == status)
    if category:
        query = query.filter(Goal.category == category)
    return query.order_by(Goal.created_at.desc()).all()


@app.post("/goals", response_model=GoalResponse)
def create_goal(
    goal: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal_data = goal.model_dump(exclude={"milestones"})
    db_goal = Goal(
        id=goal.model_dump().get("id") or _new_id("goal"),
        user_id=current_user.id,
        **goal_data,
    )
    db.add(db_goal)
    db.flush()

    for milestone_data in goal.milestones or []:
        db_milestone = GoalMilestone(
            id=_new_id("ms"),
            user_id=current_user.id,
            goal_id=db_goal.id,
            **milestone_data.model_dump(),
        )
        db.add(db_milestone)

    db.commit()
    db.refresh(db_goal)
    return db_goal


@app.get("/goals/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == current_user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@app.put("/goals/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: str,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == current_user.id)
        .first()
    )
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for field, value in goal_update.model_dump(exclude_unset=True).items():
        setattr(db_goal, field, value)
    db_goal.updated_at = _utcnow()

    db.commit()
    db.refresh(db_goal)
    return db_goal


@app.put("/goals/{goal_id}/milestones/{milestone_id}")
def update_milestone(
    goal_id: str,
    milestone_id: str,
    milestone_update: GoalMilestoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = (
        db.query(GoalMilestone)
        .filter(
            GoalMilestone.id == milestone_id,
            GoalMilestone.goal_id == goal_id,
            GoalMilestone.user_id == current_user.id,
        )
        .first()
    )
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    for field, value in milestone_update.model_dump(exclude_unset=True).items():
        if field == "completed":
            if value and not milestone.completed:
                milestone.completed_at = _utcnow()
            if not value:
                milestone.completed_at = None
        setattr(milestone, field, value)

    milestone.updated_at = _utcnow()

    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == current_user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    milestones = (
        db.query(GoalMilestone)
        .filter(GoalMilestone.goal_id == goal_id, GoalMilestone.user_id == current_user.id)
        .all()
    )
    completed_count = sum(1 for item in milestones if item.completed)
    total_count = len(milestones)
    goal.progress = int((completed_count / total_count) * 100) if total_count else 0

    if goal.progress == 100:
        goal.status = "completed"
    elif goal.progress > 0:
        goal.status = "in-progress"

    db.commit()
    return {"message": "Milestone updated successfully"}


@app.get("/timer/sessions", response_model=List[TimerSessionResponse])
def get_timer_sessions(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    completed: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TimerSession).filter(TimerSession.user_id == current_user.id)

    if start_date:
        query = query.filter(TimerSession.start_time >= start_date)
    if end_date:
        query = query.filter(TimerSession.start_time <= end_date)
    if completed is not None:
        query = query.filter(TimerSession.completed == completed)

    return query.order_by(TimerSession.start_time.desc()).all()


@app.post("/timer/sessions", response_model=TimerSessionResponse)
def create_timer_session(
    session: TimerSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_session = TimerSession(
        id=_new_id("timer"),
        user_id=current_user.id,
        **session.model_dump(),
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@app.put("/timer/sessions/{session_id}", response_model=TimerSessionResponse)
def update_timer_session(
    session_id: str,
    session_update: TimerSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_session = (
        db.query(TimerSession)
        .filter(TimerSession.id == session_id, TimerSession.user_id == current_user.id)
        .first()
    )
    if not db_session:
        raise HTTPException(status_code=404, detail="Timer session not found")

    update_data = session_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_session, field, value)

    if (
        session_update.completed
        and session_update.created_calendar_entry
        and not db_session.calendar_item_id
    ):
        calendar_task = CalendarItem(
            id=_new_id("task"),
            user_id=current_user.id,
            title=db_session.title,
            item_type="task",
            category=db_session.category,
            start_datetime=db_session.start_time,
            end_datetime=db_session.end_time or _utcnow(),
            completed=True,
            completed_at=db_session.end_time or _utcnow(),
            actual_duration=db_session.duration,
            priority="medium",
        )
        db.add(calendar_task)
        db_session.calendar_item_id = calendar_task.id

    db.commit()
    db.refresh(db_session)
    return db_session


@app.get("/logs/daily", response_model=List[DailyLogResponse])
def get_daily_logs(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(DailyLog).filter(DailyLog.user_id == current_user.id)

    if start_date:
        query = query.filter(DailyLog.log_date >= start_date)
    if end_date:
        query = query.filter(DailyLog.log_date <= end_date)

    return query.order_by(DailyLog.log_date.desc()).all()


@app.post("/logs/daily", response_model=DailyLogResponse)
def create_daily_log(
    log: DailyLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_day = log.log_date.date()
    existing_log = (
        db.query(DailyLog)
        .filter(DailyLog.user_id == current_user.id, DailyLog.log_date == target_day)
        .first()
    )
    if existing_log:
        raise HTTPException(
            status_code=400,
            detail="Daily log for this date already exists. Use PUT to update.",
        )

    db_log = DailyLog(user_id=current_user.id, **log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@app.put("/logs/daily/{log_id}", response_model=DailyLogResponse)
def update_daily_log(
    log_id: int,
    log_update: DailyLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_log = (
        db.query(DailyLog)
        .filter(DailyLog.id == log_id, DailyLog.user_id == current_user.id)
        .first()
    )
    if not db_log:
        raise HTTPException(status_code=404, detail="Daily log not found")

    for field, value in log_update.model_dump(exclude_unset=True).items():
        setattr(db_log, field, value)

    db_log.updated_at = _utcnow()
    db.commit()
    db.refresh(db_log)
    return db_log


@app.get("/preferences", response_model=UserPreferencesResponse)
def get_user_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefs = (
        db.query(UserPreferences)
        .filter(UserPreferences.user_id == current_user.id)
        .first()
    )
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs


@app.put("/preferences", response_model=UserPreferencesResponse)
def update_user_preferences(
    prefs_update: UserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefs = (
        db.query(UserPreferences)
        .filter(UserPreferences.user_id == current_user.id)
        .first()
    )
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
        db.flush()

    for field, value in prefs_update.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)

    prefs.updated_at = _utcnow()
    db.commit()
    db.refresh(prefs)
    return prefs


@app.get("/analytics/productivity", response_model=ProductivityStatsResponse)
def get_productivity_stats(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = _utcnow()
    if not start_date:
        start_date = now - timedelta(days=30)
    if not end_date:
        end_date = now
    if start_date > end_date:
        start_date, end_date = end_date, start_date

    calendar_items = (
        db.query(CalendarItem)
        .filter(
            CalendarItem.user_id == current_user.id,
            CalendarItem.start_datetime >= start_date,
            CalendarItem.start_datetime <= end_date,
        )
        .all()
    )
    timer_sessions = (
        db.query(TimerSession)
        .filter(
            TimerSession.user_id == current_user.id,
            TimerSession.start_time >= start_date,
            TimerSession.start_time <= end_date,
            TimerSession.completed.is_(True),
        )
        .all()
    )

    tasks = [item for item in calendar_items if item.item_type == "task"]
    completed_tasks = [item for item in tasks if item.completed]
    events = [item for item in calendar_items if item.item_type == "event"]

    total_focus_time = sum(item.duration for item in timer_sessions if item.duration)
    total_deep_work_time = sum(
        item.duration
        for item in timer_sessions
        if item.duration and item.category == "deep-work"
    )

    category_breakdown: dict[str, int] = {}
    for item in calendar_items:
        category = item.category or "uncategorized"
        category_breakdown[category] = category_breakdown.get(category, 0) + 1

    days_in_range = max((end_date - start_date).days, 1)
    daily_averages = {
        "tasks_per_day": round(len(tasks) / days_in_range, 2),
        "events_per_day": round(len(events) / days_in_range, 2),
        "focus_minutes_per_day": round(total_focus_time / days_in_range, 2),
    }

    completion_rate = len(completed_tasks) / len(tasks) if tasks else 0

    return ProductivityStatsResponse(
        total_tasks=len(tasks),
        completed_tasks=len(completed_tasks),
        total_events=len(events),
        total_focus_time_minutes=total_focus_time,
        total_deep_work_minutes=total_deep_work_time,
        completion_rate=round(completion_rate, 3),
        category_breakdown=category_breakdown,
        daily_averages=daily_averages,
    )


@app.post("/ask", response_model=AskResponse)
def ask_ai(
    req: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not ai_enabled or llm is None:
        return AskResponse(
            response="AI features are currently disabled. Set GROQ_API_KEY to enable AI assistance.",
            context_used=req.include_context,
            timestamp=_utcnow(),
        )

    try:
        productivity_data = get_user_productivity_data(
            db=db,
            user_id=current_user.id,
            days=30,
        )

        if rag_chain is not None:
            result = rag_chain.invoke(
                {
                    "input": req.question,
                    "productivity_data": productivity_data,
                }
            )
            response_text = result.get("answer", "I could not generate a response.")
        else:
            prompt_text = (
                "You are a personal productivity assistant.\n\n"
                f"User productivity data:\n{productivity_data}\n\n"
                f"Question: {req.question}\n"
            )
            llm_response = llm.invoke(prompt_text)
            response_text = getattr(llm_response, "content", str(llm_response))

        return AskResponse(
            response=response_text,
            context_used=req.include_context,
            timestamp=_utcnow(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI processing error: {exc}") from exc


@app.get("/logs")
def get_legacy_logs(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = _utcnow() - timedelta(days=days)
    logs = (
        db.query(HabitLog)
        .filter(HabitLog.user_id == current_user.id, HabitLog.timestamp >= since)
        .order_by(HabitLog.timestamp.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "habit": item.habit,
            "value": item.value,
            "timestamp": item.timestamp.isoformat(),
        }
        for item in logs
    ]


@app.post("/logs")
def create_legacy_log(
    log: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = HabitLog(
        user_id=current_user.id,
        habit=log.get("habit"),
        value=log.get("value"),
        timestamp=log.get("timestamp") or _utcnow(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": entry.id}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
