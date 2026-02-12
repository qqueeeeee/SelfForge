import { useState, useEffect, useCallback } from "react";

const GROQ_API_KEY_STORAGE_KEY = "selfforge-groq-api-key";

/**
 * useGroqApiKey: Manages Groq API key storage in localStorage.
 * 
 * Security Note: For production, consider storing in Supabase user metadata
 * or a secure backend endpoint instead of localStorage.
 * 
 * Future Backend Integration:
 * - Store API key in encrypted user metadata via /api/user/settings
 * - Validate key server-side before saving
 * - Use edge function to proxy Groq requests (never expose key to client)
 */
export function useGroqApiKey() {
  const [apiKey, setApiKeyState] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GROQ_API_KEY_STORAGE_KEY);
      if (stored) {
        setApiKeyState(stored);
      }
    } catch (error) {
      console.error("Failed to load Groq API key from storage:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  const setApiKey = useCallback((key: string) => {
    try {
      if (key) {
        localStorage.setItem(GROQ_API_KEY_STORAGE_KEY, key);
      } else {
        localStorage.removeItem(GROQ_API_KEY_STORAGE_KEY);
      }
      setApiKeyState(key);
      return true;
    } catch (error) {
      console.error("Failed to save Groq API key:", error);
      return false;
    }
  }, []);

  // Clear API key
  const clearApiKey = useCallback(() => {
    try {
      localStorage.removeItem(GROQ_API_KEY_STORAGE_KEY);
      setApiKeyState("");
      return true;
    } catch (error) {
      console.error("Failed to clear Groq API key:", error);
      return false;
    }
  }, []);

  // Check if key is set
  const hasApiKey = Boolean(apiKey);

  // Mask key for display (show last 4 chars)
  const maskedKey = apiKey 
    ? `${"•".repeat(Math.max(0, apiKey.length - 4))}${apiKey.slice(-4)}`
    : "";

  return {
    apiKey,
    setApiKey,
    clearApiKey,
    hasApiKey,
    maskedKey,
    isLoaded,
  };
}
