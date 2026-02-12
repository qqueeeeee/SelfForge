export interface CalendarItem {
  id: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  category: ItemCategory;
  isAllDay?: boolean;
  createdAt: Date;
  updatedAt: Date;
  type: "task" | "event";
}

export interface CalendarTask extends CalendarItem {
  type: "task";
  completed: boolean;
  completedAt?: Date;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes (from timer)
  priority: "low" | "medium" | "high";
}

export interface CalendarEvent extends CalendarItem {
  type: "event";
  location?: string;
  attendees?: string[];
}

export type ItemCategory =
  | "deep-work"
  | "work"
  | "personal"
  | "meeting"
  | "custom";

// For backward compatibility
export type EventCategory = ItemCategory;

export interface ItemCategoryConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// For backward compatibility
export type EventCategoryConfig = ItemCategoryConfig;

export type CalendarView = "month" | "week" | "day";

export interface CalendarViewProps {
  currentDate: Date;
  items: (CalendarTask | CalendarEvent)[];
  onItemClick: (item: CalendarTask | CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onItemCreate: (date: Date, hour?: number, type?: "task" | "event") => void;
}

export interface ItemModalData {
  item?: CalendarTask | CalendarEvent;
  isOpen: boolean;
  initialDate?: Date;
  initialHour?: number;
  itemType?: "task" | "event";
}

// For backward compatibility
export interface EventModalData extends ItemModalData {
  event?: CalendarEvent;
}

export interface ItemFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  category: ItemCategory;
  isAllDay: boolean;
  type: "task" | "event";
  // Task-specific fields
  priority?: "low" | "medium" | "high";
  estimatedDuration?: number;
  // Event-specific fields
  location?: string;
  attendees?: string[];
}

// For backward compatibility
export interface EventFormData extends Omit<ItemFormData, "type"> {
  category: EventCategory;
}

export interface CalendarState {
  currentDate: Date;
  view: CalendarView;
  selectedItem: CalendarTask | CalendarEvent | null;
  isItemModalOpen: boolean;
  itemModalData: ItemModalData;
}

// Utility types for calendar navigation
export interface NavigationProps {
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onToday: () => void;
}

// Calendar storage interface for localStorage operations
export interface CalendarStorage {
  items: (CalendarTask | CalendarEvent)[];
  lastSync?: Date;
  version: string;
}

// For backward compatibility
export interface EventStorage {
  events: CalendarEvent[];
  lastSync?: Date;
  version: string;
}

// Timer integration interfaces
export interface TimerSession {
  id: string;
  taskId?: string;
  title: string;
  category: ItemCategory;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  completed: boolean;
  type: "pomodoro" | "deep-work" | "custom";
}
