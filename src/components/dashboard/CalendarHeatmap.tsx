import React from "react";
import { CalendarEvent } from "@/components/calendar/types";
import { cn } from "@/lib/utils";
import { format, subDays, isSameDay, startOfDay } from "date-fns";

interface CalendarHeatmapProps {
  events: CalendarEvent[];
  className?: string;
}

interface DayData {
  date: Date;
  count: number;
  events: CalendarEvent[];
}

export function CalendarHeatmap({ events, className }: CalendarHeatmapProps) {
  const safeEvents = Array.isArray(events) ? events : [];
  // Generate data for the last 12 weeks (84 days)
  const generateHeatmapData = (): DayData[] => {
    const data: DayData[] = [];
    const today = new Date();

    for (let i = 83; i >= 0; i--) {
      const date = startOfDay(subDays(today, i));
      const dayEvents = safeEvents.filter((event) =>
        isSameDay(event.startDateTime, date),
      );

      data.push({
        date,
        count: dayEvents.length,
        events: dayEvents,
      });
    }

    return data;
  };

  const heatmapData = generateHeatmapData();
  const maxCount = Math.max(...heatmapData.map((d) => d.count), 1);

  // Group by weeks for proper grid layout
  const weeks: DayData[][] = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  const getIntensity = (count: number): string => {
    if (count === 0) return "bg-muted";
    const intensity = count / maxCount;

    if (intensity <= 0.25) return "bg-green-200 dark:bg-green-900/30";
    if (intensity <= 0.5) return "bg-green-300 dark:bg-green-800/50";
    if (intensity <= 0.75) return "bg-green-400 dark:bg-green-700/70";
    return "bg-green-500 dark:bg-green-600";
  };

  const getTooltipContent = (dayData: DayData): string => {
    const dateStr = format(dayData.date, "MMM d, yyyy");
    const eventText = dayData.count === 1 ? "event" : "events";
    return `${dayData.count} ${eventText} on ${dateStr}`;
  };

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Get month labels for the weeks
  const getMonthLabels = () => {
    const labels: { month: string; weekIndex: number }[] = [];
    let currentMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const month = week[0].date.getMonth();
      if (month !== currentMonth && weekIndex % 2 === 0) {
        labels.push({
          month: months[month],
          weekIndex,
        });
        currentMonth = month;
      }
    });

    return labels;
  };

  const monthLabels = getMonthLabels();
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-6 border border-border shadow-sm",
        className,
      )}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Activity Overview
        </h3>
        <p className="text-sm text-muted-foreground">
          Your calendar activity over the past 12 weeks
        </p>
      </div>

      <div className="space-y-3">
        {/* Month labels */}
        <div className="flex ml-8">
          {monthLabels.map(({ month, weekIndex }) => (
            <div
              key={`${month}-${weekIndex}`}
              className="text-xs text-muted-foreground font-medium"
              style={{
                marginLeft: `${weekIndex * 12}px`,
                width: "24px",
              }}
            >
              {month}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col justify-between mr-2 py-1">
            {dayLabels.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "text-xs text-muted-foreground h-2.5 flex items-center",
                  index % 2 === 1 ? "opacity-100" : "opacity-0",
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div
            className="grid grid-flow-col gap-1"
            style={{ gridTemplateRows: "repeat(7, 1fr)" }}
          >
            {heatmapData.map((dayData, index) => (
              <div
                key={index}
                className={cn(
                  "w-2.5 h-2.5 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                  getIntensity(dayData.count),
                )}
                title={getTooltipContent(dayData)}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-muted" />
            <div className="w-2.5 h-2.5 rounded-sm bg-green-200 dark:bg-green-900/30" />
            <div className="w-2.5 h-2.5 rounded-sm bg-green-300 dark:bg-green-800/50" />
            <div className="w-2.5 h-2.5 rounded-sm bg-green-400 dark:bg-green-700/70" />
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500 dark:bg-green-600" />
          </div>
          <span>More</span>
        </div>

        {/* Summary stats */}
        <div className="flex justify-between items-center pt-4 border-t border-border/50">
          <div className="text-sm">
            <span className="text-muted-foreground">Total events: </span>
            <span className="font-medium text-foreground">
              {safeEvents.length}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Most active: </span>
            <span className="font-medium text-foreground">
              {maxCount} {maxCount === 1 ? "event" : "events"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
