import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Timer from "./pages/Timer";
import Tasks from "./pages/Tasks";
import Timeline from "./pages/Timeline";
import Settings from "./pages/Settings";
import Calendar from "./pages/Calendar";

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
		path="/timer"
		element={
			<AppLayout>
			<Timer />
			</AppLayout>
		}
		/>
		<Route
		path="/Tasks"
		element={
			<AppLayout>
			<Tasks />
			</AppLayout>
		}
		/>
		<Route
		path="/timeline"
		element={
			<AppLayout>
			<Timeline />
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
		</Routes>
		</BrowserRouter>
		</TooltipProvider>
		</ThemeProvider>
	);
}
