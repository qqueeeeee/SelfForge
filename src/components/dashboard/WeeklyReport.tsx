import React from "react";
import { CalendarEvent } from "@/components/calendar/types";
import { getCategoryConfig } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, isSameWeek } from "date-fns";
import { Calendar, Clock, TrendingUp, Award, Target } from "lucide-react";

interface WeeklyReportProps {
  events: CalendarEvent[];
  className?: string;
}

interface WeeklyStats {
  totalEvents: number;
  totalHours: number;
  avgEventDuration: number;
  categoryBreakdown: {
    [key: string]: { count: number; hours: number; percentage: number };
  };
  longestEvent: CalendarEvent | null;
  mostProductiveDay: { day: string; hours: number } | null;
  completionRate: number;
}

export function WeeklyReport({ events, className }: WeeklyReportProps) {
  const currentWeek = new Date();
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const safeEvents = Array.isArray(events) ? events : [];
  const calculateWeeklyStats = (): WeeklyStats => {
    // Filter events for current week
    const weekEvents = safeEvents.filter((event) =>
      isSameWeek(event.startDateTime, currentWeek, { weekStartsOn: 1 }),
    );

    if (weekEvents.length === 0) {
      return {
        totalEvents: 0,
        totalHours: 0,
        avgEventDuration: 0,
        categoryBreakdown: {},
        longestEvent: null,
        mostProductiveDay: null,
        completionRate: 0,
      };
    }

    // Calculate total hours and average duration
    let totalHours = 0;
    const categoryTotals: { [key: string]: { count: number; hours: number } } =
      {};
    const dailyHours: { [key: string]: number } = {};

    weekEvents.forEach((event) => {
      const duration =
        (event.endDateTime.getTime() - event.startDateTime.getTime()) /
        (1000 * 60 * 60);
      totalHours += duration;

      // Category breakdown
      if (!categoryTotals[event.category]) {
        categoryTotals[event.category] = { count: 0, hours: 0 };
      }
      categoryTotals[event.category].count++;
      categoryTotals[event.category].hours += duration;

      // Daily breakdown
      const dayKey = format(event.startDateTime, "EEEE");
      dailyHours[dayKey] = (dailyHours[dayKey] || 0) + duration;
    });

    // Find most productive day
    const mostProductiveDay = Object.entries(dailyHours).reduce(
      (max, [day, hours]) => (hours > max.hours ? { day, hours } : max),
      { day: "", hours: 0 },
    );

    // Category breakdown with percentages
    const categoryBreakdown: {
      [key: string]: { count: number; hours: number; percentage: number };
    } = {};
    Object.entries(categoryTotals).forEach(([category, data]) => {
      categoryBreakdown[category] = {
        ...data,
        percentage: Math.round((data.hours / totalHours) * 100),
      };
    });

    // Find longest event
    const longestEvent = weekEvents.reduce(
      (longest, event) => {
        const duration =
          event.endDateTime.getTime() - event.startDateTime.getTime();
        const longestDuration = longest
          ? longest.endDateTime.getTime() - longest.startDateTime.getTime()
          : 0;
        return duration > longestDuration ? event : longest;
      },
      null as CalendarEvent | null,
    );

    // Calculate completion rate (assuming all scheduled events were "completed")
    const completionRate = 100; // For now, assume all events are completed

    return {
      totalEvents: weekEvents.length,
      totalHours: Math.round(totalHours * 10) / 10,
      avgEventDuration: Math.round((totalHours / weekEvents.length) * 10) / 10,
      categoryBreakdown,
      longestEvent,
      mostProductiveDay: mostProductiveDay.hours > 0 ? mostProductiveDay : null,
      completionRate,
    };
  };

  const stats = calculateWeeklyStats();

  const getWeekRangeText = () => {
    return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "deep-work":
        return "text-purple-600 bg-purple-50 dark:bg-purple-900/20";
      case "task":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
      case "personal":
        return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "custom":
        return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getProductivityGrade = (): {
    grade: string;
    message: string;
    color: string;
  } => {
    if (stats.totalHours >= 35) {
      return {
        grade: "A+",
        message: "Outstanding productivity!",
        color: "text-green-600",
      };
    } else if (stats.totalHours >= 25) {
      return {
        grade: "A",
        message: "Excellent week!",
        color: "text-green-600",
      };
    } else if (stats.totalHours >= 20) {
      return { grade: "B", message: "Good progress!", color: "text-blue-600" };
    } else if (stats.totalHours >= 15) {
      return {
        grade: "C",
        message: "Solid foundation",
        color: "text-yellow-600",
      };
    } else if (stats.totalHours >= 10) {
      return {
        grade: "D",
        message: "Room for improvement",
        color: "text-orange-600",
      };
    } else {
      return {
        grade: "F",
        message: "Let's boost productivity!",
        color: "text-red-600",
      };
    }
  };

  if (stats.totalEvents === 0) {
    return (
      <div
        className={cn(
          "bg-card rounded-xl p-6 border border-border shadow-sm",
          className,
        )}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Weekly Report
          </h3>
          <p className="text-sm text-muted-foreground">{getWeekRangeText()}</p>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-muted-foreground mb-2">
              No events scheduled this week
            </div>
            <p className="text-sm text-muted-foreground">
              Plan some activities to generate your weekly report
            </p>
          </div>
        </div>
      </div>
    );
  }

  const productivityGrade = getProductivityGrade();

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-6 border border-border shadow-sm",
        className,
      )}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground">
            Weekly Report
          </h3>
          <div className={cn("text-2xl font-bold", productivityGrade.color)}>
            {productivityGrade.grade}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{getWeekRangeText()}</p>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-primary/5 rounded-lg">
          <div className="flex justify-center mb-2">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="text-lg font-bold text-foreground">
            {stats.totalEvents}
          </div>
          <div className="text-xs text-muted-foreground">Events</div>
        </div>

        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex justify-center mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-600">
            {stats.totalHours}h
          </div>
          <div className="text-xs text-muted-foreground">Total Time</div>
        </div>

        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex justify-center mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-lg font-bold text-green-600">
            {stats.avgEventDuration}h
          </div>
          <div className="text-xs text-muted-foreground">Avg Duration</div>
        </div>

        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="flex justify-center mb-2">
            <Award className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-lg font-bold text-orange-600">
            {stats.completionRate}%
          </div>
          <div className="text-xs text-muted-foreground">Completion</div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-3">
          Category Breakdown
        </h4>
        <div className="space-y-2">
          {Object.entries(stats.categoryBreakdown).map(([category, data]) => {
            const categoryConfig = getCategoryConfig(category);
            const colorClass = getCategoryColor(category);

            return (
              <div
                key={category}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      colorClass,
                    )}
                  >
                    {categoryConfig.label}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {data.count} {data.count === 1 ? "event" : "events"}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {Math.round(data.hours * 10) / 10}h
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {data.percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Highlights */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {stats.mostProductiveDay && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Most Productive Day
              </span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {stats.mostProductiveDay.day}
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(stats.mostProductiveDay.hours * 10) / 10} hours
              scheduled
            </div>
          </div>
        )}

        {stats.longestEvent && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                Longest Event
              </span>
            </div>
            <div className="text-sm font-bold text-foreground truncate">
              {stats.longestEvent.title}
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(
                ((stats.longestEvent.endDateTime.getTime() -
                  stats.longestEvent.startDateTime.getTime()) /
                  (1000 * 60 * 60)) *
                  10,
              ) / 10}{" "}
              hours
            </div>
          </div>
        )}
      </div>

      {/* Productivity assessment */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-foreground">
            Weekly Assessment
          </div>
          <div className={cn("text-lg font-bold", productivityGrade.color)}>
            {productivityGrade.grade}
          </div>
        </div>
        <div
          className={cn("text-sm font-medium mb-2", productivityGrade.color)}
        >
          {productivityGrade.message}
        </div>
        <div className="text-xs text-muted-foreground">
          Based on {stats.totalHours} hours of scheduled activities
        </div>
      </div>
    </div>
  );
}
