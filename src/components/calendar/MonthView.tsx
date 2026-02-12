import React from "react";
import { CalendarViewProps } from "./types";
import { ItemCardMini } from "./EventCard";
import {
  generateMonthGrid,
  isToday,
  isSameMonth,
  getItemsForDate,
  sortItemsByStartTime,
  formatDateShort,
} from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

export function MonthView({
  currentDate,
  items,
  onItemClick,
  onDateClick,
  onItemCreate,
}: CalendarViewProps) {
  const monthGrid = generateMonthGrid(currentDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleDateClick = (date: Date) => {
    onDateClick(date);
  };

  const handleDateDoubleClick = (date: Date) => {
    onItemCreate(date);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted/30"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {monthGrid.map((date, index) => {
          const dayItems = sortItemsByStartTime(getItemsForDate(items, date));
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);

          return (
            <div
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              onDoubleClick={() => handleDateDoubleClick(date)}
              className={cn(
                "min-h-[120px] border-r border-b border-border p-2 cursor-pointer transition-colors hover:bg-muted/50",
                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                isTodayDate && "bg-primary/5 ring-1 ring-primary/20",
              )}
            >
              {/* Date number */}
              <div className="flex justify-between items-start mb-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    !isCurrentMonth && "text-muted-foreground/60",
                    isTodayDate &&
                      "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs",
                  )}
                >
                  {date.getDate()}
                </span>

                {/* Mobile date indicator */}
                <div className="md:hidden">
                  {dayItems.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{dayItems.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1 overflow-hidden">
                {dayItems.slice(0, 3).map((item) => (
                  <ItemCardMini
                    key={item.id}
                    item={item}
                    onClick={() => onItemClick(item)}
                  />
                ))}

                {/* Show more indicator for desktop */}
                {dayItems.length > 3 && (
                  <div className="hidden md:block text-xs text-muted-foreground p-1">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .calendar-month-grid {
            min-height: 100px;
          }
          .calendar-month-grid .calendar-day {
            min-height: 80px;
            padding: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .calendar-month-grid .calendar-day {
            min-height: 60px;
            padding: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
}

// Alternative compact month view for smaller spaces
export function MonthViewCompact({
  currentDate,
  items,
  onItemClick,
  onDateClick,
  onItemCreate,
}: CalendarViewProps) {
  const monthGrid = generateMonthGrid(currentDate);
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  const handleDateClick = (date: Date) => {
    onDateClick(date);
  };

  const handleDateDoubleClick = (date: Date) => {
    onItemCreate(date);
  };

  return (
    <div className="flex flex-col">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="p-2 text-center text-xs font-medium text-muted-foreground bg-muted/30"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 grid-rows-6">
        {monthGrid.map((date) => {
          const dayItems = sortItemsByStartTime(getItemsForDate(items, date));
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);
          const hasEvents = dayItems.length > 0;

          return (
            <div
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              onDoubleClick={() => handleDateDoubleClick(date)}
              className={cn(
                "h-12 border-r border-b border-border p-1 cursor-pointer transition-colors hover:bg-muted/50 flex flex-col items-center justify-center",
                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                isTodayDate && "bg-primary/5 ring-1 ring-primary/20",
              )}
            >
              <span
                className={cn(
                  "text-xs",
                  !isCurrentMonth && "text-muted-foreground/60",
                  isTodayDate &&
                    "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center",
                )}
              >
                {date.getDate()}
              </span>

              {hasEvents && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayItems.slice(0, 2).map((item, itemIndex) => (
                    <div
                      key={item.id}
                      className={cn(
                        "w-1 h-1 rounded-full",
                        item.category === "deep-work" && "bg-purple-500",
                        item.category === "work" && "bg-blue-500",
                        item.category === "personal" && "bg-green-500",
                        item.category === "custom" && "bg-amber-500",
                      )}
                    />
                  ))}
                  {dayItems.length > 2 && (
                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
