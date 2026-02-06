import React, { useState } from "react";
import { CalendarView } from "./types";
import { formatDate, addDays, addWeeks, addMonths } from "@/lib/calendar-utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  CalendarDays,
  CheckSquare,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryManager } from "./CategoryManager";

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onCreateEvent: () => void;
  onCreateTask?: () => void;
  onCategoriesChange?: () => void;
  className?: string;
}

export function CalendarHeader({
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onCreateEvent,
  onCreateTask,
  onCategoriesChange,
  className,
}: CalendarHeaderProps) {
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  const handlePrevious = () => {
    switch (view) {
      case "day":
        onDateChange(addDays(currentDate, -1));
        break;
      case "week":
        onDateChange(addWeeks(currentDate, -1));
        break;
      case "month":
        onDateChange(addMonths(currentDate, -1));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case "day":
        onDateChange(addDays(currentDate, 1));
        break;
      case "week":
        onDateChange(addWeeks(currentDate, 1));
        break;
      case "month":
        onDateChange(addMonths(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getDateRangeText = () => {
    switch (view) {
      case "day":
        return formatDate(currentDate);
      case "week": {
        const weekStart = addDays(currentDate, -currentDate.getDay());
        const weekEnd = addDays(weekStart, 6);
        const startFormat = weekStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const endFormat = weekEnd.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return `${startFormat} - ${endFormat}`;
      }
      case "month":
        return currentDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      default:
        return "";
    }
  };

  return (
    <>
      <div className={cn("border-b border-border bg-background", className)}>
        {/* Top row: Navigation and actions */}
        <div className="flex items-center justify-between p-4 pb-2">
          {/* Left side: Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>

          {/* Right side: View selector and create buttons */}
          <div className="flex items-center gap-3">
            {/* View selector */}
            <Select
              value={view}
              onValueChange={(value: CalendarView) => onViewChange(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Month
                  </div>
                </SelectItem>
                <SelectItem value="week">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Week
                  </div>
                </SelectItem>
                <SelectItem value="day">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Day
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Create buttons */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    New
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onCreateEvent}>
                    <Calendar className="h-4 w-4 mr-2" />
                    New Event
                  </DropdownMenuItem>
                  {onCreateTask && (
                    <DropdownMenuItem onClick={onCreateTask}>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      New Task
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCategoryManagerOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom row: Current date/range display */}
        <div className="px-4 pb-4">
          <h1 className="text-2xl font-semibold text-foreground">
            {getDateRangeText()}
          </h1>
        </div>

        <style jsx>{`
          @media (max-width: 768px) {
            .flex {
              flex-wrap: wrap;
              gap: 0.5rem;
            }
          }
        `}</style>
      </div>

      {/* Category Manager */}
      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onCategoriesChange={onCategoriesChange}
      />
    </>
  );
}

// Compact version for mobile or smaller spaces
export function CalendarHeaderCompact({
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onCreateEvent,
  onCreateTask,
  onCategoriesChange,
  className,
}: CalendarHeaderProps) {
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  const handlePrevious = () => {
    switch (view) {
      case "day":
        onDateChange(addDays(currentDate, -1));
        break;
      case "week":
        onDateChange(addWeeks(currentDate, -1));
        break;
      case "month":
        onDateChange(addMonths(currentDate, -1));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case "day":
        onDateChange(addDays(currentDate, 1));
        break;
      case "week":
        onDateChange(addWeeks(currentDate, 1));
        break;
      case "month":
        onDateChange(addMonths(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getCompactDateText = () => {
    switch (view) {
      case "day":
        return currentDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      case "week": {
        const weekStart = addDays(currentDate, -currentDate.getDay());
        return weekStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
      case "month":
        return currentDate.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      default:
        return "";
    }
  };

  return (
    <>
      <div
        className={cn("border-b border-border bg-background p-3", className)}
      >
        <div className="flex items-center justify-between">
          {/* Left: Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={handleNext}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleToday}
            >
              Today
            </Button>
          </div>

          {/* Center: Date display */}
          <div className="font-medium text-sm">{getCompactDateText()}</div>

          {/* Right: View selector and actions */}
          <div className="flex items-center gap-1">
            <Select
              value={view}
              onValueChange={(value: CalendarView) => onViewChange(value)}
            >
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-8 gap-1">
                    <Plus className="h-3 w-3" />
                    <ChevronDown className="h-2 w-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onCreateEvent}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Event
                  </DropdownMenuItem>
                  {onCreateTask && (
                    <DropdownMenuItem onClick={onCreateTask}>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Task
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setIsCategoryManagerOpen(true)}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Manager */}
      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onCategoriesChange={onCategoriesChange}
      />
    </>
  );
}
