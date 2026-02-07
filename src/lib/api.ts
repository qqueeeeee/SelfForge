// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface CalendarItemRequest {
  id?: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  category: "deep-work" | "work" | "personal" | "meeting" | "custom";
  is_all_day?: boolean;
  item_type: "task" | "event";
  // Task-specific fields
  priority?: "low" | "medium" | "high";
  estimated_duration?: number;
  // Event-specific fields
  location?: string;
  attendees?: string[];
}

export interface CalendarItemResponse extends CalendarItemRequest {
  id: string;
  created_at: string;
  updated_at: string;
  // Task-specific fields
  completed?: boolean;
  completed_at?: string;
  actual_duration?: number;
  // Event-specific fields
}

export interface GoalRequest {
  id?: string;
  title: string;
  description?: string;
  category: "personal" | "career" | "health" | "learning" | "finance";
  priority: "low" | "medium" | "high";
  target_date: string;
  milestones?: MilestoneRequest[];
}

export interface MilestoneRequest {
  id?: string;
  title: string;
  completed?: boolean;
}

export interface GoalResponse extends GoalRequest {
  id: string;
  status: string;
  progress: number;
  milestones: MilestoneResponse[];
  created_at: string;
  updated_at: string;
}

export interface MilestoneResponse extends MilestoneRequest {
  id: string;
  goal_id: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TimerSessionRequest {
  id?: string;
  title: string;
  category: string;
  session_type: "pomodoro" | "deep-work" | "custom";
  duration: number;
  start_time: string;
}

export interface TimerSessionResponse extends TimerSessionRequest {
  id: string;
  end_time?: string;
  completed: boolean;
  created_calendar_entry: boolean;
  calendar_item_id?: string;
  created_at: string;
}

export interface DailyLogRequest {
  log_date: string;
  sleep_hours?: number;
  study_hours?: number;
  screen_time_hours?: number;
  gym_completed?: boolean;
  mood?: number;
  notes?: string;
}

export interface DailyLogResponse extends DailyLogRequest {
  id: number;
  tasks_completed: number;
  events_attended: number;
  focus_time_minutes: number;
  deep_work_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesResponse {
  id: number;
  user_id: string;
  default_calendar_view: string;
  work_start_hour: number;
  work_end_hour: number;
  preferred_break_duration: number;
  default_pomodoro_duration: number;
  default_break_duration: number;
  auto_create_calendar_entries: boolean;
  ai_insights_enabled: boolean;
  ai_suggestions_frequency: string;
  task_reminders: boolean;
  goal_deadline_alerts: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductivityStatsResponse {
  total_tasks: number;
  completed_tasks: number;
  total_events: number;
  total_focus_time_minutes: number;
  total_deep_work_minutes: number;
  completion_rate: number;
  category_breakdown: Record<string, number>;
  daily_averages: Record<string, number>;
}

export interface AskRequest {
  question: string;
  include_context?: string[];
}

export interface AskResponse {
  response: string;
  context_used: string[];
  timestamp: string;
}

// Core API functions
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    await ensureBackendReady();

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = response.ok ? await response.json() : null;

    return {
      data,
      status: response.status,
      error: response.ok ? undefined : `API Error: ${response.status}`,
    };
  } catch (error) {
    return {
      status: 0,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, { method: "GET" });
}

export async function apiPost<T>(
  endpoint: string,
  body: any,
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPut<T>(
  endpoint: string,
  body: any,
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiDelete(endpoint: string): Promise<ApiResponse<any>> {
  return makeRequest(endpoint, { method: "DELETE" });
}

// Backend health check
let backendReadyPromise: Promise<void> | null = null;

async function waitForBackendOnce(timeoutMs = 10000): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) return;
    } catch {
      // Backend not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error("Backend not ready");
}

function ensureBackendReady(): Promise<void> {
  if (!backendReadyPromise) {
    backendReadyPromise = waitForBackendOnce();
  }
  return backendReadyPromise;
}

// Calendar API
export const calendarApi = {
  // Get calendar items with optional filtering
  async getItems(params?: {
    start_date?: string;
    end_date?: string;
    item_type?: "task" | "event";
    category?: string;
    completed?: boolean;
  }): Promise<ApiResponse<CalendarItemResponse[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return apiGet<CalendarItemResponse[]>(
      `/calendar/items${queryString ? `?${queryString}` : ""}`,
    );
  },

  // Get specific calendar item
  async getItem(id: string): Promise<ApiResponse<CalendarItemResponse>> {
    return apiGet<CalendarItemResponse>(`/calendar/items/${id}`);
  },

  // Create new calendar item
  async createItem(
    item: CalendarItemRequest,
  ): Promise<ApiResponse<CalendarItemResponse>> {
    return apiPost<CalendarItemResponse>("/calendar/items", item);
  },

  // Update calendar item
  async updateItem(
    id: string,
    updates: Partial<CalendarItemRequest>,
  ): Promise<ApiResponse<CalendarItemResponse>> {
    return apiPut<CalendarItemResponse>(`/calendar/items/${id}`, updates);
  },

  // Delete calendar item
  async deleteItem(id: string): Promise<ApiResponse<any>> {
    return apiDelete(`/calendar/items/${id}`);
  },

  // Create multiple items in batch
  async createBatch(
    items: CalendarItemRequest[],
  ): Promise<ApiResponse<{ created: CalendarItemResponse[]; errors: any[] }>> {
    return apiPost("/calendar/items/batch", { items });
  },
};

// Goals API
export const goalsApi = {
  // Get all goals
  async getGoals(params?: {
    status?: string;
    category?: string;
  }): Promise<ApiResponse<GoalResponse[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      });
    }
    const queryString = searchParams.toString();
    return apiGet<GoalResponse[]>(
      `/goals${queryString ? `?${queryString}` : ""}`,
    );
  },

  // Get specific goal
  async getGoal(id: string): Promise<ApiResponse<GoalResponse>> {
    return apiGet<GoalResponse>(`/goals/${id}`);
  },

  // Create new goal
  async createGoal(goal: GoalRequest): Promise<ApiResponse<GoalResponse>> {
    return apiPost<GoalResponse>("/goals", goal);
  },

  // Update goal
  async updateGoal(
    id: string,
    updates: Partial<GoalRequest>,
  ): Promise<ApiResponse<GoalResponse>> {
    return apiPut<GoalResponse>(`/goals/${id}`, updates);
  },

  // Update milestone
  async updateMilestone(
    goalId: string,
    milestoneId: string,
    updates: Partial<MilestoneRequest>,
  ): Promise<ApiResponse<any>> {
    return apiPut(`/goals/${goalId}/milestones/${milestoneId}`, updates);
  },
};

// Timer API
export const timerApi = {
  // Get timer sessions
  async getSessions(params?: {
    start_date?: string;
    end_date?: string;
    completed?: boolean;
  }): Promise<ApiResponse<TimerSessionResponse[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return apiGet<TimerSessionResponse[]>(
      `/timer/sessions${queryString ? `?${queryString}` : ""}`,
    );
  },

  // Create timer session
  async createSession(
    session: TimerSessionRequest,
  ): Promise<ApiResponse<TimerSessionResponse>> {
    return apiPost<TimerSessionResponse>("/timer/sessions", session);
  },

  // Update timer session
  async updateSession(
    id: string,
    updates: Partial<
      TimerSessionRequest & {
        end_time?: string;
        completed?: boolean;
        created_calendar_entry?: boolean;
      }
    >,
  ): Promise<ApiResponse<TimerSessionResponse>> {
    return apiPut<TimerSessionResponse>(`/timer/sessions/${id}`, updates);
  },
};

// Daily Logs API
export const dailyLogsApi = {
  // Get daily logs
  async getLogs(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<DailyLogResponse[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      });
    }
    const queryString = searchParams.toString();
    return apiGet<DailyLogResponse[]>(
      `/logs/daily${queryString ? `?${queryString}` : ""}`,
    );
  },

  // Create daily log
  async createLog(
    log: DailyLogRequest,
  ): Promise<ApiResponse<DailyLogResponse>> {
    return apiPost<DailyLogResponse>("/logs/daily", log);
  },

  // Update daily log
  async updateLog(
    id: number,
    updates: Partial<DailyLogRequest>,
  ): Promise<ApiResponse<DailyLogResponse>> {
    return apiPut<DailyLogResponse>(`/logs/daily/${id}`, updates);
  },
};

// User Preferences API
export const preferencesApi = {
  // Get user preferences
  async getPreferences(): Promise<ApiResponse<UserPreferencesResponse>> {
    return apiGet<UserPreferencesResponse>("/preferences");
  },

  // Update user preferences
  async updatePreferences(
    updates: Partial<UserPreferencesResponse>,
  ): Promise<ApiResponse<UserPreferencesResponse>> {
    return apiPut<UserPreferencesResponse>("/preferences", updates);
  },
};

// Analytics API
export const analyticsApi = {
  // Get productivity statistics
  async getProductivityStats(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<ProductivityStatsResponse>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      });
    }
    const queryString = searchParams.toString();
    return apiGet<ProductivityStatsResponse>(
      `/analytics/productivity${queryString ? `?${queryString}` : ""}`,
    );
  },
};

// AI Chat API
export const aiApi = {
  // Ask AI assistant
  async ask(request: AskRequest): Promise<ApiResponse<AskResponse>> {
    return apiPost<AskResponse>("/ask", request);
  },
};

// Legacy API (for backward compatibility)
export const legacyApi = {
  // Get legacy habit logs
  async getLogs(days = 30): Promise<ApiResponse<any[]>> {
    return apiGet<any[]>(`/logs?days=${days}`);
  },

  // Create legacy habit log
  async createLog(log: {
    habit: string;
    value: any;
    timestamp?: string;
  }): Promise<ApiResponse<{ id: number }>> {
    return apiPost<{ id: number }>("/logs", log);
  },
};

// Health check
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await apiGet<{ status: string; version?: string }>(
      "/health",
    );
    return response.status === 200 && response.data?.status === "ok";
  } catch {
    return false;
  }
}

// Utility functions for data transformation
export function transformCalendarItemToFrontend(
  item: CalendarItemResponse,
): any {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    startDateTime: new Date(item.start_datetime),
    endDateTime: new Date(item.end_datetime),
    category: item.category,
    isAllDay: item.is_all_day,
    type: item.item_type,
    completed: item.completed,
    completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
    priority: item.priority,
    estimatedDuration: item.estimated_duration,
    actualDuration: item.actual_duration,
    location: item.location,
    attendees: item.attendees,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  };
}

export function transformCalendarItemFromFrontend(
  item: any,
): CalendarItemRequest {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    start_datetime: item.startDateTime.toISOString(),
    end_datetime: item.endDateTime.toISOString(),
    category: item.category,
    is_all_day: item.isAllDay,
    item_type: item.type,
    priority: item.priority,
    estimated_duration: item.estimatedDuration,
    location: item.location,
    attendees: item.attendees,
  };
}

export function transformGoalToFrontend(goal: GoalResponse): any {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    priority: goal.priority,
    status: goal.status,
    targetDate: new Date(goal.target_date),
    progress: goal.progress,
    milestones: goal.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      completed: m.completed,
      completedAt: m.completed_at ? new Date(m.completed_at) : undefined,
    })),
    createdAt: new Date(goal.created_at),
    updatedAt: new Date(goal.updated_at),
  };
}

export function transformGoalFromFrontend(goal: any): GoalRequest {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    priority: goal.priority,
    target_date: goal.targetDate.toISOString(),
    milestones: goal.milestones?.map((m: any) => ({
      id: m.id,
      title: m.title,
      completed: m.completed,
    })),
  };
}

// Export default api object for backward compatibility
export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  calendar: calendarApi,
  goals: goalsApi,
  timer: timerApi,
  dailyLogs: dailyLogsApi,
  preferences: preferencesApi,
  analytics: analyticsApi,
  ai: aiApi,
  legacy: legacyApi,
  health: checkBackendHealth,
};
