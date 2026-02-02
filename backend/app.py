import glob
import os
from datetime import datetime, timedelta

from db import HabitLog, SessionLocal
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains.retrieval import create_retrieval_chain
from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic import BaseModel
from sqlalchemy.orm import Session

# ------------------ Setup ------------------
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ Schemas ------------------


class AskRequest(BaseModel):
    question: str


class LogCreate(BaseModel):
    habit: str
    value: dict | str | int | float | bool
    timestamp: datetime | None = None


# ------------------ Vector Store ------------------

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

if os.path.exists("faiss_index"):
    vector_store = FAISS.load_local(
        "faiss_index",
        embeddings,
        allow_dangerous_deserialization=True,
    )
else:
    notes_dir = os.getenv("NOTES_DIR")
    documents = []

    for path in glob.glob(f"{notes_dir}/**/*.md", recursive=True):
        documents.extend(TextLoader(path, encoding="utf-8").load())

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )

    splits = splitter.split_documents(documents)
    vector_store = FAISS.from_documents(splits, embeddings)
    vector_store.save_local("faiss_index")

retriever = vector_store.as_retriever(search_kwargs={"k": 5})

# ------------------ LLM ------------------

llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.1-8b-instant",
)

prompt = PromptTemplate.from_template(
    """
You are a personal productivity and self-improvement assistant.

Recent habit logs (last 30 days):
{logs}

Relevant notes:
{context}

User question:
{input}

Instructions:
- Base insights on the habit data
- Identify patterns and inconsistencies
- Be honest and actionable
"""
)

document_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, document_chain)

# ------------------ Helpers ------------------


def get_recent_logs(db: Session, days: int = 30):
    since = datetime.utcnow() - timedelta(days=days)
    return (
        db.query(HabitLog)
        .filter(HabitLog.timestamp >= since)
        .order_by(HabitLog.timestamp.desc())
        .all()
    )


# ------------------ Routes ------------------


@app.get("/logs")
def get_logs(days: int = 30):
    db = SessionLocal()
    try:
        logs = get_recent_logs(db, days)
        return [
            {
                "id": l.id,
                "habit": l.habit,
                "value": l.value,
                "timestamp": l.timestamp.isoformat(),
            }
            for l in logs
        ]
    finally:
        db.close()


@app.post("/logs")
def create_log(log: LogCreate):
    db = SessionLocal()
    try:
        entry = HabitLog(
            habit=log.habit,
            value=log.value,
            timestamp=log.timestamp or datetime.utcnow(),
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return {"id": entry.id}
    finally:
        db.close()


@app.post("/ask")
def ask(req: AskRequest):
    db = SessionLocal()
    try:
        logs = get_recent_logs(db)
        logs_text = (
            "\n".join(f"- {l.timestamp.date()}: {l.habit} = {l.value}" for l in logs)
            or "No logs available."
        )

        result = rag_chain.invoke(
            {
                "input": req.question,
                "logs": logs_text,
            }
        )

        return {"response": result["answer"]}
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}
