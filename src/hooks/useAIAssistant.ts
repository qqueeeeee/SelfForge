import { useState, useCallback } from "react";
import { aiApi, analyticsApi } from "@/lib/api";
import { useCalendarEvents } from "./useCalendarEvents";
import { format, subDays } from "date-fns";

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  timestamp: Date;
  title: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context_used?: string[];
}

export interface AIInsight {
  type: "productivity" | "habit" | "goal" | "recommendation";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  actionable: boolean;
  data_source: string[];
}

export interface UseAIAssistantReturn {
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  isLoading: boolean;
  error: string | null;
  askQuestion: (question: string, includeContext?: string[]) => Promise<AIMessage>;
  startNewConversation: (title?: string) => AIConversation;
  switchConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  generateInsights: () => Promise<AIInsight[]>;
  askAboutTasks: (timeframe?: "today" | "week" | "month") => Promise<AIMessage>;
  askAboutGoals: () => Promise<AIMessage>;
  askAboutProductivity: (timeframe?: "week" | "month") => Promise<AIMessage>;
  clearConversations: () => void;
}

const STORAGE_KEY = "selfforge-ai-conversations";

export function useAIAssistant(): UseAIAssistantReturn {
  const [conversations, setConversations] = useState<AIConversation[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
    return [];
  });

  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(
    conversations.length > 0 ? conversations[0] : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { items, tasks, events } = useCalendarEvents();

  // Save conversations to localStorage
  const saveConversations = useCallback((convs: AIConversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
    } catch (error) {
      console.error("Failed to save conversations:", error);
    }
  }, []);

  // Generate contextual data summary
  const generateContextSummary = useCallback(
    (includeContext: string[] = ["tasks", "habits", "goals"]) => {
      const summary: string[] = [];
      const now = new Date();

      if (includeContext.includes("tasks")) {
        const todayTasks = tasks.filter(task =>
          format(task.startDateTime, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
        );
        const completedTasks = todayTasks.filter(task => task.completed);
        const overdueTasks = tasks.filter(task =>
          !task.completed && task.endDateTime < now
        );

        summary.push(`TASKS CONTEXT:`);
        summary.push(`- Today's tasks: ${todayTasks.length} (${completedTasks.length} completed)`);
        summary.push(`- Overdue tasks: ${overdueTasks.length}`);

        if (todayTasks.length > 0) {
          summary.push(`- Today's task list:`);
          todayTasks.forEach(task => {
            const status = task.completed ? "✓" : "○";
            summary.push(`  ${status} ${task.title} [${task.priority}]`);
          });
        }
      }

      if (includeContext.includes("events")) {
        const todayEvents = events.filter(event =>
          format(event.startDateTime, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
        );
        const upcomingEvents = events.filter(event =>
          event.startDateTime > now &&
          event.startDateTime < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        );

        summary.push(`\nEVENTS CONTEXT:`);
        summary.push(`- Today's events: ${todayEvents.length}`);
        summary.push(`- Upcoming events (7 days): ${upcomingEvents.length}`);
      }

      return summary.join("\n");
    },
    [tasks, events]
  );

  // Ask a question to the AI
  const askQuestion = useCallback(
    async (
      question: string,
      includeContext: string[] = ["tasks", "habits", "goals"]
    ): Promise<AIMessage> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await aiApi.ask({
          question,
          include_context: includeContext,
        });

        if (response.status !== 200 || !response.data) {
          throw new Error(response.error || "Failed to get AI response");
        }

        const userMessage: AIMessage = {
          id: `user_${Date.now()}`,
          role: "user",
          content: question,
          timestamp: new Date(),
        };

        const assistantMessage: AIMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: response.data.response,
          timestamp: new Date(response.data.timestamp),
          context_used: response.data.context_used,
        };

        // Add messages to current conversation or create new one
        let updatedConversation: AIConversation;

        if (currentConversation) {
          updatedConversation = {
            ...currentConversation,
            messages: [...currentConversation.messages, userMessage, assistantMessage],
          };
        } else {
          updatedConversation = {
            id: `conv_${Date.now()}`,
            title: question.length > 50 ? question.substring(0, 50) + "..." : question,
            messages: [userMessage, assistantMessage],
            timestamp: new Date(),
          };
        }

        // Update conversations list
        const updatedConversations = currentConversation
          ? conversations.map(conv =>
              conv.id === currentConversation.id ? updatedConversation : conv
            )
          : [updatedConversation, ...conversations];

        setConversations(updatedConversations);
        setCurrentConversation(updatedConversation);
        saveConversations(updatedConversations);

        return assistantMessage;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to ask AI";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [currentConversation, conversations, saveConversations]
  );

  // Start a new conversation
  const startNewConversation = useCallback(
    (title?: string): AIConversation => {
      const newConversation: AIConversation = {
        id: `conv_${Date.now()}`,
        title: title || "New Conversation",
        messages: [],
        timestamp: new Date(),
      };

      const updatedConversations = [newConversation, ...conversations];
      setConversations(updatedConversations);
      setCurrentConversation(newConversation);
      saveConversations(updatedConversations);

      return newConversation;
    },
    [conversations, saveConversations]
  );

  // Switch to a different conversation
  const switchConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
    }
  }, [conversations]);

  // Delete a conversation
  const deleteConversation = useCallback(
    (conversationId: string) => {
      const updatedConversations = conversations.filter(
        conv => conv.id !== conversationId
      );

      setConversations(updatedConversations);

      if (currentConversation?.id === conversationId) {
        setCurrentConversation(updatedConversations.length > 0 ? updatedConversations[0] : null);
      }

      saveConversations(updatedConversations);
    },
    [conversations, currentConversation, saveConversations]
  );

  // Generate AI insights about productivity patterns
  const generateInsights = useCallback(async (): Promise<AIInsight[]> => {
    try {
      const response = await askQuestion(
        "Analyze my productivity patterns and provide actionable insights. Focus on task completion rates, time management, goal progress, and habit consistency. Provide specific recommendations for improvement.",
        ["tasks", "habits", "goals", "analytics"]
      );

      // Parse the AI response to extract structured insights
      // This is a simplified version - in practice, you might want to use
      // more sophisticated NLP or ask the AI to return structured data
      const insights: AIInsight[] = [
        {
          type: "productivity",
          title: "Task Completion Analysis",
          description: "AI analysis of your task completion patterns",
          priority: "high",
          actionable: true,
          data_source: ["tasks", "analytics"],
        },
      ];

      return insights;
    } catch (error) {
      console.error("Failed to generate insights:", error);
      return [];
    }
  }, [askQuestion]);

  // Ask about tasks for a specific timeframe
  const askAboutTasks = useCallback(
    async (timeframe: "today" | "week" | "month" = "today"): Promise<AIMessage> => {
      const questions = {
        today: "How am I doing with my tasks today? What should I focus on next?",
        week: "Analyze my task completion for this week. What patterns do you see?",
        month: "Review my monthly task performance and suggest improvements.",
      };

      return askQuestion(questions[timeframe], ["tasks"]);
    },
    [askQuestion]
  );

  // Ask about goal progress
  const askAboutGoals = useCallback(async (): Promise<AIMessage> => {
    return askQuestion(
      "How am I progressing on my goals? Which ones need more attention?",
      ["goals"]
    );
  }, [askQuestion]);

  // Ask about productivity patterns
  const askAboutProductivity = useCallback(
    async (timeframe: "week" | "month" = "week"): Promise<AIMessage> => {
      const questions = {
        week: "Analyze my productivity patterns this week. What insights do you have?",
        month: "Give me a comprehensive productivity analysis for this month.",
      };

      return askQuestion(questions[timeframe], ["tasks", "habits", "analytics"]);
    },
    [askQuestion]
  );

  // Clear all conversations
  const clearConversations = useCallback(() => {
    setConversations([]);
    setCurrentConversation(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    conversations,
    currentConversation,
    isLoading,
    error,
    askQuestion,
    startNewConversation,
    switchConversation,
    deleteConversation,
    generateInsights,
    askAboutTasks,
    askAboutGoals,
    askAboutProductivity,
    clearConversations,
  };
}

// Hook for getting AI suggestions based on current context
export function useAISuggestions() {
  const { items, tasks } = useCalendarEvents();
  const { askQuestion } = useAIAssistant();

  const getSuggestions = useCallback(async () => {
    const now = new Date();
    const todayTasks = tasks.filter(task =>
      format(task.startDateTime, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
    );
    const incompleteTasks = todayTasks.filter(task => !task.completed);

    if (incompleteTasks.length === 0) {
      return "Great! You've completed all your tasks for today. Consider planning tomorrow's priorities.";
    }

    const question = `I have ${incompleteTasks.length} incomplete tasks today: ${incompleteTasks
      .map(task => `"${task.title}" (${task.priority} priority)`)
      .join(", ")}. What should I focus on next?`;

    try {
      const response = await askQuestion(question, ["tasks"]);
      return response.content;
    } catch (error) {
      return "Focus on your highest priority tasks first. Take breaks as needed.";
    }
  }, [tasks, askQuestion]);

  return { getSuggestions };
}
