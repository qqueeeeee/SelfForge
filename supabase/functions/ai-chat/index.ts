import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RAGContext {
  logsSummary: string;
  notesContext: string;
  stats: {
    avgSleep: number;
    avgMood: number;
    gymDays: number;
    totalDays: number;
  };
}

async function buildRAGContext(supabase: any, userId: string): Promise<RAGContext> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];

  // Fetch logs
  const { data: logs, error: logsError } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .order("log_date", { ascending: false });

  if (logsError) {
    console.error("Error fetching logs for RAG:", logsError);
  }

  // Fetch notes
  const { data: notes, error: notesError } = await supabase
    .from("user_notes")
    .select("*")
    .eq("user_id", userId)
    .gte("note_date", startDate)
    .order("note_date", { ascending: false })
    .limit(10);

  if (notesError) {
    console.error("Error fetching notes for RAG:", notesError);
  }

  // Calculate stats
  const validLogs = logs || [];
  const totalDays = validLogs.length;
  
  const avgSleep = totalDays > 0 
    ? validLogs.reduce((sum: number, log: any) => sum + (log.sleep_hours || 0), 0) / totalDays 
    : 0;
  
  const avgMood = totalDays > 0 
    ? validLogs.reduce((sum: number, log: any) => sum + (log.mood || 0), 0) / totalDays 
    : 0;
  
  const gymDays = validLogs.filter((log: any) => log.gym_completed).length;

  // Build logs summary
  const logsSummary = validLogs.length > 0
    ? validLogs.slice(0, 14).map((log: any) => {
        const parts = [
          `Date: ${log.log_date}`,
          log.sleep_hours !== null ? `Sleep: ${log.sleep_hours}h` : null,
          log.study_hours !== null ? `Study: ${log.study_hours}h` : null,
          `Gym: ${log.gym_completed ? 'Yes' : 'No'}`,
          log.screen_time_hours !== null ? `Screen: ${log.screen_time_hours}h` : null,
          log.mood !== null ? `Mood: ${log.mood}/10` : null,
          log.notes ? `Notes: "${log.notes.slice(0, 100)}${log.notes.length > 100 ? '...' : ''}"` : null,
        ].filter(Boolean);
        return parts.join(', ');
      }).join('\n')
    : "No habit logs recorded yet.";

  // Build notes context
  const notesContext = (notes || []).length > 0
    ? (notes || []).map((note: any) => {
        const title = note.title ? `[${note.title}] ` : '';
        return `${note.note_date}: ${title}${note.content.slice(0, 200)}${note.content.length > 200 ? '...' : ''}`;
      }).join('\n')
    : "No personal notes recorded yet.";

  return {
    logsSummary,
    notesContext,
    stats: {
      avgSleep: Math.round(avgSleep * 10) / 10,
      avgMood: Math.round(avgMood * 10) / 10,
      gymDays,
      totalDays,
    },
  };
}

function buildSystemPrompt(context: RAGContext): string {
  return `You are SelfForge AI, a personal productivity coach and habit analyst. You help users understand their patterns, identify areas for improvement, and provide actionable advice.

## User's Recent Activity (Last 30 Days)
- Total days logged: ${context.stats.totalDays}
- Average sleep: ${context.stats.avgSleep} hours
- Average mood: ${context.stats.avgMood}/10
- Gym/workout days: ${context.stats.gymDays}

## Recent Habit Logs:
${context.logsSummary}

## Recent Personal Notes:
${context.notesContext}

## Your Role:
1. Analyze patterns in the user's data
2. Provide specific, actionable advice based on their actual habits
3. Be encouraging but honest about areas needing improvement
4. Reference specific data points when making observations
5. Keep responses focused and practical
6. If there's no data yet, encourage the user to start logging their habits

Be direct, supportive, and data-driven. Use markdown formatting for clarity.`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header is required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Building RAG context for user:", user.id);
    
    // Build RAG context from user's data
    const ragContext = await buildRAGContext(supabase, user.id);
    const systemPrompt = buildSystemPrompt(ragContext);

    console.log("RAG context stats:", ragContext.stats);

    // Build messages array
    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message }
    ];

    // Call AI Gateway
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Calling Lovable AI Gateway...");
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    console.log("AI response received successfully");

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        ragStats: ragContext.stats
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in ai-chat function:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
