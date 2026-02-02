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

## Installation

### Development (web app)

Clone and install:

```bash
git clone https://github.com/qqueeeeee/SelfForge.git
cd SelfForge
pnpm install  # or npm/yarn
