import { useState, useCallback } from "react";
import { CalendarTask, ItemCategory } from "@/components/calendar/types";
import { useCalendarEvents } from "./useCalendarEvents";
import { createTaskFromTimer } from "@/lib/calendar-utils";

export interface TimerSession {
  id: string;
  title: string;
  category: ItemCategory;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  isRunning: boolean;
  type: "pomodoro" | "deep-work" | "custom";
  autoCreateCalendarEntry: boolean;
}

interface UseTimerIntegrationReturn {
  activeSession: TimerSession | null;
  completedSessions: TimerSession[];
  startTimer: (config: {
    title: string;
    category: ItemCategory;
    duration: number;
    type?: "pomodoro" | "deep-work" | "custom";
    autoCreateCalendarEntry?: boolean;
  }) => Promise<TimerSession>;
  stopTimer: (createCalendarEntry?: boolean) => Promise<CalendarTask | null>;
  pauseTimer: () => void;
  resumeTimer: () => void;
  cancelTimer: () => void;
  getTimerHistory: (days?: number) => TimerSession[];
  getTotalFocusTime: (days?: number) => number;
}

export function useTimerIntegration(): UseTimerIntegrationReturn {
  const [activeSession, setActiveSession] = useState<TimerSession | null>(null);
  const [completedSessions, setCompletedSessions] = useState<TimerSession[]>([]);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [pausedDuration, setPausedDuration] = useState<number>(0);

  const { addTask } = useCalendarEvents();

  const startTimer = useCallback(
    async (config: {
      title: string;
      category: ItemCategory;
      duration: number;
      type?: "pomodoro" | "deep-work" | "custom";
      autoCreateCalendarEntry?: boolean;
    }): Promise<TimerSession> => {
      const now = new Date();
      const session: TimerSession = {
        id: crypto.randomUUID(),
        title: config.title,
        category: config.category,
        startTime: now,
        duration: config.duration,
        isRunning: true,
        type: config.type || "custom",
        autoCreateCalendarEntry: config.autoCreateCalendarEntry ?? true,
      };

      setActiveSession(session);
      setStartedAt(now);
      setPausedDuration(0);

      return session;
    },
    []
  );

  const stopTimer = useCallback(
    async (createCalendarEntry?: boolean): Promise<CalendarTask | null> => {
      if (!activeSession || !startedAt) return null;

      const endTime = new Date();
      const actualDuration = Math.floor(
        (endTime.getTime() - startedAt.getTime()) / (1000 * 60) - pausedDuration
      );

      const completedSession: TimerSession = {
        ...activeSession,
        endTime,
        duration: actualDuration,
        isRunning: false,
      };

      // Add to completed sessions
      setCompletedSessions(prev => [completedSession, ...prev]);

      // Create calendar task if enabled
      let calendarTask: CalendarTask | null = null;
      const shouldCreateEntry = createCalendarEntry ?? activeSession.autoCreateCalendarEntry;

      if (shouldCreateEntry && actualDuration > 0) {
        try {
          calendarTask = createTaskFromTimer({
            title: activeSession.title,
            category: activeSession.category,
            startTime: startedAt,
            endTime,
            duration: actualDuration,
          });

          await addTask(calendarTask);
        } catch (error) {
          console.error("Failed to create calendar task from timer:", error);
        }
      }

      // Clean up active session
      setActiveSession(null);
      setStartedAt(null);
      setPausedDuration(0);

      return calendarTask;
    },
    [activeSession, startedAt, pausedDuration, addTask]
  );

  const pauseTimer = useCallback(() => {
    if (!activeSession || !activeSession.isRunning) return;

    setActiveSession(prev => prev ? { ...prev, isRunning: false } : null);
  }, [activeSession]);

  const resumeTimer = useCallback(() => {
    if (!activeSession || activeSession.isRunning) return;

    // Calculate paused time and add to total paused duration
    if (startedAt) {
      const pauseTime = (new Date().getTime() - startedAt.getTime()) / (1000 * 60);
      const currentSessionTime = pauseTime - pausedDuration;

      // Update paused duration to exclude the time we were paused
      setPausedDuration(prev => prev + currentSessionTime);
    }

    setActiveSession(prev => prev ? { ...prev, isRunning: true } : null);
  }, [activeSession, startedAt, pausedDuration]);

  const cancelTimer = useCallback(() => {
    setActiveSession(null);
    setStartedAt(null);
    setPausedDuration(0);
  }, []);

  const getTimerHistory = useCallback(
    (days: number = 7): TimerSession[] => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return completedSessions.filter(
        session => session.endTime && session.endTime >= cutoffDate
      );
    },
    [completedSessions]
  );

  const getTotalFocusTime = useCallback(
    (days: number = 7): number => {
      const history = getTimerHistory(days);
      return history.reduce((total, session) => total + session.duration, 0);
    },
    [getTimerHistory]
  );

  return {
    activeSession,
    completedSessions,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    cancelTimer,
    getTimerHistory,
    getTotalFocusTime,
  };
}

// Helper hook for timer statistics
export function useTimerStats() {
  const { completedSessions } = useTimerIntegration();

  const getStats = useCallback(
    (days: number = 7) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentSessions = completedSessions.filter(
        session => session.endTime && session.endTime >= cutoffDate
      );

      const totalSessions = recentSessions.length;
      const totalMinutes = recentSessions.reduce(
        (sum, session) => sum + session.duration,
        0
      );

      const averageSessionLength = totalSessions > 0
        ? Math.round(totalMinutes / totalSessions)
        : 0;

      const categoryBreakdown = recentSessions.reduce(
        (acc, session) => {
          acc[session.category] = (acc[session.category] || 0) + session.duration;
          return acc;
        },
        {} as Record<ItemCategory, number>
      );

      const typeBreakdown = recentSessions.reduce(
        (acc, session) => {
          acc[session.type] = (acc[session.type] || 0) + session.duration;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalSessions,
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        averageSessionLength,
        categoryBreakdown,
        typeBreakdown,
        dailyAverage: Math.round(totalMinutes / days),
      };
    },
    [completedSessions]
  );

  return { getStats };
}
