import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Timer from "./pages/Timer";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";
import Calendar from "./pages/Calendar";
import Debug from "./pages/Debug";

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            <Route
              path="/chat"
              element={
                <AppLayout>
                  <Chat />
                </AppLayout>
              }
            />
            <Route
              path="/calendar"
              element={
                <AppLayout>
                  <Calendar />
                </AppLayout>
              }
            />
            <Route
              path="/focus"
              element={
                <AppLayout>
                  <Timer />
                </AppLayout>
              }
            />
            <Route
              path="/goals"
              element={
                <AppLayout>
                  <Goals />
                </AppLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <AppLayout>
                  <Settings />
                </AppLayout>
              }
            />
            <Route
              path="/debug"
              element={
                <AppLayout>
                  <Debug />
                </AppLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
}
