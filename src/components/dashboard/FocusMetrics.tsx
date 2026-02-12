import React from "react";
import { CalendarEvent } from "@/components/calendar/types";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Brain, Users, Clock, TrendingUp } from "lucide-react";
import { format, subDays, startOfDay, isSameDay } from "date-fns";

interface FocusMetricsProps {
  events: CalendarEvent[];
  className?: string;
}

interface DayMetrics {
  date: string;
  displayDate: string;
  focusTime: number;
  meetingTime: number;
  personalTime: number;
  total: number;
}

export function FocusMetrics({ events, className }: FocusMetricsProps) {
  const safeEvents = Array.isArray(events) ? events : [];
  // Calculate focus vs meeting time for the last 7 days
  const calculateFocusMetrics = (): DayMetrics[] => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) =>
      startOfDay(subDays(today, 6 - i)),
    );

    return last7Days.map((date) => {
      const dayEvents = safeEvents.filter((event) =>
        isSameDay(event.startDateTime, date),
      );

      let focusTime = 0;
      let meetingTime = 0;
      let personalTime = 0;

      dayEvents.forEach((event) => {
        const duration =
          (event.endDateTime.getTime() - event.startDateTime.getTime()) /
          (1000 * 60 * 60);

        if (event.category === "deep-work") {
          focusTime += duration;
        } else if (event.category === "task") {
          // Assume tasks with multiple attendees or certain keywords are meetings
          if (
            event.title.toLowerCase().includes("meeting") ||
            event.title.toLowerCase().includes("call") ||
            event.title.toLowerCase().includes("standup") ||
            event.title.toLowerCase().includes("sync")
          ) {
            meetingTime += duration;
          } else {
            focusTime += duration;
          }
        } else if (event.category === "personal") {
          personalTime += duration;
        }
      });

      const total = focusTime + meetingTime + personalTime;

      return {
        date: format(date, "yyyy-MM-dd"),
        displayDate: format(date, "EEE"),
        focusTime: Math.round(focusTime * 10) / 10,
        meetingTime: Math.round(meetingTime * 10) / 10,
        personalTime: Math.round(personalTime * 10) / 10,
        total: Math.round(total * 10) / 10,
      };
    });
  };

  const metrics = calculateFocusMetrics();

  // Calculate totals and averages
  const totalFocusTime = metrics.reduce((sum, day) => sum + day.focusTime, 0);
  const totalMeetingTime = metrics.reduce(
    (sum, day) => sum + day.meetingTime,
    0,
  );
  const totalPersonalTime = metrics.reduce(
    (sum, day) => sum + day.personalTime,
    0,
  );
  const totalTime = totalFocusTime + totalMeetingTime + totalPersonalTime;

  const focusRatio =
    totalTime > 0 ? Math.round((totalFocusTime / totalTime) * 100) : 0;
  const meetingRatio =
    totalTime > 0 ? Math.round((totalMeetingTime / totalTime) * 100) : 0;

  const avgFocusPerDay = totalFocusTime / 7;
  const avgMeetingPerDay = totalMeetingTime / 7;

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <div className="font-medium mb-2">{label}</div>
          <div className="space-y-1">
            {data.focusTime > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span>Focus: {data.focusTime}h</span>
              </div>
            )}
            {data.meetingTime > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span>Meetings: {data.meetingTime}h</span>
              </div>
            )}
            {data.personalTime > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>Personal: {data.personalTime}h</span>
              </div>
            )}
            <div className="pt-1 border-t border-border text-sm font-medium">
              Total: {data.total}h
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getProductivityScore = (): {
    score: number;
    message: string;
    color: string;
  } => {
    if (focusRatio >= 60) {
      return {
        score: focusRatio,
        message: "Excellent focus balance! 🎯",
        color: "text-green-600",
      };
    } else if (focusRatio >= 40) {
      return {
        score: focusRatio,
        message: "Good focus time 👍",
        color: "text-blue-600",
      };
    } else if (focusRatio >= 20) {
      return {
        score: focusRatio,
        message: "Room for improvement 📈",
        color: "text-yellow-600",
      };
    } else {
      return {
        score: focusRatio,
        message: "More focus time needed ⚡",
        color: "text-red-600",
      };
    }
  };

  const productivityScore = getProductivityScore();

  if (totalTime === 0) {
    return (
      <div
        className={cn(
          "bg-card rounded-xl p-6 border border-border shadow-sm",
          className,
        )}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Focus Metrics
          </h3>
          <p className="text-sm text-muted-foreground">
            Deep work vs meetings analysis
          </p>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-muted-foreground mb-2">
              No time tracked this week
            </div>
            <p className="text-sm text-muted-foreground">
              Create calendar events to analyze your focus patterns
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-6 border border-border shadow-sm",
        className,
      )}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Focus Metrics
        </h3>
        <p className="text-sm text-muted-foreground">
          Deep work vs meetings analysis - past 7 days
        </p>
      </div>

      {/* Key metrics summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex justify-center mb-2">
            <Brain className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-600">
            {Math.round(totalFocusTime * 10) / 10}h
          </div>
          <div className="text-xs text-muted-foreground">Focus Time</div>
        </div>

        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex justify-center mb-2">
            <Users className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-lg font-bold text-red-600">
            {Math.round(totalMeetingTime * 10) / 10}h
          </div>
          <div className="text-xs text-muted-foreground">Meetings</div>
        </div>

        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex justify-center mb-2">
            <Clock className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-lg font-bold text-green-600">
            {Math.round(avgFocusPerDay * 10) / 10}h
          </div>
          <div className="text-xs text-muted-foreground">Avg Focus/Day</div>
        </div>

        <div className="text-center p-3 bg-primary/5 rounded-lg">
          <div className="flex justify-center mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="text-lg font-bold text-primary">{focusRatio}%</div>
          <div className="text-xs text-muted-foreground">Focus Ratio</div>
        </div>
      </div>

      {/* Daily breakdown chart */}
      <div className="mb-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                label={{ value: "Hours", angle: -90, position: "insideLeft" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="focusTime"
                stackId="time"
                fill="#3b82f6"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="meetingTime"
                stackId="time"
                fill="#ef4444"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="personalTime"
                stackId="time"
                fill="#10b981"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Productivity assessment */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-medium text-foreground">
              Productivity Assessment
            </div>
            <div className="text-xs text-muted-foreground">
              Based on focus time ratio
            </div>
          </div>
          <div className={cn("text-lg font-bold", productivityScore.color)}>
            {productivityScore.score}%
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-2 mb-3">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
            style={{ width: `${Math.max(productivityScore.score, 5)}%` }}
          />
        </div>

        <div className={cn("text-sm font-medium", productivityScore.color)}>
          {productivityScore.message}
        </div>

        {focusRatio < 40 && (
          <div className="mt-2 text-xs text-muted-foreground">
            💡 Try blocking more time for deep work and reducing meeting
            overhead
          </div>
        )}
      </div>
    </div>
  );
}
