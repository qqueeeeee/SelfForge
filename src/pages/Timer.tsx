import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/*
  Timer:
  - Always HH:MM:SS.ms
  - Editable label
  - Per-label daily history
  - Frontend only
*/

type HistoryMap = Record<string, number>;

export default function Timer() {
  const [label, setLabel] = useState("Deep Work");
  const [isRunning, setIsRunning] = useState(false);

  const [startTs, setStartTs] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [history, setHistory] = useState<HistoryMap>({});

  const rafRef = useRef<number | null>(null);

  // ---------- Load history ----------
  useEffect(() => {
    const saved = localStorage.getItem(historyKey());
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // ---------- Timer loop ----------
  useEffect(() => {
    if (!isRunning || startTs === null) return;

    const tick = () => {
      setElapsedMs(Date.now() - startTs);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning, startTs]);

  const start = () => {
    if (isRunning) return;
    setElapsedMs(0);
    setStartTs(Date.now());
    setIsRunning(true);
  };

  const stop = () => {
    if (!isRunning || startTs === null) return;

    const duration = Date.now() - startTs;

    const updated: HistoryMap = {
      ...history,
      [label]: (history[label] || 0) + duration,
    };

    setHistory(updated);
    localStorage.setItem(historyKey(), JSON.stringify(updated));

    setElapsedMs(0);
    setStartTs(null);
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* TIMER */}
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-center text-xl">Timer</CardTitle>

          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="text-center font-medium"
            placeholder="Session name"
          />
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center font-mono text-4xl tracking-wider">
            {formatMs(elapsedMs)}
          </div>

          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              variant={isRunning ? "destructive" : "default"}
              onClick={isRunning ? stop : start}
            >
              {isRunning ? "Stop" : "Start"}
            </Button>
          </div>

          <div
            className={cn(
              "text-center text-xs",
              isRunning ? "text-success" : "text-muted-foreground",
            )}
          >
            {isRunning ? `Tracking: ${label}` : "No active session"}
          </div>
        </CardContent>
      </Card>

      {/* HISTORY */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">History (Today)</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          {Object.keys(history).length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              No sessions logged today.
            </p>
          )}

          {Object.entries(history).map(([name, ms]) => (
            <div
              key={name}
              className="flex items-center justify-between text-sm"
            >
              <span className="font-medium">{name}</span>
              <span className="font-mono text-muted-foreground">
                {formatMs(ms)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Helpers ---------- */

function historyKey() {
  const d = new Date();
  return `timer-history-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function formatMs(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor(ms % 1000);

  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${Math.floor(
    milliseconds / 10,
  )
    .toString()
    .padStart(2, "0")}`;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
