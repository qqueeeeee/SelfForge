import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";

type TimelineEvent = {
  id: string;
  label: string;
  startTs: number;
  endTs: number;
  source: "manual" | "timer";
};

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [label, setLabel] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // ---------- Load events ----------
  useEffect(() => {
    const raw = localStorage.getItem(dayKey(selectedDate));
    setEvents(raw ? JSON.parse(raw) : []);
  }, [selectedDate]);

  // ---------- Save events ----------
  useEffect(() => {
    localStorage.setItem(dayKey(selectedDate), JSON.stringify(events));
  }, [events, selectedDate]);

  const addEvent = () => {
    if (!label || !start || !end) return;

    const startTs = timeToTs(start);
    const endTs = timeToTs(end);

    if (endTs <= startTs) return;

    const event: TimelineEvent = {
      id: crypto.randomUUID(),
      label,
      startTs,
      endTs,
      source: "manual",
    };

    setEvents((prev) => [...prev, event].sort((a, b) => a.startTs - b.startTs));

    setLabel("");
    setStart("");
    setEnd("");
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Timeline</h1>
        <p className="text-muted-foreground">
          {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() =>
            setSelectedDate((d) => new Date(d.getTime() - 86400000))
          }
        >
          ←
        </Button>

        <Input
          type="date"
          value={format(selectedDate, "yyyy-MM-dd")}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split("-").map(Number);
            const newDate = new Date(y, m - 1, d);
            newDate.setHours(0, 0, 0, 0);
            setSelectedDate(newDate);
          }}
          className="w-auto bg-background text-foreground dark:[color-scheme:dark]"
        />

        <Button
          variant="ghost"
          onClick={() =>
            setSelectedDate((d) => new Date(d.getTime() + 86400000))
          }
        >
          →
        </Button>
      </div>

      {/* Add Event */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Event</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Label>What</Label>
            <Input
              placeholder="Deep Work, Reading, Break..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div>
            <Label>Start</Label>
            <Input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-auto bg-background text-foreground dark:[color-scheme:dark]"
            />
          </div>
          <div>
            <Label>End</Label>
            <Input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-auto bg-background text-foreground dark:[color-scheme:dark]"
            />
          </div>

          <div className="sm:col-span-4">
            <Button onClick={addEvent} className="gap-2">
              <Plus className="h-4 w-4" />
              Add to Timeline
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              No events logged yet.
            </p>
          )}

          {events.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50"
            >
              <div>
                <p className="font-medium">{e.label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTs(e.startTs)} – {formatTs(e.endTs)} ·{" "}
                  {formatDuration(e.endTs - e.startTs)}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeEvent(e.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Helpers ---------- */
function dayKey(date: Date) {
  return `timeline-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function timeToTs(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function formatTs(ts: number) {
  return format(new Date(ts), "HH:mm");
}

function formatDuration(ms: number) {
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
