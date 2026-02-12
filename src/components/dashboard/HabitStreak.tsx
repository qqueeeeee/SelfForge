import { cn } from "@/lib/utils";
import { format, subDays, isSameDay } from "date-fns";

interface HabitStreakProps {
  habitName: string;
  completedDates: Date[];
  streakCount: number;
}

export function HabitStreak({ habitName, completedDates, streakCount }: HabitStreakProps) {
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">{habitName}</h3>
        <span className="text-sm text-muted-foreground">
          {streakCount} day streak
        </span>
      </div>
      <div className="flex gap-2">
        {last7Days.map((day) => {
          const isCompleted = completedDates.some((d) => isSameDay(d, day));
          const isToday = isSameDay(day, today);
          return (
            <div key={day.toISOString()} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                  isToday && !isCompleted && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                )}
              >
                {isCompleted ? "✓" : format(day, "d")}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(day, "EEE")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
