import React, { useState } from "react";
import { Plus, Target, Calendar, TrendingUp, CheckCircle2, Circle, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format, addDays, differenceInDays } from "date-fns";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: "personal" | "career" | "health" | "learning" | "finance";
  priority: "low" | "medium" | "high";
  status: "not-started" | "in-progress" | "completed" | "paused";
  targetDate: Date;
  progress: number;
  milestones: Milestone[];
  createdAt: Date;
  updatedAt: Date;
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

const mockGoals: Goal[] = [
  {
    id: "1",
    title: "Launch Personal Productivity App",
    description: "Complete development and launch of SelfForge productivity application",
    category: "career",
    priority: "high",
    status: "in-progress",
    targetDate: addDays(new Date(), 30),
    progress: 75,
    milestones: [
      { id: "m1", title: "Complete calendar system", completed: true, completedAt: new Date() },
      { id: "m2", title: "Build analytics dashboard", completed: true, completedAt: new Date() },
      { id: "m3", title: "Implement goals tracking", completed: false },
      { id: "m4", title: "Deploy to production", completed: false },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "Learn TypeScript Mastery",
    description: "Become proficient in advanced TypeScript patterns and best practices",
    category: "learning",
    priority: "medium",
    status: "in-progress",
    targetDate: addDays(new Date(), 60),
    progress: 40,
    milestones: [
      { id: "m5", title: "Complete TypeScript fundamentals", completed: true, completedAt: new Date() },
      { id: "m6", title: "Learn advanced types", completed: false },
      { id: "m7", title: "Build complex project", completed: false },
      { id: "m8", title: "Contribute to open source", completed: false },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    title: "Establish Daily Exercise Routine",
    description: "Build a consistent workout habit for better health and energy",
    category: "health",
    priority: "high",
    status: "in-progress",
    targetDate: addDays(new Date(), 90),
    progress: 60,
    milestones: [
      { id: "m9", title: "Set up home gym space", completed: true, completedAt: new Date() },
      { id: "m10", title: "Complete first 30 days", completed: true, completedAt: new Date() },
      { id: "m11", title: "Achieve 60-day streak", completed: false },
      { id: "m12", title: "Complete 90-day challenge", completed: false },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [sortBy, setSortBy] = useState<"priority" | "dueDate" | "progress">("priority");

  const getCategoryColor = (category: Goal["category"]) => {
    switch (category) {
      case "personal":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "career":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "health":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "learning":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "finance":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: Goal["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: Goal["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in-progress":
        return "text-blue-600";
      case "paused":
        return "text-yellow-600";
      case "not-started":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getDaysUntilTarget = (targetDate: Date) => {
    const days = differenceInDays(targetDate, new Date());
    return days;
  };

  const filteredGoals = goals.filter((goal) => {
    if (filter === "active") return goal.status === "in-progress" || goal.status === "not-started";
    if (filter === "completed") return goal.status === "completed";
    return true;
  });

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    switch (sortBy) {
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case "dueDate":
        return differenceInDays(a.targetDate, new Date()) - differenceInDays(b.targetDate, new Date());
      case "progress":
        return b.progress - a.progress;
      default:
        return 0;
    }
  });

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        const updatedMilestones = goal.milestones.map(milestone => {
          if (milestone.id === milestoneId) {
            return {
              ...milestone,
              completed: !milestone.completed,
              completedAt: !milestone.completed ? new Date() : undefined,
            };
          }
          return milestone;
        });

        const completedCount = updatedMilestones.filter(m => m.completed).length;
        const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);

        return {
          ...goal,
          milestones: updatedMilestones,
          progress: newProgress,
          status: newProgress === 100 ? "completed" : "in-progress",
          updatedAt: new Date(),
        };
      }
      return goal;
    }));
  };

  const activeGoals = goals.filter(g => g.status === "in-progress" || g.status === "not-started");
  const completedGoals = goals.filter(g => g.status === "completed");
  const averageProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Goals & Projects</h1>
          <p className="text-muted-foreground">
            Track your long-term objectives and project milestones
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{activeGoals.length}</div>
                <div className="text-xs text-muted-foreground">Active Goals</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{completedGoals.length}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{averageProgress}%</div>
                <div className="text-xs text-muted-foreground">Avg Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">
                  {goals.filter(g => getDaysUntilTarget(g.targetDate) <= 7).length}
                </div>
                <div className="text-xs text-muted-foreground">Due This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({goals.length})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
          >
            Active ({activeGoals.length})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Completed ({completedGoals.length})
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Button
            variant={sortBy === "priority" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("priority")}
          >
            Priority
          </Button>
          <Button
            variant={sortBy === "dueDate" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("dueDate")}
          >
            Due Date
          </Button>
          <Button
            variant={sortBy === "progress" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("progress")}
          >
            Progress
          </Button>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {sortedGoals.map((goal) => {
          const daysUntilTarget = getDaysUntilTarget(goal.targetDate);
          const isOverdue = daysUntilTarget < 0;
          const isDueSoon = daysUntilTarget <= 7 && daysUntilTarget >= 0;

          return (
            <Card key={goal.id} className={cn("transition-all hover:shadow-md", {
              "ring-2 ring-red-200 dark:ring-red-800": isOverdue,
              "ring-2 ring-amber-200 dark:ring-amber-800": isDueSoon,
            })}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={getCategoryColor(goal.category)}>
                          {goal.category}
                        </Badge>
                        <Badge className={getPriorityColor(goal.priority)}>
                          {goal.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {goal.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn("text-sm font-medium", getStatusColor(goal.status))}>
                      {goal.status === "in-progress" && "In Progress"}
                      {goal.status === "completed" && "Completed"}
                      {goal.status === "not-started" && "Not Started"}
                      {goal.status === "paused" && "Paused"}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Goal</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete Goal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>

                  {/* Target Date */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Target Date</span>
                    <div className={cn("font-medium", {
                      "text-red-600": isOverdue,
                      "text-amber-600": isDueSoon,
                    })}>
                      {format(goal.targetDate, "MMM d, yyyy")}
                      {isOverdue && " (Overdue)"}
                      {isDueSoon && !isOverdue && ` (${daysUntilTarget}d left)`}
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">
                      Milestones ({goal.milestones.filter(m => m.completed).length}/{goal.milestones.length})
                    </div>
                    <div className="space-y-2">
                      {goal.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => toggleMilestone(goal.id, milestone.id)}
                          >
                            {milestone.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <span className={cn("text-sm flex-1", {
                            "line-through text-muted-foreground": milestone.completed,
                            "text-foreground": !milestone.completed,
                          })}>
                            {milestone.title}
                          </span>
                          {milestone.completed && milestone.completedAt && (
                            <span className="text-xs text-muted-foreground">
                              {format(milestone.completedAt, "MMM d")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sortedGoals.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No goals found
          </h3>
          <p className="text-muted-foreground mb-6">
            {filter === "completed"
              ? "You haven't completed any goals yet."
              : filter === "active"
              ? "You don't have any active goals."
              : "Start tracking your long-term objectives and projects."
            }
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Goal
          </Button>
        </div>
      )}
    </div>
  );
}
