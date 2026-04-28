import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import DashboardLayout from "./components/DashboardLayout.tsx";
import DashboardHome from "./pages/DashboardHome.tsx";
import StudentsPage from "./pages/StudentsPage.tsx";
import MarksPage from "./pages/MarksPage.tsx";
import StaffPage from "./pages/StaffPage.tsx";
import ClassesPage from "./pages/ClassesPage.tsx";
import TradesPage from "./pages/TradesPage.tsx";
import SubjectsPage from "./pages/SubjectsPage.tsx";
import ReportsPage from "./pages/ReportsPage.tsx";
import SchoolSettingsPage from "./pages/SchoolSettingsPage.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="marks" element={<MarksPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="trades" element={<TradesPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="settings" element={<SchoolSettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
