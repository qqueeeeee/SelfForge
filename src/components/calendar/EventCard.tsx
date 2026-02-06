import React from "react";
import { CalendarEvent, CalendarTask } from "./types";
import {
  getCategoryConfig,
  formatTime,
  isMultiDayEvent,
} from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";
import { Clock, MapPin, User, CheckSquare, Calendar } from "lucide-react";

interface EventCardProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  className?: string;
  showTime?: boolean;
  compact?: boolean;
}

interface ItemCardProps {
  item: CalendarTask | CalendarEvent;
  onClick?: (item: CalendarTask | CalendarEvent) => void;
  className?: string;
  showTime?: boolean;
  compact?: boolean;
}

export function ItemCard({
  item,
  onClick,
  className,
  showTime = true,
  compact = false,
}: ItemCardProps) {
  const categoryConfig = getCategoryConfig(item.category);
  const isMultiDay = isMultiDayEvent(item);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(item);
  };

  const formatItemTime = () => {
    if (item.isAllDay) {
      return "All day";
    }

    if (isMultiDay) {
      return `${formatTime(item.startDateTime)} - ${formatTime(item.endDateTime)}`;
    }

    return `${formatTime(item.startDateTime)} - ${formatTime(item.endDateTime)}`;
  };

  // Compact version for timeline/week view
  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "group relative cursor-pointer rounded-md border px-2 py-1 text-xs transition-all hover:shadow-sm",
          categoryConfig.bgColor,
          categoryConfig.borderColor,
          categoryConfig.color,
          className,
        )}
      >
        <div className="flex items-center gap-2">
          {item.type === "task" ? (
            <CheckSquare
              className={cn(
                "h-3 w-3",
                (item as CalendarTask).completed && "text-green-600",
              )}
            />
          ) : (
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                item.category === "deep-work" && "bg-purple-500",
                item.category === "work" && "bg-blue-500",
                item.category === "personal" && "bg-green-500",
                item.category === "custom" && "bg-amber-500",
              )}
            />
          )}
          <span
            className={cn(
              "truncate font-medium",
              item.type === "task" &&
                (item as CalendarTask).completed &&
                "line-through opacity-60",
            )}
          >
            {item.title}
          </span>
        </div>
        {showTime && !item.isAllDay && (
          <div className="mt-0.5 flex items-center gap-1 text-xs opacity-75">
            <Clock className="h-3 w-3" />
            <span>{formatTime(item.startDateTime)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md",
        categoryConfig.bgColor,
        categoryConfig.borderColor,
        className,
      )}
    >
      {/* Category indicator */}
      <div className="mb-2 flex items-center gap-2">
        {item.type === "task" ? (
          <CheckSquare
            className={cn(
              "h-4 w-4",
              (item as CalendarTask).completed && "text-green-600",
            )}
          />
        ) : (
          <div
            className={cn(
              "h-3 w-3 rounded-full",
              item.category === "deep-work" && "bg-purple-500",
              item.category === "work" && "bg-blue-500",
              item.category === "personal" && "bg-green-500",
              item.category === "custom" && "bg-amber-500",
            )}
          />
        )}
        <span
          className={cn(
            "text-xs font-medium uppercase tracking-wide",
            categoryConfig.color,
          )}
        >
          {categoryConfig.label}
        </span>
      </div>

      {/* Item title */}
      <h3
        className={cn(
          "font-semibold leading-tight",
          categoryConfig.color,
          item.type === "task" &&
            (item as CalendarTask).completed &&
            "line-through opacity-60",
        )}
      >
        {item.title}
      </h3>

      {/* Time info */}
      {showTime && (
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-sm",
            categoryConfig.color,
            "opacity-75",
          )}
        >
          <Clock className="h-4 w-4" />
          <span>{formatItemTime()}</span>
        </div>
      )}

      {/* Task-specific info */}
      {item.type === "task" && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs",
              (item as CalendarTask).priority === "high" &&
                "bg-red-100 text-red-700",
              (item as CalendarTask).priority === "medium" &&
                "bg-yellow-100 text-yellow-700",
              (item as CalendarTask).priority === "low" &&
                "bg-green-100 text-green-700",
            )}
          >
            {(item as CalendarTask).priority} priority
          </span>
          {(item as CalendarTask).estimatedDuration && (
            <span>{(item as CalendarTask).estimatedDuration}min</span>
          )}
        </div>
      )}

      {/* Description */}
      {item.description && (
        <p
          className={cn(
            "mt-2 text-sm line-clamp-2",
            categoryConfig.color,
            "opacity-75",
          )}
        >
          {item.description}
        </p>
      )}

      {/* Multi-day indicator */}
      {isMultiDay && (
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-xs",
            categoryConfig.color,
            "opacity-75",
          )}
        >
          <MapPin className="h-3 w-3" />
          <span>Multi-day event</span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-black/10" />
    </div>
  );
}

// Mini item card for month view
export function ItemCardMini({ item, onClick, className }: ItemCardProps) {
  const categoryConfig = getCategoryConfig(item.category);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(item);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group mb-1 cursor-pointer rounded px-2 py-1 text-xs transition-colors hover:opacity-80",
        categoryConfig.bgColor,
        categoryConfig.color,
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {item.type === "task" ? (
          <CheckSquare
            className={cn(
              "h-3 w-3 flex-shrink-0",
              (item as CalendarTask).completed && "text-green-600",
            )}
          />
        ) : (
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full flex-shrink-0",
              item.category === "deep-work" && "bg-purple-500",
              item.category === "work" && "bg-blue-500",
              item.category === "personal" && "bg-green-500",
              item.category === "custom" && "bg-amber-500",
            )}
          />
        )}
        <span
          className={cn(
            "truncate font-medium",
            item.type === "task" &&
              (item as CalendarTask).completed &&
              "line-through opacity-60",
          )}
        >
          {item.title}
        </span>
      </div>
    </div>
  );
}

// Legacy EventCard component for backward compatibility
export function EventCard({
  event,
  onClick,
  className,
  showTime = true,
  compact = false,
}: EventCardProps) {
  return (
    <ItemCard
      item={event}
      onClick={onClick}
      className={className}
      showTime={showTime}
      compact={compact}
    />
  );
}

// Legacy EventCardMini component for backward compatibility
export function EventCardMini({ event, onClick, className }: EventCardProps) {
  return <ItemCardMini item={event} onClick={onClick} className={className} />;
}
