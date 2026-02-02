# SelfForge – Personal AI Habit Tracker

Personal productivity web app with Supabase auth and dashboard. Planned: habit logging, Groq LLM insights, RAG on notes/logs.

## Setup

1. Clone repo

2. `npm install`

3. Create `.env.local` with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
# Optional: Add Groq API key for AI features (can also be set in Settings)
# VITE_GROQ_API_KEY=your_groq_api_key
```

4. Run `npm run dev`

## Features

- **Authentication**: Email/password auth with Supabase
- **Dashboard**: View habit statistics, mood trends, and streak calendar
- **Daily Logging**: Track sleep, study hours, gym, screen time, mood, and custom habits
- **AI Chat**: Get personalized insights based on your habit data (requires Groq API key)
- **Settings**: Dark/light mode, data export, API key management

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Data Fetching**: TanStack React Query
- **Routing**: React Router v6

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── dashboard/   # Dashboard-specific components
│   ├── layout/      # Layout components (AppLayout, etc.)
│   └── ui/          # shadcn/ui components
├── contexts/        # React contexts (Auth, Theme)
├── hooks/           # Custom hooks (useDailyLogs, useUserNotes, etc.)
├── integrations/    # External service integrations (Supabase)
├── lib/             # Utility functions
├── pages/           # Route page components
└── main.tsx         # App entry point
```

## Backend Integration Points

Key files with comments for custom backend integration:

- `src/hooks/useDailyLogs.ts` - Replace Supabase calls with custom API
- `src/hooks/useUserNotes.ts` - Replace Supabase calls with custom API
- `src/pages/Auth.tsx` - Replace Supabase auth with custom endpoints
- `src/contexts/AuthContext.tsx` - Custom auth state management
- `src/components/ErrorBoundary.tsx` - Error logging integration

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Yes |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | Yes |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
