import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

export interface RAGContext {
  logsSummary: string;
  notesContext: string;
  stats: {
    avgSleep: number;
    avgMood: number;
    gymDays: number;
    totalDays: number;
  };
}

export async function buildRagContext() {
  return "";
}

// export async function buildRAGContext(userId: string, days: number = 30): Promise<RAGContext> {
//   const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");

//   // Fetch logs
//   const { data: logs, error: logsError } = await supabase
//     .from("daily_logs")
//     .select("*")
//     .eq("user_id", userId)
//     .gte("log_date", startDate)
//     .order("log_date", { ascending: false });

//   if (logsError) {
//     console.error("Error fetching logs for RAG:", logsError);
//   }

//   // Fetch notes
//   const { data: notes, error: notesError } = await supabase
//     .from("user_notes")
//     .select("*")
//     .eq("user_id", userId)
//     .gte("note_date", startDate)
//     .order("note_date", { ascending: false })
//     .limit(10);

//   if (notesError) {
//     console.error("Error fetching notes for RAG:", notesError);
//   }

//   // Calculate stats
//   const validLogs = logs || [];
//   const totalDays = validLogs.length;

//   const avgSleep = totalDays > 0
//     ? validLogs.reduce((sum, log) => sum + (log.sleep_hours || 0), 0) / totalDays
//     : 0;

//   const avgMood = totalDays > 0
//     ? validLogs.reduce((sum, log) => sum + (log.mood || 0), 0) / totalDays
//     : 0;

//   const gymDays = validLogs.filter(log => log.gym_completed).length;

//   // Build logs summary
//   const logsSummary = validLogs.length > 0
//     ? validLogs.slice(0, 14).map(log => {
//         const parts = [
//           `Date: ${log.log_date}`,
//           log.sleep_hours !== null ? `Sleep: ${log.sleep_hours}h` : null,
//           log.study_hours !== null ? `Study: ${log.study_hours}h` : null,
//           `Gym: ${log.gym_completed ? 'Yes' : 'No'}`,
//           log.screen_time_hours !== null ? `Screen: ${log.screen_time_hours}h` : null,
//           log.mood !== null ? `Mood: ${log.mood}/10` : null,
//           log.notes ? `Notes: "${log.notes.slice(0, 100)}${log.notes.length > 100 ? '...' : ''}"` : null,
//         ].filter(Boolean);
//         return parts.join(', ');
//       }).join('\n')
//     : "No habit logs recorded yet.";

//   // Build notes context
//   const notesContext = (notes || []).length > 0
//     ? (notes || []).map(note => {
//         const title = note.title ? `[${note.title}] ` : '';
//         return `${note.note_date}: ${title}${note.content.slice(0, 200)}${note.content.length > 200 ? '...' : ''}`;
//       }).join('\n')
//     : "No personal notes recorded yet.";

//   return {
//     logsSummary,
//     notesContext,
//     stats: {
//       avgSleep: Math.round(avgSleep * 10) / 10,
//       avgMood: Math.round(avgMood * 10) / 10,
//       gymDays,
//       totalDays,
//     },
//   };
// }

// export function buildSystemPrompt(context: RAGContext): string {
//   return `You are SelfForge AI, a personal productivity coach and habit analyst. You help users understand their patterns, identify areas for improvement, and provide actionable advice.

// ## User's Recent Activity (Last 30 Days)
// - Total days logged: ${context.stats.totalDays}
// - Average sleep: ${context.stats.avgSleep} hours
// - Average mood: ${context.stats.avgMood}/10
// - Gym/workout days: ${context.stats.gymDays}

// ## Recent Habit Logs:
// ${context.logsSummary}

// ## Recent Personal Notes:
// ${context.notesContext}

// ## Your Role:
// 1. Analyze patterns in the user's data
// 2. Provide specific, actionable advice based on their actual habits
// 3. Be encouraging but honest about areas needing improvement
// 4. Reference specific data points when making observations
// 5. Keep responses focused and practical

// Be direct, supportive, and data-driven. Use markdown formatting for clarity.`;
// }
