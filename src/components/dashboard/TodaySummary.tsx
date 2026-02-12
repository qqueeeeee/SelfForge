import { Moon, Book, Dumbbell, Monitor, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface TodayLog {
  sleepHours?: number;
  studyHours?: number;
  gymCompleted?: boolean;
  screenTimeHours?: number;
  mood?: number;
}

interface TodaySummaryProps {
  log?: TodayLog;
}

export function TodaySummary({ log }: TodaySummaryProps) {
  const items = [
    {
      icon: Moon,
      label: "Sleep",
      value: log?.sleepHours ? `${log.sleepHours} hrs` : "—",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      icon: Book,
      label: "Study",
      value: log?.studyHours ? `${log.studyHours} hrs` : "—",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      icon: Dumbbell,
      label: "Gym",
      value: log?.gymCompleted === undefined ? "—" : log.gymCompleted ? "Done" : "Skipped",
      color: log?.gymCompleted ? "text-success" : "text-muted-foreground",
      bgColor: log?.gymCompleted ? "bg-success/10" : "bg-muted",
    },
    {
      icon: Monitor,
      label: "Screen",
      value: log?.screenTimeHours ? `${log.screenTimeHours} hrs` : "—",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      icon: Smile,
      label: "Mood",
      value: log?.mood ? `${log.mood}/10` : "—",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ];

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Today's Summary
      </h3>
      <div className="grid grid-cols-5 gap-3">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div
              className={cn(
                "w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center",
                item.bgColor
              )}
            >
              <item.icon className={cn("h-5 w-5", item.color)} />
            </div>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-sm font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
