import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDailyLogs, LogFormData } from "@/hooks/useDailyLogs";
import { Moon, Book, Dumbbell, Monitor, Smile, Save, Loader2, Plus, X, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function LogEntry() {
  const navigate = useNavigate();
  const { todayLog, customHabits, loading: dataLoading, saveLog } = useDailyLogs();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<LogFormData>({
    sleepHours: 7,
    studyHours: 0,
    gymCompleted: false,
    screenTimeHours: 0,
    mood: 5,
    notes: "",
    customHabits: [],
  });

  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitValue, setNewHabitValue] = useState("");

  // Populate form with existing data if available
  useEffect(() => {
    if (todayLog) {
      setFormData({
        sleepHours: todayLog.sleep_hours || 7,
        studyHours: todayLog.study_hours || 0,
        gymCompleted: todayLog.gym_completed || false,
        screenTimeHours: todayLog.screen_time_hours || 0,
        mood: todayLog.mood || 5,
        notes: todayLog.notes || "",
        customHabits: customHabits.map(h => ({
          name: h.habit_name,
          value: h.habit_value || "",
        })),
      });
    }
  }, [todayLog, customHabits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const success = await saveLog(formData);
    
    setSaving(false);
    if (success) {
      navigate("/");
    }
  };

  const addCustomHabit = () => {
    if (!newHabitName.trim()) return;
    
    setFormData({
      ...formData,
      customHabits: [...formData.customHabits, { name: newHabitName, value: newHabitValue }],
    });
    setNewHabitName("");
    setNewHabitValue("");
  };

  const removeCustomHabit = (index: number) => {
    const updated = formData.customHabits.filter((_, i) => i !== index);
    setFormData({ ...formData, customHabits: updated });
  };

  const notesCharCount = formData.notes.length;
  const notesMaxLength = 500;

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Log Entry</h1>
          <p className="text-muted-foreground flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        {todayLog && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
            Editing today's log
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Habits */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Core Habits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sleep */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-chart-2" />
                <Label>Sleep Hours (0-24)</Label>
                <span className="ml-auto text-sm font-medium text-foreground">
                  {formData.sleepHours} hrs
                </span>
              </div>
              <Slider
                value={[formData.sleepHours]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, sleepHours: value })
                }
                min={0}
                max={24}
                step={0.5}
              />
            </div>

            {/* Study */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Book className="h-4 w-4 text-chart-1" />
                <Label>Study/Deep Work Hours</Label>
                <span className="ml-auto text-sm font-medium text-foreground">
                  {formData.studyHours} hrs
                </span>
              </div>
              <Slider
                value={[formData.studyHours]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, studyHours: value })
                }
                min={0}
                max={16}
                step={0.5}
              />
            </div>

            {/* Screen Time */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-chart-3" />
                <Label>Screen Time (Non-work)</Label>
                <span className="ml-auto text-sm font-medium text-foreground">
                  {formData.screenTimeHours} hrs
                </span>
              </div>
              <Slider
                value={[formData.screenTimeHours]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, screenTimeHours: value })
                }
                min={0}
                max={16}
                step={0.5}
              />
            </div>

            {/* Gym */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-success" />
                <Label>Gym / Workout Completed</Label>
              </div>
              <Switch
                checked={formData.gymCompleted}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, gymCompleted: checked })
                }
              />
            </div>

            {/* Mood */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Smile className="h-4 w-4 text-chart-4" />
                <Label>Mood (1-10)</Label>
                <span className="ml-auto text-sm font-medium text-foreground">
                  {formData.mood}/10
                </span>
              </div>
              <Slider
                value={[formData.mood]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, mood: value })
                }
                min={1}
                max={10}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low energy</span>
                <span>Feeling great</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Habits */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Custom Habits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing custom habits */}
            {formData.customHabits.map((habit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{habit.name}</p>
                  {habit.value && (
                    <p className="text-xs text-muted-foreground">{habit.value}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCustomHabit(index)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Add new habit */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Habit name (e.g., Meditation)"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Value (optional, e.g., 20 mins)"
                value={newHabitValue}
                onChange={(e) => setNewHabitValue(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addCustomHabit}
                disabled={!newHabitName.trim()}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Journal Notes */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Journal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="How was your day? Any wins, challenges, or reflections? (Markdown supported)"
              value={formData.notes}
              onChange={(e) => {
                if (e.target.value.length <= notesMaxLength) {
                  setFormData({ ...formData, notes: e.target.value });
                }
              }}
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                These notes will be used by AI to provide personalized insights.
              </p>
              <span
                className={cn(
                  "text-xs",
                  notesCharCount > notesMaxLength * 0.9
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {notesCharCount}/{notesMaxLength}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" className="w-full gap-2" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {todayLog ? "Update Entry" : "Save Entry"}
        </Button>
      </form>

      {/* Today's Summary (shown if already logged) */}
      {todayLog && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Today's Logged Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Sleep:</span>{" "}
                <span className="font-medium">{todayLog.sleep_hours || 0} hrs</span>
              </div>
              <div>
                <span className="text-muted-foreground">Study:</span>{" "}
                <span className="font-medium">{todayLog.study_hours || 0} hrs</span>
              </div>
              <div>
                <span className="text-muted-foreground">Gym:</span>{" "}
                <span className="font-medium">{todayLog.gym_completed ? "✓ Yes" : "No"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Screen:</span>{" "}
                <span className="font-medium">{todayLog.screen_time_hours || 0} hrs</span>
              </div>
              <div>
                <span className="text-muted-foreground">Mood:</span>{" "}
                <span className="font-medium">{todayLog.mood || 0}/10</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
