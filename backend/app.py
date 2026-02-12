import glob
import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from pydantic import BaseModel

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

from models import (
    CalendarItem,
    DailyLog,
    Goal,
    GoalMilestone,
    HabitLog,
    TimerSession,
    UserPreferences,
)

from database import SessionLocal, engine

from routers import auth, calendar, goals, timer, daily_logs, analytics, ai

from schemas import (
    AskRequest,
    AskResponse,
        DailyLogCreate,
    DailyLogResponse,
    DailyLogUpdate,
    GoalCreate,
    GoalMilestoneUpdate,
    GoalResponse,
    GoalUpdate,
    ProductivityStatsRequest,
    ProductivityStatsResponse,
    TimerSessionCreate,
    TimerSessionResponse,
    TimerSessionUpdate,
    UserPreferencesResponse,
    UserPreferencesUpdate,
)

load_dotenv()


app = FastAPI(title="SelfForge API", version="2.0.0")

ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "*")

if ALLOWED_ORIGINS == "*":
    origins = ["*"]
else:
    origins = ALLOWED_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

NOTES_DIR = os.getenv("NOTES_DIR", "notes")
FAISS_DIR = "faiss_index"

# Initialize vector store only if needed for AI
vector_store = None
retriever = None



def load_vector_store():
    """Lazy load vector store only when needed"""
    global vector_store, retriever

    if vector_store is not None:
        return vector_store

    try:
        from langchain_huggingface import HuggingFaceEmbeddings

        print("🔄 Initializing vector store...")
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
                print("⚠️ No notes found, creating empty index")
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
        print("✅ Vector store initialized")
        return vector_store
    except Exception as e:
        print(f"⚠️ Vector store initialization failed: {e}")
        return None


# ------------------ LLM ------------------

# Check if GROQ_API_KEY is available
groq_api_key = os.getenv("GROQ_API_KEY")
ai_enabled = bool(groq_api_key)

if ai_enabled:
    try:
        llm = ChatGroq(
            api_key=groq_api_key,
            model="llama-3.1-8b-instant",
        )

        prompt = PromptTemplate.from_template(
            """
You are a personal productivity and self-improvement assistant with access to the user's comprehensive productivity data.

Recent productivity data (last 30 days):
{productivity_data}

Relevant notes from knowledge base:
{context}

User question:
{input}

Instructions:
- Analyze patterns in tasks, habits, goals, and timer sessions
- Provide actionable insights based on the data
- Suggest improvements for productivity and well-being
- Be specific and reference actual data points
- Offer practical next steps
- Be encouraging but honest about areas for improvement
"""
        )

        # Initialize vector store only when AI is enabled
        load_vector_store()

        if retriever is not None:
            document_chain = create_stuff_documents_chain(llm, prompt)
            rag_chain = create_retrieval_chain(retriever, document_chain)
            print("✅ AI features with knowledge base enabled")
        else:
            # Fallback to simple LLM without RAG
            rag_chain = None
            print("✅ AI features enabled (without knowledge base)")
    except Exception as e:
        print(f"⚠️ AI initialization failed: {e}")
        ai_enabled = False
        rag_chain = None
else:
    print("⚠️ GROQ_API_KEY not found - AI features disabled")
    rag_chain = None


# ------------------ Helper Functions ------------------

    # ---------------- Goals ----------------

    if goals:
        data_summary.append("\nGOALS:")

        for goal in goals:
            milestones = goal.milestones or []

            completed = sum(1 for m in milestones if m.completed)
            total = len(milestones)

            progress = (completed / total * 100) if total else 0

            data_summary.append(
                f"- {goal.title}: {progress:.1f}% ({completed}/{total})"
            )

    # ---------------- Focus ----------------

    completed_sessions = [s for s in timer_sessions if s.completed]

    total_focus_time = sum(s.duration for s in completed_sessions)

    data_summary.append(f"\nFOCUS ({days} days):")
    data_summary.append(f"- Sessions: {len(completed_sessions)}")
    data_summary.append(
        f"- Total focus: {total_focus_time} min ({total_focus_time/60:.1f} hrs)"
    )

    # ---------------- Habits ----------------

    if daily_logs:
        sleep_values = [l.sleep_hours for l in daily_logs if l.sleep_hours]
        mood_values = [l.mood for l in daily_logs if l.mood]

        avg_sleep = (
            sum(sleep_values) / len(sleep_values)
            if sleep_values
            else 0
        )

        avg_mood = (
            sum(mood_values) / len(mood_values)
            if mood_values
            else 0
        )

        gym_days = sum(1 for l in daily_logs if l.gym_completed)

        data_summary.append(f"\nHABITS ({len(daily_logs)} days):")
        data_summary.append(f"- Avg sleep: {avg_sleep:.1f}h")
        data_summary.append(f"- Avg mood: {avg_mood:.1f}/10")
        data_summary.append(
            f"- Gym: {gym_days}/{len(daily_logs)} days"
        )

    return "\n".join(data_summary) or "No productivity data available."

# ------------------ Routes ------------------


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


# ------------------ Calendar Item Routes ------------------


@app.get("/calendar/items", response_model=List[CalendarItemResponse])
def get_calendar_items(
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


# ------------------ Goal Routes ------------------


@app.get("/goals", response_model=List[GoalResponse])
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


@app.post("/goals", response_model=GoalResponse)
def create_goal(goal: GoalCreate, db: Session = Depends(get_db)):
    """Create a new goal with milestones"""
    db_goal = Goal(
        id=goal.dict().get("id", str(datetime.utcnow().timestamp())),
        **goal.dict(exclude={"milestones"}),
    )

    db.add(db_goal)
    db.flush()  # Flush to get the goal ID

    # Add milestones
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


@app.get("/goals/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: str, db: Session = Depends(get_db)):
    """Get a specific goal with its milestones"""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@app.put("/goals/{goal_id}", response_model=GoalResponse)
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


@app.put("/goals/{goal_id}/milestones/{milestone_id}")
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


# ------------------ Timer Session Routes ------------------


@app.get("/timer/sessions", response_model=List[TimerSessionResponse])
def get_timer_sessions(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    completed: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    """Get timer sessions with optional filtering"""
    query = db.query(TimerSession)

    if start_date:
        query = query.filter(TimerSession.start_time >= start_date)
    if end_date:
        query = query.filter(TimerSession.start_time <= end_date)
    if completed is not None:
        query = query.filter(TimerSession.completed == completed)

    sessions = query.order_by(TimerSession.start_time.desc()).all()
    return sessions


@app.post("/timer/sessions", response_model=TimerSessionResponse)
def create_timer_session(
    session: TimerSessionCreate,
    db: Session = Depends(get_db),
):
    """Start a new timer session"""
    db_session = TimerSession(
        id=f"timer_{datetime.utcnow().timestamp()}",
        **session.dict(),
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
):
    """Update a timer session (typically to mark as completed)"""
    db_session = db.query(TimerSession).filter(TimerSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Timer session not found")

    update_data = session_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_session, field, value)

    # If marked as completed and auto-create is enabled, create calendar task
    if (
        session_update.completed
        and session_update.created_calendar_entry
        and not db_session.calendar_item_id
    ):
        calendar_task = CalendarItem(
            id=f"task_{session_id}",
            title=db_session.title,
            item_type="task",
            category=db_session.category,
            start_datetime=db_session.start_time,
            end_datetime=db_session.end_time or datetime.utcnow(),
            completed=True,
            completed_at=db_session.end_time or datetime.utcnow(),
            actual_duration=db_session.duration,
            priority="medium",
        )

        db.add(calendar_task)
        db_session.calendar_item_id = calendar_task.id

    db.commit()
    db.refresh(db_session)
    return db_session


# ------------------ Daily Log Routes ------------------


@app.get("/logs/daily", response_model=List[DailyLogResponse])
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


@app.post("/logs/daily", response_model=DailyLogResponse)
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


@app.put("/logs/daily/{log_id}", response_model=DailyLogResponse)
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

    db_log.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_log)
    return db_log


# ------------------ User Preferences Routes ------------------


@app.get("/preferences", response_model=UserPreferencesResponse)
def get_user_preferences(db: Session = Depends(get_db)):
    """Get user preferences"""
    prefs = (
        db.query(UserPreferences)
        .filter(UserPreferences.user_id == "default_user")
        .first()
    )
    if not prefs:
        # Create default preferences if they don't exist
        prefs = UserPreferences(user_id="default_user")
        db.add(prefs)
        db.commit()
        db.refresh(prefs)

    return prefs


@app.put("/preferences", response_model=UserPreferencesResponse)
def update_user_preferences(
    prefs_update: UserPreferencesUpdate,
    db: Session = Depends(get_db),
):
    """Update user preferences"""
    prefs = (
        db.query(UserPreferences)
        .filter(UserPreferences.user_id == "default_user")
        .first()
    )
    if not prefs:
        raise HTTPException(status_code=404, detail="User preferences not found")

    update_data = prefs_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prefs, field, value)

    prefs.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(prefs)
    return prefs


# ------------------ Analytics Routes ------------------
@app.get("/analytics/productivity", response_model=ProductivityStatsResponse)
def get_productivity_stats(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    """Get comprehensive productivity statistics"""

    # ---------------- Defaults ----------------

    now = datetime.utcnow()

    if not start_date:
        start_date = now - timedelta(days=30)

    if not end_date:
        end_date = now

    # Ensure valid range
    if start_date > end_date:
        start_date, end_date = end_date, start_date

    # ---------------- Queries ----------------

    calendar_items = (
        db.query(CalendarItem)
        .filter(
            CalendarItem.start_datetime >= start_date,
            CalendarItem.start_datetime <= end_date,
        )
        .all()
    )

    timer_sessions = (
        db.query(TimerSession)
        .filter(
            TimerSession.start_time >= start_date,
            TimerSession.start_time <= end_date,
            TimerSession.completed == True,
        )
        .all()
    )

    # ---------------- Categorization ----------------

    tasks = [i for i in calendar_items if i.item_type == "task"]
    completed_tasks = [t for t in tasks if t.completed]
    events = [i for i in calendar_items if i.item_type == "event"]

    # ---------------- Focus Time ----------------

    total_focus_time = sum(
        s.duration for s in timer_sessions if s.duration
    )

    total_deep_work_time = sum(
        s.duration
        for s in timer_sessions
        if s.duration and s.category == "deep-work"
    )

    # ---------------- Category Breakdown ----------------

    category_breakdown: dict[str, int] = {}

    for item in calendar_items:
        cat = item.category or "uncategorized"
        category_breakdown[cat] = category_breakdown.get(cat, 0) + 1

    # ---------------- Daily Averages ----------------

    days_in_range = max((end_date - start_date).days, 1)

    tasks_per_day = len(tasks) / days_in_range
    events_per_day = len(events) / days_in_range
    focus_per_day = total_focus_time / days_in_range

    daily_averages = {
        "tasks_per_day": round(tasks_per_day, 2),
        "events_per_day": round(events_per_day, 2),
        "focus_minutes_per_day": round(focus_per_day, 2),
    }

    # ---------------- Completion Rate ----------------

    completion_rate = (
        len(completed_tasks) / len(tasks)
        if tasks
        else 0
    )

    # ---------------- Response ----------------

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

# ------------------ ai chat routes ------------------


@app.post("/ask", response_model=AskResponse)
def ask_ai(req: AskRequest, db: session = Depends(get_db)):
    """ask the ai assistant with access to productivity data"""
    if not ai_enabled or not rag_chain:
        return AskResponse(
            response="ai features are currently disabled. please set groq_api_key environment variable to enable ai assistance.",
            context_used=req.include_context,
            timestamp=datetime.utcnow(),
        )

    try:
        # get user's productivity data for context
        productivity_data = get_user_productivity_data(db, days=30)

        if rag_chain is not None:
            # use rag chain with knowledge base
            result = rag_chain.invoke(
                {
                    "input": req.question,
                    "productivity_data": productivity_data,
                }
            )
            response_text = result["answer"]
        else:
            # fallback to direct llm call without knowledge base
            prompt_text = f"""
you are a personal productivity assistant.

user's productivity data:
{productivity_data}

question: {req.question}

provide helpful insights based on the data above.
"""
            response_text = f"based on your productivity data, here's my analysis: {req.question}. (note: knowledge base unavailable, providing basic response.)"

        return AskResponse(
            response=response_text,
            context_used=req.include_context,
            timestamp=datetime.utcnow(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ai processing error: {str(e)}")


# ------------------ legacy routes (for backward compatibility) ------------------


@app.get("/logs")
def get_legacy_logs(days: int = 30, db: session = Depends(get_db)):
    """legacy route for habit logs"""
    since = datetime.utcnow() - timedelta(days=days)

    logs = (
        db.query(habitlog)
        .filter(habitlog.timestamp >= since)
        .order_by(habitlog.timestamp.desc())
        .all()
    )

    return [
        {
            "id": l.id,
            "habit": l.habit,
            "value": l.value,
            "timestamp": l.timestamp.isoformat(),
        }
        for l in logs
    ]


@app.post("/logs")
def create_legacy_log(
    log: dict,
    db: session = Depends(get_db),
):
    """legacy route for creating habit logs"""
    entry = habitlog(
        habit=log.get("habit"),
        value=log.get("value"),
        timestamp=log.get("timestamp") or datetime.utcnow(),
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {"id": entry.id}


if __name__ == "__main__":
    try:
        import uvicorn

        print("🚀 starting selfforge backend server...")
        print("📋 api documentation: http://127.0.0.1:8000/docs")
        uvicorn.run(app, host="127.0.0.1", port=8000, reload=true)
    except importerror:
        print("❌ uvicorn not found. installing...")
        import subprocess
        import sys

        subprocess.check_call([sys.executable, "-m", "pip", "install", "uvicorn"])
        import uvicorn

        print("✅ uvicorn installed. starting server...")
        uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        print("💡 Try: pip install uvicorn fastapi")
