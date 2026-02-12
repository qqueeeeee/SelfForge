import React, { useState, useEffect } from "react";
import { CalendarTask, CalendarEvent, ItemCategory } from "./types";
import { getCategoryConfig } from "@/lib/custom-categories";
import { loadCustomCategories } from "@/lib/custom-categories";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar as CalendarIcon,
  CheckSquare,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  Trash2,
} from "lucide-react";

interface ItemFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  category: string;
  isAllDay: boolean;
  type: "task" | "event";
  // Task-specific fields
  priority?: "low" | "medium" | "high";
  estimatedDuration?: number;
  completed?: boolean;
  // Event-specific fields
  location?: string;
  attendees?: string[];
}

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<CalendarTask | CalendarEvent>) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
  item?: CalendarTask | CalendarEvent;
  initialDate?: Date;
  initialHour?: number;
  itemType?: "task" | "event";
}

export function ItemModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  item,
  initialDate,
  initialHour,
  itemType = "event",
}: ItemModalProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<
    Array<{
      id: string;
      label: string;
      color: string;
      bgColor: string;
      borderColor: string;
    }>
  >([]);
  const [formData, setFormData] = useState<ItemFormData>({
    title: "",
    description: "",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "10:00",
    category: "work",
    isAllDay: false,
    type: itemType,
    priority: "medium",
    estimatedDuration: 60,
    completed: false,
    location: "",
    attendees: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const isEditing = Boolean(item);

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadedCategories = loadCustomCategories();
      setCategories(
        loadedCategories.map((cat) => ({
          id: cat.id,
          label: cat.label,
          color: cat.color,
          bgColor: cat.bgColor,
          borderColor: cat.borderColor,
        })),
      );
    }
  }, [isOpen]);

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (item) {
        // Editing existing item
        const startDate = format(item.startDateTime, "yyyy-MM-dd");
        const endDate = format(item.endDateTime, "yyyy-MM-dd");
        const startTime = item.isAllDay
          ? "09:00"
          : item.startDateTime.toTimeString().slice(0, 5);
        const endTime = item.isAllDay
          ? "10:00"
          : item.endDateTime.toTimeString().slice(0, 5);

        setFormData({
          title: item.title,
          description: item.description || "",
          startDate,
          endDate,
          startTime,
          endTime,
          category: item.category,
          isAllDay: item.isAllDay || false,
          type: item.type,
          priority:
            item.type === "task" ? (item as CalendarTask).priority : "medium",
          estimatedDuration:
            item.type === "task"
              ? (item as CalendarTask).estimatedDuration
              : 60,
          completed:
            item.type === "task" ? (item as CalendarTask).completed : false,
          location:
            item.type === "event" ? (item as CalendarEvent).location || "" : "",
          attendees:
            item.type === "event"
              ? (item as CalendarEvent).attendees || []
              : [],
        });
      } else {
        // Creating new item
        const defaultDate = initialDate || new Date();
        const defaultStartHour = initialHour || 9;
        const defaultEndHour = defaultStartHour + 1;

        const startDate = format(defaultDate, "yyyy-MM-dd");
        const startTime = `${defaultStartHour.toString().padStart(2, "0")}:00`;
        const endTime = `${defaultEndHour.toString().padStart(2, "0")}:00`;

        setFormData({
          title: "",
          description: "",
          startDate,
          endDate: startDate,
          startTime,
          endTime,
          category: categories[0]?.id || "work",
          isAllDay: false,
          type: itemType,
          priority: "medium",
          estimatedDuration: 60,
          completed: false,
          location: "",
          attendees: [],
        });
      }
    }
  }, [isOpen, item, initialDate, initialHour, itemType, categories]);

  const handleInputChange = (
    field: keyof ItemFormData,
    value: string | boolean | string[] | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const startDateTime = formData.isAllDay
        ? parseISO(`${formData.startDate}T00:00:00`)
        : parseISO(`${formData.startDate}T${formData.startTime}:00`);

      const endDateTime = formData.isAllDay
        ? parseISO(`${formData.endDate}T23:59:59`)
        : parseISO(`${formData.endDate}T${formData.endTime}:00`);

      if (endDateTime <= startDateTime && !formData.isAllDay) {
        toast({
          title: "Error",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return;
      }

      const baseItemData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDateTime,
        endDateTime,
        category: formData.category as ItemCategory,
        isAllDay: formData.isAllDay,
        type: formData.type,
      };

      let itemData: Partial<CalendarTask | CalendarEvent>;

      if (formData.type === "task") {
        itemData = {
          ...baseItemData,
          type: "task" as const,
          priority: formData.priority!,
          estimatedDuration: formData.estimatedDuration,
          completed: formData.completed || false,
        };
      } else {
        itemData = {
          ...baseItemData,
          type: "event" as const,
          location: formData.location?.trim() || undefined,
          attendees: formData.attendees?.filter((a) => a.trim()) || undefined,
        };
      }

      await onSave(itemData);

      toast({
        title: "Success",
        description: `${formData.type === "task" ? "Task" : "Event"} ${
          isEditing ? "updated" : "created"
        } successfully`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${isEditing ? "update" : "create"} ${formData.type}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item?.id || !onDelete) return;

    setIsLoading(true);
    try {
      await onDelete(item.id);
      toast({
        title: "Success",
        description: `${item.type === "task" ? "Task" : "Event"} deleted successfully`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete ${item.type}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categoryConfig = getCategoryConfig(formData.category);

  const formatDateForDisplay = (dateString: string) => {
    return parseISO(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const parseDate = (dateString?: string) => {
    if (!dateString) return undefined;

    const d = parseISO(dateString);

    return isNaN(d.getTime()) ? undefined : d;
  };

  const formatDateForInput = (date?: Date) => {
    if (!date || isNaN(date.getTime())) return "";
    return format(date, "yyyy-MM-dd");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.type === "task" ? (
              <CheckSquare className="h-5 w-5" />
            ) : (
              <CalendarIcon className="h-5 w-5" />
            )}
            {isEditing
              ? `Edit ${formData.type === "task" ? "Task" : "Event"}`
              : `New ${formData.type === "task" ? "Task" : "Event"}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update your ${formData.type} details`
              : `Create a new ${formData.type} for your calendar`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Type Selection (only for new items) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.type === "event" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange("type", "event")}
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Event
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "task" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange("type", "task")}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  Task
                </Button>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder={`Enter ${formData.type} title...`}
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder={`Describe your ${formData.type}...`}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full",
                        categoryConfig.bgColor.includes("purple") &&
                          "bg-purple-500",
                        categoryConfig.bgColor.includes("blue") &&
                          "bg-blue-500",
                        categoryConfig.bgColor.includes("green") &&
                          "bg-green-500",
                        categoryConfig.bgColor.includes("red") && "bg-red-500",
                        categoryConfig.bgColor.includes("orange") &&
                          "bg-orange-500",
                        categoryConfig.bgColor.includes("yellow") &&
                          "bg-yellow-500",
                        categoryConfig.bgColor.includes("pink") &&
                          "bg-pink-500",
                        categoryConfig.bgColor.includes("indigo") &&
                          "bg-indigo-500",
                        categoryConfig.bgColor.includes("teal") &&
                          "bg-teal-500",
                        categoryConfig.bgColor.includes("gray") &&
                          "bg-gray-500",
                      )}
                    />
                    {categoryConfig.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-3 w-3 rounded-full",
                          category.bgColor.includes("purple") &&
                            "bg-purple-500",
                          category.bgColor.includes("blue") && "bg-blue-500",
                          category.bgColor.includes("green") && "bg-green-500",
                          category.bgColor.includes("red") && "bg-red-500",
                          category.bgColor.includes("orange") &&
                            "bg-orange-500",
                          category.bgColor.includes("yellow") &&
                            "bg-yellow-500",
                          category.bgColor.includes("pink") && "bg-pink-500",
                          category.bgColor.includes("indigo") &&
                            "bg-indigo-500",
                          category.bgColor.includes("teal") && "bg-teal-500",
                          category.bgColor.includes("gray") && "bg-gray-500",
                        )}
                      />
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task-specific fields */}
          {formData.type === "task" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Task Settings
              </h4>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: "low" | "medium" | "high") =>
                    handleInputChange("priority", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Low Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        Medium Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        High Priority
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Estimated Duration */}
              <div className="space-y-2">
                <Label htmlFor="estimatedDuration">
                  Estimated Duration (minutes)
                </Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) =>
                    handleInputChange(
                      "estimatedDuration",
                      parseInt(e.target.value) || 60,
                    )
                  }
                  min={1}
                  max={1440}
                />
              </div>

              {/* Completion status (only for editing) */}
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="completed"
                    checked={formData.completed}
                    onCheckedChange={(checked) =>
                      handleInputChange("completed", Boolean(checked))
                    }
                  />
                  <Label htmlFor="completed">Mark as completed</Label>
                </div>
              )}
            </div>
          )}

          {/* Event-specific fields */}
          {formData.type === "event" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Event Settings
              </h4>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="Enter event location..."
                  maxLength={100}
                />
              </div>

              {/* Attendees */}
              <div className="space-y-2">
                <Label htmlFor="attendees">
                  <Users className="h-4 w-4 inline mr-1" />
                  Attendees (comma separated)
                </Label>
                <Input
                  id="attendees"
                  value={formData.attendees?.join(", ") || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "attendees",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="Enter attendee names or emails..."
                />
              </div>
            </div>
          )}

          {/* Date and Time */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Date & Time
            </h4>

            {/* All Day Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isAllDay"
                checked={formData.isAllDay}
                onCheckedChange={(checked) =>
                  handleInputChange("isAllDay", checked)
                }
              />
              <Label htmlFor="isAllDay">All day</Label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate
                        ? formatDateForDisplay(formData.startDate)
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDate(formData.startDate)}
                      onSelect={(date) => {
                        if (date) {
                          handleInputChange(
                            "startDate",
                            formatDateForInput(date),
                          );
                          setStartDateOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate
                        ? formatDateForDisplay(formData.endDate)
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDate(formData.endDate)}
                      onSelect={(date) => {
                        if (date) {
                          handleInputChange(
                            "endDate",
                            formatDateForInput(date),
                          );
                          setEndDateOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {!formData.isAllDay && (
                <>
                  {/* Start Time */}
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        handleInputChange("startTime", e.target.value)
                      }
                    />
                  </div>

                  {/* End Time */}
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        handleInputChange("endTime", e.target.value)
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <div className="flex-1">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
