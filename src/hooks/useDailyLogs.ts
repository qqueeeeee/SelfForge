import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import type { DailyLog, LogFormData } from "./types";

export interface DailyLog {
  id: string;
  log_date: string;
  sleep_hours: number | null;
  study_hours: number | null;
  gym_completed: boolean;
  screen_time_hours: number | null;
  mood: number | null;
  notes: string | null;
  created_at: string;
}

export interface CustomHabit {
  habit_name: string;
  habit_value: string | null;
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

export function useDailyLogs() {
  const { toast } = useToast();

  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (days = 30) => {
    setError(null);
    try {
      const data = await apiGet<DailyLog[]>(`/logs?days=${days}`);
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Failed to load logs",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveLog = async (formData: LogFormData): Promise<boolean> => {
    try {
      const payload = {
        sleep_hours: formData.sleepHours,
        study_hours: formData.studyHours,
        gym_completed: formData.gymCompleted,
        screen_time_hours: formData.screenTimeHours,
        mood: formData.mood,
        notes: formData.notes,
        custom_habits: formData.customHabits,
      };

      await apiPost("/logs", payload);

      toast({
        title: "Entry logged!",
        description: "Your daily habits were saved.",
      });

      await fetchLogs();
      return true;
    } catch (err: any) {
      toast({
        title: "Failed to save entry",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    saveLog,
    fetchLogs,
  };
}
