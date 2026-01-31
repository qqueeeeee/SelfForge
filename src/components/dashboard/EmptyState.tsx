import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Plus, TrendingUp, Target } from "lucide-react";

export function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Welcome to SelfForge!
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Start logging your daily habits to unlock powerful AI insights and track your progress over time.
        </p>
        
        <Link to="/log">
          <Button size="lg" className="gap-2 mb-8">
            <Plus className="h-5 w-5" />
            Log Your First Day
          </Button>
        </Link>
        
        <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
          <div className="p-4 rounded-lg bg-muted/30">
            <Target className="h-5 w-5 text-chart-1 mb-2" />
            <h3 className="font-medium text-sm mb-1">Track Habits</h3>
            <p className="text-xs text-muted-foreground">
              Log sleep, study, gym, mood and custom habits daily
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <TrendingUp className="h-5 w-5 text-chart-2 mb-2" />
            <h3 className="font-medium text-sm mb-1">See Patterns</h3>
            <p className="text-xs text-muted-foreground">
              Visualize trends and identify what works for you
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <Sparkles className="h-5 w-5 text-chart-3 mb-2" />
            <h3 className="font-medium text-sm mb-1">AI Insights</h3>
            <p className="text-xs text-muted-foreground">
              Get personalized advice based on your data
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
