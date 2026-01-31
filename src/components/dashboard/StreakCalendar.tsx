import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { cn } from "@/lib/utils";

interface StreakCalendarProps {
  loggedDates: Date[];
}

export function StreakCalendar({ loggedDates }: StreakCalendarProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of week for the first day (0 = Sunday)
  const startDayOfWeek = getDay(monthStart);
  
  // Create padding for days before the month starts
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => null);

  const isLogged = (day: Date) => {
    return loggedDates.some(logDate => isSameDay(logDate, day));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Logging Streak</span>
          <span className="text-sm font-normal text-muted-foreground">
            {format(today, "MMMM yyyy")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-xs text-muted-foreground text-center py-1"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Padding for alignment */}
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}
          
          {/* Actual days */}
          {daysInMonth.map((day) => {
            const logged = isLogged(day);
            const isToday = isSameDay(day, today);
            const isFuture = day > today;
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-colors",
                  logged && "bg-primary text-primary-foreground",
                  !logged && !isFuture && "bg-muted/50 text-muted-foreground",
                  isFuture && "bg-transparent text-muted-foreground/50",
                  isToday && !logged && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                )}
              >
                {logged ? "✓" : format(day, "d")}
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary" />
            <span>Logged</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted/50" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded ring-2 ring-primary ring-offset-1" />
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
