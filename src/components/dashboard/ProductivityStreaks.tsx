import React from "react";
import { CalendarEvent } from "@/components/calendar/types";
import { cn } from "@/lib/utils";
import { TrendingUp, Flame, Calendar, Target } from "lucide-react";
import { format, subDays, isSameDay, startOfDay } from "date-fns";

interface ProductivityStreaksProps {
  events: CalendarEvent[];
  className?: string;
}

interface StreakData {
  name: string;
  icon: React.ReactNode;
  current: number;
  longest: number;
  color: string;
  bgColor: string;
  description: string;
}

export function ProductivityStreaks({
  events,
  className,
}: ProductivityStreaksProps) {
  const safeEvents = Array.isArray(events) ? events : [];
  // Calculate different types of streaks
  const calculateStreaks = (): StreakData[] => {
    const today = new Date();
    const last30Days = Array.from({ length: 30 }, (_, i) =>
      startOfDay(subDays(today, i)),
    ).reverse();

    // Deep Work streak - consecutive days with deep work sessions
    const deepWorkStreak = calculateConsecutiveStreak(last30Days, (date) =>
      safeEvents.some(
        (event) =>
          isSameDay(event.startDateTime, date) &&
          event.category === "deep-work",
      ),
    );

    // Daily Planning streak - consecutive days with any events
    const planningStreak = calculateConsecutiveStreak(last30Days, (date) =>
      safeEvents.some((event) => isSameDay(event.startDateTime, date)),
    );

    // Focus streak - consecutive days with 3+ hours of focused work
    const focusStreak = calculateConsecutiveStreak(last30Days, (date) => {
      const dayEvents = safeEvents.filter(
        (event) =>
          isSameDay(event.startDateTime, date) &&
          (event.category === "deep-work" || event.category === "task"),
      );
      const totalHours = dayEvents.reduce((sum, event) => {
        const duration =
          (event.endDateTime.getTime() - event.startDateTime.getTime()) /
          (1000 * 60 * 60);
        return sum + duration;
      }, 0);
      return totalHours >= 3;
    });

    // Balanced streak - consecutive days with events in multiple categories
    const balancedStreak = calculateConsecutiveStreak(last30Days, (date) => {
      const dayEvents = safeEvents.filter((event) =>
        isSameDay(event.startDateTime, date),
      );
      const categories = new Set(dayEvents.map((event) => event.category));
      return categories.size >= 2;
    });

    return [
      {
        name: "Deep Work",
        icon: <Target className="h-4 w-4" />,
        current: deepWorkStreak.current,
        longest: deepWorkStreak.longest,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        description: "Days with deep work sessions",
      },
      {
        name: "Daily Planning",
        icon: <Calendar className="h-4 w-4" />,
        current: planningStreak.current,
        longest: planningStreak.longest,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        description: "Days with scheduled events",
      },
      {
        name: "Focus Time",
        icon: <TrendingUp className="h-4 w-4" />,
        current: focusStreak.current,
        longest: focusStreak.longest,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        description: "Days with 3+ hours focus work",
      },
      {
        name: "Balanced Days",
        icon: <Flame className="h-4 w-4" />,
        current: balancedStreak.current,
        longest: balancedStreak.longest,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        description: "Days with varied activities",
      },
    ];
  };

  const calculateConsecutiveStreak = (
    dates: Date[],
    predicate: (date: Date) => boolean,
  ): { current: number; longest: number } => {
    let current = 0;
    let longest = 0;
    let temp = 0;

    // Check from most recent date backwards for current streak
    for (let i = dates.length - 1; i >= 0; i--) {
      if (predicate(dates[i])) {
        current++;
        temp++;
        longest = Math.max(longest, temp);
      } else {
        if (i === dates.length - 1) {
          // Today doesn't count, so current streak is 0
          current = 0;
        }
        temp = 0;
      }
    }

    return { current, longest };
  };

  const streakData = calculateStreaks();
  const totalCurrentStreak = streakData.reduce(
    (sum, streak) => sum + streak.current,
    0,
  );

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-6 border border-border shadow-sm",
        className,
      )}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Productivity Streaks
        </h3>
        <p className="text-sm text-muted-foreground">
          Track your consistency across different productivity habits
        </p>
      </div>

      {/* Overall streak summary */}
      <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">
                Combined Active Streaks
              </div>
              <div className="text-xs text-muted-foreground">
                Total days across all habits
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {totalCurrentStreak}
            </div>
            <div className="text-xs text-muted-foreground">days</div>
          </div>
        </div>
      </div>

      {/* Individual streaks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {streakData.map((streak) => (
          <div
            key={streak.name}
            className={cn(
              "p-4 rounded-lg border transition-all hover:scale-105",
              streak.bgColor,
              streak.current > 0 ? "border-current/20" : "border-border",
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-md", streak.color)}>
                  {streak.icon}
                </div>
                <div>
                  <div className="font-medium text-foreground text-sm">
                    {streak.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {streak.description}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className={cn("text-lg font-bold", streak.color)}>
                  {streak.current}
                </div>
                <div className="text-xs text-muted-foreground">Current</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-muted-foreground">
                  {streak.longest}
                </div>
                <div className="text-xs text-muted-foreground">Record</div>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress to record</span>
                <span>
                  {streak.longest > 0
                    ? `${Math.min(Math.round((streak.current / streak.longest) * 100), 100)}%`
                    : "New!"}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    streak.color.includes("purple") && "bg-purple-500",
                    streak.color.includes("blue") && "bg-blue-500",
                    streak.color.includes("green") && "bg-green-500",
                    streak.color.includes("orange") && "bg-orange-500",
                  )}
                  style={{
                    width:
                      streak.longest > 0
                        ? `${Math.min((streak.current / streak.longest) * 100, 100)}%`
                        : streak.current > 0
                          ? "100%"
                          : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Motivational message */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="text-center">
          {totalCurrentStreak > 0 ? (
            <p className="text-sm text-muted-foreground">
              🎉 You're on fire! Keep up the great work building these
              productive habits.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              💪 Start building your productivity streaks - every day counts!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
