import { Link } from "react-router-dom";
import { Plus, TrendingUp, Calendar, Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { MoodChart } from "@/components/dashboard/MoodChart";
import { HabitStreak } from "@/components/dashboard/HabitStreak";
import { TodaySummary } from "@/components/dashboard/TodaySummary";
import { StreakCalendar } from "@/components/dashboard/StreakCalendar";
import { HabitConsistency } from "@/components/dashboard/HabitConsistency";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import {
  format,
  subDays,
  isSameDay,
  differenceInDays,
  parseISO,
  isValid,
} from "date-fns";

function safeFormatDate(value: string | Date | null | undefined) {
  if (!value) return null;

  const date = typeof value === "string" ? parseISO(value) : value;

  return isValid(date) ? format(date, "MMM d") : null;
}

export default function Dashboard() {
  const { logs, todayLog, loading } = useDailyLogs();
  const currentDate = safeFormatDate(new Date(), "EEEE, MMMM d");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate stats from real data
  const today = new Date();

  // Calculate current streak (consecutive days logged)
  let currentStreak = 0;
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime(),
  );

  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i].log_date);
    const expectedDate = subDays(today, i);
    if (
      isSameDay(logDate, expectedDate) ||
      (i === 0 && differenceInDays(today, logDate) <= 1)
    ) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Mood data for chart
  const moodData = logs
    .filter((log) => log.mood !== null)
    .slice(0, 7)
    .reverse()
    .map((log) => {
      const date = safeFormatDate(log.timestamp);
      if (!date || log.mood == null) return null;

      return {
        date,
        mood: log.mood,
      };
    })
    .filter(Boolean);

  // Gym streak dates
  const gymDates = logs
    .filter((log) => log.gym_completed)
    .map((log) => new Date(log.log_date));

  const gymStreak = gymDates.length;

  // Calculate averages
  const avgMood =
    logs.length > 0
      ? logs.reduce((sum, log) => sum + (log.mood || 0), 0) /
        logs.filter((l) => l.mood).length
      : 0;

  const habitsCompleted =
    logs.length > 0
      ? Math.round(
          (logs.filter((l) => l.gym_completed).length / logs.length) * 100,
        )
      : 0;

  // Today's log for summary
  const todaySummary = todayLog
    ? {
        sleepHours: todayLog.sleep_hours || 0,
        studyHours: todayLog.study_hours || 0,
        gymCompleted: todayLog.gym_completed || false,
        screenTimeHours: todayLog.screen_time_hours || 0,
        mood: todayLog.mood || 0,
      }
    : null;

  // All logged dates for streak calendar
  const loggedDates = logs.map((log) => new Date(log.log_date));

  // Weekly habit consistency data
  const weeklyData = calculateWeeklyConsistency(logs);

  if (logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">{currentDate}</p>
          </div>
          <Link to="/log">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Log Today
            </Button>
          </Link>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">{currentDate}</p>
        </div>
        <Link to="/log">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {todayLog ? "Edit Today" : "Log Today"}
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Streak"
          value={`${currentStreak} ${currentStreak === 1 ? "day" : "days"}`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={currentStreak > 0 ? "up" : undefined}
          trendValue={currentStreak > 0 ? "Keep it up!" : undefined}
        />
        <StatCard
          title="Total Logs"
          value={logs.length.toString()}
          icon={<Calendar className="h-5 w-5" />}
          subtitle="Last 30 days"
        />
        <StatCard
          title="Avg Mood"
          value={avgMood > 0 ? avgMood.toFixed(1) : "—"}
          icon={<Target className="h-5 w-5" />}
          trend={avgMood >= 7 ? "up" : avgMood < 5 ? "down" : undefined}
          trendValue={
            avgMood >= 7
              ? "Great!"
              : avgMood < 5
                ? "Room to improve"
                : undefined
          }
        />
        <StatCard
          title="Gym Days"
          value={`${habitsCompleted}%`}
          subtitle="Consistency rate"
        />
      </div>

      {/* Today's Summary */}
      {todaySummary ? (
        <TodaySummary log={todaySummary} />
      ) : (
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm text-center">
          <p className="text-muted-foreground mb-3">
            You haven't logged today yet
          </p>
          <Link to="/log">
            <Button variant="secondary" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Log Today's Habits
            </Button>
          </Link>
        </div>
      )}

      {/* Streak Calendar */}
      <StreakCalendar loggedDates={loggedDates} />

      {/* Charts and Streaks */}
      <div className="grid lg:grid-cols-2 gap-6">
        {moodData.length > 0 && <MoodChart data={moodData} />}
        <HabitStreak
          habitName="🏋️ Gym Workout"
          completedDates={gymDates}
          streakCount={gymStreak}
        />
      </div>

      {/* Weekly Consistency */}
      {weeklyData.length > 0 && <HabitConsistency data={weeklyData} />}

      {/* Latest Journal Entry */}
      {logs[0]?.notes && (
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Latest Journal Entry
          </h3>
          <p className="text-foreground leading-relaxed">"{logs[0].notes}"</p>
          <p className="text-xs text-muted-foreground mt-3">
            {safeFormatDate(new Date(logs[0].log_date), "EEEE, MMMM d")} •{" "}
            {safeFormatDate(new Date(logs[0].updated_at), "h:mm a")}
          </p>
        </div>
      )}
    </div>
  );
}

function calculateWeeklyConsistency(logs: any[]) {
  if (logs.length === 0) return [];

  // Group logs by week and calculate consistency
  const weeks: {
    [key: string]: { gym: number; study: number; sleep: number; total: number };
  } = {};

  logs.forEach((log) => {
    const date = new Date(log.log_date);
    const weekStart = safeFormatDate(subDays(date, date.getDay()), "MMM d");

    if (!weeks[weekStart]) {
      weeks[weekStart] = { gym: 0, study: 0, sleep: 0, total: 0 };
    }

    weeks[weekStart].total++;
    if (log.gym_completed) weeks[weekStart].gym++;
    if ((log.study_hours || 0) >= 2) weeks[weekStart].study++;
    if ((log.sleep_hours || 0) >= 7) weeks[weekStart].sleep++;
  });

  return Object.entries(weeks)
    .slice(0, 4)
    .map(([week, data]) => ({
      week,
      gym: Math.round((data.gym / data.total) * 100),
      study: Math.round((data.study / data.total) * 100),
      sleep: Math.round((data.sleep / data.total) * 100),
    }))
    .reverse();
}
