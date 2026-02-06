import React from "react";
import { CalendarViewProps } from "./types";
import { ItemCard } from "./EventCard";
import {
  generateWeekDays,
  generateHourSlots,
  isToday,
  getItemsForDate,
  sortItemsByStartTime,
  formatTime,
  formatDateShort,
} from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

export function WeekView({
  currentDate,
  items,
  onItemClick,
  onDateClick,
  onItemCreate,
}: CalendarViewProps) {
  const weekDays = generateWeekDays(currentDate);
  const hourSlots = generateHourSlots();
  const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleTimeSlotClick = (date: Date, hour: number) => {
    onItemCreate(date, hour);
  };

  const handleDateHeaderClick = (date: Date) => {
    onDateClick(date);
  };

  // Calculate item positioning for time-based layout
  const getItemStyle = (item: any, date: Date) => {
    const startHour = item.startDateTime.getHours();
    const startMinute = item.startDateTime.getMinutes();
    const endHour = item.endDateTime.getHours();
    const endMinute = item.endDateTime.getMinutes();

    const startPosition = (startHour + startMinute / 60) * 60; // 60px per hour
    const duration = endHour + endMinute / 60 - (startHour + startMinute / 60);
    const height = Math.max(duration * 60, 30); // Minimum 30px height

    return {
      top: `${startPosition}px`,
      height: `${height}px`,
      minHeight: "30px",
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Week header with dates */}
      <div className="grid grid-cols-8 border-b border-border bg-background sticky top-0 z-10">
        {/* Empty corner for time column */}
        <div className="p-3 border-r border-border bg-muted/30" />

        {/* Day headers */}
        {weekDays.map((date, index) => {
          const isTodayDate = isToday(date);

          return (
            <div
              key={date.toISOString()}
              onClick={() => handleDateHeaderClick(date)}
              className={cn(
                "p-3 text-center cursor-pointer transition-colors hover:bg-muted/50",
                isTodayDate && "bg-primary/5",
              )}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {weekDayNames[index]}
              </div>
              <div
                className={cn(
                  "text-sm font-medium",
                  isTodayDate &&
                    "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mx-auto",
                )}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time slots and events */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {/* Hour grid */}
          {hourSlots.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-8 border-b border-border/50"
            >
              {/* Time label */}
              <div className="p-2 text-xs text-muted-foreground text-right border-r border-border bg-muted/30 h-[60px] flex items-start justify-end">
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                    ? `${hour} AM`
                    : hour === 12
                      ? "12 PM"
                      : `${hour - 12} PM`}
              </div>

              {/* Day columns */}
              {weekDays.map((date) => (
                <div
                  key={`${date.toISOString()}-${hour}`}
                  onClick={() => handleTimeSlotClick(date, hour)}
                  className={cn(
                    "h-[60px] border-r border-border cursor-pointer transition-colors hover:bg-muted/30 relative",
                    isToday(date) && "bg-primary/5",
                  )}
                />
              ))}
            </div>
          ))}

          {/* Events overlay */}
          {weekDays.map((date, dayIndex) => {
            const dayItems = sortItemsByStartTime(getItemsForDate(items, date));

            return (
              <div
                key={`events-${date.toISOString()}`}
                className="absolute inset-0 pointer-events-none"
                style={{
                  left: `${((dayIndex + 1) * 100) / 8}%`,
                  width: `${100 / 8}%`,
                }}
              >
                {dayItems.map((item, itemIndex) => {
                  if (item.isAllDay) {
                    return (
                      <div
                        key={item.id}
                        className="absolute top-0 left-1 right-1 pointer-events-auto z-20"
                        style={{ top: "-40px" }}
                      >
                        <ItemCard
                          item={item}
                          onClick={onItemClick}
                          compact
                          className="mb-1"
                        />
                      </div>
                    );
                  }

                  const style = getItemStyle(item, date);

                  return (
                    <div
                      key={item.id}
                      className="absolute left-1 right-1 pointer-events-auto z-10"
                      style={style}
                    >
                      <ItemCard
                        item={item}
                        onClick={onItemClick}
                        compact
                        showTime={false}
                        className="h-full"
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Current time indicator */}
          <CurrentTimeIndicator />
        </div>
      </div>
    </div>
  );
}

// Current time indicator component
function CurrentTimeIndicator() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const topPosition = (currentHour + currentMinute / 60) * 60;

  // Only show if it's today
  const isCurrentWeek = true; // You might want to add logic to check if current week

  if (!isCurrentWeek) return null;

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-30"
      style={{ top: `${topPosition}px` }}
    >
      <div className="flex items-center">
        <div className="w-16 text-xs text-red-500 text-right pr-2 font-medium">
          {formatTime(now)}
        </div>
        <div className="flex-1 h-0.5 bg-red-500" />
        <div className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
      </div>
    </div>
  );
}

// Compact week view for smaller screens
export function WeekViewCompact({
  currentDate,
  items,
  onItemClick,
  onDateClick,
  onItemCreate,
}: CalendarViewProps) {
  const weekDays = generateWeekDays(currentDate);
  const weekDayNames = ["S", "M", "T", "W", "T", "F", "S"];

  const handleDateHeaderClick = (date: Date) => {
    onDateClick(date);
  };

  return (
    <div className="space-y-4">
      {/* Week overview */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((date, index) => {
          const dayItems = sortItemsByStartTime(getItemsForDate(items, date));
          const isTodayDate = isToday(date);

          return (
            <div
              key={date.toISOString()}
              onClick={() => handleDateHeaderClick(date)}
              className={cn(
                "p-2 text-center cursor-pointer transition-colors hover:bg-muted/50 rounded-lg border",
                isTodayDate && "bg-primary/5 border-primary/20",
              )}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {weekDayNames[index]}
              </div>
              <div
                className={cn(
                  "text-sm font-medium mb-2",
                  isTodayDate &&
                    "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mx-auto",
                )}
              >
                {date.getDate()}
              </div>

              {/* Event indicators */}
              <div className="space-y-1">
                {dayItems.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(item);
                    }}
                    className={cn(
                      "h-1 rounded-full",
                      item.category === "deep-work" && "bg-purple-500",
                      item.category === "work" && "bg-blue-500",
                      item.category === "personal" && "bg-green-500",
                      item.category === "custom" && "bg-amber-500",
                    )}
                  />
                ))}
                {dayItems.length > 3 && (
                  <div className="text-xs text-muted-foreground px-2 py-1">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's events detail */}
      {(() => {
        const today = weekDays.find(isToday);
        if (!today) return null;

        const todayItems = sortItemsByStartTime(getItemsForDate(items, today));

        if (todayItems.length === 0) return null;

        return (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Today&apos;s Events
            </h3>
            <div className="space-y-2">
              {todayItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={onItemClick}
                  compact
                />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
