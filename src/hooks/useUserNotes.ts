/**
 * User Notes Hook
 *
 * Manages user journal notes with Supabase integration.
 *
 * Future Backend Integration:
 * - Replace Supabase calls with custom API endpoints:
 *   - GET /api/notes?days=30 for fetching notes
 *   - POST /api/notes for creating notes
 *   - DELETE /api/notes/:id for deleting notes
 * - Add markdown rendering support
 * - Implement full-text search
 */

 export function useUserNotes() {
   return {
     notes: [],
     isLoading: false,
     addNote: async (_: any) => {},
   };
 }
// export interface UserNote {
//   id: string;
//   user_id: string;
//   title: string | null;
//   content: string;
//   note_date: string;
//   created_at: string;
//   updated_at: string;
// }

// // Error message mapping for user-friendly messages
// function getErrorMessage(error: any): string {
//   const message = error?.message || "An unexpected error occurred";

//   if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
//     return "Network error. Please check your internet connection.";
//   }

//   if (message.includes("permission denied") || message.includes("not authorized")) {
//     return "You don't have permission to perform this action.";
//   }

//   return message;
// }

// export function useUserNotes() {
//   const { user } = useAuth();
//   const { toast } = useToast();
//   const [notes, setNotes] = useState<UserNote[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchNotes = useCallback(async (days: number = 30) => {
//     if (!user) return;

//     setError(null);

//     try {
//       const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");

//       // Future: Replace with fetch('/api/notes?days=' + days)
//       const { data, error } = await supabase
//         .from("user_notes")
//         .select("*")
//         .eq("user_id", user.id)
//         .gte("note_date", startDate)
//         .order("note_date", { ascending: false });

//       if (error) throw error;
//       setNotes(data || []);
//     } catch (error: any) {
//       console.error("Error fetching notes:", error);
//       const errorMessage = getErrorMessage(error);
//       setError(errorMessage);
//       toast({
//         title: "Failed to load notes",
//         description: errorMessage,
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [user, toast]);

//   const saveNote = async (content: string, title?: string): Promise<boolean> => {
//     if (!user) {
//       toast({
//         title: "Not authenticated",
//         description: "Please sign in to save notes.",
//         variant: "destructive",
//       });
//       return false;
//     }

//     try {
//       const today = format(new Date(), "yyyy-MM-dd");

//       // Future: Replace with fetch('/api/notes', { method: 'POST', body: JSON.stringify({ content, title }) })
//       const { error } = await supabase
//         .from("user_notes")
//         .insert({
//           user_id: user.id,
//           title: title || null,
//           content,
//           note_date: today,
//         });

//       if (error) throw error;

//       toast({
//         title: "Note saved!",
//         description: "Your note has been saved successfully.",
//       });

//       await fetchNotes();
//       return true;
//     } catch (error: any) {
//       console.error("Error saving note:", error);
//       const errorMessage = getErrorMessage(error);
//       toast({
//         title: "Failed to save note",
//         description: errorMessage,
//         variant: "destructive",
//       });
//       return false;
//     }
//   };

//   const deleteNote = async (noteId: string): Promise<boolean> => {
//     if (!user) {
//       toast({
//         title: "Not authenticated",
//         description: "Please sign in to delete notes.",
//         variant: "destructive",
//       });
//       return false;
//     }

//     try {
//       // Future: Replace with fetch('/api/notes/' + noteId, { method: 'DELETE' })
//       const { error } = await supabase
//         .from("user_notes")
//         .delete()
//         .eq("id", noteId)
//         .eq("user_id", user.id);

//       if (error) throw error;

//       toast({
//         title: "Note deleted",
//         description: "Your note has been removed.",
//       });

//       await fetchNotes();
//       return true;
//     } catch (error: any) {
//       console.error("Error deleting note:", error);
//       const errorMessage = getErrorMessage(error);
//       toast({
//         title: "Failed to delete note",
//         description: errorMessage,
//         variant: "destructive",
//       });
//       return false;
//     }
//   };

//   useEffect(() => {
//     if (user) {
//       fetchNotes();
//     } else {
//       setLoading(false);
//     }
//   }, [user, fetchNotes]);

//   return {
//     notes,
//     loading,
//     error,
//     saveNote,
//     deleteNote,
//     fetchNotes,
//   };
// }
