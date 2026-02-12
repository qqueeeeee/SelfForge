import React, { useState, useEffect } from "react";
import { CalendarEvent, EventCategory, EventFormData } from "./types";
import {
  EVENT_CATEGORIES,
  getCategoryConfig,
  formatDate,
} from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Tag, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Partial<CalendarEvent>) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  event?: CalendarEvent;
  initialDate?: Date;
  initialHour?: number;
}

export function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  initialDate,
  initialHour,
}: EventModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "10:00",
    category: "work",
    isAllDay: false,
  });

  const isEditing = Boolean(event);

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Editing existing event
        setFormData({
          title: event.title,
          description: event.description || "",
          startDate: event.startDateTime.toISOString().split("T")[0],
          startTime: event.startDateTime.toTimeString().slice(0, 5),
          endDate: event.endDateTime.toISOString().split("T")[0],
          endTime: event.endDateTime.toTimeString().slice(0, 5),
          category: event.category,
          isAllDay: event.isAllDay || false,
        });
      } else {
        // Creating new event
        const defaultDate = initialDate || new Date();
        const defaultStartHour = initialHour || 9;
        const defaultEndHour = defaultStartHour + 1;

        const startDate = defaultDate.toISOString().split("T")[0];
        const startTime = `${defaultStartHour.toString().padStart(2, "0")}:00`;
        const endTime = `${defaultEndHour.toString().padStart(2, "0")}:00`;

        setFormData({
          title: "",
          description: "",
          startDate,
          startTime,
          endDate: startDate,
          endTime,
          category: "work",
          isAllDay: false,
        });
      }
    }
  }, [isOpen, event, initialDate, initialHour]);

  const handleInputChange = (
    field: keyof EventFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-adjust end date/time when start changes
      if (field === "startDate" && !prev.isAllDay) {
        updated.endDate = value as string;
      }
      if (field === "startTime" && !prev.isAllDay) {
        const startHour = parseInt((value as string).split(":")[0]);
        const startMinute = parseInt((value as string).split(":")[1]);
        const endHour = startHour + 1;
        updated.endTime = `${endHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`;
      }
      if (field === "isAllDay") {
        if (value) {
          updated.startTime = "00:00";
          updated.endTime = "23:59";
        } else {
          updated.startTime = "09:00";
          updated.endTime = "10:00";
        }
      }

      return updated;
    });
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return "Event title is required";
    }

    const startDateTime = new Date(
      `${formData.startDate}T${formData.startTime}`,
    );
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      return "End time must be after start time";
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime}`,
      );
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const eventData: Partial<CalendarEvent> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDateTime,
        endDateTime,
        category: formData.category,
        isAllDay: formData.isAllDay,
      };

      if (event) {
        eventData.id = event.id;
      }

      await onSave(eventData);

      toast({
        title: isEditing ? "Event Updated" : "Event Created",
        description: `"${formData.title}" has been ${isEditing ? "updated" : "created"} successfully.`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;

    setIsLoading(true);
    try {
      await onDelete(event.id);
      toast({
        title: "Event Deleted",
        description: `"${event.title}" has been deleted successfully.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categoryConfig = getCategoryConfig(formData.category);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isEditing ? "Edit Event" : "Create Event"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Event Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter event title..."
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Category
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value: EventCategory) =>
                handleInputChange("category", value)
              }
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full",
                        formData.category === "deep-work" && "bg-purple-500",
                        formData.category === "work" && "bg-blue-500",
                        formData.category === "personal" && "bg-green-500",
                        formData.category === "custom" && "bg-amber-500",
                      )}
                    />
                    {categoryConfig.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_CATEGORIES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-3 w-3 rounded-full",
                          key === "deep-work" && "bg-purple-500",
                          key === "work" && "bg-blue-500",
                          key === "personal" && "bg-green-500",
                          key === "custom" && "bg-amber-500",
                        )}
                      />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              All Day
            </Label>
            <Switch
              checked={formData.isAllDay}
              onCheckedChange={(checked) =>
                handleInputChange("isAllDay", checked)
              }
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
              />
            </div>
          </div>

          {!formData.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    handleInputChange("startTime", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description (optional)..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isEditing && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
