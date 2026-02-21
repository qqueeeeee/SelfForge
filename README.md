# SelfForge

A full-stack AI-powered productivity platform. Plan your day, track your habits, and get personalised insights from an AI assistant that actually knows your data.

Built end-to-end — FastAPI backend, React TypeScript frontend, RAG-powered AI, deployed on AWS.

**[Live Demo](http://selfforge.s3-website.eu-north-1.amazonaws.com/)**

---

## What it does

SelfForge is a personal productivity system that combines task management, calendar planning, and habit tracking with an AI assistant that has context on your actual activity. Instead of a generic chatbot, the AI reads your goals, calendar, and habits through a RAG pipeline and gives you answers that are specific to you.

- Calendar with day, week, and month views
- Task and event management with completion tracking
- Habit tracking with streak monitoring
- Analytics dashboard showing focus time, completion rates, and category trends
- Pomodoro and deep-work timer
- AI assistant powered by LangChain + FAISS + Groq that answers questions using your own productivity data
- Secure multi-user system with JWT auth and bcrypt password hashing

---

## Tech Stack

**Frontend** — React, TypeScript, Vite, Tailwind CSS, shadcn/ui

**Backend** — FastAPI, SQLAlchemy, PostgreSQL, Uvicorn

**AI Layer** — LangChain, FAISS vector store, Groq LLM (RAG pipeline)

**Infrastructure** — AWS EC2 (backend), AWS S3 (frontend)

---

## Architecture

```
React Frontend (S3)
      ↓
FastAPI REST API (EC2)
      ↓
SQLAlchemy + PostgreSQL
      ↓
RAG Pipeline (LangChain + FAISS + Groq)
```

User data gets embedded into a FAISS vector store. When you ask the AI assistant a question, it does semantic search over your own data before generating a response — so the context is always personalised.

---

## Running locally

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (or SQLite for local dev)
- A [Groq API key](https://console.groq.com)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

# create a .env file
cp .env.example .env           # then fill in your keys

uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`

### Frontend

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:8080`

### Environment variables

```env
DATABASE_URL=postgresql://user:password@localhost/selfforge
SECRET_KEY=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
```

---

## Project structure

```
SelfForge/
├── backend/
│   ├── app.py                 # FastAPI app entry point
│   ├── core/                  # Auth deps, migrations, core config
│   ├── routers/               # Route handlers (auth, calendar, goals, etc.)
│   ├── schemas/               # Pydantic request/response schemas
│   ├── services/              # Auth + AI service layer
│   ├── utils/                 # Productivity data helpers
│   ├── tests/                 # API/integration tests
│   ├── models.py              # SQLAlchemy models
│   ├── database.py            # DB engine/session setup
│   └── requirements.txt
├── src/
│   ├── components/            # UI + feature components
│   │   ├── calendar/          # Calendar views and item modals
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── layout/            # App layout shell
│   │   └── ui/                # shadcn/ui primitives
│   ├── pages/                 # Route-level pages
│   ├── hooks/                 # Custom hooks/state logic
│   ├── contexts/              # Theme/auth context providers
│   ├── lib/                   # API client and shared utilities
│   └── integrations/          # External integration clients
├── faiss_index/          # Persisted vector store
├── public/
└── README.md
```

---

## Built by

Sasank Kodamarthy — [GitHub](https://github.com/qqueeeeee) · [LinkedIn](https://linkedin.com/in/sasank-kodamarthy)
