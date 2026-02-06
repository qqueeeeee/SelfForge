import React from "react";
import { CalendarEvent } from "@/components/calendar/types";
import { getCategoryConfig } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface TimeDistributionProps {
  events: CalendarEvent[];
  className?: string;
  timeRange?: "week" | "month";
}

interface CategoryData {
  category: string;
  label: string;
  hours: number;
  color: string;
  percentage: number;
}

export function TimeDistribution({
  events,
  className,
  timeRange = "week",
}: TimeDistributionProps) {
  const safeEvents = Array.isArray(events) ? events : [];
  // Calculate time distribution by category
  const calculateTimeDistribution = (): CategoryData[] => {
    const categoryTotals: { [key: string]: number } = {};
    let totalHours = 0;

    // Filter events based on time range
    const now = new Date();
    const cutoffDate = new Date();
    if (timeRange === "week") {
      cutoffDate.setDate(now.getDate() - 7);
    } else {
      cutoffDate.setDate(now.getDate() - 30);
    }

    const filteredEvents = safeEvents.filter(
      (event) => event.startDateTime >= cutoffDate,
    );

    filteredEvents.forEach((event) => {
      const duration =
        (event.endDateTime.getTime() - event.startDateTime.getTime()) /
        (1000 * 60 * 60); // hours
      categoryTotals[event.category] =
        (categoryTotals[event.category] || 0) + duration;
      totalHours += duration;
    });

    // Convert to chart data
    const chartData: CategoryData[] = Object.entries(categoryTotals).map(
      ([category, hours]) => {
        const categoryConfig = getCategoryConfig(category);
        return {
          category,
          label: categoryConfig.label,
          hours: Math.round(hours * 10) / 10,
          color: getCategoryColor(category),
          percentage: Math.round((hours / totalHours) * 100),
        };
      },
    );

    return chartData.sort((a, b) => b.hours - a.hours);
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "deep-work":
        return "#8b5cf6"; // purple
      case "task":
        return "#3b82f6"; // blue
      case "personal":
        return "#10b981"; // green
      case "custom":
        return "#f59e0b"; // amber
      default:
        return "#6b7280"; // gray
    }
  };

  const data = calculateTimeDistribution();
  const totalHours = data.reduce((sum, item) => sum + item.hours, 0);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "bg-card rounded-xl p-6 border border-border shadow-sm",
          className,
        )}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Time Distribution
          </h3>
          <p className="text-sm text-muted-foreground">
            How you spend your time by category
          </p>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-muted-foreground mb-2">
              No events in the past {timeRange}
            </div>
            <p className="text-sm text-muted-foreground">
              Start creating events to see your time distribution
            </p>
          </div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: CategoryData;
      value: number;
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-medium">{data.label}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {data.hours}h ({data.percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-6 border border-border shadow-sm",
        className,
      )}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Time Distribution
        </h3>
        <p className="text-sm text-muted-foreground">
          How you spend your time by category - past {timeRange}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="hours"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with detailed breakdown */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground mb-3">
            Total: {totalHours}h
          </div>

          {data.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">
                  {item.hours}h
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional insights */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-foreground">
              {Math.round((totalHours / (timeRange === "week" ? 7 : 30)) * 10) /
                10}
              h
            </div>
            <div className="text-xs text-muted-foreground">Average per day</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">
              {data.length}
            </div>
            <div className="text-xs text-muted-foreground">Categories used</div>
          </div>
        </div>
      </div>
    </div>
  );
}
