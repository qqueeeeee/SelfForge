import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useGroqApiKey } from "@/hooks/useGroqApiKey";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useUserNotes } from "@/hooks/useUserNotes";
import {
  Save,
  Download,
  Moon,
  Sun,
  Database,
  LogOut,
  Loader2,
  FileJson,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Check,
} from "lucide-react";

/**
 * Settings Page
 *
 * Future Backend Integration:
 * - Store Groq API key in encrypted user metadata via /api/user/settings
 * - Add account deletion endpoint at /api/user/delete
 * - Implement data export via /api/user/export
 */
export default function Settings() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const user = { email: "local@user" };
  const signOut = async () => {};
  const { apiKey, setApiKey, clearApiKey, hasApiKey, maskedKey } =
    useGroqApiKey();
  const { logs, loading: logsLoading } = useDailyLogs();
  const { notes, loading: notesLoading } = useUserNotes();

  const [exporting, setExporting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [groqKeyInput, setGroqKeyInput] = useState("");
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  const handleSaveGroqKey = async () => {
    if (!groqKeyInput.trim()) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid Groq API key.",
        variant: "destructive",
      });
      return;
    }

    setSavingKey(true);

    // Simulate async operation for UX feedback
    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = setApiKey(groqKeyInput.trim());

    if (success) {
      toast({
        title: "API Key Saved",
        description: "Your Groq API key has been securely saved.",
      });
      setGroqKeyInput("");
    } else {
      toast({
        title: "Save Failed",
        description: "Failed to save API key. Please try again.",
        variant: "destructive",
      });
    }

    setSavingKey(false);
  };

  const handleClearGroqKey = () => {
    const success = clearApiKey();
    if (success) {
      toast({
        title: "API Key Removed",
        description: "Your Groq API key has been removed.",
      });
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Sign Out Failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSigningOut(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);

    try {
      const allData: Record<string, any> = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // Only export SelfForge-related keys
        if (
          key.startsWith("timeline-") ||
          key === "tasks" ||
          key === "timers" ||
          key === "groq-api-key"
        ) {
          try {
            allData[key] = JSON.parse(localStorage.getItem(key)!);
          } catch {
            allData[key] = localStorage.getItem(key);
          }
        }
      }

      const exportData = {
        app: "SelfForge",
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        data: allData,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `selfforge-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Backup created",
        description: "Full local backup downloaded",
      });
    } catch {
      toast({
        title: "Export failed",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };
  const handleExportCSV = async () => {
    setExporting(true);

    try {
      const headers = [
        "Date",
        "Sleep (hrs)",
        "Study (hrs)",
        "Gym",
        "Screen Time (hrs)",
        "Mood",
        "Notes",
      ];
      const rows = logs.map((log) => [
        log.log_date,
        log.sleep_hours || "",
        log.study_hours || "",
        log.gym_completed ? "Yes" : "No",
        log.screen_time_hours || "",
        log.mood || "",
        `"${(log.notes || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `selfforge-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Your logs have been downloaded as CSV.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description:
          "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const isDataLoading = logsLoading || notesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-4 w-4" />
            Account
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Member since</Label>
            <Input
              value={
                user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "—"
              }
              disabled
              className="bg-muted"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              {isDataLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {logs.length}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Total Logs</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              {isDataLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {notes.length}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Notes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Configure external API keys for enhanced features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groq-key">Groq API Key</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Optional: Add your Groq API key for custom AI model access.
              {/* Future: Replace with server-side key management */}
            </p>

            {hasApiKey ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-mono">
                      {showGroqKey ? apiKey : maskedKey}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    className="h-8 w-8"
                  >
                    {showGroqKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleClearGroqKey}
                  className="h-10 w-10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="groq-key"
                  type="password"
                  placeholder="gsk_..."
                  value={groqKeyInput}
                  onChange={(e) => setGroqKeyInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveGroqKey}
                  disabled={savingKey || !groqKeyInput.trim()}
                  className="gap-2"
                >
                  {savingKey ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Key
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {theme === "light" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            Appearance
          </CardTitle>
          <CardDescription>Customize how SelfForge looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use dark theme for reduced eye strain
              </p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-4 w-4" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export your data for backup or analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={exporting || isDataLoading}
              className="gap-2 flex-1"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4" />
              )}
              Backup Everything (JSON)
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={exporting || isDataLoading}
              className="gap-2 flex-1"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export Logs (CSV)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Backup creates a full local backup. Keep it safe — this app does not
            sync data yet. Export downloadsall your habits, logs, and notes.
            JSON includes everything, CSV is spreadsheet-ready.
          </p>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleSignOut}
            disabled={signingOut}
            className="gap-2"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {signingOut ? "Signing Out..." : "Sign Out"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
