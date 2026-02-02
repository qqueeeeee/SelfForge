import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Plus, Bell, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  dueTs?: number;
  reminderTs?: number;
  loggedToTimeline?: boolean;
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [reminder, setReminder] = useState("");
  const [pendingTask, setPendingTask] = useState<Task | null>(null);

  /* ---------- Load ---------- */
  useEffect(() => {
    const raw = localStorage.getItem("tasks");
    if (raw) setTasks(JSON.parse(raw));
  }, []);

  /* ---------- Save ---------- */
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!title.trim()) return;

    const task: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      dueTs: due ? toTs(due) : undefined,
      reminderTs: reminder ? toTs(reminder) : undefined,
    };

    setTasks((prev) => [...prev, task]);
    setTitle("");
    setDue("");
    setReminder("");
  };

  const toggle = (task: Task) => {
    if (task.completed) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: false } : t)),
      );
      return;
    }

    if (task.dueTs && !task.loggedToTimeline) {
      setPendingTask(task);
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: true } : t)),
    );
  };

  const confirmLog = () => {
    if (!pendingTask || !pendingTask.dueTs) return;

    addTimelineEvent(pendingTask.title, pendingTask.dueTs, Date.now());

    setTasks((prev) =>
      prev.map((t) =>
        t.id === pendingTask.id
          ? { ...t, completed: true, loggedToTimeline: true }
          : t,
      ),
    );

    setPendingTask(null);
  };

  const skipLog = () => {
    if (!pendingTask) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === pendingTask.id ? { ...t, completed: true } : t,
      ),
    );

    setPendingTask(null);
  };

  const remove = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (ts?: number) => {
    if (!ts) return false;
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">Things you intend to do</p>
      </div>

      {/* Add Task */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Task</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-4">
            <Label>Task</Label>
            <Input
              placeholder="Finish DSA sheet, Read 10 pages..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label>Due</Label>
            <Input
              type="datetime-local"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="dark:[color-scheme:dark]"
            />
          </div>

          <div>
            <Label>Reminder</Label>
            <Input
              type="datetime-local"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              className="dark:[color-scheme:dark]"
            />
          </div>

          <div className="sm:col-span-4">
            <Button onClick={addTask} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        </CardContent>
      </Card>

      <TaskSection
        title="Today"
        tasks={pending.filter((t) => isToday(t.dueTs))}
        toggle={toggle}
        remove={remove}
      />

      <TaskSection
        title="Upcoming"
        tasks={pending.filter((t) => !isToday(t.dueTs))}
        toggle={toggle}
        remove={remove}
      />

      {completed.length > 0 && (
        <TaskSection
          title="Completed"
          tasks={completed}
          toggle={toggle}
          remove={remove}
        />
      )}

      {/* Confirmation Modal */}
      <AlertDialog
        open={!!pendingTask}
        onOpenChange={() => setPendingTask(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log task to Timeline?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingTask?.title}" has a scheduled time. Do you want to record
              it in your Timeline?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={skipLog}>Skip</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLog}>Log</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------- Task Section ---------- */

function TaskSection({
  title,
  tasks,
  toggle,
  remove,
}: {
  title: string;
  tasks: Task[];
  toggle: (task: Task) => void;
  remove: (id: string) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={t.completed}
                onCheckedChange={() => toggle(t)}
              />

              <div>
                <p
                  className={
                    t.completed
                      ? "line-through text-muted-foreground"
                      : "font-medium"
                  }
                >
                  {t.title}
                </p>

                {(t.dueTs || t.reminderTs) && (
                  <p className="text-xs text-muted-foreground flex gap-2 items-center">
                    {t.dueTs && (
                      <span>Due {format(new Date(t.dueTs), "HH:mm")}</span>
                    )}
                    {t.reminderTs && <Bell className="h-3 w-3" />}
                    {t.loggedToTimeline && <span>Logged</span>}
                  </p>
                )}
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={() => remove(t.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ---------- Helpers ---------- */

function toTs(input: string) {
  return new Date(input).getTime();
}

function addTimelineEvent(title: string, startTs: number, endTs: number) {
  const d = new Date(startTs);
  const key = `timeline-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  const raw = localStorage.getItem(key);
  const events = raw ? JSON.parse(raw) : [];

  events.push({
    id: crypto.randomUUID(),
    title,
    startTs,
    endTs,
    source: "task",
  });

  localStorage.setItem(key, JSON.stringify(events));
}
