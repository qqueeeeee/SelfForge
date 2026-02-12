import React from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarHeatmap } from "@/components/dashboard/CalendarHeatmap";
import { TimeDistribution } from "@/components/dashboard/TimeDistribution";
import { ProductivityStreaks } from "@/components/dashboard/ProductivityStreaks";
import { FocusMetrics } from "@/components/dashboard/FocusMetrics";
import { WeeklyReport } from "@/components/dashboard/WeeklyReport";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { ITEM_CATEGORIES } from "@/lib/calendar-utils";
import { format } from "date-fns";

export default function Dashboard() {
  const { items, tasks, events, loading } = useCalendarEvents();
  const currentDate = format(new Date(), "EEEE, MMMM d, yyyy");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Get today's events
  const today = new Date();
  const todayItems = items.filter((item) => {
    const itemDate = new Date(item.startDateTime);
    return itemDate.toDateString() === today.toDateString();
  });

  const todayTasks = todayItems.filter((item) => item.type === "task");
  const todayEvents = todayItems.filter((item) => item.type === "event");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Productivity Dashboard
          </h1>
          <p className="text-muted-foreground">{currentDate}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/calendar">
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Open Calendar
            </Button>
          </Link>
          <Link to="/calendar">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Today's Schedule Quick View */}
      {todayItems.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Today's Schedule ({todayItems.length} items: {todayTasks.length}{" "}
            tasks, {todayEvents.length} events)
          </h3>
          <div className="grid gap-2">
            {todayItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {item.type === "task" && (
                    <div
                      className={`w-4 h-4 rounded border-2 flex-shrink-0 ${
                        (item as any).completed
                          ? "bg-green-500 border-green-500"
                          : "border-muted-foreground"
                      }`}
                    >
                      {(item as any).completed && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-1 border-b-2 border-r-2 border-white transform rotate-45" />
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      item.category === "deep-work"
                        ? "bg-purple-500"
                        : item.category === "work"
                          ? "bg-blue-500"
                          : item.category === "personal"
                            ? "bg-green-500"
                            : item.category === "meeting"
                              ? "bg-red-500"
                              : "bg-amber-500"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-foreground truncate">
                      {item.title}
                    </div>
                    <div className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {item.type}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.isAllDay
                      ? "All day"
                      : `${format(item.startDateTime, "h:mm a")} - ${format(
                          item.endDateTime,
                          "h:mm a",
                        )}`}
                  </div>
                </div>
              </div>
            ))}
            {todayItems.length > 4 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                +{todayItems.length - 4} more items
              </div>
            )}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        /* Empty State */
        <div className="bg-card rounded-xl p-8 border border-border shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Welcome to Your Productivity Dashboard
            </h3>
            <p className="text-muted-foreground mb-6">
              Start creating events in your calendar to unlock powerful
              analytics and insights about your productivity patterns.
            </p>
            <div className="space-y-3">
              <Link to="/calendar">
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Event
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                Track deep work, meetings, personal time and more
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Analytics Dashboard */
        <>
          {/* Weekly Report - Top Priority */}
          <WeeklyReport items={items} />

          {/* Activity Heatmap */}
          <CalendarHeatmap items={items} />

          {/* Metrics Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            <TimeDistribution items={items} />
            <FocusMetrics items={items} />
          </div>

          {/* Productivity Streaks */}
          <ProductivityStreaks items={items} />

          {/* Quick Actions */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Quick Actions
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link to="/calendar">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                >
                  <CalendarIcon className="h-4 w-4" />
                  View Full Calendar
                </Button>
              </Link>
              <Link to="/focus">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                >
                  <div className="h-4 w-4 rounded-full bg-purple-500" />
                  Start Focus Session
                </Button>
              </Link>
              <Link to="/goals">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                >
                  <div className="h-4 w-4 rounded-full bg-blue-500" />
                  Review Goals
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
