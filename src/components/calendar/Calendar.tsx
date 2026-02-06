import React, { useState, useCallback } from "react";
import { CalendarView, CalendarTask, CalendarEvent } from "./types";
import { CalendarHeader } from "./CalendarHeader";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import { ItemModal } from "./ItemModal";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface CalendarProps {
  className?: string;
  defaultView?: CalendarView;
  defaultDate?: Date;
}

interface ItemModalData {
  isOpen: boolean;
  item?: CalendarTask | CalendarEvent;
  initialDate?: Date;
  initialHour?: number;
  itemType?: "task" | "event";
}

export default function Calendar({
  className,
  defaultView = "month",
  defaultDate = new Date(),
}: CalendarProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(defaultDate);
  const [view, setView] = useState<CalendarView>(defaultView);
  const [itemModal, setItemModal] = useState<ItemModalData>({
    isOpen: false,
    item: undefined,
    initialDate: undefined,
    initialHour: undefined,
    itemType: "event",
  });

  const {
    items,
    loading,
    error,
    addTask,
    addEvent,
    updateItemById,
    deleteItem,
    refreshItems,
  } = useCalendarEvents();

  // Event handlers
  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView);
  }, []);

  const handleItemClick = useCallback((item: CalendarTask | CalendarEvent) => {
    setItemModal({
      isOpen: true,
      item,
      initialDate: undefined,
      initialHour: undefined,
      itemType: item.type,
    });
  }, []);

  const handleDateClick = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      if (view !== "day") {
        setView("day");
      }
    },
    [view],
  );

  const handleItemCreate = useCallback(
    (date?: Date, hour?: number, type?: "task" | "event") => {
      setItemModal({
        isOpen: true,
        item: undefined,
        initialDate: date || currentDate,
        initialHour: hour,
        itemType: type || "event",
      });
    },
    [currentDate],
  );

  const handleCreateEvent = useCallback(() => {
    handleItemCreate(currentDate, undefined, "event");
  }, [handleItemCreate, currentDate]);

  const handleCreateTask = useCallback(() => {
    handleItemCreate(currentDate, undefined, "task");
  }, [handleItemCreate, currentDate]);

  const handleItemSave = async (
    itemData: Partial<CalendarTask | CalendarEvent>,
  ) => {
    try {
      if (itemModal.item) {
        // Update existing item
        await updateItemById(itemModal.item.id, itemData);
        toast({
          title: "Success",
          description: `${itemData.type === "task" ? "Task" : "Event"} updated successfully`,
        });
      } else {
        // Create new item
        if (itemData.type === "task") {
          await addTask(itemData as Partial<CalendarTask>);
        } else {
          await addEvent(itemData as Partial<CalendarEvent>);
        }
        toast({
          title: "Success",
          description: `${itemData.type === "task" ? "Task" : "Event"} created successfully`,
        });
      }
    } catch (error) {
      // Error handling is done in the ItemModal
      throw error;
    }
  };

  const handleItemDelete = async (itemId: string) => {
    const success = await deleteItem(itemId);
    if (!success) {
      throw new Error("Failed to delete item");
    }
  };

  const handleCloseItemModal = useCallback(() => {
    setItemModal({
      isOpen: false,
      item: undefined,
      initialDate: undefined,
      initialHour: undefined,
      itemType: "event",
    });
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleCategoriesChange = useCallback(() => {
    // Refresh items when categories change to update UI
    refreshItems();
  }, [refreshItems]);

  // Show loading state
  if (loading && items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-96", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-96", className)}>
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load calendar</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Render appropriate view
  const renderCalendarView = () => {
    const viewProps = {
      currentDate,
      items,
      onItemClick: handleItemClick,
      onDateClick: handleDateClick,
      onItemCreate: handleItemCreate,
    };

    switch (view) {
      case "month":
        return <MonthView {...viewProps} />;
      case "week":
        return <WeekView {...viewProps} />;
      case "day":
        return <DayView {...viewProps} />;
      default:
        return <MonthView {...viewProps} />;
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Calendar Header */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onDateChange={handleDateChange}
        onViewChange={handleViewChange}
        onCreateEvent={handleCreateEvent}
        onCreateTask={handleCreateTask}
        onCategoriesChange={handleCategoriesChange}
      />

      {/* Calendar View */}
      <div className="flex-1 overflow-hidden">{renderCalendarView()}</div>

      {/* Item Modal */}
      <ItemModal
        isOpen={itemModal.isOpen}
        onClose={handleCloseItemModal}
        onSave={handleItemSave}
        onDelete={handleItemDelete}
        item={itemModal.item}
        initialDate={itemModal.initialDate}
        initialHour={itemModal.initialHour}
        itemType={itemModal.itemType}
      />
    </div>
  );
}

// Export additional components for custom implementations
export { CalendarHeader, MonthView, WeekView, DayView, ItemModal } from ".";
