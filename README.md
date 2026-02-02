# SelfForge

**SelfForge** is a local-first productivity desktop app for tracking habits, tasks, timers, and personal insights supported by AI.  
It combines timeline logging, customizable trackers, and optional AI guidance from your own notes and habit history.

---

## Overview

SelfForge helps you:

✅ Track habits and routines  
✅ Log tasks with optional reminders  
✅ Record daily deep-work timers  
✅ Visualize your timeline  
✅ Get personalized insights powered by RAG + LLMs  
✅ Backup your data locally

Built with:
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui  
- **Backend:** Python FastAPI (local, optional)  
- **Desktop:** Tauri (cross-platform native builds)  
- **AI:** Groq LLM & FAISS for RAG indexing

---

## Features

### Core
- Daily habit tracker (sleep, study, screen time, mood, etc.)
- Flexible custom habits
- Deep-work timer with history → timeline sync
- Task list with reminders and timeline logging
- Full timeline view of your day
- Data export (JSON/CSV)

### AI Insights
- Ask questions about your logs & notes
- RAG search on Obsidian or local notes
- Personalized coaching responses

### Desktop Focus
- Local data only — no cloud unless you want
- Backup & export your data easily
- Crash safe with error boundary and robust storage

---

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

**Desktop**
- Tauri

**Backend (local)**
- Python
- FastAPI
- FAISS (vector search)
- Optional Groq LLM integration

---

## Project Structure

SelfForge/
├─ src/ # React frontend
├─ backend/ # FastAPI backend (local)
├─ src-tauri/ # Tauri desktop wrapper
├─ public/
├─ README.md
└─ .gitignore


## Running in Development

### Frontend
```bash
npm install
npm run dev
```

### Backend (optional)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload
```

### Desktop Build (Tauri)
```bash
npm run tauri dev    # dev mode
npm run tauri build  # production build
```

#### Data & Backups

All data is stored locally.

You can export:

- tasks
- timeline history
- timers
- logs

from Settings → Export Data.
