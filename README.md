# SelfForge — Personal Productivity & Focus System

SelfForge is a full-stack productivity platform for task management, calendar planning, habit tracking, and AI-powered insights.

Built to help users plan, execute, and analyze their daily work with minimal friction.

---

## 🚀 Features

- 📅 Custom calendar (day/week/month views)
- ✅ Task & event management
- 🔥 Productivity streak tracking
- 📊 Analytics dashboard (focus time, habits, trends)
- ⏱ Pomodoro & deep-work timer
- 🤖 AI assistant for productivity insights
- ☁️ Cloud deployment (AWS)

---

## 🛠 Tech Stack

### Frontend
- React + TypeScript (Vite)
- Tailwind CSS
- shadcn/ui
- React Router

### Backend
- FastAPI (Python)
- SQLAlchemy + PostgreSQL/SQLite
- Uvicorn
- LangChain + LLM (RAG pipeline)

### Demo Infrastructure
- AWS EC2 (Backend)
- AWS S3 (Frontend Hosting)

---

## 📦 Architecture

Frontend (S3 + Vite)
↓
REST API (FastAPI)
↓
Database (SQLAlchemy)
↓
AI Layer (RAG + LLM)

---

## ⚙️ Setup (Local)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```
npm install
npm run dev
```

[Live Demo](http://selfforge.s3-website.eu-north-1.amazonaws.com/)

### Key Learnings

Full-stack system design
REST API architecture
AI integration (RAG + LLM)
Cloud deployment (AWS)
Production debugging
CORS, security, scaling

