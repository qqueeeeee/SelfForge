import {
  CalendarTask,
  CalendarEvent,
  CalendarStorage,
  EventStorage,
  ItemCategory,
  EventCategory,
  ItemCategoryConfig,
  EventCategoryConfig,
} from "@/components/calendar/types";
import {
  getCategoriesAsRecord,
  getCategoryConfig as getCustomCategoryConfig,
  migrateItemCategories as migrateCustomItemCategories,
} from "@/lib/custom-categories";

// Use custom categories system
export const ITEM_CATEGORIES = getCategoriesAsRecord();

// Backward compatibility
export const EVENT_CATEGORIES = ITEM_CATEGORIES;

// Get category config with fallback for invalid categories
export function getCategoryConfig(category: string): ItemCategoryConfig {
  return getCustomCategoryConfig(category);
}

// Storage keys for localStorage
const STORAGE_KEY_BASE = "selfforge-calendar-items";
const LEGACY_STORAGE_KEY_BASE = "selfforge-calendar-events"; // For migration
const STORAGE_VERSION = "2.0.0";

function getCurrentUserStorageKey(): string {
  const token = localStorage.getItem("token");
  if (!token) return "anonymous";

  try {
    const payload = token.split(".")[1];
    if (!payload) return "anonymous";

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    const subject = decoded?.sub ? String(decoded.sub) : "anonymous";
    return subject.replace(/[^a-zA-Z0-9._-]/g, "_");
  } catch {
    return "anonymous";
  }
}

function getStorageKey(): string {
  return `selfforge:${getCurrentUserStorageKey()}:${STORAGE_KEY_BASE}`;
}

function getLegacyStorageKey(): string {
  return `selfforge:${getCurrentUserStorageKey()}:${LEGACY_STORAGE_KEY_BASE}`;
}

// Date utility functions
export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day;
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfWeek(date: Date): Date {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfMonth(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const currentMonth = result.getMonth();
  result.setMonth(currentMonth + months);

  // Handle month overflow (e.g., Jan 31 + 1 month should be Feb 28/29)
  if (result.getMonth() !== (currentMonth + months) % 12) {
    result.setDate(0); // Set to last day of previous month
  }

  return result;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Generate calendar grid for month view
export function generateMonthGrid(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const startDate = startOfWeek(start);
  const endDate = endOfWeek(end);

  const days: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

// Generate week days
export function generateWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  const days: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }

  return days;
}

// Generate hour slots for day/week view
export function generateHourSlots(): number[] {
  const hours: number[] = [];
  for (let i = 0; i < 24; i++) {
    hours.push(i);
  }
  return hours;
}

// Calendar item utility functions
export function createTask(taskData: Partial<CalendarTask>): CalendarTask {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    type: "task",
    title: taskData.title || "",
    description: taskData.description || "",
    startDateTime: taskData.startDateTime || now,
    endDateTime: taskData.endDateTime || addDays(now, 1),
    category: taskData.category || "work",
    isAllDay: taskData.isAllDay || false,
    completed: false,
    priority: taskData.priority || "medium",
    createdAt: now,
    updatedAt: now,
    ...taskData,
  };
}

export function createEvent(eventData: Partial<CalendarEvent>): CalendarEvent {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    type: "event",
    title: eventData.title || "",
    description: eventData.description || "",
    startDateTime: eventData.startDateTime || now,
    endDateTime: eventData.endDateTime || addDays(now, 1),
    category: eventData.category || "personal",
    isAllDay: eventData.isAllDay || false,
    createdAt: now,
    updatedAt: now,
    ...eventData,
  };
}

export function createItem(
  itemData: Partial<CalendarTask | CalendarEvent>,
): CalendarTask | CalendarEvent {
  if (itemData.type === "task") {
    return createTask(itemData as Partial<CalendarTask>);
  } else {
    return createEvent(itemData as Partial<CalendarEvent>);
  }
}

export function updateItem<T extends CalendarTask | CalendarEvent>(
  item: T,
  updates: Partial<T>,
): T {
  return {
    ...item,
    ...updates,
    updatedAt: new Date(),
  };
}

// Backward compatibility
export function updateEvent(
  event: CalendarEvent,
  updates: Partial<CalendarEvent>,
): CalendarEvent {
  return updateItem(event, updates);
}

// Check if item spans multiple days
export function isMultiDayItem(item: CalendarTask | CalendarEvent): boolean {
  return !isSameDay(item.startDateTime, item.endDateTime);
}

// Backward compatibility
export function isMultiDayEvent(event: CalendarEvent): boolean {
  return isMultiDayItem(event);
}

// Get items for a specific date
export function getItemsForDate(
  items: (CalendarTask | CalendarEvent)[],
  date: Date,
): (CalendarTask | CalendarEvent)[] {
  return items.filter((item) => {
    if (item.isAllDay) {
      return isSameDay(item.startDateTime, date);
    }

    const itemStart = startOfDay(item.startDateTime);
    const itemEnd = endOfDay(item.endDateTime);
    const targetDay = startOfDay(date);

    return targetDay >= itemStart && targetDay <= itemEnd;
  });
}

// Backward compatibility
export function getEventsForDate(
  events: CalendarEvent[],
  date: Date,
): CalendarEvent[] {
  return getItemsForDate(events, date) as CalendarEvent[];
}

// Get items for a date range
export function getItemsForDateRange(
  items: (CalendarTask | CalendarEvent)[],
  startDate: Date,
  endDate: Date,
): (CalendarTask | CalendarEvent)[] {
  return items.filter((item) => {
    const itemStart = item.startDateTime;
    const itemEnd = item.endDateTime;

    return (
      (itemStart >= startDate && itemStart <= endDate) ||
      (itemEnd >= startDate && itemEnd <= endDate) ||
      (itemStart < startDate && itemEnd > endDate)
    );
  });
}

// Backward compatibility
export function getEventsForDateRange(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date,
): CalendarEvent[] {
  return getItemsForDateRange(events, startDate, endDate) as CalendarEvent[];
}

// Sort items by start time
export function sortItemsByStartTime<T extends CalendarTask | CalendarEvent>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime(),
  );
}

// Backward compatibility
export function sortEventsByStartTime(
  events: CalendarEvent[],
): CalendarEvent[] {
  return sortItemsByStartTime(events);
}

// Check for item conflicts
export function hasConflict(
  item1: CalendarTask | CalendarEvent,
  item2: CalendarTask | CalendarEvent,
): boolean {
  if (item1.id === item2.id) return false;
  if (item1.isAllDay || item2.isAllDay)
    return isSameDay(item1.startDateTime, item2.startDateTime);

  return (
    item1.startDateTime < item2.endDateTime &&
    item1.endDateTime > item2.startDateTime
  );
}

// localStorage operations for calendar items
export function saveItemsToStorage(
  items: (CalendarTask | CalendarEvent)[],
): void {
  try {
    const storage: CalendarStorage = {
      items: items.map((item) => ({
        ...item,
        startDateTime: item.startDateTime,
        endDateTime: item.endDateTime,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      lastSync: new Date(),
      version: STORAGE_VERSION,
    };

    localStorage.setItem(
      getStorageKey(),
      JSON.stringify(storage, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }),
    );
  } catch (error) {
    console.error("Failed to save calendar items to localStorage:", error);
  }
}

// Backward compatibility
export function saveEventsToStorage(events: CalendarEvent[]): void {
  saveItemsToStorage(events);
}

export function loadItemsFromStorage(): (CalendarTask | CalendarEvent)[] {
  try {
    // Try new storage format first
    const stored = localStorage.getItem(getStorageKey());
    if (stored) {
      const storage: CalendarStorage = JSON.parse(stored, (key, value) => {
        if (
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)
        ) {
          return new Date(value);
        }
        return value;
      });

      // Migrate categories and return fixed items
      return migrateCustomItemCategories(storage.items || []);
    }

    // Try legacy storage format
    const legacyStored = localStorage.getItem(getLegacyStorageKey());
    if (legacyStored) {
      const storage: EventStorage = JSON.parse(legacyStored, (key, value) => {
        if (
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)
        ) {
          return new Date(value);
        }
        return value;
      });

      // Migrate legacy events to new format
      const migratedItems = (storage.events || []).map(
        (event): CalendarEvent => ({
          ...event,
          type: "event" as const,
        }),
      );

      // Migrate categories and save in new format
      const fixedItems = migrateCustomItemCategories(migratedItems);
      saveItemsToStorage(fixedItems);
      localStorage.removeItem(getLegacyStorageKey());

      return fixedItems;
    }

    return [];
  } catch (error) {
    console.error("Failed to load calendar items from localStorage:", error);
    return [];
  }
}

// Backward compatibility
export function loadEventsFromStorage(): CalendarEvent[] {
  return loadItemsFromStorage().filter(
    (item): item is CalendarEvent => item.type === "event",
  );
}

export function clearItemsStorage(): void {
  try {
    localStorage.removeItem(getStorageKey());
    localStorage.removeItem(getLegacyStorageKey());
  } catch (error) {
    console.error("Failed to clear calendar storage:", error);
  }
}

// Backward compatibility
export function clearEventsStorage(): void {
  clearItemsStorage();
}

// Export calendar items (for future backend sync)
export function exportItems(items: (CalendarTask | CalendarEvent)[]): string {
  return JSON.stringify(items, null, 2);
}

// Import calendar items (for future backend sync)
export function importItems(
  jsonData: string,
): (CalendarTask | CalendarEvent)[] {
  try {
    const items = JSON.parse(jsonData);
    return items.map((item: Record<string, unknown>) => ({
      ...item,
      startDateTime: new Date(item.startDateTime as string),
      endDateTime: new Date(item.endDateTime as string),
      createdAt: new Date(item.createdAt as string),
      updatedAt: new Date(item.updatedAt as string),
    }));
  } catch (error) {
    console.error("Failed to import calendar items:", error);
    return [];
  }
}

// Backward compatibility
export function exportEvents(events: CalendarEvent[]): string {
  return exportItems(events);
}

export function importEvents(jsonData: string): CalendarEvent[] {
  return importItems(jsonData).filter(
    (item): item is CalendarEvent => item.type === "event",
  );
}

// Create sample calendar items for demonstration
export function createSampleItems(): (CalendarTask | CalendarEvent)[] {
  const now = new Date();
  const today = startOfDay(now);

  return [
    // Tasks
    createTask({
      title: "Complete project proposal",
      description: "Write and review the quarterly project proposal",
      startDateTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM
      endDateTime: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 11 AM
      category: "work",
      priority: "high",
      estimatedDuration: 120,
    }),
    createTask({
      title: "Review pull requests",
      description: "Review and approve pending code changes",
      startDateTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM
      endDateTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3 PM
      category: "work",
      priority: "medium",
      estimatedDuration: 60,
    }),
    createTask({
      title: "Workout session",
      description: "30 minutes of cardio and strength training",
      startDateTime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6 PM
      endDateTime: new Date(today.getTime() + 19 * 60 * 60 * 1000), // 7 PM
      category: "personal",
      priority: "high",
      estimatedDuration: 60,
    }),

    // Events
    createEvent({
      title: "Team Standup Meeting",
      description: "Daily sync with the development team",
      startDateTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM
      endDateTime: new Date(today.getTime() + 10.5 * 60 * 60 * 1000), // 10:30 AM
      category: "meeting",
      location: "Conference Room A",
    }),
    createEvent({
      title: "Lunch with Sarah",
      description: "Catch up over lunch at the new cafe",
      startDateTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12 PM
      endDateTime: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 1 PM
      category: "personal",
      location: "Downtown Cafe",
    }),
    createEvent({
      title: "Conference Day",
      description: "Annual tech conference - all day event",
      startDateTime: addDays(today, 2),
      endDateTime: addDays(today, 2),
      category: "work",
      isAllDay: true,
      location: "Convention Center",
    }),
  ];
}

// Backward compatibility
export function createSampleEvents(): CalendarEvent[] {
  return createSampleItems().filter(
    (item): item is CalendarEvent => item.type === "event",
  );
}

// Initialize calendar with sample data if empty
export function initializeCalendarWithSampleData(): void {
  const existingItems = loadItemsFromStorage();
  if (existingItems.length === 0) {
    const sampleItems = createSampleItems();
    saveItemsToStorage(sampleItems);
  }
}

// Migrate items with invalid categories to valid ones
export function migrateItemCategories(
  items: (CalendarTask | CalendarEvent)[],
): (CalendarTask | CalendarEvent)[] {
  return migrateCustomItemCategories(items);
}

// Validate calendar item data
export function validateItem(
  item: Partial<CalendarTask | CalendarEvent>,
): string | null {
  if (!item.title?.trim()) {
    return "Title is required";
  }

  if (!item.startDateTime) {
    return "Start date and time are required";
  }

  if (!item.endDateTime) {
    return "End date and time are required";
  }

  if (item.endDateTime <= item.startDateTime) {
    return "End time must be after start time";
  }

  if (!item.category) {
    return "Category is required";
  }

  if (!item.type) {
    return "Item type (task or event) is required";
  }

  return null;
}

// Backward compatibility
export function validateEvent(event: Partial<CalendarEvent>): string | null {
  return validateItem(event);
}

// Get item duration in minutes
export function getItemDurationMinutes(
  item: CalendarTask | CalendarEvent,
): number {
  return (
    (item.endDateTime.getTime() - item.startDateTime.getTime()) / (1000 * 60)
  );
}

// Get item duration as formatted string
export function getItemDurationText(
  item: CalendarTask | CalendarEvent,
): string {
  const minutes = getItemDurationMinutes(item);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

// Backward compatibility
export function getEventDurationMinutes(event: CalendarEvent): number {
  return getItemDurationMinutes(event);
}

export function getEventDurationText(event: CalendarEvent): string {
  return getItemDurationText(event);
}

// Task-specific utilities
export function completeTask(task: CalendarTask): CalendarTask {
  return {
    ...task,
    completed: true,
    completedAt: new Date(),
    updatedAt: new Date(),
  };
}

export function uncompleteTask(task: CalendarTask): CalendarTask {
  return {
    ...task,
    completed: false,
    completedAt: undefined,
    updatedAt: new Date(),
  };
}

export function toggleTaskCompletion(task: CalendarTask): CalendarTask {
  return task.completed ? uncompleteTask(task) : completeTask(task);
}

// Timer integration utilities
export function createTaskFromTimer(timerSession: {
  title: string;
  category: ItemCategory;
  startTime: Date;
  endTime: Date;
  duration: number;
}): CalendarTask {
  return createTask({
    title: timerSession.title,
    category: timerSession.category,
    startDateTime: timerSession.startTime,
    endDateTime: timerSession.endTime,
    actualDuration: timerSession.duration,
    completed: true,
    completedAt: timerSession.endTime,
    priority: timerSession.category === "deep-work" ? "high" : "medium",
  });
}

// Utility function to clear corrupted calendar data and reinitialize
export function clearCorruptedCalendarData(): void {
  try {
    // Clear all calendar-related localStorage data
    localStorage.removeItem(getStorageKey());
    localStorage.removeItem(getLegacyStorageKey());

    console.log("Cleared corrupted calendar data from localStorage");

    // Reinitialize with sample data
    initializeCalendarWithSampleData();

    console.log("Reinitialized calendar with sample data");
  } catch (error) {
    console.error("Failed to clear corrupted calendar data:", error);
  }
}
