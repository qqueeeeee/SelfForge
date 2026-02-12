import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  clearCorruptedCalendarData,
  loadItemsFromStorage,
  getCategoryConfig,
  ITEM_CATEGORIES
} from "@/lib/calendar-utils";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { AlertTriangle, RefreshCw, Database, CheckCircle } from "lucide-react";

export function CalendarDebug() {
  const { toast } = useToast();
  const { items, refreshItems } = useCalendarEvents();
  const [isLoading, setIsLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{
    totalItems: number;
    invalidCategories: string[];
    corruptedItems: number;
  } | null>(null);

  const runDiagnostics = () => {
    try {
      const storageItems = loadItemsFromStorage();
      const validCategories = Object.keys(ITEM_CATEGORIES);
      const invalidCategories: string[] = [];
      let corruptedItems = 0;

      storageItems.forEach(item => {
        if (!item.category || !validCategories.includes(item.category)) {
          if (item.category && !invalidCategories.includes(item.category)) {
            invalidCategories.push(item.category);
          }
          corruptedItems++;
        }
      });

      setDiagnostics({
        totalItems: storageItems.length,
        invalidCategories,
        corruptedItems
      });

      toast({
        title: "Diagnostics Complete",
        description: `Found ${corruptedItems} items with invalid categories`,
        variant: corruptedItems > 0 ? "destructive" : "default"
      });
    } catch (error) {
      toast({
        title: "Diagnostics Failed",
        description: "Unable to analyze calendar data",
        variant: "destructive"
      });
    }
  };

  const clearCorruptedData = async () => {
    setIsLoading(true);
    try {
      clearCorruptedCalendarData();
      await refreshItems();

      toast({
        title: "Data Cleared Successfully",
        description: "Corrupted calendar data has been cleared and reinitialized",
        variant: "default"
      });

      // Re-run diagnostics
      setTimeout(runDiagnostics, 500);
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear corrupted data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testCategoryConfigs = () => {
    const testCategories = ['deep-work', 'work', 'personal', 'meeting', 'custom', 'invalid-category', null, undefined];

    testCategories.forEach(category => {
      try {
        const config = getCategoryConfig(category as string);
        console.log(`Category "${category}":`, config);
      } catch (error) {
        console.error(`Failed to get config for category "${category}":`, error);
      }
    });

    toast({
      title: "Category Config Test Complete",
      description: "Check browser console for results",
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Calendar Debug Utility
        </CardTitle>
        <CardDescription>
          Diagnose and fix calendar data issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">{items.length}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">
              {items.filter(item => item.type === 'event').length}
            </div>
            <div className="text-sm text-muted-foreground">Events</div>
          </div>
        </div>

        {/* Diagnostics Results */}
        {diagnostics && (
          <div className="p-4 border rounded-lg bg-muted/30">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              {diagnostics.corruptedItems > 0 ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              Diagnostics Results
            </h4>
            <div className="space-y-2 text-sm">
              <div>Total Items: <span className="font-mono">{diagnostics.totalItems}</span></div>
              <div>Corrupted Items: <span className="font-mono">{diagnostics.corruptedItems}</span></div>
              {diagnostics.invalidCategories.length > 0 && (
                <div>
                  Invalid Categories:
                  <div className="mt-1 flex flex-wrap gap-1">
                    {diagnostics.invalidCategories.map(cat => (
                      <span key={cat} className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs">
                        {cat || 'null'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Valid Categories Reference */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-2">Valid Categories</h4>
          <div className="flex flex-wrap gap-2">
            {Object.keys(ITEM_CATEGORIES).map(category => {
              const config = getCategoryConfig(category);
              return (
                <span
                  key={category}
                  className={`px-2 py-1 rounded text-xs ${config.bgColor} ${config.color} ${config.borderColor} border`}
                >
                  {config.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={runDiagnostics} variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Run Diagnostics
          </Button>

          <Button onClick={testCategoryConfigs} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Test Category Configs
          </Button>

          <Button
            onClick={clearCorruptedData}
            variant="destructive"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Clear Corrupted Data
          </Button>
        </div>

        {/* Warning */}
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <strong>Warning:</strong> Clearing corrupted data will remove all calendar items
              and reinitialize with sample data. This action cannot be undone.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
