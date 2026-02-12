import React from "react";
import { CalendarViewProps } from "./types";
import { ItemCard } from "./EventCard";
import {
  generateHourSlots,
  isToday,
  getItemsForDate,
  sortItemsByStartTime,
  formatTime,
  formatDate,
} from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

export function DayView({
  currentDate,
  items,
  onItemClick,
  onDateClick,
  onItemCreate,
}: CalendarViewProps) {
  const hourSlots = generateHourSlots();
  const dayItems = sortItemsByStartTime(getItemsForDate(items, currentDate));
  const allDayItems = dayItems.filter((item) => item.isAllDay);
  const timedItems = dayItems.filter((item) => !item.isAllDay);

  const handleTimeSlotClick = (hour: number) => {
    onItemCreate(currentDate, hour);
  };

  // Calculate item positioning for time-based layout
  const getItemStyle = (item: any) => {
    const startHour = item.startDateTime.getHours();
    const startMinute = item.startDateTime.getMinutes();
    const endHour = item.endDateTime.getHours();
    const endMinute = item.endDateTime.getMinutes();

    const startPosition = (startHour + startMinute / 60) * 80; // 80px per hour
    const duration = endHour + endMinute / 60 - (startHour + startMinute / 60);
    const height = Math.max(duration * 80, 40); // Minimum 40px height

    return {
      top: `${startPosition}px`,
      height: `${height}px`,
      minHeight: "40px",
    };
  };

  // Group overlapping items for better positioning
  const getItemColumns = (items: any[]) => {
    const columns: any[][] = [];

    items.forEach((item) => {
      let placed = false;

      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const hasConflict = column.some((existingItem) => {
          const itemStart = item.startDateTime.getTime();
          const itemEnd = item.endDateTime.getTime();
          const existingStart = existingItem.startDateTime.getTime();
          const existingEnd = existingItem.endDateTime.getTime();

          return itemStart < existingEnd && itemEnd > existingStart;
        });

        if (!hasConflict) {
          column.push(item);
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([item]);
      }
    });

    return columns;
  };

  const itemColumns = getItemColumns(timedItems);

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="p-4 text-center">
          <h2 className="text-xl font-semibold">{formatDate(currentDate)}</h2>
          {isToday(currentDate) && (
            <p className="text-sm text-primary font-medium mt-1">Today</p>
          )}
        </div>

        {/* All-day items */}
        {allDayItems.length > 0 && (
          <div className="border-b border-border pb-3 mb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              All Day
            </h3>
            <div className="space-y-1">
              {allDayItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={onItemClick}
                  compact
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Time slots and events */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {/* Hour grid */}
          {hourSlots.map((hour) => (
            <div key={hour} className="flex border-b border-border/50">
              {/* Time label */}
              <div className="w-20 p-3 text-xs text-muted-foreground text-right border-r border-border bg-muted/30 h-[80px] flex items-start justify-end">
                <div className="mt-1">
                  {hour === 0
                    ? "12 AM"
                    : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                        ? "12 PM"
                        : `${hour - 12} PM`}
                </div>
              </div>

              {/* Time slot */}
              <div
                onClick={() => handleTimeSlotClick(hour)}
                className={cn(
                  "flex-1 h-[80px] cursor-pointer transition-colors hover:bg-muted/30 relative",
                  isToday(currentDate) && "bg-primary/5",
                )}
              >
                {/* 30-minute divider */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-border/30" />
              </div>
            </div>
          ))}

          {/* Timed items overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {itemColumns.map((column, columnIndex) => (
              <div
                key={columnIndex}
                className="absolute inset-0"
                style={{
                  left: `${(columnIndex * 100) / Math.max(itemColumns.length, 1)}%`,
                  width: `${100 / Math.max(itemColumns.length, 1)}%`,
                }}
              >
                {column.map((item) => {
                  const style = getItemStyle(item);

                  return (
                    <div
                      key={item.id}
                      className="absolute left-1 right-1 pointer-events-auto z-10"
                      style={style}
                    >
                      <ItemCard
                        item={item}
                        onClick={onItemClick}
                        compact={false}
                        showTime={true}
                        className="h-full"
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Current time indicator */}
          {isToday(currentDate) && <CurrentTimeIndicator />}
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
  const topPosition = (currentHour + currentMinute / 60) * 80; // 80px per hour

  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{
        top: `${topPosition}px`,
        left: "80px",
        right: "0",
      }}
    >
      <div className="flex items-center">
        <div className="w-16 text-xs text-red-500 text-right pr-2 font-medium -ml-16">
          {formatTime(now)}
        </div>
        <div className="flex-1 h-0.5 bg-red-500" />
        <div className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
      </div>
    </div>
  );
}

// Simple day view for mobile or compact spaces
export function DayViewSimple({
  currentDate,
  items,
  onItemClick,
  onDateClick,
  onItemCreate,
}: CalendarViewProps) {
  const dayItems = sortItemsByStartTime(getItemsForDate(items, currentDate));
  const allDayItems = dayItems.filter((item) => item.isAllDay);
  const timedItems = dayItems.filter((item) => !item.isAllDay);

  return (
    <div className="space-y-4">
      {/* Day header */}
      <div className="text-center p-4 border-b border-border">
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </h2>
        {isToday(currentDate) && (
          <p className="text-sm text-primary font-medium mt-1">Today</p>
        )}
      </div>

      {/* Events list */}
      <div className="px-4">
        {dayItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-2">
              No events scheduled
            </div>
            <button
              onClick={() => onEventCreate(currentDate)}
              className="text-primary hover:underline text-sm"
            >
              Create your first event
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* All-day events */}
            {allDayItems.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  All Day
                </h3>
                <div className="space-y-2">
                  {allDayItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onClick={onItemClick}
                      showTime={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Timed events */}
            {timedItems.length > 0 && (
              <div>
                {allDayItems.length > 0 && (
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 mt-4">
                    Scheduled
                  </h3>
                )}
                <div className="space-y-3">
                  {timedItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onClick={onItemClick}
                      showTime={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
