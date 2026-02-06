import React from "react";
import { CalendarDebug } from "@/components/debug/CalendarDebug";

export default function Debug() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Debug Tools
          </h1>
          <p className="text-muted-foreground">
            Utilities for diagnosing and fixing application issues
          </p>
        </div>

        <div className="flex justify-center">
          <CalendarDebug />
        </div>
      </div>
    </div>
  );
}
