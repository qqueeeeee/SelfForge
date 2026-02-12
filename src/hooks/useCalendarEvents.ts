import { useState, useEffect, useCallback } from "react";
import { CalendarTask, CalendarEvent } from "@/components/calendar/types";
import {
  saveItemsToStorage,
  loadItemsFromStorage,
  createTask,
  createEvent,
  createItem,
  updateItem,
  getItemsForDate,
  getItemsForDateRange,
  sortItemsByStartTime,
  toggleTaskCompletion,
  initializeCalendarWithSampleData,
} from "@/lib/calendar-utils";
import {
  calendarApi,
  transformCalendarItemToFrontend,
  transformCalendarItemFromFrontend,
} from "@/lib/api";

interface UseCalendarEventsReturn {
  items: (CalendarTask | CalendarEvent)[];
  tasks: CalendarTask[];
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  addTask: (taskData: Partial<CalendarTask>) => Promise<CalendarTask>;
  addEvent: (eventData: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  addItem: (
    itemData: Partial<CalendarTask | CalendarEvent>,
  ) => Promise<CalendarTask | CalendarEvent>;
  updateItemById: (
    id: string,
    updates: Partial<CalendarTask | CalendarEvent>,
  ) => Promise<CalendarTask | CalendarEvent | null>;
  deleteItem: (id: string) => Promise<boolean>;
  toggleTaskCompletion: (taskId: string) => Promise<CalendarTask | null>;
  getItemById: (id: string) => CalendarTask | CalendarEvent | undefined;
  getItemsForDate: (date: Date) => (CalendarTask | CalendarEvent)[];
  getItemsForRange: (
    startDate: Date,
    endDate: Date,
  ) => (CalendarTask | CalendarEvent)[];
  clearAllItems: () => Promise<void>;
  refreshItems: () => Promise<void>;
  // Backward compatibility
  updateEventById: (
    id: string,
    updates: Partial<CalendarEvent>,
  ) => Promise<CalendarEvent | null>;
  deleteEvent: (id: string) => Promise<boolean>;
  getEventById: (id: string) => CalendarEvent | undefined;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForRange: (startDate: Date, endDate: Date) => CalendarEvent[];
  clearAllEvents: () => Promise<void>;
  refreshEvents: () => Promise<void>;
}

export function useCalendarEvents(): UseCalendarEventsReturn {
  const [items, setItems] = useState<(CalendarTask | CalendarEvent)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Load items from localStorage on mount
  useEffect(() => {
    loadItems();
  }, []);

  // Save items to localStorage whenever items change
  useEffect(() => {
    if (!loading) {
      saveItemsToStorage(items);
    }
  }, [items, loading]);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from backend first
      const backendResponse = await calendarApi.getItems();

      if (backendResponse.status === 200 && backendResponse.data) {
        // Transform backend data to frontend format
        const backendItems = backendResponse.data.map(
          transformCalendarItemToFrontend,
        );
        setItems(sortItemsByStartTime(backendItems));
        setIsOnline(true);

        // Save to localStorage as backup
        saveItemsToStorage(backendItems);
      } else {
        // Fall back to localStorage
        setIsOnline(false);
        const storedItems = loadItemsFromStorage();

        if (storedItems.length === 0) {
          // Initialize with sample data if no items exist
          initializeCalendarWithSampleData();
          const sampleItems = loadItemsFromStorage();
          setItems(sampleItems);
        } else {
          setItems(storedItems);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
      setIsOnline(false);

      // Fall back to localStorage
      const storedItems = loadItemsFromStorage();
      setItems(storedItems);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTask = useCallback(
    async (taskData: Partial<CalendarTask>): Promise<CalendarTask> => {
      try {
        setError(null);
        const newTask = createTask(taskData);

        if (isOnline) {
          // Try to save to backend
          const backendData = transformCalendarItemFromFrontend(newTask);
          const response = await calendarApi.createItem(backendData);

          if (response.status === 200 && response.data) {
            const savedTask = transformCalendarItemToFrontend(
              response.data,
            ) as CalendarTask;

            setItems((prevItems) => {
              const updatedItems = [...prevItems, savedTask];
              return sortItemsByStartTime(updatedItems);
            });

            return savedTask;
          }
        }

        // Fall back to local storage
        setItems((prevItems) => {
          const updatedItems = [...prevItems, newTask];
          saveItemsToStorage(updatedItems);
          return sortItemsByStartTime(updatedItems);
        });

        return newTask;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add task";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [isOnline],
  );

  const addEvent = useCallback(
    async (eventData: Partial<CalendarEvent>): Promise<CalendarEvent> => {
      try {
        setError(null);
        const newEvent = createEvent(eventData);

        if (isOnline) {
          // Try to save to backend
          const backendData = transformCalendarItemFromFrontend(newEvent);
          const response = await calendarApi.createItem(backendData);

          if (response.status === 200 && response.data) {
            const savedEvent = transformCalendarItemToFrontend(
              response.data,
            ) as CalendarEvent;

            setItems((prevItems) => {
              const updatedItems = [...prevItems, savedEvent];
              return sortItemsByStartTime(updatedItems);
            });

            return savedEvent;
          }
        }

        // Fall back to local storage
        setItems((prevItems) => {
          const updatedItems = [...prevItems, newEvent];
          saveItemsToStorage(updatedItems);
          return sortItemsByStartTime(updatedItems);
        });

        return newEvent;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add event";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [isOnline],
  );

  const addItem = useCallback(
    async (
      itemData: Partial<CalendarTask | CalendarEvent>,
    ): Promise<CalendarTask | CalendarEvent> => {
      try {
        setError(null);
        const newItem = createItem(itemData);

        setItems((prevItems) => {
          const updatedItems = [...prevItems, newItem];
          return sortItemsByStartTime(updatedItems);
        });

        return newItem;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add item";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [],
  );

  const updateItemById = useCallback(
    async (
      id: string,
      updates: Partial<CalendarTask | CalendarEvent>,
    ): Promise<CalendarTask | CalendarEvent | null> => {
      try {
        setError(null);
        let updatedItem: CalendarTask | CalendarEvent | null = null;

        if (isOnline) {
          // Try to update in backend
          const response = await calendarApi.updateItem(
            id,
            transformCalendarItemFromFrontend(updates),
          );

          if (response.status === 200 && response.data) {
            updatedItem = transformCalendarItemToFrontend(response.data);

            setItems((prevItems) => {
              const itemIndex = prevItems.findIndex((item) => item.id === id);
              if (itemIndex === -1) return prevItems;

              const newItems = [...prevItems];
              newItems[itemIndex] = updatedItem!;
              return sortItemsByStartTime(newItems);
            });

            return updatedItem;
          }
        }

        // Fall back to local update
        setItems((prevItems) => {
          const itemIndex = prevItems.findIndex((item) => item.id === id);
          if (itemIndex === -1) {
            throw new Error("Item not found");
          }

          const existingItem = prevItems[itemIndex];
          updatedItem = updateItem(existingItem, updates);

          const newItems = [...prevItems];
          newItems[itemIndex] = updatedItem;

          saveItemsToStorage(newItems);
          return sortItemsByStartTime(newItems);
        });

        return updatedItem;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update item";
        setError(errorMessage);
        return null;
      }
    },
    [isOnline],
  );

  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);

        if (isOnline) {
          // Try to delete from backend
          const response = await calendarApi.deleteItem(id);

          if (response.status === 200) {
            setItems((prevItems) => {
              const updatedItems = prevItems.filter((item) => item.id !== id);
              return updatedItems;
            });

            return true;
          }
        }

        // Fall back to local delete
        let itemFound = false;

        setItems((prevItems) => {
          const itemIndex = prevItems.findIndex((item) => item.id === id);
          if (itemIndex === -1) {
            return prevItems;
          }

          itemFound = true;
          const updatedItems = prevItems.filter((item) => item.id !== id);
          saveItemsToStorage(updatedItems);
          return updatedItems;
        });

        if (!itemFound) {
          throw new Error("Item not found");
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete item";
        setError(errorMessage);
        return false;
      }
    },
    [isOnline],
  );

  const toggleTaskCompletionCallback = useCallback(
    async (taskId: string): Promise<CalendarTask | null> => {
      try {
        setError(null);
        let updatedTask: CalendarTask | null = null;

        setItems((prevItems) => {
          const taskIndex = prevItems.findIndex(
            (item) => item.id === taskId && item.type === "task",
          );
          if (taskIndex === -1) {
            throw new Error("Task not found");
          }

          const existingTask = prevItems[taskIndex] as CalendarTask;
          updatedTask = toggleTaskCompletion(existingTask);

          const newItems = [...prevItems];
          newItems[taskIndex] = updatedTask;

          return sortItemsByStartTime(newItems);
        });

        return updatedTask;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to toggle task completion";
        setError(errorMessage);
        return null;
      }
    },
    [],
  );

  const getItemById = useCallback(
    (id: string): CalendarTask | CalendarEvent | undefined => {
      return items.find((item) => item.id === id);
    },
    [items],
  );

  const getItemsForDateCallback = useCallback(
    (date: Date): (CalendarTask | CalendarEvent)[] => {
      return getItemsForDate(items, date);
    },
    [items],
  );

  const getItemsForRangeCallback = useCallback(
    (startDate: Date, endDate: Date): (CalendarTask | CalendarEvent)[] => {
      return getItemsForDateRange(items, startDate, endDate);
    },
    [items],
  );

  const clearAllItems = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setItems([]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear items";
      setError(errorMessage);
    }
  }, []);

  const refreshItems = useCallback(async (): Promise<void> => {
    await loadItems();
  }, [loadItems]);

  // Derived state
  const tasks = items.filter(
    (item): item is CalendarTask => item.type === "task",
  );
  const events = items.filter(
    (item): item is CalendarEvent => item.type === "event",
  );

  // Backward compatibility functions
  const updateEventById = useCallback(
    async (
      id: string,
      updates: Partial<CalendarEvent>,
    ): Promise<CalendarEvent | null> => {
      const result = await updateItemById(id, updates);
      return result && result.type === "event" ? result : null;
    },
    [updateItemById],
  );

  const deleteEvent = useCallback(
    async (id: string): Promise<boolean> => {
      return await deleteItem(id);
    },
    [deleteItem],
  );

  const getEventById = useCallback(
    (id: string): CalendarEvent | undefined => {
      const item = getItemById(id);
      return item && item.type === "event" ? item : undefined;
    },
    [getItemById],
  );

  const getEventsForDateCallback = useCallback(
    (date: Date): CalendarEvent[] => {
      return getItemsForDateCallback(date).filter(
        (item): item is CalendarEvent => item.type === "event",
      );
    },
    [getItemsForDateCallback],
  );

  const getEventsForRange = useCallback(
    (startDate: Date, endDate: Date): CalendarEvent[] => {
      return getItemsForRangeCallback(startDate, endDate).filter(
        (item): item is CalendarEvent => item.type === "event",
      );
    },
    [getItemsForRangeCallback],
  );

  const clearAllEvents = useCallback(async (): Promise<void> => {
    await clearAllItems();
  }, [clearAllItems]);

  const refreshEvents = useCallback(async (): Promise<void> => {
    await refreshItems();
  }, [refreshItems]);

  return {
    items,
    tasks,
    events,
    loading,
    error,
    isOnline,
    addTask,
    addEvent,
    addItem,
    updateItemById,
    deleteItem,
    toggleTaskCompletion: toggleTaskCompletionCallback,
    getItemById,
    getItemsForDate: getItemsForDateCallback,
    getItemsForRange: getItemsForRangeCallback,
    clearAllItems,
    refreshItems,
    // Backward compatibility
    updateEventById,
    deleteEvent,
    getEventById,
    getEventsForDate: getEventsForDateCallback,
    getEventsForRange,
    clearAllEvents,
    refreshEvents,
  };
}

// Hook for getting items within a specific time range (useful for views)
export function useCalendarItemsForRange(startDate: Date, endDate: Date) {
  const { items, ...rest } = useCalendarEvents();

  const rangeItems = getItemsForDateRange(items, startDate, endDate);

  return {
    items: rangeItems,
    allItems: items,
    ...rest,
  };
}

// Hook for getting items for a specific date (useful for day view)
export function useCalendarItemsForDate(date: Date) {
  const { items, ...rest } = useCalendarEvents();

  const dateItems = getItemsForDate(items, date);

  return {
    items: dateItems,
    allItems: items,
    ...rest,
  };
}

// Backward compatibility hooks
export function useCalendarEventsForRange(startDate: Date, endDate: Date) {
  const { events, items, ...rest } = useCalendarEvents();

  const rangeEvents = getItemsForDateRange(items, startDate, endDate).filter(
    (item): item is CalendarEvent => item.type === "event",
  );

  return {
    events: rangeEvents,
    allEvents: events,
    ...rest,
  };
}

export function useCalendarEventsForDate(date: Date) {
  const { events, items, ...rest } = useCalendarEvents();

  const dateEvents = getItemsForDate(items, date).filter(
    (item): item is CalendarEvent => item.type === "event",
  );

  return {
    events: dateEvents,
    allEvents: events,
    ...rest,
  };
}
