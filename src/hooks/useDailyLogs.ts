import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";

/**
 * Daily Logs Hook
 * 
 * Manages daily habit tracking data with Supabase integration.
 * 
 * Future Backend Integration:
 * - Replace Supabase calls with custom API endpoints:
 *   - GET /api/logs?days=30 for fetching logs
 *   - POST /api/logs for creating/updating logs
 *   - GET /api/logs/today for today's log
 * - Add offline support with local storage sync
 */

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  sleep_hours: number | null;
  study_hours: number | null;
  gym_completed: boolean;
  screen_time_hours: number | null;
  mood: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomHabit {
  id: string;
  user_id: string;
  log_id: string;
  habit_name: string;
  habit_value: string | null;
  created_at: string;
}

export interface LogFormData {
  sleepHours: number;
  studyHours: number;
  gymCompleted: boolean;
  screenTimeHours: number;
  mood: number;
  notes: string;
  customHabits: { name: string; value: string }[];
}

// Error message mapping for user-friendly messages
function getErrorMessage(error: any): string {
  const message = error?.message || "An unexpected error occurred";
  
  // Network errors
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "Network error. Please check your internet connection.";
  }
  
  // Permission errors
  if (message.includes("permission denied") || message.includes("not authorized")) {
    return "You don't have permission to perform this action.";
  }
  
  // Row Level Security errors
  if (message.includes("row-level security")) {
    return "Access denied. Please try signing out and back in.";
  }
  
  return message;
}

export function useDailyLogs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [customHabits, setCustomHabits] = useState<CustomHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (days: number = 30) => {
    if (!user) return;

    setError(null);
    
    try {
      const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");
      
      // Future: Replace with fetch('/api/logs?days=' + days)
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", startDate)
        .order("log_date", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast({
        title: "Failed to load logs",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const fetchTodayLog = useCallback(async () => {
    if (!user) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Future: Replace with fetch('/api/logs/today')
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle();

      if (error) throw error;
      setTodayLog(data);

      // Fetch custom habits for today's log
      if (data) {
        const { data: habitsData, error: habitsError } = await supabase
          .from("custom_habits")
          .select("*")
          .eq("log_id", data.id);

        if (habitsError) throw habitsError;
        setCustomHabits(habitsData || []);
      }
    } catch (error: any) {
      console.error("Error fetching today's log:", error);
      // Don't show toast for today's log - it might not exist yet
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveLog = async (formData: LogFormData): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to save your log.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const logData = {
        user_id: user.id,
        log_date: today,
        sleep_hours: formData.sleepHours,
        study_hours: formData.studyHours,
        gym_completed: formData.gymCompleted,
        screen_time_hours: formData.screenTimeHours,
        mood: formData.mood,
        notes: formData.notes || null,
      };

      // Future: Replace with fetch('/api/logs', { method: 'POST', body: JSON.stringify(logData) })
      const { data: savedLog, error: logError } = await supabase
        .from("daily_logs")
        .upsert(logData, { onConflict: "user_id,log_date" })
        .select()
        .single();

      if (logError) throw logError;

      // Delete existing custom habits for this log
      await supabase
        .from("custom_habits")
        .delete()
        .eq("log_id", savedLog.id);

      // Insert new custom habits
      if (formData.customHabits.length > 0) {
        const habitsToInsert = formData.customHabits
          .filter(h => h.name.trim())
          .map(habit => ({
            user_id: user.id,
            log_id: savedLog.id,
            habit_name: habit.name,
            habit_value: habit.value || null,
          }));

        if (habitsToInsert.length > 0) {
          const { error: habitsError } = await supabase
            .from("custom_habits")
            .insert(habitsToInsert);

          if (habitsError) throw habitsError;
        }
      }

      toast({
        title: "Entry logged!",
        description: "Your daily habits have been saved successfully.",
      });

      // Refresh data
      await fetchTodayLog();
      await fetchLogs();
      
      return true;
    } catch (error: any) {
      console.error("Error saving log:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        title: "Failed to save entry",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
      fetchTodayLog();
    } else {
      setLoading(false);
    }
  }, [user, fetchLogs, fetchTodayLog]);

  return {
    logs,
    todayLog,
    customHabits,
    loading,
    error,
    saveLog,
    fetchLogs,
    fetchTodayLog,
  };
}
