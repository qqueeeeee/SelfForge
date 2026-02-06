// Main Calendar component
export { default as Calendar } from "./Calendar";

// Calendar views
export { MonthView, MonthViewCompact } from "./MonthView";
export { WeekView, WeekViewCompact } from "./WeekView";
export { DayView, DayViewSimple } from "./DayView";

// Calendar components
export { CalendarHeader, CalendarHeaderCompact } from "./CalendarHeader";
export { EventCard, EventCardMini } from "./EventCard";
export { EventModal } from "./EventModal";
export { ItemModal } from "./ItemModal";
// Types
export type {
  CalendarEvent,
  EventCategory,
  CalendarView,
  CalendarViewProps,
  EventModalData,
  EventFormData,
  CalendarState,
  NavigationProps,
  EventStorage,
  EventCategoryConfig,
} from "./types";

// Utilities re-exported for convenience
export {
  EVENT_CATEGORIES,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  addDays,
  addWeeks,
  addMonths,
  isSameDay,
  isSameMonth,
  isToday,
  formatTime,
  formatDate,
  formatDateShort,
  generateMonthGrid,
  generateWeekDays,
  generateHourSlots,
  createEvent,
  updateEvent,
  isMultiDayEvent,
  getEventsForDate,
  getEventsForDateRange,
  sortEventsByStartTime,
  hasConflict,
  saveEventsToStorage,
  loadEventsFromStorage,
  clearEventsStorage,
  exportEvents,
  importEvents,
} from "@/lib/calendar-utils";
